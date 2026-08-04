const SupportQuery = require('../models/SupportQuery');
const { createAlert } = require('../services/alertService');

exports.listSupportQueries = async (req, res) => {
  try {
    const queries = await SupportQuery.find({ status: 'pending' }).populate('userId', 'name email');
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load support queries', error: error.message });
  }
};

exports.reviewSupportQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, status = 'reviewed' } = req.body;
    const query = await SupportQuery.findByIdAndUpdate(id, { response, status }, { new: true });
    if (!query) return res.status(404).json({ message: 'Support query not found' });
    res.json(query);
  } catch (error) {
    res.status(500).json({ message: 'Unable to review query', error: error.message });
  }
};

exports.broadcastAlert = async (req, res) => {
  try {
    const { title, message, region, category, priority } = req.body;
    const alert = await createAlert({ title, message, region, category, priority, createdBy: req.user._id });
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Unable to broadcast alert', error: error.message });
  }
};
