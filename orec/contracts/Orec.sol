// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Orec {
    enum VoteType { Yes, No }

    struct Vote {
        VoteType vtype;
        uint256 weight;
    }

    struct Message {
        address addr;
        bytes   cdata; // Calldata
    }

    struct Proposal {
        // uint256 id;
        Message message;
        uint256 createTime;
        uint256 yesWeight;
        uint256 noWeight;
    }

    event VoteIn(uint256 propId, Vote vote, address voter, string memo);

    // TODO: make configurable
    uint64 constant public voteLen = 1 days;
    uint64 constant public vetoLen = 6 days;
    uint256 constant public minWeight = 256;
    // TODO: make it work with ERC-1155
    // TODO: make configurable
    // TODO: document info about how it might work with tokens whose balances might change during proposal passing time
    //      - I think this is best used with parent Respect distribution creating child distribution (so respect created by previous version of a fractal would be issuing new respect through this)
    IERC20 public respectContract;

    Proposal[] public proposals;

    // Negative weight means "no" vote;
    mapping(uint256 => mapping (address => Vote)) public votes; 

    constructor(IERC20 respectContract_) {
        respectContract = respectContract_;
    }

    function propose(Message calldata message) public {
        proposals.push(Proposal({
            message: message,
            createTime: block.timestamp,
            yesWeight: 0,
            noWeight: 0
        }));
    }

    function vote(uint256 propId, VoteType voteType, string calldata memo) public {
        // TODO: check what stage proposal is in

        Proposal storage p = getProposal(propId);
        Vote storage currentVote = votes[propId][msg.sender];
        Vote memory newVote;

        require(
            currentVote.weight == 0 || currentVote.vtype != VoteType.No,
            "Can't change vote from negative"
        );

        if (voteType == VoteType.Yes) {
            require(currentVote.weight == 0, "Already voted yes");

            uint256 w = respectContract.balanceOf(msg.sender);
            newVote = Vote(VoteType.Yes, w);

            p.yesWeight += w;
            votes[propId][msg.sender] = newVote;
        } else {
            newVote = Vote(VoteType.No, currentVote.weight);

            p.yesWeight -= uint256(currentVote.weight);
            p.noWeight += uint256(currentVote.weight);
            votes[propId][msg.sender] = newVote;
        }

        emit VoteIn(propId, newVote, msg.sender, memo);
    }

    function getProposal(uint256 propId) internal view returns (Proposal storage) {
        Proposal storage p = proposals[propId];
        require(p.message.addr != address(0), "Proposal dne");
        return p;
    }


}