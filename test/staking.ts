import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { assert } from "console";
import { ethers, network } from "hardhat";
import { LpToken, LpToken__factory, MyToken, MyToken__factory, Staking, Staking__factory } from "../typechain";

describe("MyToken", function () {
  let staking: Staking;
  let myToken: MyToken;
  let lpToken: LpToken;
  const mintedMTN = 1000;
  const mintedLPT = 500;

  let investor: SignerWithAddress,
    alice: SignerWithAddress;

  before(async () => {
    [investor, alice] = await ethers.getSigners();
  })

  beforeEach(async () => {
    const MyToken = await ethers.getContractFactory("MyToken") as MyToken__factory;
    myToken = await MyToken.deploy() as MyToken;
    await myToken.deployed();

    const LpToken = await ethers.getContractFactory("LpToken") as LpToken__factory;
    lpToken = await LpToken.deploy("lpToken", "LPT") as LpToken;
    await lpToken._mint(investor.address, mintedLPT);
    await lpToken.deployed();

    const Staking = await ethers.getContractFactory("Staking") as Staking__factory;
    staking = await Staking.deploy(myToken.address, lpToken.address) as Staking;
    await staking.deployed();
    //mint reward's tokens to "Stake" contract
    await myToken.mint(staking.address, mintedMTN)
  })

  it("checking that contract has reward tokens", async function () {
    expect(await myToken.balanceOf(staking.address)).to.be.equal(mintedMTN);
  })

  it("checking that investor has LPT tokens to invest", async function () {
    expect(await lpToken.balanceOf(investor.address)).to.be.equal(mintedLPT);
  })

  it("checking that investor doesn't have reward tokens before investing", async function () {
    expect(await myToken.balanceOf(investor.address)).to.be.equal(0);
  })

  it("checking that allowance() after calling approve() is correct ", async function () {
    const amount = 100;
    await lpToken.approve(staking.address, amount);
    expect(await lpToken.allowance(investor.address, staking.address)).to.be.equal(amount);
  })

  it("checking that can't stake `0`", async function () {
    const amountToStake = 0;
    await lpToken.approve(staking.address, amountToStake + 1);
    await expect(staking.stake(amountToStake)).to.be.revertedWith("nothing to stake");
  })

  it("checking that after executing stake() investor and contract balances are correct", async function () {
    const amountToStake = 100;
    await lpToken.approve(staking.address, amountToStake);
    await staking.stake(amountToStake);
    expect((await staking.stakingDatas(investor.address)).value).to.be.equal(amountToStake);
    expect(await lpToken.balanceOf(investor.address)).to.be.equal(mintedLPT - amountToStake)
    expect(await lpToken.balanceOf(staking.address)).to.be.equal(amountToStake)
    expect((await staking.stakingDatas(investor.address)).value).to.be.equal(amountToStake);
    expect(await myToken.balanceOf(investor.address)).to.be.equal(0)
  })


  it("checking that restaking leads to summarazing balances without rewards (TimeLock isn't out", async function () {
    const allowance = 200;
    const amountToStake = 100;
    await lpToken.approve(staking.address, allowance);
    await staking.stake(100);
    await staking.stake(100);
    expect((await staking.stakingDatas(investor.address)).value).to.be.equal(amountToStake * 2);
    expect(await lpToken.balanceOf(investor.address)).to.be.equal(mintedLPT - amountToStake * 2)
    expect(await lpToken.balanceOf(staking.address)).to.be.equal(amountToStake * 2);
    //check that rewards didn't pay
    expect(await myToken.balanceOf(staking.address)).to.be.equal(mintedMTN)
    expect(await myToken.balanceOf(investor.address)).to.be.equal(0)
  })

  it("checking that restaking leads to summarazing balances and getting rewards(TimeLock is out)", async function () {
    const allowance = 200;
    const amountToStake = 100;
    const interest = Number(await staking.interest() / 100);
    const timeLock = Number(await staking.interestTime()) * 60;
    await lpToken.approve(staking.address, allowance);
    await staking.stake(100);
    //waiting timelock is out
    await network.provider.send("evm_increaseTime", [timeLock]);
    await network.provider.send("evm_mine");
    await staking.stake(100);
    expect((await staking.stakingDatas(investor.address)).value).to.be.equal(amountToStake * 2);
    expect(await lpToken.balanceOf(investor.address)).to.be.equal(mintedLPT - amountToStake * 2)
    expect(await myToken.balanceOf(staking.address)).to.be.equal(mintedMTN - amountToStake * interest)
    expect(await myToken.balanceOf(investor.address)).to.be.equal(amountToStake * interest)
  })

  it("should revert if account doesn't stake (claim())", async function () {
    const timeLock = Number(await staking.interestTime()) * 60;
    await network.provider.send("evm_increaseTime", [timeLock]);
    await network.provider.send("evm_mine");
    await expect(staking.claim()).to.be.revertedWith("you don't stake");
  })

  it("should revert  if timelock is not out (Claim())", async function () {
    const timeLock = Number(await staking.interestTime()) * 60;
    const amountToStake = 100;
    await lpToken.approve(staking.address, amountToStake);
    await staking.stake(amountToStake)
    //timelock is not out
    await network.provider.send("evm_increaseTime", [timeLock - 1]);
    await network.provider.send("evm_mine");
    await expect(staking.claim()).to.be.revertedWith("You should stake more time");

  })

  it("checking investor and contract balances are correct after calling claim() (timelock is out) ", async function () {
    const interest = Number(await staking.interest() / 100);
    const timeLock = Number(await staking.interestTime()) * 60;
    const amountToStake = 100;
    await lpToken.approve(staking.address, amountToStake);
    await staking.stake(amountToStake);
    //timelock is not out
    await network.provider.send("evm_increaseTime", [timeLock]);
    await network.provider.send("evm_mine");
    await staking.claim();
    expect(await myToken.balanceOf(staking.address)).to.be.equal(mintedMTN - amountToStake * interest)
    expect(await myToken.balanceOf(investor.address)).to.be.equal(amountToStake * interest)
  })


  it("should revert if timelock isn't out (Unstake)", async function () {
    const timeLock = Number(await staking.freezTime()) * 60;
    const amountToStake = 100;
    await lpToken.approve(staking.address, amountToStake);
    await staking.stake(amountToStake);
    //timelock is not out
    await network.provider.send("evm_increaseTime", [timeLock - 1]);
    await network.provider.send("evm_mine");
    await expect(staking.unstake()).to.be.revertedWith("You will able unstake after certain time");
  })

  it("should revert if account doesn't stake (Unstake)", async function () {
    const timeLock = Number(await staking.freezTime()) * 60;
    await network.provider.send("evm_increaseTime", [timeLock]);
    await network.provider.send("evm_mine");
    await expect(staking.unstake()).to.be.revertedWith("you don't stake");
  })

  it("checking investor and contract balances after Unstake", async function () {
    const timeLock = Number(await staking.freezTime()) * 60;
    const amountToStake = 100;
    await lpToken.approve(staking.address, amountToStake);
    await staking.stake(amountToStake);
    //timelock is not out
    await network.provider.send("evm_increaseTime", [timeLock]);
    await network.provider.send("evm_mine");
    await staking.unstake();
    expect(await lpToken.balanceOf(investor.address)).to.be.equal(mintedLPT);
    expect(await lpToken.balanceOf(staking.address)).to.be.equal(0);

  })

  it("should revert if not an admin  (adminChangeConditions)", async function () {
    const _interestTime = 30;
    const _freezTime = 40;
    const _interest = 50;
    await expect(staking.connect(alice).adminChangeConditions(_interest, _freezTime, _interestTime)).to.be.revertedWith("not an Owner");
  });


  it("should revert if interest more than 100 or less then 1(adminChangeConditions)", async function () {
    await expect(staking.adminChangeConditions(0, 10, 10)).to.be.revertedWith("interest must be from 1 to 100");
    await expect(staking.adminChangeConditions(101, 10, 10)).to.be.revertedWith("interest must be from 1 to 100");

  });

  it("should change timelock for claim (admin)", async function () {
    const _interestTime = 30;
    const _freezTime = 40;
    const _interest = 50;
    await staking.adminChangeConditions(_interest, _freezTime, _interestTime);
    const interestTime = await staking.interestTime();
    const freezTime = await staking.freezTime();
    const interest = await staking.interest();
    expect(interestTime).to.be.equal(_interestTime);
    expect(freezTime).to.be.equal(_freezTime);
    expect(interest).to.be.equal(_interest);
  });

});

