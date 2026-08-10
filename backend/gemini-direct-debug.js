require('./config/environment');
const fs = require('fs');
const path = require('path');
const { queryGeminiDiagnosis } = require('./services/geminiService');

// Prefer a real image file at backend/test-image.jpg or backend/test-image.png
const tryReadLocalImage = () => {
  const candidates = ['test-image.jpg', 'test-image.png', 'test-image.jpeg'];
  for (const name of candidates) {
    const p = path.resolve(__dirname, name);
    if (fs.existsSync(p)) {
      const buf = fs.readFileSync(p);
      const mime = name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  }
  return null;
};

// Fallback: a tiny valid 1x1 PNG base64
const FALLBACK_1PX_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

(async () => {
  console.log('[Gemini Debug] preparing image data');
  let imageData = tryReadLocalImage();
  if (!imageData) {
    console.log('[Gemini Debug] no local test image found; using built-in 1x1 PNG fallback');
    imageData = FALLBACK_1PX_PNG;
  } else {
    console.log('[Gemini Debug] using local test image for request');
  }

  console.log('[Gemini Debug] calling queryGeminiDiagnosis');
  const result = await queryGeminiDiagnosis({ category: 'crop', subject: 'tomato', imageData });
  console.log('[Gemini Debug] result:', JSON.stringify(result, null, 2));
})();
