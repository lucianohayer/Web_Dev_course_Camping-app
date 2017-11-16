var express = require("express");
var router = express.Router();
var Campground = require("../models/campground"); 
var middleware = require("../middleware");
var geocoder = require("geocoder");



//INDEX - Show all campgrounds
router.get('/', function(req,res){
    //GET ALL CAMPGROUNDS FROM DB
    if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all campgrounds from DB
      Campground.find({name: regex}, function(err, allCampgrounds){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allCampgrounds);
         }
      });
  } else {
      // Get all campgrounds from DB
      Campground.find({}, function(err, allCampgrounds){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allCampgrounds);
            } else {
              res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
            }
         }
      });
  }
});


//CREATE - add new campground to DB 
router.post('/', middleware.isLoggedIn, function(req,res){
    //get data from forms and add to campgrounds array
    var name = req.body.name;    
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
                    id: req.user._id,
                    username: req.user.username
    };
    geocoder.geocode(req.body.location, function (err, data) {
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        
        var newCampground = {name: name, price: price, image: image, description: desc, author: author, location: location, lat: lat, lng: lng};
        //Create a new campground and save to the DB
        Campground.create(newCampground, function(err, newlyCreated){
            if(err){
                console.log(err);
                req.flash("error","Something went wrong .. :(");
            } else {
                //redirect back to campgrounds page
                req.flash("success","Campground created!");
                res.redirect("/campgrounds");        
            }
        });
    });
});

//NEW - show form to create campground
router.get('/new', middleware.isLoggedIn, function(req,res){
    res.render("campgrounds/new");
}); 

//SHOW - More info about one campground
router.get('/:id', function(req,res){
    //Find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            //Render show template with that campground
            res.render('campgrounds/show', {campground: foundCampground});        
        }
    });
});

//EDIT - Edit an existing campground
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

//UPDATE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    console.log(req.body);
    geocoder.geocode(req.body.campground.location, function (err, data) {
        console.log(data);
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        var newData = {name: req.body.campground.name, image: req.body.campground.image, description: req.body.campground.description, price: req.body.campground.price, location: location, lat: lat, lng: lng};
        //find and save de campground
        console.log(newData);
        Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, updatedCampground){
            if(err){
                req.flash("error","Something went wrong .. :(");
                res.redirect("/campgrounds");
            } else {
                //redirect showpage
                req.flash("success","Campground edited succesfully");
                res.redirect("/campgrounds/" + req.params.id);
            }
        });
    });
});

//DESTROY campground route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            req.flash("error","Something went wrong .. :(");
            res.redirect("/campgrounds");
        } else {
            req.flash("success","Campground deleted");
            res.redirect("/campgrounds");
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");       
};


module.exports = router;