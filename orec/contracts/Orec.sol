// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Orec {
    enum VoteType { Yes, No }
    enum ExecStatus { NotExecuted, Executed, ExecutionFailed }

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
        ExecStatus status;
    }

    event VoteIn(uint256 propId, Vote vote, address voter, string memo);
    event Executed(uint256 propId, bytes retVal);
    event ExecutionFailed(uint256 propId, bytes retVal);

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
            noWeight: 0,
            status: ExecStatus.NotExecuted
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
            require(isVotePeriod(p), "Voting period is over");
            require(currentVote.weight == 0, "Already voted yes");

            uint256 w = respectContract.balanceOf(msg.sender);
            newVote = Vote(VoteType.Yes, w);

            p.yesWeight += w;
            votes[propId][msg.sender] = newVote;
        } else {
            require(isActive(p), "Voting and Veto time is over or proposal is already rejected");
            newVote = Vote(VoteType.No, currentVote.weight);

            p.yesWeight -= uint256(currentVote.weight);
            p.noWeight += uint256(currentVote.weight);
            votes[propId][msg.sender] = newVote;
        }

        emit VoteIn(propId, newVote, msg.sender, memo);
    }

    function execute(uint256 propId) public returns (bool) {
        Proposal storage prop = getProposal(propId);

        require(isPassed(prop), "Proposal has to be passed");
        require(prop.status == ExecStatus.NotExecuted, "Proposal can be executed only once");

        (bool success, bytes memory retVal) = prop.message.addr.call(prop.message.cdata);

        if (success) {
            emit Executed(propId, retVal);
            prop.status = ExecStatus.Executed;
        } else {
            emit ExecutionFailed(propId, retVal);
            prop.status = ExecStatus.ExecutionFailed;
        }

        return success;
    }

    function remove(uint256 propId) public {
        Proposal storage prop = getProposal(propId);

        require(
            isRejected(prop) ||
            prop.status == ExecStatus.Executed ||
            prop.status == ExecStatus.ExecutionFailed,
            "Proposal has to be rejected or executed in order to be removed"
        );

        delete proposals[propId];
    }

    function getProposal(uint256 propId) internal view returns (Proposal storage) {
        Proposal storage p = proposals[propId];
        require(p.message.addr != address(0), "Proposal dne");
        return p;
    }

    function isVotePeriod(uint256 propId) public view returns (bool) {
        Proposal storage p = getProposal(propId);    // reverts if proposal does not exist
        return isVotePeriod(p);
    }

    function isVetoPeriod(uint256 propId) public view returns (bool) {
        Proposal storage p = getProposal(propId);    // reverts if proposal does not exist
        return isVetoPeriod(p);
    }

    function isVetoOrVotePeriod(uint256 propId) public view returns (bool) {
        Proposal storage p = getProposal(propId);    // reverts if proposal does not exist
        return isVetoOrVotePeriod(p);
    }

    function isVotePeriod(Proposal storage prop) internal view returns (bool) {
        uint256 age = block.timestamp - prop.createTime;
        return age < voteLen;
    }

    function isVetoPeriod(Proposal storage prop) internal view returns (bool) {
        uint256 age = block.timestamp - prop.createTime;
        return age >= voteLen && age < voteLen + vetoLen;
    }

    function isVetoOrVotePeriod(Proposal storage prop) internal view returns (bool) {
        uint256 age = block.timestamp - prop.createTime;
        return age < voteLen + vetoLen;
    }

    function isRejected(uint256 propId) public view returns (bool) {
        Proposal storage p = getProposal(propId);    // reverts if proposal does not exist
        return isRejected(p);
    }

    function isPassed(uint256 propId) public view returns (bool) {
        Proposal storage p = getProposal(propId);    // reverts if proposal does not exist
        return isPassed(p);
    }

    function isRejected(Proposal storage prop) internal view returns (bool) {
        if (!isVotePeriod(prop)) {
            if (prop.noWeight * 2 >= prop.yesWeight) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    function isPassed(Proposal storage prop) internal view returns (bool) {
        if (!isVetoOrVotePeriod(prop) && prop.noWeight * 2 < prop.yesWeight) {
            return true;
        } else {
            return false;
        }
    }

    function isActive(Proposal storage prop) internal view returns (bool) {
        return isVetoOrVotePeriod(prop) && !isRejected(prop);
        
    }
}