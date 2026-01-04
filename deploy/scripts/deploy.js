import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=== Starting Deployment ===");
  console.log("Deploying GameItem contract to Polygon...\n");

  // Read private key from file
  console.log("[1/6] Reading private key from file...");
  const keyPath = path.join(__dirname, "..", "polygon_private_key.txt");
  let privateKey = fs.readFileSync(keyPath, "utf8").trim();
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }
  console.log("✅ Private key loaded\n");
  
  // Create provider and wallet
  console.log("[2/6] Connecting to Polygon network...");
  const rpcUrl = "https://polygon-rpc.com/";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("✅ Connected to Polygon\n");
  
  console.log("[3/6] Checking wallet info...");
  console.log("Deploying with account:", wallet.address);
  
  // Check balance
  console.log("Checking balance...");
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC\n");

  // Read contract ABI and bytecode from artifacts
  console.log("[4/6] Loading contract artifacts...");
  const contractArtifact = await hre.artifacts.readArtifact("GameItem");
  console.log("✅ Contract artifact loaded\n");
  
  // Create contract factory
  console.log("[5/6] Creating contract factory...");
  const GameItem = new ethers.ContractFactory(
    contractArtifact.abi,
    contractArtifact.bytecode,
    wallet
  );
  console.log("✅ Contract factory created\n");
  
  // Deploy the contract
  console.log("[6/6] Deploying contract to Polygon...");
  console.log("   Sending transaction...");
  
  // Get estimated gas
  const deployTx = await GameItem.getDeployTransaction(wallet.address);
  const estimatedGas = await provider.estimateGas(deployTx);
  console.log("   Estimated gas:", estimatedGas.toString());
  
  // Deploy with explicit gas limit
  const gameItem = await GameItem.deploy(wallet.address, {
    gasLimit: estimatedGas + BigInt(50000) // Add buffer
  });
  
  // Wait for the transaction to be sent
  const deploymentTx = gameItem.deploymentTransaction();
  if (!deploymentTx) {
    throw new Error("Failed to get deployment transaction");
  }
  
  const txHash = deploymentTx.hash;
  
  if (!txHash || txHash.length !== 66) {
    throw new Error(`Invalid transaction hash: ${txHash}`);
  }
  
  console.log("   Transaction sent! Hash:", txHash);
  console.log("   Waiting for confirmation (this may take 30-60 seconds)...");
  console.log(`   Track on PolygonScan: https://polygonscan.com/tx/${txHash}\n`);
  
  // Poll for transaction receipt
  let receipt = null;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes (5 second intervals)
  
  while (!receipt && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;
    
    try {
      receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}!`);
        
        if (receipt.status !== 1) {
          throw new Error("Transaction failed on blockchain");
        }
        break;
      } else {
        process.stdout.write(`   ⏳ Waiting... (${attempts * 5}s)\r`);
      }
    } catch (error) {
      if (!error.message.includes("not found")) {
        console.error(`\n   ⚠️  Error checking status: ${error.message}`);
      }
      process.stdout.write(`   ⏳ Waiting... (${attempts * 5}s)\r`);
    }
  }
  
  if (!receipt) {
    throw new Error(`Transaction not confirmed after ${attempts * 5} seconds. Check PolygonScan: https://polygonscan.com/tx/${txHash}`);
  }
  
  // Get contract address
  const contractAddress = receipt.contractAddress;
  
  if (!contractAddress) {
    // Fallback: try to get from deployment
    try {
      const addr = await gameItem.getAddress();
      if (addr) {
        console.log("\n✅ Contract deployed successfully!");
        console.log("Contract address:", addr);
        console.log("Owner address:", wallet.address);
        console.log("\nYou can view your contract on PolygonScan:");
        console.log(`https://polygonscan.com/address/${addr}`);
        
        // Save deployment info
        const deploymentInfo = {
          contractAddress: addr,
          ownerAddress: wallet.address,
          network: "polygon",
          deployedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(
          "deployment.json",
          JSON.stringify(deploymentInfo, null, 2)
        );
        console.log("\nDeployment info saved to deployment.json");
        return;
      }
    } catch (e) {
      // Continue to error
    }
    throw new Error("Could not determine contract address from transaction receipt");
  }
  
  console.log("\n✅ Contract deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("Owner address:", wallet.address);
  console.log("\nYou can view your contract on PolygonScan:");
  console.log(`https://polygonscan.com/address/${contractAddress}`);
  
  // Save the contract address to a file for easy reference
  const deploymentInfo = {
    contractAddress: contractAddress,
    ownerAddress: wallet.address,
    network: "polygon",
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  });
