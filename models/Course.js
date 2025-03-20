const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  feeStructure: {
    registrationFee: { type: Number, required: true },
    fullFee: { type: Number, required: true },
  },
  formUrl: { type: String }, // Optional PDF form URL
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);