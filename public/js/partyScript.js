// ----------------------------  Overlay  ----------------------------------
function popup(i) {
    $(".overlay").eq(i).toggleClass("active");
}
// -------------------------------------------------------------------------

// ----------------------- Item addition -----------------------------------
$('#items-form').submit(function(e) {
    e.preventDefault();
    var newItem = $(this).serialize();
    var url = window.location.href;
    url = url.split('/');
    var id = url[url.length - 1];
    $.post('/party/'+ id +'/item', newItem, function(data) {
      $(".overlay").eq(1).toggleClass("active");
      $('#items-form')[0].reset();
      var midString = "";
      if (data.user._id.toString() === data.host.toString()) {
        midString = "<div class='options delete'></div>";
      } else {
        midString = "<div class=''></div>"
      }
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
                      <input type="checkbox">
                      <span class="checkmark"></span>
                    </label>
                  </div>
                </div>
              </li>
            `
        );
        var total = parseFloat($("#total-cost").text()) + data.item.price;
        $("#total-cost").text(total);
        // Update participants adjust
        var average = data.item.price / data.party.participants.length;
        for(var i=0; i<$('.adjustment').length; i++) {
          $('.adjustment')[i].textContent = parseFloat($('.adjustment')[i].textContent) - average;
          var updatedAdjust = $('.adjustment')[i].textContent;
          $($('.adjustment')[i]).removeClass('positive-adjust');
          $($('.adjustment')[i]).removeClass('neutral-adjust');
          $($('.adjustment')[i]).removeClass('negative-adjust');
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
  if(confirmResponse) {
    var url = window.location.href;
    url = url.split('/');
    var id = url[url.length - 1];
    var itemid = $(this).parents('li').attr('id');
    var itemCost = $('#'+itemid+' .item-cost').text();
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
        // Update participants "adjustment"
        var average = itemCost / updatedParty.participants.length;
        for(var i=0; i<$('.adjustment').length; i++) {
          $('.adjustment')[i].textContent = parseFloat($('.adjustment')[i].textContent) + average;
          var updatedAdjust = $('.adjustment')[i].textContent;
          $($('.adjustment')[i]).removeClass('positive-adjust');
          $($('.adjustment')[i]).removeClass('neutral-adjust');
          $($('.adjustment')[i]).removeClass('negative-adjust');
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
$( ".checkbox" ).click(function($this) {
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
  };
  const options = { // Ajax request
    method: 'post',
    url: output_url,
    data: data
  };
  console.log(data);
  // 4. control returns here after being redirected from the backend
  $.ajax(options).done(response => {
    console.log(data);
      // show response of party submission here.
      let total_cost = parseFloat($("#total-cost").html());
      if(this.checked) $("#total-cost").html(total_cost - parseFloat(item_cost));
      else $("#total-cost").html(total_cost + parseFloat(item_cost));
  });
});
