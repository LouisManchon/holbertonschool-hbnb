/*
  This is a SAMPLE FILE to get you started.
  Please, follow the project instructions to complete the tasks.
*/


console.log("✅ scripts.js loaded");
function deleteCookie(name) {
  document.cookie = name + '=; Max-Age=0; path=/;';
}

function logoutUser() {
  deleteCookie('token');
  checkAuthentication();
  window.location.href = 'login.html';
}

const priceFilter = document.querySelector('#price-filter');




document.addEventListener('DOMContentLoaded', async () => {
  const token = getCookie("token");

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  if (!token && !window.location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
    return; // Stoppe l'exécution après la redirection
  }


  const loginForm = document.getElementById('login-form');

  // ✅ Gestion du formulaire login
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      loginUser(email, password);
    });
  }


  checkAuthentication(); // ✅ Affiche/masque la section Add Review



  // ✅ Page d'accueil -> affichage des places
  if (document.querySelector('#places-list')) {
    loadPlaces();
  }



  // ✅ Page des détails d'une place
  if (document.querySelector('#place-details')) {
    const placeId = getPlaceIdFromURL();
    console.log("Place ID from URL:", placeId);

    const place = await fetchPlaceDetails(token, placeId);
    console.log('Détails de la place récupérés:', place);
    displayPlaceDetails(place);


    // ✅ Chargement des reviews existantes
    loadReviews(placeId);


    // ✅ Gestion du formulaire d'ajout de review
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
      reviewForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const reviewText = document.getElementById('review-text').value;
        const rating = document.getElementById('rating').value;

        if (!token) {
          alert('You need to be logged in to submit a review.');
          return;
        }

        submitReview(token, placeId, reviewText, rating);
      });
    }
  }


  // ✅ Filtrage par prix
  if (priceFilter) {
    priceFilter.addEventListener('change', (event) => {
      filterPrice(priceFilter.value);
    });
  }
});



async function loginUser(email, password) {
  console.log(JSON.stringify({ email, password })
  )


  const response = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  if (response.ok) {
    const data = await response.json();
    document.cookie = `token=${data.access_token}; path=/`;
    window.location.href = 'index.html';
} else {
    alert('Login failed: ' + response.statusText);
}
}


async function fetchPlaces(token) {
  const response = await fetch('http://127.0.0.1:5000/api/v1/places/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  if (response.ok) {
    const data = await response.json();
    return data;
    //displayPlaces(data);
  } else {
    alert('Recuperation failed: ' + response.statusText);
  }
}


async function loadPlaces() {
  const placesList = document.querySelector('#places-list');
  const token = getCookie('token');  // Récupérer le token ici
  const places = await fetchPlaces(token);  // Passer le token

  console.log(places);

  for (let i = 0; i < places.length; i++) {
    const card = document.createElement('div');
    card.classList.add('place-card');
    card.setAttribute('price', places[i].price);

    //const img = document.createElement('img');
    //img.src = place.image;
    //img.alt = place.name;
    //img.classList.add('place-image');

    const title = document.createElement('h3');
    title.textContent = places[i].title;

    const price = document.createElement('p');
    price.textContent = `Price: $${places[i].price} /night`;

    const button = document.createElement('button');
    button.classList.add('details-button');
    button.textContent = 'View Details';
    button.addEventListener('click', () => {
      window.location.href = `place.html?id=${places[i].id}`
    });

    //card.appendChild(img);
    card.appendChild(title);
    card.appendChild(price);
    card.appendChild(button);

    placesList.appendChild(card);
  };
}


function getCookie(name) {
  const cookies = document.cookie.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}


function checkAuthentication() {
  const token = getCookie('token');

  // Gestion des liens login/logout
  const loginLink = document.getElementById('login-link');
  const logoutLink = document.getElementById('logout-link');

  if (loginLink && logoutLink) { // ✅ Vérifie que les deux existent
    if (token) {
      loginLink.style.display = 'none';
      logoutLink.style.display = 'inline';
    } else {
      loginLink.style.display = 'inline';
      logoutLink.style.display = 'none';
    }
  }

  // ✅ Gestion de la section "Add Review" (place.html)
  const reviewSection = document.getElementById('add-review');
  if (reviewSection) {
    reviewSection.style.display = token ? 'block' : 'none';
  }
}




function getPlaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}


async function fetchPlaceDetails(token, placeId) {
  const response = await fetch(`http://127.0.0.1:5000/api/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    return await response.json();
  } else {
    alert('Failed to fetch place details: ' + response.statusText);
  }
}


function displayPlaceDetails(place) {
  const container = document.getElementById('place-details');
    container.innerHTML = `
      <h2>${place.title}</h2>
      <p>${place.description}</p>
      <p><strong>Price:</strong> $${place.price}/night</p>
      <p><strong>Latitude:</strong> ${place.latitude}</p>
      <p><strong>Longitude:</strong> ${place.longitude}</p>
    `;
}


async function loadReviews(placeId) {
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/v1/reviews/places/${placeId}/reviews`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const reviews = await response.json();
      const reviewsList = document.getElementById('reviews-list');
      reviewsList.innerHTML = ''; // On vide avant de remplir

      if (reviews.length === 0) {
        reviewsList.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
      } else {
        reviews.forEach(review => {
          const reviewCard = document.createElement('div');
          reviewCard.classList.add('review-card');
          reviewCard.innerHTML = `
            <p><strong>Rating:</strong> ${review.rating}/5</p>
            <p>${review.text}</p>
            <p><small>By User: ${review.user}</small></p>
          `;
          reviewsList.appendChild(reviewCard);
        });
      }
    } else {
      alert('Failed to load reviews.');
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
  }
}

async function submitReview(token, placeId, reviewText, rating) {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/v1/reviews/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: reviewText,
        rating: parseInt(rating),
        place: placeId
      })
    });

    if (response.ok) {
      alert('Review submitted successfully!');
      document.getElementById('review-form').reset();
      loadReviews(placeId); // On recharge les reviews
    } else {
      const errorData = await response.json();
      alert('Failed to submit review: ' + (errorData.error || response.statusText));
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('An error occurred while submitting the review.');
  }
}


function filterPrice(price) {
  const places = document.querySelectorAll('.place-card');

  for (let i = 0; i < places.length; i++) {
    const placePrice = parseFloat(places[i].getAttribute('price'));

    if (price === "" || isNaN(price)) {
      places[i].style.display = 'block';
    } else {
      if (placePrice > parseFloat(price)) {
        places[i].style.display = 'none';
      } else {
        places[i].style.display = 'block';
      }
    }
  }
}
