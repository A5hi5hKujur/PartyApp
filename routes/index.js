const express = require('express');
const router = express.Router();

const Party = require('../models/party');

//Authentication middleware are now present in : config->auth.js
const { isLoggedIn, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('landing'));

// Dashboard
router.get('/dashboard', isLoggedIn, (req, res) => {
  Party.find({}, (err, parties) => {
    if (err) {
      console.log(err);
      res.redirect('/dashboard');
    } else {
      res.render('index', 
      {
        parties: parties,
        user: req.user
      });
    }
  });
});

router.get('/dashboard.json', isLoggedIn, (req, res) => {
  Party.find({}, (err, parties) => {
    if (err) {
      console.log(err);
      res.redirect('/dashboard');
    } else {
      res.json(parties);
    }
  });
});

module.exports = router;
