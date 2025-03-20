const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const upload = require('../middleware/upload');
const {
	getDepartments,
	getCategories,
	getCourses,
	addContent,
	updateContent,
	deleteContent,
	getAllContent,
	getContentByType,
	getContentById,
	getUsers,
	getAdmissions,
	updateAdmission,
	uploadResults,
	addCourse,
	updateCourse,
	deleteCourse,
	addDepartment,
	addCategory,
	addFaculty,
	updateFaculty,
	deleteFaculty,
	getAllFaculty,
	getAllStudents,
	getStudentById,
	updateStudent,
	deleteStudent,
	sendNotification,
	broadcastNotification,
	uploadFile,
	getPayments,
	getNotifications
} = require("../controllers/adminController");

// Apply admin authentication middleware to all routes
router.use(authMiddleware(['admin']));

// Content Management
router.get('/content', getAllContent);
router.get('/content/type/:type', getContentByType);
router.get('/content/:id', getContentById);
router.post('/content', addContent);
router.put('/content/:id', updateContent);
router.delete('/content/:id', deleteContent);

// File Upload
router.post('/upload', upload.single('file'), (req, res, next) => {
	console.log('Upload route hit');
	console.log('Request body:', req.body);
	console.log('Request file:', req.file);
	next();
}, uploadFile);

// User Management
router.get('/users', getUsers);
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.get('/faculty', getAllFaculty);
router.post('/faculty', addFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// Course Management
router.get('/departments', getDepartments);
router.post('/departments', addDepartment);
router.get('/categories', getCategories);
router.post('/categories', addCategory);
router.get('/courses', getCourses);
router.post('/courses', addCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Admission Management
router.get('/admissions', getAdmissions);
router.put('/admissions/:id', updateAdmission);

// Payment Management
router.get('/payments', getPayments);

// Result Management
router.post('/results', uploadResults);

// Notification System
router.get('/notifications', getNotifications);
router.post('/notifications', sendNotification);
router.post('/notifications/broadcast', broadcastNotification);

module.exports = router;
