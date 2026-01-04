import { ethers } from 'ethers';
import fs from 'fs';

/**
 * Mints an NFT item with image and traits to a destination address
 * 
 * @param {string} destinationAddress - The address to mint the NFT to
 * @param {string} imageUrl - URL to the image (must be 512x512 pixels)
 * @param {Object} traits - JSON object containing the item's traits/metadata
 * @param {Object} config - Optional configuration:
 *   @param {string} contractAddress - Contract address (defaults to deployment.json)
 *   @param {string} privateKey - Private key (defaults to polygon_private_key.txt)
 *   @param {string} rpcUrl - RPC endpoint URL (default: https://polygon-rpc.com/)
 * @returns {Promise<Object>} Transaction receipt and token ID
 * 
 * @example
 * const result = await mint(
 *   "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *   "https://example.com/item.png",
 *   {
 *     attack: 100,
 *     defense: 50,
 *     element: "fire",
 *     rarity: "legendary"
 *   }
 * );
 */
async function mint(destinationAddress, imageUrl, traits, config = {}) {
  try {
    // Validate inputs
    if (!destinationAddress || !ethers.isAddress(destinationAddress)) {
      throw new Error('Invalid destination address');
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Image URL is required');
    }

    // Validate image URL format and ensure it points to an image
    // Note: Full 256x256 validation requires downloading the image which is expensive
    // Users should ensure their images are exactly 256x256 pixels
    try {
      if (typeof fetch !== 'undefined') {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error('URL does not point to an image');
        }
      }
          console.log('⚠️  Note: Ensure your image is exactly 512x512 pixels');
    } catch (error) {
      if (error.message.includes('fetch') || error.message.includes('undefined')) {
        // fetch not available (Node.js < 18) - just validate URL format
        if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) && !imageUrl.startsWith('data:image/')) {
          console.log('⚠️  Warning: Image URL does not appear to be an image file');
        }
        console.log('⚠️  Note: Ensure your image is exactly 512x512 pixels');
      } else {
        throw error;
      }
    }

    if (!traits || typeof traits !== 'object') {
      throw new Error('Traits must be a valid object');
    }

    // Load configuration
    let contractAddress = config.contractAddress;
    let privateKey = config.privateKey;
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

    // Load private key from file if not provided
    if (!privateKey) {
      try {
        privateKey = fs.readFileSync('polygon_private_key.txt', 'utf8').trim();
        if (!privateKey.startsWith('0x')) {
          privateKey = '0x' + privateKey;
        }
      } catch (error) {
        throw new Error('Private key not provided and polygon_private_key.txt not found');
      }
    }

    if (!privateKey || !privateKey.startsWith('0x')) {
      throw new Error('Invalid private key format');
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Contract ABI - supports multiple mint function signatures
    const contractABI = [
      "function mint(address to, string memory metadata) public returns (uint256)",
      "function safeMint(address to, string memory tokenURI) public returns (uint256)",
      "function mintWithMetadata(address to, string memory metadata) public returns (uint256)",
      "function totalSupply() public view returns (uint256)",
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    // Build metadata object
    const metadata = {
      name: traits.name || 'Game Item',
      description: traits.description || 'A game item NFT',
      image: imageUrl,
      traits: traits
    };

    // Convert metadata to JSON string
    const metadataJson = JSON.stringify(metadata);

    console.log(`Minting NFT to ${destinationAddress}...`);
    console.log(`Contract: ${contractAddress}`);

    // Attempt different mint function signatures
    let tx;
    let tokenId = null;

    try {
      // Try mint function first (what our contract uses)
      tx = await contract.mint(destinationAddress, metadataJson);
    } catch (error) {
      try {
        // Fallback to safeMint
        tx = await contract.safeMint(destinationAddress, metadataJson);
      } catch (error2) {
        try {
          // Fallback to mintWithMetadata
          tx = await contract.mintWithMetadata(destinationAddress, metadataJson);
        } catch (error3) {
          throw new Error(`Minting failed. Tried mint, safeMint, and mintWithMetadata. Original error: ${error.message}`);
        }
      }
    }

    console.log(`Transaction hash: ${tx.hash}`);
    console.log('Waiting for confirmation...');

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    // Try to extract token ID from Transfer event
    if (receipt.logs) {
      const transferEvent = contract.interface.parseLog(
        receipt.logs.find(log => {
          try {
            return contract.interface.parseLog(log)?.name === 'Transfer';
          } catch {
            return false;
          }
        })
      );

      if (transferEvent && transferEvent.args && transferEvent.args.tokenId) {
        tokenId = transferEvent.args.tokenId.toString();
      }
    }

    // If tokenId not found in events, try getting totalSupply (tokenId would be totalSupply - 1)
    if (!tokenId) {
      try {
        const totalSupply = await contract.totalSupply();
        tokenId = (totalSupply - 1n).toString();
      } catch {
        // If we can't get totalSupply, tokenId will remain null
      }
    }

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      tokenId: tokenId,
      destinationAddress: destinationAddress,
      imageUrl: imageUrl,
      traits: traits
    };

  } catch (error) {
    console.error('Minting error:', error.message);
    throw error;
  }
}

export default mint;
