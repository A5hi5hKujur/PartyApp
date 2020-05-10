var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    // flash       = require("express-flash"),
    // methodOverride  = require("method-override"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    User            = require("./models/user");
    // Party           = require("./models/party"),
    // Item            = require("./models/item"),
    // Participant     = require("./models/participant");

app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended: true}));
// app.use(methodOverride("_method"));
// app.use(flash());

//=================
//MONGOOSE SETUP
//=================

mongoose.set("useUnifiedTopology",true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
// mongoose.connect("mongodb://localhost/partyApp",{useNewUrlParser: true});
mongoose.connect("mongodb+srv://ravi:ravikumar@cluster0-nwcfy.mongodb.net/test?retryWrites=true&w=majority",{useNewUrlParser: true});

//=================
//PASSPORT SETUP
//=================
app.use(require("express-session")({
    secret: "This is a party app",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req,res,next){
    res.locals.currentUser = req.User; //represents Current Logged in User
    next();
})

//=================
//ROUTES
//=================
//Root Route redirect to party page
app.get("/",function(req,res){
    res.render("landing");
});

//=====================
//PARTY ROUTES
//=====================

//Party Dashboard Route
app.get("/party",function(req,res){
    res.render("index");
});

//Party Show Route
app.get("/party/:id",isLoggedIn,function(req,res){
    res.render("show");
});

//=====================
//AUTHENTICATION ROUTES(login,register)
//=====================

//Register Route
app.get("/register",function(req,res){
    res.render("register");
});

//Handling Sign Up Logic
app.post("/register",function(req,res){
    var newUser = new User({username: req.body.username});
    User.register(newUser,req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        passport.authenticate("local")(req,res,function(){
            res.redirect("/party");
        });
    });
});

//Login Route
app.get("/login",function(req,res){
    res.render("login");
});

//Handling Login Logic
app.post("/login",passport.authenticate("local",
    {
        successRedirect:"/party",
        failureRedirect:"/login"
    }),
    function(req,res){
});

//Logout Route
app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

//WildCard Route
app.get("*",function(req,res){
    res.send("Error! 404 Page Not Found");
});

//To start the server
app.listen(3000,function(){
    console.log("Party App Is Started!");
});

//=====================
//MIDDLEWARE
//=====================
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}
