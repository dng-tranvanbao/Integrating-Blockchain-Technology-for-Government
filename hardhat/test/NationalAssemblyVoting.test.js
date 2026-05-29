const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NationalAssemblyVoting Contract", function () {
  let votingContract;
  let admin, delegate1, delegate2, nonDelegate;

  beforeEach(async function () {
    [admin, delegate1, delegate2, nonDelegate] = await ethers.getSigners();

    const NationalAssemblyVoting = await ethers.getContractFactory("NationalAssemblyVoting");
    votingContract = await NationalAssemblyVoting.deploy();
    await votingContract.waitForDeployment();
  });

  describe("Deployment & Constructor", function () {
    it("Deployer must be the electionCommission (Admin)", async function () {
      expect(await votingContract.electionCommission()).to.equal(admin.address);
    });

    it("Must initialize the seed proposal: Cybersecurity Law", async function () {
      expect(await votingContract.proposalsCount()).to.equal(1);
      const proposal = await votingContract.proposals(1);
      expect(proposal.title).to.equal("Cybersecurity Law (Amended)");
      expect(proposal.votingStarted).to.be.false;
      expect(proposal.votingEnded).to.be.false;
    });
  });

  describe("Whitelisting Delegates", function () {
    it("Admin can whitelist a delegate", async function () {
      await votingContract.addDelegate(delegate1.address, "Nguyen Van A", "Ha Noi");
      const profile = await votingContract.delegateProfiles(delegate1.address);
      expect(profile.name).to.equal("Nguyen Van A");
      expect(profile.province).to.equal("Ha Noi");
      expect(profile.active).to.be.true;
    });

    it("Regular accounts cannot whitelist a delegate", async function () {
      await expect(
        votingContract.connect(delegate1).addDelegate(delegate2.address, "Nguyen Van B", "Da Nang")
      ).to.be.revertedWith("ERROR: Only the Election Commission can perform this action!");
    });

    it("Admin can deactivate a delegate", async function () {
      await votingContract.addDelegate(delegate1.address, "Nguyen Van A", "Ha Noi");
      await votingContract.removeDelegate(delegate1.address);
      const profile = await votingContract.delegateProfiles(delegate1.address);
      expect(profile.active).to.be.false;
    });
  });

  describe("Proposal Management & Lifecycle", function () {
    it("Admin can create new proposals", async function () {
      await votingContract.createProposal("Land Law (Amended)", "New regulations on land acquisition");
      expect(await votingContract.proposalsCount()).to.equal(2);
      const p = await votingContract.proposals(2);
      expect(p.title).to.equal("Land Law (Amended)");
    });

    it("Only Admin can start/end voting", async function () {
      await expect(
        votingContract.connect(delegate1).startVoting(1)
      ).to.be.revertedWith("ERROR: Only the Election Commission can perform this action!");

      await votingContract.startVoting(1);
      const pAfterStart = await votingContract.proposals(1);
      expect(pAfterStart.votingStarted).to.be.true;

      await expect(
        votingContract.connect(delegate1).endVoting(1)
      ).to.be.revertedWith("ERROR: Only the Election Commission can perform this action!");

      await votingContract.endVoting(1);
      const pAfterEnd = await votingContract.proposals(1);
      expect(pAfterEnd.votingEnded).to.be.true;
    });
  });

  describe("Voting System (Anonymity & Verification)", function () {
    beforeEach(async function () {
      await votingContract.addDelegate(delegate1.address, "Nguyen Van A", "Ha Noi");
      await votingContract.addDelegate(delegate2.address, "Nguyen Van B", "Da Nang");
      await votingContract.startVoting(1);
    });

    it("Delegate can cast a Yes vote", async function () {
      const tx = await votingContract.connect(delegate1).vote(1, 1);
      const receipt = await tx.wait();

      const proposal = await votingContract.proposals(1);
      expect(proposal.votesYes).to.equal(1);
      expect(proposal.votesNo).to.equal(0);
      expect(proposal.votesAbstain).to.equal(0);

      expect(await votingContract.hasVoted(1, delegate1.address)).to.be.true;

      const voteCastEvents = receipt.logs.map(log => {
        try {
          return votingContract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      }).filter(el => el && el.name === "VoteCast");

      expect(voteCastEvents.length).to.equal(1);
      expect(voteCastEvents[0].args.proposalId).to.equal(1n);
      expect(voteCastEvents[0].args.voter).to.be.undefined;
      expect(voteCastEvents[0].args.choice).to.be.undefined;
    });

    it("Unwhitelisted accounts cannot vote", async function () {
      await expect(
        votingContract.connect(nonDelegate).vote(1, 1)
      ).to.be.revertedWith("ERROR: This wallet address is not a valid whitelisted delegate!");
    });

    it("Double-voting is prevented", async function () {
      await votingContract.connect(delegate1).vote(1, 1);
      await expect(
        votingContract.connect(delegate1).vote(1, 2)
      ).to.be.revertedWith("ERROR: Delegate has already voted on this proposal!");
    });

    it("Cannot vote before start or after end", async function () {
      await votingContract.createProposal("Law A", "Desc A");
      await expect(
        votingContract.connect(delegate1).vote(2, 1)
      ).to.be.revertedWith("ERROR: Voting has not started yet!");

      await votingContract.endVoting(1);
      await expect(
        votingContract.connect(delegate2).vote(1, 2)
      ).to.be.revertedWith("ERROR: Voting has ended!");
    });

    it("Cannot vote with an invalid choice", async function () {
      await expect(
        votingContract.connect(delegate1).vote(1, 4)
      ).to.be.revertedWith("ERROR: Invalid voting choice!");
    });
  });
});
