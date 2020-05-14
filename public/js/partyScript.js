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
    $.post('/party/'+ id +'/item', newItem, function(newItem) {
        $('.item-list').append(
            `
            <li id="item">
                <div class="item-icon ${newItem.category.toLowerCase()}-icon"></div>
                <div class="item-content">
                  <div class="item-detail">
                    <p class="name">${newItem.name}</p>
                    <p class="quantity">Quantity : ${newItem.quantity}</p>
                    <p class="cost">Rs. ${newItem.price}</p>
                  </div>
                  <div class="item-ops">
                    <div class="options"></div>
                    <label class="custom-checkbox">
                      <input type="checkbox">
                      <span class="checkmark"></span>
                    </label>
                  </div>
                </div>
              </li>
            `
        );
        $(".overlay").eq(1).toggleClass("active");
        var total = parseFloat($("#total-cost").text()) + newItem.price;
        $("#total-cost").text(total);
    });
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
