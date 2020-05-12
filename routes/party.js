const express = require('express');
const router = express.Router();

// Load User model
const User = require('../models/user');
const Party = require('../models/party');

//Authentication middleware are now present in : config->auth.js
const { isLoggedIn } = require('../config/auth');


// party dashboard
app.get('/:id',isLoggedIn,function(req, res){
    res.render('party');
  });


  // post route to create a new party
  app.post('/',isLoggedIn,function(req,res){
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
