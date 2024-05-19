const User = require("../models/userModel");
const authUtils = require("../utils/authUtils");
const bcrypt = require("bcrypt");
const maxAge = 86400; // 3 days in seconds

// @desc    Get all users
// @route   GET /users
// For testing purposes
// @access  Private
const getAllUsers = async (req, resp) => {
  try {
    let result = await User.find();
    resp.status(200).json(result);
  } catch (err) {
    resp.status(500).json("UserModel error");
  }
};

// @desc    Create a new user
// @route   POST /signup
// @access  Public
const createUser = async (req, resp) => {
  try {
    const { username, email, password, role } = req.body;

    const user = new User({
        username,
        email,
        password,
        role
    });

    await user.save();
    resp.status(201).json({
      user: user
    });
  } catch (err) {
    const errors = authUtils.handleSignUpError(err);
    resp.status(500).json({ errors });
  }
};

// @desc    Log in a user
// @route   POST /login
// @access  Public
const loginUser = async (req, resp) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });

    if (user) {
      const auth = await bcrypt.compare(password, user.password);
      if (auth) {
        const token = authUtils.createToken(user.username, user.role);

        resp.cookie("jwt", token, {
            httpOnly: true,
            maxAge: maxAge * 1000,
            secure: true, // set to true if your using https
            sameSite: "none",
        }); // Set the cookie

        resp.status(200).json({
          username: user.username,
          role: user.role,
          token: token
        });
      } else {
        throw new Error("Invalid password");
      }
    } else {
      throw new Error("User not found");
    }
  } catch (err) {
    const errors = authUtils.handleLogInError(err);
    resp.status(401).json({ errors });
  }
};

// @desc    Log out a user
// @route   GET /logout
// @access  Public
const logoutUser = (req, resp) => {
  resp.cookie("jwt", "", {
      httpOnly: true,
      maxAge: -1,
      secure: true, // set to true if your using https
      sameSite: "none",
  }); //negative maxAge so that the cookie expires immediately

  resp.status(200).json("User logged out successfully");
};

module.exports = {
    getAllUsers,
    createUser,
    loginUser,
    logoutUser,
};
