function popup(i) {
    $(".overlay").eq(i).toggleClass("active");
}
// Add new Item.
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
                      <input class="checkbox" type="checkbox"> <!-- Mark item as purchased -->
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
});
