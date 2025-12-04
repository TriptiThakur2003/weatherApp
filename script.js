const OPENWEATHER_KEY = "ba6c652688fca7d73e66956a0c93ba90"; // <-- set your API key

// endpoints
const W_CURRENT = "https://api.openweathermap.org/data/2.5/weather";
const W_FORECAST = "https://api.openweathermap.org/data/2.5/forecast";
const W_ICON = "https://openweathermap.org/img/wn";

// DOM
const inputCity = document.getElementById("inputCity");
const btnSearch = document.getElementById("btnSearch");
const btnLocate = document.getElementById("btnLocate");
const recentDropdown = document.getElementById("recentDropdown");
const recentHint = document.getElementById("recentHint");
const msgBox = document.getElementById("msgBox");
const errorPopup = document.getElementById("errorPopup");
 

function showErrorPopup(text) {
  errorPopup.textContent = text;
  errorPopup.classList.remove("hidden");
  setTimeout(() => errorPopup.classList.add("hidden"), 4500);
}

function saveRecents() {
  localStorage.setItem(
    "glasscast_recent",
    JSON.stringify(recentCities.slice(0, 6))
  );
  renderRecents();
}
function loadRecents() {
  try {
    recentCities = JSON.parse(localStorage.getItem("glasscast_recent") || "[]");
  } catch (e) {
    recentCities = [];
  }
  renderRecents();
}
function addRecent(cityName) {
  if (!cityName) return;
  cityName = cityName.trim();
  recentCities = recentCities.filter(
    (c) => c.toLowerCase() !== cityName.toLowerCase()
  );
  recentCities.unshift(cityName);
  if (recentCities.length > 6) recentCities.length = 6;
  saveRecents();
}
function renderRecents() {
  if (!recentCities || recentCities.length === 0) {
    recentDropdown.classList.add("hidden");
    recentHint.classList.remove("hidden");
    recentDropdown.innerHTML = "";
    return;
  }
  recentDropdown.classList.remove("hidden");
  recentHint.classList.add("hidden");
  recentDropdown.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select recent...";
  recentDropdown.appendChild(placeholder);
  for (const c of recentCities) {
    const op = document.createElement("option");
    op.value = c;
    op.textContent = c;
    recentDropdown.appendChild(op);
  }
}

// fetch wrapper with error handling
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status} - ${txt}`);
  }
  return res.json();
}   


// events
btnSearch.addEventListener("click", () => doSearch(inputCity.value));
inputCity.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    doSearch(inputCity.value);
  }
});
btnLocate.addEventListener("click", doLocate);
recentDropdown.addEventListener("change", () => {
  const v = recentDropdown.value;
  if (v) doSearch(v);
});
toggleFc.addEventListener("click", () => {
  forecastList.classList.toggle("hidden");
});

// unit toggles
unitC.addEventListener("click", () => {
  showUnit = "C";
  unitC.classList.add("bg-white/6");
  unitF.classList.remove("bg-white/6");
  if (lastCurrentData) renderCurrent(lastCurrentData);
  if (lastForecastData) renderForecast(lastForecastData);
});
unitF.addEventListener("click", () => {
  showUnit = "F";
  unitF.classList.add("bg-white/6");
  unitC.classList.remove("bg-white/6");
  if (lastCurrentData) renderCurrent(lastCurrentData);
  if (lastForecastData) renderForecast(lastForecastData);
});

//  init
(function init() {
  loadRecents();
  showMessage("Ready — search a city or use Locate", "persistent");
})();
