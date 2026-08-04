const Crop = require('../models/Crop');
const Livestock = require('../models/Livestock');
const Pond = require('../models/Pond');
const FinanceRecord = require('../models/FinanceRecord');

const buildCsv = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const escapeValue = (value) => {
    if (value == null) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const lines = [headers.join(',')].concat(rows.map((row) => headers.map((header) => escapeValue(row[header])).join(',')));
  return lines.join('\n');
};

const generateReport = async (userId) => {
  const crops = await Crop.find({ userId });
  const livestock = await Livestock.find({ userId });
  const ponds = await Pond.find({ userId });
  const financeRecords = await FinanceRecord.find({ userId });

  const cropSummary = { totalCrops: crops.length, expectedYield: crops.reduce((sum, item) => sum + (item.expectedYield || 0), 0) };
  const livestockSummary = { totalEntries: livestock.length, totalAnimals: livestock.reduce((sum, item) => sum + (item.count || 0), 0) };
  const pondSummary = { totalPonds: ponds.length, totalFingerlings: ponds.reduce((sum, item) => sum + (item.fingerlingCount || 0), 0) };
  const financeSummary = {
    totalExpenses: financeRecords.reduce((sum, item) => sum + (item.amount || 0), 0),
    totalExpectedRevenue: financeRecords.reduce((sum, item) => sum + (item.expectedRevenue || 0), 0),
    totalActualRevenue: financeRecords.reduce((sum, item) => sum + (item.actualRevenue || 0), 0)
  };

  const csvRows = financeRecords.map((record) => ({
    enterpriseType: record.enterpriseType,
    description: record.description,
    amount: record.amount,
    category: record.category,
    expectedRevenue: record.expectedRevenue,
    actualRevenue: record.actualRevenue,
    date: record.date.toISOString()
  }));

  return {
    summary: {
      cropSummary,
      livestockSummary,
      pondSummary,
      financeSummary
    },
    csv: buildCsv(csvRows)
  };
};

module.exports = { generateReport, buildCsv };
