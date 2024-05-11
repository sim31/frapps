import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { Respect1155 } from "../typechain-types";
import { packTokenId } from "../utils/tokenId";
import { ZeroAddress } from "ethers";

async function deploy() {
  // Contracts are deployed using the first signer/account by default
  const accounts = await hre.ethers.getSigners();

  const owner = accounts[0];
  const uri = "https://somedomain.io/tokens/{id}";

  const Respect = await hre.ethers.getContractFactory("Respect1155");
  const respect = await Respect.deploy(owner, uri);

  const ERC1155Receiver = await hre.ethers.getContractFactory("ERC1155ReceiverLogger");
  const receiver = await ERC1155Receiver.deploy();

  const ERC1155ReceiverReverter = await hre.ethers.getContractFactory("ERC1155ReceiverReverter");
  const recReverter = await ERC1155ReceiverReverter.deploy();

  const ERC1155ReceiverInvalid = await hre.ethers.getContractFactory("ERC1155ReceiverInvalid");
  const recInvalid = await ERC1155ReceiverInvalid.deploy();

  return { respect, owner, accounts, uri, receiver, recReverter, recInvalid };
}

type MintRequest = Respect1155.MintRequestStruct;

function mintRequestStruct(
  to: string,
  value: number,
  periodNumber: number = 0,
  mintType: number = 0
): MintRequest {
  const tokenId = packTokenId({
    owner: to,
    mintType: mintType,
    periodNumber: periodNumber
  });
  return {
    id: tokenId,
    value
  };
}

// TODO: consistency checks like in the previous respect versions?
describe("Respect1155", function () {
  describe("Deployment", function() {
    it("should set owner", async function() {
      const { respect, owner } = await loadFixture(deploy);

      expect(await respect.owner()).to.be.equal(owner);
    });
    it("should set uri", async function() {
      const { respect, uri } = await loadFixture(deploy);

      expect(await respect.uri(0)).to.be.equal(uri);
    });
  })

  describe("mintRespect", function() {
    it("should create non-fungible token with specified token id, value and owner", async function() {
      const { respect, accounts } = await loadFixture(deploy);

      const req = mintRequestStruct(accounts[1].address, 10);
      await expect(respect.mintRespect(req, "0x00")).to.not.be.reverted;

      expect(await respect.ownerOf(req.id)).to.be.equal(accounts[1].address);
      expect(await respect.valueOfToken(req.id)).to.be.equal(10);
    });
    it("should revert if called by account other than the owner of contract", async function() {
      const { respect, accounts } = await loadFixture(deploy);

      const altCaller = await respect.connect(accounts[1]);

      const req = mintRequestStruct(accounts[1].address, 10);
      await expect(altCaller.mintRespect(req, "0x00")).to.be.reverted;
    })
    it("should increase fungible balance by value of minted token", async function() {
      const { respect, accounts } = await loadFixture(deploy);

      const recipient = accounts[2].address;

      const req = mintRequestStruct(recipient, 20);
      await expect(respect.mintRespect(req, "0x00")).to.not.be.reverted;

      expect(await respect.ownerOf(req.id)).to.be.equal(recipient);
      expect(await respect.valueOfToken(req.id)).to.be.equal(20);
      expect(await respect.respectOf(recipient)).to.be.equal(20);
      expect(await respect.balanceOf(recipient, 0)).to.be.equal(20);

      const req2 = mintRequestStruct(recipient, 21, 1);
      await expect(respect.mintRespect(req2, "0x01")).to.not.be.reverted;

      expect(await respect.ownerOf(req2.id)).to.be.equal(recipient);
      expect(await respect.valueOfToken(req2.id)).to.be.equal(21);
      expect(await respect.respectOf(recipient)).to.be.equal(41);
      expect(await respect.balanceOf(recipient, 0)).to.be.equal(41);
    });
    it("should emit appropriate TransferBatch event for both fungible and non-fungible token", async function() {
      const { respect, accounts, owner } = await loadFixture(deploy);

      const recipient = accounts[3].address;

      const req = mintRequestStruct(recipient, 20);

      await expect(respect.mintRespect(req, "0x00"))
        .to.emit(respect, "TransferBatch").withArgs(
          owner.address,
          ZeroAddress,
          recipient,
          [0, req.id],
          [20, 1]
        );

      const req2 = mintRequestStruct(recipient, 2, 1);

      await expect(respect.mintRespect(req2, "0x00"))
        .to.emit(respect, "TransferBatch").withArgs(
          owner.address,
          ZeroAddress,
          recipient,
          [0, req2.id],
          [2, 1]
        );
    })
    it("should increase totalRespect by value argument", async function() {
      const { respect, accounts } = await loadFixture(deploy);

      const recipient = accounts[2].address;

      const req = mintRequestStruct(recipient, 1);
      await expect(respect.mintRespect(req, "0x00")).to.not.be.reverted;

      expect(await respect.totalRespect()).to.be.equal(1);

      const recipient2 = accounts[3].address;
      const req2 = mintRequestStruct(recipient2, 21, 1);
      await expect(respect.mintRespect(req2, "0x01")).to.not.be.reverted;

      expect(await respect.totalRespect()).to.be.equal(22);

      const req3 = mintRequestStruct(recipient, 5, 1);
      await expect(respect.mintRespect(req3, "0x01")).to.not.be.reverted;

      expect(await respect.totalRespect()).to.be.equal(27);
    });

    it("should notify a recipient contract by calling onERC1155BatchReceived with correct arguments", async function() {
      const { respect, receiver, owner } = await loadFixture(deploy);

      const recAddr = await receiver.getAddress();

      const req = mintRequestStruct(recAddr, 5);

      await expect(respect.mintRespect(req, "0x50"))
        .to.emit(receiver, "BatchReceived")
        .withArgs(
          owner.address,
          ZeroAddress,
          [0, req.id],
          [5, 1],
          "0x50"
        );
    });
    it("should revert if recipient reverts", async function() {
      const { respect, recReverter, owner } = await loadFixture(deploy);

      const recAddr = await recReverter.getAddress();

      const req = mintRequestStruct(recAddr, 5);

      await expect(respect.mintRespect(req, "0x50")).to.be.reverted;
    });
    it("should revert if recipient returns value other than expected magic value", async function() {
      const { respect, recInvalid, owner } = await loadFixture(deploy);

      const recAddr = await recInvalid.getAddress();

      const req = mintRequestStruct(recAddr, 5);

      await expect(respect.mintRespect(req, "0x50")).to.be.reverted;
    });
  });

  describe("mintRespectGroup", function() {
    it("should create non-fungible tokens with specified token ids, values and owners")
    it("should revert if called by account other than the owner of contract")
    it("should increase fungible balances by value of minted tokens")
    it("should emit appropriate TransferBatch event for both fungible and non-fungible tokens")
    it("should notify a recipient contracts by calling onERC1155BatchReceived with correct arguments")
    it("should revert if any of recipients reverts")
    it("should revert if any recipients return value other than expected magic value")
  });

  describe("burnRespect", function() {
    it("should delete a non-fungible token with specified id");
    it("should revert if called by account other than the owner of contract");
    it("should decrease fungible balance by value of burned token");
    it("should emit appropriate TransferBatch event for both fungible and non-fungible tokens")
    it("should decrease totalRespect by value of burned token")
  });

  describe("burnRespectGroup", function() {
    it("should delete non-fungible tokens with specified ids");
    it("should revert if called by account other than the owner of contract");
    it("should decrease fungible balances by values of burned tokens");
    it("should emit appropriate TransferBatch event for both fungible and non-fungible tokens")
    it("should decrease totalRespect by sum of values of burned tokens")

  });

  describe("setURI", function() {
    it("should change URI for existing tokens");
  })
});
