const { Router } = require('express');

const router = Router();
const catalogController = require('../controllers/catalogController');
const { verifyUser, verifyLaunderer } = require('../middlewares/authMiddleware');

// Launderer-managed catalog (owner only for writes).
router.get(
  '/catalog/my',
  verifyUser,
  verifyLaunderer,
  catalogController.getMyCatalog
);
router.post(
  '/catalog',
  verifyUser,
  verifyLaunderer,
  catalogController.addCatalogItem
);
router.put(
  '/catalog/:id',
  verifyUser,
  verifyLaunderer,
  catalogController.updateCatalogItem
);
router.delete(
  '/catalog/:id',
  verifyUser,
  verifyLaunderer,
  catalogController.deleteCatalogItem
);

// Any authenticated user can read a launderer's catalog to order from it.
router.get(
  '/catalog/launderer/:username',
  verifyUser,
  catalogController.getLaundererCatalog
);

module.exports = router;
