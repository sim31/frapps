import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs.js";
import { expect } from "chai";
import hre from "hardhat";
import { Respect1155 } from "../typechain-types/contracts/Respect1155.js";
import { normTokenIdData, packTokenId, unpackTokenId } from "../utils/tokenId";
import { ZeroAddress, hexlify } from "ethers";

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

async function deploy() {
  // Contracts are deployed using the first signer/account by default
  const accounts = await hre.ethers.getSigners();

  const owner = accounts[0];
  const uri = "https://somedomain.io/tokens/{id}";
  const contractURI = "https://somedomain.io/contractURI"

  const Respect = await hre.ethers.getContractFactory("Respect1155");
  const respect = await Respect.deploy(owner, uri, contractURI);

  const ERC1155Receiver = await hre.ethers.getContractFactory("ERC1155ReceiverLogger");
  const receiver = await ERC1155Receiver.deploy();

  const ERC1155ReceiverReverter = await hre.ethers.getContractFactory("ERC1155ReceiverReverter");
  const recReverter = await ERC1155ReceiverReverter.deploy();

  const ERC1155ReceiverInvalid = await hre.ethers.getContractFactory("ERC1155ReceiverInvalid");
  const recInvalid = await ERC1155ReceiverInvalid.deploy();

  return { respect, owner, accounts, uri, receiver, recReverter, recInvalid, contractURI };
}

async function deployAndMint() {
  const fixt = await loadFixture(deploy);
  const { respect, accounts } = fixt;

  const mints: MintRequest[] = [];
  mints.push(mintRequestStruct(accounts[0].address, 5, 0));
  mints.push(mintRequestStruct(accounts[1].address, 8, 0));
  mints.push(mintRequestStruct(accounts[2].address, 13, 0));
  mints.push(mintRequestStruct(accounts[3].address, 21, 0));
  mints.push(mintRequestStruct(accounts[4].address, 34, 0));

  mints.push(mintRequestStruct(accounts[4].address, 5, 1));
  mints.push(mintRequestStruct(accounts[3].address, 8, 1));
  mints.push(mintRequestStruct(accounts[2].address, 13, 1));
  mints.push(mintRequestStruct(accounts[1].address, 21, 1));
  mints.push(mintRequestStruct(accounts[0].address, 34, 1));

  for (const mint of mints) {
    await expect(respect.mintRespect(mint, "0x00")).to.not.be.reverted;
  }

  return { ...fixt, mints };
}


// TODO: consistency checks like in the previous respect versions?
describe("Respect1155", function () {
  describe("Deployment", function() {
    it("should set owner", async function() {
      const { respect, owner } = await loadFixture(deploy);

      expect(await respect.owner()).to.be.equal(owner);
    });
    it("should set uri", async function() {
      const { respect, uri, contractURI } = await loadFixture(deploy);

      expect(await respect.uri(0)).to.be.equal(uri);
      expect(await respect.contractURI()).to.be.equal(contractURI);
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
    it("should not allow minting tokenId which already exists", async function() {
      const { respect, accounts } = await loadFixture(deploy);

      const req = mintRequestStruct(accounts[1].address, 10);
      await expect(respect.mintRespect(req, "0x00")).to.not.be.reverted;

      const req2 = mintRequestStruct(accounts[1].address, 11);
      await expect(respect.mintRespect(req, "0x00")).to.be.reverted;
    });
    it("should not allow minting to zero address", async function() {
      const { respect, accounts } = await loadFixture(deploy);

      const req = mintRequestStruct(ZeroAddress, 10);
      await expect(respect.mintRespect(req, "0x00")).to.be.reverted;

    })
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
    it("should delete a non-fungible token with specified id", async function() {
      const { respect, mints } = await loadFixture(deployAndMint);

      expect(await respect.tokenExists(mints[0].id)).to.be.true;
      expect(await respect.valueOfToken(mints[0].id)).to.be.equal(mints[0].value);
      await expect(respect.burnRespect(mints[0].id, "0x00")).to.not.be.reverted;
      expect(await respect.tokenExists(mints[0].id)).to.be.false;
      expect(await respect.valueOfToken(mints[0].id)).to.be.equal(0);

      expect(await respect.tokenExists(mints[8].id)).to.be.true;
      expect(await respect.valueOfToken(mints[8].id)).to.be.equal(mints[8].value);
      await expect(respect.burnRespect(mints[8].id, "0x00")).to.not.be.reverted;
      expect(await respect.tokenExists(mints[8].id)).to.be.false;
      expect(await respect.valueOfToken(mints[8].id)).to.be.equal(0);
    });
    it("should revert if trying to burn non-existent token", async function() {
      const { respect, mints, accounts } = await loadFixture(deployAndMint);

      const req = mintRequestStruct(accounts[10].address, 50);

      await expect(respect.burnRespect(req.id, "0x00")).to.be.reverted;
    });
    it("should revert if called by account other than the owner of contract", async function() {
      const { respect, mints, accounts } = await loadFixture(deployAndMint);

      const altCaller = await respect.connect(accounts[2]);

      expect(await altCaller.tokenExists(mints[0].id)).to.be.true;
      expect(await altCaller.valueOfToken(mints[0].id)).to.be.equal(mints[0].value);
      await expect(altCaller.burnRespect(mints[0].id, "0x00")).to.be.reverted;

      expect(await altCaller.tokenExists(mints[8].id)).to.be.true;
      expect(await altCaller.valueOfToken(mints[8].id)).to.be.equal(mints[8].value);
      await expect(altCaller.burnRespect(mints[8].id, "0x00")).to.be.reverted;

    });
    it("should decrease fungible balance by value of burned token", async function() {
      const { respect, mints } = await loadFixture(deployAndMint);

      expect(await respect.tokenExists(mints[0].id)).to.be.true;
      expect(await respect.valueOfToken(mints[0].id)).to.be.equal(mints[0].value);
      const tokenIdData = normTokenIdData(unpackTokenId(mints[0].id));
      const balance = await respect.respectOf(tokenIdData.owner);
      expect(await respect.balanceOf(tokenIdData.owner, 0)).to.be.equal(balance);
      await expect(respect.burnRespect(mints[0].id, "0x00")).to.not.be.reverted;
      const newBalance = await respect.respectOf(tokenIdData.owner);
      expect(await respect.balanceOf(tokenIdData.owner, 0)).to.be.equal(newBalance);
      expect(balance - newBalance).to.be.equal(mints[0].value);
    });
    it("should emit appropriate TransferBatch event for both fungible and non-fungible tokens", async function() {
      const { respect, mints, owner, accounts } = await loadFixture(deployAndMint);

      await expect(respect.burnRespect(mints[0].id, "0x00"))
        .to.emit(respect, "TransferBatch")
        .withArgs(
          owner, accounts[0], ZeroAddress, [0, mints[0].id], [mints[0].value, 1]
        );

      await expect(respect.burnRespect(mints[5].id, "0x00"))
        .to.emit(respect, "TransferBatch")
        .withArgs(
          owner, accounts[4], ZeroAddress, [0, mints[5].id], [mints[5].value, 1]
        );
    });
    it("should decrease totalRespect by value of burned token", async function() {
      const { respect, mints } = await loadFixture(deployAndMint);

      const supplyBefore = await respect.totalRespect();
      const burnedValue = await respect.valueOfToken(mints[0].id);
      await expect(respect.burnRespect(mints[0].id, "0x00")).to.not.be.reverted;
      const newSupply = await respect.totalRespect();
      expect(newSupply).to.be.equal(supplyBefore - burnedValue);

      const burnedValue2 = await respect.valueOfToken(mints[9].id);
      await expect(respect.burnRespect(mints[9].id, "0x00")).to.not.be.reverted;
      const newSupply2 = await respect.totalRespect();
      expect(newSupply2).to.be.equal(newSupply - burnedValue2);
    });

    it("should not allow burning tokenId = 0 (fungible token)", async function() {
      const { respect } = await loadFixture(deployAndMint);

      await expect(respect.burnRespect(0, "0x00")).to.be.reverted;
    });
  });

  describe("burnRespectGroup", function() {
    it("should delete non-fungible tokens with specified ids");
    it("should revert if called by account other than the owner of contract");
    it("should decrease fungible balances by values of burned tokens");
    it("should emit appropriate TransferBatch event for both fungible and non-fungible tokens")
    it("should decrease totalRespect by sum of values of burned tokens")

  });

  describe("setURI", function() {
    it("should change URI for existing tokens", async function() {
      const { respect, mints } = await loadFixture(deployAndMint);

      const uriBefore = await respect.uri(mints[9].id);
      const newURI = "https://newaddr.io/tokens/{id}";

      await expect(respect.setURI(newURI)).to.not.be.reverted;

      expect(await respect.uri(mints[9].id))
        .to.be.equal(newURI)
        .and.not.be.equal(uriBefore);
    });

    it("should not allow changing URI for non-owner of contract", async function() {
      const { respect, mints, accounts } = await loadFixture(deployAndMint);

      const altCaller = await respect.connect(accounts[5]);

      const newURI = "https://newaddr.io/tokens/{id}";
      await expect(altCaller.setURI(newURI)).to.be.reverted;
    })
  })

  describe("setContractURI", function() {
    it("should change contract URI if called by owner", async function() {
      const { respect, mints } = await loadFixture(deployAndMint);

      const uriBefore = await respect.uri(mints[9].id);
      const newURI = "https://newaddr.io/contractURI";

      await expect(respect.setContractURI(newURI)).to.not.be.reverted;

      expect(await respect.contractURI())
        .to.be.equal(newURI)
        .and.not.be.equal(uriBefore);
    });

    it("should not allow changing contract URI for non-owner of contract", async function() {
      const { respect, mints, accounts } = await loadFixture(deployAndMint);

      const altCaller = await respect.connect(accounts[5]);

      const newURI = "https://newaddr.io/a";
      await expect(altCaller.setURI(newURI)).to.be.reverted;
    })
  })

  describe("balanceOfBatch", function() {
    it("should return fungible balance of multiple accounts when ids are all 0 (fungibleId)", async function() {
      const { respect, accounts } = await loadFixture(deployAndMint);

      // see deployAndMint
      const accs = [
        accounts[0].address,
        accounts[1].address,
        accounts[2].address,
        accounts[3].address,
        accounts[4].address,
      ]
      const ids = [0, 0, 0, 0, 0];
      expect(await respect.balanceOfBatch(accs, ids)).to.deep.equal(
        [
          39,
          29,
          26,
          29,
          39
        ]
      );
    })   
  });

  describe("respectOfBatch", function() {
    it("should return fungible balance of multiple accounts", async function() {
      const { respect, accounts } = await loadFixture(deployAndMint);

      // see deployAndMint
      const accs = [
        accounts[0].address,
        accounts[1].address,
        accounts[2].address,
        accounts[3].address,
        accounts[4].address,
        accounts[15].address
      ]
      expect(await respect.respectOfBatch(accs)).to.deep.equal(
        [
          39,
          29,
          26,
          29,
          39,
          0
        ]
      );
    })   
  });

  describe("sumRespectOf", function() {
    it("should return respect summed from specified accounts", async function() {
      const { respect, accounts } = await loadFixture(deployAndMint);

      // see deployAndMint
      const accs = [
        accounts[0].address,
        accounts[1].address,
        accounts[2].address,
        accounts[3].address,
        accounts[4].address,
        accounts[15].address
      ]
      expect(await respect.sumRespectOf(accs)).to.equal(
        [
          39,
          29,
          26,
          29,
          39,
          0
        ].reduce((prev, current) => { return prev + current })
      );
    });
  })

  describe("safeTransferFrom", function() {
    it("should revert when trying to transfer fungible balance", async function() {
      const { respect, accounts } = await loadFixture(deployAndMint);

      const altCaller = respect.connect(accounts[4]);

      await expect(altCaller.safeTransferFrom(
        accounts[4].address, accounts[12].address, 0, 5, "0x00"
      )).to.be.reverted;
    });

    it("should revert if trying to transfer non-fungible token", async function() {
      const { respect, accounts, mints } = await loadFixture(deployAndMint);

      const altCaller = respect.connect(accounts[0]);

      expect(unpackTokenId(mints[0].id).owner).to.be.equal(hexlify(accounts[0].address));
      await expect(altCaller.safeTransferFrom(
        accounts[0].address, accounts[12].address, mints[0].id, 5, "0x00"
      )).to.be.reverted;
    });
  });

  describe("safeTransferFrom", function() {
    it("should revert when trying to transfer fungible balance", async function() {
      const { respect, accounts } = await loadFixture(deployAndMint);

      const altCaller = respect.connect(accounts[4]);

      await expect(altCaller.safeBatchTransferFrom(
        accounts[4].address, accounts[12].address, [0, 0], [2, 2], "0x00"
      )).to.be.reverted;
    });

    it("should revert if trying to transfer non-fungible token", async function() {
      const { respect, accounts, mints } = await loadFixture(deployAndMint);

      const altCaller = respect.connect(accounts[0]);

      expect(unpackTokenId(mints[0].id).owner).to.be.equal(hexlify(accounts[0].address));
      await expect(altCaller.safeBatchTransferFrom(
        accounts[0].address, accounts[12].address, [mints[0].id, mints[9].id], [1, 1], "0x00"
      )).to.be.reverted;
    });
  })
});
