const Order = require('../models/Order');

// Helper to build standard paginated response
const paginate = async (query, page, limit) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Order.find(query).skip(skip).limit(limit),
    Order.countDocuments(query)
  ]);  
  return { data, total, page, pages: Math.ceil(total / limit), count: data.length };
};

// GET /api/v1/orders/paged?page=1&limit=50
// Paginated order listing (alias for getAllOrders with explicit endpoint)
exports.getPagedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await paginate({}, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/infinite?page=1
// Infinite scroll pagination - skips expensive total count
exports.getInfiniteOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Fetch one extra record to determine if there are more pages
    const data = await Order.find({}).skip(skip).limit(limit + 1);
    const hasMore = data.length > limit;
    const orders = hasMore ? data.slice(0, limit) : data;

    res.status(200).json({
      success: true,
      count: orders.length,
      page,
      hasMore,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/recent?page=1&limit=5
// Paginated recent orders sorted by latest order date
exports.getRecentOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Order.find({}).sort({ OrderDate: -1, createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({})
    ]);

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/cancelled?page=1&limit=10
// Paginated cancelled orders
exports.getCancelledOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await paginate({ OrderStatus: 'Cancelled' }, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/refunded?page=1&limit=10
// Paginated refunded orders
exports.getRefundedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await paginate({ OrderStatus: 'Refunded' }, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/customer/:customerId?page=1&limit=10
// Paginated orders for a specific customer (by CustomerID or CustomerName)
exports.getCustomerOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { customerId } = req.params;

    const query = {
      $or: [
        { CustomerID: customerId },
        { CustomerName: new RegExp(customerId, 'i') }
      ]
    };

    const result = await paginate(query, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/product/:productId?page=1&limit=10
// Paginated orders for a specific product (by ProductID or ProductName)
exports.getProductOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { productId } = req.params;

    const query = {
      $or: [
        { ProductID: productId },
        { ProductName: new RegExp(productId, 'i') }
      ]
    };

    const result = await paginate(query, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
