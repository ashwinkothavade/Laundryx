const { Router } = require('express');
const notificationController = require('../controllers/notificationController');

const router = Router();
const { verifyUser } = require('../middlewares/authMiddleware');

router.get(
  '/notifications',
  verifyUser,
  notificationController.getNotifications
);

router.post(
  '/notifications',
  verifyUser,
  notificationController.createNotification
);

module.exports = router;
