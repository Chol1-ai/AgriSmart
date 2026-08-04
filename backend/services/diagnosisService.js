const DISEASE_LIBRARY = [
  {
    disease: 'Leaf Spot',
    severity: 'Mild',
    description: 'Small circular spots on leaves caused by fungal infection.',
    treatment: 'Remove affected leaves, improve air circulation, and apply organic fungicide.'
  },
  {
    disease: 'Blight',
    severity: 'Critical',
    description: 'Rapid browning and wilting of leaves caused by aggressive pathogens.',
    treatment: 'Remove diseased material, rotate crops, and treat with copper-based spray.'
  },
  {
    disease: 'Powdery Mildew',
    severity: 'Moderate',
    description: 'White powdery fungal growth on leaf surfaces.',
    treatment: 'Use neem oil, maintain good ventilation, and avoid overhead watering.'
  }
];

const analyzeLeafImage = async ({ cropType, imageData }) => {
  const index = Math.floor(Math.random() * DISEASE_LIBRARY.length);
  const result = DISEASE_LIBRARY[index];

  return {
    cropType: cropType || 'unknown',
    diseaseName: result.disease,
    severity: result.severity,
    description: result.description,
    treatment: result.treatment,
    recommendations: [
      `Monitor the crop every 3 days for changes`,
      `Keep field records of treatment applications`,
      `Consult an extension expert if symptoms worsen`
    ]
  };
};

module.exports = { analyzeLeafImage, DISEASE_LIBRARY };
