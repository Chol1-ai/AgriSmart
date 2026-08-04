const test = require('node:test');
const assert = require('node:assert/strict');
const { queryGeminiDiagnosis } = require('../services/geminiService');

const originalEnv = process.env.GEMINI_API_KEY;
const originalFetch = global.fetch;

test('queryGeminiDiagnosis sends image data to the current Gemini generateContent API', async () => {
  process.env.GEMINI_API_KEY = 'test-key';

  let capturedRequest;
  global.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"isAuthenticImage":true,"diseaseName":"Healthy Leaf","severity":"Low","description":"Healthy","treatment":"Keep watering","confidence":90,"summary":"Healthy"}' }]
          }
        }]
      })
    };
  };

  try {
    const result = await queryGeminiDiagnosis({
      category: 'crop',
      subject: 'maize',
      imageData: 'data:image/jpeg;base64,abc123'
    });

    assert.equal(result.diseaseName, 'Healthy Leaf');
    assert.match(capturedRequest.url, /generateContent\?key=test-key$/);
    assert.equal(capturedRequest.options.method, 'POST');
    const body = JSON.parse(capturedRequest.options.body);
    assert.ok(body.contents?.[0]?.parts?.some((part) => part.inlineData));
    assert.ok(body.contents?.[0]?.parts?.some((part) => part.text));
  } finally {
    global.fetch = originalFetch;
    if (originalEnv === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalEnv;
    }
  }
});
