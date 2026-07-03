const { Router } = require('express');

const router = Router();
const settingController = require('../controllers/settingController');
const { verifyUser, verifyAdmin } = require('../middlewares/authMiddleware');

// Reads — any authenticated user (students need locations/time slots to order).
router.get('/settings', verifyUser, settingController.getAllSettings);
router.get('/settings/:key', verifyUser, settingController.getSetting);

// Writes — admin only.
router.put(
  '/settings/:key',
  verifyUser,
  verifyAdmin,
  settingController.upsertSetting
);
router.post(
  '/settings/:key',
  verifyUser,
  verifyAdmin,
  settingController.addSettingValue
);
router.delete(
  '/settings/:key/:value',
  verifyUser,
  verifyAdmin,
  settingController.removeSettingValue
);

module.exports = router;
