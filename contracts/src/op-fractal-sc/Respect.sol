// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.9;

import "./IRespect.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * 256 bits (32 bytes):
 * First least-significant 20 bytes is address (owner of an NTT).
 */
type TokenId is uint256;

function ownerFromTokenId(TokenId packed) pure returns (address) {
    uint160 i = uint160(TokenId.unwrap(packed));
    return address(i);
}

abstract contract Respect is IRespect, ERC165, Initializable {
    using Strings for uint256;

    error OpNotSupported();

    string private _name;
    string private _symbol;

    mapping(address => uint256) private _balances;
    mapping(TokenId => uint64) private _values;
    /// Tokens indexed here can have 0 value in _values. This means that this NTT was burned
    TokenId[] private _tokenByIndex;
    /// Tokens indexed here can have 0 value in _values. This means that this NTT was burned
    mapping(address => TokenId[]) private _tokenByOwnerIndex;

    uint private _totalSupply;

    function __Respect_init(string memory name_, string memory symbol_) public onlyInitializing {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function valueOfToken(uint256 tokenId) public view override returns (uint64) {
        uint64 v = _valueOf(TokenId.wrap(tokenId));
        return v;
    }

    function ownerOf(uint256 tokenId) public pure override returns (address) {
        address owner = _ownerOf(tokenId);
        // To be compatible with ERC721
        require(owner != address(0), "invalid token ID");
        return owner;
    }

    function tokenExists(uint256 tokenId) public view returns(bool) {
        uint64 v = _valueOf(TokenId.wrap(tokenId));
        return v != 0;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function tokenSupply() public view override returns (uint256) {
        return _tokenByIndex.length;
    }

    function tokenSupplyOfOwner(address owner) public view returns (uint256) {
        return _tokenByOwnerIndex[owner].length;
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view override returns (uint256) {
        TokenId[] storage ownedTokens = _tokenByOwnerIndex[owner];
        require(index < ownedTokens.length, "No token by this index");
        return TokenId.unwrap(ownedTokens[index]);
    }

    function tokenByIndex(uint256 index) public view override returns (uint256) {
        require(index < _tokenByIndex.length, "No token by this index");
        return TokenId.unwrap(_tokenByIndex[index]);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        _requireExisting(tokenId);

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    function locked(uint256) external override pure returns (bool) {
        return true;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC165, IERC165)
        returns (bool)
    {
        // This contract also has some ERC20 and ERC721 functions but it does not support transfers
        return interfaceId == type(IERC5192).interfaceId
        || interfaceId == type(IRespect).interfaceId
        || super.supportsInterface(interfaceId);
    }


    function _ownerOf(uint256 tokenId) internal pure returns (address) {
        return ownerFromTokenId(TokenId.wrap(tokenId));
    }

    function _valueOf(TokenId tokenId) internal view returns (uint64) {
        uint64 v = _values[tokenId];
        return v;
    }

    function _mint(TokenId tokenId, uint64 value) internal virtual {
        address to = ownerFromTokenId(tokenId);
        uint256 tId = TokenId.unwrap(tokenId);

        require(to != address(0), "cannot mint to the zero address");
        require(!tokenExists(tId), "token id already minted");

        _beforeMint(tokenId, value);

        // Check that token was not minted by _beforeMint hook
        require(!tokenExists(tId), "token id already minted");

        _totalSupply += value;
        unchecked {
            // Overflow not possible: balance + amount is at most totalSupply + amount, which is checked above.
            _balances[to] += value;
        }

        _values[tokenId] = value;
        _tokenByIndex.push(tokenId);
        // TODO: maybe this function would better receive unpacked tokenId
        _tokenByOwnerIndex[to].push(tokenId);

        emit Transfer(address(0), to, tId);
        // TODO: do we really need this? (ERC5192 would require this)
        emit Locked(tId);

        _afterMint(tokenId, value);
    }

    function _burn(TokenId tokenId) internal virtual {
        address owner = ownerOf(TokenId.unwrap(tokenId));
        uint64 value = _valueOf(tokenId);
        require(value != 0, "Token does not exist");

        _beforeBurn(tokenId, value);

        // Check that token was not burned in _beforeBurn hook
        _requireExisting(TokenId.unwrap(tokenId));

        delete _values[tokenId];

        uint256 accountBalance = _balances[owner];
        // Should not happen
        assert(accountBalance >= value);
        unchecked {
            _balances[owner] = accountBalance - value;
            // Overflow not possible: amount <= accountBalance <= totalSupply.
            _totalSupply -= value;
        }

        emit Transfer(owner, address(0), TokenId.unwrap(tokenId));

        _afterBurn(tokenId, value);
    }

    function _requireExisting(uint256 tokenId) internal view virtual {
        require(tokenExists(tokenId), "Token does not exist");
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }


    function _beforeMint(TokenId tokenId, uint64 value) internal virtual {}

    function _afterMint(TokenId tokenId, uint64 value) internal virtual {}

    function _beforeBurn(TokenId tokenId, uint64 value) internal virtual {}

    function _afterBurn(TokenId tokenId, uint64 value) internal virtual {}


    function safeTransferFrom(address, address, uint256, bytes calldata) public pure override {
        revert OpNotSupported();
    }
    function safeTransferFrom(address, address, uint256) public pure override {
        revert OpNotSupported();
    }
    function transferFrom(address, address, uint256) public pure override {
        revert OpNotSupported();
    }
    function approve(address, uint256) public pure override {
        revert OpNotSupported();
    }
    function setApprovalForAll(address, bool) public pure override {
        revert OpNotSupported();
    }
    function getApproved(uint256) public pure override returns (address) {
        revert OpNotSupported();
    }
    function isApprovedForAll(address, address) public pure override returns (bool) {
        revert OpNotSupported();
    }
}
