var express     = require("express"),
    bodyParser  = require("body-parser"),
    flash       = require("express-flash"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    User            = require("./models/user"),
    bcrypt          = require("bcryptjs"),
    Session         = require("express-session");
    // Party           = require("./models/party"),
    // Item            = require("./models/item"),
    // Participant     = require("./models/participant");

var app = express();

//=================
//PASSPORT CONFIG
//=================
require("./config/passport")(passport);

//=================
//MONGOOSE CONFIG
//=================

//DB Config
const db = require("./config/keys").mongoURI;

//Connect to MongoDB
mongoose.connect(
    db,
    {useNewUrlParser: true,useUnifiedTopology: true,useFindAndModify: false,useCreateIndex: true }
    )
    .then(function(){console.log("MongoDB Connected")})
    .catch(function(err){console.log(err)});

//EJS
app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));

//Express Body Parser
app.use(bodyParser.urlencoded({extended: true}));

//Express Session
app.use(
    Session({
    secret: "This is a party app",
    resave: false,
    saveUninitialized: false
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// // Global variables
// app.use(function(req, res, next) {
//   res.locals.currentUser = req.User; //represents Current Logged in User
//   next();
// });

//=================
//ROUTES
//=================
//Root Route redirect to party page
// app.get("/",function(req,res){
//     res.render("landing");
// });
// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));
//=====================
//PARTY ROUTES
//=====================

//Party Dashboard Route
// app.get("/party",isLoggedIn,function(req,res){
//     res.render("index");
// });

// //Party Show Route
// app.get("/party/:id",isLoggedIn,function(req,res){
//     res.render("show");
// });

//=====================
//AUTHENTICATION ROUTES(login,register)
//=====================

//Register Route
// app.get("/register",function(req,res){
//     res.render("register");
// });

// //Handling Sign Up Logic
// app.post("/register",function(req,res){
//     const { fname, lname, email, password,confirm_password,mobile_no} = req.body;
//     User.findOne({email:email},function(err,user){
//         if(err){
//             console.log(err);
//         }else{
//             if(user){
//                 console.log("Email already registered");
//                 res.redirect("/register");
//             }else{
//                 const newUser = new User({
//                     fname,
//                     lname,
//                     email,
//                     password,
//                     mobile_no
//                 });

//                 bcrypt.genSalt(10, function(err,salt){
//                     bcrypt.hash(newUser.password,salt, function(err,hash){
//                         if(err) throw err;
//                         newUser.password = hash;
//                         newUser
//                             .save()
//                             .then(function(user){
//                                 console.log(user);
//                                 res.redirect("/login");
//                             })
//                             .catch(function(err){
//                                 console.log(err);
//                             });
//                     });
//                 });
//             }
//         }
//     });
// });

// //Login Route
// app.get("/login",function(req,res){
//     res.render("login");
// });

// //Handling Login Logic
// app.post('/login', (req, res, next) => {
//     passport.authenticate('local', {
//       successRedirect: '/party',
//       failureRedirect: '/login',
//     })(req, res, next);
//   });

// //Logout Route
// app.get("/logout",function(req,res){
//     req.logout();
//     // req.flash("success_msg","You are logged out");
//     res.redirect("/");
// });

//WildCard Route
app.get("*",function(req,res){
    res.send("Error! 404 Page Not Found");
});

//To start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT,function(){
    console.log("Party App Is Started!");
});

