const {Router} = require("express");
const router = Router();
const studentOrderController = require("../controllers/studentOrderController");
const {verifyUser} = require("../middlewares/authMiddleware");

router.post('/createorder', verifyUser, studentOrderController.createStudentOrder);


module.exports  = router;