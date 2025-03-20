const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Student = require("./models/Student"); // Using Student model for simplicity
const connectDB = require("./config/db");
require("dotenv").config();

const seedAdmin = async () => {
	await connectDB();

	const adminData = {
		rollNumber: "ADMIN001",
		name: "Admin User",
		email: "admin@gmail.com",
		mobile: "+911111111111",
		password: await bcrypt.hash("admin123", 10),
		role: "admin", // Explicitly set role to 'admin'
	};

	const existingAdmin = await Student.findOne({ email: adminData.email });
	if (!existingAdmin) {
		await Student.create(adminData);
		console.log("Admin user created successfully");
	} else {
		console.log("Admin user already exists");
	}

	mongoose.connection.close();
};

seedAdmin().catch((err) => console.error(err));
