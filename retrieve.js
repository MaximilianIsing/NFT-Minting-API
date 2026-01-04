import { ethers } from 'ethers';
import fs from 'fs';

/**
 * Retrieves all game items (NFTs) owned by a wallet address
 * 
 * @param {string} walletAddress - The wallet address to query
 * @param {Object} config - Optional configuration:
 *   @param {string} contractAddress - Contract address (defaults to deployment.json)
 *   @param {string} rpcUrl - RPC endpoint URL (default: https://polygon-rpc.com/)
 * @returns {Promise<Array>} Array of game items with tokenId, metadata, and traits
 * 
 * @example
 * const items = await retrieve("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
 * console.log(`Found ${items.length} items`);
 */
async function retrieve(walletAddress, config = {}) {
  try {
    // Validate inputs
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
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

    // Contract ABI - includes Enumerable extension methods
    const contractABI = [
      "function balanceOf(address owner) public view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
      "function tokenURI(uint256 tokenId) public view returns (string memory)",
      "function ownerOf(uint256 tokenId) public view returns (address)",
      "function totalSupply() public view returns (uint256)",
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    console.log(`Retrieving items for ${walletAddress}...`);
    console.log(`Contract: ${contractAddress}`);

    // Method 1: Try using tokenOfOwnerByIndex (if Enumerable extension is supported)
    let tokenIds = [];
    
    try {
      const balance = await contract.balanceOf(walletAddress);
      const balanceNumber = Number(balance);
      
      console.log(`Found ${balanceNumber} item(s)`);

      if (balanceNumber === 0) {
        return [];
      }

      // Get all token IDs owned by this address
      for (let i = 0; i < balanceNumber; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
          tokenIds.push(tokenId.toString());
        } catch (error) {
          // If tokenOfOwnerByIndex fails, fall back to scanning method
          console.log('⚠️  Enumerable extension not available, scanning all tokens...');
          tokenIds = [];
          break;
        }
      }
    } catch (error) {
      console.log('⚠️  Error getting balance, trying alternative method...');
    }

    // Method 2: If Enumerable not available, scan all tokens
    if (tokenIds.length === 0) {
      try {
        const totalSupply = await contract.totalSupply();
        const total = Number(totalSupply);
        
        console.log(`Scanning ${total} total tokens...`);

        // Check each token to see if owned by the address
        for (let tokenId = 1; tokenId <= total; tokenId++) {
          try {
            const owner = await contract.ownerOf(tokenId);
            if (owner.toLowerCase() === walletAddress.toLowerCase()) {
              tokenIds.push(tokenId.toString());
            }
          } catch (error) {
            // Token doesn't exist or other error, skip
            continue;
          }
        }
        
        console.log(`Found ${tokenIds.length} item(s) owned by address`);
      } catch (error) {
        throw new Error(`Failed to retrieve tokens: ${error.message}`);
      }
    }

    // Retrieve metadata for each token
    const items = [];
    
    for (const tokenId of tokenIds) {
      try {
        const tokenURI = await contract.tokenURI(Number(tokenId));
        
        // Parse metadata (could be JSON string or data URI)
        let metadata;
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

        items.push({
          tokenId: tokenId,
          metadata: metadata,
          traits: metadata.traits || {},
          name: metadata.name || `Item #${tokenId}`,
          description: metadata.description || '',
          image: metadata.image || ''
        });
      } catch (error) {
        console.warn(`⚠️  Could not retrieve metadata for token ${tokenId}: ${error.message}`);
        // Still include the token with basic info
        items.push({
          tokenId: tokenId,
          metadata: null,
          error: error.message
        });
      }
    }

    console.log(`✅ Retrieved ${items.length} item(s)`);
    return items;

  } catch (error) {
    console.error('Retrieval error:', error.message);
    throw error;
  }
}

export default retrieve;

