const Order = require('../models/Order');

// GET /api/v1/orders/filter/status?type=Pending
exports.filterByStatus = async (req, res) => {
  try {
    const type = req.query.type || '';
    const orders = await Order.find({ OrderStatus: new RegExp('^' + type + '$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/payment?method=Card
exports.filterByPayment = async (req, res) => {
  try {
    const method = req.query.method || '';
    const orders = await Order.find({ PaymentMethod: new RegExp('^' + method + '$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/category?name=Electronics
exports.filterByCategory = async (req, res) => {
  try {
    const name = req.query.name || '';
    const orders = await Order.find({ Category: new RegExp('^' + name + '$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/brand?name=Apple
exports.filterByBrand = async (req, res) => {
  try {
    const name = req.query.name || '';
    const orders = await Order.find({ Brand: new RegExp('^' + name + '$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/price?min=100&max=1000
exports.filterByPrice = async (req, res) => {
  try {
    const min = parseFloat(req.query.min) || 0;
    const max = parseFloat(req.query.max) || Number.MAX_SAFE_INTEGER;
    
    // TotalAmount is stored as a string in the schema. Using $expr and $toDouble to compare numerically.
    // If some fields cannot be converted to double, this might fail, so we fallback to finding all and filtering in memory if needed.
    let orders;
    try {
      orders = await Order.find({
        $expr: {
          $and: [
            { $gte: [{ $toDouble: "$TotalAmount" }, min] },
            { $lte: [{ $toDouble: "$TotalAmount" }, max] }
          ]
        }
      }).limit(50);
    } catch (dbErr) {
      // Fallback if $toDouble fails due to dirty data
      const allOrders = await Order.find().limit(1000);
      orders = allOrders.filter(o => {
        const amount = parseFloat(o.TotalAmount);
        return !isNaN(amount) && amount >= min && amount <= max;
      }).slice(0, 50);
    }
    
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/date?start=2025-01-01&end=2025-02-01
exports.filterByDate = async (req, res) => {
  try {
    const start = req.query.start;
    const end = req.query.end;
    
    let query = {};
    if (start || end) {
      query.OrderDate = {};
      // Assuming OrderDate is stored in a string format that is lexically comparable (e.g. YYYY-MM-DD)
      if (start) query.OrderDate.$gte = start;
      if (end) query.OrderDate.$lte = end;
    }
    
    const orders = await Order.find(query).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/country?name=India
exports.filterByCountry = async (req, res) => {
  try {
    const name = req.query.name || '';
    const orders = await Order.find({ Country: new RegExp('^' + name + '$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/state?name=Gujarat
exports.filterByState = async (req, res) => {
  try {
    const name = req.query.name || '';
    const orders = await Order.find({ State: new RegExp('^' + name + '$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/city?name=Surat
exports.filterByCity = async (req, res) => {
  try {
    const name = req.query.name || '';
    const orders = await Order.find({ City: new RegExp('^' + name + '$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/high-value?amount=1000
exports.filterHighValue = async (req, res) => {
  try {
    const amountThreshold = parseFloat(req.query.amount) || 1000;
    let orders;
    try {
      orders = await Order.find({
        $expr: {
          $gte: [{ $toDouble: "$TotalAmount" }, amountThreshold]
        }
      }).limit(50);
    } catch (dbErr) {
      const allOrders = await Order.find().limit(1000);
      orders = allOrders.filter(o => {
        const amount = parseFloat(o.TotalAmount);
        return !isNaN(amount) && amount >= amountThreshold;
      }).slice(0, 50);
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/discounted
exports.filterDiscounted = async (req, res) => {
  try {
    // Discounted orders have Discount > 0 or Discount is a non-empty, non-zero string
    const orders = await Order.find({
      Discount: { $exists: true, $ne: '0', $ne: '', $ne: '0.00' }
    }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/cancelled
exports.filterCancelled = async (req, res) => {
  try {
    const orders = await Order.find({ OrderStatus: new RegExp('^Cancelled$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/refunded
exports.filterRefunded = async (req, res) => {
  try {
    const orders = await Order.find({ OrderStatus: new RegExp('^Refunded$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/shipped
exports.filterShipped = async (req, res) => {
  try {
    const orders = await Order.find({ OrderStatus: new RegExp('^Shipped$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/filter/delivered
exports.filterDelivered = async (req, res) => {
  try {
    const orders = await Order.find({ OrderStatus: new RegExp('^Delivered$', 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
