# National Assembly Blockchain Voting System

A decentralized, transparent, and privacy-preserving legislative voting system built on Ethereum smart contracts.

## System Prerequisites

1. Node.js (Version 18 or higher)
2. MetaMask extension installed in your web browser

## Installation and Setup

### Step 1: Deploy Smart Contracts
The local Hardhat blockchain node is running in the background. To deploy the smart contracts, run the following commands:
```bash
cd hardhat
npx hardhat run scripts/deploy.js --network localhost
```
The deployed contract addresses and ABI files will automatically synchronize with the frontend folder.

### Step 2: Run the React Frontend Application
Open a new terminal window, navigate to the frontend directory, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to the local link provided (usually http://localhost:5173).

### Step 3: Configure MetaMask with Local Network
1. Open the MetaMask extension, click the network selection dropdown, and choose "Add network manually".
2. Enter the following network parameters:
   - Network Name: Hardhat Local
   - New RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: GOV
3. Save the network and switch to it.

### Step 4: Import Local Test Accounts into MetaMask
To simulate admin and delegate roles, import these accounts into MetaMask using their Private Keys:
- Secretary (Admin): `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Delegate 1 (Ha Noi): `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- Delegate 2 (HCM City): `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- Delegate 3 (Da Nang): `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`

## Demo Walkthrough Guide
1. **Secretary (Admin - Account #0)**: Manage the delegate whitelist, draft new legislative bills, and open/close voting phases on the Secretary Portal.
2. **Assembly Delegates (Account #1, #2, #3)**: Cast anonymous votes (Yes, No, Abstain) on open bills on the Delegate Portal.
3. **AI Legislative Assistant**: Open the **AI Assistant** tab to select any draft bill. Click **Analyze Bill with AI** to view real-time automated summaries, key provisions, socio-economic impact forecasts, and legal compliance checks mapping directly to the Vietnamese National Assembly election codes.
4. **Citizens and Auditors (Public)**: Monitor live aggregated voting statistics and inspect cryptographic transaction hashes for auditing purposes.

## AI Legislative Assistant Architecture

The application integrates an AI-driven cognitive assistant designed to aid delegates in evaluating complex draft laws.

- **Objective Summaries**: Automatically condenses long legislative text into distinct, objective summaries.
- **Turnout Impact & Analysis**: Evaluates potential socio-economic impacts and projects delegate participation metrics.
- **Legal Compliance Checks**: Cross-references draft articles with statutory constraints (e.g., Article 15 of the Law on National Assembly Elections in Vietnam).
- **Deterministic & Safe System Prompting**: Configured with low temperature outputs ($T=0.2$) and localized XML input parsing guards to prevent hallucination and prompt injection attacks.

