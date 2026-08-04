const { GEMINI_MODEL, GEMINI_API_URL } = require('../config/environment');

const DEFAULT_MODEL = 'gemini-1.5';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const getGeminiConfig = () => ({
  apiKey: process.env.GEMINI_API_KEY || require('../config/environment').GEMINI_API_KEY || '',
  model: process.env.GEMINI_MODEL || GEMINI_MODEL || DEFAULT_MODEL,
  apiUrl: process.env.GEMINI_API_URL || GEMINI_API_URL || DEFAULT_BASE_URL
});

const extractTextFromResponse = (payload) => {
  if (!payload) return '';

  const candidate = Array.isArray(payload.candidates) ? payload.candidates[0] : null;
  const parts = candidate?.content?.parts || [];

  if (parts.length) {
    const textParts = parts
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .filter(Boolean);
    if (textParts.length) {
      return textParts.join('');
    }
  }

  if (Array.isArray(payload.candidates) && payload.candidates[0]?.output) {
    return payload.candidates[0].output;
  }
  if (Array.isArray(payload.output)) {
    return payload.output.map((item) => item.text || '').join('');
  }
  if (Array.isArray(payload.choices) && payload.choices[0]?.message?.content) {
    return payload.choices[0].message.content.map((item) => item.text || '').join('');
  }
  return '';
};

const buildPrompt = ({ category, subject, imageData }) => {
  const imagePreview = String(imageData || '').slice(0, 120);
  return `You are Gemini, an agricultural diagnosis assistant.
Receive a user-supplied image encoded as base64 along with a selected subject and category.

Instructions:
- Determine whether the image appears to be a real agricultural photograph, a bird, a livestock animal, or an unrelated screenshot/code image.
- Prefer the explicit category provided by the user, but note if the subject contradicts the category.
- If the image is not a photograph of a crop, bird, or animal, return a no-diagnosis response.
- If the image is valid, return a diagnosis or healthy assessment appropriate to the category.

Return only valid JSON with these fields:
{
  "isAuthenticImage": boolean,
  "classification": "crop" | "livestock" | "bird" | "unknown",
  "diseaseName": string,
  "severity": string,
  "description": string,
  "treatment": string,
  "confidence": number,
  "summary": string
}

User inputs:
- category: ${category}
- subject: ${subject}
- imageData sample: ${imagePreview}

If the subject or category is invalid or the image is unrelated, set isAuthenticImage to false and classification to "unknown".
`;
};

const buildInlineImagePart = (imageData) => {
  if (!imageData) return null;

  const match = String(imageData).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    return null;
  }

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2]
    }
  };
};

const queryGeminiDiagnosis = async ({ category, subject, imageData }) => {
  const { apiKey, model, apiUrl } = getGeminiConfig();
  if (!apiKey) return null;
  try {
    const url = `${apiUrl}/${model}:generateContent?key=${apiKey}`;
    const imagePart = buildInlineImagePart(imageData);
    console.log('[Gemini] Sending diagnosis request', {
      category,
      subject,
      imageLength: String(imageData || '').length,
      hasImagePart: Boolean(imagePart),
      model
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { text: buildPrompt({ category, subject, imageData }) },
            ...(imagePart ? [imagePart] : [])
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 400
        }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] API response error:', response.status, errorText);
      return null;
    }

    const payload = await response.json();
    const output = extractTextFromResponse(payload).trim();
    console.log('[Gemini] Response received', {
      outputPreview: output.slice(0, 300),
      payloadKeys: Object.keys(payload || {})
    });
    if (!output) return null;

    const jsonText = output.replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/m, '$1');
    try {
      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (error) {
      console.error('Gemini parse error:', error.message, jsonText);
      return null;
    }
  } catch (error) {
    console.error('Gemini diagnosis error:', error.message);
    return null;
  }
};

module.exports = { queryGeminiDiagnosis };