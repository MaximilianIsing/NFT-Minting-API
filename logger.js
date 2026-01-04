import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine storage path - use /storage if mounted, otherwise use relative path
const STORAGE_PATH = fs.existsSync('/storage') ? '/storage' : path.join(__dirname, 'storage');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

/**
 * Write a log entry to mint_logs.csv
 */
export function logMint(walletAddress, destinationAddress, imageUrl, tokenId, transactionHash, blockNumber, success, errorMessage = '') {
  try {
    const timestamp = new Date().toISOString();
    const csvLine = [
      timestamp,
      walletAddress || '',
      destinationAddress || '',
      imageUrl || '',
      tokenId || '',
      transactionHash || '',
      blockNumber || '',
      success ? 'true' : 'false',
      errorMessage.replace(/,/g, ';').replace(/\n/g, ' ') // Sanitize for CSV
    ].map(field => `"${field}"`).join(',') + '\n';

    const logFile = path.join(STORAGE_PATH, 'mint_logs.csv');
    
    // Write header if file doesn't exist
    if (!fs.existsSync(logFile)) {
      const header = 'timestamp,wallet_address,destination_address,image_url,token_id,transaction_hash,block_number,success,error_message\n';
      fs.writeFileSync(logFile, header);
    }

    // Append log entry
    fs.appendFileSync(logFile, csvLine, 'utf8');
  } catch (error) {
    console.error('[LOGGER] Error writing mint log:', error.message);
  }
}

/**
 * Write a log entry to retrieve_logs.csv
 */
export function logRetrieve(walletAddress, itemsCount, success, errorMessage = '') {
  try {
    const timestamp = new Date().toISOString();
    const csvLine = [
      timestamp,
      walletAddress || '',
      itemsCount || 0,
      success ? 'true' : 'false',
      errorMessage.replace(/,/g, ';').replace(/\n/g, ' ') // Sanitize for CSV
    ].map(field => `"${field}"`).join(',') + '\n';

    const logFile = path.join(STORAGE_PATH, 'retrieve_logs.csv');
    
    // Write header if file doesn't exist
    if (!fs.existsSync(logFile)) {
      const header = 'timestamp,wallet_address,items_count,success,error_message\n';
      fs.writeFileSync(logFile, header);
    }

    // Append log entry
    fs.appendFileSync(logFile, csvLine, 'utf8');
  } catch (error) {
    console.error('[LOGGER] Error writing retrieve log:', error.message);
  }
}

