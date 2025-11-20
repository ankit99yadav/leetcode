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
        language: 'javascript'
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

    const code = `/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n  let minPrice = Infinity;\n  let best = 0;\n  for (const price of prices) {\n    if (price < minPrice) minPrice = price;\n    const profit = price - minPrice;\n    if (profit > best) best = profit;\n  }\n  return best;\n};`;

    const result = await invokeRun(problem._id, code);
    console.log('Harness test completed. success =', result.success);
  } catch (err) {
    console.error('Harness test failed:', err);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
