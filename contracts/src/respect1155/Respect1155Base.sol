// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "@ordao/orec/contracts/IRespect.sol";
import "./IRespect1155.sol";
import "./IERC7572.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {IERC165, ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * 256 bits (32 bytes):
 * First least-significant 20 bytes is address (owner of an NTT).
 */
type TokenId is uint256;

function ownerFromTokenId(TokenId packed) pure returns (address) {
    uint160 i = uint160(TokenId.unwrap(packed));
    return address(i);
}

abstract contract Respect1155Base is ERC165, IRespect1155, IERC1155MetadataURI, IERC1155Errors, IERC7572 {
    using Arrays for uint256[];
    using Arrays for address[];

    error OpNotSupported();
    /// Only non-fungible Respect tokens have value field.
    error NoValueField(uint256 tokenId);
    error InvalidTokenId(uint256 tokenId);
    error TokenAlreadyExists(uint256 tokenId);
    error TokenDoesNotExist(uint256 tokenId);
    error ERC1155TransferRejected(address receiver, bytes reason);
    error ERC1155InvalidReceiverResponse(address receiver, bytes4 response);

    /// Balances of fungible respect
    mapping(address => uint256) private _balances;
    /// TokenId => value of non-fungible token
    mapping(uint256 => uint64) private _values;

    uint256 private _totalRespect;

    uint256 public constant fungibleId = 0;

    // Used as the URI for all token types by relying on ID substitution, e.g. https://token-cdn-domain/{id}.json
    string private _uri;
    string private _contractURI;

    constructor(string memory uri_, string memory contractURI_) {
        _setURI(uri_);
        _setContractURI(contractURI_);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IRespect).interfaceId ||
            interfaceId == type(IRespect1155).interfaceId ||
            interfaceId == type(IERC1155).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     *
     * This implementation returns the same URI for *all* token types. It relies
     * on the token type ID substitution mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * Clients calling this function must replace the `\{id\}` substring with the
     * actual token type ID.
     */
    function uri(uint256 /* id */) public view virtual returns (string memory) {
        return _uri;
    }

    function contractURI() external view returns (string memory) {
        return _contractURI;
    }

    function valueOfToken(uint256 tokenId) public view override returns (uint64) {
        if (tokenId == fungibleId) {
            revert NoValueField(tokenId);
        }
        return _valueOf(tokenId);
    }

    function respectOf(address account) public view override returns (uint256) {
        return _respectOf(account);
    }

    function sumRespectOf(address[] calldata accounts) public view override returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < accounts.length; i++) {
            total += respectOf(accounts.unsafeMemoryAccess(i));
        }
        return total;
    }

    function respectOfBatch(address[] calldata accounts) public view override returns (uint256[] memory) {
        uint256[] memory respectBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            respectBalances[i] = respectOf(accounts.unsafeMemoryAccess(i));
        }

        return respectBalances;
    }

    function totalRespect() public view returns (uint256) {
        return _totalRespect;
    }

    function balanceOf(address account, uint256 tokenId) public view override(IERC1155, IRespect1155) returns (uint256) {
        if (tokenId == fungibleId) {
            return _respectOf(account);
        } else {
            address owner = ownerOf(tokenId);
            if (owner != account || _valueOf(tokenId) == 0) {
                return 0;
            } else {
                return 1;
            }
        }
    }

    function balanceOfBatch(
        address[] calldata accounts,
        uint256[] calldata ids
    ) public view override returns (uint256[] memory) {
        if (accounts.length != ids.length) {
            revert ERC1155InvalidArrayLength(ids.length, accounts.length);
        }

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts.unsafeMemoryAccess(i), ids.unsafeMemoryAccess(i));
        }

        return batchBalances;
    }

    function ownerOf(uint256 tokenId) public pure returns (address) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            revert InvalidTokenId(tokenId);
        }
        return owner;
    }

    function setApprovalForAll(address, bool) public pure override(IERC1155, IRespect1155) {
        revert OpNotSupported();
    }

    function isApprovedForAll(address, address) public pure override(IERC1155, IRespect1155) returns (bool) {
        revert OpNotSupported();
    }

    /**
     * @dev See {IERC1155-safeTransferFrom}.
     */
    function safeTransferFrom(address, address, uint256, uint256, bytes memory) public pure override(IERC1155, IRespect1155) {
        revert OpNotSupported();
    }

    /**
     * @dev See {IERC1155-safeBatchTransferFrom}.
     */
    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure override(IERC1155, IRespect1155) {
        revert OpNotSupported();
    }

    function tokenExists(uint256 tokenId) public view returns(bool) {
        uint64 v = _valueOf(tokenId);
        return v != 0;
    }

    function _mintRespect(uint256 id, uint64 value, bytes memory data) internal {
        address to = _ownerOf(id);
        address operator = msg.sender;

        if (to == address(0)) {
            revert ERC1155InvalidReceiver(address(0));
        }
        if (tokenExists(id)) {
            revert TokenAlreadyExists(id);
        }

        // Create non-fungible token
        _values[id] = value;

        // Increase non-fungible respect supply
        _totalRespect += value;
        // Update non-fungible balance of `to`
        unchecked {
            // Overflow not possible: balance + amount is at most totalRespect + amount, which is checked above.
            _balances[to] += value;
        }

       (uint256[] memory ids, uint256[] memory values) = _constructStdArrays(id, value);

        // Emit event
        emit TransferBatch(operator, address(0), to, ids, values);

        // Notify receiver
        _doMintAcceptanceCheck(operator, to, ids, values, data);
    }

    function _burnRespect(uint256 tokenId) internal {
        address owner = ownerOf(tokenId);
        uint64 value = _valueOf(tokenId);
        if (value == 0) {
            revert TokenDoesNotExist(tokenId);
        }

        // Delete non-fungible token
        delete _values[tokenId];

        // Update fungible balance of owner
        uint256 accountBalance = _balances[owner];
        _balances[owner] = accountBalance - value;
        // Update total supply of fungible
        _totalRespect -= value;

        // Emit event
       (uint256[] memory ids, uint256[] memory values) = _constructStdArrays(tokenId, value);
       address operator = msg.sender;
       emit TransferBatch(operator, owner, address(0), ids, values);
    }


    function _constructStdArrays(uint256 tokenId, uint64 value) internal pure returns (uint256[] memory ids, uint256[] memory values) {
        ids = new uint256[](2);
        ids[0] = 0; ids[1] = tokenId;
        values = new uint256[](2);
        values[0] = value; values[1] = 1;
    }

    /**
     * @dev Performs a batch acceptance check by calling {IERC1155-onERC1155BatchReceived} on the `to` address
     * if it contains code at the moment of execution.
     */
    function _doMintAcceptanceCheck(
        address operator,
        address to,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) private {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, address(0), ids, values, data) returns (
                bytes4 response
            ) {
                if (response != IERC1155Receiver.onERC1155BatchReceived.selector) {
                    // Tokens rejected
                    revert ERC1155InvalidReceiverResponse(to, response);
                }
            } catch (bytes memory reason) {
                revert ERC1155TransferRejected(to, reason);
            }
        }
    }

    function _valueOf(uint256 tokenId) internal view returns (uint64) {
        return _values[tokenId];
    }

    function _ownerOf(uint256 tokenId) internal pure returns (address) {
        return ownerFromTokenId(TokenId.wrap(tokenId));
    }
    
    function _respectOf(address account) internal view returns (uint256) {
        return _balances[account];
    }

    function _setURI(string memory newuri) internal virtual {
        _uri = newuri;
    }

    function _setContractURI(string memory newuri) internal virtual {
        _contractURI = newuri;
        emit ContractURIUpdated();
    }
}