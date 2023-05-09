// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract DNSRegistry is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721BurnableUpgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable
{
    event TLDAdded(string tld);
    event TLDRemoved(string tld);

    mapping(string => bool) public supportedTLDs;
    mapping(uint256 => address) public records;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC721_init("DNSRegistry", "DNS");
        __ERC721URIStorage_init();
        __ERC721Burnable_init();
        __Ownable_init();
        __ERC721Enumerable_init();
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://nftstorage.link/ipfs/";
    }

    function addTLD(string calldata tld) public onlyOwner {
        require(bytes(tld).length != 0, "Registry: TLD_EMPTY");
        supportedTLDs[tld] = true;
        emit TLDAdded(tld);
    }

    function removeTLD(string calldata tld) public onlyOwner {
        require(bytes(tld).length != 0, "Registry: TLD_EMPTY");
        delete supportedTLDs[tld];
        emit TLDRemoved(tld);
    }

    /**
     * Mints a new Second-Level Domain (SLD) NFT.
     * NOT IMPLEMENTED: Validation of SLD format
     */
    function mintSLD(
        string calldata sld,
        string calldata tld,
        address addressRecord,
        string calldata meatadaURI
    ) public {
        require(supportedTLDs[tld], "Registry: TLD_NOT_SUPPORTED");
        require(bytes(sld).length != 0, "Registry: SLD_EMPTY");

        uint256 tokenId = _namehash(tld, sld);

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, meatadaURI);

        // Store web3 addresss record on-chain for sebsequent lookup
        records[tokenId] = addressRecord;
    }

    /**
     * Update the adress record and metadata for an existing SLD NFT.
     * Can be called only by SLD owner.
     */
    function updateSLD(uint256 tokenId, address addressRecord, string calldata meatadaURI) public {
        require(ownerOf(tokenId) == msg.sender, "Registry: NOT_AN_OWNER");

        _setTokenURI(tokenId, meatadaURI);
        records[tokenId] = addressRecord;
        // TBD: emit update event
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
        delete records[tokenId];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function _namehash(string memory tld, string memory sld) internal pure returns (uint256) {
        require(bytes(sld).length != 0, "Registry: SLD_EMPTY");

        uint256 tldNamehash = _namehash(0, tld);
        return _namehash(tldNamehash, sld);
    }

    function _namehash(
        uint256 parentNamehash,
        string memory label
    ) internal pure returns (uint256) {
        return
            uint256(
                keccak256(abi.encodePacked(parentNamehash, keccak256(abi.encodePacked(label))))
            );
    }
}
