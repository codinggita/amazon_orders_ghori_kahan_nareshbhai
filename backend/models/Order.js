const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  OrderID: {
    type: String,
    required: true,
    unique: true
  },
  OrderDate: String,
  CustomerID: String,
  CustomerName: {
    type: String,
    required: true
  },
  ProductID: String,
  ProductName: {
    type: String,
    required: true
  },
  Category: String,
  Brand: String,
  Quantity: String,
  UnitPrice: String,
  Discount: String,
  Tax: String,
  ShippingCost: String,
  TotalAmount: {
    type: String,
    required: true
  },
  PaymentMethod: String,
  OrderStatus: {
    type: String,
    default: 'Pending'
  },
  City: String,
  State: String,
  Country: String,
  SellerID: String,
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'uerdata',
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Order', orderSchema);
