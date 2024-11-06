// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./IRespect.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/**
 * @title Optimistic Respect-based executive contract
 * @notice This is a contract that executes transactions on behalf of a DAO, that has a non-transferrable reputation token (which we call “Respect” here).
 * It is optimistic because it trusts a minority of contributors who take the initiative to act on behalf of a DAO even if they hold a small amount of Respect.
 * The security comes from a time delay during which other contributors can easily block a transaction,
 * if they collectively have a significant enough amount of Respect relative to what the initiators have.
 * 
 * @dev `respectContract` is expected to be a token contract which has
 * relatively stable distribution (it does not change too much when voting on proposals is happening).
 * This contract does not know when respect of someone gets updated and it does not try
 * to make voting power distribution among accounts to always accurately reflect most recent respect distribution.
 * That's why it is best to use non-transferrable token contract as `respectContract`.
 * Ideally `respectContract` would be some old Respect distribution created over a long period of time.
 */
contract Orec is Ownable {
    /// PropId = keccak256(Message)
    type PropId is bytes32;
    type VoteWeight is uint128;
    /// @dev Caping weight of individual vote. Even though respect balances could be bigger amounts,
    /// they are unlikely to be reached. And this enables some storage optimizations.
    uint128 private constant _maxVoteWeight = type(uint128).max - 1;

    using EnumerableMap for EnumerableMap.Bytes32ToBytes32Map;

    enum VoteType { None, Yes, No }
    enum Stage { Voting, Veto, Execution, Expired }
    enum VoteStatus { Passing, Failing, Passed, Failed }

    struct Vote {
        VoteType vtype;
        VoteWeight weight;
    }

    /// Types of respect token interface supported
    enum RespectAPIType { IRespect, ERC20 }

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
    }

    struct Proposal {
        PropId id;
        ProposalState state;
        Message message;
    }

    event EmptyVoteIn(
        PropId indexed propId,
        address indexed voter,
        VoteType vtype
    );
    event WeightedVoteIn(
        PropId indexed propId,
        address indexed voter,
        Vote vote
    );
    event Executed(PropId indexed propId, bytes retVal);
    event ExecutionFailed(PropId indexed propId, bytes retVal);
    event ProposalCreated(PropId indexed propId);
    event Signal(uint8 indexed signalType, bytes data);
    event ProposalCanceled(PropId indexed propId);

    error ProposalAlreadyExists();
    error ProposalNotPassed();
    error ProposalAlreadyExecuted();
    error ProposalNotExpired();
    error VotePeriodOver();
    error AlreadyVoted(VoteType prevVote, VoteType newVote);
    /// @notice Means that either both vote and veto periods are over or proposal is already rejected (see _isActive())
    error ProposalVoteInactive();
    error ProposalDoesNotExist();
    error InvalidVote();
    error MaxLiveYesVotesExceeded();
    error UnsupportedRespectContract();
    error OutOfGas();

    /// Length of a voting period
    uint64 public voteLen;
    /// Length of a veto period
    uint64 public vetoLen;
    /// Minimum vote weight that proposal has to acquire before it can become passing
    uint256 public minWeight;

    /// Contract for Respect token which determines vote weights of accounts
    address public respectContract;
    RespectAPIType internal _respectAPType;

    /// Maximum number of yes votes on live proposals. This is security mechanism for preventing proposal spam attacks.
    uint8 public maxLiveYesVotes;

    mapping (PropId => ProposalState) public proposals;
    mapping (address => EnumerableMap.Bytes32ToBytes32Map) private _liveVotes;

    constructor(
        IERC165 respectContract_,
        uint64 voteLenSeconds_,
        uint64 vetoLenSeconds_,
        uint256 minWeight_,
        uint8 maxLiveYesVotes_
    ) Ownable(address(this)) {
        _setRespectContract(respectContract_);
        voteLen = voteLenSeconds_;
        vetoLen = vetoLenSeconds_;
        minWeight = minWeight_;
        maxLiveYesVotes = maxLiveYesVotes_;
    }

    /// Vote for proposal. Creates it if it doesn't exist.
    function vote(PropId propId, VoteType voteType, bytes calldata) external {
        ProposalState storage p = proposals[propId];

        if (!_proposalExists(p)) {
            _propose(propId, p);
        }

        _vote(p, propId, voteType);
    }

    /// Propose but don't vote
    function propose(PropId propId) external {
        ProposalState storage p = proposals[propId];
        if (_proposalExists(p)) {
            revert ProposalAlreadyExists();
        }
        _propose(propId, p);
    }

    /**
     * Execute a passed proposal
     * @dev If modifying take care to avoid reentrancy.
     */
    function execute(Message calldata message) external returns (bool) {
        PropId pId = proposalId(message);

        ProposalState storage prop = _getProposal(pId);

        if (_getVoteStatus(prop) != VoteStatus.Passed) {
            revert ProposalNotPassed();
        }

        // Delete proposal *before* executing it to avoid reentrancy.
        delete proposals[pId];

        uint gasBefore = gasleft();
        (bool success, bytes memory retVal) = message.addr.call(message.cdata);

        if (success) {
            emit Executed(pId, retVal);
        } else {
            // We have to revert in case of out-of-gas exceptions.
            // Otherwise (if we just emited ExecutionFailed and keep proposal deleted)
            // passed proposals could be expired by the attacker simply
            // by calling `execute` with not enough gas.
            //
            // This also keeps estimateGas working well.
            //
            // See EIP-150 to make sense of this.
            uint gasAfter = gasleft();
            if (gasAfter < gasBefore / 64) {
                revert OutOfGas();
            } else {
                emit ExecutionFailed(pId, retVal);
            }
        }
        return success;
    }

    function proposalExists(PropId propId) public view returns (bool) {
        ProposalState storage p = proposals[propId];
        return _proposalExists(p);
    }

    /// Proposal is said to be expired if it is rejected or its execution has been triggered. Otherwise proposal is said to be *live*
    function isLive(PropId propId) public view returns (bool) {
        ProposalState storage p = proposals[propId];
        return _isLive(p);
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

    function getStage(PropId propId) public view returns (Stage) {
        ProposalState storage p = _getProposal(propId);    // reverts if proposal does not exist
        VoteStatus vstatus = _getVoteStatus(p);
        if (vstatus == VoteStatus.Failed) {
            return Stage.Expired;
        } else if (vstatus == VoteStatus.Passed) {
            // If proposal is passed then it must be in execution stage,
            // because we don't store proposals for which execute has been called
            // (so stage cannot be expired here).
            return Stage.Execution;
        } else if (_isVotePeriod(p)) {
            return Stage.Voting;
        } else {
            assert(_isVetoPeriod(p));
            return Stage.Veto;
        }
    }

    function getVoteStatus(PropId propId) public view returns (VoteStatus) {
        ProposalState storage p = _getProposal(propId);    // reverts if proposal does not exist
        return _getVoteStatus(p);
    }

    function isVoteActive(PropId propId) public view returns (bool) {
        ProposalState storage p = _getProposal(propId);    // reverts if proposal does not exist
        return _isVoteActive(p);
    }

    function setRespectContract(IERC165 respect) external onlyOwner {
        _setRespectContract(respect);
    }

    function setMinWeight(uint256 newMinWeigth) external onlyOwner {
        minWeight = newMinWeigth;
    }

    // WARNING: increasing voteLen could make the proposals you thought expired active again (if they are within the new voteLen)
    function setPeriodLengths(uint64 newVoteLen, uint64 newVetoLen) external onlyOwner {
        voteLen = newVoteLen;
        vetoLen = newVetoLen;
    }

    function setMaxLiveVotes(uint8 newMaxLiveVotes) external onlyOwner {
        maxLiveYesVotes = newMaxLiveVotes;
    }

    function proposalId(Message calldata message) public pure returns (PropId) {
        bytes memory packed = abi.encodePacked(
            message.addr,
            message.cdata,
            message.memo
        );
        return PropId.wrap(keccak256(packed));
    }

    function signal(uint8 signalType, bytes calldata data) external onlyOwner {
        emit Signal(signalType, data);
    }

    function cancelProposal(PropId propId) external onlyOwner {
        if (proposalExists(propId)) {
            delete proposals[propId];
            emit ProposalCanceled(propId);
        } else {
            revert ProposalDoesNotExist();
        }
    }

    /**
     * Return current vote of voter on currently live proposal (identified by propId).
     */
    function getLiveVote(PropId propId, address voter) public view returns (Vote memory) {
        EnumerableMap.Bytes32ToBytes32Map storage voteMap = _liveVotes[voter];
        return _getVote(voteMap, propId);
    }

    function voteWeightOf(address account) public view returns (VoteWeight) {
        uint256 respect = respectOf(account);
        uint128 w = uint128(Math.min(respect, _maxVoteWeight));
        return VoteWeight.wrap(w);
    }

    function respectOf(address account) public view returns (uint256) {
        if (_respectAPType == RespectAPIType.IRespect) {
            return (IRespect(respectContract)).respectOf(account);
        } else {
            return (IERC20(respectContract)).balanceOf(account);
        }
    }

    function _setRespectContract(IERC165 respect) internal {
        address raddr = address(respect);
        if (respect.supportsInterface(type(IRespect).interfaceId)) {
            _respectAPType = RespectAPIType.IRespect;
        } else {
            // Try using balanceOf function for retrieving vote weight.
            // Let's just call it here to see if it is working.
            // Not using supportsInterface in this case because
            // we don't need it to support full ERC20 interface,
            // plus old FractalRespect contract does not return
            // that it supports ERC20.
            uint256 balance = (IERC20(raddr)).balanceOf(address(this));
            if (!(balance >= 0 && balance <= type(uint256).max)) {
                revert UnsupportedRespectContract();
            }
            _respectAPType = RespectAPIType.ERC20;
        }
        respectContract = raddr;
    }

    function _propose(PropId propId, ProposalState storage p) private {
        assert(p.yesWeight == 0 && p.noWeight == 0);
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

    function _isPassingThreshold(ProposalState storage prop) internal view returns (bool) {
        return prop.noWeight * 2 < prop.yesWeight && prop.yesWeight >= minWeight; 
    }

    function _getVoteStatus(ProposalState storage p) internal view returns (VoteStatus) {
        if (_isPassingThreshold(p)) {
            return _isVetoOrVotePeriod(p) ? VoteStatus.Passing : VoteStatus.Passed;
        } else {
            return _isVotePeriod(p) ? VoteStatus.Failing : VoteStatus.Failed;
        }
    }

    function _isVoteActive(ProposalState storage prop) internal view returns (bool) {
        VoteStatus status = _getVoteStatus(prop);
        return status == VoteStatus.Passing || status == VoteStatus.Failing;
    }

    function _isLive(ProposalState storage prop) internal view returns (bool) {
        // If it is executed then it won't be stored.
        // So if proposal exists and it is not failed then proposal is live.
        bool exists = _proposalExists(prop);
        return exists && _getVoteStatus(prop) != VoteStatus.Failed;
    }

    function _votesEqual(Vote memory v1, Vote memory v2) internal pure returns (bool) {
        return v1.vtype == v2.vtype &&
               VoteWeight.unwrap(v1.weight) == VoteWeight.unwrap(v2.weight);
    }

    function _vote(
        ProposalState storage p,
        PropId propId,
        VoteType voteType
    ) internal {
        EnumerableMap.Bytes32ToBytes32Map storage votesOfAcc = _liveVotes[msg.sender];        
        Vote memory currentVote = _getVote(votesOfAcc, propId);

        Vote memory newVote = Vote(voteType, voteWeightOf(msg.sender));

        if (_votesEqual(currentVote, newVote)) {
            revert AlreadyVoted(currentVote.vtype, voteType);
        }

        // Remove non-live votes, count yes votes on other proposals
        uint liveYesCount = _updateLiveVotes(votesOfAcc, propId);

        // Timing checks
        if (newVote.vtype == VoteType.Yes) {
            if (!_isVotePeriod(p)) {
                revert VotePeriodOver();
            }
            if (liveYesCount >= maxLiveYesVotes) {
                revert MaxLiveYesVotesExceeded();
            }
        } else if (newVote.vtype == VoteType.No) {
            if (!_isVoteActive(p)) {
                revert ProposalVoteInactive();
            }
        } else {
            // Not allowing VoteType.None votes
            revert InvalidVote();
        }

        // Update vote
        _setVote(votesOfAcc, propId, p, currentVote, newVote);

        // Emit events
        if (VoteWeight.unwrap(newVote.weight) == 0) {
            emit EmptyVoteIn(propId, msg.sender, newVote.vtype);
        } else {
            emit WeightedVoteIn(propId, msg.sender, newVote);
        }
    }

    function _getVote(
        EnumerableMap.Bytes32ToBytes32Map storage voteMap,
        PropId propId
    ) internal view returns (Vote memory) {
        (bool success, bytes32 value) = voteMap.tryGet(PropId.unwrap(propId));
        if (!success) {
            return Vote(VoteType.None, VoteWeight.wrap(0));
        } else {
            return _bytes32ToVote(value);
        }
    }

    function _setVote(
        EnumerableMap.Bytes32ToBytes32Map storage voteMap,
        PropId propId,
        ProposalState storage p,
        Vote memory oldVote,
        Vote memory newVote
    ) internal {
        // Subtract old vote
        if (VoteWeight.unwrap(oldVote.weight) > 0) {
            if (oldVote.vtype == VoteType.Yes) {
                p.yesWeight -= VoteWeight.unwrap(oldVote.weight);
            } else if (oldVote.vtype == VoteType.No) {
                p.noWeight -= VoteWeight.unwrap(oldVote.weight);
            }
        }

        // Add new vote
        if (newVote.vtype == VoteType.Yes) {
            p.yesWeight += VoteWeight.unwrap(newVote.weight);
        } else if (newVote.vtype == VoteType.No) {
            p.noWeight += VoteWeight.unwrap(newVote.weight);
        } else {
            // Not allowing VoteType.None votes
            revert InvalidVote();
        }

        // Set vote in vote map
        voteMap.set(
            PropId.unwrap(propId),
            _voteToBytes32(newVote)
        );
    }

    /**
     * @dev First least-significant 16 bytes is vote weight.
     * 17th byte is vote type.
     */
    function _bytes32ToVote(bytes32 value) private pure returns (Vote memory) {
        // https://docs.soliditylang.org/en/v0.8.24/types.html#conversions-between-elementary-types
        uint128 w = uint128(uint256(value));
        assert(w <= _maxVoteWeight);
        VoteType vt = VoteType(uint8(uint256(value) >> 128));
        assert(vt == VoteType.Yes || vt == VoteType.No);
        return Vote(vt, VoteWeight.wrap(w));
    }
    function _voteToBytes32(Vote memory v) private pure returns (bytes32) {
        uint128 weight = VoteWeight.unwrap(v.weight);
        uint256 b = (uint256(v.vtype) << 128) | (uint256(weight));
        return bytes32(b);
    }

    /// @return liveYesCount - number of live yes votes
    function _updateLiveVotes(
        EnumerableMap.Bytes32ToBytes32Map storage voteMap,
        PropId currentProp
    ) internal returns (uint) {
        uint len = voteMap.length();
        PropId[] memory toRemove = new PropId[](len);
        uint removeCount = 0;
        uint liveYesCount = 0;
        for (uint i = 0; i < len; i++) {
            (bytes32 key, bytes32 value) = voteMap.at(i);
            PropId propId = PropId.wrap(key);
            ProposalState storage prop = proposals[propId];
            if (!_isLive(prop)) {
                toRemove[removeCount] = propId;
                removeCount += 1;
            } else {
                Vote memory v = _bytes32ToVote(value);
                if (v.vtype == VoteType.Yes && PropId.unwrap(propId) != PropId.unwrap(currentProp)) {
                    liveYesCount += 1;
                }
            }
        }

        for (uint i = 0; i < removeCount; i++) {
            voteMap.remove(PropId.unwrap(toRemove[i]));
        }

        return liveYesCount;
    }

    function _getProposal(PropId propId) internal view returns (ProposalState storage) {
        ProposalState storage p = proposals[propId];
        if (!_proposalExists(p)) {
            revert ProposalDoesNotExist();
        }
        return p;
    }

    function _proposalExists(ProposalState storage prop) internal view returns (bool) {
        return prop.createTime != 0;
    }

}