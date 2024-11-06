// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

/**
 * Contract for testing out-of-gas failures in inner calls.
 */
contract GasUser {

    uint256[] public data;

    constructor() payable {}

    function useGas(uint256 count) public {
        for (uint i = 0; i < count; i++) {
            data.push(i);
        }
    }
}