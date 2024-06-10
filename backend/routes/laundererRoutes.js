const { Router } = require('express');

const router = Router();
const laundererOrderController = require('../controllers/laundererOrderController');
const { verifyUser } = require('../middlewares/authMiddleware');

// launderer routes
router.get('/allorders', verifyUser, laundererOrderController.getAllOrders);
router.get(
  '/orders/:username',
  verifyUser,
  laundererOrderController.getOrdersByStudent
);
router.put(
  '/acceptorder/:order_id',
  verifyUser,
  laundererOrderController.updateOrderAccept
);
router.put(
  '/rejectorder/:order_id',
  verifyUser,
  laundererOrderController.updateOrderReject
);
router.put(
  '/updatedeliverydate/:order_id',
  verifyUser,
  laundererOrderController.updateOrderDeliveryDate
);
router.put(
  '/updatedeliveredstatus/:order_id',
  verifyUser,
  laundererOrderController.updateDeliveredStatus
);

module.exports = router;
