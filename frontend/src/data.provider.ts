import {
  DataProvider,
  CreateParams,
  CreateResult,
  DeleteManyParams,
  DeleteManyResult,
  DeleteParams,
  DeleteResult,
  GetListParams,
  GetListResult,
  GetManyParams,
  GetManyReferenceParams,
  GetManyReferenceResult,
  GetManyResult,
  GetOneParams,
  GetOneResult,
  RaRecord,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
} from 'react-admin';
import * as ethers from 'ethers';
import { NFTStorage } from 'nft.storage';

import authProvider from '@/auth.provider';

import { getRegistryContract } from './contract.utils';

type WebDNSRecords = Array<{ type: string; value: string }>;

interface DNSRecord extends RaRecord {
  domain: string;
  web3Address: string;
  dnsRecords: WebDNSRecords;
}

interface TokenMetadata {
  name: string;
  description: string;
  dnsRecords: WebDNSRecords;
}

export enum Resources {
  DNSRecords = 'dns-records',
  TopLevelDomains = 'domains',
}

export class AppDataProvider implements DataProvider {
  public async getList<RecordType extends RaRecord>(
    resource: string,
    _params: GetListParams
  ): Promise<GetListResult<RecordType>> {
    this.ensureResourceSupported(resource, Resources.DNSRecords, Resources.TopLevelDomains);

    if (resource == Resources.DNSRecords) {
      const domains = await this.getAllUserDomains();
      return {
        data: domains as unknown as RecordType[],
        total: domains.length,
      };
    } else {
      const topLevelDomains = await this.getSupportedTLDs();
      return {
        data: topLevelDomains.map(tld => ({
          id: tld,
          name: tld,
        })) as unknown as RecordType[],
        total: topLevelDomains.length,
      };
    }
  }

  public async getOne<RecordType extends RaRecord>(
    resource: string,
    _params: GetOneParams
  ): Promise<GetOneResult<RecordType>> {
    this.ensureResourceSupported(resource, Resources.DNSRecords);
    throw new Error('Method not implemented.');
  }

  public getMany<RecordType extends RaRecord>(
    resource: string,
    _params: GetManyParams
  ): Promise<GetManyResult<RecordType>> {
    this.ensureResourceSupported(resource, Resources.DNSRecords);
    throw new Error('Method not implemented.');
  }

  public getManyReference<RecordType extends RaRecord>(
    resource: string,
    _params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<RecordType>> {
    this.ensureResourceSupported(resource, Resources.DNSRecords);
    throw new Error('Method not implemented.');
  }

  public update<RecordType extends RaRecord>(
    resource: string,
    _params: UpdateParams
  ): Promise<UpdateResult<RecordType>> {
    this.ensureResourceSupported(resource, Resources.DNSRecords);
    throw new Error('Method not implemented.');
  }

  public updateMany<RecordType extends RaRecord>(
    resource: string,
    _params: UpdateManyParams
  ): Promise<UpdateManyResult<RecordType>> {
    this.ensureResourceSupported(resource, Resources.DNSRecords);
    throw new Error('Method not implemented.');
  }

  public async create<RecordType extends RaRecord>(
    resource: string,
    _params: CreateParams
  ): Promise<CreateResult<RecordType>> {
    this.ensureResourceSupported(resource, Resources.DNSRecords);
    const userAddress = await authProvider.getAddress();

    const { sld, tld, dnsRecords, web3Address } = _params.data as {
      sld: string;
      tld: string;
      dnsRecords: WebDNSRecords;
      web3Address: string | undefined;
    };
    const domain = `${sld}.${tld}`;
    const effectiveWeb3Address = web3Address || userAddress;

    const nftStorage = new NFTStorage({ token: import.meta.env.VITE_NFT_STORAGE_API_KEY });
    const nftMetadata: TokenMetadata = {
      name: domain,
      description: `NFT for ${domain}`,
      dnsRecords: dnsRecords,
    };
    const metadataId = await nftStorage.storeBlob(new Blob([JSON.stringify(nftMetadata)]));

    const dnsRegistryContract = await getRegistryContract(true);
    const mintTX = await dnsRegistryContract.mintSLD(sld, tld, effectiveWeb3Address, metadataId);
    await mintTX.wait();

    return {
      data: {
        id: ethers.namehash(domain),
        domain: domain,
        web3Address: effectiveWeb3Address,
        dnsRecords: dnsRecords,
      } as unknown as RecordType,
    };
  }

  public async delete<RecordType extends RaRecord>(
    resource: string,
    params: DeleteParams<RecordType>
  ): Promise<DeleteResult<RecordType>> {
    this.ensureResourceSupported(resource, Resources.DNSRecords);
    await this.burnDomain(params.id as string);
    return {
      data: { id: params.id } as unknown as RecordType,
    };
  }

  public async deleteMany<RecordType extends RaRecord>(
    resource: string,
    params: DeleteManyParams<RaRecord>
  ): Promise<DeleteManyResult<RecordType>> {
    this.ensureResourceSupported(resource, Resources.DNSRecords);
    for (const id of params.ids) {
      await this.burnDomain(id as string);
    }
    return {
      data: params.ids,
    };
  }

  private async getSupportedTLDs(): Promise<string[]> {
    const supportedTLDs = await this.executeGQLQuery<{ tlds: Array<{ id: string }> }>(`
      {
        tlds {
          id
        }
      }
    `);
    return supportedTLDs.tlds.map(tld => tld.id);
  }

  private async burnDomain(tokenId: string): Promise<void> {
    const dnsRegistryContract = await getRegistryContract(true);
    const burnTX = await dnsRegistryContract.burn(tokenId);
    await burnTX.wait();
  }

  private async getAllUserDomains(): Promise<DNSRecord[]> {
    const userAddress = await authProvider.getAddress();

    const ownedDomainsResponse = await this.executeGQLQuery<{
      dnsrecords: Array<{ id: string; metadataURI: string; web3Address: string }>;
    }>(
      `query($ownerId: String) {
        dnsrecords(where: { ownerId: $ownerId }) {
          id
          metadataURI
          web3Address
        }
      }
    `,
      {
        ownerId: userAddress,
      }
    );
    const ownedDomains = ownedDomainsResponse.dnsrecords;

    const recordsMetadata = await Promise.all(
      ownedDomains.map(async ownedDomain => {
        const tokenMetadataResponse = await fetch(ownedDomain.metadataURI);
        const tokenMetadata: TokenMetadata = await tokenMetadataResponse.json();
        return tokenMetadata;
      })
    );

    return ownedDomains.map((ownedDomain, i) => {
      const metadata = recordsMetadata[i];
      return {
        id: ownedDomain.id,
        domain: metadata.name,
        web3Address: ownedDomain.web3Address,
        dnsRecords: metadata.dnsRecords,
      };
    });
  }

  private ensureResourceSupported(
    resource: string,
    ...supportedResources: Resources[]
  ): asserts resource is Resources {
    if (!supportedResources.includes(resource as Resources)) {
      throw new Error('Invalid resource type');
    }
  }

  private async executeGQLQuery<TResult>(
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<TResult> {
    const response = await fetch(import.meta.env.VITE_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    }).then(res => res.json());

    return response.data;
  }
}

const dataProvider = new AppDataProvider();
export default dataProvider;
