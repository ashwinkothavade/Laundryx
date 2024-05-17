const express = require("express");
const colors = require("colors");
const cookieParser = require('cookie-parser')
const dotenv = require("dotenv")
const port = process.env.PORT || 4000;
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const app = express();
const corsOptions = {
  origin: ["http://localhost:5173"],
  methods: "GET, POST, PUT, DELETE",
  credentials: true,
  optionsSuccessStatus: 200,
};

dotenv.config();

connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(userRoutes);

app.listen(port, () => {
  console.log(
    `Server is running on port ${port}, go to http://localhost:${port}`.yellow.bold
  );
});
