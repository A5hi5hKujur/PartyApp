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
  router.post('/:id/user',isLoggedIn,function(req, res)
  {
    if(req.xhr) {
      User.findById(req.user._id, function(err, user)
      {
        if(err) {
          console.log(err);
          res.redirect("/dashboard");
        }
        else
        {
          Party.findById(req.params.id, function(err, party)  // find party to be joined.
          {
            if(err) {
              console.log(err);
              res.redirect("/dashboard");
            }
            else
            {
              // don't allow to join a past party
              if(party.status === "past") {
                res.json("past-party");

              } else {
                let new_participant = {
                  id : req.user._id,
                  contribution : 0,
                  host : false,
                  balance: 0
                }
    
                // add person to all forall item
                var totalForallCost = 0;
                party.items.forEach(item => {  
    
                  // if a forall item found
                  if(item.forall) {
    
                    // sum its cost
                    totalForallCost += item.price;
                    // add user to consumers list
                    item.consumers.push(req.user._id);
                  }
                });
    
                // update new participant balance
                new_participant.balance -= (totalForallCost / (party.participants.length + 1));
    
                // update existing participants balance
                party.participants.forEach(participant => {
                  participant.balance += (totalForallCost / party.participants.length) - (totalForallCost / (party.participants.length + 1));
                });
    
                // add new participant to the list
                party.participants.push(new_participant);
    
                // save party
                party.save(function(err){
                  if(err){
                    console.log(err);
                  }
                });
                user.parties.push(req.params.id);  // parameter id contains the party id that the user wants to join.
                user.save(function(err,user)
                {
                  if(err){
                    console.log(err);
                  }
                });
                res.json("done"); // redirect joined party.
              }
              
            }
          });
          
        }
      });
    } res.redirect("/dashboard");
    
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
    if(req.xhr) {
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
          if(party.status !== "past") {
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
          }
        }
      });
    } else res.redirect("/dashboard");
    
  });
//------------------------------------------------------------------------------

//------------------- PUT route to delete item  ----------------------------
/*
  Rework :
  1. if item.type == 1(for all) : only the admin and the person who added the item should be able to remove it (but how would u track that person ?)
  2. if item.type == 2(for individuals) : users from the consumer list should be able to edit it.
*/
router.put('/:id/item/delete', isLoggedIn, function(req, res) {
  if(req.xhr) {
    var price = parseFloat(req.body.price);
    Party.findOne({_id: req.params.id}, function(err, party) {
      if(err) {
        console.log(err);
        res.redirect('/party/' + req.params.id);
      } else {
        if(req.body.purchased.toString() === 'false' && party.status !== "past") {
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
          
        }
      }
    });
  } else res.redirect("/dashboard");
  
});
//------------------------------------------------------------------------------

//--------------------------- POST ROUTE TO PURCHASE AN ITEM -------------------

 router.post('/:party_id/purchase/:item_id', isLoggedIn, function(req, res)
 {
   if(req.xhr) {
    let party_id = req.params.party_id;
    let item_id = req.params.item_id;
    Party.findById(party_id, function(err, party) //call back
    {
      if(err) console.log(err);
      else
        {
          if(party.status !== "past") {
            party.items[req.body.item_index].purchased = req.body.purchase;  // push new user to found party.
            if(req.body.purchase === 'true') {
              party.totalpurchased += parseFloat(req.body.item_cost);
            } else {
              party.totalpurchased -= parseFloat(req.body.item_cost);
            }
            // find if the person purchasing the item a consumer of the item or not.
            let is_consumer = false;
            party.items[req.body.item_index].consumers.forEach((consumer) => {
              if(consumer._id == req.user) is_consumer = true;
            });
            party.save(function(err,user)
            {
              if(err) console.log(err);
              res.json({
                purchase_state : req.body.purchase,
                forall : party.items[req.body.item_index].forall,
                is_consumer : is_consumer,
                host : party.hosts[0],
                user : req.user
              });
            });
          }
          
        }
    });
   } else res.redirect("/dashboard");
   
 });
//------------------------------------------------------------------------------


//--------- POST ROUTE TO ADD CONTRIBUTION FROM PARTICIPANTS -------------------
 router.post('/:party_id/contribution', isLoggedIn, function(req, res)
 {
  if(req.xhr) {
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
          res.json({
            party: party,
            user: req.user,
            contribution: req.body.contribution_amt
          });
        }
    });
  } else res.redirect("/dashboard");
    
 });
//------------------------------------------------------------------------------

//------------------- PUT route to edit description-----------------------------
router.put('/:id/description', isLoggedIn, function(req, res) {
  if(req.xhr) {
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
          res.json(party);
        }
      }
    });
  } else res.redirect("/dashboard");
  
});
//------------------------------------------------------------------------------

//--------------- POST route to add consumer to the item -----------------------
  /*
    1. check if the party item is marked as 2 (individual).
    2. add the user to the consumer list of that item.
  */
  router.post('/:party_id/item/:item_id/add', isLoggedIn, function(req, res) {
    if(req.xhr) {
      Party.findById(req.params.party_id,function(err,party){
        if(err){
          console.log(err);
          res.redirect("/dashboard");
        }else{
          if(party.status !== "past" && req.body.purchased.toString() === 'false') {
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
            res.json(party.participants);
          }
        }
      });
    } else res.redirect("/dashboard");
    
  });
//------------------------------------------------------------------------------
//--------------- Delete route to remove consumer to the item ------------------
  /*
    1. check if the party item is marked as 2 (individual). and if he is already added to the item's consumer list
    2. delete the user to the consumer list of that item.
  */
  router.delete('/:party_id/item/:item_id/remove', isLoggedIn, function(req, res) {
    if(req.xhr) {
      Party.findById(req.params.party_id,function(err,party){
        if(err){
          console.log(err);
          res.redirect("/dashboard");
        }else{
          if(party.status !== "past" && req.body.purchased.toString() === 'false') {
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
                        let currUserIndex;
                        for(var j=0; j<consumerLength; j++) {
                          index = party.participants.map(function(e) { return e.id.toString(); }).indexOf(party.items[i].consumers[j].toString());
                          if(index != -1 ) {
                            if(party.items[i].consumers[j].equals(req.user._id)) {
                              party.participants[index].balance += (req.body.cost / consumerLength);
                            } else {
                              party.participants[index].balance += (req.body.cost / consumerLength) - (req.body.cost / (consumerLength-1));
                            }
                          }
                        }
                        for(var j=0; j<consumerLength; j++) {
                          if(party.items[i].consumers[j].equals(req.user._id)){
                            // Remove the user from the consumer list
                          party.items[i].consumers.splice(j, 1);
                          party.save(function(err){
                            if(err) console.log(err);
                          });
                          break;
                          };
                        }
                      }
                  }
              }
            }
            res.json({
            participants: party.participants,
            consumerLength: consumerLength,
            totalcost: party.totalcost,
            totalpurchased: party.totalpurchased
            });
          }
        }
      });
    } else res.redirect("/dashboard");
    

  });
//------------------------------------------------------------------------------

//------------------------Edit Item---------------------------------------------
router.put("/:party_id/item/:item_id/edit",isLoggedIn,function(req,res){
  if(req.xhr) {
    Party.findById(req.params.party_id,function(err,party){
      if(err){
        console.log(err);
        res.redirect("/dashboard");
      }else{
        if(party.status !== "past" && req.body.purchased.toString() === 'false') {
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
      };
    });
  } else res.render("/dashboard");
  
});

//------------------------------------------------------------------------------

//------------------------Show Consumers---------------------------------------------
router.get("/:party_id/item/:item_id/view",isLoggedIn,function(req,res){
  if(req.xhr) {
    Party.findById(req.params.party_id,function(err,party){
      if(err){
        console.log(err);
        res.redirect("/dashboard");
      }else{
          var itemsLength = party.items.length;
          for(var i=0;i<itemsLength;i++){
            if(party.items[i]._id.equals(req.params.item_id)){
              User.find().where('_id').in( party.items[i].consumers).exec((err, consumers) => {
                if (err) {
                  console.log(err);
                  res.redirect('/dashboard');
                } else {
                  res.json(consumers);
                }
              });
            }
          }
      }
    });
  } else res.redirect("/dashboard");

});

//------------------------------------------------------------------------------


//----------------- Delete Route to exit/delete party --------------------------
router.delete('/:id', isLoggedIn, function(req, res) {
  if(req.xhr) {
    // find the party by id
    Party.findById(req.params.id, function(err, party) {
      if(err) {
        console.log(err);
        res.redirect("/dashboard");
      } else {

        // if the user is host, just delete the party
        if(req.user._id.equals(party.hosts[0])) {

          // firstly remove this party from each user's parties array
          // find all participants one by one
          party.participants.forEach(participant => {
            User.findById(participant.id, function(err, user) {
              if(err) {
                console.log(err);
                res.redirect("/dashboard");
              } else {

                // remove the party from user's parties list
                var index = user.parties.indexOf(req.params.id);
                if(index > -1) {
                  user.parties.splice(index, 1);
                }
                user.save(function(err) {
                  if(err) console.log(err);
                });

                // finally remove the party
                party.remove(function(err) {
                  if(err) console.log(err);
                });
              }
            });
          });
          res.json("deleted");
          // if the user isn't host
        } else {

          // if the party status is "past"
          // remove the party from user's parties list only
          if(party.status == "past") {
            User.findById(req.user._id, function(err, user) {

              if(err) {
                console.log(err);
                res.redirect("/dashboard");
              } else {

                // remove the party from user's parties list
                var index = user.parties.indexOf(req.params.id);
                if(index > -1) {
                  user.parties.splice(index, 1);
                }
                user.save(function(err) {
                  if(err) console.log(err);
                });
              }  
            });
            // if party status is ongoing or upcoming
            // do these 3 steps
            // 1. remove user from participants list
            //    1a. remove his contribution from total contribution
            //    1b. remove participant
            // 2. remove user from every eligible item
            //    2a. remove user from every individual item,
            //      2ai.  if he was the only consumer, delete the item also
            //      2aii. else update balance of all remaining consumers
            //    2b. find total cost of all forall items and update balance
            //        of all participants (as no. of participants reduced by 1)
            // 3. remove party from user's parties list
          } else {
            
            // 1
            var index;
            for(var i=0; i<party.participants.length; i++) {
              if(req.user._id.equals(party.participants[i].id)) {
                
                // remove his contribution as well
                party.totalcontribution -= party.participants[i].contribution;
                index = i;
                break;
              }
            } 
            party.participants.splice(index, 1);

            // 2
            var totalForallCost = 0;
            party.items.forEach(function(item, i, object) {
              
              // sum all forall items cost
              if(item.forall) {
                totalForallCost += item.price;
              }
              // check all individual items
              else {

                // remove from consumer list
                var ind = item.consumers.indexOf(req.user._id);
                if(ind > -1) {
                  item.consumers.splice(ind, 1);
                }

                // if no consumers left for item, 
                // remove the item
                if(item.consumers.length === 0) {

                  // remove its cost
                  party.totalcost -= item.price;

                  if(item.purchased) {
                    party.totalpurchased -= itemm.price;
                  }
                  // finally remove item
                  object.splice(i, 1);
                } else {
                  // if there are few consumers left
                  // update their balance in participants list
                  for(var i=0; i<item.consumers.length; i++) {
                    var ind = party.participants.map(function(e) { return e.id.toString(); }).indexOf(item.consumers[i].toString());
                    if(ind != -1 ) {
                      party.participants[ind].balance += ( item.price / (item.consumers.length + 1) ) - (item.price / item.consumers.length);
                    }
                  }

                }
              }
            });

            // update balance of remaining participants (w.r.t. total forall cost)
            party.participants.forEach(participant => {
              participant.balance += (totalForallCost / (party.participants.length + 1)) - (totalForallCost / party.participants.length);

            });

            party.save(function(err) {
              if(err) console.log(err);
            });
            
            // 3
            User.findById(req.user._id, function(err, user) {
              if(err) {
                console.log(err);
                res.redirect("/dashboard");
              } else {

                // remove the party from user's parties list
                var index = user.parties.indexOf(req.params.id);
                if(index > -1) {
                  user.parties.splice(index, 1);
                }
                user.save(function(err) {
                  if(err) console.log(err);
                });
              }
              
            });
          }
          res.json("removed");
        }
      }
    });
  } else res.redirect("/dashboard");
  
});
//------------------------------------------------------------------------------


module.exports = router;
