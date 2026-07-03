const CatalogItem = require('../models/catalogModel');
const User = require('../models/userModel');
const logger = require('../utils/logger');

// @desc    Get the authenticated launderer's own catalog
// @route   GET /catalog/my
// @access  Private (launderer)
const getMyCatalog = async (req, resp) => {
  try {
    const items = await CatalogItem.find({ launderer: req.user.user_id }).sort({
      clothingType: 1,
      washType: 1,
    });
    return resp.status(200).json({ items });
  } catch (err) {
    logger.error(`getMyCatalog error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error fetching catalog' });
  }
};

// @desc    Get a particular launderer's catalog (for students to order from)
// @route   GET /catalog/launderer/:username
// @access  Private
const getLaundererCatalog = async (req, resp) => {
  try {
    const { username } = req.params;
    const launderer = await User.findOne({ username, role: 'launderer' });
    if (!launderer) {
      return resp.status(404).json({ message: 'Launderer not found' });
    }
    const items = await CatalogItem.find({ launderer: launderer._id }).sort({
      clothingType: 1,
      washType: 1,
    });
    return resp.status(200).json({ launderer: launderer.username, items });
  } catch (err) {
    logger.error(`getLaundererCatalog error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error fetching catalog' });
  }
};

// @desc    Add a catalog item
// @route   POST /catalog
// @access  Private (launderer)
const addCatalogItem = async (req, resp) => {
  try {
    const { clothingType, washType, price, image } = req.body;
    if (!clothingType || !washType || price === undefined || price === null) {
      return resp.status(400).json({
        message: 'clothingType, washType and price are required',
      });
    }
    if (typeof price !== 'number' || price < 0) {
      return resp.status(400).json({ message: 'Invalid price' });
    }
    const item = await CatalogItem.create({
      launderer: req.user.user_id,
      clothingType,
      washType,
      price,
      image: image || '',
    });
    return resp.status(201).json({ item });
  } catch (err) {
    if (err.code === 11000) {
      return resp.status(409).json({
        message: 'This clothing and wash type combination already exists',
      });
    }
    logger.error(`addCatalogItem error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Error adding catalog item' });
  }
};

// @desc    Update a catalog item (owner only)
// @route   PUT /catalog/:id
// @access  Private (launderer)
const updateCatalogItem = async (req, resp) => {
  try {
    const item = await CatalogItem.findById(req.params.id);
    if (!item) {
      return resp.status(404).json({ message: 'Catalog item not found' });
    }
    if (item.launderer.toString() !== req.user.user_id) {
      return resp
        .status(403)
        .json({ message: 'You are not authorized to modify this item' });
    }
    const { clothingType, washType, price, image } = req.body;
    if (clothingType !== undefined) item.clothingType = clothingType;
    if (washType !== undefined) item.washType = washType;
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return resp.status(400).json({ message: 'Invalid price' });
      }
      item.price = price;
    }
    if (image !== undefined) item.image = image;
    await item.save();
    return resp.status(200).json({ item });
  } catch (err) {
    if (err.code === 11000) {
      return resp.status(409).json({
        message: 'This clothing and wash type combination already exists',
      });
    }
    logger.error(`updateCatalogItem error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error updating catalog item' });
  }
};

// @desc    Delete a catalog item (owner only)
// @route   DELETE /catalog/:id
// @access  Private (launderer)
const deleteCatalogItem = async (req, resp) => {
  try {
    const item = await CatalogItem.findById(req.params.id);
    if (!item) {
      return resp.status(404).json({ message: 'Catalog item not found' });
    }
    if (item.launderer.toString() !== req.user.user_id) {
      return resp
        .status(403)
        .json({ message: 'You are not authorized to delete this item' });
    }
    await CatalogItem.findByIdAndDelete(req.params.id);
    return resp.status(200).json({ message: 'Catalog item deleted', item });
  } catch (err) {
    logger.error(`deleteCatalogItem error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error deleting catalog item' });
  }
};

module.exports = {
  getMyCatalog,
  getLaundererCatalog,
  addCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
};
