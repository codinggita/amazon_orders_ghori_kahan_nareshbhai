const Order = require('../models/Order');

// GET /api/v1/orders - Fetch all orders with pagination
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find().skip(skip).limit(limit);
    const total = await Order.countDocuments();

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/:orderId - Fetch order details
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ OrderID: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/orders - Create a new order
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/orders/:orderId - Replace order info
exports.replaceOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { OrderID: req.params.orderId },
      req.body,
      { new: true, runValidators: true, overwrite: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/orders/:orderId - Partially update order
exports.updateOrderFields = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { OrderID: req.params.orderId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/orders/:orderId - Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ OrderID: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/:orderId/exists - Check whether order exists
exports.checkOrderExists = async (req, res) => {
  try {
    const exists = await Order.exists({ OrderID: req.params.orderId });
    res.status(200).json({ success: true, exists: !!exists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/:orderId/summary - Fetch summarized order details
exports.getOrderSummary = async (req, res) => {
  try {
    const order = await Order.findOne({ OrderID: req.params.orderId }).select('OrderID CustomerName TotalAmount OrderStatus OrderDate');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/:orderId/items - Fetch items of an order
exports.getOrderItems = async (req, res) => {
  try {
    const order = await Order.findOne({ OrderID: req.params.orderId }).select('ProductID ProductName Quantity UnitPrice');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/:orderId/history - Fetch order status history
exports.getOrderHistory = async (req, res) => {
  try {
    const order = await Order.findOne({ OrderID: req.params.orderId }).select('OrderID OrderStatus OrderDate');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: [{ status: order.OrderStatus, date: order.OrderDate }] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/orders/:orderId/archive - Archive an order
exports.archiveOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { OrderID: req.params.orderId },
      { isArchived: true, OrderStatus: 'Archived' },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, message: 'Order archived', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/orders/:orderId/restore - Restore archived order
exports.restoreOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { OrderID: req.params.orderId },
      { isArchived: false, OrderStatus: 'Pending' },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, message: 'Order restored', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/orders/:orderId/cancel - Cancel an order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { OrderID: req.params.orderId },
      { OrderStatus: 'Cancelled' },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, message: 'Order cancelled', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/orders/:orderId/duplicate - Duplicate an order
exports.duplicateOrder = async (req, res) => {
  try {
    const originalOrder = await Order.findOne({ OrderID: req.params.orderId });
    if (!originalOrder) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const duplicateData = originalOrder.toObject();
    delete duplicateData._id;
    duplicateData.OrderID = `${duplicateData.OrderID}-COPY-${Date.now()}`;
    duplicateData.OrderStatus = 'Pending';
    
    const newOrder = await Order.create(duplicateData);
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/:orderId/invoice - Generate invoice details
exports.generateInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({ OrderID: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const total = parseFloat(order.TotalAmount);
    const invoice = {
      invoiceNumber: `INV-${order.OrderID}`,
      date: new Date(),
      customer: order.CustomerName,
      product: order.ProductName,
      total: total,
      tax: (total * 0.1).toFixed(2),
      grandTotal: (total * 1.1).toFixed(2)
    };
    
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
