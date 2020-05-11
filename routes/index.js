const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('landing'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.render('index', {
    user: req.user
  })
);

module.exports = router;
