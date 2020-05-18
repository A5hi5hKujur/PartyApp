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
              return -1;
            } else {
              return 1;
            }
          });
          // Sort participants by id (for contribution)
          party.participants.sort(function(a, b) {
            if (a.id > b.id) {
              return -1;
            } else {
              return 1;
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
        host : true,
        balance: 0
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
/*
  This route needs to be reworked.
  Every new user must be added into every COMMON item's consumer list.
*/
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
                host : false,
                balance: 0
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
/*
  This route needs to be reworked :
  1. If item.type == 1 : item is for all.
       and all the participants of the party need to be added on the item's consumer list.

  2. If item.type == 2 : item is for the logged in user :
      and only he should be added on the item's consumer list.
*/
  router.post('/:id/item', isLoggedIn, function(req, res) {
    let cost = parseFloat(req.body.quantity) * parseFloat(req.body.cost);
    var forall = req.body.type === '1' ? true : false;
    // First consumer is the person who adds the item
    var consumers = [req.user._id];
    let newItem = {
      name : req.body.name,
      category : req.body.category,
      quantity : req.body.quantity,
      price : cost,
      priority : req.body.priority,
      purchased : false,
      essential : false,
      forall: forall,
      consumers: consumers
    };
    Party.findOne({_id: req.params.id}, function(err, party) {
      if(err) {
        console.log(err);
        res.redirect('/party/' + req.params.id);
      } else {
        if(req.xhr) {
          // If the item is general then push all other members
          // and increse balance of each member
          if(forall) {
            var average = newItem.price / party.participants.length;
            party.participants.forEach(function(participant) {
              participant.balance -= average;
              if(!newItem.consumers[0].equals(participant.id)) {
                newItem.consumers.push(participant.id);
              }
            });
          } else {
            // Oterwise increase balance of that member only
            for(var i=0; i<party.participants.length; i++) {
              if(newItem.consumers[0].equals(party.participants[i].id)) {
                party.participants[i].balance -= newItem.price;
              }
            }
          }
          party.items.push(newItem);
          party.totalcost += parseFloat(newItem.price);
          party.save();          
          res.json({
            item: party.items[party.items.length - 1],
            party: party,
            user: req.user,
            host: party.hosts[0],
            itemAdder: newItem.consumers[0]
          });
        } else {
          res.redirect('/party/' + req.params.id);
        }
      }
    });
  });
//------------------------------------------------------------------------------

//------------------- PUT route to delete item  ----------------------------
/*
  Rework :
  1. if item.type == 1(for all) : only the admin and the person who added the item should be able to remove it (but how would u track that person ?)
  2. if item.type == 2(for individuals) : users from the consumer list should be able to edit it.
*/
router.put('/:id/item/delete', isLoggedIn, function(req, res) {
  var price = parseFloat(req.body.price);
  Party.findOne({_id: req.params.id}, function(err, party) {
    if(err) {
      console.log(err);
      res.redirect('/party/' + req.params.id);
    } else {
      if(req.xhr) {
        party.totalcost -= price;
        var itemId = req.body.id;
        var itemToRemove;
        for(var i=0; i<party.items.length; i++) {
          if(itemId.toString() === party.items[i]._id.toString()) {
            // Copy and remove the party item
            itemToRemove = party.items[i];
            party.items.splice(i, 1);
            break;
          }
        }
        // Refresh participants balance list
        var average = itemToRemove.price / itemToRemove.consumers.length;
        for(var i=0; i<itemToRemove.consumers.length; i++) {
          for(var j=0; j<party.participants.length; j++) {
            if(itemToRemove.consumers[i].toString() === party.participants[j].id.toString()) {
              party.participants[j].balance += average;
              break;
            }
          }
        }
        party.save();        
        res.json({
          party: party,
          consumers: itemToRemove.consumers,
          average: average
        });
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


//--------- POST ROUTE TO ADD CONTRIBUTION FROM PARTICIPANTS -------------------
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
              participant.balance += Number(req.body.contribution_amt);
              party.totalcontribution+=Number(req.body.contribution_amt);
            }
          });
          party.save(function(err){
            if(err) {
              console.log(err);
            }
          });
          if(req.xhr) {
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

//--------------- POST route to add consumer to the item -----------------------
  /*
    1. check if the party item is marked as 2 (individual).
    2. add the user to the consumer list of that item.
  */
  router.post('/:party_id/item/:item_id/add', isLoggedIn, function(req, res) {
    Party.findById(req.params.party_id,function(err,party){
      if(err){
        console.log(err);
        res.redirect("/dashboard");
      }else{
        for(var i=0;i<party.items.length;i++){
          if(party.items[i]._id.equals(req.params.item_id)){
              if(!party.items[i].forall){
                  party.items[i].consumers.push(req.user._id);
                  party.save(function(err){
                    console.log(err);
                  });
                  break;
              }
          }
        }
        res.redirect("/party/"+req.params.party_id);
      }
    });
  });
//------------------------------------------------------------------------------
//--------------- Delete route to remove consumer to the item ------------------
  /*
    1. check if the party item is marked as 2 (individual). and if he is already added to the item's consumer list
    2. delete the user to the consumer list of that item.
  */
  router.delete('/:party_id/item/:item_id/remove', isLoggedIn, function(req, res) {
    Party.findById(req.params.party_id,function(err,party){
      if(err){
        console.log(err);
        res.redirect("/dashboard");
      }else{
        for(var i=0;i<party.items.length;i++){
          if(party.items[i]._id.equals(req.params.item_id)){
              if(!party.items[i].forall){
                  let index;
                  let consumerLength=party.items[i].consumers.length;
                  if(consumerLength<=1){
                      party.items.splice(i,1);
                      party.save(function(err){
                        console.log(err);
                      });
                      break;
                  }else{
                    for(var j=0;j<consumerLength;j++){
                      if(party.items[i].consumers[j].equals(req.user._id)){
                          index=j;
                          break;
                      }
                    }
                    party.items[i].consumers.splice(index,1);
                    party.save(function(err){
                      console.log(err);
                    });
                    break;
                  }
                  break;
              }
              break;
          }
        }
        res.redirect("/party/"+req.params.party_id);
      }
    });

  });
//------------------------------------------------------------------------------


//------------------------------------------------------------------------------
//------------------------Edit Item---------------------------------------------

router.put("/party/:party_id/item/:item_id/edit",isLoggedIn,function(req,res){

  Party.findById(req.params.party_id,function(err,party){
      if(err){
        console.log(err);
        res.redirect("/dashboard");
      }else{
        var itemsLength=party.items.length;
       for(var i=0;i<itemsLength;i++){
          if(party.items[i]._id.equals(req.params.item_id)){
            party.items[i].name= req.body.name;
            party.items[i].price= req.body.cost;
            party.items[i].quantity= req.body.quantity;
            party.save(function(err){
              console.log(err);
            });
            break;
          }
       }
       res.redirect("/party/"+req.params.party_id);
      }
  });
});

//------------------------------------------------------------------------------

module.exports = router;
