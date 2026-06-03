const Order = require('../models/Order');

// Map of sort query shorthand to MongoDB sort fields
const SORT_MAP = {
  amount:   { TotalAmount: 1 },
  '-amount': { TotalAmount: -1 },
  date:     { OrderDate: 1 },
  '-date':  { OrderDate: -1 },
  status:   { OrderStatus: 1 },
  customer: { CustomerName: 1 },
  city:     { City: 1 },
  payment:  { PaymentMethod: 1 },
};

// ─── Query-Param Sort ─────────────────────────────────────────────────────────
// GET /api/v1/orders/sort?sort=amount&page=1&limit=10
exports.sortByQuery = async (req, res) => {
  try {
    const sortKey = req.query.sort || 'date';
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const sortObj = SORT_MAP[sortKey];
    if (!sortObj) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort key "${sortKey}". Valid options: ${Object.keys(SORT_MAP).join(', ')}`
      });
    }

    const [data, total] = await Promise.all([
      Order.find({}).sort(sortObj).skip(skip).limit(limit),
      Order.countDocuments({})
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      sortedBy: sortKey,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Dedicated Sort Endpoints ─────────────────────────────────────────────────

// GET /api/v1/orders/sort/highest-value
exports.sortHighestValue = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const allOrders = await Order.find({}).skip(skip).limit(limit * 5);
    const sorted = allOrders
      .sort((a, b) => parseFloat(b.TotalAmount) - parseFloat(a.TotalAmount))
      .slice(0, limit);

    const total = await Order.countDocuments({});
    res.status(200).json({
      success: true, count: sorted.length, total,
      page, pages: Math.ceil(total / limit), data: sorted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/sort/lowest-value
exports.sortLowestValue = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const allOrders = await Order.find({}).skip(skip).limit(limit * 5);
    const sorted = allOrders
      .sort((a, b) => parseFloat(a.TotalAmount) - parseFloat(b.TotalAmount))
      .slice(0, limit);

    const total = await Order.countDocuments({});
    res.status(200).json({
      success: true, count: sorted.length, total,
      page, pages: Math.ceil(total / limit), data: sorted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/sort/latest
exports.sortLatest = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Order.find({}).sort({ OrderDate: -1 }).skip(skip).limit(limit),
      Order.countDocuments({})
    ]);
    res.status(200).json({
      success: true, count: data.length, total,
      page, pages: Math.ceil(total / limit), data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/sort/oldest
exports.sortOldest = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Order.find({}).sort({ OrderDate: 1 }).skip(skip).limit(limit),
      Order.countDocuments({})
    ]);
    res.status(200).json({
      success: true, count: data.length, total,
      page, pages: Math.ceil(total / limit), data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/sort/most-items
exports.sortMostItems = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const allOrders = await Order.find({}).skip(skip).limit(limit * 5);
    const sorted = allOrders
      .sort((a, b) => parseInt(b.Quantity) - parseInt(a.Quantity))
      .slice(0, limit);

    const total = await Order.countDocuments({});
    res.status(200).json({
      success: true, count: sorted.length, total,
      page, pages: Math.ceil(total / limit), data: sorted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/sort/least-items
exports.sortLeastItems = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const allOrders = await Order.find({}).skip(skip).limit(limit * 5);
    const sorted = allOrders
      .sort((a, b) => parseInt(a.Quantity) - parseInt(b.Quantity))
      .slice(0, limit);

    const total = await Order.countDocuments({});
    res.status(200).json({
      success: true, count: sorted.length, total,
      page, pages: Math.ceil(total / limit), data: sorted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/sort/discount
exports.sortByDiscount = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const allOrders = await Order.find({}).skip(skip).limit(limit * 5);
    const sorted = allOrders
      .sort((a, b) => parseFloat(b.Discount) - parseFloat(a.Discount))
      .slice(0, limit);

    const total = await Order.countDocuments({});
    res.status(200).json({
      success: true, count: sorted.length, total,
      page, pages: Math.ceil(total / limit), data: sorted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
