const Order = require('../models/Order');

// ─── Helper: safely convert TotalAmount (stored as String) to Number ──────────
const toDoubleExpr = { $toDouble: { $ifNull: ['$TotalAmount', '0'] } };

// ─── Helper: parse OrderDate string into a Date object ────────────────────────
const parsedDateField = {
  $dateFromString: {
    dateString: '$OrderDate',
    onError: null,
    onNull: null
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ORDERS STATISTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/stats/orders/total
// Total number of orders in the database
exports.getTotalOrdersCount = async (req, res) => {
  try {
    const total = await Order.countDocuments({});

    res.status(200).json({
      success: true,
      message: 'Total orders count fetched successfully',
      data: { totalOrders: total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/stats/orders/daily
// Daily order statistics (count + revenue per day)
exports.getDailyOrderStats = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: {
          parsedDate: parsedDateField
        }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$parsedDate' },
            month: { $month: '$parsedDate' },
            day:   { $dayOfMonth: '$parsedDate' }
          },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: toDoubleExpr },
          avgOrderValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year:  '$_id.year',
                  month: '$_id.month',
                  day:   '$_id.day'
                }
              }
            }
          },
          year:  '$_id.year',
          month: '$_id.month',
          day:   '$_id.day',
          orderCount: 1,
          totalRevenue:  { $round: ['$totalRevenue',  2] },
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Daily order statistics fetched successfully',
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/stats/orders/monthly
// Monthly order statistics (count + revenue per month)
exports.getMonthlyOrderStats = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: { parsedDate: parsedDateField }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$parsedDate' },
            month: { $month: '$parsedDate' }
          },
          orderCount:    { $sum: 1 },
          totalRevenue:  { $sum: toDoubleExpr },
          avgOrderValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          year:  '$_id.year',
          month: '$_id.month',
          monthLabel: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.month'
            ]
          },
          orderCount: 1,
          totalRevenue:  { $round: ['$totalRevenue',  2] },
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Monthly order statistics fetched successfully',
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/stats/orders/yearly
// Yearly order statistics (count + revenue per year)
exports.getYearlyOrderStats = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: { parsedDate: parsedDateField }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: { year: { $year: '$parsedDate' } },
          orderCount:    { $sum: 1 },
          totalRevenue:  { $sum: toDoubleExpr },
          avgOrderValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          year:  '$_id.year',
          orderCount: 1,
          totalRevenue:  { $round: ['$totalRevenue',  2] },
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { year: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Yearly order statistics fetched successfully',
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// REVENUE STATISTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/stats/revenue/total
// Total revenue across all orders
exports.getTotalRevenueStats = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue:  { $sum: toDoubleExpr },
          totalOrders:   { $sum: 1 },
          avgOrderValue: { $avg: toDoubleExpr },
          minOrderValue: { $min: toDoubleExpr },
          maxOrderValue: { $max: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          totalRevenue:  { $round: ['$totalRevenue',  2] },
          totalOrders:   1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] },
          minOrderValue: { $round: ['$minOrderValue', 2] },
          maxOrderValue: { $round: ['$maxOrderValue', 2] }
        }
      }
    ]);

    const data = result[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      minOrderValue: 0,
      maxOrderValue: 0
    };

    res.status(200).json({
      success: true,
      message: 'Total revenue statistics fetched successfully',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/stats/revenue/daily
// Daily revenue statistics
exports.getDailyRevenueStats = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: { parsedDate: parsedDateField }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$parsedDate' },
            month: { $month: '$parsedDate' },
            day:   { $dayOfMonth: '$parsedDate' }
          },
          totalRevenue:  { $sum: toDoubleExpr },
          orderCount:    { $sum: 1 },
          avgOrderValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year:  '$_id.year',
                  month: '$_id.month',
                  day:   '$_id.day'
                }
              }
            }
          },
          year:  '$_id.year',
          month: '$_id.month',
          day:   '$_id.day',
          totalRevenue:  { $round: ['$totalRevenue',  2] },
          orderCount: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Daily revenue statistics fetched successfully',
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/stats/revenue/monthly
// Monthly revenue statistics
exports.getMonthlyRevenueStats = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: { parsedDate: parsedDateField }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$parsedDate' },
            month: { $month: '$parsedDate' }
          },
          totalRevenue:  { $sum: toDoubleExpr },
          orderCount:    { $sum: 1 },
          avgOrderValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          year:  '$_id.year',
          month: '$_id.month',
          monthLabel: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.month'
            ]
          },
          totalRevenue:  { $round: ['$totalRevenue',  2] },
          orderCount: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Monthly revenue statistics fetched successfully',
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/stats/revenue/yearly
// Yearly revenue statistics
exports.getYearlyRevenueStats = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: { parsedDate: parsedDateField }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: { year: { $year: '$parsedDate' } },
          totalRevenue:  { $sum: toDoubleExpr },
          orderCount:    { $sum: 1 },
          avgOrderValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          totalRevenue:  { $round: ['$totalRevenue',  2] },
          orderCount: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { year: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Yearly revenue statistics fetched successfully',
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT / CUSTOMER / CATEGORY COUNTS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/stats/products/count
// Total distinct products count
exports.getProductsCount = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          ProductID: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$ProductID',
          productName: { $first: '$ProductName' },
          category:    { $first: '$Category' },
          brand:       { $first: '$Brand' }
        }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 }
        }
      },
      { $project: { _id: 0, totalProducts: 1 } }
    ]);

    const data = result[0] || { totalProducts: 0 };

    res.status(200).json({
      success: true,
      message: 'Total products count fetched successfully',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/stats/customers/count
// Total distinct customers count
exports.getCustomersCount = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          CustomerID: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: { _id: '$CustomerID' }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 }
        }
      },
      { $project: { _id: 0, totalCustomers: 1 } }
    ]);

    const data = result[0] || { totalCustomers: 0 };

    res.status(200).json({
      success: true,
      message: 'Total customers count fetched successfully',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/stats/categories/count
// Total distinct categories count
exports.getCategoriesCount = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $match: {
          Category: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: { _id: '$Category' }
      },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 }
        }
      },
      { $project: { _id: 0, totalCategories: 1 } }
    ]);

    const data = result[0] || { totalCategories: 0 };

    res.status(200).json({
      success: true,
      message: 'Total categories count fetched successfully',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// REFUNDS & CANCELLATIONS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/stats/refunds/count
// Refund count statistics
exports.getRefundsCount = async (req, res) => {
  try {
    const [total, refunded] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ OrderStatus: { $regex: /^refunded$/i } })
    ]);

    const refundRate = total > 0
      ? parseFloat(((refunded / total) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      message: 'Refund count statistics fetched successfully',
      data: {
        totalOrders:   total,
        refundedOrders: refunded,
        refundRate:    `${refundRate}%`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/stats/cancellations/count
// Cancellation count statistics
exports.getCancellationsCount = async (req, res) => {
  try {
    const [total, cancelled] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ OrderStatus: { $regex: /^cancelled$/i } })
    ]);

    const cancellationRate = total > 0
      ? parseFloat(((cancelled / total) * 100).toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      message: 'Cancellation count statistics fetched successfully',
      data: {
        totalOrders:        total,
        cancelledOrders:    cancelled,
        cancellationRate:   `${cancellationRate}%`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// SHIPPING STATISTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/stats/shipping/average-time
// Average shipping duration
// NOTE: The dataset stores OrderDate as a string.
// Since there is no separate ShippedDate / DeliveredDate field,
// we compute the average ShippingCost instead and surface a note.
// If a DeliveredDate field is added in the future, swap the logic below.
exports.getAverageShippingTime = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: {
          shippingCostNum: {
            $toDouble: { $ifNull: ['$ShippingCost', '0'] }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders:       { $sum: 1 },
          avgShippingCost:   { $avg: '$shippingCostNum' },
          totalShippingCost: { $sum: '$shippingCostNum' },
          minShippingCost:   { $min: '$shippingCostNum' },
          maxShippingCost:   { $max: '$shippingCostNum' }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders:       1,
          avgShippingCost:   { $round: ['$avgShippingCost',   2] },
          totalShippingCost: { $round: ['$totalShippingCost', 2] },
          minShippingCost:   { $round: ['$minShippingCost',   2] },
          maxShippingCost:   { $round: ['$maxShippingCost',   2] }
        }
      }
    ]);

    const data = result[0] || {
      totalOrders: 0,
      avgShippingCost: 0,
      totalShippingCost: 0,
      minShippingCost: 0,
      maxShippingCost: 0
    };

    res.status(200).json({
      success: true,
      message: 'Average shipping statistics fetched successfully',
      note: 'Dataset does not contain a separate delivery date field. Shipping cost averages are returned instead. Add a DeliveredDate field to compute actual transit time.',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// SYSTEM / API PERFORMANCE STATISTICS
// ══════════════════════════════════════════════════════════════════════════════

// In-memory store for API performance tracking.
// Populated by the performanceMiddleware below.
const performanceLog = [];
const MAX_LOG_SIZE = 1000; // keep last 1000 request records

// Middleware — attach to app in index.js BEFORE routes to start tracking
// Usage: app.use(require('./controllers/statsController').performanceMiddleware);
exports.performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceLog.push({
      method:     req.method,
      path:       req.originalUrl,
      statusCode: res.statusCode,
      duration,
      timestamp:  new Date().toISOString()
    });
    // Evict oldest entry when limit is reached
    if (performanceLog.length > MAX_LOG_SIZE) performanceLog.shift();
  });
  next();
};

// GET /api/v1/stats/system/performance
// API performance statistics derived from the in-memory log
exports.getSystemPerformance = (req, res) => {
  try {
    if (performanceLog.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No request data recorded yet. Make some API calls first.',
        data: {
          totalRequests:    0,
          avgResponseTimeMs: 0,
          minResponseTimeMs: 0,
          maxResponseTimeMs: 0,
          successRequests:  0,
          errorRequests:    0,
          successRate:      '0%',
          recentRequests:   []
        }
      });
    }

    const durations      = performanceLog.map(r => r.duration);
    const totalRequests  = performanceLog.length;
    const avgResponseTime = Math.round(durations.reduce((a, b) => a + b, 0) / totalRequests);
    const minResponseTime = Math.min(...durations);
    const maxResponseTime = Math.max(...durations);
    const successRequests = performanceLog.filter(r => r.statusCode < 400).length;
    const errorRequests   = totalRequests - successRequests;
    const successRate     = parseFloat(((successRequests / totalRequests) * 100).toFixed(2));

    // Group by route for per-endpoint breakdown
    const routeMap = {};
    performanceLog.forEach(r => {
      const key = `${r.method} ${r.path.split('?')[0]}`; // strip query params
      if (!routeMap[key]) {
        routeMap[key] = { calls: 0, totalDuration: 0, errors: 0 };
      }
      routeMap[key].calls++;
      routeMap[key].totalDuration += r.duration;
      if (r.statusCode >= 400) routeMap[key].errors++;
    });

    const routeBreakdown = Object.entries(routeMap)
      .map(([route, stats]) => ({
        route,
        calls:          stats.calls,
        avgDurationMs:  Math.round(stats.totalDuration / stats.calls),
        errorCount:     stats.errors
      }))
      .sort((a, b) => b.calls - a.calls);

    // Last 10 requests
    const recentRequests = performanceLog.slice(-10).reverse();

    res.status(200).json({
      success: true,
      message: 'System performance statistics fetched successfully',
      data: {
        totalRequests,
        avgResponseTimeMs: avgResponseTime,
        minResponseTimeMs: minResponseTime,
        maxResponseTimeMs: maxResponseTime,
        successRequests,
        errorRequests,
        successRate: `${successRate}%`,
        routeBreakdown,
        recentRequests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
