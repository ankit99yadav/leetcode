const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Problem = require('../src/models/problem');
const { runCode } = require('../src/controllers/userSubmission');

const connect = async () => {
  const connStr = process.env.DB_CONNECT_STRING;
  const dbName = process.env.DB_NAME || 'leetcode';
  await mongoose.connect(connStr, { dbName });
  console.log('MongoDB connected to DB:', dbName);
};

const invokeRun = (problemId, code) => {
  return new Promise((resolve, reject) => {
    const req = {
      params: { id: problemId.toString() },
      body: {
        code,
        language: 'java'
      }
    };

    const res = {
      status(statusCode) {
        this.statusCode = statusCode;
        return this;
      },
      json(payload) {
        console.log('Run response status:', this.statusCode);
        console.dir(payload, { depth: null });
        resolve(payload);
      }
    };

    runCode(req, res).catch(reject);
  });
};

(async () => {
  try {
    await connect();
    const problem = await Problem.findOne({ title: 'Best Time to Buy and Sell Stock' }).lean();
    if(!problem){
      throw new Error('Problem not found');
    }

    // Method-only Java (LeetCode style)
    const code = `int maxProfit(int[] prices){ int min=Integer.MAX_VALUE, best=0; for(int p: prices){ if(p<min) min=p; else best=Math.max(best, p-min);} return best; }`;

    const result = await invokeRun(problem._id, code);
    console.log('Java harness test completed. success =', result.success);
  } catch (err) {
    console.error('Java harness test failed:', err);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
