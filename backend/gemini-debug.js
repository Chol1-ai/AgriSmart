const { queryGeminiDiagnosis } = require('./services/geminiService');

const originalFetch = global.fetch;

global.fetch = async (url, options) => {
  console.log('FETCH CALLED', url);
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

(async () => {
  try {
    const result = await queryGeminiDiagnosis({ category: 'crop', subject: 'maize', imageData: 'data:image/jpeg;base64,abc123' });
    console.log('RESULT', result);
  } catch (err) {
    console.error('ERROR', err);
    console.error(err.stack);
  } finally {
    global.fetch = originalFetch;
  }
})();