import {
  Create,
  SimpleForm,
  ArrayInput,
  SimpleFormIterator,
  TextInput,
  required,
  regex,
  useGetList,
  SelectInput,
  ValidationErrorMessage,
} from 'react-admin';
import * as ethers from 'ethers';

import { Resources } from '@/data.provider';
import { getRegistryContract } from '@/contract.utils';

export const DNSRecordsCreate = () => {
  const { data, isLoading } = useGetList(Resources.TopLevelDomains);

  const validateDomainAvailability = async (
    sld: string,
    form: { tld: string }
  ): Promise<ValidationErrorMessage | undefined> => {
    if (!sld || !form.tld) {
      return;
    }

    const dnsRegistryContract = await getRegistryContract();

    const domain = `${sld}.${form.tld}`;
    const tokenId = ethers.namehash(domain);

    try {
      const tokenOwner = await dnsRegistryContract.ownerOf(tokenId);
      if (tokenOwner !== ethers.ZeroAddress) {
        return 'Domain already taken';
      }
    } catch {
      // If there's an error, token doesn't exist, so domain is available
      return;
    }
  };

  return (
    <Create>
      <SimpleForm>
        <SelectInput
          source="tld"
          choices={data ?? []}
          isLoading={isLoading}
          validate={[required()]}
          label="Top-level Domain (TLD)"
        />
        <TextInput
          source="sld"
          validate={[required(), validateDomainAvailability]}
          label="Second-level Domain (SLD)"
        />
        <TextInput
          source="web3Address"
          validate={[regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address')]}
          fullWidth
        />
        <ArrayInput source="dnsRecords">
          <SimpleFormIterator inline>
            <SelectInput
              source="type"
              defaultValue="A"
              choices={[
                { id: 'A', name: 'A' },
                { id: 'CNAME', name: 'CNAME' },
              ]}
              validate={[required()]}
            />
            <TextInput source="value" helperText={false} validate={[required()]} />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Create>
  );
};
