# Apolo Demo Script (3 Minutes)

## Short Pitch (30-45 seconds)

### [0:00 - 0:10] Landing
"Software 3.0 is here. Agents are becoming the universal glue between APIs, but as Andrej Karpathy notes, this paradigm needs more than connectivity — it needs a way to transact."

### [0:10 - 0:20] Demo — Client side
"This is Apolo. A client defines a bounty: 'Pay when my API returns 200'. No more promises — programmable assertions."

### [0:20 - 0:35] Logs / Terminal
"When the fix is shipped, Apolo triggers GenLayer AI validators to reach consensus on the real endpoint. Once verified and finalized, escrow on BNB Chain releases funds."

### [0:35 - 0:45] Closing — Landing Footer
"Apolo is the verifiable bank-account layer for the Agentic Economy. In the world of Software 3.0: Truth is programmable."

## [00:00 - 00:30] The problem
"In crypto, whenever someone explains payments, they use the coffee example. I was going to do the same. Why not?
But I thought something bigger was more interesting — almost the entire market still lives on Web2.
Not because the technology isn't ready.
Because nobody removed the friction."

## [00:30 - 01:00] The solution
"Apolo is SLA-verified payment infrastructure.
The client defines a condition: 'Pay when my API returns HTTP 200'.
Funds are locked in escrow. The dev ships.
GenLayer AI validators verify the endpoint.
But we don't blindly trust AI. There is a dispute window.
Only after finality, escrow releases automatically.
Signing is offchain and gasless. One wallet interaction is required only for execution."

## [01:00 - 02:30] Live demo
Show each step in real time using a GenLayer-Consensus-Validated flow:
- Step 1: User fills endpoint URL (https://httpbin.org/get) and success condition (Returns HTTP 200) in frontend -> EIP-712 signature generated
- Step 2: Solver funds escrow on BSC -> show BscScan tx link
- Step 3: Run SLA verification in Studio UI (Full Consensus) -> show 4/4 validators Agree + ACCEPTED
	- Explain: "The result is ACCEPTED, but we still enforce finality before settlement. In demo we use GenLayer StudioNet (Bradbury-compatible) for speed; production model keeps a ~30-minute dispute window."
- Step 4: Execute settlement on BSC with relayer consensus-anchored mode:
	- `node scripts/apolo-relayer.mjs <SLAIntentHash> approved` (release)
	- or `node scripts/apolo-relayer.mjs <SLAIntentHash> rejected` (refund)
	- Callout on screen: `Using GenLayer-Consensus-Validated result (manual anchor mode)`
	- Explain in one sentence: "Here GenLayer consensus becomes an executable settlement decision."
	Show final BscScan confirmation.

Note for judges: GenLayer consensus/finality is demonstrated on StudioNet (Bradbury-compatible), and settlement execution is verifiable onchain on BSC Testnet.

V1 trust note for judges: Solver/Relayer is trusted in this version to bridge validation output into settlement execution.

## [02:30 - 03:00] Roadmap + sponsors
"Built on BNB Chain — with EIP-7702 upgrade path ready on BNB Pascal.
Validation layer powered by GenLayer StudioNet (Bradbury-compatible) Optimistic Democracy consensus.
With a real finality model: AI proposes truth, there's a dispute window, then funds are finalized.
In a Software 3.0 world of agents calling APIs, Apolo is the financial truth layer that turns outcomes into payments.
This is not a better transaction.
This is a payment primitive."
