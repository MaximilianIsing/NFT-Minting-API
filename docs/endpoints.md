# API Endpoints

Documentation for the Blockchain NFT Minting API endpoints.

## Overview

This API provides HTTP endpoints for interacting with game item NFTs on the Polygon blockchain. The API runs on a server (deployed on Render) and requires authentication via API key.

**Base URL:** `https://your-service-name.onrender.com`

## Authentication

All API endpoints (except `/health`) require authentication using an API key from `endpoint_key.txt`.

Include the API key in one of these ways:
- **Header (Recommended):** `X-API-Key: your-endpoint-key`
- **Query Parameter:** `?apiKey=your-endpoint-key`
- **Request Body:** `{ "apiKey": "your-endpoint-key", ... }`

### Example with Header:
```bash
curl -H "X-API-Key: your-endpoint-key" https://your-service.onrender.com/api/mint
```

---

## Endpoints

### 1. Health Check

Check if the API is running and accessible.

**Endpoint:** `GET /health`

**Authentication:** Not required

**Request:**
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "Blockchain NFT API"
}
```

**cURL Example:**
```bash
curl https://your-service-name.onrender.com/health
```

---

### 2. Mint NFT

Creates and mints a new NFT game item to a specified wallet address.

**Endpoint:** `POST /api/mint`

**Authentication:** Required

**Headers:**
```
Content-Type: application/json
X-API-Key: your-endpoint-key-here
```

**Request Format:**

You can send requests in two ways:

1. **JSON with image URL** (Content-Type: application/json)
2. **Multipart/form-data with image file** (Content-Type: multipart/form-data)

**Option 1: JSON Request (Image URL)**

**Request Body (JSON):**
```json
{
  "destinationAddress": "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813",
  "imageUrl": "https://example.com/item-512x512.png",
  "traits": {
    "name": "Legendary Fire Sword",
    "description": "A powerful sword forged in flames",
    "attack": 150,
    "defense": 75,
    "element": "fire",
    "rarity": "legendary",
    "level": 10,
    "durability": 100,
    "enchantment": "flame strike"
  },
  "config": {
    "contractAddress": "0x...",  // Optional: defaults to deployment.json
    "privateKey": "0x...",        // Optional: defaults to polygon_private_key.txt
    "rpcUrl": "https://..."       // Optional: defaults to polygon-rpc.com
  }
}
```

**Option 2: Form Data Request (Image File Upload)**

**Form Fields:**
- `destinationAddress` (string, required): Wallet address to receive the NFT
- `image` (file, required): Image file (512x512 pixels, max 5MB)
- `traits` (string/JSON, required): JSON string of traits object
- `imageUrl` (string, optional): Ignored if image file is provided
- `config` (string/JSON, optional): JSON string of config object

**Required Fields:**
- `destinationAddress` (string): Wallet address to receive the NFT (must be valid Ethereum address)
- Either `image` (file) OR `imageUrl` (string): Image file upload or URL to the item image (must be exactly 512x512 pixels)
- `traits` (object/string): JSON object containing item traits and metadata

**Optional Fields:**
- `config` (object): Override configuration
  - `contractAddress`: Contract address (defaults to `deployment.json`)
  - `privateKey`: Private key (defaults to `polygon_private_key.txt`)
  - `rpcUrl`: RPC endpoint (defaults to `https://polygon-rpc.com/`)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x16e6c2681ae5cae2d5a9b0427a437b11524829a6a16444e2db741a73459999a9",
    "blockNumber": 81184549,
    "tokenId": "1",
    "destinationAddress": "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813",
    "imageUrl": "https://example.com/item-512x512.png",
    "traits": {
      "name": "Legendary Fire Sword",
      "attack": 150,
      "defense": 75
    }
  }
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "error": "Unauthorized",
  "message": "API key is required. Include it in X-API-Key header, or as apiKey in body/query."
}
```

403 Forbidden:
```json
{
  "error": "Forbidden",
  "message": "Invalid API key"
}
```

400 Bad Request:
```json
{
  "error": "Bad Request",
  "message": "destinationAddress is required"
}
```

500 Internal Server Error:
```json
{
  "error": "Internal Server Error",
  "message": "Error message details"
}
```

**cURL Examples:**

**With Image URL (JSON):**
```bash
curl -X POST https://your-service-name.onrender.com/api/mint \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-endpoint-key-here" \
  -d '{
    "destinationAddress": "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813",
    "imageUrl": "https://example.com/sword-512x512.png",
    "traits": {
      "name": "Mythic Mega Sword",
      "description": "A powerful sword",
      "attack": 150,
      "defense": 75,
      "rarity": "legendary"
    }
  }'
```

**With Image File Upload (Form Data):**
```bash
curl -X POST https://your-service-name.onrender.com/api/mint \
  -H "X-API-Key: your-endpoint-key-here" \
  -F "destinationAddress=0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813" \
  -F "image=@/path/to/sword-512x512.png" \
  -F "traits={\"name\":\"Mythic Mega Sword\",\"attack\":150,\"rarity\":\"legendary\"}"
```

**JavaScript Examples:**

**With Image URL (JSON):**
```javascript
const response = await fetch('https://your-service-name.onrender.com/api/mint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-endpoint-key-here'
  },
  body: JSON.stringify({
    destinationAddress: '0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813',
    imageUrl: 'https://example.com/sword-512x512.png',
    traits: {
      name: 'Mythic Mega Sword',
      description: 'A powerful sword',
      attack: 150,
      defense: 75,
      rarity: 'legendary'
    }
  })
});

const result = await response.json();
if (result.success) {
  console.log(`Minted! Token ID: ${result.data.tokenId}`);
  console.log(`Transaction: ${result.data.transactionHash}`);
}
```

**With Image File Upload (Form Data):**
```javascript
const formData = new FormData();
formData.append('destinationAddress', '0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813');
formData.append('image', fileInput.files[0]); // File from <input type="file">
formData.append('traits', JSON.stringify({
  name: 'Mythic Mega Sword',
  description: 'A powerful sword',
  attack: 150,
  defense: 75,
  rarity: 'legendary'
}));

const response = await fetch('https://your-service-name.onrender.com/api/mint', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-endpoint-key-here'
    // Don't set Content-Type - browser will set it with boundary for FormData
  },
  body: formData
});

const result = await response.json();
if (result.success) {
  console.log(`Minted! Token ID: ${result.data.tokenId}`);
}
```

**Image Requirements:**
- **Size:** Must be exactly **512x512 pixels**
- **Formats:** JPG, JPEG, PNG, GIF, WebP, SVG
- **File Size:** Maximum 5MB for file uploads
- **Image Source:** Either provide `imageUrl` (string) OR upload `image` (file)
  - If both are provided, the uploaded file takes precedence
  - Uploaded images are converted to base64 data URIs and stored in metadata

**Other Requirements:**
- **Gas:** Server wallet must have MATIC for transaction fees

---

### 3. Retrieve Items (GET)

Gets all NFT game items owned by a wallet address.

**Endpoint:** `GET /api/retrieve/:walletAddress`

**Authentication:** Required

**Path Parameters:**
- `walletAddress` (string, required): Wallet address to query (must be valid Ethereum address)

**Query Parameters:**
- `contractAddress` (string, optional): Override contract address
- `rpcUrl` (string, optional): Override RPC URL
- `apiKey` (string, optional): Alternative way to pass API key (instead of header)

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "tokenId": "1",
      "metadata": {
        "name": "Legendary Fire Sword",
        "description": "A powerful sword",
        "image": "https://example.com/sword.png",
        "traits": {
          "attack": 150,
          "defense": 75,
          "rarity": "legendary"
        }
      },
      "traits": {
        "attack": 150,
        "defense": 75,
        "rarity": "legendary"
      },
      "name": "Legendary Fire Sword",
      "description": "A powerful sword",
      "image": "https://example.com/sword.png"
    },
    {
      "tokenId": "2",
      "metadata": {...},
      "traits": {...},
      "name": "Epic Shield",
      "description": "...",
      "image": "..."
    }
  ]
}
```

**Empty Response (200):**
```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

**cURL Example:**
```bash
curl https://your-service-name.onrender.com/api/retrieve/0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813 \
  -H "X-API-Key: your-endpoint-key-here"
```

**JavaScript Example:**
```javascript
const walletAddress = '0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813';
const response = await fetch(
  `https://your-service-name.onrender.com/api/retrieve/${walletAddress}`,
  {
    headers: {
      'X-API-Key': 'your-endpoint-key-here'
    }
  }
);

const result = await response.json();
if (result.success) {
  console.log(`Found ${result.count} items`);
  result.data.forEach(item => {
    console.log(`${item.name} (Token #${item.tokenId})`);
    console.log(`  Traits:`, item.traits);
  });
}
```

---

### 4. Retrieve Items (POST)

Alternative POST method for retrieving items. Useful when you need to pass additional configuration.

**Endpoint:** `POST /api/retrieve`

**Authentication:** Required

**Request Body:**
```json
{
  "walletAddress": "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813",
  "config": {
    "contractAddress": "0x...",  // Optional: override contract address
    "rpcUrl": "https://..."       // Optional: override RPC URL
  }
}
```

**Required Fields:**
- `walletAddress` (string): Wallet address to query

**Optional Fields:**
- `config` (object): Configuration overrides

**Success Response (200):**
Same format as GET endpoint above.

**cURL Example:**
```bash
curl -X POST https://your-service-name.onrender.com/api/retrieve \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-endpoint-key-here" \
  -d '{
    "walletAddress": "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813"
  }'
```

**JavaScript Example:**
```javascript
const response = await fetch('https://your-service-name.onrender.com/api/retrieve', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-endpoint-key-here'
  },
  body: JSON.stringify({
    walletAddress: '0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813',
    config: {
      // Optional overrides
    }
  })
});

const result = await response.json();
console.log(result);
```

---

## Error Codes

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Unauthorized | API key missing |
| 403 | Forbidden | Invalid API key |
| 500 | Internal Server Error | Server or blockchain error |

---

## Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "data": {...}  // or "count" and "data" array for retrieve
}
```

All error responses follow this format:
```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

---

## Configuration

The API automatically loads configuration from files:

- **Contract Address:** Loaded from `deployment.json` if not provided in request
- **Private Key:** (Mint only) Loaded from `polygon_private_key.txt` if not provided
- **RPC URL:** Defaults to `https://polygon-rpc.com/` if not provided
- **API Key:** Must match the key in `endpoint_key.txt`

---

## Network

All endpoints operate on the **Polygon Mainnet**.

- **Chain ID:** 137
- **Default RPC URL:** `https://polygon-rpc.com/`
- **Currency:** MATIC (for gas fees)
- **Block Explorer:** [PolygonScan](https://polygonscan.com/)

---

## Local Development

To test locally:

```bash
npm install
npm start
```

The server will run on `http://localhost:3000`

Test with:
```bash
curl http://localhost:3000/health
```

---

### 5. Get Item by Token ID

Gets a specific NFT game item by its token ID.

**Endpoint:** `GET /api/item/:tokenId`

**Authentication:** Required

**Path Parameters:**
- `tokenId` (number/string, required): The token ID to look up

**Query Parameters:**
- `contractAddress` (string, optional): Override contract address
- `rpcUrl` (string, optional): Override RPC URL
- `apiKey` (string, optional): Alternative way to pass API key

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "tokenId": "1",
    "owner": "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813",
    "metadata": {
      "name": "Legendary Fire Sword",
      "description": "A powerful sword",
      "image": "https://...",
      "traits": {
        "attack": 150,
        "defense": 75,
        "rarity": "legendary"
      }
    },
    "traits": {
      "attack": 150,
      "defense": 75,
      "rarity": "legendary"
    },
    "name": "Legendary Fire Sword",
    "description": "A powerful sword",
    "image": "https://...",
    "contractAddress": "0x2aAA17DEd5265bF32a7612a76790Cae51D61862B"
  }
}
```

**Error Response (500):**
```json
{
  "error": "Internal Server Error",
  "message": "Token ID 999 does not exist or has been burned"
}
```

**cURL Example:**
```bash
curl https://your-service-name.onrender.com/api/item/1 \
  -H "X-API-Key: your-endpoint-key-here"
```

**JavaScript Example:**
```javascript
const tokenId = 1;
const response = await fetch(
  `https://your-service-name.onrender.com/api/item/${tokenId}`,
  {
    headers: {
      'X-API-Key': 'your-endpoint-key-here'
    }
  }
);

const result = await response.json();
if (result.success) {
  console.log(`Item: ${result.data.name}`);
  console.log(`Owner: ${result.data.owner}`);
  console.log(`Traits:`, result.data.traits);
}
```

**Alternative POST Method:**

**Endpoint:** `POST /api/item`

**Request Body:**
```json
{
  "tokenId": 1,
  "config": {
    "contractAddress": "0x...",  // Optional
    "rpcUrl": "https://..."       // Optional
  }
}
```

---

### 6. Verify Owner

Verifies if a wallet address owns a specific token ID.

**Endpoint:** `GET /api/verify-owner/:walletAddress/:tokenId`

**Authentication:** Required

**Path Parameters:**
- `walletAddress` (string, required): The wallet address to verify
- `tokenId` (number/string, required): The token ID to check

**Query Parameters:**
- `contractAddress` (string, optional): Override contract address
- `rpcUrl` (string, optional): Override RPC URL
- `apiKey` (string, optional): Alternative way to pass API key

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isOwner": true,
    "walletAddress": "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813",
    "actualOwner": "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813",
    "tokenId": "2",
    "contractAddress": "0x2aAA17DEd5265bF32a7612a76790Cae51D61862B"
  }
}
```

**Error Response (500):**
```json
{
  "error": "Internal Server Error",
  "message": "Token ID 999 does not exist or has been burned"
}
```

**cURL Example:**
```bash
curl https://your-service-name.onrender.com/api/verify-owner/0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813/2 \
  -H "X-API-Key: your-endpoint-key-here"
```

**JavaScript Example:**
```javascript
const walletAddress = "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813";
const tokenId = 2;
const response = await fetch(
  `https://your-service-name.onrender.com/api/verify-owner/${walletAddress}/${tokenId}`,
  {
    headers: {
      'X-API-Key': 'your-endpoint-key-here'
    }
  }
);

const result = await response.json();
if (result.success) {
  if (result.data.isOwner) {
    console.log(`✅ Wallet owns token ${tokenId}`);
  } else {
    console.log(`❌ Wallet does not own token ${tokenId}`);
    console.log(`Actual owner: ${result.data.actualOwner}`);
  }
}
```

**Alternative POST Method:**

**Endpoint:** `POST /api/verify-owner`

**Request Body:**
```json
{
  "walletAddress": "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813",
  "tokenId": 2,
  "config": {
    "contractAddress": "0x...",  // Optional
    "rpcUrl": "https://..."       // Optional
  }
}
```

---

## Quick Reference

### Mint an Item
```bash
POST /api/mint
Headers: X-API-Key: your-key
Body: { destinationAddress, imageUrl, traits }
```

### Retrieve Items (GET)
```bash
GET /api/retrieve/:walletAddress
Headers: X-API-Key: your-key
```

### Retrieve Items (POST)
```bash
POST /api/retrieve
Headers: X-API-Key: your-key
Body: { walletAddress, config? }
```

### Get Item by Token ID
```bash
GET /api/item/:tokenId
Headers: X-API-Key: your-key
```

Or POST method:
```bash
POST /api/item
Headers: X-API-Key: your-key
Body: { tokenId, config? }
```

### Verify Owner
```bash
GET /api/verify-owner/:walletAddress/:tokenId
Headers: X-API-Key: your-key
```

Or POST method:
```bash
POST /api/verify-owner
Headers: X-API-Key: your-key
Body: { walletAddress, tokenId, config? }
```

### Health Check
```bash
GET /health
No authentication required
```
