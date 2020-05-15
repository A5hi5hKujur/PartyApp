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
        $('#items-form')[0].reset();
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
    var total = parseFloat($("#total-cost").text()) - itemCost;
    $("#total-cost").text(total);
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
        console.log("Item removed successfully");
        // this is the updated party with removed item
        // may be used in future
        // console.log(updatedParty);
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
  /*
    0 load any item after checking if the item.purchased == true or false.
      mark the item in the UI accordingly.
    1. Assign an item id to an item in the DOM.
    2. Find out which item id has been checked for purchase.
    3. Send the check status along with the item id in the backend.
    4. Value gets updated in the database, control returns here.
    5. Deduce the total cost amount ater a checkbox checked.
       Add the amount of item to the total cost if unchecked.
  */
  // 2. find the id of the selected item :
  let item_id = $(this).parent().parent().parent().parent().attr("id");

  // 3. send item id and party id to the backend :
  let input_url = window.location.href;
  let party_id = input_url.split('/')[4];
  let output_url = "/party/"+party_id+"/purchase/"+item_id;
  let purchase = this.checked;
  const options = { // Ajax request
    method: 'post',
    url: output_url,
    data: data
  };

  // 4. control returns here after being redirected from the backend
  $.ajax(options).done(response => {
      // show response of party submission here.

  });
});
