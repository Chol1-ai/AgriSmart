const { OPENAI_API_KEY, OPENAI_MODEL } = require('../config/environment');

const getOpenAIConfig = () => ({
  apiKey: process.env.OPENAI_API_KEY || OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || OPENAI_MODEL || 'gpt-4o-mini'
});

const buildPrompt = ({ category, subject, imageData }) => {
  const imagePreview = String(imageData || '').slice(0, 120);
  return `You are an agricultural diagnosis assistant. The user provided a base64-encoded image and a subject/category.
- Determine whether the image is a real agricultural photo (crop, livestock, bird) or unrelated.
- If valid, return a JSON object with fields: isAuthenticImage (boolean), classification (crop|livestock|bird|unknown), diseaseName, severity, description, treatment, confidence (0-100), recommendations (array), summary.

User inputs:
- category: ${category}
- subject: ${subject}
- imageData sample: ${imagePreview}

Return ONLY valid JSON.`;
};

const tryOpenAI = async ({ category, subject, imageData }) => {
  const { apiKey, model } = getOpenAIConfig();
  if (!apiKey) return { error: { message: 'No OPENAI_API_KEY configured' } };

  const prompt = buildPrompt({ category, subject, imageData });

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.2
      })
    });

    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || '';
    if (!text) return { error: { message: 'OpenAI returned no text' } };

    const jsonText = text.replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/m, '$1');
    try {
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (err) {
      return { error: { message: 'OpenAI parse error', details: err.message, raw: text } };
    }
  } catch (error) {
    return { error: { message: error?.message || String(error) } };
  }
};

module.exports = { tryOpenAI };
