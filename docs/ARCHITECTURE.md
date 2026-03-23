# Apolo

Intent-based payment infrastructure where users sign what they want, AI validators evaluate whether delivery conditions were met, and escrow settles automatically.

## Visuals

![Apolo Logo](assets/apolo_logo_isometric_solo.svg)

![Apolo Full Architecture Flow](assets/flujo-completo.png)

## Four Layers

### 1) Intent Layer
- User signs an `SLAIntent` using EIP-712 typed data.
- Signing is offchain (no gas).
- One wallet interaction is required only at execution step.

### 2) Escrow Layer
- Solver deposits funds into `ApoloEscrow.sol` on BSC Testnet.
- Funds are locked with `intentHash` as reference.
- State machine: `PENDING -> FUNDED -> VALIDATING -> RELEASED`.

The Solver is a trusted off-chain component in this version, responsible for funding escrow and initiating execution. Full signature verification and trust minimization are part of future iterations.

### 3) Validation Layer
The Validation Layer evaluates whether a value transfer request should be executed based on predefined SLA conditions.

In the current implementation, this corresponds to evaluating SLA-related conditions. However, the validation model is intentionally generalized: it determines whether a request to move funds is legitimate.

This evaluation is executed on GenLayer StudioNet (Bradbury-compatible) using Optimistic Democracy consensus (5 validators running LLM-based evaluation).

The system relies on a developer-defined Equivalence Principle:
- "Two outputs are equivalent if they both agree on whether the value transfer should be approved or rejected, regardless of reasoning."

This ensures convergence on a binary decision while allowing flexible reasoning across validators.

#### Finality Model

GenLayer StudioNet (Bradbury-compatible) uses an optimistic finality model:

1. **Consensus** — Validators run LLM evaluation → majority agrees on YES or NO
2. **ACCEPTED** — Result is posted on-chain, marked as accepted
3. **Dispute Window** — simulated instant finality in demo; ~30-minute dispute window in Bradbury production model
4. **FINALIZED** — No appeals → result becomes permanent and immutable

Settlement only executes **after finality**. The Relayer waits for the result to be finalized before calling `release()` or `refund()` on the escrow contract.

This mirrors optimistic rollups: assume correctness, allow challenge, then finalize. It ensures an explicit trust model where AI is not blindly trusted — there is always a window for human review.

**Demo note**: StudioNet fast path is used for demo speed. Production model keeps a ~30-minute dispute window on Bradbury.

This validation pattern generalizes beyond payment settlement.

Any operation that transfers value — such as releasing escrow funds, distributing tokens from a faucet, or executing automated payouts — can be gated by the same intelligent validation mechanism.

Instead of hardcoding rules, the system evaluates whether each request is legitimate before value is transferred.

This positions the Validation Layer as a reusable primitive for secure value transfer, not just a payment-specific component.

### 4) Settlement Layer
- The Settlement Layer executes the final state transition after validation approval.
- `apolo-relayer.mjs` reads the validation outcome from GenLayer and triggers the corresponding action on `ApoloEscrow.sol` (release or refund).
- All state transitions are conditional on validation approval, ensuring that value transfer is gated by the Validation Layer.
- Every step is verifiable on BscScan + GenLayer explorer.

## Implemented in this submission
- EIP-712 intent signing (reimplemented from scratch)
- `ApoloEscrow.sol` on BSC Testnet
- `SLAValidator.py` on GenLayer StudioNet (Bradbury-compatible)
- `apolo-relayer.mjs` connecting both
- Demo frontend (one page, four status steps: Intent → Escrow → API Verified → Payment Released)

Full signature verification and trust minimization are part of future iterations.

## Roadmap (not in this submission)
- V2: EIP-7702 session wallet upgrade (BNB Chain Pascal ready)
- V3: Multi-solver competitive network
- V4: GenLayer bot detection layer (anti-drain protection)

## Reference repos studied (not copied)
- github.com/acastellana/conditional-payment-cross-border-trade
- github.com/genlayerlabs/genlayer-project-boilerplate
