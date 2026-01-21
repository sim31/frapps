// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "erc5192/src/IERC5192.sol";

/**
 * @title Interface for Respect tokens
 * @dev This is non-transferrable token (NTT) smart contract, based on ERC721, where
 * each NTT has a value field. The total amount of Respect someone owns is given
 * by summing values of all Respect NTTs he owns.
 * `balanceOf` and `totalSupply` functions provide an interface of a fungible (ERC20-like, but non-transferrable) token.
 */
interface IRespect is IERC721Enumerable, IERC721Metadata, IERC5192 {
    /**
     * @dev Returns the amount of Respect a particular NTT carries
     */
    function valueOfToken(uint256 tokenId) external view returns (uint64);

    /**
     * @dev Returns the number of *fungible* Respect ``owner`` owns.
     * This has to be equal to the sum of values of all the NTTs he owns (see ``valueOfToken``) 
     */
    function balanceOf(address owner) external view override returns (uint256 balance);

    /**
     * @dev Returns the total amount of *fungible* Respect
     * This has to be equal to the sum of values of all the NTTs issued (see ``valueOfToken``)
     */
    function totalSupply() external view override returns (uint256);

    /**
     * @dev Returns the amount of NTTs issued. Can include NTT already burned.
     */
    function tokenSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of NTTs issued to owner
     */
    function tokenSupplyOfOwner(address owner) external view returns (uint256);

    /**
     * @dev Must throw
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external override;

    /**
     * @dev Must throw
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external override;

    /**
     * @dev Must throw
     */
    function transferFrom(address from, address to, uint256 tokenId) external override;

    /**
     * @dev Must throw
     */
    function approve(address to, uint256 tokenId) external override;

    /**
     * @dev Must throw
     */
    function setApprovalForAll(address operator, bool approved) external override;

    /**
     * @dev Must throw
     */
    function getApproved(uint256 tokenId) external override view returns (address operator);

    /**
     * @dev Must throw
     */
    function isApprovedForAll(address owner, address operator) external override view returns (bool);
}
