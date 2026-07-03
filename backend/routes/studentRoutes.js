const { Router } = require('express');

const router = Router();
const studentOrderController = require('../controllers/studentOrderController');
const {
  verifyUser,
  verifyStudentDetails,
} = require('../middlewares/authMiddleware');

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
  studentOrderController.updatePickupStatus
);
router.put(
  '/student/updatedeliverystatus/:order_id',
  verifyUser,
  studentOrderController.updateDeliveryStatus
);
router.delete(
  '/student/deleteorder/:order_id',
  verifyUser,
  studentOrderController.deleteOrder
);
router.put(
  '/student/reschedule/:order_id',
  verifyUser,
  studentOrderController.rescheduleOrder
);
router.put(
  '/student/cancelorder/:order_id',
  verifyUser,
  studentOrderController.cancelOrder
);

module.exports = router;
