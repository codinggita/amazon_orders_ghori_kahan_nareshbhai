const Order = require('../models/Order');
const SearchQuery = require('../models/SearchQuery');

// Helper to track search queries
const trackSearch = async (query) => {
  if (!query) return;
  const q = query.toLowerCase().trim();
  try {
    await SearchQuery.findOneAndUpdate(
      { query: q },
      { $inc: { count: 1 }, lastSearchedAt: Date.now() },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Error tracking search', err);
  }
};

// GET /api/v1/orders/search?q=laptop
exports.searchAll = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const regex = new RegExp(q, 'i');
    const orders = await Order.find({
      $or: [
        { OrderID: regex },
        { CustomerName: regex },
        { ProductName: regex },
        { Category: regex },
        { Brand: regex }
      ]
    }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/customer?q=john
exports.searchByCustomer = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const orders = await Order.find({ CustomerName: new RegExp(q, 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/product?q=iphone
exports.searchByProduct = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const orders = await Order.find({ ProductName: new RegExp(q, 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/category?q=electronics
exports.searchByCategory = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const orders = await Order.find({ Category: new RegExp(q, 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/brand?q=samsung
exports.searchByBrand = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const orders = await Order.find({ Brand: new RegExp(q, 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/status?q=delivered
exports.searchByStatus = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const orders = await Order.find({ OrderStatus: new RegExp(q, 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/payment?q=upi
exports.searchByPayment = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const orders = await Order.find({ PaymentMethod: new RegExp(q, 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/location?q=delhi
exports.searchByLocation = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const regex = new RegExp(q, 'i');
    const orders = await Order.find({
      $or: [
        { City: regex },
        { State: regex },
        { Country: regex }
      ]
    }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/date?q=2025-01
exports.searchByDate = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const orders = await Order.find({ OrderDate: new RegExp(q, 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/tracking?q=TRK123
exports.searchByTracking = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const orders = await Order.find({ OrderID: new RegExp(q, 'i') }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/fuzzy?q=headfone
exports.searchFuzzy = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const fuzzyRegexString = q.split('').join('.*?');
    const fuzzyRegex = new RegExp(fuzzyRegexString, 'i');
    
    const orders = await Order.find({
      $or: [
        { ProductName: fuzzyRegex },
        { CustomerName: fuzzyRegex },
        { Category: fuzzyRegex }
      ]
    }).limit(50);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/autocomplete?q=iph
exports.searchAutocomplete = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) return res.status(200).json({ success: true, data: [] });
    const regex = new RegExp(`^${q}`, 'i');
    const products = await Order.distinct('ProductName', { ProductName: regex });
    const customers = await Order.distinct('CustomerName', { CustomerName: regex });
    
    const suggestions = [...products, ...customers].slice(0, 10);
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/highlight?q=mouse
exports.searchHighlight = async (req, res) => {
  try {
    const q = req.query.q || '';
    await trackSearch(q);
    const regex = new RegExp(`(${q})`, 'gi');
    
    const orders = await Order.find({ ProductName: regex }).limit(50);
    
    const highlightedOrders = orders.map(order => {
      const obj = order.toObject();
      if (obj.ProductName && q) {
        obj.ProductName = obj.ProductName.replace(regex, '<mark>$1</mark>');
      }
      return obj;
    });
    
    res.status(200).json({ success: true, data: highlightedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/recent
exports.getRecentSearches = async (req, res) => {
  try {
    const recent = await SearchQuery.find().sort({ lastSearchedAt: -1 }).limit(10);
    res.status(200).json({ success: true, data: recent.map(r => r.query) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/orders/search/popular
exports.getPopularSearches = async (req, res) => {
  try {
    const popular = await SearchQuery.find().sort({ count: -1 }).limit(10);
    res.status(200).json({ success: true, data: popular.map(r => r.query) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
