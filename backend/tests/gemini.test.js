const test = require('node:test');
const assert = require('node:assert/strict');
const { queryGeminiDiagnosis } = require('../services/geminiService');

const originalEnv = process.env.GEMINI_API_KEY;
const originalFetch = global.fetch;

const createMockFetchResponse = (body) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: {
    *entries() {
      yield ['content-type', 'application/json'];
    },
    get(name) {
      return String(name).toLowerCase() === 'content-type' ? 'application/json' : null;
    }
  },
  json: async () => body
});

test('queryGeminiDiagnosis sends image data to the current Gemini generateContent API', async () => {
  process.env.GEMINI_API_KEY = 'test-key';

  let capturedRequest;
  global.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return createMockFetchResponse({
      candidates: [{
        content: {
          parts: [{ text: '{"isAuthenticImage":true,"diseaseName":"Healthy Leaf","severity":"Low","description":"Healthy","treatment":"Keep watering","confidence":90,"summary":"Healthy" }' }]
        }
      }]
    });
  };

  try {
    const result = await queryGeminiDiagnosis({
      category: 'crop',
      subject: 'maize',
      imageData: 'data:image/jpeg;base64,abc123'
    });

    assert.equal(result.diseaseName, 'Healthy Leaf');
    assert.match(capturedRequest.url, /generateContent$/);
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

test('queryGeminiDiagnosis extracts JSON from response payload with nested candidates', async () => {
  process.env.GEMINI_API_KEY = 'test-key';

  let capturedRequest;
  global.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return createMockFetchResponse({
      candidates: [
        {
          content: {
            parts: [
              { text: '{"isAuthenticImage":true,"diseaseName":"Healthy Leaf","severity":"Low","description":"Healthy","treatment":"Keep watering","confidence":90,"summary":"Healthy"}' }
            ]
          }
        }
      ]
    });
  };

  try {
    const result = await queryGeminiDiagnosis({
      category: 'crop',
      subject: 'maize',
      imageData: 'data:image/jpeg;base64,abc123'
    });

    assert.equal(result.diseaseName, 'Healthy Leaf');
    assert.match(capturedRequest.url, /generateContent$/);
    assert.equal(capturedRequest.options.method, 'POST');
  } finally {
    global.fetch = originalFetch;
    if (originalEnv === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalEnv;
    }
  }
});
