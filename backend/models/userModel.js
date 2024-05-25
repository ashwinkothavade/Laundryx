const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      minlength: [4, 'Username must be at least 4 characters long'],
      required: [true, 'Please provide a username'],
      unique: [true, 'Username already taken'],
      trim: true,
    },
    phone_number: {
      type: String,
      required: [true, 'Please provide a phone number'],
      unique: [true, 'Phone number already taken'],
      validate: {
        validator(value) {
          return /(\+91|0)\d{10}/g.test(value);
        },
        message:
          'Invalid phone number, enter an Indian phone number, starting with +91 or 0',
      },
    },
    roll_number: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'launderer'],
      required: [true, 'Please select a role'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: [true, 'Email already taken'],
      validate: {
        validator: validator.isEmail,
        message: 'Invalid email',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator(value) {
          // At least one uppercase letter, one lowercase letter, one digit, and one special character
          return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/g.test(value);
        },
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
      },
    },
    room_number: {
      type: String,
      default: '',
    },
    hostel: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'User',
  }
);

// eslint-disable-next-line func-names
userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
