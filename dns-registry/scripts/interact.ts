import { DNSRegistry } from '../typechain-types';
import { ethers } from 'hardhat';
import dnsRegistryContractInterface from '../artifacts/contracts/DNSRegistry.sol/DNSRegistry.json';
import { getRequiredEnvVar } from '../config.utils';
import { getContractProxyAddress } from './deploy.utils';
import { ContractReceipt, ContractTransaction } from 'ethers';

const alchemyProvider = new ethers.providers.JsonRpcProvider(getRequiredEnvVar('API_URL'));
const user = new ethers.Wallet(getRequiredEnvVar('DEV_PRIVATE_KEY'), alchemyProvider);

async function main() {
  const dnsRegistryContract = new ethers.Contract(
    await getContractProxyAddress('DNSRegistry'),
    dnsRegistryContractInterface.abi,
    alchemyProvider,
  ) as DNSRegistry;

  await dnsRegistryContract.connect(user).addTLD('d3');
  await dnsRegistryContract.connect(user).addTLD('crypto');

  // Test code below:
  // await waitForCall(
  //   dnsRegistryContract.connect(user).mintSLD('test', 'd3', user.address, 'test_uri'),
  // );
  // const domainNamehash = ethers.utils.namehash('test.d3');

  // console.log('URI address:', await dnsRegistryContract.tokenURI(domainNamehash));
  // console.log('Record address:', await dnsRegistryContract.records(domainNamehash));

  // const totalOwnerDomains = await dnsRegistryContract.balanceOf(user.address);
  // console.log('Owner domains number:', totalOwnerDomains.toNumber());
  // for (let i = 0; i < totalOwnerDomains.toNumber(); i++) {
  //   console.log('Domain namehash:', await dnsRegistryContract.tokenOfOwnerByIndex(user.address, i));
  // }
}

async function waitForCall(callPromise: Promise<ContractTransaction>): Promise<ContractReceipt> {
  const tx = await callPromise;
  const receipt = await tx.wait();
  return receipt;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
