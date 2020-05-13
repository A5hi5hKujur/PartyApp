const express = require('express');
const router = express.Router();

// Load User model
const User = require('../models/user');
const Party = require('../models/party');

//Authentication middleware are now present in : config->auth.js
const { isLoggedIn } = require('../config/auth');


// party dashboard
router.get('/:id',isLoggedIn,function(req, res){
  Party.find({_id : req.params.id}, function(err, party)
  {
    if(err)
    {
      console.log(err);
      res.redirect('/dashboard');
    }
    else
    {
      res.render('party',{ party: party[0]});
    }
  });
});


  // post route to create a new party
  router.post('/',isLoggedIn,function(req,res){
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
    let yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    if (mm < 10)
      mm = '0' + mm;
    let dd = today.getDate();
    if (dd < 10)
      dd = '0' + dd;
    let date = yyyy + '-' + mm + '-' + dd;
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
        id : req.user._id,
        contribution : 0,
        host : true
      }],
      totalcost : 0,
      totalcontribution : 0,
      items : [],
      hosts : [req.user._id],
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

  // POST route to add a new item.
  router.post('/:id/item',isLoggedIn,function(req, res)
  {
    let cost = parseFloat(req.body.quantity) * parseFloat(req.body.cost);
    let item = {
      name : req.body.name,
      category : req.body.category,
      quantity : req.body.quantity,
      price : cost,
      priority : req.body.priority,
      purchased : false,
      essential : false
    };

    Party.update({_id : req.params.id},{ $push: { items : item } }, function(err, party)
    {
      if(err)
      {
        console.log(err);
      }
        res.redirect('/party/'+req.params.id);
    });
  });

  module.exports = router;
