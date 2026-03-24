# Apolo Pitch Narrative

## Opening
"Every day, developers ship APIs for clients who pay on trust — not on proof.

Hire a dev. Pay only when their API is live."

## Problem
"Today paying for developer work means choosing on trust.
The client pays before verifying the work is live.
The dev waits weeks for manual approval.
Disputes are slow, expensive, and opaque.

The real scale: $50M in Aave — smart contracts managing billions —
and we still can't verify a simple HTTP endpoint before releasing funds."

## Solution
"Apolo is SLA-verified escrow infrastructure.
The client defines a condition: 'Pay $500 when api.myproject.com returns HTTP 200'.
Funds are locked. The dev ships.
GenLayer AI validators check the endpoint.
If it works — dev gets paid automatically.
If not — client gets refunded.
Outcome-based settlement with verifiable evidence and explicit trust assumptions in V1."

## Key framing
- Not a better transaction -> an SLA payment primitive
- Not a wallet experience -> a session-based interaction model
- Not a CAPTCHA -> an intelligent SLA verification layer
- Not blind AI trust -> optimistic verification with dispute window
- EIP-7702 enables execution. Apolo defines the lifecycle.

## Software 3.0 / Agentic Economy framing
- If the future is agents orchestrating APIs, the missing primitive is financial truth before payment.
- Apolo converts API claims into settlement assertions: approved/rejected after verifiable validation.
- Karpathy-style "intelligent glue" becomes transactable only when results are auditable and settlement-gated.

## Sponsor callouts
- BNB Chain: "Built on BSC. EIP-7702 upgrade path on BNB Pascal."
- GenLayer: "Validation layer uses Optimistic Democracy + Equivalence Principle on Bradbury testnet."
- PL Genesis: "Intent -> Escrow -> AI Validation -> Settlement. Full lifecycle, fully verifiable."

## Business model (Dev Fee Model)
- Apolo charges a small protocol fee on successful bounty settlements.
- Example framing: `1-2%` on release events, `0%` on refunds.
- This aligns incentives: Apolo only earns when verified outcomes are delivered.
- GenLayer builder economics fit this model because recurring validation activity can compound long-term fee participation.
