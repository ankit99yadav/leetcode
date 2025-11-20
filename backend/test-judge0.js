require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');

console.log('Testing Judge0 API...\n');
console.log('JUDGE0_KEY:', process.env.JUDGE0_KEY ? `${process.env.JUDGE0_KEY.substring(0,10)}...` : 'NOT FOUND');

const testJudge0 = async () => {
  try {
    // Simple "Hello World" test
    const submission = {
      source_code: 'console.log("Hello World")',
      language_id: 63, // JavaScript
      stdin: ''
    };

    console.log('\n📤 Sending test submission to Judge0...');
    console.log('Code:', submission.source_code);
    
    const submitOptions = {
      method: 'POST',
      url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
      params: { base64_encoded: 'false' },
      headers: {
        'x-rapidapi-key': process.env.JUDGE0_KEY,
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: {
        submissions: [submission]
      }
    };

    const submitResponse = await axios.request(submitOptions);
    console.log('✅ Submit response status:', submitResponse.status);
    console.log('📥 Submit response:', JSON.stringify(submitResponse.data, null, 2));

    // Judge0 returns array directly
    const submissions = Array.isArray(submitResponse.data) ? submitResponse.data : submitResponse.data.submissions;
    
    if(!submissions || !submissions[0]) {
      console.error('❌ No token received!');
      return;
    }

    const token = submissions[0].token;
    console.log('\n✅ Got token:', token);

    // Poll for result
    console.log('\n⏳ Polling for result...');
    const pollOptions = {
      method: 'GET',
      url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
      params: {
        tokens: token,
        base64_encoded: 'false',
        fields: '*'
      },
      headers: {
        'x-rapidapi-key': process.env.JUDGE0_KEY,
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
      }
    };

    let attempts = 0;
    while(attempts < 10) {
      attempts++;
      await new Promise(r => setTimeout(r, 1000));
      
      const pollResponse = await axios.request(pollOptions);
      const results = Array.isArray(pollResponse.data) ? pollResponse.data : pollResponse.data.submissions;
      const result = results[0];
      
      console.log(`Poll ${attempts}: status_id=${result.status_id} (${result.status?.description || 'unknown'})`);
      
      if(result.status_id > 2) {
        console.log('\n✅ Result obtained!');
        console.log('📥 Full result:', JSON.stringify(result, null, 2));
        
        if(result.status_id === 3) {
          console.log('\n🎉 SUCCESS! Judge0 is working correctly.');
        } else {
          console.log('\n⚠️ Execution failed with status:', result.status?.description);
        }
        break;
      }
    }

  } catch (error) {
    console.error('\n❌❌❌ ERROR ❌❌❌');
    console.error('Message:', error.message);
    console.error('Response status:', error?.response?.status);
    console.error('Response data:', JSON.stringify(error?.response?.data, null, 2));
    console.error('Response headers:', JSON.stringify(error?.response?.headers, null, 2));
  }
};

testJudge0();
