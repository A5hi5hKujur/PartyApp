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
            <li>
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
