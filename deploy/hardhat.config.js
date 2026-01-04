/** @type import('hardhat/config').HardhatUserConfig */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read private key from polygon_private_key.txt
function getPrivateKey() {
  try {
    const keyPath = path.join(__dirname, "polygon_private_key.txt");
    let privateKey = fs.readFileSync(keyPath, "utf8").trim();
    
    // Remove any quotes or whitespace
    privateKey = privateKey.replace(/['"]/g, "").trim();
    
    // Add 0x prefix if not present
    if (!privateKey.startsWith("0x")) {
      privateKey = "0x" + privateKey;
    }
    
    return privateKey;
  } catch (error) {
    console.warn("Could not read polygon_private_key.txt:", error.message);
    return null;
  }
}

export default {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    polygon: {
      url: "https://polygon-rpc.com/",
      chainId: 137,
      type: "http",
      accounts: (() => {
        const pk = getPrivateKey();
        return pk ? [pk] : [];
      })(),
    },
  },
};

