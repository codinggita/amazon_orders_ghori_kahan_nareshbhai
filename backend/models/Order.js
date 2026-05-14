const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Archived'],
    default: 'Pending'
  },
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    comment: String
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to track status history before saving
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
