import { store } from '@graphprotocol/graph-ts';

import {
  DNSRegistry,
  Transfer,
  DomainAdded,
  TLDAdded,
  TLDRemoved,
} from '../generated/dns-registry/DNSRegistry';
import { DNSRecord, TLD } from '../generated/schema';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export function handleTransfer(event: Transfer): void {
  if (event.params.from.toHexString() != ADDRESS_ZERO) {
    handleTokenTransfer(event);
  } else if (event.params.to.toHexString() == ADDRESS_ZERO) {
    store.remove('DNSRecord', event.params.tokenId.toString());
  }
}

export function handleTLDAdded(event: TLDAdded): void {
  const tld = event.params.tld.toString();
  let tldRecord = TLD.load(tld);
  if (!tldRecord) tldRecord = new TLD(tld);

  tldRecord.save();
}

export function handleTLDRemoved(event: TLDRemoved): void {
  const tld = event.params.tld.toString();
  store.remove('TLD', tld);
}

export function handleTokenMint(event: DomainAdded): void {
  const erc721 = DNSRegistry.bind(event.address);

  const ownerId = event.params.owner.toHexString();
  const tokenId = event.params.tokenId.toString();

  let dnsRecord = DNSRecord.load(tokenId);
  if (!dnsRecord) dnsRecord = new DNSRecord(tokenId);

  dnsRecord.ownerId = ownerId;
  dnsRecord.web3Address = event.params.addressRecord.toHexString();
  dnsRecord.domain = event.params.sld.toString() + '.' + event.params.tld.toString();

  const metadataURI = erc721.try_tokenURI(event.params.tokenId);
  if (!metadataURI.reverted) {
    dnsRecord.metadataURI = metadataURI.value.toString();
  }

  dnsRecord.save();
}

function handleTokenTransfer(event: Transfer): void {
  const dnsRecord = DNSRecord.load(event.params.tokenId.toString());
  if (!dnsRecord) return;

  const ownerId = event.params.to.toHexString();
  dnsRecord.ownerId = ownerId;

  dnsRecord.save();
}
