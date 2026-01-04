/** @type import('hardhat/config').HardhatUserConfig */
const fs = require("fs");
const path = require("path");

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

module.exports = {
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
      accounts: (() => {
        const pk = getPrivateKey();
        return pk ? [pk] : [];
      })(),
    },
  },
};
