const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to Mongo successfully.");
    const users = await User.find({});
    console.log("Registered users count:", users.length);
    console.log("Users:", users.map(u => ({ name: u.name, email: u.email, role: u.role, isActive: u.isActive })));
    process.exit(0);
  } catch (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
};

run();
