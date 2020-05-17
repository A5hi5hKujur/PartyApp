const express = require('express');
const router = express.Router();

// Load User model
const User = require('../models/user');
const Party = require('../models/party');
      

//Authentication middleware are now present in : config->auth.js
const { isLoggedIn, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('landing'));

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
    } else {
      res.render('index', {parties: parties, todayDate:date,user:req.user});
    }
  });
});

// Dashboard sort-section route to handle asynchronous toggle
router.get('/dashboard.json', isLoggedIn, (req, res) => {
  var userParties = req.user.parties;
  Party.find().where('_id').in(userParties).exec((err, parties) => {
    if (err) {
      console.log(err);
      res.redirect('/dashboard');
    } else {
      if(req.xhr) {
        res.json(parties);
      } else {
        res.render('index', {parties: parties});
      }
    }
  });
});

module.exports = router;
