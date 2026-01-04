# How to Deploy Your NFT Contract to Polygon

## Step 1: Get Your Private Key

You need a wallet with MATIC (Polygon's cryptocurrency) for gas fees.

1. If you don't have a wallet, create one using MetaMask or another wallet
2. Get your private key from your wallet
   - **WARNING**: Keep this secret! Never share it or commit it to GitHub
3. Make sure your wallet has some MATIC (you can get test MATIC from a faucet)

## Step 2: Create .env File

1. Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Open `.env` and replace `0xYourPrivateKeyHere` with your actual private key:
   ```
   PRIVATE_KEY=0x1234567890abcdef...
   ```

## Step 3: Deploy to Polygon

Run this command:

```powershell
npx hardhat run scripts/deploy.js --network polygon
```

## What Happens:

1. Hardhat will compile your contract (already done ✅)
2. It will connect to Polygon using your private key
3. It will deploy the contract and pay gas fees in MATIC
4. You'll get a contract address (save this!)

## After Deployment:

1. Your contract address will be saved to `deployment.json`
2. You can view it on PolygonScan: `https://polygonscan.com/address/YOUR_CONTRACT_ADDRESS`
3. Use this contract address in your `mint.js` function!

## Important Notes:

- **Gas Fees**: You need MATIC in your wallet to pay for deployment (usually costs a few cents)
- **Private Key Security**: The `.env` file should be in your `.gitignore` - never share your private key!
- **Contract Owner**: The wallet that deploys becomes the owner (only the owner can mint NFTs)

