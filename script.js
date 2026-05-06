
const cityEl = document.querySelector(".city");
const tempEl = document.querySelector(".temperature");
const condEl = document.querySelector(".condition");
const hoursContainer = document.querySelector(".hours");
const windEl = document.querySelector(".wind");
const searchInput = document.getElementById("searchInput");

async function getWeather(city) {
  try {
    const cleanCity = city.trim();

    if (!cleanCity) {
      alert("Enter a city name");
      return;
    }

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${cleanCity}`
    );
    const geoData = await geoRes.json();

    if (!geoData.results) {
      alert("City not found");
      return;
    }

    const { latitude, longitude, name } = geoData.results[0];


    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m`
    );

    const data = await weatherRes.json();


    cityEl.textContent = name;
    tempEl.textContent = Math.round(data.current_weather.temperature) + "°";
    condEl.textContent = "Wind: " + data.current_weather.windspeed + " km/h";
    windEl.textContent = "Speed: " + data.current_weather.windspeed + " km/h";
    updateBackground(data.current_weather.temperature);

    //  Hourly forecast
    renderHourly(data.hourly);

  } catch (err) {
    console.log(err);
    alert("Error fetching weather");
  }
  updateRainMap(city);
}

function renderHourly(hourly) {
  hoursContainer.innerHTML = "";

  for (let i = 0; i < 6; i++) {
    const time = hourly.time[i].split("T")[1].slice(0, 5);
    const temp = hourly.temperature_2m[i];

    const div = document.createElement("div");
    div.className = "hour";

    div.innerHTML = `
      <p>${time}</p>
      <span>🌤</span>
      <p>${Math.round(temp)}°</p>
    `;

    hoursContainer.appendChild(div);
  }
}

//Search 
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = searchInput.value.trim();
getWeather(city);
saveSearch(city);
updateRainMap(city); 
    searchInput.value = "";
  }
});

//Load
getWeather("Delhi");
updateRainMap("Delhi");
const historyList = document.getElementById("historyList");

//Save Search
function saveSearch(city) {
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

  history = history.filter(item => item.toLowerCase() !== city.toLowerCase());

  history.unshift(city); // add to top

  // limit to 6 items
  if (history.length > 6) history.pop();

  localStorage.setItem("weatherHistory", JSON.stringify(history));

  renderHistory();
}

//Render History
function renderHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

  historyList.innerHTML = "";

  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;

    li.addEventListener("click", () => {
      getWeather(city);
    });

    historyList.appendChild(li);
  });
}
const searchResults = document.getElementById("searchResults");

let debounceTimer;

//Search Suggestions
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();

  clearTimeout(debounceTimer);

  if (query.length < 2) {
    searchResults.classList.remove("visible");
    return;
  }

  debounceTimer = setTimeout(() => {
    fetchSuggestions(query);
  }, 300);
});

//City Suggestions
async function fetchSuggestions(query) {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`
    );

    const data = await res.json();

    if (!data.results) {
      searchResults.classList.remove("visible");
      return;
    }

    renderSuggestions(data.results);

  } catch (err) {
    console.log(err);
  }
}
// Dropdown
function renderSuggestions(cities) {
  searchResults.innerHTML = "";

  cities.forEach(city => {
    const li = document.createElement("li");

    const name = `${city.name}, ${city.country}`;

    li.textContent = name;

    li.addEventListener("click", () => {
      searchInput.value = city.name;
      searchResults.classList.remove("visible");

      getWeather(city.name);
      saveSearch(city.name); // keep your history feature
    });

    searchResults.appendChild(li);
  });

  searchResults.classList.add("visible");
}

//Enter
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = searchInput.value.trim();

    if (!city) return;

    getWeather(city);
    saveSearch(city);

    searchResults.classList.remove("visible");
  }
});

// Dropdown closer
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    searchResults.classList.remove("visible");
  }
});

const input = document.getElementById("searchInput");
const mapFrame = document.getElementById("mapFrame");



async function updateRainMap(city) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${city}`
    );

    const data = await res.json();

    if (!data.length) return;

    const lat = data[0].lat;
    const lon = data[0].lon;

    const iframe = document.getElementById("windyMap");

    iframe.src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=6&overlay=rain`;

  } catch (err) {
    console.log("Map error:", err);
  }
}

function updateBackground(temp) {
  if (temp > 30) {
    document.body.style.background = "linear-gradient(#f7b733, #fc4a1a)";
  } else if (temp < 15) {
    document.body.style.background = "linear-gradient(#83a4d4, #b6fbff)";
  } else {
    document.body.style.background = "linear-gradient(#5998e0, #0b3976)";
  }
}

function updateDateTime() {
  const now = new Date();

  const options = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  };

  const formatted = now.toLocaleString("en-IN", options);

  document.getElementById("dateTime").textContent = formatted;
}

updateDateTime();
setInterval(updateDateTime, 60000); // updates every minute
