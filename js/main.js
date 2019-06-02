let restaurants,
  neighborhoods,
  cuisines
var nMaps
var markers = []

document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});


fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}


fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const selects = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const options = document.createElement('option');
    options.innerHTML = neighborhood;
    options.value = neighborhood;
    selects.append(options);
  });
}


fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}


fillCuisinesHTML = (cuisines = self.cuisines) => {
  const selects = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const options = document.createElement('option');
    options.innerHTML = cuisine;
    options.value = cuisine;
    selects.append(options);
  });
}


initMap = () => {
  self.nMaps = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'insert your token here',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(nMaps);

  updateRestaurants();
}

resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ulist = document.getElementById('restaurants-list');
  ulist.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}


updateRestaurants = () => {
  const cuisineSelect = document.getElementById('cuisines-select');
  const neighborSelect = document.getElementById('neighborhoods-select');

  const cuisineIndex = cuisineSelect.selectedIndex;
  const neighborIndex = neighborSelect.selectedIndex;

  const cuisine = cuisineSelect[cuisineIndex].value;
  const neighborhood = neighborSelect[neighborIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
}



fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ulist = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ulist.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}


createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  var imgurBase = DBHelper.imageUrlForRestaurant(restaurant);
  const imgur1 = imgurBase + "_320.jpg";
  const imgur2 = imgurBase + "_503.jpg";
  const imgur3 = imgurBase + "_900.jpg";
  image.src = imgur1;
  image.srcset = `${imgur1} 320w, ${imgur2} 503w, ${imgur3} 900w`;
  image.sizes = `(max-width: 503px) 320px, (max-width: 900px) 503px, 900px`;
  image.alt = restaurant.name + " restaurant marketing photograph";										  										
  li.append(image);

  const names = document.createElement('h2');
  names.innerHTML = restaurant.names;
  li.append(names);

  const neighbor = document.createElement('p');
  neighbor.className = 'restaurant-neighborhood';
  neighbor.innerHTML = restaurant.neighbor;
  li.append(neighbor);

  const address = document.createElement('p');
  address.className = 'restaurant-address';
  address.innerHTML = restaurant.address;
  li.append(address);

  const mores = document.createElement('button');
  var label_attribute = document.createAttribute("aria-labelledby");
  var restaurant_name = restaurant.names;
  restaurant_name = restaurant_name.replace(/\s+/g, '');       
  label_attribute.value = restaurant_name + "_label";                          
  mores.setAttributeNode(label_attribute);                     
  mores.innerHTML = 'View Details';

  const aria_label = document.createElement('label');
  aria_label.id = restaurant_name + "_label";
  aria_label.className = "aria-label";
  aria_label.innerHTML = "Link: Restaurant " + restaurant.names + " Details. Neighborhood: " + restaurant.neighbor + " Address: " + restaurant.address;

  mores.onclick = function() {
    const url = DBHelper.urlForRestaurant(restaurant);
    window.location = url;
  }

  li.append(mores)
  li.append(aria_label)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.nMaps);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 
