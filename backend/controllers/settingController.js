const Setting = require('../models/settingModel');
const logger = require('../utils/logger');

// @desc    Get all settings (key -> values map)
// @route   GET /settings
// @access  Private (any authenticated user)
const getAllSettings = async (req, resp) => {
  try {
    const settings = await Setting.find();
    const map = settings.reduce((acc, s) => {
      acc[s.key] = s.values;
      return acc;
    }, {});
    return resp.status(200).json({ settings: map });
  } catch (err) {
    logger.error(`getAllSettings error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error fetching settings' });
  }
};

// @desc    Get a single setting's values
// @route   GET /settings/:key
// @access  Private (any authenticated user)
const getSetting = async (req, resp) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    return resp.status(200).json({
      key: req.params.key,
      values: setting ? setting.values : [],
    });
  } catch (err) {
    logger.error(`getSetting error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error fetching setting' });
  }
};

// @desc    Replace a setting's whole values array (creates it if missing)
// @route   PUT /settings/:key
// @access  Private (admin)
const upsertSetting = async (req, resp) => {
  try {
    const { values } = req.body;
    if (!Array.isArray(values)) {
      return resp.status(400).json({ message: 'values must be an array' });
    }
    const cleaned = [
      ...new Set(values.map((v) => String(v).trim()).filter(Boolean)),
    ];
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { values: cleaned },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return resp.status(200).json({ key: setting.key, values: setting.values });
  } catch (err) {
    logger.error(`upsertSetting error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error saving setting' });
  }
};

// @desc    Append a single value to a setting
// @route   POST /settings/:key
// @access  Private (admin)
const addSettingValue = async (req, resp) => {
  try {
    const value = String(req.body.value || '').trim();
    if (!value) {
      return resp.status(400).json({ message: 'value is required' });
    }
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { $addToSet: { values: value } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return resp.status(200).json({ key: setting.key, values: setting.values });
  } catch (err) {
    logger.error(`addSettingValue error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error updating setting' });
  }
};

// @desc    Remove a single value from a setting
// @route   DELETE /settings/:key/:value
// @access  Private (admin)
const removeSettingValue = async (req, resp) => {
  try {
    const value = decodeURIComponent(req.params.value);
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { $pull: { values: value } },
      { new: true }
    );
    if (!setting) {
      return resp.status(404).json({ message: 'Setting not found' });
    }
    return resp.status(200).json({ key: setting.key, values: setting.values });
  } catch (err) {
    logger.error(`removeSettingValue error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error updating setting' });
  }
};

module.exports = {
  getAllSettings,
  getSetting,
  upsertSetting,
  addSettingValue,
  removeSettingValue,
};
