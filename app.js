//Declare and initialize express
var express = require("express");
var app = express();

//Declare and use body-parser
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Declare Mongoose
var mongoose = require('mongoose');
//mongoose.connect("mongodb://localhost/yelp_camp");
//var url = process.env.DATABASE || "mongodb://localhost/yelp_camp"
//mongoose.connect(url);


var uriConnect = process.env.DATABASE || "mongodb://localhost/yelp_camp"
mongoose.connect(uriConnect, { useMongoClient: true });


//Declare Flash 
var flash = require("connect-flash");

//Declare Moment
app.locals.moment = require('moment');

//Declare passport
var passport = require("passport");
var LocalStrategy = require("passport-local");

//Declare Method Override
var methodOverride = require("method-override");

//Set the view engine to ejs
app.set('view engine', 'ejs');

//Imports
var Campground = require("./models/campground");
var Comment = require("./models/comment");
var seedDB = require("./seeds");
var User = require("./models/user");

//Requering Routes
var commentRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var indexRoutes = require("./routes/index");

app.use(express.static(__dirname + "/public"));

app.use(methodOverride("_method"));
//Seeds the database
//seedDB();

app.use(flash());

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
    console.log('The Yelp Camp server has started ..');
});
//app.listen(3000, function() {
//  console.log('Server running on port 3000');
//});


    