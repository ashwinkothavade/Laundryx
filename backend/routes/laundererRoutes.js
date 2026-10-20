const { Router } = require('express');

const router = Router();
const laundererOrderController = require('../controllers/laundererOrderController');
const {
  verifyUser,
  verifyLaunderer,
} = require('../middlewares/authMiddleware');
const { loadOrder } = require('../middlewares/orderAccess');

// Every launderer route needs an authenticated, launderer-role caller...
router.use(
  [
    '/launderer',
    '/allorders',
    '/orders',
    '/acceptorder',
    '/rejectorder',
    '/updatedeliverydate',
    '/updatedeliveredstatus',
  ],
  verifyUser,
  verifyLaunderer
);

// ...and every route that acts on one order additionally requires that the
// order was placed with *this* launderer.
const ownOrder = loadOrder({ as: 'launderer' });

router.get(
  '/launderer/analytics',
  laundererOrderController.getLaundererAnalytics
);
router.put('/launderer/availability', laundererOrderController.setAvailability);
router.put('/launderer/express', laundererOrderController.setExpress);

router.get('/allorders', laundererOrderController.getAllOrders);
router.get('/orders/:username', laundererOrderController.getOrdersByStudent);

router.put(
  '/acceptorder/:order_id',
  ownOrder,
  laundererOrderController.updateOrderAccept
);
router.put(
  '/rejectorder/:order_id',
  ownOrder,
  laundererOrderController.updateOrderReject
);
router.put(
  '/updatedeliverydate/:order_id',
  ownOrder,
  laundererOrderController.updateOrderDeliveryDate
);
router.put(
  '/updatedeliveredstatus/:order_id',
  ownOrder,
  laundererOrderController.updateDeliveredStatus
);

module.exports = router;
