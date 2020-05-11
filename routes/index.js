const express = require('express');
const router = express.Router();

//Authentication middleware are now present in : config->auth.js
const { isLoggedIn, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('landing'));

// Dashboard
router.get('/dashboard', isLoggedIn, (req, res) =>
  res.render('index', {
    user: req.user
  })
);

module.exports = router;
