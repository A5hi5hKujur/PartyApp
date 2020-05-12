var express     = require("express"),
    bodyParser  = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    flash           = require("express-flash"),
    Session         = require("express-session");

var app = express();

//=================
//PASSPORT CONFIG
//=================
//passport setup is now present in : config->passport.js
require("./config/passport")(passport);

//=================
//MONGOOSE CONFIG
//=================
//mongoose setup is now present in : config->keys.js
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

//setup public folder where css is present
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

//=================
//ROUTES
//=================
//Landing And Party User's Dashboard Route is now present in: routes->index.js
app.use('/', require('./routes/index.js'));

//User Authentication : login, register, logout routes are now presnt in: routes->users.js
//routes are : login ->"/users/login", register -> "/users/register" and logout -> "/users/logout"
app.use('/users', require('./routes/users.js'));

// party dashboard
app.get('/party/:id',function(req, res){
  res.render('party');
});
// post route to create a new party
app.post('/party',function(req,res){
  /*
  find the 'status' of the party based on the inputted date.
  inputed_date format : 2018-07-22 (YYYY-MM-DD)
  status : ongoing -> if current date == inputted date.
  status : upcoming -> if current date < inputted date.
  status : past -> if current date > inputted date.
  */
  let inputed_date = req.body.date; //input
  let status; // output
  let today = new Date();
  var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  if(inputed_date == date)
    status = "ongoing";
  else if (date < inputed_date)
    status = "upcomming";
  else
    status = "past";
  let newParty = {
    party_theme : req.body.theme,
    party_name : req.body.name,
    venue : req.body.venue,
    date: req.body.date,
    participants : [{
      id : user._id,
      contribution : 0,
      host : true
    }],
    totalcost : 0,
    totalcontribution : 0,
    items : [],
    hosts : [user._id],
    description : req.body.description,
    status : status
  };
  Party.create(newParty, function(err, party){
    if(err)
    {
      console.log(err);
      res.redirect("/dashboard");
    }
    res.redirect("/party/"+party._id);
  });
});

//WildCard Route
app.get("*",function(req,res){
    res.send("Error! 404 Page Not Found");
});

//To start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT,function(){
    console.log("Party App Is Started!");
});
