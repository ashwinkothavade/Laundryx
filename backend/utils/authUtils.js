const jwt = require('jsonwebtoken');

// The unique fields, and how to recognise a duplicate complaint about each.
const DUPLICATE_FIELDS = [
  { name: 'username', test: /username/i },
  { name: 'email', test: /email/i },
  { name: 'phone_number', test: /phone/i },
];

const handleSignUpError = (err) => {
  const error = {
    username: '',
    email: '',
    password: '',
    role: '',
    phone_number: '',
  };
  if (err.code === 11000) {
    if (err.keyValue.email) {
      error.email = 'Email already taken';
    } else if (err.keyValue.username) {
      error.username = 'Username already taken';
    } else if (err.keyValue.phone_number) {
      error.phone_number = 'Phone number already taken';
    }
  } else if (err.errors) {
    if (err.errors.username) {
      error.username = err.errors.username.message;
    }
    if (err.errors.password) {
      error.password = err.errors.password.message;
    }
    if (err.errors.email) {
      error.email = 'Please enter a valid email';
    }
    if (err.errors.role) {
      if (
        err.errors.role.properties &&
        err.errors.role.properties.type === 'enum'
      ) {
        error.role = 'Please enter a valid role: student or launderer';
      } else {
        error.role = err.errors.role.message;
      }
    }
    if (err.errors.phone_number) {
      error.phone_number = err.errors.phone_number.message;
    }
  } else {
    // Mongoose renders `unique: [true, 'message']` as a plain MongooseError
    // carrying that message, with no `code` and no `errors`. Neither branch
    // above matched it, so the caller used to receive `{}` — a duplicate
    // signup produced an error dialog with nothing in it.
    const message = String(err.message || '');
    const field = DUPLICATE_PHRASE.test(message)
      ? DUPLICATE_FIELDS.find(({ test }) => test.test(message))
      : null;
    if (field) {
      error[field.name] = message;
    } else {
      error.general = message || 'Could not complete the request';
    }
  }

  return error;
};

// A duplicate complaint says so in words. Matching on the field name alone
// also caught ordinary validation messages — "Username must be at least 4
// characters long" mentions the field too — and reported them as 409.
const DUPLICATE_PHRASE = /already taken|already exists|duplicate key|E11000/i;

// Whether this is a "that value is already taken" failure, in either of the
// two shapes Mongoose produces for it.
const isDuplicateError = (err) =>
  err?.code === 11000 || DUPLICATE_PHRASE.test(String(err?.message || ''));

const handleLogInError = (err) => {
  const errors = { username: '', password: '' };
  if (err.message === 'User not found') {
    errors.username = err.message;
  } else if (err.message === 'Incorrect password!!') {
    errors.password = err.message;
  }
  return errors;
};

const maxAge = 86400; // 3 days in seconds
const createToken = (username, role, userId, hostel) => {
  return jwt.sign(
    {
      username: username,
      role: role,
      user_id: userId,
      hostel: hostel,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: maxAge }
  );
};

module.exports = {
  handleSignUpError,
  isDuplicateError,
  handleLogInError,
  createToken,
};
