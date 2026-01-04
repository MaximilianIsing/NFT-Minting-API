import { ethers } from 'ethers';
import fs from 'fs';

/**
 * Verifies if a wallet address owns a specific token ID
 * 
 * @param {string} walletAddress - The wallet address to verify
 * @param {number|string} tokenId - The token ID to check
 * @param {Object} config - Optional configuration:
 *   @param {string} contractAddress - Contract address (defaults to deployment.json)
 *   @param {string} rpcUrl - RPC endpoint URL (default: https://polygon-rpc.com/)
 * @returns {Promise<Object>} Verification result with isOwner, owner, tokenId, etc.
 * 
 * @example
 * const result = await verifyOwner(
 *   "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813",
 *   1
 * );
 * console.log(`Is owner: ${result.isOwner}`);
 */
async function verifyOwner(walletAddress, tokenId, config = {}) {
  try {
    // Validate inputs
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

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

    // Contract ABI - only need ownerOf function
    const contractABI = [
      "function ownerOf(uint256 tokenId) public view returns (address)"
    ];

    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    console.log(`Verifying ownership of token ${tokenId}...`);
    console.log(`Wallet: ${walletAddress}`);
    console.log(`Contract: ${contractAddress}`);

    // Get the actual owner of the token
    let actualOwner;
    try {
      actualOwner = await contract.ownerOf(tokenIdNumber);
    } catch (error) {
      throw new Error(`Token ID ${tokenId} does not exist or has been burned`);
    }

    // Normalize addresses for comparison (lowercase)
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const normalizedActualOwner = actualOwner.toLowerCase();

    // Check if they match
    const isOwner = normalizedWalletAddress === normalizedActualOwner;

    console.log(`Actual owner: ${actualOwner}`);
    console.log(`Verified: ${isOwner ? '✅ Owner verified' : '❌ Not the owner'}`);

    return {
      isOwner: isOwner,
      walletAddress: walletAddress,
      actualOwner: actualOwner,
      tokenId: tokenIdNumber.toString(),
      contractAddress: contractAddress
    };

  } catch (error) {
    console.error('Verify owner error:', error.message);
    throw error;
  }
}

export default verifyOwner;

