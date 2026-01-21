// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.9;

import "./PeriodicRespect.sol";
import "./FractalInputsLogger.sol";

contract FractalRespect is PeriodicRespect, FractalInputsLogger {
    struct GroupRanks {
        uint8 groupNum;
        address[6] ranks;
    }

    /// Fibonacci starting from 5 in hex
    /// One byte (two-digit hexadecimal) for each rank
    /// Level 1 gets 5 Respect
    /// Level 2 gets 8 Respect
    /// ...
    bytes constant _rewards = hex"05080D152237";
    address public executor;
    uint public lastRanksTime;
    uint64 public ranksDelay;
    uint64 public periodNumber;

    string private _baseURIVal;

    string public intent;
    string public agreement;

    event AgreementSigned(address indexed signer, string indexed agreement);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
        string memory name_,
        string memory symbol_,
        address issuer_,
        address executor_,
        uint64 ranksDelay_
    ) PeriodicRespect(name_, symbol_, issuer_) {
        initializeV2(executor_, ranksDelay_);
    }

    function initializeV2Whole(
        string memory name_,
        string memory symbol_,
        address issuer_,
        address executor_,
        uint64 ranksDelay_
    ) public virtual reinitializer(2) {
        __PeriodicRespect_init(name_, symbol_, issuer_);

        executor = executor_;
        ranksDelay = ranksDelay_;
    }

    function initializeV2(
        address executor_,
        uint64 ranksDelay_
    ) public virtual reinitializer(2) {
        executor = executor_;
        ranksDelay = ranksDelay_;
    }

    function setRanksDelay(uint64 ranksDelay_) public virtual onlyOwner {
        ranksDelay = ranksDelay_;
    }

    function setExecutor(address newExecutor) public virtual byIssuerOrExecutor {
        executor = newExecutor;
    }

    function submitRanks(GroupRanks[] calldata allRanks) public virtual byIssuerOrExecutor {
        uint timeSinceLast = block.timestamp - lastRanksTime;
        require(timeSinceLast >= ranksDelay, "ranksDelay amount of time has to pass before next submitRanks");

        periodNumber += 1;

        for (uint i = 0; i < allRanks.length; i++) {
            GroupRanks calldata group = allRanks[i];
            for (uint r = 0; r < 6; r++) {
                address rankedAddr = group.ranks[r];
                require(rankedAddr != address(0) || r < 3, "At least 3 non-zero addresses have to be ranked");
                if (rankedAddr != address(0)) {
                    uint8 reward = uint8(_rewards[r]);
                    // Throws if token with this tId is already issued.
                    // This protects from same account being ranked twice in the same period
                    _mint(rankedAddr, reward, uint8(MintTypes.RespectGame), periodNumber);
                }
            }
        }

        lastRanksTime = block.timestamp;
    }

    function setBaseURI(string calldata baseURI) public virtual override byIssuerOrExecutor {
        _baseURIVal = baseURI;
    }

    function setIntent(string calldata intent_) public virtual onlyOwner {
        intent = intent_;
    }

    function setAgreement(string calldata agreement_) public virtual onlyOwner {
        agreement = agreement_;
    }

    function signAgreement(string calldata agreement_) public virtual {
        emit AgreementSigned(_msgSender(), agreement_);
    }

    modifier byIssuerOrExecutor() {
        require(_senderIssuerOrExecutor(), "Only executor or issuer can do this");
        _;
    }

    function _senderIssuerOrExecutor() internal view returns (bool) {
        return _msgSender() == executor || _msgSender() == owner();
    }
}