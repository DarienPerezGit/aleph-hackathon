#!/usr/bin/env bash
# circuits/setup.sh
# One-shot trusted setup for intent_hash circuit.
# Run from the repository root: bash circuits/setup.sh
#
# Requirements:
#   - circom  (npm i -g circom  OR  cargo install --git https://github.com/iden3/circom)
#   - snarkjs (npm i -g snarkjs)
#   - curl
#
# Outputs:
#   circuits/intent_hash.r1cs
#   circuits/intent_hash_js/intent_hash.wasm
#   circuits/intent_hash_final.zkey
#   circuits/verification_key.json
#   contracts/ZKVerifier.sol  ← auto-generated Solidity verifier

set -e

CIRCUITS_DIR="circuits"
CONTRACTS_DIR="contracts"
PTAU_FILE="$CIRCUITS_DIR/pot12_final.ptau"

echo "=== Apolo ZK Setup ==="

# ── 0. Check dependencies ──────────────────────────────────────────────────
if ! command -v circom &>/dev/null; then
  echo "ERROR: circom not found."
  echo "  Install via: npm install -g circom"
  echo "  OR: cargo install --git https://github.com/iden3/circom"
  exit 1
fi

if ! command -v snarkjs &>/dev/null; then
  echo "ERROR: snarkjs not found. Run: npm install -g snarkjs"
  exit 1
fi

# ── 1. Install circomlib if not present ────────────────────────────────────
if [ ! -d "node_modules/circomlib" ]; then
  echo "[1/6] Installing circomlib..."
  npm install circomlib --save-dev
else
  echo "[1/6] circomlib already installed."
fi

# ── 2. Compile circuit ─────────────────────────────────────────────────────
echo "[2/6] Compiling circuit..."
circom "$CIRCUITS_DIR/intent_hash.circom" --r1cs --wasm --sym -o "$CIRCUITS_DIR/"
echo "  → R1CS + WASM generated"

# ── 3. Download Powers of Tau (Hermez - pot12, no ceremony needed) ─────────
if [ ! -f "$PTAU_FILE" ]; then
  echo "[3/6] Downloading pot12_final.ptau from Hermez..."
  curl -L \
    "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau" \
    -o "$PTAU_FILE"
  # Fallback mirror if the above fails
  if [ ! -f "$PTAU_FILE" ]; then
    echo "  Primary mirror failed. Trying SnarkJS release mirror..."
    curl -L \
      "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau" \
      -o "$PTAU_FILE"
  fi
  echo "  → ptau downloaded: $PTAU_FILE"
else
  echo "[3/6] pot12_final.ptau already present."
fi

# ── 4. Groth16 trusted setup ───────────────────────────────────────────────
echo "[4/6] Running Groth16 setup..."
snarkjs groth16 setup \
  "$CIRCUITS_DIR/intent_hash.r1cs" \
  "$PTAU_FILE" \
  "$CIRCUITS_DIR/intent_hash_0.zkey"

echo "[4/6] Contributing to zkey (deterministic for demo)..."
echo "apolo-hackathon-zk-entropy-$(date +%s)" | \
  snarkjs zkey contribute \
    "$CIRCUITS_DIR/intent_hash_0.zkey" \
    "$CIRCUITS_DIR/intent_hash_final.zkey" \
    --name="Apolo Demo Contribution" -v

rm -f "$CIRCUITS_DIR/intent_hash_0.zkey"

# ── 5. Export verification key ─────────────────────────────────────────────
echo "[5/6] Exporting verification key..."
snarkjs zkey export verificationkey \
  "$CIRCUITS_DIR/intent_hash_final.zkey" \
  "$CIRCUITS_DIR/verification_key.json"
echo "  → verification_key.json"

# ── 6. Export Solidity verifier ────────────────────────────────────────────
echo "[6/6] Exporting Solidity verifier..."
snarkjs zkey export solidityverifier \
  "$CIRCUITS_DIR/intent_hash_final.zkey" \
  "$CONTRACTS_DIR/ZKVerifier.sol"

# snarkjs may generate ^0.6.11 pragma; patch to ^0.8.20 for Foundry
sed -i 's/pragma solidity \^0\.6\.11/pragma solidity ^0.8.20/' "$CONTRACTS_DIR/ZKVerifier.sol"
echo "  → contracts/ZKVerifier.sol (pragma patched to ^0.8.20)"

echo ""
echo "=== Setup complete! ==="
echo "  Circuit WASM:  $CIRCUITS_DIR/intent_hash_js/intent_hash.wasm"
echo "  Proving key:   $CIRCUITS_DIR/intent_hash_final.zkey"
echo "  Verif. key:    $CIRCUITS_DIR/verification_key.json"
echo "  Verifier:      $CONTRACTS_DIR/ZKVerifier.sol"
echo ""
echo "Next: node scripts/generate-proof.mjs <recipient> <amount> <nonce>"
