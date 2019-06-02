  var idbApplication = (function() {
  'use strict';

  if (!('indexedDB' in window)) {
    console.log('This browser does not support IndexedDB');
    return;
  }

  const dbPromise = idb.open("udacity-restaurant", 3, upgradeDB => {
    switch (upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore("restaurants", {keyPath: "id"});
        storeRestaurants();
    }
  }); 
  function storeRestaurants() {
    
    let fetchURL= DBHelper.DATABASE_RESTAURANTS_URL;
  
    fetch(fetchURL)
    .then(function (response) {
      return response.json();
      })
    .then (function(restaurants){
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        restaurants.forEach(function (restaurant) {
          store.put(restaurant)  
        });
      });
      // now return it
      callback(null, restaurants);
      })
    .catch(function (err) {
        const error = (`Unable to store restaurants data ${err}`);
      });   
  } 

  // Returns The Restaurants in the IndexedDB database
  function getRestaurants() {
    return dbPromise.then(function(db) {
      var tx = db.transaction('restaurants', 'readonly');
      var store = tx.objectStore('restaurants');
      return store.getAll();
    });
   }
 
  return {
    dbPromise: (dbPromise),
    storeRestaurants: (storeRestaurants),
    getRestaurants: (getRestaurants)
    //storeReviews: (storeReviews),
    //getReviews: (getReviews)
  };
})();

class DBHelper {

  static get DATABASE_RESTAURANTS_URL() {
    const port = 1337; // Change this to your data server port
    return `http://localhost:${port}/restaurants`;
  }

  

  // Fetch Restaurants
  static fetchRestaurants(callback) {

  // Try to Get the Restaurants from IndexDB first
  idbApplication.getRestaurants().then(function(restaurants){
    return restaurants;
  });



  let fetchURL= DBHelper.DATABASE_RESTAURANTS_URL;

  fetch(fetchURL, {method: "GET"}).then(response => {
    response
      .json()
      .then(restaurants => {
        callback(null, restaurants);
      });
  }).catch(error => {
    const message = (`Request failed. Returned status of ${error.message}`);
    callback(message, null);
  });
}

  static fetchNeighborhoods(callback) {

    // Try to Get the Neighborhoods from IndexDB first
    idbApplication.getRestaurants().then(function(restaurants){
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      // Remove duplicates from neighborhoods
      const fetchedNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);

      return fetchedNeighborhoods;
    });

    let fetchURL= DBHelper.DATABASE_RESTAURANTS_URL;

    fetch(fetchURL, {method: "GET"}).then(response => {
      response
        .json()
        .then(restaurants => {

        // Store the Restaurants in IndexDB
        idbApplication.storeRestaurants();

        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const fetchedNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
          
        callback(null, fetchedNeighborhoods);
        });
    }).catch(error => {
      const message = (`Request failed. Returned status of ${error.message}`);
      callback(message, null);
    });
  } 

  // Fetch a restaurant by its ID
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  } 

  // Fetch restaurants by a cuisine type with proper error handling.
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  } 

  // Fetch restaurants by a neighborhood 
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  // Fetch restaurants by a cuisine and a neighborhood
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  // Fetch all cuisines 
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  } 

  // Restaurant page URL.
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  } 

  static imageUrlForRestaurant(restaurant) {  
    if (restaurant.photograph) {
      return `/img/${restaurant.photograph}`;
    }
    return `/img/${restaurant.id}`
  } 

  static mapMarkerForRestaurant(restaurant, map) {
   
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
} 

