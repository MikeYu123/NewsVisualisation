// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require_tree .
//= require_tree ../../../vendor/assets/javascripts/.
//= require materialize-sprockets
var map;
var markers = Array();
var cityIcon;
var regionIcon;

function leave10Words(body) {
  return body.split(" ").slice(0, 11).join(' ') + "...";
}

function resetMap(map) {
  map.setZoom(3);
}

function searchFor(uuid) {
  for (var i = 0; i < markers.length; i++) {
    if (markers[i].uuid === uuid) {
      return markers[i];
    }
  }
  return null;
}

function getNewsFor(uuid, location_name) {
  fetch('/points/get_articles_for?uuid=' + uuid).then(function(result) {
    result.json().then(function(r) {
      renderNews(r, location_name, uuid);
    });
  });
}

function getTodayNewsFor(uuid, location_name) {
  fetch('/points/get_today_articles_for?uuid=' + uuid).then(function(result) {
    result.json().then(function(r) {
      renderNews(r, location_name, uuid);
    });
  });
}

function renderPrompt(locations) {
  prev_elems = document.getElementsByClassName('on-front');
  for (i = 0; i < prev_elems.length; i++) {
    document.body.removeChild(prev_elems[i]);
  }
  var prompt_text = 'Возможно, вы искали следующие локации: <ul>'
  for (i = 0; i < locations.length; i++) {
    prompt_text += '<li>' + locations[i].name + '</li>';
  }
  var promptBlock = document.createElement('div');
  promptBlock.className = 'on-front';

  var promptCard = document.createElement('div');
  promptCard.className = 'card';
  var promptContent = document.createElement('div');
  promptContent.className = 'card-content';
  promptCard.appendChild(promptContent);
  var promptTitle = document.createElement('span');
  promptTitle.className = 'card-title';
  promptTitle.innerHTML = prompt_text;
  promptContent.appendChild(promptTitle);
  promptBlock.appendChild(promptCard);
  document.body.appendChild(promptBlock);
  resetMap(map);
}

function renderNews(news, location_name, uuid) {
  prev_elems = document.getElementsByClassName('on-front');
  for (i = 0; i < prev_elems.length; i++) {
    document.body.removeChild(prev_elems[i]);
  }
  var articlesBlock = document.createElement('div');
  articlesBlock.className = 'on-front';

  var locationTitleCard = document.createElement('div');
  locationTitleCard.className = 'card';
  var locationTitleContent = document.createElement('div');
  locationTitleContent.className = 'card-content';
  locationTitleCard.appendChild(locationTitleContent);
  var locationTitleTitle = document.createElement('span');
  locationTitleTitle.className = 'card-title';
  locationTitleTitle.innerHTML = location_name;
  locationTitleContent.appendChild(locationTitleTitle);

  articlesBlock.appendChild(locationTitleCard);

  for (i = 0; i < news.length; i++) {
    articlesBlock.appendChild(renderArticle(news[i]));
  }

  var articlesMoreCard = document.createElement('div');
  articlesMoreCard.className = 'card';
  var articlesMoreActions = document.createElement('div');
  articlesMoreActions.className = 'card-action';
  articlesMoreCard.appendChild(articlesMoreActions);
  var articlesMoreLink = document.createElement('a');
  articlesMoreLink.innerHTML = "Все новости для данной локации";
  articlesMoreLink.href = '/locations/more?uuid=' + uuid;
  articlesMoreLink.target = "_blank";
  articlesMoreActions.appendChild(articlesMoreLink);
  articlesBlock.appendChild(articlesMoreCard);

  document.body.appendChild(articlesBlock);
}

function renderArticle(article) {
  var articleCard = document.createElement('div');
  articleCard.className = 'card';
  var articleContent = document.createElement('div');
  articleContent.className = 'card-content';
  articleCard.appendChild(articleContent);
  var articleTitle = document.createElement('div');
  articleTitle.className = 'card-title';
  articleTitle.innerHTML = article.title;
  articleContent.appendChild(articleTitle);
  var articleBody = document.createElement('p');
  articleBody.innerHTML = leave10Words(article.body);
  articleContent.appendChild(articleBody);
  var articleActions = document.createElement('div');
  articleActions.className = 'card-action';
  articleCard.appendChild(articleActions);
  var articleLink = document.createElement('a');
  articleLink.innerHTML = "Читать далее";
  articleLink.href = article.url;
  articleLink.target = "_blank";
  articleActions.appendChild(articleLink);
  return articleCard
}

function attachMarkerData(marker, uuid, name, lat, lng, location_type, map, is_today) {
  var markerData = {
    uuid: uuid,
    name: name,
    lat_lng: new google.maps.LatLng(lat, lng),
    location_type: location_type,
    is_today: is_today
  };

  marker.addListener('click', function() {
    if (markerData.is_today) {
      getTodayNewsFor(markerData.uuid, markerData.name);
    } else {
      getNewsFor(markerData.uuid, markerData.name);
    }
    map.setCenter(markerData.lat_lng);
    map.setZoom(zoomValue(markerData.location_type));
  });
}

function zoomValue(location_type) {
  switch (location_type) {
    case "city":
      return 13;
      break;
    case "country":
      return 6;
      break;
    case "region":
      return 8;
      break;
    case "subregion":
      return 7;
      break;
    default:
      return 1;
      break;
  }
}

function clearMarkers() {
  var marker = markers.pop();
  while (marker !== undefined) {
    marker.setMap(null);
    marker = markers.pop();
  };
}

function getInRegion(map) {
  clearMarkers();
  var lat_min = map.getBounds().getSouthWest().lat().toString();
  var lng_min = map.getBounds().getSouthWest().lng().toString();
  var lat_max = map.getBounds().getNorthEast().lat().toString();
  var lng_max = map.getBounds().getNorthEast().lng().toString();
  fetch('/points/get_in_region?lat_min=' + lat_min + "&lat_max=" + lat_max + '&lng_min=' + lng_min + '&lng_max=' + lng_max)
    .then(function(result) {
      result.json().then(
        function(r) {
          var cities = r.cities;
          var regions = r.regions;
          var subregions = r.subregions;
          var countries = r.countries;
          for (var i = 0; i < cities.length; i++) {
            var marker = new google.maps.Marker({
              position: {
                lat: cities[i].lat,
                lng: cities[i].lng
              },
              map: map,
              title: cities[i].name,
              zIndex: 5,
              icon: cityIcon,
              uuid: cities[i].uuid
            });
            markers.push(marker);
            attachMarkerData(marker, cities[i].uuid, cities[i].name);
          };
          var region_markers = [];
          for (i = 0; i < regions.length; i++) {
            var marker = new google.maps.Marker({
              position: {
                lat: regions[i].lat,
                lng: regions[i].lng
              },
              map: map,
              title: regions[i].name,
              icon: regionIcon,
              zIndex: 5,
              uuid: regions[i].uuid
            });
            markers.push(marker);
            attachMarkerData(marker, regions[i].uuid, regions[i].name);
          };
        })
    });
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 55,
      lng: 35
    },
    zoom: 5
  });
  var reset_button = document.getElementById('zoomOut');
  reset_button.addEventListener('click', function() {
    resetMap(map);
  });
  cityIcon = {
    url: '/city.svg',
    size: new google.maps.Size(25, 25),
    scaledSize: new google.maps.Size(25, 25),
    origin: new google.maps.Point(0, 0)
  };
  regionIcon = {
    url: '/region.svg',
    size: new google.maps.Size(45, 45),
    scaledSize: new google.maps.Size(45, 45),
    origin: new google.maps.Point(0, 0)
  };
  subregionIcon = {
    url: '/subregion.svg',
    size: new google.maps.Size(35, 35),
    scaledSize: new google.maps.Size(35, 35),
    origin: new google.maps.Point(0, 0)
  };
  countryIcon = {
    url: '/country.svg',
    size: new google.maps.Size(55, 55),
    scaledSize: new google.maps.Size(55, 55),
    origin: new google.maps.Point(0, 0)
  };
  var drawMarkers = function(is_today) {
    url = is_today ? 'points/get_today_points' : 'points/get_all_points'
    fetch(url).then(function(result) {
      result.json().then(
        function(r) {
          clearMarkers();
          var cities = r.cities;
          var regions = r.regions;
          var subregions = r.subregions;
          var countries = r.countries;
          for (var i = 0; i < cities.length; i++) {
            var marker = new google.maps.Marker({
              position: {
                lat: cities[i].lat,
                lng: cities[i].lng
              },
              map: map,
              title: cities[i].name,
              zIndex: 9,
              icon: cityIcon,
              uuid: cities[i].uuid
            });
            markers.push(marker);
            attachMarkerData(marker, cities[i].uuid, cities[i].name, cities[i].lat, cities[i].lng, "city", map, is_today);
          }
          for (i = 0; i < regions.length; i++) {
            var marker = new google.maps.Marker({
              position: {
                lat: regions[i].lat,
                lng: regions[i].lng
              },
              map: map,
              title: regions[i].name,
              icon: regionIcon,
              zIndex: 7,
              uuid: regions[i].uuid
            });
            markers.push(marker);
            attachMarkerData(marker, regions[i].uuid, regions[i].name, regions[i].lat, regions[i].lng, "region", map, is_today);
          }
          for (i = 0; i < subregions.length; i++) {
            var marker = new google.maps.Marker({
              position: {
                lat: subregions[i].lat,
                lng: subregions[i].lng
              },
              map: map,
              title: subregions[i].name,
              icon: subregionIcon,
              zIndex: 8,
              uuid: subregions[i].uuid
            });
            markers.push(marker);
            attachMarkerData(marker, subregions[i].uuid, subregions[i].name, subregions[i].lat, subregions[i].lng, "subregion", map, is_today);
          }
          for (i = 0; i < countries.length; i++) {
            var marker = new google.maps.Marker({
              position: {
                lat: countries[i].lat,
                lng: countries[i].lng
              },
              map: map,
              title: countries[i].name,
              icon: countryIcon,
              zIndex: 6,
              uuid: countries[i].uuid
            });
            markers.push(marker);
            attachMarkerData(marker, countries[i].uuid, countries[i].name, countries[i].lat, countries[i].lng, "country", map, is_today);
          };
        })
    });
  };
  var drawAll = function() {
    drawMarkers(false);
  }
  var drawToday = function() {
    drawMarkers(true);
  }
  document.getElementById('todayNews').addEventListener('click', function() {
    drawToday();
    var today_button = document.getElementById('todayNews');
    today_button.style.display = 'none';
    var all_button = document.getElementById('allNews');
    all_button.style.display = 'block';
  });
  document.getElementById('allNews').addEventListener('click', function() {
    drawAll();
    var today_button = document.getElementById('todayNews');
    today_button.style.display = 'block';
    var all_button = document.getElementById('allNews');
    all_button.style.display = 'none';
  });
  drawAll();
}
