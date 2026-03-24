# Apolo Protocol: The Settlement Layer for Software 3.0

"The future of software lies in AI agents acting as a 'universal smart glue' between APIs." — Andrej Karpathy.

But smart glue has no bank account. Apolo is the financial infrastructure that the Agentic Economy needs to flourish.

We don't just test code; we ship on-chain assertions. Apolo allows anyone to define a success condition, verify it through GenLayer's Intelligent Consensus, and settle payments automatically on BNB Chain.

Truth is programmable.

> "Hire a dev. Pay only when their API is live."

## The Problem

Developers ship APIs for clients every day.
Payment always happens on trust � not on proof.

Today:
- Clients pay before verifying the work is live
- Devs wait weeks for manual approval
- Disputes are slow, expensive, and opaque

Result: money moves before truth is known.

## The Solution

Apolo introduces SLA-verified escrow powered by AI consensus.

A client defines a condition:
"Pay $500 when api.myproject.com returns HTTP 200"

Funds are locked. The dev ships.
GenLayer AI validators verify the endpoint.
If it works ? dev gets paid automatically.
If not ? client gets refunded.

Less manual dispute overhead. Outcome-first settlement.

V1 trust model: the Solver/Relayer is a trusted offchain component that funds escrow, submits validation requests, and executes settlement after observed consensus/finality.

## How it works

1. **SLA Intent** � Client signs an EIP-712 intent defining
   the endpoint URL and success condition
2. **Escrow** � ApoloEscrow.sol locks funds on BNB Chain
3. **Verification** � SLAValidator.py on GenLayer Bradbury
   fetches the endpoint and reaches AI consensus
4. **ZK Proof** � Solver proves intent integrity onchain
   via Groth16 proof before funds are accepted
5. **Settlement** � apolo-relayer.mjs releases or refunds
   based on validator outcome

## Sequence (Happy Path)

Client -> Apolo Frontend: Sign SLA Intent (EIP-712)
Apolo Frontend -> Solver: Submit intent + condition + verification URL
Solver -> ApoloEscrow (BSC): Fund escrow
Solver -> SLAValidator (GenLayer): Request validation
SLAValidator -> Verification URL: Fetch endpoint response
GenLayer validators -> SLAValidator: Optimistic Democracy consensus (YES/NO)
Solver/Relayer -> SLAValidator: Anchor consensus + finality metadata
Relayer -> ApoloEscrow (BSC): release() if YES, refund() if NO
ApoloEscrow -> BscScan: Settlement proof onchain

## Architecture Diagram

```mermaid
flowchart LR
   A[Client Condition\n"Returns HTTP 200"] --> B[Apolo Frontend\nIntent Signing EIP-712]
   B --> C[Execution Layer\nApolo Relayer / Solver]
   C --> D[Settlement Layer\nApoloEscrow.sol on BSC]
   C --> E[Oracle Layer\nGenLayer Intelligent Contract Python]
   E --> F[Verification URL\nAPI Response Evidence]
   E --> G[Optimistic Democracy\nBinary YES/NO Consensus]
   G --> C
   C --> H[Onchain Settlement\nrelease() or refund()]
   H --> I[BscScan + GenLayer Explorer Proof]
```

Layer mapping for judges:
- Input Layer: Client condition + signed SLA intent
- Oracle Layer: GenLayer Intelligent Contract evaluates API evidence
- Execution Layer: Apolo Relayer maps decision to deterministic action
- Settlement Layer: BSC smart contract releases/refunds funds onchain

## Why GenLayer

Traditional smart contracts are deterministic and do not natively interpret arbitrary Web2 API responses; teams usually need extra oracle and offchain coordination layers.

Apolo uses GenLayer Intelligent Contracts so the validation layer can evaluate real endpoint evidence and converge on a binary transfer decision (approve/reject) under Optimistic Democracy consensus and an explicit finality model.

This is the core primitive: move funds only after outcome verification, not after code merge.

## Software 3.0 Framing

In line with Andrej Karpathy's Software 3.0 framing (agents + APIs), Apolo acts as the financial truth layer for agentic execution.

- Agent layer: autonomous agents call external APIs to complete tasks.
- Truth layer (Apolo + GenLayer): validation converts API evidence into a binary settlement assertion (approve/reject).
- Settlement layer (BSC): funds move only after that assertion is finalized.

Practical meaning: in an agent economy, API responses are not enough to trigger payment. Verified outcomes are.

## Demo

Try it live with any public endpoint:

Condition: "https://httpbin.org/get returns HTTP 200"
? Create escrow ? GenLayer verifies ? Funds released ?

## Tech Stack

- EIP-712 (viem) � SLA intent signing
- EIP-7702 � programmable wallet execution (V2 roadmap)
- Circom 2.2.3 + snarkjs � ZK circuit for intent verification
- Groth16 proof system � onchain integrity guarantee
- Solidity ^0.8.20 + Foundry � ApoloEscrow.sol on BSC Testnet
- GenLayer Python SDK � SLAValidator.py on Bradbury
- Node.js ESM � apolo-relayer.mjs bridge
- React + Vite + Tailwind � demo frontend
- BSC Testnet (Chain ID: 97)
- GenLayer Bradbury testnet

## Contract Addresses (BSC Testnet)

| Contract | Address |
|---|---|
| ApoloEscrow (ZK enabled) | 0x5191Bca416e2De8dD7915bdD55bf625143ABB98C |
| Groth16Verifier | 0x5cBC63B27AF1427096C644DdC66B56cf01006A1e |

## Contract Addresses (GenLayer Bradbury)

| Contract | Address |
|---|---|
| SLAValidator.py | 0xc84ef0aEC4A8b4e5241231296C4a201cb56380C6 |

## Key Transactions

ZKProofVerified (fundWithZK):
https://testnet.bscscan.com/tx/0x1bce644f6ac296bbd5a75ffa0b783987d8648355bb4dd912d6cbe8970995ab3e

Settlement confirmed (release):
https://testnet.bscscan.com/tx/0x98f5ae6cc8ba95e139d5b5c4ce54822c7c4074f0ff75bacb7774d7645cfec453

## Bradbury Bug Report

During integration we documented 6 reproducible issues
with GenLayer Bradbury gen_call reliability.
Full report: docs/BRADBURY-BUG-REPORT.md
Submitted as contribution to Bradbury Special Track.

## Demo Video

[add after recording]

## Tracks

- GenLayer Future of Work: AI-verified SLA payments on Bradbury
- Bradbury Special Track: 6 reproducible bug reports
- PL Genesis: best overall project
- BNB Chain: BSC Testnet deployment, EIP-7702 roadmap
