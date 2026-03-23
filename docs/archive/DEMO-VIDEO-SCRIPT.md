# Apolo — Demo Video Script (3:00)

> Word-by-word narration. Short sentences optimized for subtitles.
> Visual cues in **[BRACKETS]**.

---

## 0:00 – 0:20 → HOOK

**[BLACK SCREEN → Apolo logo fades in]**

> "Today, AI can decide whether money moves."

**[Pause 1 beat]**

> "That's powerful — and dangerous."

**[Cut to: simple animation — AI icon → arrow → dollar sign moving]**

> "What if the AI is wrong? What if it hallucinates?"

**[Text overlay: "Who stops it?"]**

> "Who stops it?"

---

## 0:20 – 0:50 → PROBLEM

**[Show: split screen — left: real-world delivery, right: smart contract code]**

> "Smart contracts are great at moving value. But they can't verify the real world."

> "Did the package arrive? Was the API delivered? Was the freelancer's work accepted?"

**[Show: AI chatbot icon with checkmark]**

> "AI can answer those questions. But AI also makes mistakes."

**[Show: two paths diverging — "No automation" vs "Unsafe automation"]**

> "Today you have two choices. Either do everything manually — or trust AI blindly."

> "Both are broken."

---

## 0:50 – 1:20 → SOLUTION

**[Show: Apolo architecture diagram — 4 layers: Intent → Escrow → Validation → Settlement]**

> "Apolo is an AI-validated escrow protocol with a built-in dispute window."

> "Here's how it works in one sentence:"

**[Text overlay, one line at a time:]**
- AI proposes truth.
- A dispute window protects it.
- Smart contracts enforce it.

> "AI proposes truth. A dispute window protects it. Smart contracts enforce it."

**[Show: pipeline graphic — Intent → Escrow → Validation → Finality → Settlement]**

> "Users sign an intent — what they want to happen. Funds go into escrow. AI validators reach consensus on whether the condition was met. Then there's a dispute window — like an optimistic rollup. Only after finality, the contract releases or refunds."

> "No blind trust. No manual review. Fully autonomous and safe."

---

## 1:20 – 2:20 → LIVE DEMO

**[Show: Apolo frontend UI]**

> "Let me show you this working end to end. This is not a mock. These are real transactions on real testnets."

### Step 1 — Intent (1:25)

**[Show: frontend → user fills in recipient, amount, condition → clicks "Sign Intent"]**

> "The user signs a payment intent using EIP-712. No gas fee. No wallet transaction. Just a typed signature declaring: I want to pay this person, this amount, if this condition is met."

**[Show: intent hash and signature appearing in the UI log panel]**

### Step 2 — Escrow (1:40)

**[Show: UI pipeline step 2 lights up → "Escrow funded"]**

> "The Solver deposits funds into the escrow contract on BSC Testnet."

**[Cut to: BscScan showing the escrow contract at `0x5191Bca4...`]**

> "Here's the escrow on BscScan. Funds are locked. The intent hash is the reference."

**[Highlight: BscScan tx confirmation]**

### Step 3 — AI Validation (1:55)

**[Show: GenLayer Studio UI → "Run with Full Consensus" → validators evaluating]**

> "Now, five AI validators on GenLayer evaluate the condition independently."

**[Show: GenLayer explorer — validator set, 4 out of 4 agree, result: ACCEPTED]**

> "Four out of four validators agree. The result is ACCEPTED."

**[Show: GenExplorer contract page at `0x619d0b8f...`]**

> "This is recorded on GenLayer Bradbury. You can verify it on the explorer."

### Step 4 — Finality (2:05)

**[Show: UI → "Pending finality" status]**

> "But here's the key. Even though AI agreed, the system waits."

> "There is a thirty-minute dispute window. Anyone can challenge the result."

**[Text overlay: "Optimistic Democracy — trust, but verify"]**

> "This is Optimistic Democracy. We trust AI — but we verify it."

### Step 5 — Settlement (2:12)

**[Show: UI → "Settlement: Released" with green checkmark]**

> "After finality, the relayer reads the outcome and triggers settlement on BSC."

**[Cut to: BscScan release transaction → `0x386dea5b...`]**

> "Here's the release transaction on BscScan. Funds moved to the recipient. Fully verifiable onchain."

**[Show: full UI pipeline — all 5 steps green: Intent ✓ → Escrow ✓ → Validation ✓ → Finality ✓ → Settlement ✓]**

> "End to end. Intent to settlement. AI-validated. Onchain-enforced."

---

## 2:20 – 2:50 → WHY THIS MATTERS

**[Show: clean slide — "A New Primitive"]**

> "This is not just a payment app. This is a new primitive."

> "We don't trust AI. We use optimistic verification."

> "We don't do manual escrow. We automate it — safely."

**[Show: use cases appearing one by one:]**
- Marketplaces
- Freelancer payments
- API delivery
- Autonomous agents

> "This works for marketplaces. For freelancers. For API monetization. For autonomous agents paying each other."

**[Show: sponsor logos — BNB Chain, GenLayer, Protocol Labs]**

> "Built on BNB Chain. Validated by GenLayer's Optimistic Democracy consensus. Every step verifiable onchain."

---

## 2:50 – 3:00 → CLOSING

**[Show: Apolo logo centered, dark background]**

> "Blockchains execute transactions."

**[Pause]**

> "Apolo validates outcomes — before value moves."

**[Text overlay fades in: "apolo.xyz — Intent-based payment infrastructure"]**

**[Hold 2 seconds → fade to black]**

---

## Reference Links for Screen Recordings

| What to show | URL |
|---|---|
| Escrow contract (BSC) | https://testnet.bscscan.com/address/0x5191Bca416e2De8dD7915bdD55bf625143ABB98C |
| Release tx (BSC) | https://testnet.bscscan.com/tx/0x386dea5bda30cef5a651ef259af24a8bf358afb8cb2f2e9a7a3a6dc6cdd1b9bc |
| Refund tx (BSC) | https://testnet.bscscan.com/tx/0xdf72daa0b6c1d3a2d17cfbb02fbf8f72f3310f236e1fda8a9e4d4fd3f8ad0190 |
| ZK proof tx (BSC) | https://testnet.bscscan.com/tx/0x1bce644f6ac296bbd5a75ffa0b783987d8648355bb4dd912d6cbe8970995ab3e |
| DeliveryValidator (GenLayer) | https://explorer-bradbury.genlayer.com/address/0x619d0b8f1b6C0F09118314c73Cbc45552D38E6BB |
| Validator deploy tx | https://explorer-bradbury.genlayer.com/tx/0xdc93fec50236e0e41a20b75779dbb73ff60cc17ca37dd69358d173c5b4156c9c |
| Validator set | https://explorer-bradbury.genlayer.com/validators |

## Recording Checklist

- [ ] Record frontend UI flow (Intent → Escrow → Validation → Finality → Settlement)
- [ ] Record BscScan escrow contract page (show funded state)
- [ ] Record BscScan release/refund tx confirmation
- [ ] Record GenLayer explorer — contract page showing validation result
- [ ] Record GenLayer Studio — "Full Consensus" run with 4/4 Agree
- [ ] Prepare architecture diagram slide
- [ ] Prepare use-cases slide
- [ ] Record voiceover separately for clean audio
- [ ] Total runtime: 2:55–3:00

## Word Count & Timing Check

| Section | Duration | Approx. words | Words/min |
|---|---|---|---|
| Hook | 20s | ~40 | 120 |
| Problem | 30s | ~60 | 120 |
| Solution | 30s | ~85 | 170 |
| Live Demo | 60s | ~175 | 175 |
| Why It Matters | 30s | ~70 | 140 |
| Closing | 10s | ~15 | 90 |
| **Total** | **3:00** | **~445** | **~148 avg** |

> Target pace: 140–160 words/min. Comfortable for non-native English speakers and subtitle readability.
