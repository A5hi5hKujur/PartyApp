
let all = []; // store objects of all parties
let past = [];      // store objects of past parties
let upcoming = []; // store objects of upcoming parties
let ongoing = [];   // store objects of onging parties

// Fetching data from backend
$.get('/dashboard.json', function (parties) {
    parties.forEach(function(party){
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
    all = parties;
});

// List generating function
function generateList(parties) {
    var result = "";
    for (var i = 0; i < parties.length; i++) {
    result +=
      `
        <a href="/party/${parties[i]._id}">
        <li>
          <p class="party-name">${parties[i].party_name}</p>
          <p class="party-date">${parties[i].date}</p>
          <p class="party-contribution">${parties[i].totalcontribution}</p>
          <p class="party-venue">${parties[i].venue}</p>
        </li>
        `
    }
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