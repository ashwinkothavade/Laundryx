const {Router} = require("express");
const router = Router();
const laundererOrderController = require("../controllers/laundererOrderController");
const {verifyUser} = require("../middlewares/authMiddleware");

// launderer routes
router.get('/allorders', verifyUser, laundererOrderController.getAllOrders);
router.get('/orders', verifyUser, laundererOrderController.getOrdersByStudent);
router.delete('/orders', verifyUser, laundererOrderController.deleteOrders);

module.exports = router;