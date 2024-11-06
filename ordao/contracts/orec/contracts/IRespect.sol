// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Interface for respect tokens from Orec perspective.
 * Contract which act as respectContract in Orec should support this.
 */
interface IRespect is IERC165 {
    /**
     * @dev Returns the number of *fungible* Respect ``account`` has.
     */
    function respectOf(address account) external view returns (uint256);
}