// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Orec is Ownable {
    enum VoteType { None, Yes, No }
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
    event ProposalCreated(uint256 propId);

    // TODO: make configurable
    uint64 public voteLen = 1 days;
    uint64 public vetoLen = 6 days;
    uint256 public minWeight = 256;
    // TODO: make it work with ERC-1155
    // TODO: make configurable
    // TODO: document info about how it might work with tokens whose balances might change during proposal passing time
    //      - I think this is best used with parent Respect distribution creating child distribution (so respect created by previous version of a fractal would be issuing new respect through this)
    IERC20 public respectContract;

    Proposal[] public proposals;

    // Negative weight means "no" vote;
    mapping(uint256 => mapping (address => Vote)) public votes; 

    constructor(
        IERC20 respectContract_,
        uint64 voteLenSeconds_,
        uint64 vetoLenSeconds_,
        uint256 minWeight_
    ) Ownable(address(this)) {
        respectContract = respectContract_;
        voteLen = voteLenSeconds_;
        vetoLen = vetoLenSeconds_;
        minWeight = minWeight_;
    }

    function propose(Message calldata message, uint256 nonce) public returns (uint256 propId) {
        _propose(message, nonce);
        return nonce;
    }

    function proposeAndVote(
        Message calldata message,
        uint256 nonce,
        VoteType voteType,
        string calldata memo
    ) public {
        Proposal storage p = _propose(message, nonce);
        _vote(p, nonce, voteType, memo);
    }

    function vote(uint256 propId, VoteType voteType, string calldata memo) public {
        Proposal storage p = _getProposal(propId);
        _vote(p, propId, voteType, memo);
    }

    function execute(uint256 propId) public returns (bool) {
        Proposal storage prop = _getProposal(propId);

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
        Proposal storage prop = _getProposal(propId);

        require(
            isRejected(prop) ||
            prop.status == ExecStatus.Executed ||
            prop.status == ExecStatus.ExecutionFailed,
            "Proposal has to be rejected or executed in order to be removed"
        );

        delete proposals[propId];
    }

    
    function _getProposal(uint256 propId) internal view returns (Proposal storage) {
        Proposal storage p = proposals[propId];
        require(p.message.addr != address(0), "Proposal dne");
        return p;
    }

    function _propose(Message calldata message, uint256 nonce) internal returns (Proposal storage) {
        require(nonce == proposals.length, "nonce already used");
        Proposal storage p = proposals.push();
        p.message = message;
        p.createTime = block.timestamp;
        p.noWeight = p.yesWeight = 0;
        p.status = ExecStatus.NotExecuted;

        emit ProposalCreated(nonce);
        return p;
    }

    function _vote(
        Proposal storage p,
        uint256 propId,
        VoteType voteType,
        string calldata memo
    ) internal {
        // TODO: check what stage proposal is in

        Vote storage currentVote = votes[propId][msg.sender];
        Vote memory newVote;

        require(
            currentVote.vtype != VoteType.No, "Can't change vote from no"
        );

        if (voteType == VoteType.Yes) {
            require(isVotePeriod(p), "Voting period is over");
            require(currentVote.weight == 0, "Already voted yes");

            uint256 w = respectContract.balanceOf(msg.sender);
            newVote = Vote(VoteType.Yes, w);

            // console.log("Voting yes. Account: ", msg.sender, ", weight: ", w);

            p.yesWeight += w;
            votes[propId][msg.sender] = newVote;
        } else if (voteType == VoteType.No) {
            require(isActive(p), "Voting and Veto time is over or proposal is already rejected");
            // console.log("Voting no. Account: ", msg.sender);
            if (currentVote.vtype == VoteType.Yes) {
                newVote = Vote(VoteType.No, currentVote.weight);
                p.yesWeight -= uint256(currentVote.weight);
                p.noWeight += uint256(currentVote.weight);
            } else {
                uint256 weight = respectContract.balanceOf(msg.sender);
                newVote = Vote(VoteType.No, weight);
                p.noWeight += weight;
            }
            votes[propId][msg.sender] = newVote;
        } else {
            revert("Cannot vote with none type"); 
        }

        emit VoteIn(propId, newVote, msg.sender, memo);
    }

    function isVotePeriod(uint256 propId) public view returns (bool) {
        Proposal storage p = _getProposal(propId);    // reverts if proposal does not exist
        return isVotePeriod(p);
    }

    function isVetoPeriod(uint256 propId) public view returns (bool) {
        Proposal storage p = _getProposal(propId);    // reverts if proposal does not exist
        return isVetoPeriod(p);
    }

    function isVetoOrVotePeriod(uint256 propId) public view returns (bool) {
        Proposal storage p = _getProposal(propId);    // reverts if proposal does not exist
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
        Proposal storage p = _getProposal(propId);    // reverts if proposal does not exist
        return isRejected(p);
    }

    function isPassed(uint256 propId) public view returns (bool) {
        Proposal storage p = _getProposal(propId);    // reverts if proposal does not exist
        return isPassed(p);
    }

    function setRespectContract(address newAddr) public onlyOwner {
        respectContract = IERC20(newAddr);
    }

    function setMinWeight(uint256 newMinWeigth) public onlyOwner {
        minWeight = newMinWeigth;
    }

    // WARNING: increasing voteLen could make the proposals you thought expired active again (if they are within the new voteLen)
    function setVoteLen(uint64 newVoteLen) public onlyOwner {
        voteLen = newVoteLen;
    }

    function setVetoLen(uint64 newVetoLen) public onlyOwner {
        vetoLen = newVetoLen;
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