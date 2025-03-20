require("dotenv").config();
const Result = require("../models/Result");
const Student = require("../models/Student");
const Document = require("../models/Document");
const Admission = require("../models/Admission");
const Payment = require("../models/Payment");
const Course = require("../models/Course");
const Notification = require("../models/Notification");
const razorpay = require("../config/razorpay");
const { sendEmail } = require("../utils/notify");
const crypto = require('crypto');

// Profile Management
exports.getProfile = async (req, res) => {
	try {
		const student = await Student.findById(req.user.id).select('-password');
		if (!student) {
			return res.status(404).json({ success: false, error: 'Student not found' });
		}
		res.json({ success: true, data: student });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.updateProfile = async (req, res) => {
	const { name, mobile, fatherName, motherName, address, city, state, pinCode } = req.body;
	try {
		const student = await Student.findByIdAndUpdate(
			req.user.id,
			{ name, mobile, fatherName, motherName, address, city, state, pinCode },
			{ new: true }
		).select('-password');
		
		if (!student) {
			return res.status(404).json({ success: false, error: 'Student not found' });
		}
		
		res.json({ success: true, data: student });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

// Result Management
exports.getResults = async (req, res) => {
	try {
		const student = await Student.findById(req.user.id);
		if (!student) {
			return res.status(404).json({ success: false, error: 'Student not found' });
		}
		
		const results = await Result.find({ rollNumber: student.rollNumber });
		if (!results.length) {
			return res.status(404).json({ success: false, error: 'No results found' });
		}
		
		res.json({ success: true, data: results });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

// Document Management
exports.getDocuments = async (req, res) => {
	const { type } = req.params;
	try {
		const documents = await Document.find({ type }).sort({ uploadedAt: -1 });
		res.json({ success: true, data: documents });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

// Course Registration and Fee Payment
exports.getCourses = async (req, res) => {
	try {
		const courses = await Course.find().populate('departmentId categoryId');
		res.json({ success: true, data: courses });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.getRegisteredCourses = async (req, res) => {
	try {
		const student = await Student.findById(req.user.id).populate('courses');
		if (!student) {
			return res.status(404).json({ success: false, error: 'Student not found' });
		}
		
		res.json({ success: true, data: student.courses });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.createPayment = async (req, res) => {
	const { courseId, type } = req.body;
	try {
		const course = await Course.findById(courseId);
		if (!course) {
			return res.status(404).json({ success: false, error: 'Course not found' });
		}

		// Check if payment already exists
		const existingPayment = await Payment.findOne({
			studentId: req.user.id,
			courseId,
			type,
			status: 'completed'
		});

		if (existingPayment) {
			return res.status(400).json({ 
				success: false, 
				error: `${type === 'registration' ? 'Registration' : 'Full'} fee already paid for this course` 
			});
		}

		const amount =
			type === "registration"
				? course.feeStructure.registrationFee
				: course.feeStructure.fullFee;
		
		const receipt = `receipt_${Date.now()}`;
		const currency = "INR";
		const notes = {
			studentId: req.user.id,
			courseId: courseId,
			type: type
		};
		
		// Create Razorpay order (amount in paise)
		const order = await razorpay.orders.create({
			amount: amount * 100,
			currency,
			receipt,
			notes
		});

		// Save payment record
		const payment = new Payment({
			studentId: req.user.id,
			courseId,
			amount: amount, // Store in rupees
			type,
			razorpayOrderId: order.id,
			status: "pending",
		});
		await payment.save();

		// Return payment details
		res.json({ 
			success: true, 
			data: { 
				amount: amount, 
				orderId: order.id,
				currency,
				receipt,
				key: process.env.RAZORPAY_KEY_ID
			} 
		});
	} catch (err) {
		console.error("Payment creation error:", err);
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.verifyPayment = async (req, res) => {
	const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
	
	try {
		// Verify the payment signature
		const generatedSignature = crypto
			.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
			.update(razorpayOrderId + '|' + razorpayPaymentId)
			.digest('hex');
		
		const isSignatureValid = generatedSignature === razorpaySignature;
		
		if (!isSignatureValid) {
			console.error("Payment signature verification failed");
			return res.status(400).json({ success: false, error: 'Invalid payment signature' });
		}
		
		// Find and update the payment
		const payment = await Payment.findOne({ razorpayOrderId });
		if (!payment) {
			console.error("Payment not found for order ID:", razorpayOrderId);
			return res.status(404).json({ success: false, error: 'Payment not found' });
		}

		payment.status = 'completed';
		payment.razorpayPaymentId = razorpayPaymentId;
		payment.razorpaySignature = razorpaySignature;
		payment.completedAt = Date.now();
		await payment.save();

		console.log(`Payment completed: ${payment._id} for order ${razorpayOrderId}`);

		// If this is a full fee payment, add the course to student's courses
		if (payment.type === 'fullFee') {
			const student = await Student.findById(payment.studentId);
			if (!student.courses.includes(payment.courseId)) {
				student.courses.push(payment.courseId);
				await student.save();
				console.log(`Course ${payment.courseId} added to student ${student._id}`);
			}
		}

		const course = await Course.findById(payment.courseId);
		const student = await Student.findById(payment.studentId);
		
		// Send email notification
		await sendEmail(
			student.email,
			"Payment Successful",
			`Payment of ₹${payment.amount} for ${course.name} completed. Receipt: ${razorpayPaymentId}`
		);

		// Create in-app notification
		await new Notification({
			userId: student._id,
			userModel: "Student",
			message: `Payment of ₹${payment.amount} completed for ${course.name}`,
			type: "in-app",
		}).save();

		// If this is a registration fee payment, notify admin about new admission application
		if (payment.type === "registration") {
			const admin = await Student.findOne({ role: "admin" });
			if (admin) {
				await sendEmail(
					admin.email,
					"New Registration Payment",
					`Student ${student.name} has paid the registration fee for ${course.name}.`
				);
				
				await new Notification({
					userId: admin._id,
					userModel: "Student",
					message: `${student.name} has paid registration fee for ${course.name}`,
					type: "in-app",
				}).save();
			}
		}

		res.json({ success: true, data: payment });
	} catch (err) {
		console.error("Payment verification error:", err);
		res.status(500).json({ success: false, error: err.message });
	}
};

// Admission Application
exports.getAdmissions = async (req, res) => {
	try {
		const admissions = await Admission.find({ studentId: req.user.id })
			.populate('courseId')
			.sort({ createdAt: -1 });
		
		res.json({ success: true, data: admissions });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.applyAdmission = async (req, res) => {
	const { courseId, documents } = req.body;
	try {
		// Check if already applied
		const existingAdmission = await Admission.findOne({ 
			studentId: req.user.id,
			courseId
		});
		
		if (existingAdmission) {
			return res.status(400).json({ 
				success: false, 
				error: 'You have already applied for admission to this course' 
			});
		}
		
		// Check if registration fee is paid
		const registrationPayment = await Payment.findOne({
			studentId: req.user.id,
			courseId,
			type: 'registration',
			status: 'completed'
		});
		
		if (!registrationPayment) {
			return res.status(400).json({ 
				success: false, 
				error: 'Please pay the registration fee before applying for admission' 
			});
		}
		
		const admission = new Admission({
			studentId: req.user.id,
			courseId,
			documents,
			status: 'pending'
		});
		await admission.save();

		const student = await Student.findById(req.user.id);
		const course = await Course.findById(courseId);
		
		// Send email notification
		await sendEmail(
			student.email,
			"Admission Applied",
			`Your admission application for ${course.name} has been submitted and is under review.`
		);

		// Create in-app notification
		await new Notification({
			userId: req.user.id,
			userModel: "Student",
			message: `Admission application submitted for ${course.name}`,
			type: "in-app",
		}).save();

		// Notify admin
		const admin = await Student.findOne({ role: "admin" });
		if (admin) {
			await sendEmail(
				admin.email,
				"New Admission Application",
				`Student ${student.name} applied for ${course.name}. Review the application.`
			);
			
			await new Notification({
				userId: admin._id,
				userModel: "Student",
				message: `New admission application from ${student.name} for ${course.name}`,
				type: "in-app",
			}).save();
		}

		res.json({ success: true, data: admission });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

// Notifications
exports.getNotifications = async (req, res) => {
	try {
		const notifications = await Notification.find({ 
			userId: req.user.id,
			userModel: 'Student'
		}).sort({ createdAt: -1 });
		
		res.json({ success: true, data: notifications });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.markNotificationAsRead = async (req, res) => {
	try {
		const notification = await Notification.findOneAndUpdate(
			{ _id: req.params.id, userId: req.user.id },
			{ isRead: true },
			{ new: true }
		);
		
		if (!notification) {
			return res.status(404).json({ success: false, error: 'Notification not found' });
		}
		
		res.json({ success: true, data: notification });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

// Payment History
exports.getPaymentHistory = async (req, res) => {
	try {
		const payments = await Payment.find({ 
			studentId: req.user.id,
			status: 'completed'
		}).populate('courseId').sort({ completedAt: -1 });
		
		res.json({ success: true, data: payments });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};
