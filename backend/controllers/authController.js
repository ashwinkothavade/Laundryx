const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/userModel');
const authUtils = require('../utils/authUtils');
const logger = require('../utils/logger');

const maxAge = 86400; // 3 days in seconds

// @desc    Get all users
// @route   GET /users
// For testing purposes
// @access  Private
const getAllUsers = async (req, resp) => {
  try {
    const result = await User.find().select('-password -__v');
    resp.status(200).json(result);
  } catch (err) {
    resp.status(500).json('UserModel error');
  }
};

// @desc    Get all launderers
// @route   GET /launderers
// For testing purposes
// @access  Private
const getAllLaunderers = async (req, resp) => {
  try {
    // Students only ever see approved launderers.
    const launderers = await User.find({
      role: 'launderer',
      approved: true,
    }).select('-password -__v');
    resp.status(200).json(launderers);
  } catch (err) {
    resp.status(500).json('UserModel error');
  }
};
// @desc    Directory of approved launderers with rating + price range + items
// @route   GET /launderers/directory
// @access  Private
const getLaundererDirectory = async (req, resp) => {
  try {
    const directory = await User.aggregate([
      { $match: { role: 'launderer', approved: true } },
      {
        $lookup: {
          from: 'CatalogItem',
          localField: '_id',
          foreignField: 'launderer',
          as: 'catalog',
        },
      },
      {
        $lookup: {
          from: 'Review',
          localField: '_id',
          foreignField: 'launderer',
          as: 'reviews',
        },
      },
      {
        $project: {
          _id: 0,
          username: 1,
          phone_number: 1,
          itemCount: { $size: '$catalog' },
          minPrice: { $min: '$catalog.price' },
          maxPrice: { $max: '$catalog.price' },
          avgRating: { $round: [{ $avg: '$reviews.rating' }, 1] },
          reviewCount: { $size: '$reviews' },
        },
      },
      { $sort: { username: 1 } },
    ]);
    return resp.status(200).json({ launderers: directory });
  } catch (err) {
    logger.error(`getLaundererDirectory error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(500).json({ message: 'Error fetching launderers' });
  }
};

// @desc    Get the currently authenticated user (validates the auth cookie)
// @route   GET /me
// @access  Private
const getMe = async (req, resp) => {
  try {
    const user = await User.findById(req.user.user_id).select('-password -__v');
    if (!user) {
      return resp.status(404).json({ message: 'User not found' });
    }
    return resp.status(200).json(user);
  } catch (err) {
    logger.error(`getMe error: ${err.message}`, { stack: err.stack });
    return resp.status(500).json({ message: 'Internal Server Error' });
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
      secure: process.env.NODE_ENV === 'production', // set to true if your using https
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // if backend and frontend are on different domains
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
  try {
    const decodedToken = req.user;
    const user = await User.findByIdAndUpdate(decodedToken.user_id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      throw new Error('User not found');
    }
    resp.status(200).json(user);
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
        const token = authUtils.createToken(
          user.username,
          user.role,
          user._id,
          user.hostel
        );

        resp.cookie('jwt', token, {
          httpOnly: true,
          maxAge: maxAge * 1000,
          secure: process.env.NODE_ENV === 'production', // set to true if your using https
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // if backend and frontend are on different domains
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
    secure: process.env.NODE_ENV === 'production', // set to true if your using https
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // if backend and frontend are on different domains
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
        { expiresIn: '5m' }
      );
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
      const url = `${backendUrl}/resetpassword/${user._id}/${token}`;

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
        from: `"LaundriX" <${process.env.GMAIL_ADDRESS}>`,
        to: email,
        subject: 'Reset Password link from LaundriX',
        text: `Click on this link to reset your password: ${url}`,
        html: `<b>Click on this link to reset your password: <a href="${url}">Reset Password</a></b>`,
      });
      logger.info(`Password reset email sent: ${info.messageId}`);
      resp.status(200).json(info);
    }
  } catch (err) {
    resp.status(404).json({ message: err.message });
  }
};

// @desc    Reset the user password (Gets the password from input)
// @route   GET /resetpassword/:id/:token
// @access  Public
const getResetPassword = async (req, resp) => {
  const { id, token } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return resp.status(404).send('User not found');
    }
    const secret = process.env.JWT_SECRET + user.password;
    // eslint-disable-next-line no-unused-vars
    const verify = jwt.verify(token, secret);
    return resp.render('index', {
      status: 'not verified',
      error: '',
    });
  } catch (err) {
    return resp.status(401).send(err.message);
  }
};

// @desc    Reset the user password
// @route   POST /forgotpassword
// @access  Public
const postResetPassword = async (req, resp) => {
  const { id, token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) {
      return resp.status(404).render('index', {
        status: 'not verified',
        error: 'User not found',
      });
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
    // eslint-disable-next-line no-unused-vars
    const verify = jwt.verify(token, secret);
    user.password = password;
    await user.save();
    return resp.status(200).render('index', { status: 'verified', error: '' });
  } catch (err) {
    logger.error(`postResetPassword error: ${err.message}`, {
      stack: err.stack,
    });
    return resp.status(401).send(err.message);
  }
};
module.exports = {
  getAllUsers,
  getAllLaunderers,
  getLaundererDirectory,
  getMe,
  createUser,
  updateUser,
  loginUser,
  logoutUser,
  forgotPassword,
  getResetPassword,
  postResetPassword,
};
