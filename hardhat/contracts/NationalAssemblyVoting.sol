// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NationalAssemblyVoting {
    // Address of the National Assembly Secretary (Admin)
    address public electionCommission;

    struct DelegateProfile {
        address wallet;
        string name;
        string province;
        bool active;
    }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 votesYes;
        uint256 votesNo;
        uint256 votesAbstain;
        bool votingStarted;
        bool votingEnded;
    }

    // Delegate management mapping and list
    mapping(address => DelegateProfile) public delegateProfiles;
    address[] public delegateAddresses;
    
    // Proposal management mapping and count
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalsCount;

    // Vote state tracking: proposalId => voterAddress => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Events
    event DelegateWhitelisted(address indexed delegateWallet, string name, string province);
    event DelegateRemoved(address indexed delegateWallet);
    event ProposalCreated(uint256 indexed proposalId, string title);
    event VotingStarted(uint256 indexed proposalId);
    event VotingEnded(uint256 indexed proposalId);
    
    // ANONYMOUS EVENT: Only broadcasts proposal ID to update UI, containing no wallet or choice details
    event VoteCast(uint256 indexed proposalId);

    modifier onlyCommission() {
        require(msg.sender == electionCommission, "ERROR: Only the Election Commission can perform this action!");
        _;
    }

    modifier onlyDelegate() {
        require(delegateProfiles[msg.sender].active, "ERROR: This wallet address is not a valid whitelisted delegate!");
        _;
    }

    constructor() {
        electionCommission = msg.sender;

        // Initialize default seed proposal: Cybersecurity Law
        createProposal(
            "Cybersecurity Law (Amended)",
            "Draft Cybersecurity Law aimed at enhancing national information security, protecting critical information infrastructure, and preventing high-tech crimes."
        );
    }

    // Add a delegate to the Whitelist
    function addDelegate(address _delegate, string memory _name, string memory _province) public onlyCommission {
        require(_delegate != address(0), "ERROR: Invalid wallet address!");
        
        if (delegateProfiles[_delegate].wallet == address(0)) {
            delegateAddresses.push(_delegate);
        }
        
        delegateProfiles[_delegate] = DelegateProfile({
            wallet: _delegate,
            name: _name,
            province: _province,
            active: true
        });

        emit DelegateWhitelisted(_delegate, _name, _province);
    }

    // Remove a delegate from the Whitelist (Deactivate)
    function removeDelegate(address _delegate) public onlyCommission {
        require(delegateProfiles[_delegate].active, "ERROR: Delegate is already inactive!");
        delegateProfiles[_delegate].active = false;
        emit DelegateRemoved(_delegate);
    }

    // Create a new proposal
    function createProposal(string memory _title, string memory _description) public onlyCommission {
        proposalsCount++;
        proposals[proposalsCount] = Proposal({
            id: proposalsCount,
            title: _title,
            description: _description,
            votesYes: 0,
            votesNo: 0,
            votesAbstain: 0,
            votingStarted: false,
            votingEnded: false
        });

        emit ProposalCreated(proposalsCount, _title);
    }

    // Start voting for a proposal
    function startVoting(uint256 _proposalId) public onlyCommission {
        require(_proposalId > 0 && _proposalId <= proposalsCount, "ERROR: Proposal does not exist!");
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.votingStarted, "ERROR: Voting has already started!");
        
        proposal.votingStarted = true;
        emit VotingStarted(_proposalId);
    }

    // End voting for a proposal
    function endVoting(uint256 _proposalId) public onlyCommission {
        require(_proposalId > 0 && _proposalId <= proposalsCount, "ERROR: Proposal does not exist!");
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.votingStarted, "ERROR: Voting has not started yet!");
        require(!proposal.votingEnded, "ERROR: Voting has already ended!");
        
        proposal.votingEnded = true;
        emit VotingEnded(_proposalId);
    }

    // Anonymous vote execution
    // choice: 1 - Yes, 2 - No, 3 - Abstain
    function vote(uint256 _proposalId, uint8 _choice) public onlyDelegate {
        require(_proposalId > 0 && _proposalId <= proposalsCount, "ERROR: Proposal does not exist!");
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.votingStarted, "ERROR: Voting has not started yet!");
        require(!proposal.votingEnded, "ERROR: Voting has ended!");
        require(!hasVoted[_proposalId][msg.sender], "ERROR: Delegate has already voted on this proposal!");
        require(_choice >= 1 && _choice <= 3, "ERROR: Invalid voting choice!");

        // Mark voter as having voted for this proposal (prevent double voting)
        hasVoted[_proposalId][msg.sender] = true;

        // Increment the totals directly without linking address to choice
        if (_choice == 1) {
            proposal.votesYes++;
        } else if (_choice == 2) {
            proposal.votesNo++;
        } else if (_choice == 3) {
            proposal.votesAbstain++;
        }

        // Broadcast anonymous event
        emit VoteCast(_proposalId);
    }

    // Retrieve all delegate addresses
    function getDelegateAddresses() public view returns (address[] memory) {
        return delegateAddresses;
    }

    // Retrieve detailed delegate profile
    function getDelegateProfile(address _delegate) public view returns (address wallet, string memory name, string memory province, bool active) {
        DelegateProfile memory profile = delegateProfiles[_delegate];
        return (profile.wallet, profile.name, profile.province, profile.active);
    }
}
