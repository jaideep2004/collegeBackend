const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

dotenv.config();
const app = express();

// CORS configuration
const corsOptions = {
	origin: process.env.FRONTEND_URL || 'http://localhost:5173',
	credentials: true,
	optionsSuccessStatus: 200
};

app.use(cors());

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist
const createDirIfNotExists = (dir) => {
	if (!fs.existsSync(dir)) {
		console.log(`Creating directory: ${dir}`);
		fs.mkdirSync(dir, { recursive: true });
	}
};

// Create upload directories
createDirIfNotExists('uploads');
createDirIfNotExists('uploads/documents');
createDirIfNotExists('uploads/gallery');
createDirIfNotExists('uploads/profiles');
createDirIfNotExists('uploads/results');

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log all requests
app.use((req, res, next) => {
	console.log(`${req.method} ${req.url}`);
	next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/public", require("./routes/public"));
app.use("/api/student", require("./routes/student"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/faculty", require("./routes/faculty"));

// Health check route
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ success: false, error: "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
