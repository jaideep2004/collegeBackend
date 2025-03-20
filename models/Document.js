const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: [
      'syllabus', 
      'datesheet', 
      'announcement', 
      'news',
      'event',
      'gallery', 
      'form',
      'about',
      'history',
      'vision',
      'mission',
      'admission-info',
      'contact-info',
      'result',
      'image',
      'testimonial',
      'notification'
    ]
  },
  title: { type: String },
  description: { type: String },
  semester: { type: Number },
  fileUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  eventDate: { type: Date },
  uploadedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' } // Admin is also in Student model
});

module.exports = mongoose.model('Document', documentSchema);