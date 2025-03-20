const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true },
  userModel: { type: String, required: true, enum: ['Student', 'Faculty'] },
  message: { type: String, required: true },
  type: { type: String, required: true, enum: ['email', 'in-app'] },
  isRead: { type: Boolean, default: false },
  status: { type: String, default: 'pending', enum: ['pending', 'sent', 'failed'] },
  title: { type: String },
  link: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);