# ORDAO user guide

ORDAO is a governance interface that enables decentralized communities to execute onchain actions democratically, overcoming voter apathy while maintaining high security and liveness.

## Core Concepts

Before using the app, it helps to understand a few key concepts:

- **Respect Tokens**: Non-transferable reputation tokens earned by participating in the Respect Game, where community members evaluate each other's contributions
- **OREC**: Optimistic Respect-based Executive Contract - the core smart contract that enables secure governance with low participation requirements
- **Proposals**: Suggested onchain actions that can be approved by the community
- **Parent/Child Respect**: A mechanism for managing respect tokens and enabling system upgrades

## Interface Overview

The ORDAO interface has several key sections:

### Left Navigation

- **Proposals**: View all current and past proposals
- **New Proposal**: Create different types of governance proposals.
- **Play Respect Game**: Link to Fractalgram for playing the Respect Game
- **Submit Breakout Results**: Submit results from Respect Game breakout rooms
- **Parent Respect**: View parent respect token information on block explorer
- **Child Respect**: View child respect token information on block explorer

### Proposal Types

When creating a new proposal, you can choose from several types:

1. **Mint Respect**: Issue respect tokens to an account
2. **Burn Respect**: Remove respect tokens from an account
3. **Respect Breakout**: Distribute respect based on breakout room results
4. **Custom Signal**: Emit a custom signal event (for off-chain coordination)
5. **Custom Call**: Execute any arbitrary contract call
6. **Increment Meeting**: Increment the meeting counter

### Proposal States

Proposals go through several states:

- **Voting**: Community members can vote yes or no
- **Veto**: Only no votes can be cast (protection mechanism)
- **Ready**: Proposal has passed and can be executed
- **Executed**: Proposal has been successfully executed
- **Failed**: Proposal did not meet requirements or was vetoed

## Using the App

### Viewing Proposals

The Proposals page shows all current proposals with their status, voting progress, and time remaining. Click on any proposal to view details and vote.

### Voting on Proposals

When viewing a proposal, you can:

- Vote Yes to support the proposal
- Vote No to oppose the proposal
- See the current voting distribution
- Monitor time remaining in the current phase

### Creating a Proposal

1. Click "New Proposal" in the navigation
2. Select the proposal type
3. Fill in the required fields
4. Submit your proposal
5. Optionally vote Yes on your own proposal

### Submitting Respect Game Results

After playing the Respect Game:

1. Click "Submit Breakout Results"
2. Enter the group number and participant rankings
3. Submit the form to create a Respect distribution proposal

### Executing Proposals

Once a proposal has passed both the voting and veto periods:

1. View the proposal details
2. Click the "Execute" button
3. Confirm the transaction in your wallet

## Advanced Features

### Parent/Child Respect

ORDAO uses a parent/child token system to enable upgrades:

- **Parent Respect**: The primary token that governs the system
- **Child Respect**: A secondary token that can be used for specific purposes

You can view token distributions by clicking the respective links in the navigation.

### Console Interface

For advanced users, ORDAO also provides a console interface with additional functionality. It is available by in the browser console as object `c`. Documentation is available at: [https://orclient-docs.frapps.xyz/](https://orclient-docs.frapps.xyz/)

---

For more detailed information about ORDAO, explore the Github repository, visit Optimystics.io/ordao, or watch the ORDAO videos playlist.