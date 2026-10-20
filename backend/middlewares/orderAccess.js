const Order = require('../models/orderModel');
const logger = require('../utils/logger');

// Object-level authorization for a single order.
//
// Role guards answer "may this *kind* of user do this *kind* of thing". They
// cannot answer "may this user touch *this* record", because that question
// needs the record — which is why the check kept ending up inside handlers,
// where forgetting it is invisible. Declaring it on the route instead means a
// handler cannot be written without one: it has no order to work with.
//
// Loads the order, asserts the caller's relationship to it, and attaches it as
// req.order so the handler does not fetch it again.
//
//   as: 'owner'     — the customer who placed the order
//   as: 'launderer' — the launderer the order was placed with
const loadOrder =
  ({ as }) =>
  async (req, resp, next) => {
    try {
      const order = await Order.findById(req.params.order_id);
      if (!order) {
        return resp.status(404).json({ message: 'Order not found' });
      }

      const related =
        as === 'owner'
          ? order.user.toString() === req.user.user_id
          : order.launderer === req.user.username;

      if (!related) {
        logger.warn(
          `Blocked ${req.user.role} ${req.user.username} from ${req.method} ` +
            `${req.originalUrl} on an order they are not party to`
        );
        return resp
          .status(403)
          .json({ message: 'You are not authorized to modify this order' });
      }

      req.order = order;
      return next();
    } catch (err) {
      logger.error(`loadOrder error: ${err.message}`, { stack: err.stack });
      return resp.status(500).json({ message: 'Error loading the order' });
    }
  };

module.exports = { loadOrder };
