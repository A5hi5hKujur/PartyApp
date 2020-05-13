function popup(i) {
    $(".overlay").eq(i).toggleClass("active");
}

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
                <div class="item-icon" style="background-image: url(/media/icons/cake.jpg);"></div>
                <div class="item-content">
                  <div class="item-detail">
                    <p class="name">${newItem.name}</p>
                    <p class="quantity">Quantity : ${newItem.quantity}</p>
                    <p class="cost">Rs. ${newItem.price}</p>
                  </div>
                  <div class="item-ops">
                    <div class="options"></div>
                    <label class="custom-checkbox">
                      <input type="checkbox" checked="checked"> <!-- Mark item as purchased -->
                      <span class="checkmark"></span>
                    </label>
                  </div>
                </div>
              </li>
            `
        );
        $(".overlay").eq(1).toggleClass("active");
    });
});