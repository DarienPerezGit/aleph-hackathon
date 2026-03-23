# BRADBURY BUG REPORT

## Project Context
Apolo is an intent-based payment escrow integrated across:
- BSC Testnet escrow settlement
- GenLayer Bradbury validation layer
- Node relayer bridge
- Frontend demo pipeline

This report documents reproducible Bradbury behavior observed during real end-to-end integration, not synthetic unit tests.

## Scope
- Network: GenLayer Bradbury testnet
- Integration path: validate(intentHash, condition, evidenceUrl) -> getResult(intentHash) -> BSC release/refund
- Time window: hackathon integration sessions (multiple repeated runs)

## Reproducible Issues

### 1) Intermittent gen_call after deploy
Observed pattern:
- validate transaction is sent successfully
- getResult read path intermittently fails with gen_call errors

Typical errors:
- Error fetching gen_call from GenLayer RPC
- Missing or invalid parameters
- failed to gen call: can not get contract state

Repro status: repeated across multiple intents and contract redeploys.

Impact:
- Relayer cannot deterministically consume validator output in expected time window.

---

### 2) Indexing/availability lag after ACCEPTED deploy
Observed pattern:
- Contract shows ACCEPTED/Deployed in Studio
- RPC read path returns contract not found shortly after

Typical errors:
- Requested resource not found
- Contract 0x... not found

Repro status: repeated after fresh deployments.

Impact:
- Deploy success in UI is not sufficient to guarantee immediate read accessibility for integration clients.

---

### 3) Endpoint inconsistency (Studio API vs rpc-bradbury)
Observed pattern:
- Different behavior depending on endpoint used for deploy/call
- A contract path that appears valid in one endpoint fails in the other

Evidence pattern:
- studio.genlayer.com/api and rpc-bradbury.genlayer.com do not behave equivalently for subsequent reads.

Impact:
- Integration reliability depends on endpoint selection/order, not only contract correctness.

---

### 4) Noisy CLI output blocks reliable automation
Observed pattern:
- deploy output contains very large traces/ABI dumps and occasionally truncation
- Contract address extraction becomes unreliable in automated scripts

Impact:
- CI-like integration workflows need brittle parsing workarounds.
- Higher operator risk during hackathon/demo windows.

---

### 5) Provisional false vs final false are indistinguishable
Observed pattern:
- getResult frequently returns false through entire polling window
- No protocol-level signal distinguishes:
  - "still pending / not finalized"
  - "final consensus is false"

Impact:
- Relayer cannot safely decide whether to keep waiting or settle as refund without heuristic assumptions.

---

### 6) Deterministic validation scenario still blocked by state-read instability
Observed pattern:
- Even after simplifying validator logic for deterministic true condition,
  read consistency issues still prevent reliable end-to-end release confirmation in some runs.

Impact:
- Demonstration-grade reliability is constrained by RPC/state-read behavior, not only contract logic.

## Why this qualifies for Bradbury Special Track
This is greyboxing evidence from production-like integration:
- behavior observed from outside the network
- repeated under real transaction flow
- documented at the interface between validator consensus and external settlement systems

## Suggested Track Narrative (in-person)
We built a payment escrow on top of GenLayer. While integrating, we documented reproducible issues in Bradbury and are contributing this report as part of the Special Track.

## Current Track Positioning
- GenLayer Future of Work: DeliveryValidator.py deployed
- Bradbury Special Track: reproducible bug report with integration evidence
- PL Genesis: complete end-to-end project
- BNB Chain: escrow settlement on BSC Testnet
