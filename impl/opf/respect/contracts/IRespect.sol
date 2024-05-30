// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

interface IRespect is IERC1155 {

    /**
     * @notice Mints `value` amount of Respect to `to` 
     */
    function mint(address to, uint256 value, uint256 mintId) external;
  
}