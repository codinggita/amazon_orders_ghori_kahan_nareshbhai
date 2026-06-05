const Order = require('../models/Order');

// ─── Helper: build query matching custom OrderID or MongoDB _id ───────────────
const buildIdQuery = (orderIdParam) => {
  const query = { $or: [{ OrderID: orderIdParam }] };
  if (orderIdParam.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: orderIdParam });
  }
  return query;
};

// ─── Static list of supported carriers ───────────────────────────────────────
const CARRIERS = [
  { id: 'FEDEX',   name: 'FedEx',          website: 'https://www.fedex.com',          trackingUrl: 'https://www.fedex.com/apps/fedextrack/?tracknumbers=' },
  { id: 'UPS',     name: 'UPS',            website: 'https://www.ups.com',            trackingUrl: 'https://www.ups.com/track?tracknum=' },
  { id: 'USPS',    name: 'USPS',           website: 'https://www.usps.com',           trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=' },
  { id: 'DHL',     name: 'DHL Express',    website: 'https://www.dhl.com',            trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=' },
  { id: 'AMAZON',  name: 'Amazon Logistics', website: 'https://logistics.amazon.com', trackingUrl: 'https://track.amazon.com/tracking/' },
  { id: 'BLUEDART', name: 'Blue Dart',     website: 'https://www.bluedart.com',       trackingUrl: 'https://www.bluedart.com/tracking?trackFor=' }
];

// ─── Helper: estimate business-day delivery (skips weekends) ─────────────────
const estimateDeliveryDate = (orderDate, businessDays = 5) => {
  const date = orderDate ? new Date(orderDate) : new Date();
  if (isNaN(date.getTime())) {
    // fallback: calculate from today
    return estimateDeliveryDate(null, businessDays);
  }
  let added = 0;
  const result = new Date(date);
  while (added < businessDays) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++; // skip Sunday (0) and Saturday (6)
  }
  return result;
};

// ─── Helper: derive shipment stage from OrderStatus ───────────────────────────
const getShipmentStage = (status = '') => {
  const s = status.toLowerCase();
  if (['pending', 'processing'].includes(s))                       return 'Order Received';
  if (['shipped', 'in transit', 'out for delivery'].includes(s))   return 'In Transit';
  if (['delivered'].includes(s))                                    return 'Delivered';
  if (['cancelled'].includes(s))                                    return 'Cancelled';
  if (['returned', 'refunded'].includes(s))                         return 'Returned';
  return 'Processing';
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/shipping/tracking/:orderId
// Track shipment for a given order
// ══════════════════════════════════════════════════════════════════════════════
exports.trackShipment = async (req, res) => {
  try {
    const order = await Order.findOne(buildIdQuery(req.params.orderId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const estimatedDelivery = estimateDeliveryDate(order.OrderDate, 5);
    const stage             = getShipmentStage(order.OrderStatus);

    const trackingInfo = {
      orderId:           order.OrderID,
      customerName:      order.CustomerName,
      currentStatus:     order.OrderStatus,
      shipmentStage:     stage,
      carrier:           'Amazon Logistics',
      trackingNumber:    `TRK-${order.OrderID}-${Date.now().toString(36).toUpperCase()}`,
      orderDate:         order.OrderDate,
      estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
      shippingAddress: {
        city:    order.City    || 'N/A',
        state:   order.State   || 'N/A',
        country: order.Country || 'N/A'
      },
      shippingCost: order.ShippingCost || '0',
      timeline: [
        { event: 'Order Placed',     date: order.OrderDate,                           completed: true  },
        { event: 'Processing',       date: order.OrderDate,                           completed: true  },
        { event: 'Shipped',          date: null,                                      completed: ['Shipped', 'Delivered'].includes(order.OrderStatus) },
        { event: 'Out for Delivery', date: null,                                      completed: order.OrderStatus === 'Delivered' },
        { event: 'Delivered',        date: order.OrderStatus === 'Delivered' ? estimatedDelivery.toISOString().split('T')[0] : null, completed: order.OrderStatus === 'Delivered' }
      ]
    };

    res.status(200).json({
      success: true,
      message: 'Shipment tracked successfully',
      data: trackingInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/shipping/update-status/:orderId
// Update shipping status for an order
// Body: { status: "Shipped" | "Delivered" | "Returned" | etc. }
// ══════════════════════════════════════════════════════════════════════════════
exports.updateShippingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      'Pending', 'Processing', 'Shipped', 'In Transit',
      'Out for Delivery', 'Delivered', 'Returned', 'Refunded', 'Cancelled'
    ];

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status field is required in request body',
        validStatuses
      });
    }

    const normalised = validStatuses.find(s => s.toLowerCase() === status.toLowerCase());
    if (!normalised) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}"`,
        validStatuses
      });
    }

    const order = await Order.findOneAndUpdate(
      buildIdQuery(req.params.orderId),
      { OrderStatus: normalised },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      message: `Shipping status updated to "${normalised}" successfully`,
      data: {
        orderId:       order.OrderID,
        customerName:  order.CustomerName,
        previousStatus: req.body.status,
        newStatus:     order.OrderStatus,
        updatedAt:     new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/shipping/pending
// Fetch all pending shipments (Pending + Processing statuses)
// ══════════════════════════════════════════════════════════════════════════════
exports.getPendingShipments = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const query = {
      OrderStatus: { $in: ['Pending', 'Processing', 'Shipped', 'In Transit', 'Out for Delivery'] }
    };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .select('OrderID CustomerName OrderDate OrderStatus City State Country ShippingCost TotalAmount')
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      message: 'Pending shipments fetched successfully',
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

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/shipping/delivered
// Fetch all delivered shipments
// ══════════════════════════════════════════════════════════════════════════════
exports.getDeliveredShipments = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const query = { OrderStatus: { $regex: /^delivered$/i } };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .select('OrderID CustomerName OrderDate OrderStatus City State Country ShippingCost TotalAmount')
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      message: 'Delivered shipments fetched successfully',
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

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/shipping/returned
// Fetch all returned shipments (Returned + Refunded)
// ══════════════════════════════════════════════════════════════════════════════
exports.getReturnedShipments = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const query = {
      OrderStatus: { $in: ['Returned', 'Refunded'] }
    };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .select('OrderID CustomerName OrderDate OrderStatus City State Country ShippingCost TotalAmount')
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      message: 'Returned shipments fetched successfully',
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

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/shipping/create-label
// Create a shipping label for an order
// Body: { orderId, carrier (optional), serviceType (optional) }
// ══════════════════════════════════════════════════════════════════════════════
exports.createShippingLabel = async (req, res) => {
  try {
    const { orderId, carrier = 'AMAZON', serviceType = 'Standard' } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required in request body'
      });
    }

    const order = await Order.findOne(buildIdQuery(orderId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const selectedCarrier = CARRIERS.find(c => c.id === carrier.toUpperCase()) || CARRIERS[4]; // default Amazon

    const labelId       = `LBL-${order.OrderID}-${Date.now().toString(36).toUpperCase()}`;
    const trackingNo    = `TRK${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const estimatedDate = estimateDeliveryDate(order.OrderDate, serviceType === 'Express' ? 2 : 5);

    const label = {
      labelId,
      trackingNumber:  trackingNo,
      carrier:         selectedCarrier.name,
      carrierId:       selectedCarrier.id,
      serviceType,
      trackingUrl:     `${selectedCarrier.trackingUrl}${trackingNo}`,
      generatedAt:     new Date().toISOString(),
      estimatedDelivery: estimatedDate.toISOString().split('T')[0],
      sender: {
        name:    'Amazon Seller Fulfilled',
        address: 'Amazon Fulfillment Center',
        country: 'US'
      },
      recipient: {
        name:    order.CustomerName,
        city:    order.City    || 'N/A',
        state:   order.State   || 'N/A',
        country: order.Country || 'N/A'
      },
      package: {
        orderId:      order.OrderID,
        product:      order.ProductName,
        quantity:     order.Quantity     || '1',
        shippingCost: order.ShippingCost || '0'
      }
    };

    res.status(201).json({
      success: true,
      message: 'Shipping label created successfully',
      data: label
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/shipping/estimate/:orderId
// Estimate delivery date for an order
// ══════════════════════════════════════════════════════════════════════════════
exports.estimateDelivery = async (req, res) => {
  try {
    const order = await Order.findOne(buildIdQuery(req.params.orderId))
      .select('OrderID CustomerName OrderDate OrderStatus ShippingCost City State Country');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['Delivered', 'Cancelled', 'Returned', 'Refunded'].includes(order.OrderStatus)) {
      return res.status(200).json({
        success: true,
        message: `Order is already ${order.OrderStatus}. No delivery estimate needed.`,
        data: {
          orderId:      order.OrderID,
          orderStatus:  order.OrderStatus,
          estimate:     null
        }
      });
    }

    const standardDate = estimateDeliveryDate(order.OrderDate, 5);
    const expressDate  = estimateDeliveryDate(order.OrderDate, 2);
    const overnightDate = estimateDeliveryDate(order.OrderDate, 1);

    res.status(200).json({
      success: true,
      message: 'Delivery estimate calculated successfully',
      data: {
        orderId:      order.OrderID,
        customerName: order.CustomerName,
        orderDate:    order.OrderDate,
        orderStatus:  order.OrderStatus,
        destination: {
          city:    order.City    || 'N/A',
          state:   order.State   || 'N/A',
          country: order.Country || 'N/A'
        },
        estimates: {
          standard:  { label: 'Standard (5 business days)', estimatedDate: standardDate.toISOString().split('T')[0],  cost: order.ShippingCost || '5.99'  },
          express:   { label: 'Express (2 business days)',  estimatedDate: expressDate.toISOString().split('T')[0],   cost: '12.99' },
          overnight: { label: 'Overnight (1 business day)', estimatedDate: overnightDate.toISOString().split('T')[0], cost: '24.99' }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/shipping/carriers
// Fetch all supported shipping carriers
// ══════════════════════════════════════════════════════════════════════════════
exports.getCarriers = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Shipping carriers fetched successfully',
      count: CARRIERS.length,
      data: CARRIERS
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/shipping/change-address/:orderId
// Change the shipping address of an order (only if not yet shipped)
// Body: { city, state, country }
// ══════════════════════════════════════════════════════════════════════════════
exports.changeShippingAddress = async (req, res) => {
  try {
    const order = await Order.findOne(buildIdQuery(req.params.orderId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Block address changes for orders already shipped or beyond
    const blockedStatuses = ['Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Returned', 'Refunded', 'Cancelled'];
    if (blockedStatuses.includes(order.OrderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change address. Order is already "${order.OrderStatus}". Address changes are only allowed for Pending or Processing orders.`
      });
    }

    const { city, state, country } = req.body;

    if (!city && !state && !country) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one of: city, state, country'
      });
    }

    const previousAddress = {
      city:    order.City    || 'N/A',
      state:   order.State   || 'N/A',
      country: order.Country || 'N/A'
    };

    const updateFields = {};
    if (city)    updateFields.City    = city;
    if (state)   updateFields.State   = state;
    if (country) updateFields.Country = country;

    const updated = await Order.findOneAndUpdate(
      buildIdQuery(req.params.orderId),
      updateFields,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Shipping address updated successfully',
      data: {
        orderId:         updated.OrderID,
        customerName:    updated.CustomerName,
        previousAddress,
        newAddress: {
          city:    updated.City    || 'N/A',
          state:   updated.State   || 'N/A',
          country: updated.Country || 'N/A'
        },
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/shipping/reschedule/:orderId
// Reschedule delivery for an order
// Body: { preferredDate, timeSlot (optional), reason (optional) }
// ══════════════════════════════════════════════════════════════════════════════
exports.rescheduleDelivery = async (req, res) => {
  try {
    const order = await Order.findOne(buildIdQuery(req.params.orderId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only allow reschedule for active (non-terminal) shipments
    const terminalStatuses = ['Delivered', 'Cancelled', 'Returned', 'Refunded'];
    if (terminalStatuses.includes(order.OrderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule. Order is already "${order.OrderStatus}".`
      });
    }

    const { preferredDate, timeSlot = 'Morning (9AM - 12PM)', reason = 'Customer request' } = req.body;

    if (!preferredDate) {
      return res.status(400).json({
        success: false,
        message: 'preferredDate is required (format: YYYY-MM-DD)'
      });
    }

    const requestedDate = new Date(preferredDate);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferredDate format. Use YYYY-MM-DD'
      });
    }

    if (requestedDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'preferredDate must be a future date'
      });
    }

    const validSlots = [
      'Morning (9AM - 12PM)',
      'Afternoon (12PM - 5PM)',
      'Evening (5PM - 9PM)'
    ];

    const rescheduleRecord = {
      rescheduleId:    `RSC-${order.OrderID}-${Date.now().toString(36).toUpperCase()}`,
      orderId:         order.OrderID,
      customerName:    order.CustomerName,
      orderStatus:     order.OrderStatus,
      originalDate:    estimateDeliveryDate(order.OrderDate, 5).toISOString().split('T')[0],
      rescheduledDate: requestedDate.toISOString().split('T')[0],
      timeSlot:        validSlots.includes(timeSlot) ? timeSlot : validSlots[0],
      reason,
      availableSlots:  validSlots,
      confirmedAt:     new Date().toISOString(),
      note:            'Reschedule request received. Carrier will be notified within 2 hours.'
    };

    res.status(200).json({
      success: true,
      message: 'Delivery rescheduled successfully',
      data: rescheduleRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
