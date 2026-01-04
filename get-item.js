import { ethers } from 'ethers';
import fs from 'fs';

/**
 * Retrieves a specific game item (NFT) by token ID
 * 
 * @param {number|string} tokenId - The token ID to look up
 * @param {Object} config - Optional configuration:
 *   @param {string} contractAddress - Contract address (defaults to deployment.json)
 *   @param {string} rpcUrl - RPC endpoint URL (default: https://polygon-rpc.com/)
 * @returns {Promise<Object>} Item object with tokenId, metadata, traits, owner, etc.
 * 
 * @example
 * const item = await getItem(1);
 * console.log(`Item: ${item.name}`);
 * console.log(`Owner: ${item.owner}`);
 */
async function getItem(tokenId, config = {}) {
  try {
    // Validate inputs
    if (tokenId === null || tokenId === undefined) {
      throw new Error('Token ID is required');
    }

    const tokenIdNumber = Number(tokenId);
    if (isNaN(tokenIdNumber) || tokenIdNumber < 0) {
      throw new Error('Token ID must be a valid number');
    }

    // Load configuration
    let contractAddress = config.contractAddress;
    const rpcUrl = config.rpcUrl || 'https://polygon-rpc.com/';

    // Load contract address from deployment.json if not provided
    if (!contractAddress) {
      try {
        const deploymentInfo = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
        contractAddress = deploymentInfo.contractAddress;
      } catch (error) {
        throw new Error('Contract address not provided and deployment.json not found');
      }
    }

    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      throw new Error('Invalid contract address');
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Contract ABI
    const contractABI = [
      "function tokenURI(uint256 tokenId) public view returns (string memory)",
      "function ownerOf(uint256 tokenId) public view returns (address)",
      "function totalSupply() public view returns (uint256)"
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    console.log(`Looking up token ID ${tokenId} from contract ${contractAddress}...`);

    // Get owner of the token
    let owner;
    try {
      owner = await contract.ownerOf(tokenIdNumber);
    } catch (error) {
      throw new Error(`Token ID ${tokenId} does not exist or has been burned`);
    }

    // Get token URI (metadata)
    let metadata;
    let traits = {};
    let name = '';
    let description = '';
    let image = '';

    try {
      const tokenURI = await contract.tokenURI(tokenIdNumber);
      
      // Parse metadata (could be JSON string or data URI)
      if (tokenURI.startsWith('data:application/json')) {
        // Base64 encoded JSON
        const base64Data = tokenURI.split(',')[1];
        metadata = JSON.parse(Buffer.from(base64Data, 'base64').toString());
      } else if (tokenURI.startsWith('{')) {
        // Direct JSON string
        metadata = JSON.parse(tokenURI);
      } else if (tokenURI.startsWith('http')) {
        // URL to metadata - would need to fetch, but for now return URL
        metadata = { uri: tokenURI };
      } else {
        // Fallback: treat as raw data
        metadata = { raw: tokenURI };
      }

      // Extract common fields
      traits = metadata.traits || {};
      name = metadata.name || `Item #${tokenId}`;
      description = metadata.description || '';
      image = metadata.image || '';

    } catch (error) {
      console.warn(`⚠️  Could not retrieve metadata for token ${tokenId}: ${error.message}`);
      metadata = null;
    }

    return {
      tokenId: tokenIdNumber.toString(),
      owner: owner,
      metadata: metadata,
      traits: traits,
      name: name,
      description: description,
      image: image,
      contractAddress: contractAddress
    };

  } catch (error) {
    console.error('Get item error:', error.message);
    throw error;
  }
}

export default getItem;

