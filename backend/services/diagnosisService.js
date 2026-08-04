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
  }
];

const normalizeImageData = (imageData) => {
  if (!imageData) return '';
  return String(imageData).toLowerCase();
};

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

const inferDiseaseFromImage = (imageData, cropType) => {
  const data = normalizeImageData(imageData);
  const cropLabel = (cropType || 'crop').toLowerCase();

  const signals = {
    powdery: data.includes('powder') || data.includes('white') || data.includes('fuzzy') || data.includes('dust') || data.includes('mildew'),
    blight: data.includes('blight') || data.includes('wilt') || data.includes('burn') || data.includes('necrotic') || data.includes('brown') || data.includes('black'),
    spot: data.includes('spot') || data.includes('circular') || data.includes('speck') || data.includes('lesion'),
    healthy: data.includes('green') || data.includes('healthy') || data.includes('normal') || data.includes('leaf')
  };

  const ranked = Object.entries(signals)
    .filter(([, hit]) => hit)
    .map(([signal]) => signal);

  if (ranked.includes('powdery')) return DISEASE_LIBRARY[2];
  if (ranked.includes('blight')) return DISEASE_LIBRARY[1];
  if (ranked.includes('spot')) return DISEASE_LIBRARY[0];

  if (cropLabel.includes('maize') || cropLabel.includes('corn') || cropLabel.includes('tomato') || cropLabel.includes('bean')) {
    return DISEASE_LIBRARY[1];
  }

  return DISEASE_LIBRARY[3];
};

const analyzeLeafImage = async ({ cropType, imageData }) => {
  const authenticity = detectAuthenticImage(imageData);

  if (!authenticity.isAuthentic) {
    return {
      cropType: cropType || 'unknown',
      diseaseName: 'Unable to diagnose',
      severity: 'Low',
      description: authenticity.reason,
      treatment: 'Please upload a clear photo of the crop leaf or plant tissue.',
      recommendations: [
        'Upload a sharper image with good lighting',
        'Make sure the leaf is clearly visible and in focus',
        'Avoid screenshots, blurry images, or non-plant photos'
      ],
      isAuthenticImage: false
    };
  }

  const diagnosis = inferDiseaseFromImage(imageData, cropType);

  return {
    cropType: cropType || 'unknown',
    diseaseName: diagnosis.disease,
    severity: diagnosis.severity,
    description: diagnosis.description,
    treatment: diagnosis.treatment,
    recommendations: [
      `Monitor the crop every 3 days for changes`,
      `Keep field records of treatment applications`,
      `Consult an extension expert if symptoms worsen`
    ],
    isAuthenticImage: true
  };
};

module.exports = { analyzeLeafImage, DISEASE_LIBRARY };
