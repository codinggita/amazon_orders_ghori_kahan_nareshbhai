const mongoose = require('mongoose');

const searchQuerySchema = new mongoose.Schema({
  query: { type: String, required: true, unique: true },
  count: { type: Number, default: 1 },
  lastSearchedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SearchQuery', searchQuerySchema);
