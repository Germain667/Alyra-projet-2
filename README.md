# Project testing - Deuxième projet
> Test le smart contract Voting.sol avec VotingTest.js

## Table des matières
* [Prérequis](#Prérequis)
* [Les test](#Les-test)
* [Les fonctions](#Les-fonctions)


## Prérequis
- npm install -g truffle
- `npm install dotenv @truffle/hdwallet-provider @openzeppelin/test-helpers @openzeppelin/contracts eth-gas-reporter`

## Les test
Les tests sont fait fonctions par fonctions. 

getVoters() et onlyVoters() ainsi que addProposal() et getOneProposal() sont testés en même temps (dans le même Describe)

tallyVotes() et startProposalsRegistering() ont 2 contextes, cela permet de tester des Hook différents et d'avoir de la souplesse avec before et beforeEach 


## Les fonctions
Odres des fonctions tester dans VotingTest.js :
- addVoter()
- getVoter() and onlyVoters()
- addProposal() and getOneProposal
- setVote()
- tallyVotes()
- startProposalsRegistering()
- endProposalsRegistering()
- startVotingSession()
- endVotingSession()

  


