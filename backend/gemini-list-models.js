require('./config/environment');
const https = require('https');
const { GEMINI_API_URL } = require('./config/environment');

const apiKey = process.env.GEMINI_API_KEY || require('./config/environment').GEMINI_API_KEY || '';
const apiUrl = process.env.GEMINI_API_URL || GEMINI_API_URL || 'https://generativelanguage.googleapis.com';

if (!apiKey) {
  console.error('No GEMINI_API_KEY found in environment.');
  process.exit(1);
}

const url = `${apiUrl.replace(/\/$/, '')}/v1/models?key=${apiKey}`;
console.log('[Gemini List] Fetching models from', url);

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('[Gemini List] Status', res.statusCode);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error('[Gemini List] Failed to parse response:', e.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (err) => {
  console.error('[Gemini List] Request error:', err.message);
});
