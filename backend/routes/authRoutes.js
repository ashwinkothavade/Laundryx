const { Router } = require('express');

const router = Router();
const authController = require('../controllers/authController');
const { verifyUser } = require('../middlewares/authMiddleware');

// public routes
router.post('/signup', authController.createUser);
router.post('/login', authController.loginUser);
router.post('/forgotpassword', authController.forgotPassword);
router.get('/resetpassword/:id/:token', authController.getResetPassword);
router.post('/resetpassword/:id/:token', authController.postResetPassword);

// protected routes
router.get('/users', verifyUser, authController.getAllUsers);
router.get('/logout', verifyUser, authController.logoutUser);
router.get('/launderers', verifyUser, authController.getAllLaunderers);
router.patch('/user', verifyUser, authController.updateUser);

module.exports = router;
