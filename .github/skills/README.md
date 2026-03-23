# Apolo Custom Skills

These skills are tailored for the Apolo hackathon workflow.
Use them as slash commands in chat (`/`).

## Skills

- `apolo-delivery-validator`  
  Build/refine `genlayer/DeliveryValidator.py` with binary approve/reject logic.

- `apolo-escrow-contract`  
  Implement/review `contracts/ApoloEscrow.sol` with intentHash-linked escrow flow.

- `apolo-relayer-bridge`  
  Build `scripts/apolo-relayer.mjs` to map validation decision into release/refund.

- `apolo-hackathon-gate`  
  Run final compliance check against constraints, tracks, and definition of done.

## Notes

- All skills enforce fresh implementation constraints.
- All skills assume `docs/ARCHITECTURE.md`, `docs/README.md`, `.env.example`, and `CLAUDE.md` as primary context.
