import express from 'express';
import multer from 'multer';
import mint from './mint.js';
import retrieve from './retrieve.js';
import getItem from './get-item.js';
import verifyOwner from './verify-owner.js';
import { logMint, logRetrieve } from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept image files
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
    }
  }
});

// Middleware
app.use(express.json());

// Authentication middleware
function authenticate(req, res, next) {
  const providedKey = req.headers['x-api-key'] || req.body.apiKey || req.query.apiKey;
  
  if (!providedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Include it in X-API-Key header, or as apiKey in body/query.'
    });
  }

  // Load endpoint key from file
  let endpointKey;
  try {
    endpointKey = fs.readFileSync(path.join(__dirname, 'endpoint_key.txt'), 'utf8').trim();
  } catch (error) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Endpoint key file not found'
    });
  }

  if (providedKey !== endpointKey) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key'
    });
  }

  next();
}

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Blockchain NFT API' });
});

// Mint endpoint - accepts both file uploads and image URLs
app.post('/api/mint', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { destinationAddress, imageUrl, traits, config } = req.body;
    const imageFile = req.file;

    // Validate required fields
    if (!destinationAddress) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'destinationAddress is required'
      });
    }

    // Parse traits if it's a string (from form-data)
    let traitsObj = traits;
    if (typeof traits === 'string') {
      try {
        traitsObj = JSON.parse(traits);
      } catch (e) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'traits must be a valid JSON object'
        });
      }
    }

    if (!traitsObj || typeof traitsObj !== 'object') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'traits object is required'
      });
    }

    // Handle image: either file upload or URL
    let finalImageUrl = imageUrl;

    if (imageFile) {
      // File was uploaded - convert to base64 data URI
      const fileExtension = path.extname(imageFile.originalname).toLowerCase().slice(1);
      const mimeType = imageFile.mimetype;
      const base64Data = imageFile.buffer.toString('base64');
      finalImageUrl = `data:${mimeType};base64,${base64Data}`;
      console.log(`[MINT] Using uploaded image file: ${imageFile.originalname} (${imageFile.size} bytes)`);
    } else if (imageUrl) {
      // Image URL provided
      finalImageUrl = imageUrl;
      console.log(`[MINT] Using image URL: ${imageUrl}`);
    } else {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Either image file upload or imageUrl is required'
      });
    }

    if (!finalImageUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Image is required (either upload a file or provide imageUrl)'
      });
    }

    // Parse config if it's a string (from form-data)
    let configObj = config;
    if (typeof config === 'string' && config) {
      try {
        configObj = JSON.parse(config);
      } catch (e) {
        // Ignore parse errors, use as-is
        configObj = {};
      }
    }

    console.log(`[MINT] Request for ${destinationAddress}`);

    // Get wallet address from config or use a placeholder
    let walletAddress = 'unknown';
    try {
      const deploymentInfo = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
      walletAddress = deploymentInfo.ownerAddress || 'unknown';
    } catch (e) {
      // Ignore
    }

    try {
      // Call mint function
      const result = await mint(destinationAddress, finalImageUrl, traitsObj, configObj || {});

      // Log successful mint
      logMint(
        walletAddress,
        destinationAddress,
        finalImageUrl,
        result.tokenId,
        result.transactionHash,
        result.blockNumber,
        true,
        ''
      );

      res.json({
        success: true,
        data: result
      });
    } catch (mintError) {
      // Log failed mint
      logMint(
        walletAddress,
        destinationAddress,
        finalImageUrl,
        null,
        null,
        null,
        false,
        mintError.message
      );
      throw mintError;
    }

  } catch (error) {
    console.error('[MINT] Error:', error.message);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Image file too large. Maximum size is 5MB.'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Retrieve endpoint
app.get('/api/retrieve/:walletAddress', authenticate, async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { contractAddress, rpcUrl } = req.query;

    // Build config from query params
    const config = {};
    if (contractAddress) config.contractAddress = contractAddress;
    if (rpcUrl) config.rpcUrl = rpcUrl;

    console.log(`[RETRIEVE] Request for ${walletAddress}`);

    try {
      // Call retrieve function
      const items = await retrieve(walletAddress, config);

      // Log successful retrieve
      logRetrieve(walletAddress, items.length, true, '');

      res.json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (retrieveError) {
      // Log failed retrieve
      logRetrieve(walletAddress, 0, false, retrieveError.message);
      throw retrieveError;
    }

  } catch (error) {
    console.error('[RETRIEVE] Error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Alternative POST method for retrieve (if needed)
app.post('/api/retrieve', authenticate, async (req, res) => {
  try {
    const { walletAddress, config } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'walletAddress is required'
      });
    }

    console.log(`[RETRIEVE] Request for ${walletAddress}`);

    // Call retrieve function
    const items = await retrieve(walletAddress, config || {});

    res.json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {
    console.error('[RETRIEVE] Error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Get item by token ID endpoint
app.get('/api/item/:tokenId', authenticate, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { contractAddress, rpcUrl } = req.query;

    // Build config from query params
    const config = {};
    if (contractAddress) config.contractAddress = contractAddress;
    if (rpcUrl) config.rpcUrl = rpcUrl;

    console.log(`[GET_ITEM] Request for token ID: ${tokenId}`);

    // Call getItem function
    const item = await getItem(tokenId, config);

    res.json({
      success: true,
      data: item
    });

  } catch (error) {
    console.error('[GET_ITEM] Error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Alternative POST method for get item (if needed)
app.post('/api/item', authenticate, async (req, res) => {
  try {
    const { tokenId, config } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'tokenId is required'
      });
    }

    console.log(`[GET_ITEM] Request for token ID: ${tokenId}`);

    // Call getItem function
    const item = await getItem(tokenId, config || {});

    res.json({
      success: true,
      data: item
    });

  } catch (error) {
    console.error('[GET_ITEM] Error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Verify owner endpoint
app.get('/api/verify-owner/:walletAddress/:tokenId', authenticate, async (req, res) => {
  try {
    const { walletAddress, tokenId } = req.params;
    const { contractAddress, rpcUrl } = req.query;

    // Build config from query params
    const config = {};
    if (contractAddress) config.contractAddress = contractAddress;
    if (rpcUrl) config.rpcUrl = rpcUrl;

    console.log(`[VERIFY_OWNER] Request: wallet ${walletAddress}, token ${tokenId}`);

    // Call verifyOwner function
    const result = await verifyOwner(walletAddress, tokenId, config);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[VERIFY_OWNER] Error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Alternative POST method for verify owner
app.post('/api/verify-owner', authenticate, async (req, res) => {
  try {
    const { walletAddress, tokenId, config } = req.body;

    if (!walletAddress || !tokenId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'walletAddress and tokenId are required'
      });
    }

    console.log(`[VERIFY_OWNER] Request: wallet ${walletAddress}, token ${tokenId}`);

    // Call verifyOwner function
    const result = await verifyOwner(walletAddress, tokenId, config || {});

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[VERIFY_OWNER] Error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   POST /api/mint`);
  console.log(`   GET  /api/retrieve/:walletAddress`);
  console.log(`   POST /api/retrieve`);
  console.log(`   GET  /api/item/:tokenId`);
  console.log(`   POST /api/item`);
  console.log(`   GET  /api/verify-owner/:walletAddress/:tokenId`);
  console.log(`   POST /api/verify-owner`);
  console.log(`   GET  /health`);
});

