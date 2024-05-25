const { Router } = require('express');

const router = Router();
const studentOrderController = require('../controllers/studentOrderController');
const { verifyUser } = require('../middlewares/authMiddleware');

router.get(
  '/student/myorders',
  verifyUser,
  studentOrderController.getStudentOrders
);
router.post(
  '/student/createorder',
  verifyUser,
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

module.exports = router;
