
let past = [];      // store objects of past parties
let upcoming = []; // store objects of upcoming parties
let ongoing = [];   // store objects of onging parties

all.forEach(function(party){
    party.date = new Date(party.date);
    party.date = party.date.toDateString();
    if(party.status === "past") {
        past.push(party);
    }
    if(party.status === "upcoming") {
        upcoming.push(party);
    }
    if(party.status === "ongoing") {
        ongoing.push(party);
    }
});

// List generating function
function generateList(parties) {
    var result = "";
    for (var i = 0; i < parties.length; i++) {
    result +=
      ` <a href="/party/${parties[i]._id}">
          <li class="animate__animated animate__fadeInUp">
            <div class="party-thumb ${parties[i].party_theme}">
              <span class="${parties[i].status}-tag">${parties[i].status}</span>
            </div>
            <div class="party-info">
              <p class="party-name">${parties[i].party_name}</p>
              <div class="party-date-venue">
                <p>${parties[i].date}</p>
                <p>${parties[i].venue}</p>
              </div>
            </div>
          </li>
        </a>
        `
    }
    var no_parties = `
      <div class="empty-placeholder animate__animated animate__fadeInUp">
        <div class="placeholder-icon"></div>
        <h1 class="placeholder-heading">OOPS!</h1>
        <p class="placeholder-text">Looks like there are no parties going on here.</p>
      </div>
    `;
    if(result == "")
      $('#parties').html(no_parties);
    else
      $('#parties').html(result);
}

// Adding event listeners to the sorting buttons
$('#sort-section > button').on('click', function() {
    $('#sort-section > button').removeClass('active');
    $(this).addClass('active');
    var list_name = $(this).text().toLowerCase();
    if(list_name === 'all') {
        generateList(all);
    } else if(list_name === 'past') {
        generateList(past);
    } else if(list_name === 'upcoming') {
        generateList(upcoming);
    } else if(list_name === 'ongoing') {
        generateList(ongoing);
    }
});

// UI interaction function to toggle "Host party" popup.
function popup(i) {
  $(".overlay").eq(i).toggleClass("active");
}
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
