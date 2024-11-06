// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "./Respect1155Base.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Respect1155 is Respect1155Base, Ownable {

    struct MintRequest {
        uint256 id;
        uint64 value;
    }

    constructor(address owner, string memory uri_, string memory contractURI_)
        Respect1155Base(uri_, contractURI_) Ownable(owner) {}

    function mintRespect(MintRequest calldata request, bytes calldata data) external virtual onlyOwner {
        _mintRespect(request.id, request.value, data);
    }

    function burnRespect(uint256 tokenId, bytes calldata) external virtual onlyOwner {
        _burnRespect(tokenId);
    }

    function mintRespectGroup(MintRequest[] calldata requests, bytes calldata data) external virtual onlyOwner {
        for (uint i = 0; i < requests.length; i++) {
            MintRequest calldata r = requests[i];
            _mintRespect(r.id, r.value, data);
        }
    }

    function burnRespectGroup(uint256[] calldata ids, bytes calldata) external virtual onlyOwner {
        for (uint i = 0; i < ids.length; i++) {
            _burnRespect(ids[i]);
        }
    }

    function setURI(string calldata uri) external onlyOwner {
        _setURI(uri);
    }

    function setContractURI(string calldata uri) external onlyOwner {
        _setContractURI(uri);
    }

}