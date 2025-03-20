const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "P.G. Department of Computer Science"
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);