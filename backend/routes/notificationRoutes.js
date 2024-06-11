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

router.delete(
  '/notifications/:id',
  verifyUser,
  notificationController.deleteNotification
);

module.exports = router;
