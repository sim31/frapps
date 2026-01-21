// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./IRespect.sol";

/**
 * Only used for testing Orec
 */
contract MintableRespectToken is IRespect, Ownable, ERC20, ERC165 {
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

    function respectOf(address account) public view returns (uint256) {
      return balanceOf(account);
    }

    function respectInterfaceId() external pure returns (bytes4) {
      return type(IRespect).interfaceId;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC20).interfaceId ||
               interfaceId == type(IRespect).interfaceId ||
               super.supportsInterface(interfaceId);
    }
}