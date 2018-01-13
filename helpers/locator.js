const path = require('path');
const db = require('../database/index.js');

//Worst time: 450ms
//Best time: 152ms

var getCloseRestaurants = (userLat, userLon, userId, callback) => {
	db.getAllRestaurants((err, restaurants) => {
		var allResults = {};
		var distances = [];
		var closestResults = [];
		var closestResultsWithFavorites = [];

		restaurants.forEach(restaurant => {
			var resLat = parseFloat(restaurant.latitude);
			var resLon = parseFloat(restaurant.longitude);
			var distance = hypotenator(userLat, userLon, resLat, resLon);
			var distanceFormatted = (Math.round(distance * 10) / 10) + 'km away';

			restaurant["distance"] = distanceFormatted;
			allResults[distance] = restaurant;
			distances.push(distance);
		});

		var distancesSorted = mergeSort(distances);

		if (userId) {
			getFavoriteCategories(userId, (err, favorites) => {
				var favoriteCount = favorites.length;

				if (favoriteCount > 0) {
					for (var i = 0; i < favoriteCount; i++) {
						for (var j = 0; j < distancesSorted.length; j++) {
							var restaurant = allResults[distancesSorted[j]];

							if (restaurant.category === favorites[i]) {
								restaurant.favorite = '**recommendation based on your history'

								closestResultsWithFavorites.push(restaurant);
							}
						}
					}

					for (var z = 0; z < 5; z++) {
						if (distancesSorted[z] !== distancesSorted[z - 1]) {
							var restaurant = allResults[distancesSorted[z]];
							closestResults.push(restaurant);
						}
					}

					callback(closestResultsWithFavorites);
					return;
				}
			});
		}

		for (var i = 0; i < 5; i++) {
			if (distancesSorted[i] !== distancesSorted[i - 1]) {
				var restaurant = allResults[distancesSorted[i]];
				closestResults.push(restaurant);
			}
		}


		callback(closestResults);
	});
}

var hypotenator = (latA, lonA, latB, lonB) => {
	const R = 6371;
	var dLat = degreeToRadians(latB-latA); 
	var dLon = degreeToRadians(lonB-lonA); 
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(degreeToRadians(latA)) * Math.cos(degreeToRadians(latB)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; 
	return d;
};

var degreeToRadians = (degree) => {
    return degree * (Math.PI/180);
};

var mergeSort = (arr) => {
  if (arr.length < 2) {
    return arr;
  }

  var middle = Math.floor(arr.length / 2);
  var left = arr.slice(0, middle);
  var right = arr.slice(middle);

  return merge(mergeSort(left), mergeSort(right));
};

var merge = (left, right) => {
  let result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] < right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
};

var getFavoriteCategories = (userId, callback) => {
	db.getUserRestaurantCategories(userId, (err, categories) => {
		var visits = categories.length;
		var favoriteCategories = [];

		if (visits > 0) {
			var allCategories = {};

			categories.forEach(restaurant => {
				if (allCategories[restaurant.category]) {
					allCategories[restaurant.category]++;
				} else {
					allCategories[restaurant.category] = 1;
				}
			});

			for (var category in allCategories) {
				var frequency = allCategories[category] / visits;

				if (frequency > 0.2) {
					favoriteCategories.push(category);
				}
			}
		}

		callback(favoriteCategories);
	});
}

module.exports = {
	getCloseRestaurants: getCloseRestaurants	
};