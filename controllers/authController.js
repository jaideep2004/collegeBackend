const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const { sendEmail } = require("../utils/notify");
const Notification = require("../models/Notification");

exports.register = async (req, res) => {
	const {
		rollNumber,
		name,
		email,
		mobile,
		password,
		role = "student",
		...additionalFields
	} = req.body;
	try {
		const Model = role === "faculty" ? Faculty : Student;
		let user = await Model.findOne({ email });
		if (user)
			return res
				.status(400)
				.json({ success: false, error: "User already exists" });

		// Pass all fields from req.body, including additionalFields for Student model
		user = new Model({
			rollNumber,
			name,
			email,
			mobile,
			password: await bcrypt.hash(password, 10), // Hash password separately
			role,
			...additionalFields, // Spread additional fields like fatherName, motherName, etc.
		});
		await user.save();

		const payload = { user: { id: user.id, role: user.role } };
		const token = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		// Send confirmation
		await sendEmail(
			email,
			"Registration Successful",
			`Welcome, ${name}! Your account is created.`
		);

		await new Notification({
			userId: user.id,
			userModel: role === "faculty" ? "Faculty" : "Student",
			message: "Registration successful",
			type: "in-app",
		}).save();

		res.json({ success: true, token });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.login = async (req, res) => {
	const { email, password } = req.body;
	try {
		let user =
			(await Student.findOne({ email })) || (await Faculty.findOne({ email }));
		if (!user)
			return res
				.status(400)
				.json({ success: false, error: "Invalid credentials" });

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch)
			return res
				.status(400)
				.json({ success: false, error: "Invalid credentials" });

		const payload = { user: { id: user.id, role: user.role } };
		const token = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: "5h",
		}); 

		res.json({ success: true, token });
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		// Check if user exists
		const user = await Student.findOne({ email }) || await Faculty.findOne({ email });
		if (!user) {
			return res.status(404).json({ success: false, error: "User not found" });
		}

		// Generate reset token
		const resetToken = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);

		// Store reset token in user document
		user.resetToken = resetToken;
		user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
		await user.save();

		// Send reset email
		const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
		await sendEmail(
			email,
			"Password Reset Request",
			`Please click the following link to reset your password: ${resetLink}`
		);

		res.json({
			success: true,
			message: "Password reset link sent to your email"
		});
	} catch (err) {
		console.error("Forgot password error:", err);
		res.status(500).json({ success: false, error: err.message });
	}
};

exports.validateResetToken = async (req, res) => {
	const { token } = req.body;
	try {
		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		
		// Find user with this token
		const user = await Student.findOne({
			_id: decoded.userId,
			resetToken: token,
			resetTokenExpiry: { $gt: Date.now() }
		}) || await Faculty.findOne({
			_id: decoded.userId,
			resetToken: token,
			resetTokenExpiry: { $gt: Date.now() }
		});

		if (!user) {
			return res.status(400).json({ 
				success: false, 
				error: "Invalid or expired reset token" 
			});
		}

		res.json({ success: true });
	} catch (err) {
		res.status(400).json({ success: false, error: "Invalid token" });
	}
};

exports.resetPassword = async (req, res) => {
	const { token, password } = req.body;
	try {
		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		
		// Find user with this token
		const user = await Student.findOne({
			_id: decoded.userId,
			resetToken: token,
			resetTokenExpiry: { $gt: Date.now() }
		}) || await Faculty.findOne({
			_id: decoded.userId,
			resetToken: token,
			resetTokenExpiry: { $gt: Date.now() }
		});

		if (!user) {
			return res.status(400).json({ 
				success: false, 
				error: "Invalid or expired reset token" 
			});
		}

		// Update password
		user.password = await bcrypt.hash(password, 10);
		user.resetToken = undefined;
		user.resetTokenExpiry = undefined;
		await user.save();

		// Send confirmation email
		await sendEmail(
			user.email,
			"Password Reset Successful",
			"Your password has been reset successfully."
		);

		res.json({ 
			success: true, 
			message: "Password reset successful" 
		});
	} catch (err) {
		res.status(500).json({ success: false, error: err.message });
	}
};
