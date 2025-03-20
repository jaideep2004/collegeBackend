const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "Under Graduate Courses"
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);