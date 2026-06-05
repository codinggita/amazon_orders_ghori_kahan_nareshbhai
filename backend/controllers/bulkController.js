const Order = require('../models/Order');

// ─── Helper: build $or query matching custom OrderID or MongoDB _id ───────────
const buildIdQuery = (id) => {
  const q = { $or: [{ OrderID: id }] };
  if (id.match(/^[0-9a-fA-F]{24}$/)) q.$or.push({ _id: id });
  return q;
};

// ─── Helper: convert TotalAmount string to number ─────────────────────────────
const toNum = (val) => parseFloat(val || '0') || 0;

// ─── Valid order statuses ──────────────────────────────────────────────────────
const VALID_STATUSES = [
  'Pending', 'Processing', 'Shipped', 'In Transit',
  'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded', 'Archived'
];

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/orders/bulk/create
// Bulk create multiple orders in one request
// Body: { orders: [ {...}, {...}, ... ] }
// ══════════════════════════════════════════════════════════════════════════════
exports.bulkCreateOrders = async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orders must be a non-empty array of order objects'
      });
    }

    if (orders.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 500 orders can be created in one bulk request'
      });
    }

    // Validate required fields per order
    const errors = [];
    orders.forEach((o, i) => {
      if (!o.OrderID)      errors.push(`orders[${i}]: OrderID is required`);
      if (!o.CustomerName) errors.push(`orders[${i}]: CustomerName is required`);
      if (!o.ProductName)  errors.push(`orders[${i}]: ProductName is required`);
      if (!o.TotalAmount)  errors.push(`orders[${i}]: TotalAmount is required`);
    });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const created = await Order.insertMany(orders, { ordered: false });

    res.status(201).json({
      success: true,
      message: `${created.length} order(s) created successfully`,
      count:   created.length,
      data:    created
    });
  } catch (error) {
    // insertMany with ordered:false — report partial success
    if (error.name === 'BulkWriteError') {
      return res.status(207).json({
        success: false,
        message: 'Partial bulk create — some orders failed (e.g. duplicate OrderID)',
        insertedCount: error.result?.nInserted || 0,
        errors: error.writeErrors?.map(e => ({ index: e.index, message: e.errmsg })) || []
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/orders/bulk/update
// Bulk update arbitrary fields on multiple orders
// Body: { orderIds: ["ORD-1","ORD-2",...], updates: { field: value, ... } }
// ══════════════════════════════════════════════════════════════════════════════
exports.bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, updates } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds must be a non-empty array' });
    }
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'updates object with at least one field is required' });
    }

    // Safety: block bulk password/sensitive field writes
    const blocked = ['_id', 'password', '__v'];
    const hasBlocked = blocked.some(k => k in updates);
    if (hasBlocked) {
      return res.status(400).json({ success: false, message: `Cannot bulk update protected fields: ${blocked.join(', ')}` });
    }

    const result = await Order.updateMany(
      { $or: [{ OrderID: { $in: orderIds } }, { _id: { $in: orderIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } }] },
      { $set: updates }
    );

    res.status(200).json({
      success: true,
      message: 'Bulk update completed successfully',
      data: {
        matchedCount:  result.matchedCount,
        modifiedCount: result.modifiedCount,
        requestedIds:  orderIds.length,
        updatedFields: Object.keys(updates)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/orders/bulk/delete
// Bulk delete orders by OrderIDs
// Body: { orderIds: ["ORD-1","ORD-2",...] }
// ══════════════════════════════════════════════════════════════════════════════
exports.bulkDeleteOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds must be a non-empty array' });
    }

    if (orderIds.length > 500) {
      return res.status(400).json({ success: false, message: 'Maximum 500 orders can be deleted in one bulk request' });
    }

    const result = await Order.deleteMany({
      $or: [
        { OrderID: { $in: orderIds } },
        { _id:     { $in: orderIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Bulk delete completed successfully',
      data: {
        requestedCount: orderIds.length,
        deletedCount:   result.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/orders/bulk/status
// Bulk update OrderStatus for a list of orders
// Body: { orderIds: [...], status: "Shipped" }
// ══════════════════════════════════════════════════════════════════════════════
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds must be a non-empty array' });
    }

    const normalised = VALID_STATUSES.find(s => s.toLowerCase() === (status || '').toLowerCase());
    if (!normalised) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}"`,
        validStatuses: VALID_STATUSES
      });
    }

    const result = await Order.updateMany(
      { $or: [{ OrderID: { $in: orderIds } }, { _id: { $in: orderIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } }] },
      { $set: { OrderStatus: normalised } }
    );

    res.status(200).json({
      success: true,
      message: `Bulk status updated to "${normalised}" successfully`,
      data: {
        requestedCount: orderIds.length,
        matchedCount:   result.matchedCount,
        modifiedCount:  result.modifiedCount,
        newStatus:      normalised
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/orders/bulk/archive
// Bulk archive orders (sets isArchived: true, status: "Archived")
// Body: { orderIds: [...] }
// ══════════════════════════════════════════════════════════════════════════════
exports.bulkArchiveOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds must be a non-empty array' });
    }

    const result = await Order.updateMany(
      {
        $or: [
          { OrderID: { $in: orderIds } },
          { _id:     { $in: orderIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } }
        ],
        isArchived: { $ne: true }           // skip already-archived
      },
      { $set: { isArchived: true, OrderStatus: 'Archived' } }
    );

    res.status(200).json({
      success: true,
      message: 'Bulk archive completed successfully',
      data: {
        requestedCount: orderIds.length,
        matchedCount:   result.matchedCount,
        archivedCount:  result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/orders/bulk/restore
// Bulk restore archived orders (sets isArchived: false, status: "Pending")
// Body: { orderIds: [...] }
// ══════════════════════════════════════════════════════════════════════════════
exports.bulkRestoreOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds must be a non-empty array' });
    }

    const result = await Order.updateMany(
      {
        $or: [
          { OrderID: { $in: orderIds } },
          { _id:     { $in: orderIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } }
        ],
        isArchived: true                    // only restore archived ones
      },
      { $set: { isArchived: false, OrderStatus: 'Pending' } }
    );

    res.status(200).json({
      success: true,
      message: 'Bulk restore completed successfully',
      data: {
        requestedCount: orderIds.length,
        matchedCount:   result.matchedCount,
        restoredCount:  result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/orders/bulk/apply-discount
// Apply a discount percentage or flat amount to multiple orders
// Body: { orderIds: [...], discountType: "percentage"|"flat", discountValue: 10 }
// ══════════════════════════════════════════════════════════════════════════════
exports.bulkApplyDiscount = async (req, res) => {
  try {
    const { orderIds, discountType, discountValue } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds must be a non-empty array' });
    }

    if (!['percentage', 'flat'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: 'discountType must be "percentage" or "flat"'
      });
    }

    const dv = parseFloat(discountValue);
    if (isNaN(dv) || dv <= 0) {
      return res.status(400).json({ success: false, message: 'discountValue must be a positive number' });
    }

    if (discountType === 'percentage' && dv > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
    }

    // Fetch matching orders, apply discount, bulk-write back
    const orders = await Order.find({
      $or: [
        { OrderID: { $in: orderIds } },
        { _id:     { $in: orderIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } }
      ]
    });

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'No matching orders found' });
    }

    const bulkOps = orders.map(order => {
      const original    = toNum(order.TotalAmount);
      const discount    = discountType === 'percentage'
        ? parseFloat((original * dv / 100).toFixed(2))
        : Math.min(dv, original);           // flat can't exceed order value
      const newTotal    = parseFloat((original - discount).toFixed(2));
      const newDiscount = parseFloat((toNum(order.Discount) + discount).toFixed(2));

      return {
        updateOne: {
          filter: { _id: order._id },
          update: {
            $set: {
              TotalAmount: newTotal.toString(),
              Discount:    newDiscount.toString()
            }
          }
        }
      };
    });

    const result = await Order.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: `Discount applied to ${result.modifiedCount} order(s) successfully`,
      data: {
        discountType,
        discountValue: dv,
        requestedCount:  orderIds.length,
        matchedCount:    orders.length,
        modifiedCount:   result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/orders/bulk/payment-status
// Bulk update PaymentMethod for multiple orders
// Body: { orderIds: [...], paymentMethod: "Credit Card" }
// ══════════════════════════════════════════════════════════════════════════════
exports.bulkUpdatePaymentStatus = async (req, res) => {
  try {
    const { orderIds, paymentMethod } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds must be a non-empty array' });
    }

    if (!paymentMethod || typeof paymentMethod !== 'string' || !paymentMethod.trim()) {
      return res.status(400).json({ success: false, message: 'paymentMethod (string) is required' });
    }

    const result = await Order.updateMany(
      { $or: [{ OrderID: { $in: orderIds } }, { _id: { $in: orderIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } }] },
      { $set: { PaymentMethod: paymentMethod.trim() } }
    );

    res.status(200).json({
      success: true,
      message: `Payment method updated to "${paymentMethod.trim()}" for ${result.modifiedCount} order(s)`,
      data: {
        requestedCount:  orderIds.length,
        matchedCount:    result.matchedCount,
        modifiedCount:   result.modifiedCount,
        newPaymentMethod: paymentMethod.trim()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/orders/bulk/shipping-status
// Bulk update shipping/order status for shipment tracking
// Body: { orderIds: [...], shippingStatus: "Shipped" }
// ══════════════════════════════════════════════════════════════════════════════
exports.bulkUpdateShippingStatus = async (req, res) => {
  try {
    const { orderIds, shippingStatus } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds must be a non-empty array' });
    }

    const SHIPPING_STATUSES = ['Pending', 'Processing', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered'];
    const normalised = SHIPPING_STATUSES.find(s => s.toLowerCase() === (shippingStatus || '').toLowerCase());

    if (!normalised) {
      return res.status(400).json({
        success: false,
        message: `Invalid shippingStatus "${shippingStatus}"`,
        validShippingStatuses: SHIPPING_STATUSES
      });
    }

    const result = await Order.updateMany(
      { $or: [{ OrderID: { $in: orderIds } }, { _id: { $in: orderIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } }] },
      { $set: { OrderStatus: normalised } }
    );

    res.status(200).json({
      success: true,
      message: `Shipping status updated to "${normalised}" for ${result.modifiedCount} order(s)`,
      data: {
        requestedCount:    orderIds.length,
        matchedCount:      result.matchedCount,
        modifiedCount:     result.modifiedCount,
        newShippingStatus: normalised
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/orders/bulk/cleanup-cancelled
// Delete ALL cancelled orders from the database
// Query: ?confirm=true (safety gate)
// ══════════════════════════════════════════════════════════════════════════════
exports.cleanupCancelledOrders = async (req, res) => {
  try {
    // Safety gate — must pass ?confirm=true
    if (req.query.confirm !== 'true') {
      const countToDelete = await Order.countDocuments({ OrderStatus: { $regex: /^cancelled$/i } });
      return res.status(400).json({
        success: false,
        message: 'This action will permanently delete cancelled orders. Add ?confirm=true to proceed.',
        cancelledOrderCount: countToDelete
      });
    }

    const result = await Order.deleteMany({ OrderStatus: { $regex: /^cancelled$/i } });

    res.status(200).json({
      success: true,
      message: `Cleanup complete — ${result.deletedCount} cancelled order(s) permanently deleted`,
      data: {
        deletedCount: result.deletedCount,
        cleanedAt:    new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
