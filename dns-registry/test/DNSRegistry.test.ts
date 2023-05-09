import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { DNSRegistry } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('DNSRegistry', function () {
  let registryContract: DNSRegistry;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  const TOKEN_URI = 'token_uri';
  const SUPPORTED_TLD = 'd3';
  const TEST_SLD = 'test';
  const SLD_NAMEHASH = ethers.utils.namehash(`${TEST_SLD}.${SUPPORTED_TLD}`);
  const RECORD_ADDRESS = '0xa323B933913953225BB1eAbac75CAF0c73bBaff5';

  async function deployDNSRegistryFixture() {
    const DNSRegistryContractFactory = await ethers.getContractFactory('DNSRegistry');
    const deployedDNSRegistryContract = (await upgrades.deployProxy(
      DNSRegistryContractFactory,
    )) as DNSRegistry;

    return deployedDNSRegistryContract;
  }

  before(async () => {
    [owner, user] = await ethers.getSigners();
  });

  beforeEach(async () => {
    registryContract = await loadFixture(deployDNSRegistryFixture);
  });

  describe('Deployment', () => {
    it('Should set the right name and symbol', async () => {
      expect(await registryContract.name()).to.equal('DNSRegistry');
      expect(await registryContract.symbol()).to.equal('DNS');
    });
  });

  describe('TLD management', () => {
    it('Should add TLD', async () => {
      await registryContract.connect(owner).addTLD(SUPPORTED_TLD);
      expect(await registryContract.supportedTLDs(SUPPORTED_TLD)).to.equal(true);
    });

    it('Should fail if called by non-owner', async () => {
      await expectCallFailure(
        registryContract.connect(user).addTLD(SUPPORTED_TLD),
        'Ownable: caller is not the owner',
      );
    });

    it('Should fail if TLD is empty', async () => {
      await expectCallFailure(registryContract.connect(owner).addTLD(''), 'Registry: TLD_EMPTY');
    });
  });

  describe('Mint SLD', () => {
    beforeEach(async () => {
      await setupTLDs();
    });

    it('Should mint SLD with correct URI and record', async () => {
      const mintTX = await registryContract
        .connect(user)
        .mintSLD(TEST_SLD, SUPPORTED_TLD, RECORD_ADDRESS, TOKEN_URI);

      const expectedTokenId = SLD_NAMEHASH;

      await expect(mintTX)
        .to.emit(registryContract, 'Transfer')
        .withArgs(ethers.constants.AddressZero, user.address, expectedTokenId);

      expect(await registryContract.tokenURI(expectedTokenId)).to.equal(
        `https://nftstorage.link/ipfs/${TOKEN_URI}`,
      );
      expect(await registryContract.ownerOf(expectedTokenId)).to.equal(user.address);
      expect(await registryContract.records(expectedTokenId)).to.equal(RECORD_ADDRESS);
    });

    it('Should fail minting when TLD is invalid', async () => {
      await expectCallFailure(
        registryContract.connect(user).mintSLD(TEST_SLD, 'unsupported', RECORD_ADDRESS, TOKEN_URI),
        'Registry: TLD_NOT_SUPPORTED',
      );
    });

    it('Should fail minting when SLD is empty', async () => {
      await expectCallFailure(
        registryContract.connect(user).mintSLD('', SUPPORTED_TLD, RECORD_ADDRESS, TOKEN_URI),
        'Registry: SLD_EMPTY',
      );
    });

    it('Should fail minting when SLD is already taken', async () => {
      await registryContract
        .connect(user)
        .mintSLD(TEST_SLD, SUPPORTED_TLD, RECORD_ADDRESS, TOKEN_URI);

      await expectCallFailure(
        registryContract.connect(user).mintSLD(TEST_SLD, SUPPORTED_TLD, RECORD_ADDRESS, TOKEN_URI),
        'ERC721: token already minted',
      );
    });
  });

  describe('Update SLD', () => {
    beforeEach(async () => {
      await setupTLDs();
    });

    it('Should update SLD with new record and metadata', async () => {
      await registryContract
        .connect(user)
        .mintSLD(TEST_SLD, SUPPORTED_TLD, RECORD_ADDRESS, TOKEN_URI);

      const UPDATED_METADATA_URI = 'uri_updated';
      const UPDATED_RECORD = '0x9Ba35A04Cf6BdAB342BF27Fc74Ff125b3481C737';

      await registryContract
        .connect(user)
        .updateSLD(SLD_NAMEHASH, UPDATED_RECORD, UPDATED_METADATA_URI);

      expect(await registryContract.tokenURI(SLD_NAMEHASH)).to.equal(
        `https://nftstorage.link/ipfs/${UPDATED_METADATA_URI}`,
      );
      expect(await registryContract.records(SLD_NAMEHASH)).to.equal(UPDATED_RECORD);
    });

    it('Should fail update when SLD does not exist', async () => {
      await expectCallFailure(
        registryContract.connect(user).updateSLD(SLD_NAMEHASH, RECORD_ADDRESS, TOKEN_URI),
        'ERC721: invalid token ID',
      );
    });

    it('Should fail update when called by not an owner', async () => {
      await registryContract
        .connect(user)
        .mintSLD(TEST_SLD, SUPPORTED_TLD, RECORD_ADDRESS, TOKEN_URI);

      await expectCallFailure(
        registryContract.connect(owner).updateSLD(SLD_NAMEHASH, RECORD_ADDRESS, TOKEN_URI),
        'Registry: NOT_AN_OWNER',
      );
    });
  });

  describe('Burn', function () {
    beforeEach(async () => {
      await setupTLDs();
      await registryContract
        .connect(user)
        .mintSLD(TEST_SLD, SUPPORTED_TLD, RECORD_ADDRESS, TOKEN_URI);
    });

    it('Should burn SLD', async function () {
      await expect(registryContract.connect(user).burn(SLD_NAMEHASH))
        .to.emit(registryContract, 'Transfer')
        .withArgs(user.address, ethers.constants.AddressZero, SLD_NAMEHASH);

      await expectCallFailure(registryContract.tokenURI(SLD_NAMEHASH), 'ERC721: invalid token ID');
      expect(await registryContract.records(SLD_NAMEHASH)).to.equal(ethers.constants.AddressZero);
    });

    it('Should fail to burn SLD when called by not a owner', async function () {
      await expectCallFailure(
        registryContract.connect(owner).burn(SLD_NAMEHASH),
        'ERC721: caller is not token owner or approved',
      );
    });
  });

  async function expectCallFailure(callPromise: Promise<unknown>, expectedMessage: string) {
    await expect(callPromise).to.be.revertedWith(expectedMessage);
  }

  async function setupTLDs() {
    await registryContract.connect(owner).addTLD(SUPPORTED_TLD);
  }
});
