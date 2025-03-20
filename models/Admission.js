const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, default: 'pending' },
  documents: [{ name: { type: String, required: true }, url: { type: String, required: true } }],
}, { timestamps: true });

module.exports = mongoose.model('Admission', admissionSchema);