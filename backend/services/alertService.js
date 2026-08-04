const Alert = require('../models/Alert');

const createAlert = async ({ title, message, region, category, priority, createdBy }) => {
  return Alert.create({ title, message, region, category, priority, createdBy });
};

const listAlerts = async (filter = {}) => {
  return Alert.find(filter).sort({ createdAt: -1 });
};

module.exports = { createAlert, listAlerts };
