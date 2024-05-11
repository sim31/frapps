// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "./Respect1155Base.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// TODO: Make upgradeable
// TODO: Allow only owner to mint respect
contract Respect1155 is Respect1155Base {

    struct MintRequest {
        uint256 id;
        uint64 value;
    }

    constructor(string memory uri_) Respect1155Base(uri_) {}

    function mintRespect(MintRequest calldata request, bytes calldata data) external virtual {
        _mintRespect(request.id, request.value, data);
    }

    function burnRespect(uint256 tokenId, bytes calldata) external virtual {
        _burnRespect(tokenId);
    }

    function mintRespectGroup(MintRequest[] calldata requests, bytes calldata data) external virtual {
        for (uint i = 0; i < requests.length; i++) {
            MintRequest calldata r = requests[i];
            _mintRespect(r.id, r.value, data);
        }
    }

    function burnRespectGroup(uint256[] calldata ids, bytes calldata) external virtual {
        for (uint i = 0; i < ids.length; i++) {
            _burnRespect(ids[i]);
        }
    }

}