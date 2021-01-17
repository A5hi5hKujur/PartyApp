const express = require('express');
const router = express.Router();

// Load User model
const User = require('../models/user');
const Party = require('../models/party');
      

//Authentication middleware are now present in : config->auth.js
const { isLoggedIn, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('landing'));

// function to sort parties according to date (descending order)
function compareDate(party1, party2) {
  if(party1.date < party2.date) 
    return 1;
  else if(party1.date > party2.date)
    return -1;
  else 
    return 0; 
}

// Dashboard
router.get('/dashboard', isLoggedIn, (req, res) => {
  var userParties = req.user.parties;
  let today = new Date();
    let yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    if (mm < 10)
      mm = '0' + mm;
    let dd = today.getDate();
    if (dd < 10)
      dd = '0' + dd;
    let date = yyyy + '-' + mm + '-' + dd;
  Party.find().where('_id').in(userParties).exec((err, parties) => {
    if (err) {
      console.log(err);
      res.redirect('/dashboard');
    } else { //Updating party status
      parties.forEach(function(party){
        let status=partyStatus(party.date);
        if(!(party.status===status)){
          party.status = status;
          party.save(function(err){
            console.log(err);
          });
        }
      });

      // sort parties according to date
      parties.sort(compareDate);

      // push ongoing parties to front
      for(var i=0; i<parties.length; i++) {
        if(parties[i].status === "ongoing") {
          var temp_party = parties[i];
          parties.splice(i, 1);
          parties.unshift(temp_party);
        }
      }

      res.render('index', {parties: parties, todayDate:date,user:req.user});
    }
  });
});

//------------------------------------------------------------------------------

//----------------------Party Status Function-----------------------------------
function partyStatus(partyDate){
  let today = new Date();
    let yyyy = Number(today.getFullYear());
    let mm = Number(today.getMonth()) + 1;
    let dd = Number(today.getDate());
    let p_yyyy = Number(partyDate.getFullYear());
    let p_mm = Number(partyDate.getMonth()) + 1;
    let p_dd = Number(partyDate.getDate());
  let status;
  if(yyyy>p_yyyy){
    status="past";
  }
  else if(yyyy<p_yyyy){
    status="upcoming";
  }
  else{
    if(mm>p_mm){
      status="past";
    }
    else if(mm<p_mm){
      status="upcoming";
    }
    else{
      if(dd>p_dd){
        status="past";
      }
      else if(dd<p_dd){
        status="upcoming";
      }
      else{
        status="ongoing";
      }
    }
  }
  return status;
}

module.exports = router;
