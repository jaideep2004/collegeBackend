const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Result = require("../models/Result");
const Document = require("../models/Document");
const Admission = require("../models/Admission");
const Course = require("../models/Course");
const Department = require("../models/Department");
const Category = require("../models/Category");
const { sendEmail } = require("../utils/notify");
const Notification = require("../models/Notification");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");

exports.getDepartments = async (req, res) => {
	try {
		const departments = await Department.find();
		res.json({ success: true, data: departments });
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

exports.getCourses = async (req, res) => {
	// New endpoint
	try {
		const courses = await Course.find().populate("departmentId categoryId");
		res.json({ success: true, data: courses });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.addContent = async (req, res) => {
	const { type, title, description, semester, fileUrl, thumbnailUrl, eventDate } = req.body;
	try {
		const document = new Document({ 
			type, 
			title, 
			description, 
			semester, 
			fileUrl, 
			thumbnailUrl, 
			eventDate,
			createdBy: req.user.id,
			updatedAt: Date.now()
		});
		await document.save();
		res.json({ success: true, data: document });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.updateContent = async (req, res) => {
	const { type, title, description, semester, fileUrl, thumbnailUrl, eventDate } = req.body;
	try {
		const document = await Document.findByIdAndUpdate(
			req.params.id,
			{ 
				type, 
				title, 
				description, 
				semester, 
				fileUrl, 
				thumbnailUrl, 
				eventDate,
				updatedAt: Date.now()
			},
			{ new: true }
		);
		
		if (!document) {
			return res.status(404).json({ success: false, error: 'Document not found' });
		}
		
		res.json({ success: true, data: document });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.deleteContent = async (req, res) => {
	try {
		const document = await Document.findByIdAndDelete(req.params.id);
		
		if (!document) {
			return res.status(404).json({ success: false, error: 'Document not found' });
		}
		
		res.json({ success: true, data: { message: 'Document deleted successfully' } });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.getAllContent = async (req, res) => {
	try {
		const { type, page = 1, limit = 10, search } = req.query;
		const query = {};
		
		// Filter by type if provided
		if (type) {
			query.type = type;
		}
		
		// Search in title and description if provided
		if (search) {
			query.$or = [
				{ title: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } }
			];
		}
		
		// Count total documents
		const total = await Document.countDocuments(query);
		
		// Get documents with pagination
		const documents = await Document.find(query)
			.sort({ updatedAt: -1 })
			.skip((page - 1) * limit)
			.limit(parseInt(limit));
		
		res.json({ 
			success: true, 
			data: documents,
			pagination: {
				total,
				page: parseInt(page),
				limit: parseInt(limit),
				pages: Math.ceil(total / limit)
			}
		});
	} catch (err) {
		console.error("Error fetching content:", err);
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.getContentByType = async (req, res) => {
	try {
		const documents = await Document.find({ type: req.params.type }).sort({ updatedAt: -1 });
		res.json({ success: true, data: documents });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.getContentById = async (req, res) => {
	try {
		const document = await Document.findById(req.params.id);
		
		if (!document) {
			return res.status(404).json({ success: false, error: 'Document not found' });
		}
		
		res.json({ success: true, data: document });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.getUsers = async (req, res) => {
	try {
		const students = await Student.find();
		const faculty = await Faculty.find();
		res.json({ success: true, data: { students, faculty } });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.getAdmissions = async (req, res) => {
	try {
		const admissions = await Admission.find().populate("studentId courseId");
		res.json({ success: true, data: admissions });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.updateAdmission = async (req, res) => {
	const { status } = req.body;
	try {
		const admission = await Admission.findByIdAndUpdate(
			req.params.id,
			{ status },
			{ new: true }
		).populate("studentId courseId");
		if (!admission)
			return res
				.status(404)
				.json({ success: false, error: "Admission not found" });

		await sendEmail(
			admission.studentId.email,
			"Admission Update",
			`Your admission for ${admission.courseId.name} is ${status}. ${
				status === "approved" ? "Please pay the full fee." : ""
			}`
		);

		await new Notification({
			userId: admission.studentId._id,
			userModel: "Student",
			message: `Admission ${status}`,
			type: "in-app",
		}).save();

		res.json({ success: true, data: admission });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.uploadResults = async (req, res) => {
	const { rollNumber, semester, subjects, totalMarks } = req.body;
	try {
		// Validate required fields
		if (!rollNumber || !semester || !totalMarks) {
			return res.status(400).json({ success: false, error: 'Roll number, semester, and total marks are required' });
		}
		
		// Check if student exists
		const student = await Student.findOne({ rollNumber });
		if (!student) {
			return res.status(404).json({ success: false, error: 'Student not found with this roll number' });
		}
		
		// Check if result already exists
		const existingResult = await Result.findOne({ rollNumber, semester });
		if (existingResult) {
			return res.status(400).json({ success: false, error: 'Result already exists for this student and semester' });
		}
		
		// Create new result
		const result = new Result({ 
			rollNumber, 
			semester, 
			subjects: subjects || [], 
			totalMarks,
			uploadedBy: req.user.id,
			uploadedAt: Date.now()
		});
		
		await result.save();

		// Notify student
		await sendEmail(
			student.email,
			"Result Uploaded",
			`Your result for semester ${semester} is uploaded. Total marks: ${totalMarks}`
		);
		
		// Create in-app notification
		await new Notification({
			userId: student._id,
			userModel: "Student",
			message: `Result uploaded for semester ${semester}`,
			type: "in-app",
		}).save();

		res.json({ success: true, data: result });
	} catch (err) {
		console.error("Result upload error:", err);
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.addCourse = async (req, res) => {
	const { name, departmentName, categoryName, feeStructure, formUrl } =
		req.body;
	try {
		const department = await Department.findOne({ name: departmentName });
		const category = await Category.findOne({ name: categoryName });
		if (!department || !category)
			return res
				.status(404)
				.json({ success: false, error: "Department or Category not found" });

		const course = new Course({
			name,
			departmentId: department._id,
			categoryId: category._id,
			feeStructure,
			formUrl,
		});
		await course.save();
		res.json({ success: true, data: course });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.updateCourse = async (req, res) => {
	const { id } = req.params;
	const { name, departmentId, categoryId, feeStructure, formUrl } = req.body;
	
	try {
		// Validate ObjectId
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, error: "Invalid course ID" });
		}
		
		// Check if course exists
		const course = await Course.findById(id);
		if (!course) {
			return res.status(404).json({ success: false, error: "Course not found" });
		}
		
		// Update course
		const updatedCourse = await Course.findByIdAndUpdate(
			id,
			{ name, departmentId, categoryId, feeStructure, formUrl },
			{ new: true, runValidators: true }
		);
		
		// Populate department and category
		await updatedCourse.populate('departmentId categoryId');
		
		res.json({ success: true, data: updatedCourse });
	} catch (err) {
		console.error("Update course error:", err);
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.deleteCourse = async (req, res) => {
	const { id } = req.params;
	
	try {
		// Validate ObjectId
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, error: "Invalid course ID" });
		}
		
		// Check if course exists
		const course = await Course.findById(id);
		if (!course) {
			return res.status(404).json({ success: false, error: "Course not found" });
		}
		
		// Delete course
		await Course.findByIdAndDelete(id);
		
		res.json({ success: true, message: "Course deleted successfully" });
	} catch (err) {
		console.error("Delete course error:", err);
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.addDepartment = async (req, res) => {
	const { name } = req.body;
	try {
		const department = new Department({ name });
		await department.save();
		res.json({ success: true, data: department });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.addCategory = async (req, res) => {
	const { name } = req.body;
	try {
		const category = new Category({ name });
		await category.save();
		res.json({ success: true, data: category });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.addFaculty = async (req, res) => {
	const { name, email, mobile, department, designation, qualification, experience, password } = req.body;
	try {
		let faculty = await Faculty.findOne({ email });
		if (faculty) {
			return res.status(400).json({ success: false, error: 'Faculty already exists' });
		}

		faculty = new Faculty({
			name,
			email,
			mobile,
			department,
			designation,
			qualification,
			experience,
			password: await bcrypt.hash(password, 10),
			role: 'faculty'
		});

		await faculty.save();

		// Send email notification
		await sendEmail(
			email,
			'Faculty Account Created',
			`Hello ${name}, your faculty account has been created. You can login with your email and password.`
		);

		res.json({ success: true, data: faculty });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.updateFaculty = async (req, res) => {
	const { name, email, mobile, department, designation, qualification, experience } = req.body;
	try {
		const faculty = await Faculty.findByIdAndUpdate(
			req.params.id,
			{ name, email, mobile, department, designation, qualification, experience },
			{ new: true }
		);
		
		if (!faculty) {
			return res.status(404).json({ success: false, error: 'Faculty not found' });
		}
		
		res.json({ success: true, data: faculty });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.deleteFaculty = async (req, res) => {
	try {
		const faculty = await Faculty.findByIdAndDelete(req.params.id);
		
		if (!faculty) {
			return res.status(404).json({ success: false, error: 'Faculty not found' });
		}
		
		res.json({ success: true, data: { message: 'Faculty deleted successfully' } });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.getAllFaculty = async (req, res) => {
	try {
		const faculty = await Faculty.find().sort({ name: 1 });
		res.json({ success: true, data: faculty });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.getAllStudents = async (req, res) => {
	try {
		const students = await Student.find({ role: 'student' }).sort({ name: 1 });
		res.json({ success: true, data: students });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.getStudentById = async (req, res) => {
	try {
		const student = await Student.findById(req.params.id);
		
		if (!student) {
			return res.status(404).json({ success: false, error: 'Student not found' });
		}
		
		res.json({ success: true, data: student });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.updateStudent = async (req, res) => {
	const { name, email, mobile, fatherName, motherName, address, city, state, pinCode, dob, gender, category } = req.body;
	try {
		const student = await Student.findByIdAndUpdate(
			req.params.id,
			{ name, email, mobile, fatherName, motherName, address, city, state, pinCode, dob, gender, category },
			{ new: true }
		);
		
		if (!student) {
			return res.status(404).json({ success: false, error: 'Student not found' });
		}
		
		res.json({ success: true, data: student });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.deleteStudent = async (req, res) => {
	try {
		const student = await Student.findByIdAndDelete(req.params.id);
		
		if (!student) {
			return res.status(404).json({ success: false, error: 'Student not found' });
		}
		
		res.json({ success: true, data: { message: 'Student deleted successfully' } });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.sendNotification = async (req, res) => {
	const { userIds, userModel, message, type, emailSubject } = req.body;
	try {
		const notifications = [];
		
		for (const userId of userIds) {
			// Create in-app notification
			const notification = new Notification({
				userId,
				userModel,
				message,
				type: 'in-app'
			});
			await notification.save();
			notifications.push(notification);
			
			// Send email if requested
			if (type === 'email' || type === 'both') {
				const Model = userModel === 'Faculty' ? Faculty : Student;
				const user = await Model.findById(userId);
				if (user && user.email) {
					await sendEmail(user.email, emailSubject || 'New Notification', message);
				}
			}
		}
		
		res.json({ success: true, data: notifications });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.broadcastNotification = async (req, res) => {
	const { userModel, message, type, emailSubject } = req.body;
	try {
		const Model = userModel === 'Faculty' ? Faculty : Student;
		const users = await Model.find();
		const userIds = users.map(user => user._id);
		
		const notifications = [];
		
		for (const userId of userIds) {
			// Create in-app notification
			const notification = new Notification({
				userId,
				userModel,
				message,
				type: 'in-app'
			});
			await notification.save();
			notifications.push(notification);
		}
		
		// Send email if requested
		if (type === 'email' || type === 'both') {
			for (const user of users) {
				if (user.email) {
					await sendEmail(user.email, emailSubject || 'New Notification', message);
				}
			}
		}
		
		res.json({ success: true, data: { message: `Notification sent to ${userIds.length} users` } });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

// File Upload
exports.uploadFile = async (req, res) => {
	try {
		console.log('Upload request received:', req.body);
		console.log('File in request:', req.file);
		
		if (!req.file) {
			console.error('No file in request');
			return res.status(400).json({ success: false, error: 'No file uploaded' });
		}

		// Get file information
		const { type, title, description, semester } = req.body;
		
		// Create file URL
		const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.destination.split('/').pop()}/${req.file.filename}`;
		console.log('Generated file URL:', fileUrl);
		
		// Create document record
		const document = new Document({
			type: type || 'document',
			title: title || req.file.originalname,
			description: description || '',
			semester: semester || null,
			fileUrl,
			createdBy: req.user.id,
			updatedAt: Date.now()
		});
		
		await document.save();
		console.log('Document saved:', document);
		
		res.json({ 
			success: true, 
			data: { 
				document,
				file: {
					originalName: req.file.originalname,
					filename: req.file.filename,
					mimetype: req.file.mimetype,
					size: req.file.size,
					path: req.file.path,
					destination: req.file.destination
				}
			} 
		});
	} catch (err) {
		console.error("File upload error:", err);
		res.status(500).json({ success: false, error: err.message });
	}
};

// Payment Management
exports.getPayments = async (req, res) => {
	try {
		const payments = await Payment.find().populate('studentId', 'name email');
		res.json({ success: true, data: payments });
	} catch (err) {
		console.error("Error fetching payments:", err);
		res.status(500).json({ success: false, error: err.message });
	}
};

// Notification System
exports.getNotifications = async (req, res) => {
	try {
		const notifications = await Notification.find({ 
			userModel: 'Admin',
			userId: req.user.id
		}).sort({ createdAt: -1 });
		
		res.json({ success: true, data: notifications });
	} catch (err) {
		console.error("Error fetching notifications:", err);
		res.status(500).json({ success: false, error: err.message });
	}
};
