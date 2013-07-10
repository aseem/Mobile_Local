// This function is called when the application first loads
$(document).ready(function(){
	
	// setup error handling for all JSON requests in case something goes wrong
	$.ajaxSetup({
		"error":function() { 
			alert("Unable to receive data from the service."
		);}
	});
	
	// load the previous search history if localStorage is supported
	if (typeof localStorage !== 'undefined') {
		$("#mobile_local1").text(localStorage.mobile_local1);
		$("#mobile_local2").text(localStorage.mobile_local2);
		$("#mobile_local3").text(localStorage.mobile_local3);
		$("#mobile_local4").text(localStorage.mobile_local4);
		$("#mobile_local5").text(localStorage.mobile_local5);
	}

	// geo-locate when the app starts up.
	geoLocate();	
});

/***************************************************************************** 
Utility Functions
This section contains functions used by the event handlers
*****************************************************************************/


// This function switches the menu between the current
// weather & news to the input form & previous searches
// This is used by several other event handlers and methods.
function toggleMenu() {
    
	$('#weather-container').toggleClass('hidden');
    $('#news-container').toggleClass('hidden');
    $('#user-input').toggleClass('hidden');
	$('#history-container').toggleClass('hidden');
	$('#address').val('');
	if ($(".leftButton").text() === "Menu") {
		$(".leftButton").text("Back");
	}
	else {
		$(".leftButton").text("Menu");
	}
}


// This function uses localStorage to update the search history
// with the latest request the user has made.
function updateHistory(newLocation) {
	
	// only add to history if localStorage is supported 
	if (typeof localStorage !== 'undefined') {
		// update localStorage
		localStorage.mobile_local5 = localStorage.mobile_local4;
		localStorage.mobile_local4 = localStorage.mobile_local3;
		localStorage.mobile_local3 = localStorage.mobile_local2;
		localStorage.mobile_local2 = localStorage.mobile_local1;
		localStorage.mobile_local1 = newLocation;

		// update the DOM
		$("#mobile_local1").text(localStorage.mobile_local1);
		$("#mobile_local2").text(localStorage.mobile_local2);
		$("#mobile_local3").text(localStorage.mobile_local3);
		$("#mobile_local4").text(localStorage.mobile_local4);
		$("#mobile_local5").text(localStorage.mobile_local5);
	}	
}

// This function translates the Yahoo! Weather service forecast code that is
// passed in as a parameter and updates the application's background image 
// accordingly.  It also returns a string describing the forecast that the 
// caller can use.
function translateYahooWeather(code) {
	
	// remove the current background image
	$("body").removeClass();
	
	
	// The following if-statements are brute-force checks on the 
	// forecast codes returned by Yahoo.
	if (code >= 9 && code <= 12) {
		$("body").addClass("rain");
		return "rain";
	}
	
	if ((code >= 19 && code <= 24) ||
		(code >= 26 && code <= 30) ||
		code == 44) {
			$("body").addClass("cloudy");
			return "cloud";	
	}
	
	if ((code >= 31 && code <= 34) ||
		code == 36) {
			$("body").addClass("sunny");
			return "sunny";	
	}
	
	if ((code >= 5 && code <= 8) ||
		(code >= 13 && code <= 18) ||
		code == 25 || code == 35 ||
		(code >= 41 && code <= 43) ||
		code == 46) {
			$("body").addClass("snow");
			return "snow";	
	}
	
	if ((code >= 0 && code <= 4) ||
		(code >= 37 && code <= 39) ||
		code == 45 || code == 47)
		{
			$("body").addClass("storm");
			return "storm";
		}
		
	// default to sunny :)
	return "sunny";
}

// This function uses the browser's geolocation functionality to determine
// the user's current (city, state)
function geoLocate() {
    // Use the navigator to determine the current position
	navigator.geolocation.getCurrentPosition(function(position) {
		// use the latitude & longitude to to create a URL to pass
		// to the Google Maps service
		var lat = position.coords.latitude;
    	var lng = position.coords.longitude;
		var url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + ',' 
					+ lng + "&sensor=true";
		
		// make the request	and update the location in the application	
		$.getJSON(url, function(data) {
			updateLocation(data);
		});	
	},
	// check for errors
	function(PositionError) {
		alert(PositionError.message);
		toggleMenu();
	});
}

// This function takes in a JSON object from the Google Maps services
// and updates the application's current location information
function updateLocation(data) {
	
	// if we did not get any results, throw an error
	if (data.status === "ZERO_RESULTS") {
		console.log(data);
    	alert('BOOM: We were not able to locate your input on the map.');
    	return;
	}

	// parse the returned object and obtain the (city, state)
	var components = data.results[0].address_components;
	for (var i = 0; i < components.length; i++) {
		if (components[i].types.indexOf("locality") !== -1) {
       		var city = components[i].long_name;
    	}
    	else if (components[i].types.indexOf
					("administrative_area_level_1") !== -1) {
        	var state = components[i].short_name;
    	}
	}
	
	// if we could not obtain the (city, state), thorow an error
	if (typeof city === 'undefined' || typeof state === 'undefined') {
    	alert('The input is invalid, please try again');
    	return;
	}
	
	// update the DOM with the (city, state)
	$("#city-state").text(city + ', ' + state);

	// obtain the local weather and news and update the application
	getLocalWeather(city, state);
	getLocalNews(city, state);	
}

// This function takes in the current (city, state) and obtains the 
// current local news articles using Google News.  It then displays
// the news articles in the application.
function getLocalNews(city, state) {
	
	// strip out any white space from the (city, state)
	city = city.replace(/\s/g, '');
	state = state.replace(/\s/g, '');
	
	// construct the URL to obtain local news from Google News
	var query = "select * from rss where url = 'http://news.google.com/news?geo=" 
	+ city +","+ state + "&output=rss'";
	
	var url = 'http://query.yahooapis.com/v1/public/yql?format=json&q=' 
	+ encodeURIComponent(query) + '&format=jsonp&callback=?'
	
	// get news JSON & Update the DOM
	$.getJSON(url, function(data) {
		$('#news-container').empty();
		$.each(data.query.results.item, function (index, article) {
		        $('#news-container').append("<p><a href='" + article.link + "'>" +
                article.title + "</a><br></p><br>");
        });
	});
}


// This function takes in teh current (city, state) and obtains the 
// current local weather using Yahoo! Weather.  It then displays
// the day's weather forecast in the application
function getLocalWeather(city, state) {
	
	// strip out any white space from the (city, state)
	city = city.replace(/\s/g, '');
	state = state.replace(/\s/g, '');
	
	// construct th URL to obtain local weather from Yahoo Weather
	var query = "SELECT * FROM weather.bylocation WHERE location='" + 
	city + ", "+ state + "' AND unit='f'";
	
	var url = 'http://query.yahooapis.com/v1/public/yql?format=json&q=' + 
	encodeURIComponent(query) 
	+ '&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys'
	+ '&format=jsonp&callback=?';
	
	// get weather data and update the DOM appropriately
	$.getJSON(url, function(data) {
		
		// remove the current weather data being displayed
		$('#weather-icon').empty();
		$('#weather-temp').empty();
		$('#weather-hilo').empty();
		
		// if we couldn't get any weather data, display an error
		if (data.query.results.weather.rss.channel.item.title == "City not found") {
			alert("We could not find weather information for your query");
			return;
		}
		
		// parse the Yahoo! Weather service object to get the current day's info
		var currentInfo = data.query.results.weather.rss.channel.item.condition;
		var forecastInfo = data.query.results.weather.rss.channel.item.forecast
		
		// update the background based on the foreacast code and determine the 
		// correct icon image to use.
		var img_src = "images/" + translateYahooWeather(forecastInfo[0].code) + ".png";
		
		// udpate the DOM to display the weather.
		$('#weather-icon').append("<image src=" + img_src + ">");
		$('#weather-temp').append("<span>" + currentInfo.temp + "&deg</span>");
		$('#weather-hilo').append("<span>" + forecastInfo[0].low + "&deg/" + 
		forecastInfo[0].high + "&deg</span>");	
	});
}


// Helper function used when submitting the form where the user
// requests a specific location.  This is called in the form event handler
// and when the user selects a previous search.
function submitForm() {
	
	var inputAddress = $("#address").val();	
	
	// URL to geo-locate our position
 	var geoURL = "http://maps.googleapis.com/maps/api/geocode/json?address=" + 
				inputAddress + "&sensor=true";

	// reset the text box input and switch the menu to the temperature and news
	// display
	$('#address').blur();
	toggleMenu();

	// get the JSON from Google Maps and update the application's location
 	$.getJSON(geoURL, function(data) {    	
		updateLocation(data);
	});
}

/***************************************************************************** 
Event Handlers
This section contains event handlers for various UI in the application
*****************************************************************************/

// Handler for the input form where the user enters the location
$("#form-location").on('submit', function() {
	
	updateHistory($("#address").val());
	submitForm();
 	return false;
});


// Handler for the previous search history.  This iniates a form request
// for the selected history item
$("#history-container li").on('click', function(e) { 
	
	$("#address").val($(this).text());
	submitForm();
});