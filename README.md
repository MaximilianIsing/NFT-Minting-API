# Blockchain NFT Minting API

Simple, clean interface for minting NFTs on Polygon blockchain.

## Quick Start

### Mint an NFT

```javascript
import mint from './mint.js';

const result = await mint(
  "0xDestinationAddress",           // Where to send the NFT
  "https://example.com/item.png",   // 256x256 image URL
  {                                  // Traits/metadata object
    name: "My Item",
    description: "Item description",
    attack: 100,
    defense: 50,
    rarity: "legendary"
  }
);
```

## Setup

1. **Deploy your contract** (one-time setup):
   ```bash
   npm run deploy
   ```
   This creates a `deployment.json` file with your contract address.

2. **Configure** (optional):
   - Contract address: Loaded automatically from `deployment.json`
   - Private key: Loaded automatically from `polygon_private_key.txt`
   - RPC URL: Defaults to `https://polygon-rpc.com/`

## Function Signature

```javascript
mint(destinationAddress, imageUrl, traits, config?)
```

**Parameters:**
- `destinationAddress` (string, required): Address to receive the NFT
- `imageUrl` (string, required): URL to 256x256 image
- `traits` (object, required): JSON object with item traits/metadata
- `config` (object, optional): Override configuration
  - `contractAddress`: Contract address (defaults to `deployment.json`)
  - `privateKey`: Private key (defaults to `polygon_private_key.txt`)
  - `rpcUrl`: RPC endpoint (defaults to `https://polygon-rpc.com/`)

**Returns:**
```javascript
{
  success: true,
  transactionHash: "0x...",
  blockNumber: 123456,
  tokenId: "1",
  destinationAddress: "0x...",
  imageUrl: "https://...",
  traits: {...}
}
```

## Image Requirements

- **Must be exactly 256x256 pixels**
- Supported formats: JPG, PNG, GIF, WebP, SVG
- Can be hosted anywhere (URL) or use data URIs

## Example

See `example.js` for a complete example.

## Deployment

All deployment-related files are in the `deploy/` folder:
- `deploy/contracts/` - Smart contract source code
- `deploy/scripts/` - Deployment scripts
- `deploy/hardhat.config.js` - Hardhat configuration

To deploy a new contract:
```bash
cd deploy
npx hardhat run scripts/deploy.js --network polygon
```

## Files

- `mint.js` - Main minting function
- `example.js` - Usage example
- `deployment.json` - Contract address (created after deployment)
- `polygon_private_key.txt` - Your wallet private key (keep secret!)

