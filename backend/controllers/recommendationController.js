const Order = require('../models/Order');

// Helper: build query matching custom OrderID or MongoDB _id
const buildIdQuery = (orderIdParam) => {
  const query = { $or: [{ OrderID: orderIdParam }] };
  if (orderIdParam.match(/^[0-9a-fA-F]{24}$/)) {
    query.$or.push({ _id: orderIdParam });
  }
  return query;
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/recommendations/products/:customerId
// Recommend products to customer based on purchase history
// ══════════════════════════════════════════════════════════════════════════════
exports.getRecommendationsForCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Find orders placed by this customer
    const customerOrders = await Order.find({ CustomerID: customerId });

    let recommendedProducts = [];

    if (customerOrders.length > 0) {
      // Extract categories and brands bought by the customer
      const categories = [...new Set(customerOrders.map(o => o.Category).filter(Boolean))];
      const brands = [...new Set(customerOrders.map(o => o.Brand).filter(Boolean))];
      const purchasedProducts = [...new Set(customerOrders.map(o => o.ProductName))];

      // Find other products in the same categories/brands that the user hasn't bought
      recommendedProducts = await Order.aggregate([
        {
          $match: {
            $or: [
              { Category: { $in: categories } },
              { Brand: { $in: brands } }
            ],
            ProductName: { $nin: purchasedProducts }
          }
        },
        {
          $group: {
            _id: '$ProductName',
            productName: { $first: '$ProductName' },
            category: { $first: '$Category' },
            brand: { $first: '$Brand' },
            unitPrice: { $first: '$UnitPrice' },
            popularityScore: { $sum: 1 }
          }
        },
        { $sort: { popularityScore: -1 } },
        { $limit: 5 }
      ]);
    }

    // Fallback: If no history or not enough recommendations, recommend overall top trending products
    if (recommendedProducts.length < 5) {
      const excludeNames = recommendedProducts.map(p => p.productName || p._id);
      const generalTrending = await Order.aggregate([
        {
          $match: {
            ProductName: { $nin: excludeNames }
          }
        },
        {
          $group: {
            _id: '$ProductName',
            productName: { $first: '$ProductName' },
            category: { $first: '$Category' },
            brand: { $first: '$Brand' },
            unitPrice: { $first: '$UnitPrice' },
            popularityScore: { $sum: 1 }
          }
        },
        { $sort: { popularityScore: -1 } },
        { $limit: 5 - recommendedProducts.length }
      ]);
      recommendedProducts = [...recommendedProducts, ...generalTrending];
    }

    res.status(200).json({
      success: true,
      message: 'Product recommendations generated successfully',
      customerId,
      count: recommendedProducts.length,
      data: recommendedProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/recommendations/orders/:orderId
// Recommend similar products based on a reference order
// ══════════════════════════════════════════════════════════════════════════════
exports.getRecommendationsForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne(buildIdQuery(orderId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Find similar products in the same category/brand, excluding the ordered product itself
    const similarProducts = await Order.aggregate([
      {
        $match: {
          $or: [
            { Category: order.Category },
            { Brand: order.Brand }
          ],
          ProductName: { $ne: order.ProductName }
        }
      },
      {
        $group: {
          _id: '$ProductName',
          productName: { $first: '$ProductName' },
          category: { $first: '$Category' },
          brand: { $first: '$Brand' },
          unitPrice: { $first: '$UnitPrice' },
          similarityScore: { $sum: 1 }
        }
      },
      { $sort: { similarityScore: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      message: 'Similar products recommendation generated successfully',
      referenceOrder: {
        orderId: order.OrderID,
        productName: order.ProductName,
        category: order.Category,
        brand: order.Brand
      },
      count: similarProducts.length,
      data: similarProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
