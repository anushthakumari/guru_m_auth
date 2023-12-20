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
});

const Courses = mongoose.model("courses", courseSchema);

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

app.get("/stats", async (req, res) => {
	const course_count = await Courses.countDocuments();
	const student_count = await Courses.countDocuments();

	const randomCourse = await Courses.aggregate([{ $sample: { size: 1 } }]);

	res.send({
		course_count,
		student_count,
	});
});

// // Upload profile picture
// app.post("/upload", upload.single("profilePicture"), async (req, res) => {
// 	try {
// 		const { username } = req.body;

// 		// Find the user by username
// 		const user = await User.findOne({ username });

// 		// Check if the user exists
// 		if (!user) {
// 			return res.status(404).json({ message: "User not found" });
// 		}

// 		// Convert the uploaded file to a data URL
// 		const profilePicture = `data:image/png;base64,${req.file.buffer.toString(
// 			"base64"
// 		)}`;

// 		// Update the user's profile picture
// 		user.profilePicture = profilePicture;
// 		await user.save();

// 		res.json({ message: "Profile picture uploaded successfully" });
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ message: "Internal Server Error" });
// 	}
// });

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});

// const raw_chapters = [
// 	[
// 		{
// 			type: "index",
// 			value: 1,
// 		},
// 		{
// 			type: "section_title",
// 			element_id: "4a3a3d8f-07c6-4664-8ced-e810260ca0a9",
// 			index: 0,
// 			value: "chapter title 2",
// 		},
// 		{
// 			file_url:
// 				"https://ingenral.com/media/blog_images/1703006561273_heart_image.webp",
// 			asset_id: "65813eebfb96361bffdc017c",
// 			asset_userame: "Jai Shankar",
// 			asset_is_private: false,
// 			type: "image",
// 			element_id: "436c8ab6-23be-4bd5-b821-080ba84143ce",
// 			index: 2,
// 		},
// 		{
// 			file_url:
// 				"https://ingenral.com/media/blog_images/1703006420371_heart_101.mp4",
// 			asset_id: "658150046e92d8d3287d9ea9",
// 			asset_is_private: false,
// 			type: "video",
// 			element_id: "f2655c97-a840-4280-a255-8b4225332640",
// 			index: 3,
// 		},
// 	],
// 	[
// 		{
// 			type: "index",
// 			value: 2,
// 		},
// 		{
// 			type: "section_title",
// 			element_id: "a68be9f4-07a9-42e1-b5c7-d121e0cee8a2",
// 			index: 0,
// 			value: "chapter title 3",
// 		},
// 		{
// 			file_url: "/realistic_human_heart.glb",
// 			asset_id: "randomstrin1",
// 			asset_userame: "Jai Shankar",
// 			asset_is_private: false,
// 			type: "model",
// 			element_id: "f2a8564f-2a3b-491b-9c30-85840be9108e",
// 			index: 2,
// 		},
// 	],
// 	[
// 		{
// 			type: "index",
// 			value: 0,
// 		},
// 		{
// 			type: "section_title",
// 			element_id: "2c9ec19e-d7a0-47c7-a50f-c8de750b1fa4",
// 			index: 0,
// 			value: "This is chapter title1",
// 		},
// 		{
// 			type: "heading",
// 			element_id: "bcce88b4-5dbe-46a1-9439-0078e577dbe0",
// 			index: 2,
// 			value: "This is heading",
// 		},
// 		{
// 			type: "desc",
// 			element_id: "09c5e21f-2ccf-4ba2-aa3a-26fd8ddc9895",
// 			index: 3,
// 			value:
// 				"<p><strong>I am ready to go and this is a description</strong></p>\n",
// 		},
// 	],
// ];

// const newCourse = new Courses({
// 	user_id: "65819fbcc1eba10b2fb4cb3c",
// 	chapters: raw_chapters,
// 	username: "Vishnatham Desai",
// });
// const u = await newCourse.save();

// res.end();

// return;
