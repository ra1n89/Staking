// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy("0xcbbF5F94A1Bef4B9F70EeD253691a260AafcC2F0", "0xbec9eaea4726565b4d15ec33b23bee08ad919b4e");
  //0xcbbF5F94A1Bef4B9F70EeD253691a260AafcC2F0(MTN TOKEN)
  //0xbec9eaea4726565b4d15ec33b23bee08ad919b4e UNI-V2
  await staking.deployed();
  //ethers.getContractAt("MyToken", )
  console.log("Staking deployed to:", staking.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
