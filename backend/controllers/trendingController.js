const Order = require('../models/Order');

// ─── Helper: safely convert TotalAmount (stored as String) to Number ──────────
const toDoubleExpr = { $toDouble: { $ifNull: ['$TotalAmount', '0'] } };

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/trending/products
// Fetch trending products based on total sales volume and revenue
// ══════════════════════════════════════════════════════════════════════════════
exports.getTrendingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const trending = await Order.aggregate([
      {
        $group: {
          _id: '$ProductName',
          productName: { $first: '$ProductName' },
          category: { $first: '$Category' },
          brand: { $first: '$Brand' },
          salesCount: { $sum: 1 },
          totalRevenue: { $sum: toDoubleExpr },
          averagePrice: { $avg: { $toDouble: { $ifNull: ['$UnitPrice', '0'] } } }
        }
      },
      {
        $project: {
          _id: 0,
          productName: 1,
          category: 1,
          brand: 1,
          salesCount: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          averagePrice: { $round: ['$averagePrice', 2] }
        }
      },
      { $sort: { salesCount: -1, totalRevenue: -1 } },
      { $limit: limit }
    ]);

    res.status(200).json({
      success: true,
      message: 'Trending products fetched successfully',
      count: trending.length,
      data: trending
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/trending/categories
// Fetch trending product categories
// ══════════════════════════════════════════════════════════════════════════════
exports.getTrendingCategories = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const trending = await Order.aggregate([
      {
        $match: {
          Category: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$Category',
          category: { $first: '$Category' },
          ordersCount: { $sum: 1 },
          totalRevenue: { $sum: toDoubleExpr },
          distinctProducts: { $addToSet: '$ProductName' }
        }
      },
      {
        $project: {
          _id: 0,
          category: 1,
          ordersCount: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          uniqueProductsCount: { $size: '$distinctProducts' }
        }
      },
      { $sort: { ordersCount: -1, totalRevenue: -1 } },
      { $limit: limit }
    ]);

    res.status(200).json({
      success: true,
      message: 'Trending categories fetched successfully',
      count: trending.length,
      data: trending
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
