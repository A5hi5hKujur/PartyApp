// ----------------------------  Overlay  ----------------------------------
function popup(i) {
    $(".overlay").eq(i).toggleClass("active");
    window.scrollTo(0, 0);
}
// -------------------------------------------------------------------------

// ----------------------- Item addition -----------------------------------
$('#items-form').submit(function(e) {
    e.preventDefault();
    // serialize form data
    var newItem = $(this).serialize();
    // get the party id
    var url = window.location.href;
    url = url.split('/');
    var id = url[url.length - 1];

    $.ajax({
      url: '/party/'+ id +'/item',
      data: newItem,
      type: 'POST',
      success: function(data) {

        if(data !== "invalid-input") {
          // close overlay
          $(".overlay").eq(1).toggleClass("active");

          // scroll window down to item list
          // and scroll to the top of item list
          window.scrollTo(0, document.body.scrollHeight);
          $('.item-list').scrollTop(0);
          
          // reset form
          $('#items-form')[0].reset();
          // if host, give delete option
          let midString = '';
          if(!data.item.forall){
            midString = '<div class="remove-me">Remove Me</div><div class="view">View Consumers</div>'
          }
          // if the item list is empty, remove the placeholder and then append
          var placeholder = $('.item-list').find('.item-icon');
          // console.log(placeholder);
          if(placeholder.length === 0)
            $('.item-list').html('');

          // append new item
          $('.item-list').prepend(
              `
              <li id="${data.item._id.toString()}" class="animate__animated animate__slideInRight">
                  <div class="item-icon ${data.item.category.toLowerCase()}-icon"></div>
                  <div class="item-content">
                    <div class="item-detail">
                      <p class="name">${data.item.name}</p>
                      <p class="quantity">Quantity : <span class="item-quantity">${data.item.quantity}</span></p>
                      <p class="cost">Rs. <span class="item-cost">${data.item.price}</span></p>
                    </div>
                    <div class="item-ops">
                      <div class="option"></div>
                        <div class="options">
                          <div class="edit">Edit</div>
                          <div class="delete">Delete</div>
                          ` + midString + `
                        </div>
                      <label class="custom-checkbox">
                        <input class="checkbox" type="checkbox">
                        <span class="checkmark"></span>
                      </label>
                    </div>
                  </div>
                </li>
              `
          );
          var total = parseFloat($("#total-cost").text()) + data.item.price;
          $("#total-cost").text(total);
          // Update participants balance
          // If item is for all, update balance of each member
          if(data.item.forall) {
            var average = data.item.price / data.party.participants.length;
            for(var i=0; i<$('.adjustment').length; i++) {
              $('.adjustment')[i].textContent = (parseFloat($('.adjustment')[i].textContent) - average).toFixed(2);
              var updatedAdjust = $('.adjustment')[i].textContent;
              // choose color shade and sign for balance
              $($('.adjustment')[i]).removeClass('positive-adjust neutral-adjust negative-adjust');
              if(updatedAdjust > 0) {
                $($('.adjustment')[i]).addClass('positive-adjust');
                $('.adjustment')[i].textContent = "+" + $('.adjustment')[i].textContent;
              } else if(updatedAdjust == 0) {
                $($('.adjustment')[i]).addClass('neutral-adjust');
              } else {
                $($('.adjustment')[i]).addClass('negative-adjust');
              }
            }
          } else {
            var adjust = parseFloat($('#'+data.itemAdder+' .adjustment').text()) - data.item.price;
            $('#'+data.itemAdder+' .adjustment').text(adjust.toFixed(2));
            $('#'+data.itemAdder+' .adjustment').removeClass('positive-adjust neutral-adjust negative-adjust');
              if(adjust > 0) {
                $('#'+data.itemAdder+' .adjustment').addClass('positive-adjust');
                $('#'+data.itemAdder+' .adjustment').text("+" + $('#'+data.itemAdder+' .adjustment').text());
              } else if(adjust == 0) {
                $('#'+data.itemAdder+' .adjustment').addClass('neutral-adjust');
              } else {
                $('#'+data.itemAdder+' .adjustment').addClass('negative-adjust');
              }
          }
        }

      },
      async: false
    });
});
// -------------------------------------------------------------------------

// ----------------------- Item deletion -----------------------------------
$('#items').on('click', '.delete', function(e) {
  var confirmResponse = confirm('Are you sure?');
  // if confirm, proceed
  if(confirmResponse) {
    // get the current party id
    var url = window.location.href;
    url = url.split('/');
    var id = url[url.length - 1];
    var itemid = $(this).parents('li').attr('id');
    var itemCost = $('#'+itemid+' .item-cost').text();
    var purchased = $('#'+itemid+' input[type="checkbox"]').prop('checked');

    // hide the deleted item
    // then remove item-icon class
    // now count of item-icon will give no. of items after deletion
    $('#'+itemid).hide();
    $('#'+itemid).children('.item-icon').removeClass('item-icon');

    // if count of items = 0, add placeholder
    var item_len = $('.item-list').find('.item-icon').length;
    if(item_len == 0)
    {
        $('#items').html(`<div class="empty-placeholder">
          <h1 class="placeholder-heading" style="font-size : 20px; letter-spaceing : 0px;">Add Items</h1>
          <p class="placeholder-text">Add some party items to get this party started.</p>
        </div>`);
    }
    // Some css or animation on removing item
    // $('#'+itemid).html(
    //   `
    //   Item removed
    //   `
    // );
    $.ajax({
      url: '/party/'+ id +'/item/delete',
      data: {id: itemid, price: itemCost, purchased: purchased},
      type: 'PUT',
      success: function(data) {

        if(data !== "no-access") {
          var total = parseFloat($("#total-cost").text()) - itemCost;
          $("#total-cost").text(total);
          // Update participants balance
          var adjust;
          for(var i=0; i<data.consumers.length; i++) {
            adjust = parseFloat($('#'+data.consumers[i]+' .adjustment').text()) + data.average;
            $('#'+data.consumers[i]+' .adjustment').text(adjust.toFixed(2));
            $('#'+data.consumers[i]+' .adjustment').removeClass('positive-adjust neutral-adjust negative-adjust');
              if(adjust > 0) {
                $('#'+data.consumers[i]+' .adjustment').addClass('positive-adjust');
                $('#'+data.consumers[i]+' .adjustment').text("+" + $('#'+data.consumers[i]+' .adjustment').text());
              } else if(adjust == 0) {
                $('#'+data.consumers[i]+' .adjustment').addClass('neutral-adjust');
              } else {
                $('#'+data.consumers[i]+' .adjustment').addClass('negative-adjust');
              }
          }
        }
      },
      async: false
    });
  }
});
// -----------------------------------------------------------------------

// ----------------------- Back button -----------------------------------
// Redirecting to dashboard page
// to be updated if port no. or domain changes
// let dashboardUrl = 'http://localhost:3000/dashboard/'
window.history.pushState( { page: 1 } , "", "");
window.onpopstate = function(e) {
    if (e) {
        window.location.href = "/dashboard";
    }
}
// -----------------------------------------------------------------------

//--------------------- Mark items as purchased --------------------------
// Mark Items as purchased.
$( "#items" ).on('click', '.checkbox', function($this) {
  // 2. find the id of the selected item :
  let item_id = $(this).parent().parent().parent().parent().attr("id");
  let index = $('li').index($('#'+item_id));
  let item_cost = $(this).parent().parent().siblings().eq(0).find(".item-cost").html();
  //3. send item id and party id to the backend :
  let input_url = window.location.href;
  input_url = input_url.split('/');
  let party_id = input_url[input_url.length - 1];
  let output_url = "/party/"+party_id+"/purchase/"+item_id;
  let data = {
    party : party_id,
    item : item_id,
    item_index : index,
    purchase : this.checked,
    item_cost: item_cost
  };
  const options = { // Ajax request
    method: 'post',
    url: output_url,
    data: data,
    async: false
  };
  // console.log(data);
  // 4. control returns here after being redirected from the backend
  $.ajax(options).done(response => {
      // show response of party submission here.
      let total_cost = parseFloat($("#total-cost").html());
      if(this.checked) $("#total-cost").html(total_cost - parseFloat(item_cost));
      else $("#total-cost").html(total_cost + parseFloat(item_cost));

      // remove backout options for the user ones the items are marked purchased.
      
      // Options to show:
      // 1. If item is forall and unpurchased, show: Edit and Delete 
      // 2. If item is forall and purchased, show: "NOTHING"
      // 3. If item is individual and unpurchased and user is consumer/host, show: Edit, Delete, View Consumers, Remove Me
      // 4. If item if individual and unpurchased and user is NOT consumer/host, show: View Consumers, Add Me
      // 5. If item if individual and purchased, show: View Consumers

      if(response.forall) {
        // 1. 
        if(response.purchase_state == "false") {
          $(".item-list").find("#"+item_id).find(".options").html('<div class="edit">Edit</div><div class="delete">Delete</div>');
        } 
        // 2.
        else {
          $(".item-list").find("#"+item_id).find(".options").html('<div></div>');
        }
      } else {
        if(response.purchase_state == "false") {
          // 3.
          if(response.is_consumer || response.is_host) {
            $(".item-list").find("#"+item_id).find(".options").html('<div class="edit">Edit</div><div class="delete">Delete</div><div class="remove-me">Remove Me</div><div class="view">View Consumers</div>');
          }
          // 4.
          else {
            $(".item-list").find("#"+item_id).find(".options").html('<div class="add-me">Add Me</div><div class="view">View Consumers</div>');
          }
        } 
        // 5.
        else {
          $(".item-list").find("#"+item_id).find(".options").html('<div class="view">View Consumers</div>');
        }
      }
  });
});
// ------------------------------------------------------------------------------

// ----------------------------- Contribution -----------------------------------
$('#contribution-form').submit(function(e) {
  e.preventDefault();
  var contribution = $(this).serialize();
  var url = window.location.href;
  url = url.split('/');
  var id = url[url.length - 1];
  // some css or animation or gif of success for 1 sec

  $.ajax({
    url: '/party/'+ id +'/contribution',
    data: contribution,
    type: 'POST',
    success: function(data) {
      $(".overlay").eq(0).toggleClass("active");
      $('#contribution-form')[0].reset();
      $('#total-contribution').text(data.party.totalcontribution);
      // Updated Contri of logged in user
      var updatedContri = parseFloat($('#'+data.user._id+' .user-contribution').text()) + parseFloat(data.contribution);
      $('#'+data.user._id+' .user-contribution').text(updatedContri);
      // Updated Adjust of logged in user
      var updatedAdjust = (parseFloat($('#'+data.user._id+' .adjustment').text()) + parseFloat(data.contribution)).toFixed(2);
      $('#'+data.user._id+' .adjustment').text(updatedAdjust).removeClass('positive-adjust neutral-adjust negative-adjust');
      // Checking adjust status
      if(updatedAdjust > 0) {
        $('#'+data.user._id+' .adjustment').addClass('positive-adjust');
        $('#'+data.user._id+' .adjustment').text("+" + updatedAdjust);
      } else if(updatedAdjust == 0) {
        $('#'+data.user._id+' .adjustment').addClass('neutral-adjust');
      } else {
        $('#'+data.user._id+' .adjustment').addClass('negative-adjust');
      }
    },
    async: false
  });
});
// ------------------------------------------------------------------------------

// ------------------------ Edit Description ------------------------------------
$('#description-form').submit(function(e) {
  e.preventDefault();
  // serialize form data
  var data = $(this).serialize();
  // get the party id
  var url = window.location.href;
  url = url.split('/');
  var id = url[url.length - 1];
  $.ajax({
    url: '/party/'+ id +'/description',
    data: data,
    type: 'PUT',
    success: function(party) {
      // close form
      $(".overlay").eq(3).toggleClass("active");
      // update textarea and desc
      $('#description-form textarea').text(party.description);
      $('#party-description').text(party.description);
    },
    async: false
  });
});
// ------------------------------------------------------------------------------

//------------------------ Toggle Item options ---------------------------------
$("#items").on("click", ".option", function(){
  $(".options").removeClass("active");
  $(this).siblings().eq(0).toggleClass("active");   // this would need to change i guess
});

$(document).click(function(e) // to disable options menu on random clicks
{
  // Check if click was triggered on or within the item options
  if( $(e.target).closest(".option").length > 0 ) return false;
  $(".options").removeClass("active");
});
//------------------------------------------------------------------------------

//----------------------------- Edit Item --------------------------------------
$("#items").on("click", ".options .edit", function()
{
  let item_id = $(this).parent().parent().parent().parent().attr("id");
  let item_name = $(this).parent().parent().parent().find(".name").html();
  let item_cost = parseFloat($(this).parent().parent().parent().find(".item-cost").html());
  let item_quantity = parseFloat($(this).parent().parent().parent().find(".item-quantity").html());
  let input_url = window.location.href;
  input_url = input_url.split('/');
  let party_id = input_url[input_url.length - 1];
  let action = "/party/"+party_id+"/item/"+item_id+"/edit";

  // Add these values to the edit form popup.
  $("#items-form-edit").attr("action", action);
  $("#items-form-edit").find(".name").val(item_name);
  $("#items-form-edit").find(".cost").val(item_cost / item_quantity);
  $("#items-form-edit").find(".quantity").val(item_quantity);

  // Display edit item popup
  popup(5);
});
$('#items-form-edit').submit(function(e) {
  e.preventDefault();
  // serialize form data
  var data = $(this).serialize();
  let url = $(this).attr("action"); // backend url
  let item_id = url.split("/")[4]; // extract item id from backend url
  let purchased = $('#'+item_id+' input[type="checkbox"]').prop('checked');
  $.ajax({
    url: url,
    data: data + "&purchased=" + purchased,
    type: 'put',
    success: function(data) {

      if(data !== "invalid-input" && data !== "no-access") {
        // close form
        popup(5);
        // update item details
        $('#'+item_id).find(".name").html(data.item.name);
        $('#'+item_id).find(".item-quantity").html(data.item.quantity);
        $('#'+item_id).find(".item-cost").html(data.item.price);
        // Update total cost
        $("#total-cost").text(data.totalcost);
        var adjust;
        // Update user balance
        for(var i=0; i<data.item.consumers.length; i++) {
          adjust = parseFloat($('#'+data.item.consumers[i]+' .adjustment').text()) + data.change;
          $('#'+data.item.consumers[i]+' .adjustment').text(adjust.toFixed(2));
          $('#'+data.item.consumers[i]+' .adjustment').removeClass('positive-adjust neutral-adjust negative-adjust');
            if(adjust > 0) {
              $('#'+data.item.consumers[i]+' .adjustment').addClass('positive-adjust');
              $('#'+data.item.consumers[i]+' .adjustment').text("+" + $('#'+data.item.consumers[i]+' .adjustment').text());
            } else if(adjust == 0) {
              $('#'+data.item.consumers[i]+' .adjustment').addClass('neutral-adjust');
            } else {
              $('#'+data.item.consumers[i]+' .adjustment').addClass('negative-adjust');
            }
        }
      }

    },
    async: false
  });
});

//------------------------------------------------------------------------------

//--------------------------- Add consumer to item -----------------------------
  $("#items").on("click", ".options .add-me", function()
  {
    let item_id = $(this).parent().parent().parent().parent().attr("id");
    let item_cost = $(this).parent().parent().parent().find(".item-cost").html();
    let item_name = $(this).parent().parent().parent().find(".name").html();
    $("#shared-item").html(item_name);
    let input_url = window.location.href;
    input_url = input_url.split('/');
    let party_id = input_url[input_url.length - 1];
    let purchased = $('#'+item_id+' input[type="checkbox"]').prop('checked');
    let sendData = {
      id : item_id,
      cost : item_cost,
      purchased: purchased
    };
    let output_url = "/party/"+party_id+"/item/"+item_id+"/add";
    const options = { // Ajax request
      method: 'post',
      url: output_url,
      data: sendData,
      async: false
    };
    // control returns here after being redirected from the backend
    $.ajax(options).done(participants => {

      if(participants !== "no-access") {
        popup(6);
        for(var i=0; i<participants.length; i++) {
          $('#'+participants[i].id+' .adjustment').text(participants[i].balance.toFixed(2));
          $('#'+participants[i].id+' .adjustment').removeClass('positive-adjust neutral-adjust negative-adjust');
            if(participants[i].balance > 0) {
              $('#'+participants[i].id+' .adjustment').addClass('positive-adjust');
              $('#'+participants[i].id+' .adjustment').text("+" + $('#'+participants[i].id+' .adjustment').text());
            } else if(participants[i].balance == 0) {
              $('#'+participants[i].id+' .adjustment').addClass('neutral-adjust');
            } else {
              $('#'+participants[i].id+' .adjustment').addClass('negative-adjust');
            }

        }
        // Now current user is also a consumer to this item
        // Options to show: Edit, Delete, Remove Me, View Consumers
        $(".item-list").find("#"+item_id).find(".options").html('<div class="edit">Edit</div><div class="delete">Delete</div><div class="remove-me">Remove Me</div><div class="view">View Consumers</div>'); 
      }     
    });
  });
//------------------------------------------------------------------------------

//--------------------------- Remove consumer to item -----------------------------
  $("#items").on("click", ".options .remove-me", function()
  {
    let item_id = $(this).parent().parent().parent().parent().attr("id");
    let item_cost = $(this).parent().parent().parent().find(".item-cost").html();
    let item_name = $(this).parent().parent().parent().find(".name").html();
    $("#unshared-item").html(item_name);
    let input_url = window.location.href;
    input_url = input_url.split('/');
    let party_id = input_url[input_url.length - 1];
    let purchased = $('#'+item_id+' input[type="checkbox"]').prop('checked');
    let sendData = {
      id : item_id,
      cost : item_cost,
      purchased: purchased
    };
    let output_url = "/party/"+party_id+"/item/"+item_id+"/remove";
    const options = { // Ajax request
      method: 'delete',
      url: output_url,
      data: sendData,
      async: false
    };
    // control returns here after being redirected from the backend
    $.ajax(options).done(data => {

      if(data !== "no-access") {
        popup(7);
        // If only consumer choose to remove, delete item
        if(data.consumerLength <= 1) {
          $('#'+item_id).hide();
          $('#'+item_id).children('.item-icon').removeClass('item-icon');
        }

        // if count of items = 0, add placeholder
        var item_len = $('.item-list').find('.item-icon').length;
        if(item_len == 0)
        {
            $('#items').html(`<div class="empty-placeholder">
              <h1 class="placeholder-heading" style="font-size : 20px; letter-spaceing : 0px;">Add Items</h1>
              <p class="placeholder-text">Add some party items to get this party started.</p>
            </div>`);
        }

        // Update totalcost if item is deleted
        $("#total-cost").text(data.totalcost - data.totalpurchased);
        // Update balance and show
        for(var i=0; i<data.participants.length; i++) {
          $('#'+data.participants[i].id+' .adjustment').text(data.participants[i].balance.toFixed(2));
          $('#'+data.participants[i].id+' .adjustment').removeClass('positive-adjust neutral-adjust negative-adjust');
            if(data.participants[i].balance > 0) {
              $('#'+data.participants[i].id+' .adjustment').addClass('positive-adjust');
              $('#'+data.participants[i].id+' .adjustment').text("+" + $('#'+data.participants[i].id+' .adjustment').text());
            } else if(data.participants[i].balance == 0) {
              $('#'+data.participants[i].id+' .adjustment').addClass('neutral-adjust');
            } else {
              $('#'+data.participants[i].id+' .adjustment').addClass('negative-adjust');
            }
        }
        // Now current user is not a consumer to this item
        // Options to show: Add Me, View Consumers
        $(".item-list").find("#"+item_id).find(".options").html('<div class="add-me">Add Me</div><div class="view">View Consumers</div>');
      }      
    });
  });
//------------------------------------------------------------------------------

//---------------------------  View Consumer list -------------------------------
$("#items").on("click", ".options .view", function()
  {
    let item_id = $(this).parent().parent().parent().parent().attr("id");
    let input_url = window.location.href;
    input_url = input_url.split('/');
    let party_id = input_url[input_url.length - 1];
    let output_url = "/party/"+party_id+"/item/"+item_id+"/view";
    // control returns here after being redirected from the backend
    $.get(output_url, function(consumers) {
      popup(8);
      var list = "";
      for( let i = consumers.length - 1; i >= 0; i-- ) {
        list += `
        <li class="consumers">
          <img class="profile-icon" src="${consumers[i].image}" >
          <div class="contribution-details">
            <span class="user-name">${consumers[i].fname} ${consumers[i].lname}</span>
          </div>
        </li>
        `
        }
      $(".consumer-list-complete").html(list);
    });
  });
//------------------------------------------------------------------------------
// --------------------------------- Copy Party URL ----------------------------
function copyPartyLink() {
  var url = window.location.href;
  $('#hidden-url-input').val(url);
  var copyText = document.getElementById('hidden-url-input');
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  document.execCommand("copy");

  var tooltip = document.getElementById("myTooltip");
  $('#myTooltip').css({'background-color' : '#4A9FE3'});
  tooltip.innerHTML = "Party Link Copied";
}

function outFunc() {
  $('#myTooltip').css({'background-color' : '#555'});
  var tooltip = document.getElementById("myTooltip");
  tooltip.innerHTML = "Copy to clipboard";
}
//------------------------------------------------------------------------------
//------------------------------- Exit Party -----------------------------------

$(".exit-button").on("click", function() {

  // get the party id
  var input_url = window.location.href;
  input_url = input_url.split('/');
  var id = input_url[input_url.length - 1];

  var output_url = "/party/" + id;

  var options = {
    method: 'DELETE',
    url: output_url,
    async: false
    // data: sendData
  }

  // send control to backend
  $.ajax(options).done( data => {

    // data = "deleted" if party deleted (in case of a host exiting party)
    // data = "removed" if party removed (in case of a non-host exiting party)
    // console.log(data);

    // redirect to dashboard after exit
    window.location.href = "/";
  });

});

//------------------------------------------------------------------------------


//----------------------------- Logout -----------------------------------------
$("header>.profile-icon").on("click", function(){
  $('.profile-menu').toggleClass("active");   // this would need to change i guess
});

$("#logout").on( "click", function(){
  window.location.href = '/users/logout';
});

$("#profile-name").on( "click", function(){
  window.location.href = '/dashboard';
});
//------------------------------------------------------------------------------
