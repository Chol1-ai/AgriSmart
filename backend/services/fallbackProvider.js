// Simple fallback provider adapter. Supports provider 'local' (uses local inference)
// and 'openai' (calls OpenAI Chat Completions). Returns an object matching the
// diagnosis result shape used by the app or `{ error: { ... } }` on failure.

const tryFallback = async ({ provider, category, subject, imageData }) => {
  const p = String(provider || 'local').toLowerCase();
  if (!p || p === 'local') {
    try {
      // require dynamically to avoid circular dependency
      const ds = require('./diagnosisService');
      const { diagnosis, confidence } = ds.inferDiseaseFromImage(category, subject, imageData);
      return {
        isAuthenticImage: true,
        classification: category || 'crop',
        diseaseName: diagnosis.disease,
        severity: diagnosis.severity,
        description: diagnosis.description,
        treatment: diagnosis.treatment,
        recommendations: [
          'Monitor the subject over the next few days.',
          'Capture a second photo in better lighting if symptoms are unclear.',
          'Seek expert review if condition persists.'
        ],
        confidence: Math.round(confidence * 100),
        summary: `${diagnosis.disease} (local fallback inference)`
      };
    } catch (err) {
      return { error: { message: 'Local fallback failed', details: err?.message || String(err) } };
    }
  }

  if (p === 'openai') {
    try {
      const { tryOpenAI } = require('./openaiFallback');
      return await tryOpenAI({ category, subject, imageData });
    } catch (err) {
      return { error: { message: 'OpenAI fallback failed', details: err?.message || String(err) } };
    }
  }

  return { error: { message: `Fallback provider '${provider}' is not implemented` } };
};

module.exports = { tryFallback };
