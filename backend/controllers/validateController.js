const Order = require('../models/Order');
const User = require('../models/User');

// Helper to check if string is a valid email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper: build query matching custom OrderID or MongoDB _id
const buildIdQuery = (orderIdParam) => {
  const query = { $or: [{ OrderID: orderIdParam }] };
  if (orderIdParam.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: orderIdParam });
  }
  return query;
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/validate/order
// Validate order payload
// ══════════════════════════════════════════════════════════════════════════════
exports.validateOrder = async (req, res) => {
  try {
    const { OrderID, CustomerName, ProductName, TotalAmount, Quantity, UnitPrice } = req.body;
    const errors = {};

    if (!OrderID) {
      errors.OrderID = 'OrderID is required';
    } else if (typeof OrderID !== 'string' || OrderID.trim() === '') {
      errors.OrderID = 'OrderID must be a non-empty string';
    }

    if (!CustomerName) {
      errors.CustomerName = 'CustomerName is required';
    } else if (typeof CustomerName !== 'string' || CustomerName.trim().length < 3) {
      errors.CustomerName = 'CustomerName must be at least 3 characters long';
    }

    if (!ProductName) {
      errors.ProductName = 'ProductName is required';
    } else if (typeof ProductName !== 'string' || ProductName.trim() === '') {
      errors.ProductName = 'ProductName must be a non-empty string';
    }

    if (TotalAmount === undefined || TotalAmount === null) {
      errors.TotalAmount = 'TotalAmount is required';
    } else {
      const amt = parseFloat(TotalAmount);
      if (isNaN(amt) || amt < 0) {
        errors.TotalAmount = 'TotalAmount must be a non-negative number';
      }
    }

    if (Quantity !== undefined && Quantity !== null) {
      const qty = parseInt(Quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        errors.Quantity = 'Quantity must be a positive integer';
      }
    }

    if (UnitPrice !== undefined && UnitPrice !== null) {
      const price = parseFloat(UnitPrice);
      if (isNaN(price) || price < 0) {
        errors.UnitPrice = 'UnitPrice must be a non-negative number';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Order payload validation failed',
        errors
      });
    }

    // Check if OrderID already exists in DB
    const existingOrder = await Order.findOne({ OrderID });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: 'Order payload validation failed',
        errors: { OrderID: 'OrderID already exists in database' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order payload is valid',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/validate/order/:id
// Validate order update
// ══════════════════════════════════════════════════════════════════════════════
exports.validateOrderUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = {};

    // 1. Check if Order exists
    const order = await Order.findOne(buildIdQuery(id));
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Validation failed: Order not found'
      });
    }

    const { OrderStatus, Quantity, TotalAmount, CustomerName } = req.body;

    if (OrderStatus !== undefined) {
      const validStatuses = [
        'Pending', 'Processing', 'Shipped', 'In Transit',
        'Out for Delivery', 'Delivered', 'Returned', 'Refunded', 'Cancelled'
      ];
      const normalized = validStatuses.find(s => s.toLowerCase() === OrderStatus.toLowerCase());
      if (!normalized) {
        errors.OrderStatus = `Invalid OrderStatus. Must be one of: ${validStatuses.join(', ')}`;
      }
    }

    if (Quantity !== undefined) {
      const qty = parseInt(Quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        errors.Quantity = 'Quantity must be a positive integer';
      }
    }

    if (TotalAmount !== undefined) {
      const amt = parseFloat(TotalAmount);
      if (isNaN(amt) || amt < 0) {
        errors.TotalAmount = 'TotalAmount must be a non-negative number';
      }
    }

    if (CustomerName !== undefined) {
      if (typeof CustomerName !== 'string' || CustomerName.trim().length < 3) {
        errors.CustomerName = 'CustomerName must be at least 3 characters long';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Order update validation failed',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order update payload is valid',
      data: {
        orderId: order.OrderID,
        currentDetails: {
          OrderStatus: order.OrderStatus,
          Quantity: order.Quantity,
          TotalAmount: order.TotalAmount,
          CustomerName: order.CustomerName
        },
        updateProposed: req.body
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/validate/payment
// Validate payment details
// ══════════════════════════════════════════════════════════════════════════════
exports.validatePayment = (req, res) => {
  try {
    const { cardNumber, expiryDate, cvv, amount, paymentMethod } = req.body;
    const errors = {};

    const allowedMethods = ['Credit Card', 'Debit Card', 'PayPal', 'UPI', 'Gift Card'];
    if (!paymentMethod) {
      errors.paymentMethod = 'paymentMethod is required';
    } else if (!allowedMethods.some(m => m.toLowerCase() === paymentMethod.toLowerCase())) {
      errors.paymentMethod = `Invalid paymentMethod. Allowed: ${allowedMethods.join(', ')}`;
    }

    if (amount === undefined || amount === null) {
      errors.amount = 'amount is required';
    } else {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        errors.amount = 'amount must be a positive number';
      }
    }

    // Card details validation if payment method is card
    if (paymentMethod && ['credit card', 'debit card'].includes(paymentMethod.toLowerCase())) {
      if (!cardNumber) {
        errors.cardNumber = 'cardNumber is required for card payments';
      } else if (!/^\d{16}$/.test(cardNumber.replace(/\s+/g, ''))) {
        errors.cardNumber = 'cardNumber must be a 16-digit numeric string';
      }

      if (!expiryDate) {
        errors.expiryDate = 'expiryDate is required for card payments';
      } else {
        const parts = expiryDate.split('/');
        if (parts.length !== 2 || !/^\d{2}$/.test(parts[0]) || !/^\d{2}$/.test(parts[1])) {
          errors.expiryDate = 'expiryDate must be in MM/YY format';
        } else {
          const month = parseInt(parts[0], 10);
          const year = parseInt('20' + parts[1], 10);
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();

          if (month < 1 || month > 12) {
            errors.expiryDate = 'Invalid month in expiryDate';
          } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
            errors.expiryDate = 'Card has expired';
          }
        }
      }

      if (!cvv) {
        errors.cvv = 'cvv is required for card payments';
      } else if (!/^\d{3,4}$/.test(cvv)) {
        errors.cvv = 'cvv must be a 3 or 4-digit numeric string';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment details validation failed',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment details are valid',
      data: {
        paymentMethod,
        amount,
        lastFourDigits: cardNumber ? cardNumber.replace(/\s+/g, '').slice(-4) : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/validate/address
// Validate shipping address
// ══════════════════════════════════════════════════════════════════════════════
exports.validateAddress = (req, res) => {
  try {
    const { fullName, addressLine1, city, state, postalCode, country } = req.body;
    const errors = {};

    if (!fullName || fullName.trim().length < 2) {
      errors.fullName = 'fullName is required and must be at least 2 characters';
    }
    if (!addressLine1 || addressLine1.trim().length < 5) {
      errors.addressLine1 = 'addressLine1 is required and must be at least 5 characters';
    }
    if (!city || city.trim().length < 2) {
      errors.city = 'city is required';
    }
    if (!state || state.trim().length < 2) {
      errors.state = 'state is required';
    }
    if (!postalCode) {
      errors.postalCode = 'postalCode is required';
    } else if (!/^[a-zA-Z0-9\s-]{3,10}$/.test(postalCode.trim())) {
      errors.postalCode = 'postalCode format is invalid';
    }
    if (!country || country.trim().length < 2) {
      errors.country = 'country is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Address validation failed',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: 'Address is valid',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/validate/auth/register
// Validate registration data
// ══════════════════════════════════════════════════════════════════════════════
exports.validateRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    const errors = {};

    if (!name || name.trim().length < 3) {
      errors.name = 'name is required and must be at least 3 characters';
    }

    if (!email) {
      errors.email = 'email is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password) {
      errors.password = 'password is required';
    } else if (password.length < 6) {
      errors.password = 'password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'confirmPassword is required';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Registration validation failed',
        errors
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Registration validation failed',
        errors: { email: 'Email is already registered' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Registration data is valid',
      data: { name, email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/validate/auth/login
// Validate login credentials
// ══════════════════════════════════════════════════════════════════════════════
exports.validateLogin = (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = {};

    if (!email) {
      errors.email = 'email is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password) {
      errors.password = 'password is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Login credentials validation failed',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login credentials payload is valid',
      data: { email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/validate/product
// Validate product payload
// ══════════════════════════════════════════════════════════════════════════════
exports.validateProduct = (req, res) => {
  try {
    const { productName, category, price, stock, sku } = req.body;
    const errors = {};

    if (!productName || productName.trim().length < 3) {
      errors.productName = 'productName is required and must be at least 3 characters';
    }

    if (!category || category.trim() === '') {
      errors.category = 'category is required';
    }

    if (price === undefined || price === null) {
      errors.price = 'price is required';
    } else {
      const prc = parseFloat(price);
      if (isNaN(prc) || prc <= 0) {
        errors.price = 'price must be a positive number';
      }
    }

    if (stock === undefined || stock === null) {
      errors.stock = 'stock is required';
    } else {
      const stk = parseInt(stock, 10);
      if (isNaN(stk) || stk < 0) {
        errors.stock = 'stock must be a non-negative integer';
      }
    }

    if (!sku) {
      errors.sku = 'sku is required';
    } else if (!/^[A-Z0-9-]{5,15}$/.test(sku)) {
      errors.sku = 'sku must be 5-15 characters, alphanumeric with hyphens only (e.g. PROD-123)';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Product payload validation failed',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product payload is valid',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/validate/refund
// Validate refund request
// ══════════════════════════════════════════════════════════════════════════════
exports.validateRefund = async (req, res) => {
  try {
    const { orderId, reason, amount, refundType } = req.body;
    const errors = {};

    if (!orderId) {
      errors.orderId = 'orderId is required';
    }

    if (!reason || reason.trim().length < 10) {
      errors.reason = 'reason is required and must be at least 10 characters';
    }

    if (!refundType) {
      errors.refundType = 'refundType is required';
    } else if (!['full', 'partial'].includes(refundType.toLowerCase())) {
      errors.refundType = 'refundType must be either "full" or "partial"';
    }

    if (amount === undefined || amount === null) {
      errors.amount = 'amount is required';
    } else {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        errors.amount = 'amount must be a positive number';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Refund validation failed',
        errors
      });
    }

    // Validate if Order exists in database
    const order = await Order.findOne(buildIdQuery(orderId));
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Validation failed: Order not found'
      });
    }

    // Compare refund amount with Order TotalAmount
    const orderTotal = parseFloat(order.TotalAmount);
    const refundAmt = parseFloat(amount);

    if (refundType.toLowerCase() === 'full' && refundAmt !== orderTotal) {
      errors.amount = `For a full refund, the amount must match the order total (${orderTotal})`;
    } else if (refundAmt > orderTotal) {
      errors.amount = `Refund amount (${refundAmt}) cannot exceed the order total amount (${orderTotal})`;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Refund validation failed',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: 'Refund request is valid',
      data: {
        orderId: order.OrderID,
        orderTotalAmount: order.TotalAmount,
        refundType,
        refundAmount: amount,
        reason
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/validate/coupon
// Validate coupon code
// ══════════════════════════════════════════════════════════════════════════════
exports.validateCoupon = (req, res) => {
  try {
    const { couponCode, orderAmount } = req.body;
    const errors = {};

    if (!couponCode) {
      errors.couponCode = 'couponCode is required';
    } else if (!/^[A-Z0-9]{4,10}$/.test(couponCode)) {
      errors.couponCode = 'couponCode must be 4-10 characters, uppercase alphanumeric only';
    }

    if (orderAmount === undefined || orderAmount === null) {
      errors.orderAmount = 'orderAmount is required';
    } else {
      const amt = parseFloat(orderAmount);
      if (isNaN(amt) || amt <= 0) {
        errors.orderAmount = 'orderAmount must be a positive number';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Coupon validation failed',
        errors
      });
    }

    // Mock active coupon database
    const MOCK_COUPONS = {
      'SAVE10':    { type: 'percentage', value: 10, minPurchase: 50 },
      'AMAZON50':  { type: 'percentage', value: 50, minPurchase: 200 },
      'WELCOME20': { type: 'fixed',      value: 20, minPurchase: 100 },
      'FREESHIP':  { type: 'fixed',      value: 5,  minPurchase: 30 }
    };

    const coupon = MOCK_COUPONS[couponCode.toUpperCase()];
    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon validation failed',
        errors: { couponCode: 'Invalid or expired coupon code' }
      });
    }

    const oAmt = parseFloat(orderAmount);
    if (oAmt < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: 'Coupon validation failed',
        errors: { couponCode: `Coupon requires a minimum purchase of $${coupon.minPurchase}. Current: $${oAmt}` }
      });
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = parseFloat(((oAmt * coupon.value) / 100).toFixed(2));
    } else {
      discount = Math.min(coupon.value, oAmt); // fixed amount, cannot exceed order amount
    }

    res.status(200).json({
      success: true,
      message: 'Coupon is valid and has been applied',
      data: {
        couponCode: couponCode.toUpperCase(),
        originalAmount: oAmt,
        discountAmount: discount,
        finalAmount: parseFloat((oAmt - discount).toFixed(2)),
        discountDetails: coupon.type === 'percentage' ? `${coupon.value}% off` : `$${coupon.value} off`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/validate/upload
// Validate uploaded file
// ══════════════════════════════════════════════════════════════════════════════
exports.validateUpload = (req, res) => {
  try {
    const { fileName, fileSize, mimeType } = req.body;
    const errors = {};

    if (!fileName || fileName.trim() === '') {
      errors.fileName = 'fileName is required';
    }

    if (fileSize === undefined || fileSize === null) {
      errors.fileSize = 'fileSize is required';
    } else {
      const size = parseInt(fileSize, 10);
      if (isNaN(size) || size < 0) {
        errors.fileSize = 'fileSize must be a non-negative integer (bytes)';
      } else {
        const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
        if (size > MAX_SIZE) {
          errors.fileSize = 'fileSize exceeds the maximum allowed limit of 5 MB (5,242,880 bytes)';
        }
      }
    }

    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json'
    ];

    if (!mimeType) {
      errors.mimeType = 'mimeType is required';
    } else if (!ALLOWED_MIME_TYPES.includes(mimeType.trim().toLowerCase())) {
      errors.mimeType = `Unsupported file type "${mimeType}". Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`;
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'File upload validation failed',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: 'File is valid for upload',
      data: {
        fileName,
        fileSizeInBytes: fileSize,
        fileSizeInMB: parseFloat((fileSize / (1024 * 1024)).toFixed(2)),
        mimeType
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
