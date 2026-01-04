// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameItem
 * @dev ERC721 NFT contract for video game items
 */
contract GameItem is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 1000000; // Maximum number of NFTs that can be minted

    constructor(address initialOwner) ERC721("GameItem", "GAME") Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    /**
     * @dev Mint a new NFT with metadata
     * @param to Address to mint the NFT to
     * @param metadata JSON string containing the item's traits and properties
     */
    function mint(address to, string memory metadata) public onlyOwner returns (uint256) {
        require(_nextTokenId <= MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadata);
        
        return tokenId;
    }

    /**
     * @dev Mint a new NFT with tokenURI (for IPFS/metadata URLs)
     * @param to Address to mint the NFT to
     * @param tokenURI URI pointing to the token's metadata (e.g., IPFS link)
     */
    function safeMint(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        require(_nextTokenId <= MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        return tokenId;
    }

    /**
     * @dev Mint with metadata (alias for mint function for compatibility)
     */
    function mintWithMetadata(address to, string memory metadata) public onlyOwner returns (uint256) {
        return mint(to, metadata);
    }

    /**
     * @dev Get the total number of tokens minted
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

