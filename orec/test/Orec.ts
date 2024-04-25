import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

async function deployToken() {
  // Contracts are deployed using the first signer/account by default
  const [tokenOwner, otherAccount] = await hre.ethers.getSigners();

  const tokenFactory = await hre.ethers.getContractFactory("MintableToken");
  const token = await tokenFactory.deploy(tokenOwner, "TOKEN", "TOK");
  const tokenAddress = await token.getAddress();

  return { token, tokenOwner, otherAccount, tokenAddress };
}

async function deployOrec() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await hre.ethers.getSigners();

  const { token, tokenOwner, tokenAddress } = await deployToken();

  const Orec = await hre.ethers.getContractFactory("Orec");
  const orec = await Orec.deploy(tokenAddress);

  return { orec, token, tokenOwner, tokenAddress };
}

describe("Orec", function () {
  describe("Deployment", function () {
    it("Should set respectContract", async function () {
      const { orec, token, tokenAddress } = await loadFixture(deployOrec);

      expect(await orec.respectContract()).to.equal(tokenAddress);
    });

  });
});