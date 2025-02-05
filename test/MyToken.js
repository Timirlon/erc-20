const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let MyToken, myToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the MyToken contract with an initial supply of 1000 tokens
    MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy(1000); // Pass initial supply

    await myToken.waitForDeployment(); // Hardhat v3+ requires this instead of `.deployed()`
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await myToken.name()).to.equal("ErcAssToken");
      expect(await myToken.symbol()).to.equal("EATKN");
    });

    it("Should have correct decimals", async function () {
      expect(await myToken.decimals()).to.equal(18);
    });

    it("Should assign total supply to owner", async function () {
      const ownerBalance = await myToken.balanceOf(owner.address);
      const totalSupply = await myToken.totalSupply();
      expect(ownerBalance).to.equal(totalSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await myToken.transfer(addr1.address, 50);
      expect(await myToken.balanceOf(addr1.address)).to.equal(50);

      await myToken.connect(addr1).transfer(addr2.address, 20);
      expect(await myToken.balanceOf(addr2.address)).to.equal(20);
    });

    it("Should fail if sender doesn’t have enough balance", async function () {
        await expect(myToken.connect(addr1).transfer(owner.address, 1))
          .to.be.reverted;
      });

    it("Should update transaction history correctly", async function () {
      await myToken.transfer(addr1.address, 100);
      await myToken.connect(addr1).transfer(addr2.address, 50);

      const latestSender = await myToken.getLatestTransactionSender();
      const latestReceiver = await myToken.getLatestTransactionReceiver();
      expect(latestSender).to.equal(addr1.address);
      expect(latestReceiver).to.equal(addr2.address);
    });
  });

  describe("Transaction History Functions", function () {
    it("Should retrieve correct transaction details", async function () {
      await myToken.transfer(addr1.address, 200);
      await myToken.connect(addr1).transfer(addr2.address, 100);

      const [sender, receiver, amount, timestamp] = await myToken.getTransaction(1);
      expect(sender).to.equal(addr1.address);
      expect(receiver).to.equal(addr2.address);
      expect(amount).to.equal(100);
      expect(timestamp).to.be.a("bigint");
    });

    it("Should revert if transaction index is invalid", async function () {
      await expect(myToken.getTransaction(99)).to.be.revertedWith("Invalid transaction index");
    });

    it("Should get correct timestamp of latest transaction", async function () {
      await myToken.transfer(addr1.address, 50);
      const timestamp = await myToken.getLatestTransactionTimestamp();
      expect(timestamp).to.include("Timestamp: "); // Checks if function formats correctly
    });
  });
});
