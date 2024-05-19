const Order = require("../models/orderModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const getStudentOrders = async(req, resp) => {
    try{
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const student_name = decodedToken.username;
        const result = await Order.find({
            username: student_name
        });
        resp.status(200).json({
            orders: result
        });
    }catch(err){
        console.error(err);
        resp.status(401).json({ message: "Unauthorized" });
    }
};

const createStudentOrder = async(req, resp) => {
    try{
        const token = req.cookies.jwt;
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const student_name = decodedToken.username;
        const student= await User.findOne({
            username: student_name
        });
        const { items, deliveryDate, pickupAddress, deliveryAddress, totalAmount } = req.body;
        //all the items validation is done in the frontend without any anomaly.
        const order = new Order({
            user: student._id,
            items: items,
            deliveryDate: deliveryDate,
            pickupAddress: pickupAddress,
            deliveryDate: deliveryAddress,
            totalAmount: totalAmount
        });
        await order.save();
        resp.status(201).json({
            order: order
        });
    }catch(err){
        console.error(err);
        resp.status(500).json({
            message: "Internal server error",
            error: err
        });
    }
};

module.exports = {
    getStudentOrders,
    createStudentOrder
}