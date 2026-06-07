const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

// Helper: build query matching custom OrderID or MongoDB _id
const buildIdQuery = (orderIdParam) => {
  const query = { $or: [{ OrderID: orderIdParam }] };
  if (orderIdParam.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: orderIdParam });
  }
  return query;
};

// ══════════════════════════════════════════════════════════════════════════════
// HEAD Request Controllers
// ══════════════════════════════════════════════════════════════════════════════

exports.headOrders = async (req, res) => {
  try {
    const total = await Order.countDocuments({});
    res.set({
      'Content-Type': 'application/json',
      'X-Total-Count': total,
      'X-Result-Count': total
    });
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

exports.headSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const exists = await Order.exists(buildIdQuery(orderId));
    if (!exists) {
      return res.status(404).end();
    }
    res.set('Content-Type', 'application/json');
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

exports.headOrderItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne(buildIdQuery(orderId)).select('Quantity');
    if (!order) {
      return res.status(404).end();
    }
    res.set({
      'Content-Type': 'application/json',
      'X-Items-Count': order.Quantity || '1'
    });
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

exports.headOrdersSearch = (req, res) => {
  res.set('Content-Type', 'application/json');
  res.status(200).end();
};

exports.headFilterDelivered = async (req, res) => {
  try {
    const total = await Order.countDocuments({ OrderStatus: { $regex: /^delivered$/i } });
    res.set({
      'Content-Type': 'application/json',
      'X-Total-Count': total
    });
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

exports.headShippingPending = async (req, res) => {
  try {
    const total = await Order.countDocuments({
      OrderStatus: { $in: ['Pending', 'Processing', 'Shipped', 'In Transit', 'Out for Delivery'] }
    });
    res.set({
      'Content-Type': 'application/json',
      'X-Total-Count': total
    });
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

exports.headShippingTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const exists = await Order.exists(buildIdQuery(orderId));
    if (!exists) {
      return res.status(404).end();
    }
    res.set({
      'Content-Type': 'application/json',
      'X-Tracking-Carrier': 'Amazon Logistics'
    });
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

exports.headAnalyticsRevenueTotal = (req, res) => {
  res.set('Content-Type', 'application/json');
  res.status(200).end();
};

exports.headStatsOrdersTotal = async (req, res) => {
  try {
    const total = await Order.countDocuments({});
    res.set({
      'Content-Type': 'application/json',
      'X-Total-Orders': total
    });
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

exports.headAdminUsers = async (req, res) => {
  try {
    const total = await User.countDocuments({});
    res.set({
      'Content-Type': 'application/json',
      'X-Total-Users': total
    });
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

exports.headAdminOrders = async (req, res) => {
  try {
    const total = await Order.countDocuments({});
    res.set({
      'Content-Type': 'application/json',
      'X-Total-Orders': total
    });
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
};

exports.headDashboardOverview = (req, res) => {
  res.set('Content-Type', 'application/json');
  res.status(200).end();
};

exports.headSystemUptime = (req, res) => {
  res.set({
    'Content-Type': 'application/json',
    'X-Uptime-Seconds': Math.floor(process.uptime())
  });
  res.status(200).end();
};

exports.headSystemStatusDatabase = (req, res) => {
  const isHealthy = mongoose.connection.readyState === 1;
  res.set({
    'Content-Type': 'application/json',
    'X-Database-Healthy': isHealthy ? 'true' : 'false'
  });
  res.status(isHealthy ? 200 : 503).end();
};

exports.headSystemStatusCache = (req, res) => {
  res.set({
    'Content-Type': 'application/json',
    'X-Cache-Healthy': 'true'
  });
  res.status(200).end();
};

exports.headSystemStatusStorage = (req, res) => {
  res.set({
    'Content-Type': 'application/json',
    'X-Storage-Healthy': 'true'
  });
  res.status(200).end();
};

exports.headAuthProfile = (req, res) => {
  res.set('Content-Type', 'application/json');
  res.status(200).end();
};

exports.headNotifications = (req, res) => {
  res.set({
    'Content-Type': 'application/json',
    'X-Unread-Notifications-Count': 3
  });
  res.status(200).end();
};

exports.headActivityLogs = (req, res) => {
  res.set('Content-Type', 'application/json');
  res.status(200).end();
};

exports.headSystemPing = (req, res) => {
  res.set('Content-Type', 'application/json');
  res.status(200).end();
};


// ══════════════════════════════════════════════════════════════════════════════
// OPTIONS Request Controllers (HTTP Allow Headers)
// ══════════════════════════════════════════════════════════════════════════════

exports.optionsOrders = (req, res) => {
  res.set('Allow', 'GET, POST, HEAD, OPTIONS').status(200).end();
};

exports.optionsSingleOrder = (req, res) => {
  res.set('Allow', 'GET, PUT, PATCH, DELETE, HEAD, OPTIONS').status(200).end();
};

exports.optionsOrdersSearch = (req, res) => {
  res.set('Allow', 'GET, HEAD, OPTIONS').status(200).end();
};

exports.optionsOrdersFilterStatus = (req, res) => {
  res.set('Allow', 'GET, OPTIONS').status(200).end();
};

exports.optionsShippingTracking = (req, res) => {
  res.set('Allow', 'GET, HEAD, OPTIONS').status(200).end();
};

exports.optionsShippingCreateLabel = (req, res) => {
  res.set('Allow', 'POST, OPTIONS').status(200).end();
};

exports.optionsAuthLogin = (req, res) => {
  res.set('Allow', 'POST, OPTIONS').status(200).end();
};

exports.optionsAuthRegister = (req, res) => {
  res.set('Allow', 'POST, OPTIONS').status(200).end();
};

exports.optionsAdminUsers = (req, res) => {
  res.set('Allow', 'GET, HEAD, OPTIONS').status(200).end();
};

exports.optionsAdminOrders = (req, res) => {
  res.set('Allow', 'GET, HEAD, OPTIONS').status(200).end();
};

exports.optionsAdminSystemHealth = (req, res) => {
  res.set('Allow', 'GET, OPTIONS').status(200).end();
};

exports.optionsAnalyticsRevenueTotal = (req, res) => {
  res.set('Allow', 'GET, HEAD, OPTIONS').status(200).end();
};

exports.optionsDashboardOverview = (req, res) => {
  res.set('Allow', 'GET, HEAD, OPTIONS').status(200).end();
};

exports.optionsNotifications = (req, res) => {
  res.set('Allow', 'GET, POST, PATCH, DELETE, HEAD, OPTIONS').status(200).end();
};

exports.optionsSystemVersion = (req, res) => {
  res.set('Allow', 'GET, OPTIONS').status(200).end();
};

exports.optionsSystemStatusDatabase = (req, res) => {
  res.set('Allow', 'GET, HEAD, OPTIONS').status(200).end();
};

exports.optionsSystemStatusCache = (req, res) => {
  res.set('Allow', 'GET, HEAD, OPTIONS').status(200).end();
};

exports.optionsSystemStatusStorage = (req, res) => {
  res.set('Allow', 'GET, HEAD, OPTIONS').status(200).end();
};

exports.optionsValidateOrder = (req, res) => {
  res.set('Allow', 'POST, OPTIONS').status(200).end();
};

exports.optionsErrorsNotFound = (req, res) => {
  res.set('Allow', 'GET, OPTIONS').status(200).end();
};
