const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Problem = require('../src/models/problem');

(async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECT_STRING, {
      dbName: process.env.DB_NAME || 'leetcode'
    });
    console.log('MongoDB connected\n');

    const problems = await Problem.find({}).select('title visibleTestCases').lean();
    
    console.log(`Found ${problems.length} problems:\n`);
    
    problems.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.title}`);
      if (p.visibleTestCases && p.visibleTestCases.length > 0) {
        const tc = p.visibleTestCases[0];
        console.log(`   Input:  ${tc.input.substring(0, 100)}`);
        console.log(`   Output: ${tc.output}`);
      }
      console.log('');
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
