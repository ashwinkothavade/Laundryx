const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const verifyUser = (req, resp, next) => {
  try {
    const token = req.cookies.jwt;
    if (token) {
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        async (err, decodedToken) => {
          if (err) {
            logger.warn(`Token verification failed: ${err.message}`);
            resp.status(401).json({ message: 'Unauthorized' });
          } else {
            // Expose the verified payload so controllers don't re-verify.
            req.user = decodedToken;
            next();
          }
        }
      );
    } else {
      resp.status(401).json({ message: 'Unauthorized' }); // Return an unauthorized response
    }
  } catch (err) {
    logger.error(`verifyUser error: ${err.message}`, { stack: err.stack });
    resp.status(500).json({ message: 'Internal Server Error' });
  }
};
const verifyStudentDetails = (req, resp, next) => {
  try {
    const token = req.cookies.jwt;
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decodedToken.role === 'student' && decodedToken.hostel === '') {
      resp.status(401).json({ message: 'Please update your hostel details' });
    } else {
      next();
    }
  } catch (err) {
    logger.error(`verifyStudentDetails error: ${err.message}`, {
      stack: err.stack,
    });
    resp.status(500).json({ message: 'Internal Server Error' });
  }
};

// Role guards — must run AFTER verifyUser (which populates req.user).
const requireRole = (role) => (req, resp, next) => {
  if (!req.user || req.user.role !== role) {
    return resp
      .status(403)
      .json({ message: 'You do not have access to this resource' });
  }
  return next();
};

const verifyLaunderer = requireRole('launderer');
const verifyAdmin = requireRole('admin');

module.exports = {
  verifyUser,
  verifyStudentDetails,
  verifyLaunderer,
  verifyAdmin,
};
