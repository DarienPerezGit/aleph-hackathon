import crypto from 'node:crypto';

const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

async function main() {
  const solverBaseUrl = process.env.SOLVER_BASE_URL || 'http://localhost:3001';
  const submitUrl = `${solverBaseUrl}/intent`;

  const intentHash = `0x${crypto.randomBytes(32).toString('hex')}`;
  console.log(`INTENT_HASH=${intentHash}`);

  const payload = {
    intentHash,
    signature: '0xqa',
    signer: '0xa2e036eD6f43baC9c67B6B098E8B006365b01464',
    setupMode: 'qa-e2e',
    intent: {
      recipient: '0xa2e036eD6f43baC9c67B6B098E8B006365b01464',
      amountWei: '100000000000000',
      condition: 'contains GenLayer',
      evidenceUrl: 'https://raw.githubusercontent.com/genlayerlabs/genlayer-project-boilerplate/main/README.md',
      deadline: 9999999999,
      nonce: '1234567890'
    }
  };

  const postRes = await fetch(submitUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const postBody = await postRes.text();
  console.log(`POST_STATUS=${postRes.status}`);
  console.log(`POST_BODY=${postBody}`);

  for (let attempt = 1; attempt <= 15; attempt += 1) {
    await delay(4000);
    const statusRes = await fetch(`${solverBaseUrl}/intent/${intentHash}/status`);
    const status = await statusRes.json();

    console.log(
      `POLL ${attempt}: status=${status.status} escrowTx=${status.escrowTxHash || ''} settlementTx=${status.settlementTxHash || ''} error=${status.error || ''}`
    );

    if (['RELEASED', 'REFUNDED', 'ERROR'].includes(status.status)) {
      break;
    }
  }
}

main().catch((error) => {
  console.error('E2E_RUNNER_ERROR', error?.message || String(error));
  process.exit(1);
});
