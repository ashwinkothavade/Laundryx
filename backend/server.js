const express = require("express");
const colors = require("colors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv").config();
const cors = require("cors");
const DB = require("./config/db");
const cron= require('node-cron');
const authRoutes = require("./routes/authRoutes");
const laundererRoutes = require("./routes/laundererRoutes");
const studentRoutes = require("./routes/studentRoutes");
const razorpayRoutes = require("./routes/razorpayRoutes");
const app = express();
const port = process.env.PORT || 4000;
const corsOptions = {
  origin: ["http://localhost:5173"],
  methods: "GET, POST, PUT, DELETE",
  credentials: true,
  optionsSuccessStatus: 200,
};

DB.connect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(authRoutes);
app.use(laundererRoutes);
app.use(studentRoutes);
app.use(razorpayRoutes);

app.get("/", (req, resp) => {
  resp.status(200).json("This is the LaundriX backend API.");
});

app.listen(port, () => {
  console.log(
    `Server is running on port ${port}, go to http://localhost:${port}`.yellow
      .bold
  );
});

//task scheduler to delete the orders that are valid every 2 days
// Runs every day at midnight
cron.schedule('0 0 * * *', () => {
  DB.deleteValidOrders();
});
