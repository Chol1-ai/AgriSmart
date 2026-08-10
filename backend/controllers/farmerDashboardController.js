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
    const crops = await Crop.find({ userId, deleted: { $ne: true } });
    const livestock = await Livestock.find({ userId, deleted: { $ne: true } });
    const ponds = await Pond.find({ userId, deleted: { $ne: true } });
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

exports.getFarmerNotifications = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(10);
    const supportUpdates = await SupportQuery.find({
      userId: req.user._id,
      status: { $in: ['reviewed', 'resolved'] },
      viewedByRequester: false
    }).sort({ createdAt: -1 });
    res.json({ alerts, supportUpdates });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load notifications', error: error.message });
  }
};

exports.markFarmerNotificationsRead = async (req, res) => {
  try {
    await SupportQuery.updateMany({
      userId: req.user._id,
      status: { $in: ['reviewed', 'resolved'] },
      viewedByRequester: false
    }, { viewedByRequester: true });
    res.json({ message: 'Notifications marked read' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to mark notifications read', error: error.message });
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

exports.updateCrop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const crop = await Crop.findOneAndUpdate({ _id: id, userId: req.user._id }, { $set: updates }, { new: true });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });
    res.json(crop);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update crop', error: error.message });
  }
};

exports.deleteCrop = async (req, res) => {
  try {
    const { id } = req.params;
    const crop = await Crop.findOneAndUpdate({ _id: id, userId: req.user._id, deleted: { $ne: true } }, { $set: { deleted: true } }, { new: true });
    if (!crop) return res.status(404).json({ message: 'Crop not found' });
    res.json({ message: 'Crop deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete crop', error: error.message });
  }
};

exports.updateLivestock = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const animal = await Livestock.findOneAndUpdate({ _id: id, userId: req.user._id }, { $set: updates }, { new: true });
    if (!animal) return res.status(404).json({ message: 'Livestock record not found' });
    res.json(animal);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update livestock', error: error.message });
  }
};

exports.deleteLivestock = async (req, res) => {
  try {
    const { id } = req.params;
    const animal = await Livestock.findOneAndUpdate({ _id: id, userId: req.user._id, deleted: { $ne: true } }, { $set: { deleted: true } }, { new: true });
    if (!animal) return res.status(404).json({ message: 'Livestock record not found' });
    res.json({ message: 'Livestock record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete livestock', error: error.message });
  }
};

exports.updatePond = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const pond = await Pond.findOneAndUpdate({ _id: id, userId: req.user._id }, { $set: updates }, { new: true });
    if (!pond) return res.status(404).json({ message: 'Pond not found' });
    res.json(pond);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update pond', error: error.message });
  }
};

exports.deletePond = async (req, res) => {
  try {
    const { id } = req.params;
    const pond = await Pond.findOneAndUpdate({ _id: id, userId: req.user._id, deleted: { $ne: true } }, { $set: { deleted: true } }, { new: true });
    if (!pond) return res.status(404).json({ message: 'Pond not found' });
    res.json({ message: 'Pond deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete pond', error: error.message });
  }
};

exports.listPonds = async (req, res) => {
  try {
    const ponds = await Pond.find({ userId: req.user._id, deleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(ponds);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load pond list', error: error.message });
  }
};

exports.addWaterQualityRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { pH, temperature, dissolvedOxygen, TAN, turbidity, notes } = req.body;
    const record = {
      date: new Date(),
      pH: Number(pH),
      temperature: Number(temperature),
      dissolvedOxygen: Number(dissolvedOxygen),
      TAN: Number(TAN),
      turbidity: Number(turbidity),
      notes: notes || ''
    };
    const pond = await Pond.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $push: { waterQualityRecords: record } },
      { new: true }
    );
    if (!pond) return res.status(404).json({ message: 'Pond not found' });
    res.json(pond);
  } catch (error) {
    res.status(500).json({ message: 'Unable to add water quality record', error: error.message });
  }
};

exports.addFeedRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedType, amountKg, notes } = req.body;
    const record = {
      date: new Date(),
      feedType: feedType || '',
      amountKg: Number(amountKg),
      notes: notes || ''
    };
    const pond = await Pond.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $push: { feedRecords: record } },
      { new: true }
    );
    if (!pond) return res.status(404).json({ message: 'Pond not found' });
    res.json(pond);
  } catch (error) {
    res.status(500).json({ message: 'Unable to add feed record', error: error.message });
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

exports.listFarmerSupportQueries = async (req, res) => {
  try {
    const queries = await SupportQuery.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load support queries', error: error.message });
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
