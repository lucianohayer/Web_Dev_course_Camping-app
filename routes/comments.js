var express = require('express');
var router = express.Router({ mergeParams: true });
var Campground = require('../models/campground');
var Comment = require('../models/comment');
var middleware = require('../middleware');

//Comments New
router.get('/new', middleware.isLoggedIn, async function (req, res) {
	//findcampground by id
	try {
		const campground = await Campground.findById(req.params.id);
		res.render('comments/new', { campground: campground });
	} catch (error) {
		console.log(error);
	}
});

//Comments Create
router.post('/', middleware.isLoggedIn, async function (req, res) {
	try {
		//Lookup campground using Id
		const campground = await Campground.findById(req.params.id);
		try {
			//Create new comment
			const comment = await Comment.create(req.body.comment);
			//add username and id to comment
			comment.author.id = req.user._id;
			comment.author.username = req.user.username;
			//save comment
			await comment.save();
			//Connect new comment to campground
			campground.comments.push(comment);
			await campground.save();
			if (req.xhr) {
				res.json({ campground_id: req.params.id, comment: comment });
			} else {
				req.flash('success', 'Successfully added comment');
				//redirect campground show page
				res.redirect('/campgrounds/' + campground._id);
			}
		} catch (error) {
			req.flash('error', 'Something went wrong');
			console.log(error);
		}
	} catch (error) {
		console.log(error);
		res.redirect('/campgrounds');
	}
});

//Comment Edit
router.get(
	'/:comment_id/edit',
	middleware.checkCommentOwnership,
	async function (req, res) {
		try {
			const foundComment = await Comment.findById(req.params.comment_id);
			if (req.xhr) {
				res.json({ campground_id: req.params.id, comment: foundComment });
			} else {
				res.render('comments/edit', {
					campground_id: req.params.id,
					comment: foundComment,
				});
			}
		} catch (error) {
			res.redirect('back');
		}
	}
);

//Comment Update
router.put(
	'/:comment_id',
	middleware.checkCommentOwnership,
	async function (req, res) {
		try {
			const updatedComment = await Comment.findByIdAndUpdate(
				req.params.comment_id,
				req.body.comment,
				{ new: true }
			);
			if (req.xhr) {
				res.json({ campground_id: req.params.id, comment: updatedComment });
			} else {
				req.flash('success', 'Thanks for update your comment');
				res.redirect('/campgrounds/' + req.params.id);
			}
		} catch (error) {
			req.flash('error', 'Something went wrong .. :(');
			res.redirect('back');
		}
	}
);

//Comment Destroy
router.delete(
	'/:comment_id',
	middleware.checkCommentOwnership,
	async function (req, res) {
		try {
			const commentFound = await Comment.findByIdAndRemove(
				req.params.comment_id
			);
			if (req.xhr) {
				res.json(commentFound);
			} else {
				req.flash('success', 'Comment deleted');
				res.redirect('/campgrounds/' + req.params.id);
			}
		} catch (error) {
			res.redirect('back');
			req.flash('error', 'Something went wrong .. :(');
		}
	}
);

module.exports = router;
