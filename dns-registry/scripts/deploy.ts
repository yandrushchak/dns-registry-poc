import { ethers, upgrades } from 'hardhat';
import { getProxyAddresses, saveProxyAddresses } from './deploy.utils';

async function main() {
  await deployContract('DNSRegistry');
}

async function deployContract(name: string) {
  const Contract = await ethers.getContractFactory(name);

  const proxyAddresses = await getProxyAddresses();
  const proxyAddress = proxyAddresses[name];
  if (proxyAddress) {
    console.log(`Upgrading contract ${name}...`);

    const instance = await upgrades.upgradeProxy(proxyAddress, Contract);
    await instance.deployed();

    console.log(`${name} contract upgraded for proxy address:`, proxyAddress);
  } else {
    console.log(`Deploying contract ${name}...`);

    const instance = await upgrades.deployProxy(Contract);
    await instance.deployed();

    console.log(`${name} contract deployed to address:`, instance.address);

    proxyAddresses[name] = instance.address;
    await saveProxyAddresses(proxyAddresses);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
