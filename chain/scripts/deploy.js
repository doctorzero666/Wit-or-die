const hre = require("hardhat");

async function main() {
  const GamePool = await hre.ethers.getContractFactory("GamePool");
  const gamePool = await GamePool.deploy();
  await gamePool.waitForDeployment();

  const address = await gamePool.getAddress();
  console.log("GamePool deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
