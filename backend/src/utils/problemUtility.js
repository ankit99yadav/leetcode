const axios = require('axios');

// Determine if using self-hosted or RapidAPI Judge0
const getJudge0Config = () => {
  const selfHostedUrl = process.env.JUDGE0_URL;
  const rapidApiKey = process.env.JUDGE0_KEY;
  
  if(selfHostedUrl) {
    console.log('🏠 Using self-hosted Judge0:', selfHostedUrl);
    return {
      baseUrl: selfHostedUrl,
      headers: { 'Content-Type': 'application/json' },
      isSelfHosted: true
    };
  }
  
  if(rapidApiKey) {
    console.log('☁️ Using RapidAPI Judge0');
    return {
      baseUrl: 'https://judge0-ce.p.rapidapi.com',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      isSelfHosted: false
    };
  }
  
  throw new Error('Judge0 not configured. Set JUDGE0_URL (self-hosted) or JUDGE0_KEY (RapidAPI) in .env');
};

const getLanguageById = (lang)=>{

    const language = {
        "c++":54,
        "java":62,
        "javascript":63
    }


    return language[lang.toLowerCase()];
}


const encodeIfNeeded = (str) => {
  if(str == null) return '';
  const s = typeof str === 'string' ? str : String(str);
  return Buffer.from(s, 'utf8').toString('base64');
};

const decodeIfBase64 = (b64) => {
  if(!b64 || typeof b64 !== 'string') return b64;
  // Judge0 only sends base64 when we requested; attempt decode and fallback
  try { return Buffer.from(b64, 'base64').toString('utf8'); } catch { return b64; }
};

const submitBatch = async (submissions)=>{
  console.log('\n🔵 submitBatch called with', submissions.length, 'submissions');
  const config = getJudge0Config();

  // Encode attributes to avoid UTF-8 conversion errors
  const encodedSubs = submissions.map(s => ({
    source_code: encodeIfNeeded(s.source_code),
    language_id: s.language_id,
    stdin: encodeIfNeeded(s.stdin),
    expected_output: encodeIfNeeded(s.expected_output)
  }));

  const options = {
    method: 'POST',
    url: `${config.baseUrl}/submissions/batch`,
    params: { base64_encoded: 'true' },
    headers: config.headers,
    data: { submissions: encodedSubs }
  };

  console.log('📤 Sending POST to Judge0 batch endpoint...');
  console.log('Sample submission:', JSON.stringify(submissions[0], null, 2));
  try {
    const response = await axios.request(options);
    console.log('📥 Judge0 response status:', response.status);
    console.log('📥 Judge0 response data:', JSON.stringify(response.data, null, 2));
    const data = response.data;
    
    // Judge0 batch API returns array directly, not {submissions: [...]}
    if(Array.isArray(data)){
      console.log('✅ Got', data.length, 'submission tokens');
      console.log('Tokens:', data.map(s=>s.token).join(', '));
      return data;
    }
    // Fallback: check if it has submissions property
    if(data && Array.isArray(data.submissions)){
      console.log('✅ Got', data.submissions.length, 'submission tokens (via submissions property)');
      console.log('Tokens:', data.submissions.map(s=>s.token).join(', '));
      return data.submissions;
    }
    console.error('❌ Invalid Judge0 response structure:', data);
    throw new Error('Invalid response from Judge0 (expected array or submissions property)');
  } catch (error) {
    console.error('\n❌❌❌ submitBatch AXIOS ERROR ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Response status:', error?.response?.status);
    console.error('Response data:', JSON.stringify(error?.response?.data, null, 2));
    
    // If batch quota exceeded (429), try fallback to individual submissions
    if(error?.response?.status === 429 && error?.response?.data?.message?.includes('Batched Submissions')) {
      console.log('⚠️ Batch quota exceeded, falling back to individual submissions...');
      
      // Extract reset time from headers
      const resetSeconds = parseInt(error?.response?.headers?.['x-ratelimit-batched-submissions-reset'] || '0');
      const resetHours = Math.floor(resetSeconds / 3600);
      const resetMinutes = Math.floor((resetSeconds % 3600) / 60);
      const resetTime = resetHours > 0 ? `${resetHours}h ${resetMinutes}m` : `${resetMinutes}m`;
      
      console.log(`⏰ Batch quota will reset in: ${resetTime}`);
      
      try {
        const tokens = [];
        for(let i = 0; i < encodedSubs.length; i++) {
          const singleOptions = {
            method: 'POST',
            url: `${config.baseUrl}/submissions`,
            params: { base64_encoded: 'true' },
            headers: config.headers,
            data: encodedSubs[i]
          };
          const res = await axios.request(singleOptions);
          tokens.push({ token: res.data.token });
          console.log(`✅ Submission ${i+1}/${encodedSubs.length} token:`, res.data.token);
        }
        return tokens;
      } catch (fallbackErr) {
        console.error('❌ Fallback also failed:', fallbackErr.message);
        
        // Check if regular submissions quota also exhausted
        if(fallbackErr?.response?.status === 429) {
          const resetSec = parseInt(fallbackErr?.response?.headers?.['x-ratelimit-submissions-reset'] || resetSeconds);
          const hrs = Math.floor(resetSec / 3600);
          const mins = Math.floor((resetSec % 3600) / 60);
          const waitTime = hrs > 0 ? `${hrs} hours ${mins} minutes` : `${mins} minutes`;
          
          throw new Error(`QUOTA_EXHAUSTED: Judge0 daily limit reached. Quota will reset in ${waitTime}. Please try again tomorrow or upgrade your plan.`);
        }
        
        const msg = fallbackErr?.response?.data ? JSON.stringify(fallbackErr.response.data) : (fallbackErr.message || 'Unknown Judge0 error');
        throw new Error(`Judge0 submit failed (fallback): ${msg}`);
      }
    }
    
    // Check for regular quota exhaustion
    if(error?.response?.status === 429) {
      const resetSeconds = parseInt(
        error?.response?.headers?.['x-ratelimit-submissions-reset'] || 
        error?.response?.headers?.['x-ratelimit-batched-submissions-reset'] || 
        '0'
      );
      const hours = Math.floor(resetSeconds / 3600);
      const minutes = Math.floor((resetSeconds % 3600) / 60);
      const waitTime = hours > 0 ? `${hours} hours ${minutes} minutes` : `${minutes} minutes`;
      
      throw new Error(`QUOTA_EXHAUSTED: Judge0 API daily limit exhausted. Quota will reset in ${waitTime}. Please wait or use self-hosted Judge0 (see judge0-setup/README.md).`);
    }
    
    console.error('Request config:', JSON.stringify({
      url: error?.config?.url,
      method: error?.config?.method,
      headers: error?.config?.headers
    }, null, 2));
    const msg = error?.response?.data ? JSON.stringify(error.response.data) : (error.message || 'Unknown Judge0 error');
    throw new Error(`Judge0 submit failed: ${msg}`);
  }
}


const waiting = (timer) => {
  return new Promise(resolve => {
    setTimeout(resolve, timer);
  });
}

// ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]

const submitToken = async(resultToken)=>{
  console.log('\n🔵 submitToken called with', resultToken.length, 'tokens');
  console.log('Tokens to poll:', resultToken.join(', '));
  const config = getJudge0Config();

  const options = {
    method: 'GET',
    url: `${config.baseUrl}/submissions/batch`,
    params: {
      tokens: resultToken.join(","),
      base64_encoded: 'true',
      fields: '*'
    },
    headers: config.headers
  };

  const fetchData = async () => {
    try {
      console.log('📤 Polling Judge0 batch results...');
      const response = await axios.request(options);
      console.log('📥 Poll response status:', response.status);
      return response.data;
    } catch (error) {
      console.error('\n❌❌❌ submitToken AXIOS ERROR ❌❌❌');
      console.error('Error message:', error.message);
      console.error('Response status:', error?.response?.status);
      console.error('Response data:', JSON.stringify(error?.response?.data, null, 2));
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : (error.message || 'Unknown Judge0 error');
      throw new Error(`Judge0 fetch failed: ${msg}`);
    }
  }

  let pollCount = 0;
  const MAX_POLLS = parseInt(process.env.JUDGE0_MAX_POLLS || '25',10); // ~25s default
  while(true){
    pollCount++;
    console.log('⏳ Poll attempt', pollCount, '/', MAX_POLLS);
    const result =  await fetchData();
    
    // Judge0 batch GET also returns array directly
    let submissions;
    if(Array.isArray(result)){
      submissions = result;
    } else if(result && Array.isArray(result.submissions)){
      submissions = result.submissions;
    } else {
      console.error('❌ Invalid poll response structure:', result);
      if(pollCount >= MAX_POLLS){
        throw new Error('Judge0 polling failed: invalid response structure');
      }
      await waiting(1000);
      continue;
    }
    
    const statuses = submissions.map(r => `${r.status_id}(${r.status?.description || 'unknown'})`);
    console.log('Status IDs:', statuses.join(', '));
    // Decode relevant fields if base64 encoded
    submissions = submissions.map(s => ({
      ...s,
      stdout: decodeIfBase64(s.stdout),
      stderr: decodeIfBase64(s.stderr),
      compile_output: decodeIfBase64(s.compile_output),
      expected_output: decodeIfBase64(s.expected_output)
    }));

    const completed = submissions.every((r)=>r.status_id>2);
    if(completed){
      console.log('✅ All submissions completed');
      return submissions;
    }
    if(pollCount >= MAX_POLLS){
      console.error('⛔ Judge0 polling timeout reached');
      // Return what we have (could still be processing) with a flag
      return submissions.map(s => ({...s, _timeout: s.status_id<=2}));
    }
    console.log('⏳ Still processing, waiting 1s...');
    await waiting(1000);
  }
}


module.exports = {getLanguageById,submitBatch,submitToken};








// 


