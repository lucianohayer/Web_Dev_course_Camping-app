var Campground = require('../models/campground');
var Comment = require('../models/comment');

//All the middleware goes here
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = async function (req, res, next) {
	if (req.isAuthenticated()) {
		try {
			const foundCampground = await Campground.findById(req.params.id);
			//Does the user own the campground?
			if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
				next();
			} else {
				req.flash('error', "You don't have permission to do that");
				res.redirect('back');
			}
		} catch (error) {
			req.flash('error', 'Campground not found');
			res.redirect('back');
		}
	} else {
		req.flash('error', 'You need to be logged in to do that');
		res.redirect('back');
	}
};

middlewareObj.checkCommentOwnership = async function (req, res, next) {
	if (req.isAuthenticated()) {
		try {
			const foundComment = await Comment.findById(req.params.comment_id);
			//Does the user own the comment?
			if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
				next();
			} else {
				req.flash('error', "You don't have permission to do that");
				res.redirect('back');
			}
		} catch (error) {
			res.redirect('back');
		}
	} else {
		req.flash('error', 'You need to be logged in to do that');
		res.redirect('back');
	}
};

middlewareObj.isLoggedIn = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	console.log(req.originalUrl);
	req.session.redirectTo = req.originalUrl;
	req.flash('error', 'You need to be logged in to do that');
	res.redirect('/login');
};

module.exports = middlewareObj;
