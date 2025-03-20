const Document = require('../models/Document');
const Course = require('../models/Course');
const Department = require('../models/Department');
const Category = require('../models/Category');
const Faculty = require('../models/Faculty');

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Document.find({ type: 'announcement' }).sort({ uploadedAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getNews = async (req, res) => {
  try {
    const news = await Document.find({ type: 'news' }).sort({ uploadedAt: -1 });
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Document.find({ type: 'event' }).sort({ uploadedAt: -1 });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getGallery = async (req, res) => {
  try {
    const gallery = await Document.find({ type: 'gallery' }).sort({ uploadedAt: -1 });
    res.json({ success: true, data: gallery });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAboutContent = async (req, res) => {
  try {
    const aboutContent = await Document.find({ 
      type: { $in: ['about', 'history', 'vision', 'mission'] } 
    });
    res.json({ success: true, data: aboutContent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Document.find({ type: 'testimonial' });
    res.json({ success: true, data: testimonials });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('departmentId categoryId');
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('departmentId categoryId');
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDepartmentByName = async (req, res) => {
  try {
    const department = await Department.findOne({ name: req.params.name });
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    
    // Get courses for this department
    const courses = await Course.find({ departmentId: department._id }).populate('categoryId');
    
    // Get faculty for this department
    const faculty = await Faculty.find({ department: department.name });
    
    res.json({ 
      success: true, 
      data: { 
        department,
        courses,
        faculty
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ name: 1 });
    res.json({ success: true, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAdmissionInfo = async (req, res) => {
  try {
    const admissionInfo = await Document.find({ type: 'admission-info' });
    res.json({ success: true, data: admissionInfo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getContactInfo = async (req, res) => {
  try {
    const contactInfo = await Document.find({ type: 'contact-info' });
    res.json({ success: true, data: contactInfo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};