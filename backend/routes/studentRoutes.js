const { Router } = require('express');

const router = Router();
const studentOrderController = require('../controllers/studentOrderController');
const {
  verifyUser,
  verifyStudentDetails,
} = require('../middlewares/authMiddleware');
const { loadOrder } = require('../middlewares/orderAccess');

// Routes that act on one order require that the caller placed it.
const ownOrder = loadOrder({ as: 'owner' });

router.get(
  '/student/orders',
  verifyUser,
  studentOrderController.getStudentOrders
);
router.get(
  '/student/launderers',
  verifyUser,
  studentOrderController.getAllLaunderers
);
router.post(
  '/student/createorder',
  verifyUser,
  verifyStudentDetails,
  studentOrderController.createStudentOrder
);
router.put(
  '/student/updatepickupstatus/:order_id',
  verifyUser,
  ownOrder,
  studentOrderController.updatePickupStatus
);
router.put(
  '/student/updatedeliverystatus/:order_id',
  verifyUser,
  ownOrder,
  studentOrderController.updateDeliveryStatus
);
router.delete(
  '/student/deleteorder/:order_id',
  verifyUser,
  ownOrder,
  studentOrderController.deleteOrder
);
router.put(
  '/student/reschedule/:order_id',
  verifyUser,
  ownOrder,
  studentOrderController.rescheduleOrder
);
router.put(
  '/student/cancelorder/:order_id',
  verifyUser,
  ownOrder,
  studentOrderController.cancelOrder
);

module.exports = router;
