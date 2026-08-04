const createCropValidator = (req, res, next) => {
  const { cropType } = req.body;
  if (!cropType) {
    return res.status(400).json({ message: 'Crop type is required' });
  }
  next();
};

const createLivestockValidator = (req, res, next) => {
  const { category, count } = req.body;
  if (!category || count == null) {
    return res.status(400).json({ message: 'Livestock category and count are required' });
  }
  next();
};

const createPondValidator = (req, res, next) => {
  const { pondName, pondType, species } = req.body;
  if (!pondName || !pondType || !species) {
    return res.status(400).json({ message: 'Pond name, type, and species are required' });
  }
  next();
};

const createFinanceValidator = (req, res, next) => {
  const { enterpriseType, description, amount, category } = req.body;
  if (!enterpriseType || !description || amount == null || !category) {
    return res.status(400).json({ message: 'Enterprise type, description, amount, and category are required' });
  }
  next();
};

const supportQueryValidator = (req, res, next) => {
  const { subject, details } = req.body;
  if (!subject || !details) {
    return res.status(400).json({ message: 'Support query subject and details are required' });
  }
  next();
};

const diagnosisValidator = (req, res, next) => {
  const { diagnosisCategory, cropType, imageData } = req.body;
  if (!diagnosisCategory || !cropType || !imageData) {
    return res.status(400).json({ message: 'Diagnosis category, subject, and image data are required for diagnosis' });
  }
  if (!['crop', 'livestock', 'bird'].includes(diagnosisCategory)) {
    return res.status(400).json({ message: 'Diagnosis category must be crop, livestock, or bird' });
  }
  next();
};

const communityPostValidator = (req, res, next) => {
  const { title, content, category } = req.body;
  const categories = ['advice', 'disease', 'marketplace', 'equipment', 'weather'];
  if (!title || !content) {
    return res.status(400).json({ message: 'Post title and content are required' });
  }
  if (title.length > 140 || content.length > 2000) {
    return res.status(400).json({ message: 'Post title or content is too long' });
  }
  if (category && !categories.includes(category)) {
    return res.status(400).json({ message: 'Invalid community post category' });
  }
  next();
};

module.exports = {
  createCropValidator,
  createLivestockValidator,
  createPondValidator,
  createFinanceValidator,
  supportQueryValidator,
  diagnosisValidator,
  communityPostValidator
};
