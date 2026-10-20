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
      enum: ['customer', 'launderer', 'admin'],
      required: [true, 'Please select a role'],
    },
    // Launderers must be approved by an admin before they are visible to
    // students and can receive orders. Not applicable to students/admins.
    approved: {
      type: Boolean,
      default: false,
    },
    // A launderer's own available pickup/delivery time slots. When empty, the
    // global admin-managed `timeSlots` setting applies.
    availableTimeSlots: {
      type: [String],
      default: [],
    },
    // Flat surcharge a launderer charges for express service. 0 = not offered.
    expressSurcharge: {
      type: Number,
      default: 0,
      min: 0,
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

// Hash the password on the way in — but only when it actually changed.
// Without the isModified guard, every save of an existing document re-hashes
// the stored hash and silently locks the user out of their own account.
// Must stay a `function` (not an arrow) so `this` is the document.
// eslint-disable-next-line func-names
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

module.exports = mongoose.model('User', userSchema);
