/*
  This is a SAMPLE FILE to get you started.
  Please, follow the project instructions to complete the tasks.
*/

document.addEventListener('DOMContentLoaded', () => {
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

const placesList = document.getElementById('places-list');

if (placesList) {
  loadPlaces();
}

function loadPlaces() {
  const places = [
    {name: "Cozy Apartment", price: 120, image: "assets/images/Cozy-apartment.png" },
    {name: "Beach House", price: 250, image: "assets/images/beach-house.jpg" },
    {name: "Beautiful Villa", price: 350, image: "assets/images/beautiful-villa.png" }
  ];

  places.forEach(place => {
    const card = document.createElement('div');
    card.classList.add('place-card');

    const img = document.createElement('img');
    img.src = place.image;
    img.alt = place.name;
    img.classList.add('place-image');

    const title = document.createElement('h3');
    title.textContent = place.name;

    const price = document.createElement('p');
    price.textContent = `Price: $${place.price} /night`;

    const button = document.createElement('button');
    button.classList.add('details-button');
    button.textContent = 'View Details';
    button.addEventListener('click', () => {
      window.location.href = 'place.html';
    });

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(price);
    card.appendChild(button);

    placesList.appendChild(card);
  });
}
