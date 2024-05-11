import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

// TODO: consistency checks like in the previous respect versions?
describe("Respect1155", function () {
  describe("Deployment", function() {
    it("should set owner");
    it("should set uri");
  })

  describe("mintRespect", function() {
    it("should create non-fungible token with specified token id, value and owner")
    it("should revert if called by account other than the owner of contract")
    it("should increase fungible balance by value of minted token")
    it("should emit appropriate TransferBatch event for both fungible and non-fungible token")
    it("should increase totalRespect by value argument");
    it("should notify a recipient contract by calling onERC1155BatchReceived with correct arguments")
    it("should revert if recipient reverts")
    it("should revert if recipient returns value other than expected magic value")
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
