// ----------------------------  Overlay  ----------------------------------
function popup(i) {
    $(".overlay").eq(i).toggleClass("active");
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
    $.post('/party/'+ id +'/item', newItem, function(data) {
      // close overlay
      $(".overlay").eq(1).toggleClass("active");
      // reset form
      $('#items-form')[0].reset();
      // if host, give delete option
      var midString = '<div class="option"></div><div class="options"><div class="edit">Edit</div><div class="delete">Delete</div><div class="add-me">Add Me</div><div class="remove-me">Remove Me</div><div class="view">View Consumers</div></div>';
      // if (data.user._id.toString() === data.host.toString()) {
      //   midString = "<div class='options delete'></div>";
      // } else {
      //   midString = "<div class=''></div>"
      // }
      // append new item
        $('.item-list').append(
            `
            <li id="${data.item._id.toString()}">
                <div class="item-icon ${data.item.category.toLowerCase()}-icon"></div>
                <div class="item-content">
                  <div class="item-detail">
                    <p class="name">${data.item.name}</p>
                    <p class="quantity">Quantity : <span class="item-quantity">${data.item.quantity}</span></p>
                    <p class="cost">Rs. <span class="item-cost">${data.item.price}</span></p>
                  </div>
                  <div class="item-ops">
                    ` + midString + `
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
    // if purchased dont reduce the cost in frontend
    if($('#'+itemid+' input[type="checkbox"]').prop('checked') == false) {
      var total = parseFloat($("#total-cost").text()) - itemCost;
      $("#total-cost").text(total);
    }
    $('#'+itemid).hide();
    // Some css or animation on removing item
    // $('#'+itemid).html(
    //   `
    //   Item removed
    //   `
    // );
    $.ajax({
      url: '/party/'+ id +'/item/delete',
      data: {id: itemid, price: itemCost},
      type: 'PUT',
      success: function(updatedParty) {
        // Update participants balance
        var average = itemCost / updatedParty.participants.length;
        for(var i=0; i<$('.adjustment').length; i++) {
          $('.adjustment')[i].textContent = (parseFloat($('.adjustment')[i].textContent) + average).toFixed(2);
          var updatedAdjust = $('.adjustment')[i].textContent;
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
      }
    });
  }
});
// -----------------------------------------------------------------------

// ----------------------- Back button -----------------------------------
// Redirecting to dashboard page
// to be updated if port no. or domain changes
let dashboardUrl = 'http://localhost:3000/dashboard/'
window.history.pushState( { page: 1 } , "", "");
window.onpopstate = function(e) {
    if (e) {
        window.location.href = dashboardUrl;
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
  let party_id = input_url.split('/')[4];
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
    data: data
  };
  console.log(data);
  // 4. control returns here after being redirected from the backend
  $.ajax(options).done(response => {
      // show response of party submission here.
      let total_cost = parseFloat($("#total-cost").html());
      if(this.checked) $("#total-cost").html(total_cost - parseFloat(item_cost));
      else $("#total-cost").html(total_cost + parseFloat(item_cost));
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
  $.post('/party/'+ id +'/contribution', contribution, function(data) {
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
    }
  });
});
// ------------------------------------------------------------------------------

//------------------------ Toggle Item options ---------------------------------
$("#items").on("click", ".option", function(){
  $(this).siblings().eq(0).toggleClass("active");   // this would need to change i guess
});

$(document).click(function(e) // to disable options menu on random clicks
{
  // Check if click was triggered on or within the item options
  if( $(e.target).closest(".option").length > 0 ) return false;
  $(".options").removeClass("active");
});
//------------------------------------------------------------------------------

//----------------------------- Logout -----------------------------------------
$("#logout").on( "click", function(){
  window.location.href = '/users/logout';
});
//------------------------------------------------------------------------------
