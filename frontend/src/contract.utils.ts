import * as ethers from 'ethers';

import dnsRegistryContractInterface from 'abis/DNSRegistry.json';

export async function getRegistryContract(withSigner = false): Promise<ethers.Contract> {
  const provider = new ethers.BrowserProvider(window.ethereum, import.meta.env.VITE_NETWORK);

  const dnsRegistryContract = new ethers.Contract(
    import.meta.env.VITE_REGISTRY_CONTRACT,
    dnsRegistryContractInterface.abi,
    withSigner ? await provider.getSigner() : provider
  );
  return dnsRegistryContract;
}
