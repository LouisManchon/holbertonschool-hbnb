console.log("✅ scripts.js loaded");

/* ----------------------
   🔹 UTILITY FUNCTIONS
-------------------------*/
function deleteCookie(name) {
  document.cookie = name + '=; Max-Age=0; path=/;';
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

function logoutUser() {
  deleteCookie('token');
  checkAuthentication();
  window.location.href = 'login.html';
}

function getPlaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/* ----------------------
   🔹 AUTHENTICATION
-------------------------*/
async function loginUser(email, password) {
  const response = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

function checkAuthentication() {
  const token = getCookie('token');
  const loginLink = document.getElementById('login-link');
  const logoutLink = document.getElementById('logout-link');

  if (loginLink && logoutLink) {
    loginLink.style.display = token ? 'none' : 'inline';
    logoutLink.style.display = token ? 'inline' : 'none';
  }
}

/* ----------------------
   🔹 FETCH FUNCTIONS
-------------------------*/
async function fetchPlaces(token) {
  const response = await fetch('http://127.0.0.1:5000/api/v1/places/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  if (response.ok) return await response.json();
  alert('Failed to fetch places: ' + response.statusText);
}

async function fetchPlaceDetails(token, placeId) {
  const response = await fetch(`http://127.0.0.1:5000/api/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  if (response.ok) return await response.json();
  alert('Failed to fetch place details: ' + response.statusText);
}

async function loadReviews(placeId) {
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/v1/reviews/places/${placeId}/reviews`);
    if (response.ok) {
      const reviews = await response.json();
      const reviewsList = document.getElementById('reviews-list');
      reviewsList.innerHTML = '';

      if (reviews.length === 0) {
        reviewsList.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
      } else {
        reviews.forEach(review => {
          const reviewCard = document.createElement('div');
          reviewCard.classList.add('review-card');
          reviewCard.innerHTML = `
            <p><strong>Rating:</strong> ${review.rating}/5</p>
            <p>${review.text}</p>
            <p><small>By User: ${review.user.first_name}</small></p>
          `;
          reviewsList.appendChild(reviewCard);
        });
      }
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
  }
}

/* ----------------------
   🔹 DOM MANIPULATION
-------------------------*/
async function loadPlaces() {
  const placesList = document.querySelector('#places-list');
  const token = getCookie('token');
  const places = await fetchPlaces(token);

  places.forEach(place => {
    const card = document.createElement('div');
    card.classList.add('place-card');
    card.setAttribute('price', place.price);

    const title = document.createElement('h3');
    title.textContent = place.title;

    const price = document.createElement('p');
    price.textContent = `Price: $${place.price} /night`;

    const button = document.createElement('button');
    button.classList.add('details-button');
    button.textContent = 'View Details';
    button.addEventListener('click', () => {
      window.location.href = `place.html?id=${place.id}`;
    });

    card.appendChild(title);
    card.appendChild(price);
    card.appendChild(button);
    placesList.appendChild(card);
  });
}

function displayPlaceDetails(place) {
  const container = document.getElementById('place-details');
  container.innerHTML = `
    <h2>${place.title}</h2>
    <p>${place.description}</p>
    <p><strong>Price:</strong> $${place.price}/night</p>
    <p><strong>Latitude:</strong> ${place.latitude}</p>
    <p><strong>Longitude:</strong> ${place.longitude}</p>
    <a href="add_review.html?id=${place.id}" class="btn">➕ Add a Review</a>
  `;
}

/* ----------------------
   🔹 FILTER
-------------------------*/
function filterPrice(price) {
  const places = document.querySelectorAll('.place-card');
  places.forEach(placeCard => {
    const placePrice = parseFloat(placeCard.getAttribute('price'));
    placeCard.style.display =
      !price || isNaN(price) || placePrice <= parseFloat(price)
        ? 'block'
        : 'none';
  });
}

/* ----------------------
   🔹 MAIN SCRIPT
-------------------------*/
document.addEventListener('DOMContentLoaded', async () => {
  const token = getCookie("token");

  // ✅ Logout link
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // ✅ Redirect if not logged in (except login.html)
  if (!token && !window.location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
    return;
  }

  checkAuthentication();

  // ✅ Login page
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      loginUser(email, password);
    });
  }

  // ✅ Index page (places list)
  if (document.querySelector('#places-list')) {
    loadPlaces();
    const priceFilter = document.querySelector('#price-filter');
    if (priceFilter) {
      priceFilter.addEventListener('change', () => filterPrice(priceFilter.value));
    }
  }

  // ✅ Place details page
  if (document.querySelector('#place-details')) {
    const placeId = getPlaceIdFromURL();
    const place = await fetchPlaceDetails(token, placeId);
    displayPlaceDetails(place);
    loadReviews(placeId);
  }

  // ✅ Add review page
  if (document.querySelector('#add-review') && window.location.pathname.endsWith('add_review.html')) {
    const reviewForm = document.getElementById('review-form');
    const placeId = getPlaceIdFromURL();

    reviewForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const reviewText = document.getElementById('review-text').value;
      const rating = document.getElementById('rating').value;

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
          alert('✅ Review added successfully!');
          window.location.href = `place.html?id=${placeId}`;
        } else {
          const errorData = await response.json();
          alert('❌ Failed to add review: ' + (errorData.error || response.statusText));
        }
      } catch (error) {
        console.error('Error adding review:', error);
        alert('An error occurred while adding the review.');
      }
    });
  }
});
