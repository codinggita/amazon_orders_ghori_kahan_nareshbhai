const Order = require('../models/Order');

// Helpers: convert fields stored as strings in DB
const toDoubleAmount = { $toDouble: { $ifNull: ['$TotalAmount', '0'] } };
const toDoublePrice = { $toDouble: { $ifNull: ['$UnitPrice', '0'] } };
const toIntQty = { $toInt: { $ifNull: ['$Quantity', '1'] } };
const parsedDateField = {
  $dateFromString: {
    dateString: '$OrderDate',
    onError: null,
    onNull: null
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/dashboard/overview
// General high-level summary of the store metrics
// ══════════════════════════════════════════════════════════════════════════════
exports.getOverview = async (req, res) => {
  try {
    const [stats, recentOrders, statusCounts] = await Promise.all([
      // 1. Overall aggregation stats
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: toDoubleAmount },
            avgOrderValue: { $avg: toDoubleAmount }
          }
        },
        {
          $project: {
            _id: 0,
            totalOrders: 1,
            totalRevenue: { $round: ['$totalRevenue', 2] },
            avgOrderValue: { $round: ['$avgOrderValue', 2] }
          }
        }
      ]),
      // 2. Recent orders
      Order.find({}).sort({ OrderDate: -1, createdAt: -1 }).limit(5),
      // 3. Status breakdown
      Order.aggregate([
        {
          $group: {
            _id: '$OrderStatus',
            count: { $sum: 1 }
          }
        },
        { $project: { _id: 0, status: '$_id', count: 1 } }
      ])
    ]);

    const overviewStats = stats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };

    res.status(200).json({
      success: true,
      message: 'Dashboard overview fetched successfully',
      data: {
        metrics: overviewStats,
        statusDistribution: statusCounts,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/dashboard/revenue
// Revenue metrics: monthly trend, category splits, and payment method splits
// ══════════════════════════════════════════════════════════════════════════════
exports.getRevenueDashboard = async (req, res) => {
  try {
    const [monthlyRevenue, categoryRevenue, paymentRevenue] = await Promise.all([
      // 1. Monthly revenue trend
      Order.aggregate([
        { $addFields: { parsedDate: parsedDateField } },
        { $match: { parsedDate: { $ne: null } } },
        {
          $group: {
            _id: {
              year: { $year: '$parsedDate' },
              month: { $month: '$parsedDate' }
            },
            revenue: { $sum: toDoubleAmount },
            ordersCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            monthLabel: {
              $arrayElemAt: [
                ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                '$_id.month'
              ]
            },
            revenue: { $round: ['$revenue', 2] },
            ordersCount: 1
          }
        },
        { $sort: { year: 1, month: 1 } }
      ]),
      // 2. Revenue by category
      Order.aggregate([
        { $match: { Category: { $exists: true, $ne: null, $ne: '' } } },
        {
          $group: {
            _id: '$Category',
            revenue: { $sum: toDoubleAmount },
            ordersCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            revenue: { $round: ['$revenue', 2] },
            ordersCount: 1
          }
        },
        { $sort: { revenue: -1 } }
      ]),
      // 3. Revenue by payment method
      Order.aggregate([
        { $match: { PaymentMethod: { $exists: true, $ne: null, $ne: '' } } },
        {
          $group: {
            _id: '$PaymentMethod',
            revenue: { $sum: toDoubleAmount },
            ordersCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            paymentMethod: '$_id',
            revenue: { $round: ['$revenue', 2] },
            ordersCount: 1
          }
        },
        { $sort: { revenue: -1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      message: 'Revenue dashboard fetched successfully',
      data: {
        monthlyTrend: monthlyRevenue,
        categorySplit: categoryRevenue,
        paymentSplit: paymentRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/dashboard/orders
// Order metrics: statuses, volume trend, and recent listings
// ══════════════════════════════════════════════════════════════════════════════
exports.getOrdersDashboard = async (req, res) => {
  try {
    const [statusDistribution, monthlyVolume, recentOrders] = await Promise.all([
      // 1. Status Distribution
      Order.aggregate([
        {
          $group: {
            _id: '$OrderStatus',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            status: '$_id',
            count: 1
          }
        },
        { $sort: { count: -1 } }
      ]),
      // 2. Monthly orders volume trend
      Order.aggregate([
        { $addFields: { parsedDate: parsedDateField } },
        { $match: { parsedDate: { $ne: null } } },
        {
          $group: {
            _id: {
              year: { $year: '$parsedDate' },
              month: { $month: '$parsedDate' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            monthLabel: {
              $arrayElemAt: [
                ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                '$_id.month'
              ]
            },
            count: 1
          }
        },
        { $sort: { year: 1, month: 1 } }
      ]),
      // 3. Recent 15 orders
      Order.find({}).sort({ OrderDate: -1, createdAt: -1 }).limit(15)
    ]);

    res.status(200).json({
      success: true,
      message: 'Orders dashboard fetched successfully',
      data: {
        statusDistribution,
        monthlyTrend: monthlyVolume,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/dashboard/customers
// Customer metrics: top spenders, customer counts, and geo-distributions
// ══════════════════════════════════════════════════════════════════════════════
exports.getCustomersDashboard = async (req, res) => {
  try {
    const [topCustomers, stateDistribution, cityDistribution] = await Promise.all([
      // 1. Top customers by spend
      Order.aggregate([
        { $match: { CustomerID: { $exists: true, $ne: null, $ne: '' } } },
        {
          $group: {
            _id: '$CustomerID',
            customerName: { $first: '$CustomerName' },
            totalOrders: { $sum: 1 },
            totalSpend: { $sum: toDoubleAmount }
          }
        },
        {
          $project: {
            _id: 0,
            customerId: '$_id',
            customerName: 1,
            totalOrders: 1,
            totalSpend: { $round: ['$totalSpend', 2] }
          }
        },
        { $sort: { totalSpend: -1 } },
        { $limit: 10 }
      ]),
      // 2. States breakdown
      Order.aggregate([
        { $match: { State: { $exists: true, $ne: null, $ne: '' } } },
        {
          $group: {
            _id: '$State',
            ordersCount: { $sum: 1 },
            revenue: { $sum: toDoubleAmount }
          }
        },
        {
          $project: {
            _id: 0,
            state: '$_id',
            ordersCount: 1,
            revenue: { $round: ['$revenue', 2] }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]),
      // 3. Cities breakdown
      Order.aggregate([
        { $match: { City: { $exists: true, $ne: null, $ne: '' } } },
        {
          $group: {
            _id: '$City',
            ordersCount: { $sum: 1 },
            revenue: { $sum: toDoubleAmount }
          }
        },
        {
          $project: {
            _id: 0,
            city: '$_id',
            ordersCount: 1,
            revenue: { $round: ['$revenue', 2] }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Distinct customer count
    const totalCustomersResult = await Order.aggregate([
      { $match: { CustomerID: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$CustomerID' } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);
    const totalCustomers = totalCustomersResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      message: 'Customers dashboard fetched successfully',
      data: {
        totalCustomers,
        topSpenders: topCustomers,
        geographicStateSplit: stateDistribution,
        geographicCitySplit: cityDistribution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/dashboard/products
// Product metrics: top products, categories, and brands
// ══════════════════════════════════════════════════════════════════════════════
exports.getProductsDashboard = async (req, res) => {
  try {
    const [topProducts, categoryBreakdown, brandBreakdown] = await Promise.all([
      // 1. Top products by quantity/revenue
      Order.aggregate([
        {
          $group: {
            _id: '$ProductName',
            productName: { $first: '$ProductName' },
            category: { $first: '$Category' },
            brand: { $first: '$Brand' },
            quantitySold: { $sum: toIntQty },
            revenue: { $sum: toDoubleAmount }
          }
        },
        {
          $project: {
            _id: 0,
            productName: 1,
            category: 1,
            brand: 1,
            quantitySold: 1,
            revenue: { $round: ['$revenue', 2] }
          }
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 10 }
      ]),
      // 2. Categories breakdown
      Order.aggregate([
        { $match: { Category: { $exists: true, $ne: null, $ne: '' } } },
        {
          $group: {
            _id: '$Category',
            totalRevenue: { $sum: toDoubleAmount },
            totalQtySold: { $sum: toIntQty }
          }
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            totalRevenue: { $round: ['$totalRevenue', 2] },
            totalQtySold: 1
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]),
      // 3. Brands breakdown
      Order.aggregate([
        { $match: { Brand: { $exists: true, $ne: null, $ne: '' } } },
        {
          $group: {
            _id: '$Brand',
            totalRevenue: { $sum: toDoubleAmount },
            totalQtySold: { $sum: toIntQty }
          }
        },
        {
          $project: {
            _id: 0,
            brand: '$_id',
            totalRevenue: { $round: ['$totalRevenue', 2] },
            totalQtySold: 1
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Distinct products count
    const totalProductsResult = await Order.aggregate([
      { $match: { ProductName: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$ProductName' } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);
    const totalProducts = totalProductsResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      message: 'Products dashboard fetched successfully',
      data: {
        totalProducts,
        topSellingProducts: topProducts,
        categoryBreakdown,
        brandBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
