// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@ordao/orec/contracts/IRespect.sol";

contract SolidRespect is IRespect, IERC20, IERC20Metadata, IERC20Errors, ERC165 {
    mapping(address account => uint256) private _balances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    error OpNotSupported();

    constructor(
        string memory name_,
        string memory symbol_,
        address[] memory addresses,
        uint256[] memory balances
    ) {
        _name = name_;
        _symbol = symbol_;

        require(addresses.length == balances.length, "Address and balance arrays must have the same length.");
        for (uint i = 0; i < addresses.length; i++) {
            uint256 balance = balances[i];
            _balances[addresses[i]] = balance;
            _totalSupply += balance;
        }
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual returns (uint8) {
        return 0;
    }

    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    function respectOf(address account) public view virtual returns (uint256) {
        return balanceOf(account);
    }

    function transfer(address, uint256) public virtual returns (bool) {
        revert OpNotSupported();
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address, address) public view virtual returns (uint256) {
        revert OpNotSupported();
    }

    function approve(address, uint256) public virtual returns (bool) {
        revert OpNotSupported();
    }

    function transferFrom(address, address, uint256) public virtual returns (bool) {
        revert OpNotSupported();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC165, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC20).interfaceId
        || interfaceId == type(IRespect).interfaceId
        || super.supportsInterface(interfaceId);
    }
}