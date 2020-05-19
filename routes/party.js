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
          // Filter User array based on party.participants
          let filteredUsers = [];
          for(var i=0; i<party.participants.length; i++) {
            index = users.map(function(e) { return e._id.toString(); }).indexOf(party.participants[i].id.toString());
            if(index != -1) {
              filteredUsers.push(users[index]);
            }
          }
          var currentPartyUser = party.participants.find(obj => {
            return obj.id.toString() === req.user._id.toString();
          });
          res.render('party', {
            party: party,
            users: filteredUsers,
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
      if(req.body.purchased.toString() === 'false') {
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
            index = party.participants.map(function(e) { return e.id.toString(); }).indexOf(itemToRemove.consumers[i].toString());
            if(index != -1) {
              party.participants[index].balance += average;
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
          if(req.xhr) {
            res.json({
              purchase_state : req.body.purchase,
              forall : party.items[req.body.item_index].forall
            });
          }
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
  Party.findOne({_id: req.params.id}, function(err, party) {
    if(err) {
      console.log(err);
      res.redirect('/party/' + req.params.id);
    } else {
      if(req.user._id.toString() === party.hosts[0].toString()) {
        party.description = req.body.description;
        party.save(function(err) {
          if(err) console.log(err);
        });
        if(req.xhr) {
          res.json(party);
        } else {
          res.redirect('/party/' + req.params.id);
        }
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
        if(req.body.purchased.toString() === 'false') {
          for(var i=0;i<party.items.length;i++){
            if(party.items[i]._id.equals(req.params.item_id)){
                if(!party.items[i].forall){
                  let flag=0;
                  let consumerLength=party.items[i].consumers.length;
                    for(var j=0;j<consumerLength;j++){
                      if(party.items[i].consumers[j].equals(req.user._id)){
                        flag=1;
                        break;
                      }
                    }
                    if(flag===0){
                      party.items[i].consumers.push(req.user._id);
                      // Calculate change in balance for existing consumers and new consumer
                      let changeForOld = (req.body.cost / consumerLength) - (req.body.cost / (consumerLength + 1));
                      let changeForNew = (req.body.cost / (consumerLength + 1));
                      for(var j=0; j<consumerLength+1; j++) {
                        index = party.participants.map(function(e) { return e.id.toString(); }).indexOf(party.items[i].consumers[j].toString());
                        if(index != -1 ) {
                          if(party.items[i].consumers[j].equals(req.user._id)) {
                            party.participants[index].balance -= changeForNew;
                          } else {
                            party.participants[index].balance += changeForOld;
                          }
                        }
                      }
                      party.save(function(err){
                        if(err) console.log(err);
                      });
                      break;
                    }
                }
            }
          }
          if(req.xhr) {
            res.json(party.participants);
          } else {
            res.redirect("/party/"+req.params.party_id);
          }
        }
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
        if(req.body.purchased.toString() === 'false') {
          let consumerLength;
          for(var i=0;i<party.items.length;i++){
            if(party.items[i]._id.equals(req.params.item_id)){
                if(party.items[i].forall.toString() === 'false'){
                    let index;
                    consumerLength = party.items[i].consumers.length;
                    if(consumerLength<=1){
                      // If only consumer removes, delete item
                        // update balance
                        index = party.participants.map(function(e) { return e.id.toString(); }).indexOf(req.user._id.toString());
                        party.participants[index].balance += Number(req.body.cost);
                        // Update totalcost because item is removed now
                        party.totalcost -= Number(req.body.cost);
                        // delete item
                        party.items.splice(i,1);
                        party.save(function(err){
                          if(err) console.log(err);
                        });
                        break;
                    } else {
                      for(var j=0; j<consumerLength; j++) {
                        index = party.participants.map(function(e) { return e.id.toString(); }).indexOf(party.items[i].consumers[j].toString());
                        if(index != -1 ) {
                          if(party.items[i].consumers[j].equals(req.user._id)) {
                            party.participants[index].balance += (req.body.cost / consumerLength);
                            currUserIndex = index;
                          } else {
                            party.participants[index].balance += (req.body.cost / consumerLength) - (req.body.cost / (consumerLength-1));
                          }
                        }
                      }
                      // Remove the user from the consumer list
                      party.items[i].consumers.splice(currUserIndex, 1);
                      party.save(function(err){
                        if(err) console.log(err);
                      });
                      break;
                    }
                }
            }
          }
          if(req.xhr) {
            res.json({
            participants: party.participants,
            consumerLength: consumerLength,
            totalcost: party.totalcost,
            totalpurchased: party.totalpurchased
            });
          } else {
            res.redirect("/party/"+req.params.party_id);
          }
        }
      }
    });

  });
//------------------------------------------------------------------------------

//------------------------Edit Item---------------------------------------------
router.put("/:party_id/item/:item_id/edit",isLoggedIn,function(req,res){
  Party.findById(req.params.party_id,function(err,party){
      if(err){
        console.log(err);
        res.redirect("/dashboard");
      }else{
        if(req.body.purchased.toString() === 'false') {
          if(req.xhr) {
            var itemsLength=party.items.length;
            let item;
            let oldPrice;
            // Update items
          for(var i=0;i<itemsLength;i++)
          {
              if(party.items[i]._id.equals(req.params.item_id))
              {
                let cost = parseFloat(req.body.cost) * parseFloat(req.body.quantity);
                party.items[i].name = req.body.name;
                oldPrice = party.items[i].price;
                party.items[i].price = cost;
                party.items[i].quantity= req.body.quantity;
                item = party.items[i];
                // Update totalcost += (newPrice - oldPrice)
                party.totalcost += (cost - oldPrice);
                party.save(function(err){
                  if(err) {
                    console.log(err);
                  }
                });
                break;
              }
          }
          // Change in balance would be the difference divided by the no of consumers
          var change = (oldPrice - item.price ) / item.consumers.length;
          var index;
          for(var i=0; i<item.consumers.length; i++) {
            index = party.participants.map(function(e) { return e.id; }).indexOf(item.consumers[i]);
            if(index != -1) {
              party.participants[index].balance += change;
            }
          }
          res.json({
            item: item,
            change: change,
            totalcost: party.totalcost
          });
        }
        else res.redirect('/party/' + req.params.party_id);
      }
    };
  });
});

//------------------------------------------------------------------------------

module.exports = router;
