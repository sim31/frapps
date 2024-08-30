// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * Only used for testing Orec
 */
contract MintableToken is Ownable, ERC20, ERC165 {
    constructor(
      address owner,
      string memory name_,
      string memory symbol_
    ) ERC20(name_, symbol_) Ownable(owner) { }

    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IERC20).interfaceId ||
               super.supportsInterface(interfaceId);
    }
}