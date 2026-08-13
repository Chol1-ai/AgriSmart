const { GEMINI_MODEL, GEMINI_API_URL } = require('../config/environment');
const { GoogleGenAI } = require('@google/genai');

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com';

const createClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || require('../config/environment').GEMINI_API_KEY || '';
  const apiUrl = process.env.GEMINI_API_URL || GEMINI_API_URL || DEFAULT_BASE_URL;
  return new GoogleGenAI({ apiKey, httpOptions: { baseUrl: apiUrl } });
};

const extractText = (response) => {
  const payload = response?.data ?? response;
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  const candidate = Array.isArray(payload.candidates) ? payload.candidates[0] : null;
  const parts = candidate?.content?.parts || [];
  if (parts.length) return parts.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('');
  if (Array.isArray(payload.output)) return payload.output.map((o) => o.text || '').join('');
  if (Array.isArray(payload.choices) && payload.choices[0]?.message?.content) return payload.choices[0].message.content.map((c) => c.text || '').join('');
  return '';
};

exports.chat = async (req, res) => {
  try {
    const { message, context } = req.body || {};
    if (!message || typeof message !== 'string') return res.status(400).json({ message: 'Missing message text' });
    const model = process.env.GEMINI_MODEL || GEMINI_MODEL || DEFAULT_MODEL;
    const ai = createClient();
    const contents = [
      { role: 'system', parts: [{ text: 'You are AgriAI, a helpful agricultural assistant.' }] },
      { role: 'user', parts: [{ text: String(context || '') }, { text: String(message) }] }
    ];
    const response = await ai.models.generateContent({ model, contents, config: { temperature: 0.5, maxOutputTokens: 300 } });
    const text = extractText(response) || (response?.text || '');
    res.json({ reply: text });
  } catch (error) {
    res.status(500).json({ message: 'Assistant error', error: error.message || String(error) });
  }
};
