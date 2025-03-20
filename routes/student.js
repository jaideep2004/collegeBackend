const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
	getProfile,
	updateProfile,
	getResults,
	getDocuments,
	getCourses,
	getRegisteredCourses,
	createPayment,
	verifyPayment,
	getAdmissions,
	applyAdmission,
	getNotifications,
	markNotificationAsRead,
	getPaymentHistory
} = require("../controllers/studentController");

// Apply student authentication middleware to all routes
router.use(authMiddleware(['student']));

// Profile Management
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Result Management
router.get("/results", getResults);

// Document Management
router.get("/documents/:type", getDocuments);

// Course Management
router.get("/courses", getCourses);
router.get("/registered-courses", getRegisteredCourses);

// Payment Management
router.post("/payments", createPayment);
router.post("/payments/verify", verifyPayment);
router.get("/payments/history", getPaymentHistory);

// Admission Management
router.get("/admissions", getAdmissions);
router.post("/admissions", applyAdmission);

// Notification Management
router.get("/notifications", getNotifications);
router.put("/notifications/:id", markNotificationAsRead);

module.exports = router;
