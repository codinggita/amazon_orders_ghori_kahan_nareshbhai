const Order = require('../models/Order');

// ─── Helper: parse TotalAmount (stored as String) to Number safely ────────────
const toDoubleExpr = { $toDouble: { $ifNull: ['$TotalAmount', '0'] } };

// ══════════════════════════════════════════════════════════════════════════════
// REVENUE ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/analytics/revenue/total
// Calculate total revenue across all orders
exports.getTotalRevenue = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: toDoubleExpr },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          totalOrders: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      }
    ]);

    const data = result[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

    res.status(200).json({
      success: true,
      message: 'Total revenue calculated successfully',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/analytics/revenue/monthly
// Monthly revenue breakdown
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: '$OrderDate',
              onError: null,
              onNull: null
            }
          }
        }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: {
            year: { $year: '$parsedDate' },
            month: { $month: '$parsedDate' }
          },
          revenue: { $sum: toDoubleExpr },
          orderCount: { $sum: 1 },
          avgValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          monthLabel: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.month'
            ]
          },
          revenue: { $round: ['$revenue', 2] },
          orderCount: 1,
          avgValue: { $round: ['$avgValue', 2] }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Monthly revenue analytics fetched successfully',
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/analytics/revenue/yearly
// Yearly revenue breakdown
exports.getYearlyRevenue = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: '$OrderDate',
              onError: null,
              onNull: null
            }
          }
        }
      },
      { $match: { parsedDate: { $ne: null } } },
      {
        $group: {
          _id: { year: { $year: '$parsedDate' } },
          revenue: { $sum: toDoubleExpr },
          orderCount: { $sum: 1 },
          avgValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          revenue: { $round: ['$revenue', 2] },
          orderCount: 1,
          avgValue: { $round: ['$avgValue', 2] }
        }
      },
      { $sort: { year: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Yearly revenue analytics fetched successfully',
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ORDER ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/analytics/orders/average-value
// Average order value
exports.getAverageOrderValue = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: null,
          averageOrderValue: { $avg: toDoubleExpr },
          minOrderValue: { $min: toDoubleExpr },
          maxOrderValue: { $max: toDoubleExpr },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          minOrderValue: { $round: ['$minOrderValue', 2] },
          maxOrderValue: { $round: ['$maxOrderValue', 2] },
          totalOrders: 1
        }
      }
    ]);

    const data = result[0] || {
      averageOrderValue: 0,
      minOrderValue: 0,
      maxOrderValue: 0,
      totalOrders: 0
    };

    res.status(200).json({
      success: true,
      message: 'Average order value calculated successfully',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/analytics/orders/count
// Total orders count broken down by status
exports.getOrdersCount = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: '$OrderStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalOrders = result.reduce((acc, item) => acc + item.count, 0);

    res.status(200).json({
      success: true,
      message: 'Order count analytics fetched successfully',
      totalOrders,
      breakdown: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/analytics/orders/cancelled
// Cancelled order analytics
exports.getCancelledOrderAnalytics = async (req, res) => {
  try {
    const [totalResult, cancelledResult, monthlyResult] = await Promise.all([
      Order.countDocuments({}),
      Order.aggregate([
        { $match: { OrderStatus: { $regex: /^cancelled$/i } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalLostRevenue: { $sum: toDoubleExpr }
          }
        }
      ]),
      Order.aggregate([
        { $match: { OrderStatus: { $regex: /^cancelled$/i } } },
        {
          $addFields: {
            parsedDate: {
              $dateFromString: {
                dateString: '$OrderDate',
                onError: null,
                onNull: null
              }
            }
          }
        },
        { $match: { parsedDate: { $ne: null } } },
        {
          $group: {
            _id: {
              year: { $year: '$parsedDate' },
              month: { $month: '$parsedDate' }
            },
            cancelledCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            cancelledCount: 1
          }
        },
        { $sort: { year: 1, month: 1 } }
      ])
    ]);

    const cancelled = cancelledResult[0] || { count: 0, totalLostRevenue: 0 };
    const cancellationRate = totalResult > 0
      ? ((cancelled.count / totalResult) * 100).toFixed(2)
      : '0.00';

    res.status(200).json({
      success: true,
      message: 'Cancelled order analytics fetched successfully',
      data: {
        totalOrders: totalResult,
        cancelledOrders: cancelled.count,
        cancellationRate: `${cancellationRate}%`,
        totalLostRevenue: parseFloat(cancelled.totalLostRevenue || 0).toFixed(2),
        monthlyBreakdown: monthlyResult
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/analytics/orders/refunded
// Refunded order analytics
exports.getRefundedOrderAnalytics = async (req, res) => {
  try {
    const [totalResult, refundedResult] = await Promise.all([
      Order.countDocuments({}),
      Order.aggregate([
        { $match: { OrderStatus: { $regex: /^refunded$/i } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalRefundedAmount: { $sum: toDoubleExpr }
          }
        }
      ])
    ]);

    const refunded = refundedResult[0] || { count: 0, totalRefundedAmount: 0 };
    const refundRate = totalResult > 0
      ? ((refunded.count / totalResult) * 100).toFixed(2)
      : '0.00';

    res.status(200).json({
      success: true,
      message: 'Refunded order analytics fetched successfully',
      data: {
        totalOrders: totalResult,
        refundedOrders: refunded.count,
        refundRate: `${refundRate}%`,
        totalRefundedAmount: parseFloat(refunded.totalRefundedAmount || 0).toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMER ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/analytics/customers/top
// Top customers by total spending
exports.getTopCustomers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await Order.aggregate([
      {
        $group: {
          _id: {
            customerID: '$CustomerID',
            customerName: '$CustomerName'
          },
          totalSpent: { $sum: toDoubleExpr },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          customerID: '$_id.customerID',
          customerName: '$_id.customerName',
          totalSpent: { $round: ['$totalSpent', 2] },
          orderCount: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit }
    ]);

    res.status(200).json({
      success: true,
      message: `Top ${limit} customers fetched successfully`,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/analytics/products/top-selling
// Top selling products by quantity
exports.getTopSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await Order.aggregate([
      {
        $group: {
          _id: {
            productID: '$ProductID',
            productName: '$ProductName',
            category: '$Category',
            brand: '$Brand'
          },
          totalQuantitySold: {
            $sum: { $toInt: { $ifNull: ['$Quantity', '0'] } }
          },
          totalRevenue: { $sum: toDoubleExpr },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          productID: '$_id.productID',
          productName: '$_id.productName',
          category: '$_id.category',
          brand: '$_id.brand',
          totalQuantitySold: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orderCount: 1
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: limit }
    ]);

    res.status(200).json({
      success: true,
      message: `Top ${limit} selling products fetched successfully`,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/analytics/products/low-selling
// Low selling products by quantity
exports.getLowSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await Order.aggregate([
      {
        $group: {
          _id: {
            productID: '$ProductID',
            productName: '$ProductName',
            category: '$Category',
            brand: '$Brand'
          },
          totalQuantitySold: {
            $sum: { $toInt: { $ifNull: ['$Quantity', '0'] } }
          },
          totalRevenue: { $sum: toDoubleExpr },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          productID: '$_id.productID',
          productName: '$_id.productName',
          category: '$_id.category',
          brand: '$_id.brand',
          totalQuantitySold: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orderCount: 1
        }
      },
      { $sort: { totalQuantitySold: 1 } },
      { $limit: limit }
    ]);

    res.status(200).json({
      success: true,
      message: `Bottom ${limit} low-selling products fetched successfully`,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORY ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/analytics/categories/top
// Top categories by revenue
exports.getTopCategories = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await Order.aggregate([
      { $match: { Category: { $exists: true, $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$Category',
          totalRevenue: { $sum: toDoubleExpr },
          orderCount: { $sum: 1 },
          totalQuantitySold: {
            $sum: { $toInt: { $ifNull: ['$Quantity', '0'] } }
          },
          avgOrderValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orderCount: 1,
          totalQuantitySold: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);

    res.status(200).json({
      success: true,
      message: `Top ${limit} categories fetched successfully`,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENT ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/analytics/payments/distribution
// Payment methods distribution
exports.getPaymentDistribution = async (req, res) => {
  try {
    const [result, totalOrders] = await Promise.all([
      Order.aggregate([
        { $match: { PaymentMethod: { $exists: true, $ne: null, $ne: '' } } },
        {
          $group: {
            _id: '$PaymentMethod',
            count: { $sum: 1 },
            totalRevenue: { $sum: toDoubleExpr }
          }
        },
        {
          $project: {
            _id: 0,
            paymentMethod: '$_id',
            count: 1,
            totalRevenue: { $round: ['$totalRevenue', 2] }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Order.countDocuments({})
    ]);

    // Add percentage to each method
    const withPercentage = result.map(item => ({
      ...item,
      percentage: totalOrders > 0
        ? parseFloat(((item.count / totalOrders) * 100).toFixed(2))
        : 0
    }));

    res.status(200).json({
      success: true,
      message: 'Payment method distribution fetched successfully',
      totalOrders,
      count: withPercentage.length,
      data: withPercentage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// LOCATION ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/analytics/locations/top-cities
// Top performing cities by revenue
exports.getTopCities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await Order.aggregate([
      { $match: { City: { $exists: true, $ne: null, $ne: '' } } },
      {
        $group: {
          _id: {
            city: '$City',
            state: '$State',
            country: '$Country'
          },
          totalRevenue: { $sum: toDoubleExpr },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: toDoubleExpr }
        }
      },
      {
        $project: {
          _id: 0,
          city: '$_id.city',
          state: '$_id.state',
          country: '$_id.country',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orderCount: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);

    res.status(200).json({
      success: true,
      message: `Top ${limit} performing cities fetched successfully`,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// RETURNS & DISCOUNTS ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/v1/analytics/returns/rate
// Return rate analytics (Returned + Refunded statuses)
exports.getReturnRate = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          returnedOrders: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $regexMatch: { input: { $ifNull: ['$OrderStatus', ''] }, regex: /^returned$/i } },
                    { $regexMatch: { input: { $ifNull: ['$OrderStatus', ''] }, regex: /^refunded$/i } }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalReturnedRevenue: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $regexMatch: { input: { $ifNull: ['$OrderStatus', ''] }, regex: /^returned$/i } },
                    { $regexMatch: { input: { $ifNull: ['$OrderStatus', ''] }, regex: /^refunded$/i } }
                  ]
                },
                toDoubleExpr,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          returnedOrders: 1,
          returnRate: {
            $concat: [
              {
                $toString: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$returnedOrders', { $max: ['$totalOrders', 1] }] },
                        100
                      ]
                    },
                    2
                  ]
                }
              },
              '%'
            ]
          },
          totalReturnedRevenue: { $round: ['$totalReturnedRevenue', 2] }
        }
      }
    ]);

    const data = result[0] || {
      totalOrders: 0,
      returnedOrders: 0,
      returnRate: '0%',
      totalReturnedRevenue: 0
    };

    res.status(200).json({
      success: true,
      message: 'Return rate analytics fetched successfully',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/analytics/discounts/usage
// Discount usage analytics
exports.getDiscountUsage = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $addFields: {
          discountValue: {
            $toDouble: {
              $cond: [
                { $and: [{ $ne: ['$Discount', null] }, { $ne: ['$Discount', ''] }, { $ne: ['$Discount', '0'] }] },
                '$Discount',
                '0'
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          discountedOrders: {
            $sum: { $cond: [{ $gt: ['$discountValue', 0] }, 1, 0] }
          },
          totalDiscountGiven: { $sum: '$discountValue' },
          avgDiscount: { $avg: '$discountValue' },
          maxDiscount: { $max: '$discountValue' }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          discountedOrders: 1,
          nonDiscountedOrders: { $subtract: ['$totalOrders', '$discountedOrders'] },
          discountUsageRate: {
            $concat: [
              {
                $toString: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$discountedOrders', { $max: ['$totalOrders', 1] }] },
                        100
                      ]
                    },
                    2
                  ]
                }
              },
              '%'
            ]
          },
          totalDiscountGiven: { $round: ['$totalDiscountGiven', 2] },
          avgDiscount: { $round: ['$avgDiscount', 2] },
          maxDiscount: { $round: ['$maxDiscount', 2] }
        }
      }
    ]);

    const data = result[0] || {
      totalOrders: 0,
      discountedOrders: 0,
      nonDiscountedOrders: 0,
      discountUsageRate: '0%',
      totalDiscountGiven: 0,
      avgDiscount: 0,
      maxDiscount: 0
    };

    res.status(200).json({
      success: true,
      message: 'Discount usage analytics fetched successfully',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
