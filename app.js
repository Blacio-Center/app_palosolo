const statusMsg = document.getElementById('statusMsg');

// Coordenadas de Palosolo
const PALOSOLO = {
  name: 'Palosolo, Piñas, EC',
  lat: -3.696655, 
  lon: -79.755872
};

function getWeatherInfo(code) {
  const map = {
    0: { desc: 'Despejado', icon: '☀️' },
    1: { desc: 'Mayormente despejado', icon: '🌤️' },
    2: { desc: 'Parcialmente nublado', icon: '⛅' },
    3: { desc: 'Nublado', icon: '☁️' },
    45: { desc: 'Neblina', icon: '🌫️' },
    48: { desc: 'Niebla húmeda', icon: '🌫️' },
    51: { desc: 'Llovizna ligera', icon: '🌦️' },
    61: { desc: 'Lluvia ligera', icon: '🌦️' },
    63: { desc: 'Lluvia moderada', icon: '🌧️' },
    65: { desc: 'Lluvia fuerte', icon: '🌧️' },
    80: { desc: 'Chubascos', icon: '🌦️' },
    81: { desc: 'Lluvia fuerte', icon: '🌧️' },
    95: { desc: 'Tormenta', icon: '⛈️' }
  };
  return map[code] || { desc: 'Variable', icon: '⛅' };
}

async function fetchWeather() {
  statusMsg.textContent = 'Actualizando clima...';
  try {
    // Se añadió el parámetro 'hourly' a la URL
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${PALOSOLO.lat}&longitude=${PALOSOLO.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error de conexión');
    const data = await res.json();

    renderCurrentWeather(data.current);
    renderSunTimes(data.daily);
    renderHourly(data.hourly, data.current);
    renderForecast(data.daily);
    statusMsg.textContent = '';
  } catch (err) {
    statusMsg.textContent = 'No se pudo cargar el clima. Verifica tu conexión.';
  }
}

function renderCurrentWeather(current) {
  const info = getWeatherInfo(current.weather_code);
  document.getElementById('mainIcon').textContent = info.icon;
  document.getElementById('currentTemp').textContent = `${Math.round(current.temperature_2m)}°C`;
  document.getElementById('currentDesc').textContent = info.desc;
  document.getElementById('locationName').textContent = PALOSOLO.name;

  document.getElementById('humidityVal').textContent = `${current.relative_humidity_2m}%`;
  document.getElementById('windVal').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  document.getElementById('pressureVal').textContent = `${Math.round(current.surface_pressure)} hPa`;
}

function renderSunTimes(daily) {
  const sunriseIso = daily.sunrise[0];
  const sunsetIso = daily.sunset[0];

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  document.getElementById('sunriseVal').textContent = formatTime(sunriseIso);
  document.getElementById('sunsetVal').textContent = formatTime(sunsetIso);
}

// NUEVA FUNCIÓN: Pronóstico de 24 horas
function renderHourly(hourly, current) {
  const grid = document.getElementById('hourlyGrid');
  grid.innerHTML = '';
  
  // Extraemos la hora exacta de la API para sincronizar sin importar si estás en Madrid
  const currentHourStr = current.time.slice(0, 13) + ":00"; 
  let startIndex = hourly.time.indexOf(currentHourStr);
  if (startIndex === -1) startIndex = 0; // Por si acaso

  // Generamos las próximas 24 horas
  for (let i = startIndex; i < startIndex + 24; i++) {
    if (!hourly.time[i]) break;

    // Cortamos la cadena "2026-11-14T14:00" para quedarnos solo con "14:00"
    const timeString = hourly.time[i].slice(11, 16); 
    const temp = Math.round(hourly.temperature_2m[i]);
    const info = getWeatherInfo(hourly.weather_code[i]);

    const item = document.createElement('div');
    item.className = 'hourly-item';
    
    // Al primer ítem le ponemos "Ahora"
    const displayTime = (i === startIndex) ? 'Ahora' : timeString;

    item.innerHTML = `
      <span class="hourly-time">${displayTime}</span>
      <span class="hourly-icon">${info.icon}</span>
      <span class="hourly-temp">${temp}°C</span>
    `;
    grid.appendChild(item);
  }
}

function renderForecast(daily) {
  const grid = document.getElementById('forecastGrid');
  grid.innerHTML = '';
  const daysShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (let i = 1; i <= 4; i++) {
    const dateObj = new Date(daily.time[i] + 'T00:00:00');
    const dayName = daysShort[dateObj.getDay()];
    const info = getWeatherInfo(daily.weather_code[i]);
    const max = Math.round(daily.temperature_2m_max[i]);
    const min = Math.round(daily.temperature_2m_min[i]);

    const card = document.createElement('div');
    card.className = 'forecast-day';
    card.innerHTML = `
      <span class="day-name">${dayName}</span>
      <span class="day-icon">${info.icon}</span>
      <span class="day-max">${max}°C</span>
      <span class="day-min">${min}°C</span>
    `;
    grid.appendChild(card);
  }
}

window.addEventListener('DOMContentLoaded', fetchWeather);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// --- MÓDULO: NAVEGACIÓN POR PESTAÑAS ---
function switchTab(tabName) {
  // Ocultar todos los contenidos
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(content => content.classList.remove('active-tab'));
  
  // Quitar estilo activo de todos los botones
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // Activar el contenido y el botón seleccionado
  document.getElementById('tab-' + tabName).classList.add('active-tab');
  
  // Buscar qué botón hizo clic y ponerlo activo
  const clickedTab = Array.from(tabs).find(t => t.getAttribute('onclick').includes(tabName));
  if(clickedTab) {
    clickedTab.classList.add('active');
  }
}