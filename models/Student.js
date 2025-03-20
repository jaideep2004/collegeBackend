const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
	{
		rollNumber: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		mobile: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		fatherName: { type: String, required: true },
		motherName: { type: String, required: true },
		address: { type: String, required: true },
		city: { type: String, required: true },
		state: { type: String, required: true }, 
		pinCode: { type: String, required: true },
		dob: { type: Date, required: true },
		gender: { type: String, required: true },
		category: { type: String, required: true },
		role: { type: String, default: "student" },
		courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
		resetToken: { type: String },
		resetTokenExpiry: { type: Date }
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
