# Hybrid web2/web3 DNS resolution

## Overview

This is a simple implementation of how hybrid web2/web3 resolution could work. It could cover 2 use cases:
- Resolve web3 address when used from smart contracts/dapps
- Resolve web2 DNS address when used from browsers or other apps (not fully implemented in scope of test task, authoritative name server is missing).

Overall architecture of implemented solution is presented below:
![image](https://github.com/yandrushchak/dns-registry-poc/assets/51112334/62bc5df7-de2f-414f-ac9e-901a6e30d008)

Involved components:
- DNS Registry Contract - smart contact which acts as a source of truth for DNS data
    - DNS Registry Proxy Contract - implements [Unstructured Proxy](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies) pattern for contract upgradeability
- IPFS - stores off-chain metadata, including DNS records, to reduce gas cost on contracts (since records could be quite big, t.g. TXT records).
- Indexer - indexes and information from a smart contract for querying by other components
- DNS Registry Frontend - web app to CRUD DNS records. Writes data to smart contract and IPFS, reads data from Indexer and IPFS
- Authoritative DNS resolver (not implemented) - resolves DNS quires using IPFS/Indexer as underlying data sources

Source code structure:
- `dns-registry` - smart contract source code, written in Solidity (with [Hardhat](https://hardhat.org/)). [Uses OpenZeppelin](https://docs.openzeppelin.com/contracts/4.x/) as base library (it provides NFT implementation and upgradeability capabilities)
- `indexer` - indexer for registry smart contract. Implemented using [The Graph](https://thegraph.com/)
- `frontend` - DNS Registry Frontend, implemented using [react-admin](https://marmelab.com/react-admin/) framework (it's ideal for prototyping or internal tools)

## Testing

For testing purposes, components are available by following addresses:
- Smart Contract (Proxy) - 0xB3afeda8f1B598f6E839D94Ba6532A283E8E1652 - deployed to Sepolia testnet.
- Web App - [https://yandrushchak.github.io/dns-registry-poc](https://yandrushchak.github.io/dns-registry-poc). In order to access it, login with MetaMask with Sepolia testnet selected - [guide how to enable testnets](https://support.metamask.io/hc/en-us/articles/13946422437147-How-to-view-testnets-in-MetaMask). Some testnet funds are also required to mint new domains, they could be obtained from one of the Sepolia faucets, e.g https://sepoliafaucet.com/. Note: if application reports network error upon load, switch to Sepolia testnet in MetaMask.

Domains could created using Web App UI. In order to view them as NFTs in MetaMask, you could import them manually - https://support.metamask.io/hc/en-us/articles/360058238591-NFT-tokens-in-your-MetaMask-wallet
