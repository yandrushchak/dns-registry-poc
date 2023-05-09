import * as fs from 'fs';

export type ProxyAddresses = {
  [contract: string]: string;
};

export async function getProxyAddresses(): Promise<ProxyAddresses> {
  try {
    return JSON.parse(
      await fs.promises.readFile('.openzeppelin/proxies.json', { encoding: 'utf8' }),
    );
  } catch {
    return {};
  }
}

export async function getContractProxyAddress(contract: string): Promise<string> {
  const proxyAddresses = await getProxyAddresses();
  if (!proxyAddresses[contract]) {
    throw new Error(`No proxy address found for contract ${contract}`);
  }
  return proxyAddresses[contract];
}

export async function saveProxyAddresses(addresses: ProxyAddresses): Promise<void> {
  await fs.promises.writeFile(
    '.openzeppelin/proxies.json',
    JSON.stringify(addresses, undefined, 2),
  );
}
