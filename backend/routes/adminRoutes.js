const { Router } = require('express');

const router = Router();
const adminController = require('../controllers/adminController');
const { verifyUser, verifyAdmin } = require('../middlewares/authMiddleware');

// Every admin route requires an authenticated admin.
router.use('/admin', verifyUser, verifyAdmin);

router.get('/admin/users', adminController.getAllUsers);
router.delete('/admin/users/:id', adminController.deleteUser);
router.patch('/admin/users/:id/role', adminController.updateUserRole);
router.patch('/admin/users/:id/approval', adminController.setApproval);
router.get('/admin/orders', adminController.getAllOrders);
router.get('/admin/catalog', adminController.getAllCatalog);
router.get('/admin/analytics', adminController.getAnalytics);

module.exports = router;
