require('dotenv').config();
const { submitBatch, submitToken } = require('../src/utils/problemUtility');

(async () => {
  try {
    if (!process.env.JUDGE0_KEY) {
      throw new Error('JUDGE0_KEY not set in environment');
    }

    const jsCode = `const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trim().split(/\s+/).map(Number);
const a = input[0] || 0, b = input[1] || 0;
console.log(a + b);`;

    const submissions = [{
      source_code: jsCode,
      language_id: 63, // JavaScript (Node.js)
      stdin: '2 3',
      expected_output: '5' // Judge0 compares trimmed values when base64_encoded=false
    }];

    console.log('Submitting test to Judge0...');
    const submitRes = await submitBatch(submissions);
    if (!Array.isArray(submitRes) || !submitRes[0]?.token) {
      throw new Error('Unexpected submitBatch response');
    }

    const tokens = submitRes.map(s => s.token);
    const results = await submitToken(tokens);

    const r = results[0];
    const statusId = r.status_id;
    const statusDesc = r?.status?.description || String(statusId);

    console.log('Judge0 status:', statusDesc);
    console.log('stdout:', r.stdout);
    console.log('stderr:', r.stderr);
    console.log('compile_output:', r.compile_output);

    if (statusId === 3 && (r.stdout || '').trim() === '5') {
      console.log('Smoke test passed ✅');
      process.exit(0);
    } else {
      console.error('Smoke test failed ❌');
      process.exit(2);
    }
  } catch (err) {
    console.error('Smoke test error:', err.message || err);
    process.exit(1);
  }
})();
