const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('Voting', accounts => {
    const owner = accounts[0];
    const voter1 = accounts[1];
    const voter2 = accounts[2];
    const voter3 = accounts[3];
    const voter4 = accounts[4];
    const voter5 = accounts[5];


    let VotingInstance;

    describe("addVoter()", function () {

        before(async function () {
            VotingInstance = await Voting.new({from:owner});
        });

        it("should add a voter", async () => {
            await VotingInstance.addVoter(voter1, { from: owner});
        });  

        it("shouldn't add a voter, (voter1 is not owner)", async () => {
            await expectRevert(VotingInstance.addVoter(voter2, { from: voter1}),"Ownable: caller is not the owner");
        });  
     
        it("shouldn't add voter1 again, revert", async () => {
            await expectRevert(VotingInstance.addVoter(voter1, { from: owner }), "Already registered");
        });   
        
        it("should add a voter and get event VoterRegistered", async () => {
            const storedData = await VotingInstance.addVoter(voter2);
            expectEvent(storedData, 'VoterRegistered',{voterAddress : voter2});
        });  

        it("shouldn't add a voter (because we change the workflowStatus), revert", async () => {
            await VotingInstance.startProposalsRegistering({ from: owner });
            await expectRevert(VotingInstance.addVoter(voter3, { from: owner}), "Voters registration is not open yet");
        });

    });

    describe("getVoter() and onlyVoters()", function () {

        before(async function () {
            VotingInstance = await Voting.new({from:owner});
        });

        it("should add a voter", async () => {
            await VotingInstance.addVoter(voter1, { from: owner});
            const voter = await VotingInstance.getVoter(voter1, {from : voter1});
            expect(voter.isRegistered).to.be.true;
            expect(voter.hasVoted).to.be.false;
            expect(voter.votedProposalId).to.be.bignumber.equal(new BN(0));
        });    
        
        it("shouldn't add a voter (because owner not registered), revert", async () => {
            await expectRevert(VotingInstance.getVoter(voter1, { from: owner }), "You're not a voter");
        });   
        
    });

    describe("addProposal() and getOneProposal", function () {

        before(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1, { from: owner});
        });

        it("shouldn't add a proposal (not in Proposals Resgsitering period), revert", async () => {
            await expectRevert(VotingInstance.addProposal("Proposal 1", { from: voter1 }), "Proposals are not allowed yet");
        });   
        
        it("should begin the proposal period", async () => {
            await VotingInstance.startProposalsRegistering({ from: owner });
        });  

        it("shouldn't add a proposal (_desc is empty)), revert", async () => {
            await expectRevert(VotingInstance.addProposal("", { from: voter1 }), "Vous ne pouvez pas ne rien proposer");
        }); 

        it("should add a proposal ", async () => {
            await VotingInstance.addProposal("Proposal 1", { from: voter1 });
            const storeData = await VotingInstance.getOneProposal(1, { from: voter1 });
            expect(storeData.description).to.equal("Proposal 1");
            expect(storeData.voteCount).to.be.bignumber.equal(new BN(0));
        }); 

        it("should add a proposal and get an event ProposalRegistered", async () => {
            const storedData = await VotingInstance.addProposal("Proposal 2", { from: voter1 });
            expectEvent(storedData, 'ProposalRegistered',{ proposalId : new BN(2) });
        });  

        it("shouldn't get a proposal (Owner is not registered),revert", async () => {
            await expectRevert(VotingInstance.getOneProposal(1, { from: owner }),"You're not a voter");
        }); 
    });

    describe("setVote()", function () {

        before(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1, { from: owner});
            await VotingInstance.addVoter(voter2, { from: owner});
            await VotingInstance.addVoter(voter3, { from: owner});
            await VotingInstance.addVoter(voter4, { from: owner});
            await VotingInstance.startProposalsRegistering({ from: owner });
            await VotingInstance.addProposal("Proposal 1", { from: voter1 });
            await VotingInstance.addProposal("Proposal 2", { from: voter1 });            
            await VotingInstance.addProposal("Proposal 3", { from: voter2 });
            await VotingInstance.addProposal("Proposal 4", { from: voter2 });
        });

        it("shouldn't add a vote (not in voting session period), revert", async () => {
            await expectRevert(VotingInstance.setVote(1, { from: voter1 }), "Voting session havent started yet");
        });

        it("should begin the voting session period", async () => {
            await VotingInstance.endProposalsRegistering({ from: owner });
            await VotingInstance.startVotingSession({ from: owner });
        });  

        it("shouldn't add a vote, because the proposal didn't exist", async () => {
            await expectRevert(VotingInstance.setVote(5, { from: voter2 }),"Proposal not found");
        });  

        it("should add a vote", async () => {
            await VotingInstance.setVote(1, { from: voter1 });
            const voter = await VotingInstance.getVoter(voter1, {from : voter1});
            expect(voter.hasVoted).to.be.true;
            expect(voter.votedProposalId).to.be.bignumber.equal(new BN(1));
        });  

        it("shouldn't add a vote, voter1 because already voted, revert", async () => {
            await expectRevert(VotingInstance.setVote(2, { from: voter1 }),"You have already voted");
        });  

        it("should increment proposalsArray", async () => {
            await VotingInstance.setVote(1, { from: voter2 });
            await VotingInstance.setVote(1, { from: voter3 });
            const storeData = await VotingInstance.getOneProposal(1, { from: voter2 });
            expect(storeData.voteCount).to.be.bignumber.equal(new BN(3));
        }); 

        it("shouldn't add a vote (Owner is not registered),revert", async () => {
            await expectRevert(VotingInstance.setVote(1, { from: owner }),"You're not a voter");
        });

        it("should add a vote and get event Voted", async () => {
            const storedData = await VotingInstance.setVote(2, { from: voter4 });
            expectEvent(storedData, 'Voted',{ voter : voter4, proposalId : new BN(2) });
        }); 

    });

    describe("tallyVotes()", function () {

        context("tallyVotes() part 1, here we just test expectRevert", function () {

            before(async function () {
                VotingInstance = await Voting.new({from:owner});
                await VotingInstance.startProposalsRegistering({ from: owner });
                await VotingInstance.endProposalsRegistering({ from: owner });
                await VotingInstance.startVotingSession({ from: owner });
            });

            it("shouldn't work (not in voting session ended period), revert", async () => {
                await expectRevert(VotingInstance.tallyVotes({ from: owner }), "Current status is not voting session ended");
            });

            it("should begin the voting session period", async () => {
                await VotingInstance.endVotingSession({ from: owner });
            });  

            it("shouldn't work (The caller must be the owner), revert", async () => {
                await expectRevert(VotingInstance.tallyVotes({ from: voter1 }), "Ownable: caller is not the owner");
            });

        });   

        context("tallyVotes() part 2, we test the rest of the function", function () {

            beforeEach(async function () {
                VotingInstance = await Voting.new({from:owner});
                await VotingInstance.addVoter(voter1, { from: owner});
                await VotingInstance.addVoter(voter2, { from: owner});
                await VotingInstance.addVoter(voter3, { from: owner});
                await VotingInstance.addVoter(voter4, { from: owner});
                await VotingInstance.addVoter(voter5, { from: owner});
                await VotingInstance.startProposalsRegistering({ from: owner });
                await VotingInstance.addProposal("Proposal 1", { from: voter1 });
                await VotingInstance.addProposal("Proposal 2", { from: voter1 });            
                await VotingInstance.addProposal("Proposal 3", { from: voter2 });
                await VotingInstance.addProposal("Proposal 4", { from: voter2 });
                await VotingInstance.endProposalsRegistering({ from: owner });
                await VotingInstance.startVotingSession({ from: owner });
                await VotingInstance.setVote(1, { from: voter1 });
                await VotingInstance.setVote(1, { from: voter2 });
                await VotingInstance.setVote(2, { from: voter3 });
                await VotingInstance.setVote(2, { from: voter4 });
                await VotingInstance.setVote(3, { from: voter5 });
                await VotingInstance.endVotingSession({ from: owner });
            });

            it("should be the proposal 1 which win", async () => {
                await VotingInstance.tallyVotes({ from: owner });
                expect(await VotingInstance.winningProposalID.call()).to.be.bignumber.equal(new BN(1));
            });

            it("should get event WorkflowStatusChange ", async () => {
                const storedData = await VotingInstance.tallyVotes({ from: owner });
                expectEvent(storedData, 'WorkflowStatusChange',{ previousStatus : new BN(4), newStatus : new BN(5) });
            });

            it("should change workflowStatus to 5 ", async () => {
                await VotingInstance.tallyVotes({ from: owner });
                expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(5));
            });

        }); 

    });

    describe("startProposalsRegistering()", function () {

        context("startProposalsRegistering() part 1, here we just test expectRevert and workflowstatus", function () {
            before(async function () {
                VotingInstance = await Voting.new({from:owner});
            });

            it("should test if workflowstatus is equal to 0", async () => {
                expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(0));
            });    

            it("shouldn't work because voter1 is not the owner, revert", async () => {
                await expectRevert(VotingInstance.startProposalsRegistering( { from: voter1 }), "Ownable: caller is not the owner");
            });

            it("should start Proposals Registering", async () => {
                await VotingInstance.startProposalsRegistering( { from: owner });
            });

            it("shouldn't work because we are not registering the voters, revert", async () => {
                await expectRevert(VotingInstance.startProposalsRegistering( { from: owner }), "Registering proposals cant be started now");
            });
            it("should test if workflowstatus is equal to 1", async () => {
                expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(1));
            }); 
        });

        context("startProposalsRegistering() part 2, we test the rest of the function", function () {

            beforeEach(async function () {
                VotingInstance = await Voting.new({from:owner});
                await VotingInstance.addVoter(voter1, { from: owner});
            });

            it("should add the genesis block to proposalsArray", async () => {
                await VotingInstance.startProposalsRegistering( { from: owner });
                const storeData = await VotingInstance.getOneProposal(0, { from: voter1 });
                expect(storeData.voteCount).to.be.bignumber.equal(new BN(0));
                expect(storeData.description).to.equal("GENESIS");
            }); 

            it("should get event WorkflowStatusChange ", async () => {
                const storeData = await VotingInstance.startProposalsRegistering( { from: owner });
                expectEvent(storeData, 'WorkflowStatusChange',{ previousStatus : new BN(0), newStatus : new BN(1) });
            });

        });


    });

    describe("endProposalsRegistering()", function () {

        before(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1, { from: owner});
        });

        it("shouldn't work because we are not registering proposals, revert", async () => {
            await expectRevert(VotingInstance.endProposalsRegistering( { from: owner }), "Registering proposals havent started yet");
        }); 

        it("should start Proposals Registering", async () => {
            await VotingInstance.startProposalsRegistering( { from: owner });
        });

        it("shouldn't work because voter1 is not the owner, revert", async () => {
            await expectRevert(VotingInstance.endProposalsRegistering( { from: voter1 }), "Ownable: caller is not the owner");
        });

        it("should test if workflowstatus is equal to 1", async () => {
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(1));
        });   

        it("should end Proposals Registering and get event WorkflowStatusChange", async () => {
            const storeData = await VotingInstance.endProposalsRegistering( { from: owner });
            expectEvent(storeData, 'WorkflowStatusChange',{ previousStatus : new BN(1), newStatus : new BN(2) });
        });

        it("should test if workflowstatus is equal to 2", async () => {
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(2));
        });  
    });

    describe("startVotingSession()", function () {

        before(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1, { from: owner});
            await VotingInstance.startProposalsRegistering( { from: owner });
        });

        it("shouldn't work because we are not registering proposals, revert", async () => {
            await expectRevert(VotingInstance.startVotingSession( { from: owner }), "Registering proposals phase is not finished");
        }); 

        it("should end Proposals Registering", async () => {
            await VotingInstance.endProposalsRegistering( { from: owner });
        });

        it("shouldn't work because voter1 is not the owner, revert", async () => {
            await expectRevert(VotingInstance.startVotingSession( { from: voter1 }), "Ownable: caller is not the owner");
        });

        it("should test if workflowstatus is equal to 2", async () => {
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(2));
        });   

        it("should start voting session and get event WorkflowStatusChange", async () => {
            const storeData = await VotingInstance.startVotingSession( { from: owner });
            expectEvent(storeData, 'WorkflowStatusChange',{ previousStatus : new BN(2), newStatus : new BN(3) });
        });

        it("should test if workflowstatus is equal to 3", async () => {
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(3));
        });  
    });

    describe("endVotingSession()", function () {

        before(async function () {
            VotingInstance = await Voting.new({from:owner});
            await VotingInstance.addVoter(voter1, { from: owner});
            await VotingInstance.startProposalsRegistering( { from: owner });
            await VotingInstance.endProposalsRegistering( { from: owner });
        });

        it("shouldn't work because we are not registering proposals, revert", async () => {
            await expectRevert(VotingInstance.endVotingSession( { from: owner }), "Voting session havent started yet");
        }); 

        it("should start voting session", async () => {
            await VotingInstance.startVotingSession( { from: owner });
        });

        it("shouldn't work because voter1 is not the owner, revert", async () => {
            await expectRevert(VotingInstance.endVotingSession( { from: voter1 }), "Ownable: caller is not the owner");
        });

        it("should test if workflowstatus is equal to 3", async () => {
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(3));
        });   

        it("should end voting session and get event WorkflowStatusChange", async () => {
            const storeData = await VotingInstance.endVotingSession( { from: owner });
            expectEvent(storeData, 'WorkflowStatusChange',{ previousStatus : new BN(3), newStatus : new BN(4) });
        });

        it("should test if workflowstatus is equal to 4", async () => {
            expect(await VotingInstance.workflowStatus.call()).to.be.bignumber.equal(new BN(4));
        });  
    });


});