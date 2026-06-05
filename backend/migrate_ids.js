const mongoose = require('mongoose');
const Order = require('./models/Order');
const dotenv = require('dotenv');

dotenv.config();

const migrateIds = async () => {
  console.log("🚀 Starting database ID migration...");
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Fetch all existing orders
    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders to process.`);

    let nextId = 1;

    for (let order of orders) {
      // Set the OrderID to a sequential numeric string (e.g., "1", "2", "3")
      // Only modify if it is missing, starts with 'ORD', or is not already a simple number
      if (!order.OrderID || order.OrderID.startsWith('ORD') || isNaN(order.OrderID)) {
        const newId = nextId.toString();
        await Order.updateOne({ _id: order._id }, { $set: { OrderID: newId } });
        console.log(`Updated order _id: ${order._id} to new OrderID: ${newId}`);
      }
      nextId++;
    }

    console.log("✅ Database migration completed successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error migrating data:", err);
    process.exit(1);
  }
};

migrateIds();
