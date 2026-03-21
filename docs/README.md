# Rebyt — Intent-Based Payment Infrastructure

Intent-based payment infrastructure where users sign what they want, AI validators evaluate whether delivery conditions were met, and escrow settles automatically.

## Problem
Crypto payments require choosing a network, paying gas fees, and exposing your wallet. The average user can't do this.
Almost the entire market lives on Web2 — not because the tech isn't ready, but because nobody removed the friction.

## Solution
Rebyt turns user intent into verifiable on-chain settlement through four layers:
- Intent: user signs EIP-712 typed data via a session wallet (no direct transaction required)
- Escrow: Solver deposits funds on BSC Testnet
- Validation: GenLayer Bradbury AI validators evaluate whether delivery conditions were met
- Settlement: escrow releases automatically after consensus

## Tech Stack
- EIP-712 intent signing (viem)
- RebytEscrow.sol (Solidity, BSC Testnet)
- DeliveryValidator.py (GenLayer Python SDK, Bradbury)
- rebyt-relayer.mjs (Node.js bridge)
- Demo frontend (React, one page)
- Circom 2.2.3 + snarkjs (ZK circuit)
- Groth16 proof system (intent hash verification)

## Contract Addresses (BSC Testnet, chain 97)
- RebytEscrow.sol (ZK enabled): `0x5191Bca416e2De8dD7915bdD55bf625143ABB98C`
- Groth16Verifier: `0x5cBC63B27AF1427096C644DdC66B56cf01006A1e`
- DeliveryValidator.py (GenLayer Bradbury): `0xc84ef0aEC4A8b4e5241231296C4a201cb56380C6`

## ZK Proof System

The Solver generates a zero-knowledge proof that the intent data matches the hash before the escrow accepts funds.

- **Circuit**: `Poseidon(recipient, amount, nonce) == intentHash`
- **Proof system**: Groth16 / BN128
- **Verified onchain**: `RebytEscrow.fundWithZK()` calls `Groth16Verifier.verifyProof()`

Demo tx (`ZKProofVerified` event):
https://testnet.bscscan.com/tx/0x1bce644f6ac296bbd5a75ffa0b783987d8648355bb4dd912d6cbe8970995ab3e

## Bradbury Bug Report

During integration with GenLayer Bradbury, we documented reproducible issues with `gen_call` reliability and testnet RPC behavior. Full report: [docs/BRADBURY-BUG-REPORT.md](BRADBURY-BUG-REPORT.md)

This is submitted as a contribution to the Bradbury Special Track.

## Demo Video
[fill Sunday morning]

## Tracks
- **GenLayer**: Intelligent Contract with Optimistic Democracy + Equivalence Principle deployed on Bradbury
- **Bradbury Special Track**: Bug report with 6 reproducible issues (see docs/BRADBURY-BUG-REPORT.md)
- **PL Genesis**: best overall project
- **BNB Chain**: deployed on BSC Testnet, EIP-7702 roadmap
