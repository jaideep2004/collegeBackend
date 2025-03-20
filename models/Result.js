const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true },
  semester: { type: Number, required: true },
  subjects: [{ 
    name: { type: String, required: true }, 
    marks: { type: Number, required: true },
    maxMarks: { type: Number, default: 100 },
    grade: { type: String }
  }],
  totalMarks: { type: Number, required: true },
  maxMarks: { type: Number, default: 500 },
  percentage: { type: Number },
  grade: { type: String },
  status: { type: String, enum: ['pass', 'fail', 'pending'], default: 'pending' },
  remarks: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // Admin is also in Student model
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save hook to calculate percentage and grade
resultSchema.pre('save', function(next) {
  // Calculate percentage if totalMarks and maxMarks are provided
  if (this.totalMarks && this.maxMarks) {
    this.percentage = (this.totalMarks / this.maxMarks) * 100;
    
    // Determine grade based on percentage
    if (this.percentage >= 90) {
      this.grade = 'A+';
    } else if (this.percentage >= 80) {
      this.grade = 'A';
    } else if (this.percentage >= 70) {
      this.grade = 'B+';
    } else if (this.percentage >= 60) {
      this.grade = 'B';
    } else if (this.percentage >= 50) {
      this.grade = 'C';
    } else if (this.percentage >= 40) {
      this.grade = 'D';
    } else {
      this.grade = 'F';
    }
    
    // Determine status
    this.status = this.percentage >= 40 ? 'pass' : 'fail';
  }
  
  // Calculate grades for each subject
  if (this.subjects && this.subjects.length > 0) {
    this.subjects.forEach(subject => {
      if (subject.marks && subject.maxMarks) {
        const subjectPercentage = (subject.marks / subject.maxMarks) * 100;
        
        if (subjectPercentage >= 90) {
          subject.grade = 'A+';
        } else if (subjectPercentage >= 80) {
          subject.grade = 'A';
        } else if (subjectPercentage >= 70) {
          subject.grade = 'B+';
        } else if (subjectPercentage >= 60) {
          subject.grade = 'B';
        } else if (subjectPercentage >= 50) {
          subject.grade = 'C';
        } else if (subjectPercentage >= 40) {
          subject.grade = 'D';
        } else {
          subject.grade = 'F';
        }
      }
    });
  }
  
  next();
});

module.exports = mongoose.model('Result', resultSchema);