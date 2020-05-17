const express = require('express');
const router = express.Router();


// Load User model
const User = require('../models/user');
const Party = require('../models/party');

//Authentication middleware are now present in : config->auth.js
const { isLoggedIn } = require('../config/auth');


//----------------- party dashboard ------------------------------------------
router.get('/:id',isLoggedIn,function(req, res){
  Party.findById(req.params.id, function(err, party)
  {
    if(err)
    {
      console.log(err);
      res.redirect('/dashboard');
    }
    else
    {
      var participants_id =[];
      party.participants.forEach(function(participant){
        participants_id.push(participant.id);
      });
      var sum = 0;
      party.items.forEach(function(item) {
        sum += item.price;
      });
      var average = sum/party.participants.length;
      var host ={};
      User.find().where('_id').in(participants_id).exec((err, users) => {
        if (err) {
          console.log(err);
          res.redirect('/dashboard');
        } else {
          users.forEach(function(user){
            if(user._id.equals(party.hosts[0])){
              host=user;
            }
          });
          // Sort users details by _id (for name)
          users.sort(function(a, b) {
            if (a._id > b._id) {
              return 1;
            } else {
              return -1;
            }
          });
          // Sort participants by id (for contribution)
          party.participants.sort(function(a, b) {
            if (a.id > b.id) {
              return 1;
            } else {
              return -1;
            }
          });
          var currentPartyUser = party.participants.find(obj => {
            return obj.id.toString() === req.user._id.toString();
          });          
          res.render('party', {
            party: party,
            users: users,
            host: host,
            currentUser: req.user,
            currentUserContri: currentPartyUser.contribution,
            averageContri: average
          });
        }
      });
    }
  });
});
//------------------------------------------------------------------------------

//---------------------- post route to create a new party ----------------------
  router.post('/',isLoggedIn,function(req,res)
  {
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
      status = "upcoming";
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
      totalpurchased: 0,
      items : [],
      hosts : [req.user._id],
      description : req.sanitize(req.body.description),
      status : status
    };
    Party.create(newParty, function(err, party){
      if(err)
      {
        console.log(err);
        res.redirect("/dashboard");
      }
      let new_party = party._id;  // newly created party id
      User.findById(req.user._id, function(err, user)  // find logged in user
      {
        if(err) console.log(err);
        else
        {
          user.parties.push(new_party);  // push new data to the found user.
          user.save(function(err,user){
            if(err){
              console.log(err);
            }
          });
          res.redirect("/party/"+party._id); // redirect to newly created party.
        }
      });
    });
  });
//------------------------------------------------------------------------------

//----------------------- POST ROUTE TO ADD NEW USER TO PARTY ------------------
  router.post('/:id/user',isLoggedIn,function(req, res)
  {
    User.findById(req.user._id, function(err, user)
    {
      if(err) console.log(err);
      else
      {
        user.parties.push(req.params.id);  // parameter id contains the party id that the user wants to join.
        user.save(function(err,user)
        {
          if(err){
            console.log(err);
          }
          Party.findById(req.params.id, function(err, party)  // find party to be joined.
          {
            if(err) console.log(err);
            else
            {
              let participant = {
                id : req.user._id,
                contribution : 0,
                host : false
              }
              party.participants.push(participant);  // push new user to found party.
              party.save(function(err,user){
                if(err){
                  console.log(err);
                }
              });
              res.redirect("/party/"+req.params.id); // redirect joined party.
            }
          });
        });
      }
    });
  });
//------------------------------------------------------------------------------

//------------------- POST route to add a new item -----------------------------
  router.post('/:id/item', isLoggedIn, function(req, res) {
    let cost = parseFloat(req.body.quantity) * parseFloat(req.body.cost);
    let newItem = {
      name : req.body.name,
      category : req.body.category,
      quantity : req.body.quantity,
      price : cost,
      priority : req.body.priority,
      purchased : false,
      essential : false
    };
    Party.findOneAndUpdate({_id: req.params.id}, {
        $push: { items : newItem },
        $inc: { totalcost: newItem.price}
      }, {new: true}, function(err, party) {
      if(err) {
        console.log(err);
        res.redirect('/party/' + req.params.id);
      } else {
        if(req.xhr) {
          res.json({
            item: party.items[party.items.length - 1],
            party: party,
            user: req.user,
            host: party.hosts[0]
          });
        } else {
          res.redirect('/party/' + req.params.id);
        }
      }
    });
  });
//------------------------------------------------------------------------------

//------------------- PUT route to update item list ----------------------------
router.put('/:id/item/delete', isLoggedIn, function(req, res) {
  var price = parseFloat(req.body.price);
  Party.findOneAndUpdate({_id: req.params.id}, {
      $pull: { items : {_id: req.body.id} },
      $inc: { totalcost: - price}
    }, {new: true}, function(err, party) {
    if(err) {
      console.log(err);
      res.redirect('/party/' + req.params.id);
    } else {
      if(req.xhr) {
        res.json(party);
      } else {
        res.redirect('/party/' + req.params.id);
      }
    }
  });
});
//------------------------------------------------------------------------------

//--------------------------- POST ROUTE TO PURCHASE AN ITEM -------------------

 router.post('/:party_id/purchase/:item_id', isLoggedIn, function(req, res)
 {
   let party_id = req.params.party_id;
   let item_id = req.params.item_id;
   Party.findById(party_id, function(err, party) //call back
   {
     if(err) console.log(err);
     else
      {
        party.items[req.body.item_index].purchased = req.body.purchase;  // push new user to found party.
        if(req.body.purchase === 'true') {
          party.totalpurchased += parseFloat(req.body.item_cost);
        } else {
          party.totalpurchased -= parseFloat(req.body.item_cost);
        }
        party.save(function(err,user)
        {
          if(err) console.log(err);
          else res.redirect("/party/"+party_id); // redirect joined party.
        });
      }
   });
 });
//------------------------------------------------------------------------------


//--------------------------- POST ROUTE TO ADD CONTRIBUTION FROM PARTICIPANTS -------------------
 router.post('/:party_id/contribution', isLoggedIn, function(req, res)
 {
    Party.findById(req.params.party_id,function(err,party){
        if(err){
          console.log(err);
          res.redirect("/dashboard");
        }else{
          party.participants.forEach(function(participant){
            if(participant.id.equals(req.user._id)){
              participant.contribution+=Number(req.body.contribution_amt);
              party.totalcontribution+=Number(req.body.contribution_amt);
            }
          });
          party.save(function(err){
            if(err) {
              console.log(err);
            }
          });
          if(req.xhr) {
            console.log(req.user);
            
            res.json({
              party: party,
              user: req.user,
              contribution: req.body.contribution_amt
            });
          } else {
            res.redirect("/party/"+req.params.party_id);
          }
        }
    });
 });
//------------------------------------------------------------------------------

//------------------- PUT route to edit description-----------------------------
router.put('/:id/description', isLoggedIn, function(req, res) {  
  req.body.description = req.sanitize(req.body.description);  
  Party.findOneAndUpdate({_id: req.params.id}, {
      $set: {description: req.body.description}
    }, {new: true}, function(err, party) {
    if(err) {
      console.log(err);
      res.redirect('/party/' + req.params.id);
    } else {
      if(req.xhr) {
        res.json(party);
      } else {
        res.redirect('/party/' + req.params.id);
      }
    }
  });
});
//------------------------------------------------------------------------------

module.exports = router;
