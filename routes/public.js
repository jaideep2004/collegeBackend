const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getGallery,
  getCourses,
  getDepartments,
  getCategories,
  getNews,
  getEvents,
  getAboutContent,
  getCourseById,
  getDepartmentByName,
  getFaculty,
  getAdmissionInfo,
  getContactInfo,
  getTestimonials
} = require('../controllers/publicController');

router.get('/announcements', getAnnouncements);
router.get('/news', getNews);
router.get('/events', getEvents);
router.get('/gallery', getGallery);
router.get('/about', getAboutContent);
router.get('/testimonials', getTestimonials);
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.get('/departments', getDepartments);
router.get('/departments/:name', getDepartmentByName);
router.get('/categories', getCategories);
router.get('/faculty', getFaculty);
router.get('/admission-info', getAdmissionInfo);
router.get('/contact-info', getContactInfo);

module.exports = router;