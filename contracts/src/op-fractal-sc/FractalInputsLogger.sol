// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.9;


contract FractalInputsLogger {
    struct GroupResultsEF {
        uint8 groupNum;
        address[6] ranks;
        address delegate;
    }
    struct GroupResults {
        uint8 groupNum;
        address[6] ranks;
    }


    event ConsensusSubmissionEF(address indexed submitter, bytes32 indexed resultHash);
    event ConsensusSubmission(address indexed submitter, bytes32 indexed resultHash);

    function submitConsEF(GroupResultsEF calldata results) public {
        bytes memory packed = abi.encodePacked(
            results.groupNum,
            results.ranks,
            results.delegate
        );
        bytes32 h = keccak256(packed);
        emit ConsensusSubmissionEF(msg.sender, h);
    } 

    function submitCons(GroupResults calldata results) public {
        bytes memory packed = abi.encodePacked(
            results.groupNum,
            results.ranks
        );
        bytes32 h = keccak256(packed);
        emit ConsensusSubmission(msg.sender, h);
    }
}
