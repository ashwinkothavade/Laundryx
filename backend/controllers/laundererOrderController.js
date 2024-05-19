const Order = require("../models/orderModel");
const jwt = require("jsonwebtoken");
// @desc    Get all orders
// @route   GET /allorders
// @access  Private
// when accepted and delivery status are marked as true, the orders will be deleted automatically from the database.
const getAllOrders = async(req, resp) => {
  try{
      const token = req.cookies.jwt;
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if(decodedToken.role !== "launderer"){
          resp.status(401).json({
            message: "User does not have access rights"
          });
      }else{
        //the role is launderer, and the route can now be accessed.
          const result = await Order.find();
          resp.status(200).json({
            orders: result
          });
      }
  }catch(err){
      console.error(err);
      resp.status(401).json({ message: "Unauthorized" });
  }
};

// @desc    Get orders of a particular user
// @route   GET /orders/:username
// @access  Private
const getOrdersByStudent = async(req, resp) => {
  try{
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if(decodedToken.role !== 'launderer'){
        resp.status(401).json({
          message: "User does not have access rights"
        });
    }else{
      //the role is launderer, and the route can now be accessed.
      // Get the username of the student, search in the database for the orders with the username
      const username = req.params.username;
      const result = await Order.find({ username: username });
      resp.status(200).json({
        orders: result
      });
    }
}catch(err){
    console.error(err);
    resp.status(401).json({ message: "Unauthorized" });
}
};

// @desc    Delete orders as soon as they are completed/delivered
// @route   DELETE /orders
// @access  Private
const deleteOrders = async(req, resp) => {
  try {
    const result = await Order.deleteMany({
      acceptedStatus: true,
      deliveredStatus: true,
      paid: true,
    });
    resp.status(200).json({
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    resp.json({
      message: "Error in deleting orders",
    });
  }
};

module.exports = {
  getAllOrders,
  getOrdersByStudent,
  deleteOrders,
};
