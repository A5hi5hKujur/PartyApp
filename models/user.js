var mongoose              = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    // user: {
    //     fname: String,
    //     lname: String,
    //     email: String,
    //     mobile_no: String
    // },
    username: String,
    password: String
    
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);