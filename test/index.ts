import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { assert } from "console";
import { ethers } from "hardhat";
import { MyToken, MyToken__factory } from "../typechain";
// import { MyToken, MyToken__factory } from "../typechain";

describe("MyToken", function () {
  let myToken: MyToken;
  let signers: SignerWithAddress[];

  before(async () => {
    signers = await ethers.getSigners();
  })

  beforeEach(async () => {
    const MyToken = await ethers.getContractFactory("MyToken") as MyToken__factory;
    myToken = await MyToken.deploy() as MyToken;
    await myToken.deployed();
  })


  //проверка view функций
  it("Checking that functions name(), symbol(), symbol(), totalSupply() work correctly", async function () {
    const name = "My Token";
    const symbol = "MTN";
    const decimals = 18;
    expect(await myToken.name()).to.equal(name);
    expect(await myToken.symbol()).to.equal(symbol);
    expect(await myToken.decimals()).to.equal(decimals);

  });

  //проверка функции mint()
  it("Checking function mint() works correctly", async function () {
    const [Bob, John] = signers;
    const amount = 100;
    await expect(myToken.connect(John).mint(John.address, amount)).to.be.revertedWith("only owner can mint new tokens")
    await myToken.mint(Bob.address, amount);
    expect((await myToken.balanceOf(Bob.address))).to.equal(amount)
    expect((await myToken.totalSupply())).to.equal(amount)
  });

  //проверка функции balanceOf()
  it("Checking function balanceOf() works correctly", async function () {
    const [Bob, John] = signers;
    const amountBob = 100;
    const amountJohn = 50;
    expect(await myToken.balanceOf(Bob.address)).to.equal(0);
    expect(await myToken.balanceOf(John.address)).to.equal(0);
    await myToken.mint(Bob.address, amountBob);
    await myToken.mint(John.address, amountJohn);
    expect(await myToken.balanceOf(Bob.address)).to.equal(amountBob);
    expect(await myToken.balanceOf(John.address)).to.equal(amountJohn);
  });

  //проверка функции transfer() и эвента
  it("Checking function transfer() works correctly", async function () {
    const [Bob, John] = signers;
    const amountMint = 100;
    const amountTransfer = 30;
    await expect(myToken.transfer(John.address, amountTransfer)).to.be.revertedWith("lack of balance")
    await myToken.mint(Bob.address, amountMint);
    const tx = await myToken.transfer(John.address, amountTransfer)
    //тестируем эвент Transfer
    await expect(tx).to.emit(myToken, "Transfer").withArgs(Bob.address, John.address, amountTransfer);
    expect(await myToken.balanceOf(Bob.address)).to.equal(amountMint - amountTransfer);
    expect(await myToken.balanceOf(John.address)).to.equal(amountTransfer);
  });

  //проверка функций aprove(), её эвента, а также функций allowance(), increaseAllowance(), decreaseAllowance()
  it("Checking function aprove(), allowance(), increaseAllowance(), decreaseAllowance() work correctly", async function () {
    const [Bob, John] = signers;
    const amount = 100;
    const changingAmount = 10;
    const tx = await myToken.approve(John.address, amount);
    //тестируем эвент Approval
    expect(tx).to.emit(myToken, "Approval").withArgs(Bob.address, John.address, amount)
    expect(await myToken.allowance(Bob.address, John.address)).to.equal(amount)
    await myToken.increaseAllowance(John.address, changingAmount)
    expect(await myToken.allowance(Bob.address, John.address)).to.equal(amount + changingAmount)
    await myToken.decreaseAllowance(John.address, changingAmount)
    expect(await myToken.allowance(Bob.address, John.address)).to.equal(amount + changingAmount - changingAmount)
  });

  //проверка функции transferFrom() 
  it("Checking function transferFrom() works correctly", async function () {
    const [Bob, John] = signers;
    const amount = 100;
    await expect(myToken.connect(John).transferFrom(Bob.address, John.address, amount)).to.be.revertedWith("Not Approved");
    await myToken.approve(John.address, amount)
    await myToken.mint(Bob.address, amount);
    expect(await myToken.balanceOf(Bob.address)).to.equal(amount);
    expect(await myToken.balanceOf(John.address)).to.equal(0);
    await myToken.connect(John).transferFrom(Bob.address, John.address, amount)
    expect(await myToken.balanceOf(Bob.address)).to.equal(0);
    expect(await myToken.balanceOf(John.address)).to.equal(amount);
  });

  //проверка функции burn()
  it("Checking function burn() works correctly", async function () {
    const [Bob, John] = signers;
    const amount = 100;
    await expect(myToken.burn(Bob.address, amount)).to.be.revertedWith("lack of balance");
    await myToken.mint(Bob.address, amount);
    expect((await myToken.balanceOf(Bob.address))).to.equal(amount);
    expect((await myToken.totalSupply())).to.equal(amount);
    await myToken.burn(Bob.address, amount);
    expect((await myToken.balanceOf(Bob.address))).to.equal(0);
    expect((await myToken.totalSupply())).to.equal(0);
  });
});

