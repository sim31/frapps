// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

// TODO: Make upgradeable by itself
/**
 * @title Optimistic Respect-based execution contract
 * @notice `respectContract` is expected to be a token contract which has
 * relatively stable distribution (it does not change at all (historical
 * distribution) or it at least does not change when voting on proposals is
 * happening)). Otherwise, if for example, new respect is distributed 
 * while the vote on OREC proposal is happening, then some accounts
 * might end up voting with weights determined by the old distribution while
 * some might have weights determined by the new distribution (depending on
 * when they vote).
 */

contract Orec is Ownable {
    enum VoteType { None, Yes, No }
    enum ExecStatus { NotExecuted, Executed, ExecutionFailed }

    struct Vote {
        VoteType vtype;
        uint256 weight;
    }

    struct Message {
        address addr;
        /// Calldata
        bytes   cdata; 
        /// This can serve as
        /// * Title for the proposal
        /// * Short description
        /// * Link to external document about a proposal
        /// * Salt - same message might be proposed multiple times and since 
        /// we identify proposals by the hash of the message we need to add
        /// some salt to the hashed value to make the proposal have unique id.
        bytes memo;
    }

    struct ProposalState {
        uint256 createTime;
        uint256 yesWeight;
        uint256 noWeight;
        ExecStatus status;
    }

    struct Proposal {
        PropId id;
        ProposalState state;
        Message message;
    }

    /// PropId = keccak256(Message)
    type PropId is bytes32;

    event EmptyVoteIn(PropId indexed propId, address indexed voter);
    event WeightedVoteIn(PropId indexed propId, address indexed voter);
    event Executed(PropId propId, bytes retVal);
    event ExecutionFailed(PropId propId, bytes retVal);
    event ProposalCreated(PropId propId);
    event Signal(bytes data);

    // TODO: make configurable
    uint64 public voteLen = 1 days;
    uint64 public vetoLen = 6 days;
    uint256 public minWeight = 256;
    // TODO: make it work with ERC-1155
    // TODO: make configurable
    // TODO: document info about how it might work with tokens whose balances might change during proposal passing time
    //      - I think this is best used with parent Respect distribution creating child distribution (so respect created by previous version of a fractal would be issuing new respect through this)
    IERC20 public respectContract;

    mapping (PropId => ProposalState) public proposals;

    // Negative weight means "no" vote;
    mapping(PropId => mapping (address => Vote)) public votes; 

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

    /// Vote for proposal. Creates it if it doesn't exist
    function vote(PropId propId, VoteType voteType, bytes calldata) public {
        ProposalState storage p = proposals[propId];

        if (!_proposalExists(p)) {
            _propose(propId, p);
        }

        _vote(p, propId, voteType);
    }

    /// Propose but don't vote
    function propose(PropId propId) public {
        ProposalState storage p = proposals[propId];
        require(!_proposalExists(p), "Proposal already exists");
        _propose(propId, p);
    }

    function execute(Message calldata message) public returns (bool) {
        PropId pId = proposalId(message);

        ProposalState storage prop = _getProposal(pId);

        require(_isPassed(prop), "Proposal has to be passed");
        require(prop.status == ExecStatus.NotExecuted, "Proposal can be executed only once");

        (bool success, bytes memory retVal) = message.addr.call(message.cdata);

        if (success) {
            emit Executed(pId, retVal);
            prop.status = ExecStatus.Executed;
        } else {
            emit ExecutionFailed(pId, retVal);
            prop.status = ExecStatus.ExecutionFailed;
        }

        return success;
    }

    function remove(PropId propId) public {
        ProposalState storage prop = _getProposal(propId);

        require(
            _isRejected(prop) ||
            prop.status == ExecStatus.Executed ||
            prop.status == ExecStatus.ExecutionFailed,
            "Proposal has to be rejected or executed in order to be removed"
        );

        delete proposals[propId];
    }

    function proposalExists(PropId propId) public view returns (bool) {
        ProposalState storage p = proposals[propId];
        return _proposalExists(p);
    }

    function isVotePeriod(PropId propId) public view returns (bool) {
        ProposalState storage p = _getProposal(propId);    // reverts if proposal does not exist
        return _isVotePeriod(p);
    }

    function isVetoPeriod(PropId propId) public view returns (bool) {
        ProposalState storage p = _getProposal(propId);    // reverts if proposal does not exist
        return _isVetoPeriod(p);
    }

    function isVetoOrVotePeriod(PropId propId) public view returns (bool) {
        ProposalState storage p = _getProposal(propId);    // reverts if proposal does not exist
        return _isVetoOrVotePeriod(p);
    }

    function isRejected(PropId propId) public view returns (bool) {
        ProposalState storage p = _getProposal(propId);    // reverts if proposal does not exist
        return _isRejected(p);
    }

    function isPassed(PropId propId) public view returns (bool) {
        ProposalState storage p = _getProposal(propId);    // reverts if proposal does not exist
        return _isPassed(p);
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

    function proposalId(Message calldata message) public pure returns (PropId) {
        bytes memory packed = abi.encodePacked(
            message.addr,
            message.cdata,
            message.memo
        );
        return PropId.wrap(keccak256(packed));
    }

    function signal(bytes calldata data) public onlyOwner {
        emit Signal(data);
    }

    function _propose(PropId propId, ProposalState storage p) private {
        assert(p.yesWeight == 0 && p.noWeight == 0 && p.status == ExecStatus.NotExecuted);
        p.createTime = block.timestamp;
        emit ProposalCreated(propId);
}

    function _isVotePeriod(ProposalState storage prop) internal view returns (bool) {
        uint256 age = block.timestamp - prop.createTime;
        return age < voteLen;
    }

    function _isVetoPeriod(ProposalState storage prop) internal view returns (bool) {
        uint256 age = block.timestamp - prop.createTime;
        return age >= voteLen && age < voteLen + vetoLen;
    }

    function _isVetoOrVotePeriod(ProposalState storage prop) internal view returns (bool) {
        uint256 age = block.timestamp - prop.createTime;
        return age < voteLen + vetoLen;
    }


    function _isRejected(ProposalState storage prop) internal view returns (bool) {
        if (!_isVotePeriod(prop)) {
            if (prop.noWeight * 2 >= prop.yesWeight) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    function _isPassed(ProposalState storage prop) internal view returns (bool) {
        if (!_isVetoOrVotePeriod(prop) && _isPassingThreshold(prop)) {
            return true;
        } else {
            return false;
        }
    }

    function _isPassingThreshold(ProposalState storage prop) internal view returns (bool) {
        return prop.noWeight * 2 < prop.yesWeight && prop.yesWeight >= minWeight; 
    }

    function _isActive(ProposalState storage prop) internal view returns (bool) {
        return _isVetoOrVotePeriod(prop) && !_isRejected(prop);
    }

    function _vote(
        ProposalState storage p,
        PropId propId,
        VoteType voteType
    ) internal {
        // TODO: check what stage proposal is in

        Vote storage currentVote = votes[propId][msg.sender];
        Vote memory newVote;

        require(
            currentVote.vtype != VoteType.No, "Can't change vote from no"
        );

        if (voteType == VoteType.Yes) {
            require(_isVotePeriod(p), "Voting period is over");
            require(currentVote.weight == 0, "Already voted yes");

            uint256 w = respectContract.balanceOf(msg.sender);
            newVote = Vote(VoteType.Yes, w);

            // console.log("Voting yes. Account: ", msg.sender, ", weight: ", w);

            p.yesWeight += w;
            votes[propId][msg.sender] = newVote;
        } else if (voteType == VoteType.No) {
            require(_isActive(p), "Voting and Veto time is over or proposal is already rejected");
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

        if (newVote.weight == 0) {
            emit EmptyVoteIn(propId, msg.sender);
        } else {
            emit WeightedVoteIn(propId, msg.sender);
        }
    }

    function _getProposal(PropId propId) internal view returns (ProposalState storage) {
        ProposalState storage p = proposals[propId];
        require(_proposalExists(p), "Proposal dne");
        return p;
    }

    function _proposalExists(ProposalState storage prop) internal view returns (bool) {
        return prop.createTime != 0;
    }

}