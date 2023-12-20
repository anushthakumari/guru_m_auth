const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// Define User schema
const userSchema = new mongoose.Schema({
	username: String,
	password: String,
	teacher_type: String,
	profile_picture: String,
	email: String,
	doc_url: String,
	aadhar_card_url: String,
	mark_sheet_url: String,
	cert_url: String,
	is_verified: Boolean,
	education: String,
	major: String,
	graduation_year: String,
});

const User = mongoose.model("User", userSchema);

// Define course schema
const courseSchema = new mongoose.Schema({
	user_id: mongoose.Types.ObjectId,
	chapters: Array,
	username: String,
	title: String,
	is_published: Boolean,
	createdAt: { type: Date, default: Date.now },
});

const Courses = mongoose.model("courses", courseSchema);

const assetSchema = new mongoose.Schema({
	type: String,
	filename: String,
	file_url: { type: String, required: true },
	user_name: String,
	desc: String,
	element_type: { type: String, required: true },
	title: String,
	user_id: String,
	is_private: Boolean,
	createdAt: { type: Date, default: Date.now },
});

const Asset = mongoose.model("asset", assetSchema);

const creditSchema = new mongoose.Schema({
	user_id: String,
	credit_points: Number,
	createdAt: { type: Date, default: Date.now },
});

const CreditPoints = mongoose.model("credit_points", creditSchema);

app.use(cors());

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const uploadsDirectory = "uploads";
if (!fs.existsSync(uploadsDirectory)) {
	fs.mkdirSync(uploadsDirectory);
}

// Configure multer for handling file uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDirectory);
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + "-" + file.originalname);
	},
});

const upload = multer({ storage: storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Register user
app.post("/register", async (req, res) => {
	try {
		const { username, password, teacher_type, email, profile_picture } =
			req.body;

		// Check if the username already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(409).json({ message: "email already exists" });
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Save the user to the database
		const newUser = new User({
			username,
			password: hashedPassword,
			teacher_type,
			email,
			profile_picture: profile_picture,
		});
		const u = await newUser.save();

		res.status(201).json(u);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

// Login user
app.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		// Find the user by username
		const user = await User.findOne({ email });

		// Check if the user exists and the password is correct
		if (user && (await bcrypt.compare(password, user.password))) {
			return res.json(user);
		} else {
			return res.status(401).json({ message: "invalid creds!" });
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});

app.put("/edit", async (req, res) => {
	const {
		username,
		email,
		user_id,
		aadhar_card_url,
		cert_url,
		mark_sheet_url,
		is_verified,
		education,
		major,
		graduation_year,
	} = req.body;

	await User.findByIdAndUpdate(
		{
			_id: new mongoose.Types.ObjectId(user_id),
		},
		{
			username,
			email,
			aadhar_card_url,
			mark_sheet_url,
			cert_url,
			is_verified,
			education,
			major,
			graduation_year,
		}
	);

	const d = await User.findById(user_id);

	res.json(d);
});

//courses
app.post("/courses", async (req, res, next) => {
	const { title, user_id, username } = req.body;

	const newCourse = new Courses({
		user_id,
		username,
		title,
		chapters: [],
	});
	const u = await newCourse.save();

	res.send(u);
});

//get course by user id
app.get("/user/:user_id/courses", async (req, res, next) => {
	const { user_id } = req.params;

	const d = await Courses.find({ user_id });

	res.send(d);
});

//get courses
app.get("/courses", async (req, res, next) => {
	const d = await Courses.find();

	res.send(d);
});

//get published courses
app.get("/courses", async (req, res, next) => {
	const d = await Courses.find({ is_published: true });

	res.send(d);
});

//course id
app.get("/courses/:course_id", async (req, res, next) => {
	const { course_id } = req.params;

	const course = await Courses.findById(course_id);

	res.send(course);
});

//edit course
app.put("/courses/:course_id/save", async (req, res, next) => {
	const { course_id } = req.params;
	const { chapters } = req.body;

	const course = await Courses.findByIdAndUpdate(course_id, {
		chapters,
	});

	res.send(course);
});

app.put("/courses/:course_id/publish", async (req, res, next) => {
	const { course_id } = req.params;
	const { chapters, is_published } = req.body;

	await Courses.findByIdAndUpdate(course_id, {
		chapters,
		is_published: Boolean(is_published),
	});

	const course = await Courses.findById(course_id);

	res.send(course);
});

app.get("/user/:user_id/analytics", async (req, res, next) => {
	const { user_id } = req.params;

	const course_count = await Courses.countDocuments({ user_id });
	const resource_count = await Asset.countDocuments({ user_id });
	const credit_points_d = await CreditPoints.findOne({ user_id });

	const courses = await Courses.find({ user_id });

	const courses_stats = [];

	for (const course of courses) {
		courses_stats.push({
			title: course.title,
			chart: {
				labels: ["M", "T", "W", "T", "F", "S", "S"],
				datasets: {
					label: "Student Engagement",
					data: [0, 0, 0, 0, 0, 0, 0],
				},
			},
		});
	}

	res.json({
		course_count,
		resource_count,
		credit_points: credit_points_d?.credit_points || 0,
		student_count: 0,
		courses_stats,
	});
});

app.get("/admin/analytics", async (req, res, next) => {
	const course_count = await Courses.countDocuments();
	const resource_count = await Asset.countDocuments();
	const credit_points_d = await CreditPoints.findOne();

	const courses = await Courses.find();

	const courses_stats = [];

	for (const course of courses) {
		courses_stats.push({
			title: course.title,
			chart: {
				labels: ["M", "T", "W", "T", "F", "S", "S"],
				datasets: {
					label: "Student Engagement",
					data: [0, 0, 0, 0, 0, 0, 0],
				},
			},
		});
	}

	res.json({
		course_count,
		resource_count,
		credit_points: credit_points_d?.credit_points || 0,
		student_count: 0,
		courses_stats,
	});
});

app.get("/user/:user_id/dash", async (req, res, next) => {
	const { user_id } = req.params;

	const credit_points_d = await CreditPoints.findOne({ user_id });
	const courses = await Courses.find({ user_id, is_published: true });
	const resources = await Asset.find({ user_id });

	const credit_points = credit_points_d?.credit_points || 0;

	const stats = {
		student_count: 0,
		credit_points,
		avg_eng: "0%",
		avg_rating: 0,
		badge: "none",
	};

	res.send({
		courses,
		resources,
		stats,
	});
});

app.get("/leaderboard", async (req, res, next) => {
	const usersOrdered = await Courses.aggregate([
		{
			$addFields: {
				chaptersCount: { $size: "$chapters" },
			},
		},
		{
			$sort: { chaptersCount: -1 },
		},
		{
			$project: {
				_id: 0,
				user_id: 1,
				username: 1,
				chaptersCount: 1,
				chapters: 1,
				title: 1,
				is_published: 1,
				createdAt: 1,
			},
		},
	]);

	res.send(usersOrdered);
});

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
