const Crop = require('../models/Crop');
const Livestock = require('../models/Livestock');
const Pond = require('../models/Pond');
const FinanceRecord = require('../models/FinanceRecord');
const SupportQuery = require('../models/SupportQuery');
const CommunityPost = require('../models/CommunityPost');
const Alert = require('../models/Alert');
const { analyzeLeafImage } = require('../services/diagnosisService');
const { enqueueOperations, resolvePendingOperations, listPendingOperations } = require('../services/offlineSyncService');
const { generateReport } = require('../services/reportService');

exports.getFarmerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const crops = await Crop.find({ userId });
    const livestock = await Livestock.find({ userId });
    const ponds = await Pond.find({ userId });
    const alerts = await SupportQuery.find({ userId, status: 'pending' });

    res.json({
      crops: crops.length,
      livestock: livestock.reduce((sum, item) => sum + item.count, 0),
      ponds: ponds.length,
      pendingSupportQueries: alerts.length,
      crops,
      livestock,
      ponds
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load dashboard', error: error.message });
  }
};

exports.listAlerts = async (_req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(10);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load alerts', error: error.message });
  }
};

exports.createCrop = async (req, res) => {
  try {
    const { cropType, variety, plantingDate, expectedHarvestDate, expectedYield, treatmentHistory } = req.body;
    const crop = await Crop.create({
      userId: req.user._id,
      cropType,
      variety,
      plantingDate,
      expectedHarvestDate,
      expectedYield,
      treatmentHistory
    });
    res.status(201).json(crop);
  } catch (error) {
    res.status(500).json({ message: 'Crop creation failed', error: error.message });
  }
};

exports.createLivestock = async (req, res) => {
  try {
    const { category, breed, count, healthRecords, productionData } = req.body;
    const livestock = await Livestock.create({
      userId: req.user._id,
      category,
      breed,
      count,
      healthRecords,
      productionData
    });
    res.status(201).json(livestock);
  } catch (error) {
    res.status(500).json({ message: 'Livestock creation failed', error: error.message });
  }
};

exports.createPond = async (req, res) => {
  try {
    const { pondName, pondType, species, stockingDensity, batchAgeDays, fingerlingCount, waterQualityRecords, feedRecords, harvestForecast } = req.body;
    const pond = await Pond.create({
      userId: req.user._id,
      pondName,
      pondType,
      species,
      stockingDensity,
      batchAgeDays,
      fingerlingCount,
      waterQualityRecords,
      feedRecords,
      harvestForecast
    });
    res.status(201).json(pond);
  } catch (error) {
    res.status(500).json({ message: 'Pond creation failed', error: error.message });
  }
};

exports.createFinanceRecord = async (req, res) => {
  try {
    const { enterpriseType, description, amount, category, expectedRevenue, actualRevenue, notes } = req.body;
    const record = await FinanceRecord.create({
      userId: req.user._id,
      enterpriseType,
      description,
      amount,
      category,
      expectedRevenue,
      actualRevenue,
      notes
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Finance record creation failed', error: error.message });
  }
};

exports.submitSupportQuery = async (req, res) => {
  try {
    const { category, subject, details } = req.body;
    const query = await SupportQuery.create({
      userId: req.user._id,
      category,
      subject,
      details
    });
    res.status(201).json(query);
  } catch (error) {
    res.status(500).json({ message: 'Support query submission failed', error: error.message });
  }
};

exports.diagnoseLeaf = async (req, res) => {
  try {
    const { cropType, imageData } = req.body;
    const diagnosis = await analyzeLeafImage({ category: req.body.diagnosisCategory || 'crop', subject: cropType, imageData });
    res.json(diagnosis);
  } catch (error) {
    res.status(500).json({ message: 'Diagnosis failed', error: error.message });
  }
};

exports.enqueueOfflineSync = async (req, res) => {
  try {
    const { operations } = req.body;
    const queueCount = await enqueueOperations(operations);
    res.json({ message: 'Offline operations queued', queued: queueCount });
  } catch (error) {
    res.status(500).json({ message: 'Offline sync failed', error: error.message });
  }
};

exports.resolveOfflineSync = async (req, res) => {
  try {
    const result = await resolvePendingOperations();
    res.json({ message: 'Offline operations synchronized', ...result });
  } catch (error) {
    res.status(500).json({ message: 'Sync resolution failed', error: error.message });
  }
};

exports.listOfflineSync = async (req, res) => {
  try {
    const pending = await listPendingOperations();
    res.json({ pending });
  } catch (error) {
    res.status(500).json({ message: 'Unable to retrieve pending operations', error: error.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await generateReport(req.user._id);
    if (req.query.format === 'csv') {
      res.header('Content-Type', 'text/csv');
      return res.send(report.csv);
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Report generation failed', error: error.message });
  }
};

exports.listCommunityPosts = async (req, res) => {
  try {
    const filter = { status: 'published' };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.region) filter.region = req.query.region;

    const posts = await CommunityPost.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name role location');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load community feed', error: error.message });
  }
};

exports.createCommunityPost = async (req, res) => {
  try {
    const { title, content, category, region } = req.body;
    const post = await CommunityPost.create({
      userId: req.user._id,
      title,
      content,
      category,
      region: region || req.user.location
    });
    const populatedPost = await post.populate('userId', 'name role location');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Unable to publish community post', error: error.message });
  }
};
