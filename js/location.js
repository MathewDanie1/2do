var myLat; 
var myLon;
var geolocationWorking;
var geoLat;
var geoLon;
var myPlace;

$( document ).ready(function() {
  if ("geolocation" in navigator) { 
    navigator.geolocation.getCurrentPosition(function(position) {
    geolocationWorking = 1;
    geoLat = position.coords.latitude;
    geoLon = position.coords.longitude;
  });
  } else {
    geolocationWorking = 0;
  }
  var input = document.getElementById('location_search_term');
  var searchBox = new google.maps.places.SearchBox(input);

  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();
    if (places.length === 0) {
      return;
    } else {
      myLat = places[0].geometry.location.lat();
      myLon = places[0].geometry.location.lng();
      myPlace = places[0];
    }
  });
  closeAlertButton = document.getElementById("close_alert_button");
  closeAlertButton.addEventListener('click', closeAlertBox);
});

function displayBlock() {
  for (var i = 0; i < arguments.length; i++) {
    var element = document.getElementById(arguments[i]);
    $(element).css({'display': 'block'});
  }
}

function displayNone() {
  for (var i = 0; i < arguments.length; i++) {
    var element = document.getElementById(arguments[i]);
    $(element).css({'display': 'none'});
  }
}

function getLatLon () {     // function(s) to dictate which of the lat/lon variables to use in API calls
  var locate = [];
  if (myLat && myLon) {       // unlikely but check if receive lat without corresponding lon 
    locate = [myLat, myLon];
  } else if (geoLat && geoLon) {
    locate = [geoLat, geoLon];
  }
  else {
    showAlert("Your browser doesn't support geolocation.\n Please enter a location or try again. In the meantime... \nhere's what's 2do around Oxford St, London!");
    locate = [51.5136, 0.1556];
  }
    return locate;
}

// ALERT BOX SHOW AND HIDE
function showAlert(message) {
  var alertBox = document.getElementById("alert_box");
  var alertMessage = document.getElementById("alert_message");
  alertMessage.innerHTML = message;
  if ($(alertBox).css('display') !== 'block') {
    alertMessage.innerHTML = message;
    $(alertBox).css({'display': 'block'});
  }
}

function closeAlertBox() {
  var alertBox = document.getElementById("alert_box");
  var alertMessage = document.getElementById("alert_message");
    if ($(alertBox).css('display') !== 'none') {
      $(alertBox).css({'display': 'none'});
  }
}

function getTimeRange (){
  var date = new Date();
  var timeNow = date.getTime();
  var rangeSelected = document.getElementById("time_range_set").value;
  var endTime = timeNow + Number(rangeSelected);
  return timeNow + "," + endTime;
}

function getRadius (){
  var radiusSelected = document.getElementById("radius_set").value;
  return radiusSelected;
}

// setting these as global variables so can access outside this function
var eventsList = [];
var venuesList = [];
var map;
var markers = [];

function accessMeetupData (response) {
  if (response.results.length > 0) {
    var resultsDiv = document.getElementById("results");
    $(resultsDiv).css({'display': 'block'});
    var image = {
    url: "images/2dologo.gif", // url
    scaledSize: new google.maps.Size(45,45), // scaled size
    anchor: new google.maps.Point(1.0, 0.32)
    }; 
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: getLatLon()[0], lng: getLatLon()[1]},
      zoom: 13
    });    
    var resultsCount = document.getElementById("results_count");
    var resultsFirst = document.getElementById("earliest_result");
    resultsCount.innerHTML = "<span id='display_event_no'></span>" + response.results.length + " events found"
    resultsFirst.innerHTML = "Select map icon for event info or click here for events by time";
    
    for(var i = 0; i < response.results.length; i++) {      // CREATING HTML DIVS FOR EACH EVENT TO APPEND INFO via createInfoBox
      var eventBoxDiv = document.getElementById("eventBoxes");
      var eventBox = document.createElement('div');
      eventBox.setAttribute("id", ("eventBoxNo"+ i));
      eventBox.setAttribute("class", "event_box");
      eventBoxDiv.appendChild(eventBox);
      var eventLat;
      var eventLon;
      var eventVenue;
      var eventVenueAddress;
      if (response.results[i].venue) {
        eventLat = response.results[i].venue.lat;
        eventLon = response.results[i].venue.lon;
        eventVenue = response.results[i].venue.name;
        eventVenueAddress = response.results[i].venue.address_1;
      } else {
        eventLat = response.results[i].group.group_lat;
        eventLon = response.results[i].group.group_lon;
        eventVenue = "awaiting venue name"
        eventVenueAddress = "awaiting venue address";
      }
      var eventName = response.results[i].name;
      var eventStart = new Date(response.results[i].time);
      eventsList[i] = {
      groupName: response.results[i].group.name, 
      eventName: eventName, 
      eventDescription: response.results[i].description, 
      eventStartTime: eventStart, 
      eventDuration: response.results[i].duration,
      eventLat: eventLat, 
      eventLon: eventLon,
      eventLatLon: {eventLat, eventLon},
      eventVenue: eventVenue,
      eventVenueAddress: eventVenueAddress
      };        
      createInfoBox(i);
      presentTime(eventsList[i].eventStartTime);
    };
    
    for (var i = 0;  i < eventsList.length; i++) {
      var dayTime = presentTime(eventsList[i].eventStartTime);
      markers[i] = new google.maps.Marker({
        position: {lat: eventsList[i].eventLatLon.eventLat, lng: eventsList[i].eventLatLon.eventLon},
        icon: image,
        map: map,
        title: (dayTime[0] + " " + dayTime[2] + " " + dayTime[1] + ": " + dayTime[4].slice(0,5) + ".\n" + eventsList[i].eventName),
      }); 
      markers[i].index = i; // THIS ALLOWS ME TO ACCESS INDEX NUMBER SO CAN REFER TO EVENTSLIST ON CLICK
      google.maps.event.addListener(markers[i], 'click', function() {
        $(eventBoxDiv).css({'display': 'block'});
        eventPopUp(this.index)
      });
    };
    var gotoEvents = document.getElementById("earliest_result");
    gotoEvents.addEventListener('click', function() {
      $(eventBoxDiv).css({'display': 'block'});
      eventPopUp("0");
      $("#venue_content_div").css({'display': 'none'});
      $("span[class^='venue_insert']").html("");
    });
  } else {
        showAlert("Oops! Your search returned no results. Please adjust your search inputs and try again.")
  };
}

function presentTime(timeString) {
  var timeArray = timeString.toString().split(" ");
  return timeArray;
}       

// creating event info-boxes html dynamically with 'id's in order to avoid using 'class' and overwriting layouts  
function createInfoBox(i) {
  var thisEventBox = document.getElementById("eventBoxNo" + i); 
  var dayTime = presentTime(eventsList[i].eventStartTime);

  // fixed nav for date, time, title, venue and minimize buttton
  var eventBoxNav = document.createElement('nav');
  eventBoxNav.setAttribute("id", "event_nav" + i);
  thisEventBox.appendChild(eventBoxNav);

  // div to include date and time
  var eventStartDiv = document.createElement('div');
  eventStartDiv.setAttribute("id", "event_start_div" + i);
  eventBoxNav.appendChild(eventStartDiv);

  // div for date display
  var eventDateDiv = document.createElement('div');
  eventDateDiv.setAttribute("id", "event_date_div" + i);
  eventStartDiv.appendChild(eventDateDiv);

  var eventDayP = document.createElement('p');
  eventDayP.setAttribute("id", "event_day_p" + i);
  eventDayP.innerHTML = dayTime[0];
  eventDateDiv.appendChild(eventDayP); 

  var eventDateP = document.createElement('p');
  eventDateP.setAttribute("id", "event_date_p" + i);
  eventDateP.innerHTML = dayTime[2];
  eventDateDiv.appendChild(eventDateP);  

  var eventMonthP = document.createElement('p');
  eventMonthP.setAttribute("id", "event_month_p" + i);
  eventMonthP.innerHTML = dayTime[1];
  eventDateDiv.appendChild(eventMonthP);

  // div for date display
  var eventTimeDiv = document.createElement('div');
  eventTimeDiv.setAttribute("id", "event_time_div" + i);
  eventTimeDiv.innerHTML = dayTime[4].slice(0,5);
  eventStartDiv.appendChild(eventTimeDiv);

// div for event name and location
  var eventNamePlaceDiv = document.createElement('div');
  eventNamePlaceDiv.setAttribute("id", "event_name_place_div" + i);
  eventBoxNav.appendChild(eventNamePlaceDiv); 

  // div for event name 
  var eventNameDiv = document.createElement('div');
  $(eventNameDiv).attr({"id": ("event_name_div" + i), "class": "link", "title": "click for event info"});
  eventNameDiv.innerHTML = eventsList[i].eventName;
  eventNamePlaceDiv.appendChild(eventNameDiv); 

  eventNameDiv.addEventListener('click', function() {
    $("#venue_content_div").css({'display': 'none'});  
  });

  // div for event venue
  var eventVenueDiv = document.createElement('div');
  $(eventVenueDiv).attr({"id": ("event_venue_div" + i), "class": "link", "title": "click for venue info"});
  eventVenueDiv.innerHTML = ("location:     " + eventsList[i].eventVenue + ", " + eventsList[i].eventVenueAddress);
  eventNamePlaceDiv.appendChild(eventVenueDiv);

  eventVenueDiv.addEventListener('click', function() {
    getFoursquareData(eventsList[i].eventVenue, i);
  });

  // div for minimize and info box navigation buttons 
  var eventMinimizeDiv = document.createElement('div');
  eventMinimizeDiv.setAttribute("id", "event_minimize_div" + i);
  eventBoxNav.appendChild(eventMinimizeDiv);

  // each = buttons + description visible to user on hover
  var returnToMap = document.createElement('div');
  $(returnToMap).attr({"id": ("return_to_map" + i), "class": "link", "title": "return to map"});

  returnToMap.innerHTML = "<img id='map_button' src='images/map_view.gif'>";
  eventMinimizeDiv.appendChild(returnToMap); 
  changeCol(returnToMap);
  
  var nextEventBox = document.createElement('div');
  $(nextEventBox).attr({"id": ("next_event_box" + i), "class": "link", "title": i});
  nextEventBox.innerHTML = ">";
  eventMinimizeDiv.appendChild(nextEventBox);
  changeCol(nextEventBox);

  nextEventBox.addEventListener('click', function () {
    if (i < (eventsList.length - 1)) {
      $(thisEventBox).css({'display': 'none'});
      eventPopUp(i + 1);
    } else {
     showAlert("that was the last event... try searching again!");
    }
    $("#venue_content_div").css({'display': 'none'});
    $("span[class^='venue_insert']").html("");
  });

  var lastEventBox = document.createElement('div');
  $(lastEventBox).attr({"id": ("last_event_box" + i), "class": "link", "title": i});
  lastEventBox.innerHTML = "<";
  eventMinimizeDiv.appendChild(lastEventBox); 
  changeCol(lastEventBox);

  lastEventBox.addEventListener('click', function () {
    if (i > 0) {
      $(thisEventBox).css({'display': 'none'});
      eventPopUp(i - 1);
    } 
    else {
     showAlert("this is the first event!");
    }
    $("#venue_content_div").css({'display': 'none'});
    $("span[class^='venue_insert']").html("");
  });

  // div for event content 
  var eventContentDiv = document.createElement('div');
  eventContentDiv.setAttribute("id", "event_content_div" + i);
  eventContentDiv.innerHTML = eventsList[i].eventDescription;
  thisEventBox.appendChild(eventContentDiv);

  // adding event listener to allow appearance/disappearance of event box
  returnToMap.addEventListener('click', function() { 
    $(thisEventBox).css({'display': 'none'});
    $("span[class^='venue_insert']").html("");
    $("#results_count").children('span').text(""); // clearing the number of last viewed event from results div
    displayBlock('earliest_result', 'searching', 'map')
    displayNone('venue_content_div', 'eventBoxNo0', 'eventBoxes')
  })
  }

function getFoursquareData(x, i) {
  getFoursquareId = new XMLHttpRequest();
  getFoursquareId.addEventListener('load', function() {
    var data = JSON.parse(getFoursquareId.response); 
    if (data.response.venues[0]) {          // ensuring foursquare data exists before making second api call
      getMoreFoursquareData(data.response.venues[0].id);
    } else {
      $("#venue_name").html("no foursquare info");
    }
  });

  getFoursquareId.open("GET", "https://api.foursquare.com/v2/venues/search?client_id=ZXWEXMAKLALL2UHNHLARGE5WG2CI1YWQWOVKYYANTOGCUU0O&client_secret=1J2XO2UXTMQJL03S1MJVQVEC1FKMPR1PJ3PUJQPJ33NQPWHL&v=20130815&ll=" + getLatLon()[0] + "," + getLatLon()[1] + "&query=" + x);
  getFoursquareId.send();

  var getMoreFoursquareData = function(id) {    
  foursquareVenue = new XMLHttpRequest();
  foursquareVenue.addEventListener('load', function() {
  var venueData = JSON.parse(foursquareVenue.response);
    if (venueData.response.venue.name) {
      $("#venue_name").html(venueData.response.venue.name);
    } else {
      $("#venue_name").html("no foursquare info");
    };
    $("#venue_category").html(venueData.response.venue.categories[0].name || "n/a");
    $("#venue_rating").html(venueData.response.venue.rating || " - ");
    $("#venue_image").html("<img src='" + venueData.response.venue.bestPhoto.prefix + "170" + venueData.response.venue.bestPhoto.suffix + "'/>");
    for (var i = 0; i < (Math.min(3, venueData.response.venue.location.formattedAddress.length)); i++) {
      $("#venue_address" + (i+1)).html(venueData.response.venue.location.formattedAddress[i]);
    };
    $("#venue_url").html(("<a href='" + venueData.response.venue.url + "'>" + venueData.response.venue.url + "</a>") || "");
    if (venueData.response.venue.tips.groups[0].items.length > 0) {
      for (var i = 0; i < venueData.response.venue.tips.groups[0].items.length; i++) {
        $( "#venue_tips" ).append("<p><span class='venue_insert'>'" + venueData.response.venue.tips.groups[0].items[i].text + "'</span></p>");
      }
    } else {
      $("#venue_tips" ).html( "<span class='venue_insert'>no user suggestions for this location</span>" );
    };        
  });
  foursquareVenue.open("GET", "https://api.foursquare.com/v2/venues/" + id + "?client_id=ZXWEXMAKLALL2UHNHLARGE5WG2CI1YWQWOVKYYANTOGCUU0O&client_secret=1J2XO2UXTMQJL03S1MJVQVEC1FKMPR1PJ3PUJQPJ33NQPWHL&v=20130815");
  foursquareVenue.send();     
  }
  $("#venue_content_div").css({'display': 'block'});
}

function changeCol(element){
  var getPrompt = $(element).attr('id');
  element.addEventListener('mouseover', function() { 
    $(element).css({'color': 'white', 'background-color': 'mediumpurple'});
  });
  element.addEventListener('mouseout', function() { 
    $(element).css({'color': 'black', 'background-color': 'white'});
  });
}

function eventPopUp(event) {
  var eventBox = document.getElementById("eventBoxNo" + event);
  var eventBoxUp = document.getElementById("eventBoxNo" + (event - 1));
  var eventBoxDown = document.getElementById("eventBoxNo" + (event + 1));
  $(eventBox).css({'display':'block'});
  displayNone('earliest_result', 'searching', 'map');
  $("#results_count").children('span').text("event " + (event + 1) + " of ");
}

function getMeetups (lat, lon, radius, time, success){
  $.ajax({
    url: "https://api.meetup.com/2/open_events.jsonp?",
    data: {
        lat: lat,
        lon: lon, 
        radius: radius,                       
        time: time, 
        ordering: "time", 
        key: "6483b557e1454a3a2b375c647a2058"
    },
    dataType: "jsonp",
    type: "GET",
    success: success
  });
}

// window onload for following code as when using document.ready sometimes triggered too soon causing issues with map
window.onload = function(){ 
  var search_button = document.getElementById('search_button');
  var welcome_div = document.getElementById("welcome");
  search_button.addEventListener('click', function() { 
  eventsList = [];
  venuesList = [];
  for(var i = 0; i < eventsList.length; i++) {
    var child = document.getElementById("eventBoxNo"+ i);
    if (child) {
      child.parentNode.removeChild(child);
    }
  }
// reference http://www.w3schools.com/js/js_htmldom_nodes.asp for this child/parent workaround
  getMeetups(getLatLon()[0], getLatLon()[1], getRadius(), getTimeRange(), accessMeetupData);  
  $("div[id^=" + "eventBoxNo" + "]").remove();
  $("span[class^='venue_insert']").html("");
  displayBlock('map', 'searching', 'earliest_result')
  displayNone('welcome', 'eventBoxes', 'eventBoxNo0', "venue_content_div");
 });
}




