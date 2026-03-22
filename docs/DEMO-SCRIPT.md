# Rebyt Demo Script (3 Minutes)

## [00:00 - 00:30] The problem
"In crypto, whenever someone explains payments, they use the coffee example. I was going to do the same. Why not?
But I thought something bigger was more interesting — almost the entire market still lives on Web2.
Not because the technology isn't ready.
Because nobody removed the friction."

## [00:30 - 01:00] The solution
"Rebyt is intent-based payment infrastructure.
The user signs what they want. A Solver deposits funds into escrow.
GenLayer AI validators evaluate whether delivery conditions were met.
But we don't blindly trust AI. There is a dispute window.
Only after finality, escrow releases automatically.
Signing is offchain and gasless. One wallet interaction is required only for execution."

## [01:00 - 02:30] Live demo
Show each step in real time using Plan B (recommended hackathon flow):
- Step 1: User signs intent in frontend -> show EIP-712 signature
- Step 2: Solver funds escrow on BSC -> show BscScan tx link
- Step 3: Run GenLayer validation in Studio UI (Full Consensus) -> show 4/4 validators Agree + ACCEPTED
	- Explain: "The result is ACCEPTED, but we still enforce finality before settlement. In demo we use GenLayer StudioNet (Bradbury-compatible) for speed; production model keeps a ~30-minute dispute window."
- Step 4: Execute settlement on BSC with relayer manual mode:
	- `node scripts/rebyt-relayer.mjs <intentHash> approved` (release)
	- or `node scripts/rebyt-relayer.mjs <intentHash> rejected` (refund)
	Show final BscScan confirmation.

Note for judges: GenLayer consensus/finality is demonstrated on StudioNet (Bradbury-compatible), and settlement execution is verifiable onchain on BSC Testnet.

## [02:30 - 03:00] Roadmap + sponsors
"Built on BNB Chain — with EIP-7702 upgrade path ready on BNB Pascal.
Validation layer powered by GenLayer StudioNet (Bradbury-compatible) Optimistic Democracy consensus.
With a real finality model: AI proposes truth, there's a dispute window, then funds are finalized.
This is not a better transaction.
This is a payment primitive."
