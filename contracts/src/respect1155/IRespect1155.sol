// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@ordao/orec/contracts/IRespect.sol";

/**
 * @title Interface for Respect tokens
 */
interface IRespect1155 is IERC1155, IRespect {
    /**
     * @notice Returns the amount of Respect a particular NTT carries
     * @dev Must throw if `tokenId` is 0
     */
    function valueOfToken(uint256 tokenId) external view returns (uint64);

    /**
     * @dev Returns the number of *fungible* Respect ``account`` has.
     * This has to be equal to the sum of values of all the NTTs he has (see ``valueOfToken``) 
     */
    function respectOf(address account) external view returns (uint256);

    /**
     * @dev Returns the number of *fungible* Respect ``accounts`` have.
     * This has to be equal to the sum of values of all the NTTs they have (see ``valueOfToken``) 
     */
    function respectOfBatch(address[] calldata accounts) external view returns (uint256[] memory);

    /**
     * @dev Returns the sum of *fungible* Respect ``accounts`` have together.
     * This has to be equal to the sum of values of all the NTTs this group has (see ``valueOfToken``) 
     */
    function sumRespectOf(address[] calldata accounts) external view returns (uint256);

    /**
     * @dev Returns the total amount of *fungible* Respect
     * This has to be equal to the sum of values of all the NTTs issued (see ``valueOfToken``)
     */
    function totalRespect() external view returns (uint256);

    /**
     * @dev If `id` is 0 - returns amount of fungible respect owned by account
     * If `id` is non-fungible respect token owned by `account` then return 1
     * Else return 0.
     */
    function balanceOf(address account, uint256 id) external view override returns (uint256);

    /**
     * @dev Must throw
     */
    function setApprovalForAll(address operator, bool approved) external override;

    /**
     * @dev Must throw
     */
    function isApprovedForAll(address account, address operator) external override view returns (bool);

    /**
     * @dev Must throw
     */
    function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external override;

    /**
     * @dev Must throw
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override;
}
