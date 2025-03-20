const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  facultyId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'faculty' },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  qualification: { type: String, required: true },
  experience: { type: Number, required: true },
  specialization: { type: String },
  bio: { type: String },
  profileImage: { type: String },
  joiningDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  subjects: [{ type: String }],
  resetToken: { type: String },
  resetTokenExpiry: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);