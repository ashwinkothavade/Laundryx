const {Router} = require('express')
const router = Router();
const userController = require('../controllers/userController');
const {verifyUser} = require('../middlewares/authMiddleware');

//public routes
router.post('/signup', userController.createUser);
router.post('/login', userController.loginUser);

//protected routes
router.get('/users', verifyUser, userController.getAllUsers);
router.get('/logout', verifyUser,  userController.logoutUser);

module.exports = router;