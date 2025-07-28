/*
  This is a SAMPLE FILE to get you started.
  Please, follow the project instructions to complete the tasks.
*/
const priceFilter = document.querySelector('#price-filter');

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('login-form');

      if (loginForm) {
          loginForm.addEventListener('submit', async (event) => {
            const password = document.getElementById('password').value;
            const email = document.getElementById('email').value;
              event.preventDefault();
              console.log("hello", password, email);
              loginUser(email, password);
          });
      }

      const token = getCookie("token");
       if (document.querySelector('#places-list')) {
      loadPlaces();
    }

    if (document.querySelector('#place-details')) {
    const placeId = getPlaceIdFromURL();
    const place = await fetchPlaceDetails(token, placeId);
    displayPlaceDetails(place);
  }

  if (priceFilter) {
    priceFilter.addEventListener('change', (event) => {
      filterPrice(priceFilter.value);
    })
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
  const places = await fetchPlaces().then(
    data => {return data}
  );

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

function checkAuthentication() {
  const token = getCookie('token');
  const loginLink = document.getElementById('login-link');

  if (!token) {
    loginLink.style.display = 'block';
  } else {
    loginLink.style.display = 'none';
    // Fetch places data if the user is authenticated
    fetchPlaces(token);
  }
}

function getCookie(name) {
  let value = document.cookie;
  value = value.split('=')[1];
  return (value);
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

function checkAuthentication() {
    const token = getCookie('token');
    const reviewSection = document.getElementById('add-review');
    if (!reviewSection) return;
    reviewSection.style.display = token ? 'block' : 'none';
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
