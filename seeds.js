var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

//function seeds()
var data = [
        {
            name: "Tree heavens", 
            image: "http://www.photosforclass.com/download/6142484013", 
            description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Modi earum ipsam accusantium quo sapiente. Velit, consequatur, repellat, culpa nesciunt reprehenderit qui dicta nihil rem nisi sequi voluptatibus autem neque officia."
        },
        {
            name: "The rocks", 
            image: "http://www.photosforclass.com/download/3493312828", 
            description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Modi earum ipsam accusantium quo sapiente. Velit, consequatur, repellat, culpa nesciunt reprehenderit qui dicta nihil rem nisi sequi voluptatibus autem neque officia."
        },
        {
            name: "The big foot", 
            image: "https://farm4.staticflickr.com/3189/3062178880_4edc3b60d5.jpg", 
            description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Modi earum ipsam accusantium quo sapiente. Velit, consequatur, repellat, culpa nesciunt reprehenderit qui dicta nihil rem nisi sequi voluptatibus autem neque officia."
        }
    ];
function seedDB(){
    //REMOVE ALL CAMPGROUNDS
    Campground.remove({}, function(err){
        if(err){
            console.log(err);
        } else {
            console.log ("Campgrounds delete");
            //ADD A FEW CAMPGROUNDS
            data.forEach(function(seed){
                Campground.create(seed, function(err, campground){
                    if(err){
                        console.log(err);
                    } else {
                        console.log("Added a Campground");
                        //ADD A FEW COMMENTS
                        Comment.create({text: "This place is great, but I wish there was internet", author: "Homer"}, function(err, comment){
                            if(err){
                                console.log(err);
                            } else {
                                campground.comments.push(comment);
                                campground.save();
                                console.log("Comment created");
                            }
                        });
                    }
                });                
            });
        }
    });
};



module.exports = seedDB;