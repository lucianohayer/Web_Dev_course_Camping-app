var express = require('express');
var router = express.Router();
var Campground = require('../models/campground');
var middleware = require('../middleware');
var geocoder = require('geocoder');

//INDEX - Show all campgrounds
router.get('/', async function (req, res) {
	//GET ALL CAMPGROUNDS FROM DB
	if (req.query.search && req.xhr) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		// Get all campgrounds from DB
		try {
			const allCampgrounds = await Campground.find({ name: regex });
			res.status(200).json(allCampgrounds);
		} catch (error) {
			console.log(err);
		}
	} else {
		// Get all campgrounds from DB
		try {
			const allCampgrounds = await Campground.find({});
			if (req.xhr) {
				res.json(allCampgrounds);
			} else {
				res.render('campgrounds/index', {
					campgrounds: allCampgrounds,
					page: 'campgrounds',
				});
			}
		} catch (error) {
			console.log(err);
		}
	}
});

//CREATE - add new campground to DB
router.post('/', middleware.isLoggedIn, async function (req, res) {
	//get data from forms and add to campgrounds array
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var desc = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username,
	};
	geocoder.geocode(req.body.location, async function (err, data) {
		let lat = null;
		let lng = null;
		let location = null;

		if (data && data.results && data.results.length) {
			lat = data?.results[0]?.geometry?.location?.lat;
			lng = data.results[0].geometry.location.lng;
			location = data.results[0].formatted_address;
		}

		const newCampground = {
			name: name,
			price: price,
			image: image,
			description: desc,
			author: author,
			location: location,
			lat: lat,
			lng: lng,
		};
		//Create a new campground and save to the DB
		try {
			await Campground.create(newCampground);
			//redirect back to campgrounds page
			req.flash('success', 'Campground created!');
			res.redirect('/campgrounds');
		} catch (error) {
			console.log(err);
			req.flash('error', 'Something went wrong .. :(');
		}
	});
});

//NEW - show form to create campground
router.get('/new', middleware.isLoggedIn, function (req, res) {
	res.render('campgrounds/new');
});

//SHOW - More info about one campground
router.get('/:id', async function (req, res) {
	//Find the campground with provided ID

	try {
		const foundCampground = await Campground.findById(req.params.id)
			.populate('comments')
			.exec();
		//Render show template with that campground
		res.render('campgrounds/show', { campground: foundCampground });
	} catch (error) {
		console.log(err);
	}
});

//EDIT - Edit an existing campground
router.get(
	'/:id/edit',
	middleware.checkCampgroundOwnership,
	async function (req, res) {
		try {
			const foundCampground = await Campground.findById(req.params.id);
			res.render('campgrounds/edit', { campground: foundCampground });
		} catch (error) {
			console.log(error);
		}
	}
);

//UPDATE
router.put(
	'/:id',
	middleware.checkCampgroundOwnership,
	async function (req, res) {
		geocoder.geocode(req.body.campground.location, async function (err, data) {
			let lat = null;
			let lng = null;
			let location = null;

			if (data && data.results && data.results.length) {
				lat = data.results[0].geometry.location.lat;
				lng = data.results[0].geometry.location.lng;
				location = data.results[0].formatted_address;
			}
			var newData = {
				name: req.body.campground.name,
				image: req.body.campground.image,
				description: req.body.campground.description,
				price: req.body.campground.price,
				location: location,
				lat: lat,
				lng: lng,
			};
			//find and save de campground
			try {
				const updatedCampground = await Campground.findByIdAndUpdate(
					req.params.id,
					{ $set: newData }
				);
				//redirect showpage
				req.flash('success', 'Campground edited succesfully');
				res.redirect('/campgrounds/' + req.params.id);
			} catch (error) {
				req.flash('error', 'Something went wrong .. :(');
				res.redirect('/campgrounds');
			}
		});
	}
);

//DESTROY campground route
router.delete(
	'/:id',
	middleware.checkCampgroundOwnership,
	async function (req, res) {
		try {
			await Campground.findByIdAndRemove(req.params.id);
			req.flash('success', 'Campground deleted');
			res.redirect('/campgrounds');
		} catch (error) {
			req.flash('error', 'Something went wrong .. :(');
			res.redirect('/campgrounds');
		}
	}
);

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = router;
