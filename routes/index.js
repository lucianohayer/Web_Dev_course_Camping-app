var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Campground = require('../models/campground');
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');

//Root Route
router.get('/', function (req, res) {
	res.render('landing');
});

//Show register form
router.get('/register', function (req, res) {
	res.render('register', { page: 'register' });
});

//Sign up logic
router.post('/register', function (req, res) {
	const newUser = new User({
		username: req.body.username,
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		avatar: req.body.avatar,
	});
	if (req.body.adminCode === 'secret') {
		newUser.isAdmin = true;
	}

	User.register(newUser, req.body.password, function (err, user) {
		if (err) {
			// req.flash("error", err.message);
			return res.render('register', { error: err.message });
		}
		console.log(user);
		passport.authenticate('local')(req, res, function () {
			req.flash('success', 'Welcome to YelpCamp ' + user.username);
			res.redirect('/campgrounds');
		});
	});
});

//Show login form
router.get('/login', function (req, res) {
	res.render('login', { page: 'login' });
});

//Login logic
// router.post("/login", passport.authenticate("local",
//     {
//         successRedirect: "/campgrounds",
//         failureRedirect: "/login",
//         failureFlash: "Username or Password is incorrect.",
//         successFlash: "Welcome Back!"
//     }), function(req, res){
// });

//Login logic
router.post('/login', function (req, res, next) {
	passport.authenticate('local', function (err, user, info) {
		if (err) {
			req.flash('error', err.message);
			return next(err);
		}
		if (!user) {
			req.flash('error', 'Your Email or Password is Incorrect.');
			return res.redirect('/login');
		}
		req.logIn(user, function (err) {
			if (err) {
				req.flash('error', err.message);
				return next(err);
			}
			console.log(req.session.redirectTo);
			req.flash('success', 'Welcome back ' + user.username);
			var redirectTo = req.session.redirectTo
				? req.session.redirectTo
				: '/campgrounds';
			delete req.session.redirectTo;
			res.redirect(redirectTo);
		});
	})(req, res, next);
});

//Logout logic
router.get('/logout', function (req, res) {
	req.logout();
	req.flash('success', 'Logged you out!');
	res.redirect('/campgrounds');
});

// forgot password
router.get('/forgot', function (req, res) {
	res.render('forgot');
});

router.post('/forgot', async function (req, res, next) {
	try {
		let user = null;
		let token = null;
		try {
			const buf = crypto.randomBytes(20);
			token = buf.toString('hex');
		} catch (error) {
			console.log('Error creating token');
			res.redirect('/forgot');
		}
		try {
			user = await User.findOne({ email: req.body.email });
			if (!user) {
				req.flash('error', 'No account with that email address exists.');
				return res.redirect('/forgot');
			}

			user.resetPasswordToken = token;
			user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
			await user.save();
		} catch (error) {
			console.log('Error getting user');
			res.redirect('/forgot');
		}

		try {
			const smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: 'provaNodeJsprova@gmail.com',
					pass: process.env.GMAILPW,
				},
			});

			const mailOptions = {
				to: user.email,
				from: 'provaNodeJsprova@gmail.com',
				subject: 'Node.js Password Reset',
				text:
					'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
					'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
					'http://' +
					req.headers.host +
					'/reset/' +
					token +
					'\n\n' +
					'If you did not request this, please ignore this email and your password will remain unchanged.\n',
			};
			await smtpTransport.sendMail(mailOptions);
			console.log('mail sent');
			req.flash(
				'success',
				'An e-mail has been sent to ' +
					user.email +
					' with further instructions.'
			);
			next();
		} catch (error) {
			console.log('Error sending mail');
			res.redirect('/forgot');
		}
	} catch (error) {
		console.log('General error');
		res.redirect('/forgot');
	}
});

//Reset Password
router.get('/reset/:token', async function (req, res) {
	try {
		const user = await User.findOne({
			resetPasswordToken: req.params.token,
			resetPasswordExpires: { $gt: Date.now() },
		});
		if (!user) {
			req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('/forgot');
		}
		res.render('reset', { token: req.params.token });
	} catch (error) {
		console.log(error);
	}
});

router.post('/reset/:token', async function (req, res) {
	try {
		const user = await User.findOne({
			resetPasswordToken: req.params.token,
			resetPasswordExpires: { $gt: Date.now() },
		});

		if (!user) {
			req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('back');
		}

		console.log(req.body);
		if (req.body.password === req.body.confirm) {
			await user.setPassword(req.body.password, async function (err) {
				user.resetPasswordToken = undefined;
				user.resetPasswordExpires = undefined;

				await user.save();
				req.logIn(user, async function () {
					const smtpTransport = nodemailer.createTransport({
						service: 'Gmail',
						auth: {
							user: 'provaNodeJsprova@gmail.com',
							pass: process.env.GMAILPW,
						},
					});
					const mailOptions = {
						to: user.email,
						from: 'provaNodeJsprova@gmail.com',
						subject: 'Your password has been changed',
						text:
							'Hello,\n\n' +
							'This is a confirmation that the password for your account ' +
							user.email +
							' has just been changed.\n',
					};
					await smtpTransport.sendMail(mailOptions);
					req.flash('success', 'Success! Your password has been changed.');
				});
			});
		} else {
			req.flash('error', 'Passwords do not match.');
			return res.redirect('back');
		}
	} catch (error) {
		res.redirect('/campgrounds');
	}
});

//User Profile
router.get('/users/:id', async function (req, res) {
	try {
		const foundUser = await User.findById(req.params.id);
		try {
			const campgrounds = await Campground.find()
				.where('author.id')
				.equals(foundUser._id)
				.exec();
			res.render('users/show', {
				user: foundUser,
				campgrounds: campgrounds,
			});
		} catch (error) {
			req.flash('error', 'Something went wrong');
			res.redirect('/');
		}
	} catch (error) {
		req.flash('error', 'Something went wrong');
		res.redirect('/');
	}
});

module.exports = router;
