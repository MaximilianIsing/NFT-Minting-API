import mint from './mint.js';

/**
 * Example: Mint a sword NFT
 */
async function example() {
  const destinationAddress = "0x0ad71CEf14201B7fC7de53Ff2b4d40B9a96C2813"; // Your address
  const imageUrl = "https://www.iconexperience.com/_img/v_collection_png/256x256/shadow/sword.png"; // 256x256 image
  const traits = {
    name: "Mythic Mega Sword",
    description: "A powerful sword forged in flames",
    attack: 150,
    defense: 75,
    element: "fire",
    rarity: "legendary",
    level: 10,
    durability: 100,
    enchantment: "flame strike"
  };

  try {
    const result = await mint(destinationAddress, imageUrl, traits);
    console.log('✅ NFT minted successfully!');
    console.log('Token ID:', result.tokenId);
    console.log('Transaction:', result.transactionHash);
    console.log('View on PolygonScan:', `https://polygonscan.com/tx/${result.transactionHash}`);
  } catch (error) {
    console.error('❌ Minting failed:', error.message);
  }
}

// Run the example
example();

export default example;

