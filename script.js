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

const weatherPanel = document.getElementById("weatherPanel");
const placeName = document.getElementById("placeName");
const localTime = document.getElementById("localTime");
const todayTemp = document.getElementById("todayTemp");
const weatherCondition = document.getElementById("weatherCondition");
const iconBox = document.getElementById("iconBox");

const statHumidity = document.getElementById("statHumidity");
const statWind = document.getElementById("statWind");
const statPressure = document.getElementById("statPressure");
const statVisibility = document.getElementById("statVisibility");

const forecastList = document.getElementById("forecastList");
const toggleFc = document.getElementById("toggleFc");

const unitC = document.getElementById("unitC");
const unitF = document.getElementById("unitF");

// state
let recentCities = [];
let showUnit = "C";
let lastCurrentData = null;
let lastForecastData = null;

//   helpers
function showMessage(text, kind = "info") {
  msgBox.textContent = text;
  msgBox.style.color = kind === "error" ? "#ffb4b4" : "";
  if (text && kind !== "persistent")
    setTimeout(() => {
      msgBox.textContent = "";
    }, 3500);
}

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

// get by city or coords
async function fetchWeatherByCity(q) {
  const curUrl = `${W_CURRENT}?q=${encodeURIComponent(
    q
  )}&units=metric&appid=${OPENWEATHER_KEY}`;
  const fUrl = `${W_FORECAST}?q=${encodeURIComponent(
    q
  )}&units=metric&appid=${OPENWEATHER_KEY}`;
  const [cur, fcast] = await Promise.all([fetchJson(curUrl), fetchJson(fUrl)]);
  return { current: cur, forecast: fcast };
}

async function fetchWeatherByCoords(lat, lon) {
  const curUrl = `${W_CURRENT}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`;
  const fUrl = `${W_FORECAST}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`;
  const [cur, fcast] = await Promise.all([fetchJson(curUrl), fetchJson(fUrl)]);
  return { current: cur, forecast: fcast };
}

//  render current weather
function kelvinToC(k) {
  return k;
}
function formatTempC(c) {
  return `${Math.round(c)}°C`;
}
function toF(c) {
  return Math.round((c * 9) / 5 + 32);
}

function applyMoodClass(main) {
  const root = document.body;
  root.classList.remove("bg-sunny", "bg-cloudy", "bg-rainy", "bg-snow");
  const k = main.toLowerCase();
  if (k.includes("cloud")) root.classList.add("bg-cloudy");
  else if (k.includes("rain") || k.includes("drizzle") || k.includes("thunder"))
    root.classList.add("bg-rainy");
  else if (k.includes("snow")) root.classList.add("bg-snow");
  else root.classList.add("bg-sunny");
}

function clearIconArea() {
  iconBox.innerHTML = "";
}

function renderCurrent(data) {
  lastCurrentData = data;
  weatherPanel.classList.remove("hidden");

  placeName.textContent = `${data.name}, ${data.sys?.country || ""}`;
  // format time with timezone offset
  const local = new Date((data.dt + (data.timezone || 0)) * 1000);
  localTime.textContent = local.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Today's temp toggle
  if (showUnit === "C") {
    todayTemp.textContent = formatTempC(data.main.temp);
  } else {
    todayTemp.textContent = `${toF(data.main.temp)}°F`;
  }

  weatherCondition.textContent = data.weather[0].description;

  statHumidity.textContent = `${data.main.humidity}%`;
  statWind.textContent = `${data.wind.speed.toFixed(1)} m/s`;
  statPressure.textContent = `${data.main.pressure} hPa`;
  statVisibility.textContent = `${data.visibility ?? 0} m`;

  // Icon + animated visuals
  clearIconArea();
  const img = document.createElement("img");
  img.src = `${W_ICON}/${data.weather[0].icon}@2x.png`;
  img.alt = data.weather[0].description;
  iconBox.appendChild(img);

  // added decorative animation elements depending on main
  const main = data.weather[0].main.toLowerCase();
  if (main.includes("rain") || main.includes("drizzle")) {
    // create raindrops here
    for (let i = 0; i < 6; i++) {
      const d = document.createElement("div");
      d.className = "drop";
      d.style.left = 10 + i * 12 + "%";
      d.style.top = "-10%";
      d.style.animationDelay = Math.random() * 0.6 + "s";
      iconBox.appendChild(d);
    }
  } else if (main.includes("snow")) {
    for (let i = 0; i < 10; i++) {
      const s = document.createElement("div");
      s.className = "snowflake";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = "-10%";
      s.style.animationDelay = Math.random() * 0.5 + "s";
      s.style.width = 4 + Math.random() * 6 + "px";
      s.style.height = s.style.width;
      iconBox.appendChild(s);
    }
  } else if (main.includes("cloud")) {
    // CSS background on iconBox and  elements
    const cloud = document.createElement("div");
    cloud.style.position = "absolute";
    cloud.style.width = "120%";
    cloud.style.height = "120%";
    cloud.style.left = "-10%";
    cloud.style.top = "-10%";
    cloud.style.background =
      "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.06), transparent)";
    cloud.style.pointerEvents = "none";
    iconBox.appendChild(cloud);
  } else {
    const sun = document.createElement("div");
    sun.className = "anim-sun";
    sun.innerHTML = `<svg width="110" height="110" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="12" fill="#ffd166"/></svg>`;
    iconBox.appendChild(sun);
  }

  // extreme temp alerts
  if (data.main.temp >= 40) {
    showErrorPopup("🔥 Heat advisory: temperature ≥ 40°C — stay hydrated!");
  } else if (data.main.temp <= 2) {
    showErrorPopup("❄️ Cold advisory: temperature ≤ 2°C — dress warmly!");
  }

  applyMoodClass(data.weather[0].main);
}

//  forecast rendering 5-day
// Group forecast list by date and compute average for each day
function summarizeForecast(forecast) {
  const map = {};
  for (const item of forecast.list) {
    const date = item.dt_txt.split(" ")[0];
    if (!map[date]) map[date] = [];
    map[date].push(item);
  }
  const entries = Object.entries(map).slice(0, 6); // capture up to 6 days
  // We'll choose first 5 days
  const result = entries.slice(0, 5).map(([date, arr]) => {
    const temps = arr.map((x) => x.main.temp);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const avgWind =
      arr.map((x) => x.wind.speed).reduce((a, b) => a + b, 0) / arr.length;
    const avgHum =
      arr.map((x) => x.main.humidity).reduce((a, b) => a + b, 0) / arr.length;
    // pick middle record icon
    const icon = arr[Math.floor(arr.length / 2)].weather[0].icon;
    const desc = arr[Math.floor(arr.length / 2)].weather[0].description;
    return { date, avgTemp, avgWind, avgHum, icon, desc };
  });
  return result;
}

function renderForecast(forecast) {
  lastForecastData = forecast;
  const days = summarizeForecast(forecast);
  forecastList.innerHTML = "";
  for (const d of days) {
    const card = document.createElement("div");
    card.className = "fc-card glass-card";
    const dt = new Date(d.date);
    card.innerHTML = `
      <div class="text-xs text-slate-300">${dt.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}</div>
      <img src="${W_ICON}/${d.icon}.png" alt="${
      d.desc
    }" class="mx-auto my-2" width="64" height="64" loading="lazy" />
      <div class="text-lg font-bold">${
        showUnit === "C" ? `${Math.round(d.avgTemp)}°C` : `${toF(d.avgTemp)}°F`
      }</div>
      <div class="text-xs text-slate-400 mt-1">💨 ${d.avgWind.toFixed(
        1
      )} m/s · 💧 ${Math.round(d.avgHum)}%</div>
    `;
    forecastList.appendChild(card);
  }
}

//  user flows
async function doSearch(query) {
  if (!query || !query.trim()) {
    showMessage("Please enter a city name", "error");
    return;
  }
  showMessage("Fetching weather...");
  try {
    const { current, forecast } = await fetchWeatherByCity(query.trim());
    renderCurrent(current);
    renderForecast(forecast);
    addRecent(`${current.name}, ${current.sys?.country || ""}`);
    showMessage("Updated");
    forecastList.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    showMessage("Failed to fetch. Check city name or API key", "error");
  }
}

function doLocate() {
  if (!navigator.geolocation) {
    showMessage("Geolocation not supported", "error");
    return;
  }
  showMessage("Getting your location...");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        showMessage("Fetching weather for your location...");
        const { current, forecast } = await fetchWeatherByCoords(
          latitude,
          longitude
        );
        renderCurrent(current);
        renderForecast(forecast);
        addRecent(`${current.name}, ${current.sys?.country || ""}`);
        showMessage("Location weather loaded");
        forecastList.classList.remove("hidden");
      } catch (err) {
        console.error(err);
        showMessage("Could not fetch location weather", "error");
      }
    },
    () => {
      showMessage("Location permission denied", "error");
    },
    { timeout: 10000 }
  );
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
