var nodemailer = require("nodemailer");
require("dotenv").config();

var transporter = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: process.env.USER,
		pass: process.env.APP_PASSWORD,
	},
});

var mailOptions = {
	from: {
		name: "Guru Mantra",
		address: process.env.USER,
	},
	to: [
		"yashanant.2710@gmail.com",
		"aditi2003sharma@gmail.com",
		"anushthakumari12345@gmail.com",
		"priyavatsh05@gmail.com",
		"senabhishk@gmail.com",
	],
	subject: "A heartfelt appreciation for your dedication and excellence",
	text: "Dear Teacher,\n\nI am writing to express my sincere appreciation for your exceptional work as a teacher at [Institute Name]. Your dedication to your students and your passion for your subject matter have created a truly inspiring learning environment that has profoundly impacted myself and countless others.\n\n I first encountered your brilliance in your [Course Name] class, where your in-depth knowledge of the subject was evident from the very beginning. You have a remarkable ability to break down complex concepts into easily digestible pieces, making even the most challenging topics accessible and engaging. Your lectures are not merely informative; they are thought-provoking and insightful, sparking curiosity and a genuine desire to learn more.\n\nYour dedication extends far beyond the confines of the classroom. You are always available to provide additional support and guidance, whether it be during office hours, after class, or even through email. Your willingness to go the extra mile for your students is truly commendable and demonstrates your genuine commitment to their success.\nBeyond your academic expertise, what truly sets you apart is your dedication to fostering a positive and inclusive learning environment. You create a classroom where every student feels valued and respected, regardless of their background or academic abilities. You encourage open dialogue and critical thinking, and you celebrate the unique perspectives of each individual. This fosters a sense of community and belonging among your students, making the learning process even more enriching.\nThe impact you have had on me is immeasurable. Your passion for [Subject] has rekindled my own interest in the field, and your guidance has been instrumental in my academic development. I am confident that I am not the only one who has benefitted from your exceptional teaching. You have touched the lives of countless students, instilling in them a love for learning and a thirst for knowledge.\n\nThank you, Mr. Teacher, for being such an incredible teacher. Your dedication, expertise, and compassion make you a true role model and an inspiration to us all.\n\nSincerely,\n\nGuru Mantra.",
};

async function sendMail(params) {
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.log(error);
		} else {
			console.log("Email sent: " + info.response);
		}
	});
}

module.exports = sendMail;
