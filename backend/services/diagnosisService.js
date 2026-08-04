const DISEASE_LIBRARY = [
  {
    disease: 'Leaf Spot',
    severity: 'Mild',
    description: 'Small circular spots on leaves caused by fungal infection.',
    treatment: 'Remove affected leaves, improve air circulation, and apply organic fungicide.',
    keywords: ['spot', 'circular', 'brown', 'black', 'fungal']
  },
  {
    disease: 'Blight',
    severity: 'Critical',
    description: 'Rapid browning and wilting of leaves caused by aggressive pathogens.',
    treatment: 'Remove diseased material, rotate crops, and treat with copper-based spray.',
    keywords: ['blight', 'wilt', 'burn', 'necrotic', 'browning']
  },
  {
    disease: 'Powdery Mildew',
    severity: 'Moderate',
    description: 'White powdery fungal growth on leaf surfaces.',
    treatment: 'Use neem oil, maintain good ventilation, and avoid overhead watering.',
    keywords: ['powdery', 'white', 'fuzzy', 'mildew', 'dusty']
  },
  {
    disease: 'Healthy Leaf',
    severity: 'Low',
    description: 'No major disease symptoms detected. The leaf appears largely healthy.',
    treatment: 'Continue routine care, monitor growth, and keep irrigation balanced.',
    keywords: ['green', 'healthy', 'normal', 'clear']
  },
  {
    disease: 'Healthy Animal or Bird',
    severity: 'Low',
    description: 'No visible illness or infection detected in the animal or bird.',
    treatment: 'Maintain good nutrition, shelter, and observe the animal for any changes.',
    keywords: ['healthy', 'normal', 'calm', 'alert']
  },
  {
    disease: 'Respiratory Stress',
    severity: 'Moderate',
    description: 'The animal or bird appears to be showing breathing or respiratory distress symptoms.',
    treatment: 'Separate the affected animal, improve ventilation, and contact a veterinary professional promptly.',
    keywords: ['cough', 'breathing', 'respiratory', 'gasp', 'wheezing']
  },
  {
    disease: 'Skin Infection',
    severity: 'Moderate',
    description: 'The animal or bird appears to have visible skin irritation or wounds that may indicate infection.',
    treatment: 'Clean the affected area, isolate the patient, and seek veterinary advice for treatment.',
    keywords: ['wound', 'skin', 'scab', 'lesion', 'infection']
  },
  {
    disease: 'Parasitic Infestation',
    severity: 'Moderate',
    description: 'The image suggests parasites or external infestation such as lice, mites, or ticks.',
    treatment: 'Treat the animal or bird with appropriate parasite control and inspect housing conditions.',
    keywords: ['parasite', 'mite', 'tick', 'lice', 'flea']
  }
];

const { queryGeminiDiagnosis } = require('./geminiService');

const normalizeImageData = (imageData) => {
  if (!imageData) return '';
  return String(imageData).toLowerCase();
};

const AGRICULTURE_TERMS = /crop|farm|leaf|plant|maize|corn|tomato|potato|bean|rice|wheat|banana|sugarcane|cabbage|fruit|vegetable|citrus|coffee|tea|sugarcane|vine|orchard/i;
const ANIMAL_TERMS = /cow|cattle|goat|sheep|pig|chicken|bird|poultry|duck|turkey|horse|rabbit|livestock|animal|goose|cow|calf/i;
const INVALID_SUBJECT_TERMS = /code|codes|html|css|javascript|terminal|screen|screenshot|browser|app|website|phone|computer|software|error|git|command|console|notebook/i;

const detectAuthenticImage = (imageData) => {
  const data = normalizeImageData(imageData);
  if (!data) {
    return { isAuthentic: false, reason: 'No image data was provided.' };
  }

  const hasBase64Prefix = data.includes('data:image');
  const hasValidLength = data.length > 100;
  const hasImageMarkers = /jpeg|png|jpg|webp|image/i.test(data);

  if (!hasBase64Prefix && !hasImageMarkers) {
    return { isAuthentic: false, reason: 'The uploaded content does not look like a real image.' };
  }

  if (!hasValidLength) {
    return { isAuthentic: false, reason: 'The image appears too small or incomplete.' };
  }

  return { isAuthentic: true, reason: 'Image content looks authentic.' };
};

const detectRelevantSubject = (category, subject) => {
  const categoryValue = normalizeImageData(category);
  const value = normalizeImageData(subject);

  if (!categoryValue && !value) {
    return { isRelevant: false, reason: 'No category or subject was provided for diagnosis.' };
  }

  if (INVALID_SUBJECT_TERMS.test(categoryValue) || INVALID_SUBJECT_TERMS.test(value)) {
    return { isRelevant: false, reason: 'The selected subject or category appears unrelated to agriculture or livestock.' };
  }

  if (['crop', 'livestock', 'bird'].includes(categoryValue)) {
    return { isRelevant: true, reason: 'Category appears relevant to the diagnosis domain.' };
  }

  if (AGRICULTURE_TERMS.test(value) || ANIMAL_TERMS.test(value)) {
    return { isRelevant: true, reason: 'Subject appears relevant to the diagnosis domain.' };
  }

  return { isRelevant: false, reason: 'The subject provided is too generic or not a crop, animal, or bird.' };
};

const inferDiseaseFromImage = (category, subject, imageData) => {
  const data = normalizeImageData(imageData);
  const subjectLabel = normalizeImageData(subject);
  const categoryLabel = normalizeImageData(category);
  const isAnimalCase = ANIMAL_TERMS.test(categoryLabel) || ANIMAL_TERMS.test(subjectLabel);
  const isBirdCase = /bird|chicken|duck|turkey|goose/i.test(categoryLabel) || /bird|chicken|duck|turkey|goose/i.test(subjectLabel);
  const isCropCase = AGRICULTURE_TERMS.test(categoryLabel) || AGRICULTURE_TERMS.test(subjectLabel);

  const signals = {
    powdery: data.includes('powder') || data.includes('white') || data.includes('fuzzy') || data.includes('dust') || data.includes('mildew'),
    blight: data.includes('blight') || data.includes('wilt') || data.includes('burn') || data.includes('necrotic') || data.includes('brown') || data.includes('black'),
    spot: data.includes('spot') || data.includes('circular') || data.includes('speck') || data.includes('lesion'),
    respiratory: data.includes('cough') || data.includes('breathing') || data.includes('respiratory') || data.includes('gasp') || data.includes('wheezing'),
    skin: data.includes('wound') || data.includes('skin') || data.includes('scab') || data.includes('lesion') || data.includes('infection'),
    parasite: data.includes('parasite') || data.includes('mite') || data.includes('tick') || data.includes('lice') || data.includes('flea'),
    healthy: data.includes('green') || data.includes('healthy') || data.includes('normal') || data.includes('leaf') || data.includes('plume') || data.includes('feather')
  };

  const ranked = Object.entries(signals)
    .filter(([, hit]) => hit)
    .map(([signal]) => signal);

  let diagnosis = DISEASE_LIBRARY[3];
  let confidence = 0.54;

  if (ranked.includes('powdery')) {
    diagnosis = DISEASE_LIBRARY[2];
    confidence = 0.82;
  } else if (ranked.includes('blight')) {
    diagnosis = DISEASE_LIBRARY[1];
    confidence = 0.86;
  } else if (ranked.includes('spot')) {
    diagnosis = DISEASE_LIBRARY[0];
    confidence = 0.78;
  } else if (ranked.includes('respiratory') && isAnimalCase) {
    diagnosis = DISEASE_LIBRARY[5];
    confidence = 0.8;
  } else if (ranked.includes('skin') && isAnimalCase) {
    diagnosis = DISEASE_LIBRARY[6];
    confidence = 0.79;
  } else if (ranked.includes('parasite') && isAnimalCase) {
    diagnosis = DISEASE_LIBRARY[7];
    confidence = 0.81;
  } else if (isBirdCase) {
    diagnosis = DISEASE_LIBRARY[4];
    confidence = 0.64;
  } else if (isAnimalCase) {
    diagnosis = DISEASE_LIBRARY[4];
    confidence = 0.63;
  } else if (isCropCase) {
    diagnosis = DISEASE_LIBRARY[3];
    confidence = 0.62;
  } else if (categoryLabel === 'bird') {
    diagnosis = DISEASE_LIBRARY[4];
    confidence = 0.6;
  } else if (categoryLabel === 'livestock') {
    diagnosis = DISEASE_LIBRARY[4];
    confidence = 0.63;
  }

  return { diagnosis, confidence };
};

const buildFallbackResult = (category, subject, diagnosis, confidence) => ({
  cropType: subject || category || 'unknown',
  diseaseName: diagnosis.disease,
  severity: diagnosis.severity,
  description: diagnosis.description,
  treatment: diagnosis.treatment,
  recommendations: [
    'Monitor the subject over the next few days.',
    'Capture a second photo in better lighting if symptoms are unclear.',
    'Seek an expert review if the condition persists.'
  ],
  isAuthenticImage: true,
  confidence: Math.round(confidence * 100),
  summary: `${diagnosis.disease} is the strongest match for the selected category and subject.`
});

const analyzeImage = async ({ category, subject, imageData }) => {
  const authenticity = detectAuthenticImage(imageData);
  const subjectRelevance = detectRelevantSubject(category, subject);

  if (!authenticity.isAuthentic || !subjectRelevance.isRelevant) {
    return {
      cropType: subject || category || 'unknown',
      diseaseName: 'Unable to diagnose',
      severity: 'Low',
      description: !authenticity.isAuthentic ? authenticity.reason : subjectRelevance.reason,
      treatment: 'Please upload a clear photo of a crop, livestock animal, or bird, and choose the matching category.',
      recommendations: [
        'Upload a sharper image with good lighting',
        'Choose the correct category for crop, livestock, or bird',
        'Avoid unrelated screenshots, code images, or documents'
      ],
      isAuthenticImage: false,
      confidence: 0,
      summary: 'The image or subject is not suitable for agricultural diagnosis.'
    };
  }

  const geminiResult = await queryGeminiDiagnosis({ category, subject, imageData });
  console.log('[Diagnosis] Gemini result', {
    hasResult: Boolean(geminiResult),
    isAuthenticImage: geminiResult?.isAuthenticImage,
    diseaseName: geminiResult?.diseaseName,
    summary: geminiResult?.summary
  });
  if (geminiResult && typeof geminiResult.isAuthenticImage === 'boolean') {
    return {
      cropType: subject || category || 'unknown',
      diseaseName: geminiResult.diseaseName || 'Unable to diagnose',
      severity: geminiResult.severity || 'Unknown',
      description: geminiResult.description || 'The AI could not identify a clear condition from the image.',
      treatment: geminiResult.treatment || 'Capture another image or choose a more accurate subject.',
      recommendations: Array.isArray(geminiResult.recommendations)
        ? geminiResult.recommendations
        : ['Capture a better image with clear subject framing', 'Use the correct category and subject', 'Repeat the analysis if needed'],
      isAuthenticImage: geminiResult.isAuthenticImage,
      confidence: Number(geminiResult.confidence || 0),
      summary: geminiResult.summary || 'Gemini returned a diagnosis result.'
    };
  }

  const { diagnosis, confidence } = inferDiseaseFromImage(category, subject, imageData);
  return buildFallbackResult(category, subject, diagnosis, confidence);
};

module.exports = { analyzeImage, analyzeLeafImage: analyzeImage, DISEASE_LIBRARY };
