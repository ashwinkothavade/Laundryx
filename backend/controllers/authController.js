const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/userModel');
const authUtils = require('../utils/authUtils');

const maxAge = 86400; // 3 days in seconds

// @desc    Get all users
// @route   GET /users
// For testing purposes
// @access  Private
const getAllUsers = async (req, resp) => {
  try {
    const result = await User.find();
    resp.status(200).json(result);
  } catch (err) {
    resp.status(500).json('UserModel error');
  }
};

// @desc    Create a new user
// @route   POST /signup
// @access  Public
const createUser = async (req, resp) => {
  try {
    const { username, email, password, role, phone_number } = req.body;

    const user = new User({
      username,
      email,
      password,
      role,
      phone_number,
    });

    await user.save();
    const token = authUtils.createToken(
      user.username,
      user.role,
      user._id,
      user.hostel
    );
    // Always set the headers before sending the response
    resp.cookie('jwt', token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
      secure: true, // set to true if your using https
      sameSite: 'strict',
    }); // Set the cookie

    resp.status(201).json({
      newUser: user,
      role: user.role,
      email: user.email,
      phone_number: user.phone_number,
    });
  } catch (err) {
    const errors = authUtils.handleSignUpError(err);
    resp.status(500).json({ errors });
  }
};

// @desc    Create a new user
// @route   PATCH /user
// @access  Private
const updateUser = async (req, resp) => {
  const updates = req.body;
  const token = req.cookies.jwt;
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findByIdAndUpdate(decodedToken.user_id, updates, {
      new: true,
      runValidators: true,
    });
    resp.status(200).json(user);
    if (!user) {
      throw new Error('User not found');
    }
  } catch (err) {
    resp
      .status(500)
      .json({ message: 'Error updating the user details', error: err });
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
        const token = authUtils.createToken(
          user.username,
          user.role,
          user._id,
          user.hostel
        );

        resp.cookie('jwt', token, {
          httpOnly: true,
          maxAge: maxAge * 1000,
          secure: true, // set to true if your using https
          sameSite: 'strict',
        }); // Set the cookie

        resp.status(200).json({
          username: user.username,
          role: user.role,
          email: user.email,
          phone_number: user.phone_number,
          hostel: user.hostel,
          room_number: user.room_number,
          roll_number: user.roll_number,
        });
      } else {
        throw new Error('Incorrect password!!');
      }
    } else {
      throw new Error('User not found');
    }
  } catch (err) {
    const errors = authUtils.handleLogInError(err);
    resp.status(401).json({ errors });
  }
};

// @desc    Log out a user
// @route   GET /logout
// @access  Public
const logoutUser = async (req, resp) => {
  resp.cookie('jwt', '', {
    httpOnly: true,
    maxAge: -1,
    secure: true, // set to true if your using https
    sameSite: 'none',
  }); // negative maxAge so that the cookie expires immediately

  resp.status(200).json({
    message: 'User logged out successfully',
  });
};

// @desc    Accepts the user email and sends a reset password link
// @route   POST /forgotpassword
// @access  Public
const forgotPassword = async (req, resp) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    } else {
      const secret = process.env.JWT_SECRET + user.password;
      const token = jwt.sign(
        {
          email: user.email,
          username: user.username,
          user_id: user._id,
          role: user.role,
          hostel: user.hostel,
        },
        secret,
        { expiresIn: '35m' }
      );
      const url = `http://localhost:4000/resetpassword/${user._id}/${token}`;
      // console.log(url);

      // eslint-disable-next-line no-unused-vars
      const testAccount = await nodemailer.createTestAccount();
      // connect with smtp
      const transporter = await nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
          user: process.env.GMAIL_ADDRESS,
          pass: process.env.GMAIL_PASSWORD,
        },
      });

      const info = await transporter.sendMail({
        from: '"LaundriX" <laundrix5@gmail.com>',
        to: email,
        subject: 'Reset Password link from LaundriX',
        text: `Click on this link to reset your password: ${url}`,
        html: `<b>Click on this link to reset your password: <a href="${url}">Reset Password</a></b>`,
      });
      console.log('Message sent: %s', info.messageId);
      resp.status(200).json(info);
    }
  } catch (err) {
    console.log(err);
    resp.status(404).json({ message: err.message });
  }
};

// @desc    Reset the user password (Gets the password from input)
// @route   GET /resetpassword/:id/:token
// @access  Public
const getResetPassword = async (req, resp) => {
  const { id, token } = req.params;
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  const secret = process.env.JWT_SECRET + user.password;
  try {
    // eslint-disable-next-line no-unused-vars
    const verify = jwt.verify(token, secret);
    resp.render('index', {
      status: 'not verified',
      error: '',
    });
  } catch (err) {
    console.log(err);
    resp.status(401).send(err.message);
  }
};

// @desc    Reset the user password
// @route   POST /forgotpassword
// @access  Public
const postResetPassword = async (req, resp) => {
  const { id, token } = req.params;
  const { password } = req.body;
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  if (!password) {
    return resp.status(401).render('index', {
      status: 'not verified',
      error: 'Password cannot be empty',
    });
  }
  if (
    !password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
  ) {
    return resp.status(401).render('index', {
      status: 'not verified',
      error:
        'Password must be at least 8 characters long and must contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character',
    });
  }

  const secret = process.env.JWT_SECRET + user.password;
  try {
    // eslint-disable-next-line no-unused-vars
    const verify = jwt.verify(token, secret);
    user.password = password;
    user.save();
    resp.status(200).render('index', { status: 'verified', error: '' });
  } catch (err) {
    console.log(err);
    alert(err.message);
    resp.status(401).send(err.message);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  loginUser,
  logoutUser,
  forgotPassword,
  getResetPassword,
  postResetPassword,
};
