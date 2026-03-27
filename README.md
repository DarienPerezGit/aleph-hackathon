# Apolo — AI-Verified SLA Escrow on BNB Chain

> **Deploy. Get paid when it works.**

Apolo is an AI-powered escrow protocol where payments are automatically released when verifiable conditions are met — without intermediaries. Built on BSC Testnet with AI validation via GenLayer.

## 🏆 BNB Chain Hackathon Track

**Track**: Next-Gen Consumer AI on BNB Chain  
**Smart Contract (BSC Testnet)**: [`0x5191bca416e2de8dd7915bdd55bf625143abb98c`](https://testnet.bscscan.com/address/0x5191bca416e2de8dd7915bdd55bf625143abb98c)  
**Deploy TX**: [`0xc31eec9927e06db8516751def8aa758b70abb7d3cb0a8bbba0ebbcb37a3c73e2`](https://testnet.bscscan.com/tx/0xc31eec9927e06db8516751def8aa758b70abb7d3cb0a8bbba0ebbcb37a3c73e2)

## 🧠 How It Works

```
Client locks funds in escrow (BSC)
      ↓
AI Validators check the SLA condition (GenLayer Bradbury)
      ↓
Consensus reached → Solver triggers release
      ↓
Funds released to provider on BSC
```

1. **Client** defines an SLA condition (e.g. _"API returns HTTP 200"_) and locks USDT in the escrow smart contract on BSC Testnet.
2. **GenLayer AI Validators** independently fetch evidence from the provided URL and vote on whether the condition was met.
3. **Consensus** is reached via GenLayer's Optimistic Democracy (AGREE/DISAGREE).
4. **Solver** reads the consensus result and calls `releasePayment()` on the BSC escrow.

## 📦 Architecture

```
frontend/         → React demo UI
contracts/
  ApoloEscrow.sol → BSC Testnet escrow (Solidity + Foundry)
genlayer/
  SLAValidator.py → AI validator contract (GenLayer Bradbury)
scripts/
  solver.mjs      → Off-chain relayer connecting both networks
```

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- Foundry (for contracts)
- A `.env` file (copy from `.env.example`)

### 1. Install dependencies
```bash
npm install
cd frontend && npm install
```

### 2. Start the solver (relayer)
```bash
npm run solver
```

### 3. Start the frontend
```bash
cd frontend && npm run dev
```

Frontend runs at: `http://localhost:5173`

### 4. Demo flow
1. Open the frontend
2. Fill in the SLA condition and evidence URL
3. Click **Lock Funds** — signs EIP-712 intent and deposits on BSC
4. The solver watches GenLayer for consensus
5. On AGREE → funds released automatically

## 🔗 Deployed Contracts

| Contract | Network | Address |
|---|---|---|
| `ApoloEscrow` (RebytEscrow) | BSC Testnet (Chain 97) | `0x5191bca416e2de8dd7915bdd55bf625143abb98c` |
| `SLAValidator` | GenLayer Bradbury | `0x66A6cFc5DAb62d3EB1681dEBa3Ea5B302D7c7aB2` |

## 🔍 Onchain Proof (BSC Testnet)

| TX | Action | Status |
|---|---|---|
| [`0xc31eec...`](https://testnet.bscscan.com/tx/0xc31eec9927e06db8516751def8aa758b70abb7d3cb0a8bbba0ebbcb37a3c73e2) | Contract Deploy | ✅ Success |
| [`0x04692e...`](https://testnet.bscscan.com/tx/0x04692e3f6cdce01c3a3ff26273aa301c583d09887b19b62698540847654ba1ca) | setZKVerifier | ✅ Success |
| [`0x32711e...`](https://testnet.bscscan.com/tx/0x32711e330341ed62db18e2a0c9ebef31d1a9700f71293e611139d224325e7f70) | setZKEnabled | ✅ Success |

## 🤖 AI + Web3 Integration

- **GenLayer** provides nondeterministic AI execution with economic consensus — validators independently call LLMs and vote. This is the "AI" in the BNB Track.
- **BSC Testnet** is the settlement layer — all funds and releases are onchain.
- **EIP-712** signing ensures the payment intent is cryptographically bound to the SLA condition.

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Smart Contracts | Solidity 0.8.20 + Foundry |
| Chain | BSC Testnet (Chain ID: 97) |
| AI Validation | GenLayer Python SDK (Bradbury Testnet) |
| Signing | viem + EIP-712 |
| Frontend | React + Vite |
| Relayer | Node.js (ESM) |

## 📄 License

MIT
