// The City Breathes — front-end engine
// Three.js (3D) + Web Audio API (sound), with graceful degradation.

// Public Cloudflare Turnstile site key (safe to ship to the browser).
const TURNSTILE_SITEKEY = "0x4AAAAAADzaozIdfhvdQea7";

// Footer indicator: reflect whether the Turnstile script loaded + the secret
// is configured. "Active" means the protection is armed on this page.
function updateTurnstileIndicator() {
  const el = document.getElementById("turnstile-indicator");
  if (!el) return;
  if (window.turnstile) {
    el.textContent = "Turnstile: active";
    el.classList.add("is-active");
    el.classList.remove("is-inactive");
  } else {
    el.textContent = "Turnstile: inactive";
    el.classList.add("is-inactive");
    el.classList.remove("is-active");
  }
}

function watchTurnstile() {
  let tries = 0;
  const tick = () => {
    if (window.turnstile) return updateTurnstileIndicator();
    if (tries++ < 40) setTimeout(tick, 200);
    else updateTurnstileIndicator();
  };
  tick();
}

const THREE_URL = "https://esm.sh/three@0.166.1";

const cities = {
  dubai: { name: "Dubai", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" },
  "new-york": { name: "New York", lat: 40.7128, lon: -74.006, tz: "America/New_York" },
  london: { name: "London", lat: 51.5072, lon: -0.1276, tz: "Europe/London" },
  tokyo: { name: "Tokyo", lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo" },
  delhi: { name: "Delhi", lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata" }
};

const styles = {
  calm: { speed: 0.75, amp: 0.19, roughness: 0.18 },
  pulse: { speed: 1.35, amp: 0.27, roughness: 0.28 },
  wave: { speed: 1.05, amp: 0.24, roughness: 0.4 },
  fracture: { speed: 1.55, amp: 0.32, roughness: 0.62 }
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- helpers ---------- */
function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function formatPct(value) {
  return `${Math.round(clamp(value) * 100)}`;
}

// Smooth ease used to shape the breath curve (no harsh linear ramps).
function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

// Physiological breath over one cycle (phase 0..1): a quicker, accelerating-
// then-decelerating inhale, a brief apical hold, a longer smoother exhale, and
// a soft pause at the emptied bottom. This asymmetry — not a pure sine — is
// what reads as "alive".
function breathEnvelope(phase) {
  const p = phase - Math.floor(phase);
  const inhaleEnd = 0.4;
  const holdEnd = 0.48;
  const exhaleEnd = 0.93;
  if (p < inhaleEnd) return easeInOutSine(p / inhaleEnd);
  if (p < holdEnd) return 1;
  if (p < exhaleEnd) return 1 - easeInOutSine((p - holdEnd) / (exhaleEnd - holdEnd));
  return 0;
}

// Convert pollutant readings into a 0..1 "cleanliness" score (higher = cleaner).
function aqiToClean(pm25, pm10, no2, o3) {
  const p25 = clamp((pm25 || 0) / 75);
  const p10 = clamp((pm10 || 0) / 150);
  const n2 = clamp((no2 || 0) / 120);
  const oz = clamp((o3 || 0) / 180);
  const bad = p25 * 0.45 + p10 * 0.25 + n2 * 0.18 + oz * 0.12;
  return clamp(1 - bad);
}

function makeFallbackData(cityKey) {
  const city = cities[cityKey];
  const now = Date.now();
  const hour = new Date().getHours();
  const month = new Date().getMonth();
  const commute = Math.max(
    Math.exp(-Math.pow(hour - 8, 2) / 10),
    Math.exp(-Math.pow(hour - 18, 2) / 10)
  );
  const seed = Math.abs(Math.sin(city.lat * 0.13 + city.lon * 0.07 + now / 3600000));
  const traffic = clamp(0.25 + commute * 0.55 + seed * 0.18);
  const air = clamp(0.35 + seed * 0.45 + (city.lat > 27 ? 0.12 : 0));
  // Plausible weather derived from latitude, season, and time of day so the
  // fallback sculpture still reads as a real place.
  const seasonal = Math.sin(((month - 6) / 12) * Math.PI * 2);
  const diurnal = Math.sin(((hour - 15) / 24) * Math.PI * 2);
  const temperature = 28 - Math.abs(city.lat - 10) * 0.5 + seasonal * 7 + diurnal * 5 + (seed - 0.5) * 4;
  const wind = clamp(0.2 + Math.abs(Math.sin(now / 4800000 + city.lon)) * 0.6);
  const rain = clamp(Math.max(0, Math.sin(now / 9000000 + city.lat)) * 0.5 + (city.lat > 8 && city.lat < 30 ? 0.15 : 0));
  const cloud = clamp(0.3 + Math.abs(Math.sin(now / 6000000 + city.lon)) * 0.5);
  const humidity = clamp(50 + rain * 30 + (city.lat > 8 && city.lat < 25 ? 15 : 0) + (seed - 0.5) * 10);
  const weather = clamp(1 - wind * 0.3 - rain * 0.6);
  const social = clamp(0.2 + Math.abs(Math.sin(now / 2100000 + city.lat)) * 0.7);
  return {
    city: city.name,
    timestamp: new Date().toISOString(),
    live: false,
    traffic,
    air,
    weather,
    social,
    overall: (traffic + air + weather + social) / 4,
    temperature,
    wind,
    rain,
    cloud,
    humidity
  };
}

async function fetchCityData(cityKey) {
  const city = cities[cityKey];
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover,precipitation";
  const airUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}` +
    "&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone";

  try {
    const [weatherRes, airRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);
    if (!weatherRes.ok || !airRes.ok) throw new Error("City APIs unavailable");

    const [weatherJson, airJson] = await Promise.all([weatherRes.json(), airRes.json()]);
    const w = weatherJson.current || {};
    const a = airJson.current || {};
    const fallback = makeFallbackData(cityKey);

    const wind = clamp((w.wind_speed_10m || 0) / 55);
    const cloud = clamp((w.cloud_cover || 0) / 100);
    const rain = clamp((w.precipitation || 0) / 12);
    const temperature = typeof w.temperature_2m === "number" ? w.temperature_2m : fallback.temperature;
    const humidity = typeof w.relative_humidity_2m === "number" ? w.relative_humidity_2m : fallback.humidity;
    const air = aqiToClean(a.pm2_5, a.pm10, a.nitrogen_dioxide, a.ozone);
    const weather = clamp(1 - wind * 0.3 - rain * 0.6);
    // Real traffic from TomTom (via our server proxy); fall back to the
    // time-of-day estimate if the key is missing or the request fails.
    const liveTraffic = await fetchTraffic(cityKey);
    const traffic = liveTraffic != null ? liveTraffic : fallback.traffic;
    const social = fallback.social;
    const overall = (traffic + air + weather + social) / 4;

    return {
      city: city.name,
      timestamp: new Date().toISOString(),
      live: true,
      traffic,
      air,
      weather,
      social,
      overall,
      temperature,
      wind,
      rain,
      cloud,
      humidity
    };
  } catch {
    return makeFallbackData(cityKey);
  }
}

// Live traffic congestion (0..1) via our server proxy, which keeps the TomTom
// key server-side. Returns null when unavailable so the caller can fall back.
async function fetchTraffic(cityKey) {
  const city = cities[cityKey];
  try {
    const res = await fetch(`/api/traffic?lat=${city.lat}&lon=${city.lon}`);
    if (!res.ok) return null;
    const j = await res.json();
    if (!j || j.ok === false || typeof j.traffic !== "number") return null;
    return clamp(j.traffic);
  } catch {
    return null;
  }
}

/* ---------- main ---------- */
async function boot() {
  const veil = document.getElementById("veil");
  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (err) {
    console.error("Three.js failed to load", err);
    if (veil) {
      veil.innerHTML =
        '<div class="veil-core"><p>Could not load the 3D engine.<br/>Check your connection and reload.</p></div>';
    }
    return;
  }
  try {
    init(THREE, veil);
  } catch (err) {
    console.error("Scene initialization failed", err);
    if (veil) {
      veil.innerHTML =
        '<div class="veil-core"><p>This device or browser could not start WebGL.<br/>Try a different browser.</p></div>';
    }
  }
}

function init(THREE, veil) {
  const els = {
    canvas: document.querySelector("#scene"),
    city: document.querySelector("#citySelect"),
    style: document.querySelector("#styleSelect"),
    audioToggle: document.querySelector("#audioToggle"),
    audioIcon: document.querySelector("#audioIcon"),
    audioSlider: document.querySelector("#audioSlider"),
    speedSlider: document.querySelector("#speedSlider"),
    timeToggle: document.querySelector("#timeToggle"),
    refresh: document.querySelector("#refreshButton"),
    tooltip: document.querySelector("#tooltip"),
    dot: document.querySelector("#freshnessDot"),
    status: document.querySelector("#statusText"),
    traffic: document.querySelector("#trafficMetric"),
    air: document.querySelector("#airMetric"),
    weather: document.querySelector("#weatherMetric"),
    social: document.querySelector("#socialMetric"),
    enterCta: document.querySelector("#enterCta"),
    toggleConsole: document.querySelector("#toggleConsoleBtn"),
    closeConsole: document.querySelector("#closeConsole")
  };

  const state = {
    cityKey: "dubai",
    styleKey: "calm",
    audioOn: false,
    audioIntensity: 0.55,
    visualSpeed: reducedMotion ? 0.7 : 1,
    timeMode: false,
    clickPulse: 0,
    data: makeFallbackData("dubai"),
    targetData: makeFallbackData("dubai"),
    lastFetch: 0,
    breathPhase: 0
  };

  const renderer = new THREE.WebGLRenderer({
    canvas: els.canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, reducedMotion ? 1.5 : 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06070a, 0.04);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.35, 7.4);

  const group = new THREE.Group();
  scene.add(group);

  const geometry = new THREE.IcosahedronGeometry(1.8, reducedMotion ? 24 : 48);
  const basePositions = geometry.attributes.position.array.slice();
  const vertexColors = new Float32Array(geometry.attributes.position.count * 3);
  geometry.setAttribute("color", new THREE.BufferAttribute(vertexColors, 3));

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    metalness: 0.18,
    roughness: 0.44,
    emissive: 0x12201b,
    emissiveIntensity: 0.5,
    flatShading: false
  });

  const sculpture = new THREE.Mesh(geometry, material);
  group.add(sculpture);

  const wire = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({
      color: 0x9fe0c1,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    })
  );
  group.add(wire);

  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = reducedMotion ? 350 : 900;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    const r = 2.6 + Math.random() * 2.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = r * Math.cos(phi);
    particlePositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0x72b8ff,
      size: 0.018,
      transparent: true,
      opacity: 0.46,
      depthWrite: false
    })
  );
  scene.add(particles);

  const ambientLight = new THREE.AmbientLight(0xd8fff0, 0.55);
  scene.add(ambientLight);
  const keyLight = new THREE.PointLight(0x8bd6b4, 55, 20);
  keyLight.position.set(3.8, 3.5, 4.5);
  scene.add(keyLight);
  const warmLight = new THREE.PointLight(0xffb26d, 22, 20);
  warmLight.position.set(-4, -2.5, 4);
  scene.add(warmLight);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let audio;

  function resize() {
    const w = els.canvas.clientWidth || window.innerWidth;
    const h = els.canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function palette(data) {
    const clean = new THREE.Color(0x8bd6b4);
    const stressed = new THREE.Color(0xff6b5e);
    const cold = new THREE.Color(0x6fb6ff);
    const warm = new THREE.Color(0xf2b25a);
    const airPoor = 1 - data.air; // poor air -> redder, strained skin
    const base = clean.clone().lerp(stressed, airPoor * 0.85);
    const tempNorm = clamp((data.temperature + 5) / 40); // -5C..35C -> 0..1
    const tempColor = cold.clone().lerp(warm, tempNorm); // hotter -> warmer hues
    return base.lerp(tempColor, 0.45);
  }

  function deformGeometry(time, dt) {
    const data = state.data;
    const style = styles[state.styleKey];
    // Raw signals. Higher traffic = busier; lower air = more polluted.
    const traffic = clamp(data.traffic);
    const airPoor = 1 - clamp(data.air);
    const wind = clamp(data.wind);
    const rain = clamp(data.rain);
    const overall = clamp(data.overall);

    // --- Physiological breathing ---------------------------------------
    // Breaths per minute: resting ~7 at empty streets, up to ~20 in gridlock.
    // Integrating phase by dt (not multiplying time) lets the rate shift
    // smoothly as traffic changes, with no jumps.
    const bpm = lerp(7, 20, traffic) * style.speed * state.visualSpeed;
    const cyclesPerSec = bpm / 60;
    // Subtle sinus-arrhythmia wobble so no two breaths are identical.
    const variability = 1 + Math.sin(time * 0.37) * 0.05 + Math.sin(time * 0.11) * 0.03;
    state.breathPhase += dt * cyclesPerSec * variability;
    const env = breathEnvelope(state.breathPhase);
    // Pointed inhale peak for "pulse"; rounder for the others.
    const pulse = Math.pow(env, state.styleKey === "pulse" ? 1.9 : 1.25);

    // Strained air adds a faint high-frequency tremor to the whole body.
    const strain = airPoor * (0.5 + 0.5 * Math.sin(time * 9.0)) * 0.03;
    const amplitude = style.amp + overall * 0.18 + state.clickPulse * 0.3 + strain;
    // Poor air roughens the skin; wind adds flow (handled in the wave term).
    const roughness = style.roughness + airPoor * 0.5;
    const color = palette(data);
    // Rougher, darker when air is bad; slight lift when hot/energetic.
    const darken = 1 - airPoor * 0.4;
    const pos = geometry.attributes.position.array;
    const wirePos = wire.geometry.attributes.position.array;

    // Wind makes the surface flow: a directional travelling wave whose speed
    // and depth scale with wind strength.
    const flow = time * (0.6 + wind * 3.2);

    for (let i = 0; i < pos.length; i += 3) {
      const x = basePositions[i];
      const y = basePositions[i + 1];
      const z = basePositions[i + 2];
      const len = Math.hypot(x, y, z) || 1;
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;
      // Static-ish roughness noise (air quality) + directional flow (wind).
      const noise =
        Math.sin(nx * 7.2 + time * 0.9) *
        Math.cos(ny * 5.6 - time * 0.6) *
        Math.sin(nz * 4.8 + time * 0.5);
      const windWave = Math.sin(nx * 3.1 + ny * 2.3 + flow) * wind;
      const fracture = state.styleKey === "fracture" ? Math.sign(noise) * 0.08 : 0;
      const radius =
        1 + pulse * amplitude + noise * roughness * 0.22 + windWave * 0.12 + fracture;
      pos[i] = x * radius;
      pos[i + 1] = y * radius;
      pos[i + 2] = z * radius;
      wirePos[i] = pos[i] * 1.012;
      wirePos[i + 1] = pos[i + 1] * 1.012;
      wirePos[i + 2] = pos[i + 2] * 1.012;

      vertexColors[i] = clamp((color.r + pulse * 0.05 + airPoor * 0.06) * darken);
      vertexColors[i + 1] = clamp((color.g + pulse * 0.05) * darken);
      vertexColors[i + 2] = clamp((color.b + rain * 0.1) * darken);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    wire.geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Material feel: poor air = rougher & more matte; rain = wetter sheen.
    material.roughness = clamp(0.32 + airPoor * 0.5 - rain * 0.18, 0.05, 0.95);
    material.metalness = clamp(0.18 + rain * 0.25, 0, 0.7);
    material.emissiveIntensity = 0.5 * darken;
  }

  function updateParticles(time) {
    const social = clamp(state.data.social);
    const wind = clamp(state.data.wind);
    const rain = clamp(state.data.rain);
    // Wind sweeps the particle field; rain thickens it into a haze.
    particles.rotation.y += 0.0016 + wind * 0.02;
    particles.rotation.x = Math.sin(time * 0.12) * 0.12;
    particles.material.opacity = 0.18 + social * 0.3 + rain * 0.3 + state.clickPulse * 0.15;
    particles.material.size = 0.012 + rain * 0.02;
  }

  function setupAudio() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const master = context.createGain();
    const filter = context.createBiquadFilter();
    const oscA = context.createOscillator();
    const oscB = context.createOscillator();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();

    oscA.type = "sine";
    oscB.type = "triangle";
    lfo.type = "sine";
    filter.type = "lowpass";
    filter.frequency.value = 900;
    master.gain.value = 0;
    lfo.frequency.value = 0.2;
    lfoGain.gain.value = 18;

    lfo.connect(lfoGain);
    lfoGain.connect(oscA.frequency);
    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(master);
    master.connect(context.destination);
    oscA.start();
    oscB.start();
    lfo.start();

    // Rain: looping filtered white noise -> a soft, wet texture.
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i += 1) noiseData[i] = Math.random() * 2 - 1;
    const rainSrc = context.createBufferSource();
    rainSrc.buffer = noiseBuffer;
    rainSrc.loop = true;
    const rainFilter = context.createBiquadFilter();
    rainFilter.type = "bandpass";
    rainFilter.frequency.value = 1400;
    rainFilter.Q.value = 0.5;
    const rainGain = context.createGain();
    rainGain.gain.value = 0;
    rainSrc.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(master);
    rainSrc.start();

    return { context, master, filter, oscA, oscB, lfo, rainGain };
  }

  function updateAudio() {
    if (!audio) return;
    const now = audio.context.currentTime;
    const data = state.data;
    const traffic = clamp(data.traffic);
    const airPoor = 1 - clamp(data.air);
    const social = clamp(data.social);
    const rain = clamp(data.rain);
    const tempNorm = clamp((data.temperature + 5) / 40);
    const bpm = lerp(7, 20, traffic);

    const volume = state.audioOn ? 0.02 + (0.1 + social * 0.1) * state.audioIntensity : 0;
    // Warmer temperature raises the drone's pitch base slightly.
    const baseFreq = 110 + tempNorm * 90 + social * 40;
    audio.master.gain.setTargetAtTime(volume, now, 0.08);
    audio.oscA.frequency.setTargetAtTime(baseFreq, now, 0.08);
    // Poor air detunes the second oscillator -> a rough, beating dissonance.
    audio.oscB.frequency.setTargetAtTime(baseFreq * (1.5 + airPoor * 0.12), now, 0.08);
    // Traffic opens the filter (brighter, busier); poor air also adds grit.
    audio.filter.frequency.setTargetAtTime(360 + traffic * 1700 + airPoor * 500, now, 0.12);
    // Breath LFO follows the actual breathing rate.
    audio.lfo.frequency.setTargetAtTime(bpm / 60, now, 0.12);
    // Rain brings a soft noise wash and pulls high frequencies down.
    if (audio.rainGain) {
      audio.rainGain.gain.setTargetAtTime(state.audioOn ? rain * 0.14 * state.audioIntensity : 0, now, 0.2);
    }
  }

  function updateMetrics() {
    const data = state.data;
    // Traffic = congestion (higher = busier). Air = quality (higher = cleaner).
    els.traffic.textContent = formatPct(data.traffic);
    els.air.textContent = formatPct(data.air);
    // Weather cell shows the actual temperature; social stays a percentage.
    els.weather.textContent = `${Math.round(data.temperature)}°`;
    els.social.textContent = formatPct(data.social);
    els.dot.className = `dot ${data.live ? "live" : "fallback"}`;
    els.status.textContent = data.live
      ? `${data.city} live · ${Math.round(data.temperature)}°C · ${data.rain > 0.05 ? "rain" : data.cloud > 0.6 ? "cloudy" : "clear"} · ${new Date(data.timestamp).toLocaleTimeString()}`
      : `${data.city} demo signal active`;
  }

  async function refreshData() {
    els.status.textContent = "Fetching city signal…";
    state.targetData = await fetchCityData(state.cityKey);
    state.lastFetch = performance.now();
  }

  function blendData(target, dt) {
    if (state.timeMode) {
      const fallback = makeFallbackData(state.cityKey);
      const cycle = performance.now() / 1000;
      target = {
        ...fallback,
        live: state.targetData.live,
        traffic: clamp(0.5 + Math.sin(cycle * 1.7) * 0.42),
        air: clamp(0.55 + Math.sin(cycle * 1.1 + 2) * 0.35),
        wind: clamp(0.4 + Math.sin(cycle * 0.8 + 4) * 0.4),
        rain: clamp(Math.max(0, Math.sin(cycle * 0.5 + 1)) * 0.7),
        temperature: 22 + Math.sin(cycle * 0.6) * 12,
        social: clamp(0.5 + Math.sin(cycle * 2.3 + 1) * 0.36)
      };
      target.weather = clamp(1 - target.wind * 0.3 - target.rain * 0.6);
      target.overall = (target.traffic + target.air + target.weather + target.social) / 4;
    }

    const t = clamp(dt * 1.8);
    for (const key of ["traffic", "air", "weather", "social", "overall", "wind", "rain", "cloud", "humidity", "temperature"]) {
      if (typeof target[key] === "number") {
        state.data[key] = lerp(state.data[key] ?? target[key], target[key], t);
      }
    }
    state.data.city = target.city;
    state.data.timestamp = target.timestamp;
    state.data.live = target.live;
  }

  let last = performance.now();
  let started = false;
  function animate(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = now / 1000;

    if (now - state.lastFetch > 180000) {
      state.lastFetch = now;
      refreshData();
    }

    blendData(state.targetData, dt);
    state.clickPulse = Math.max(0, state.clickPulse - dt * 1.7);
    const traffic = clamp(state.data.traffic);
    const airPoor = 1 - clamp(state.data.air);
    const rain = clamp(state.data.rain);
    const tempNorm = clamp((state.data.temperature + 5) / 40);
    const spin = reducedMotion ? 0.06 : 1;
    // Busier city -> faster rotation.
    group.rotation.y += dt * (0.05 + traffic * 0.28) * spin;
    group.rotation.x = Math.sin(time * 0.2) * (reducedMotion ? 0.03 : 0.08);

    // Lighting: rain/cloud soften and dim the key light; heat warms the fill
    // light; poor air deadens overall ambience.
    keyLight.intensity = (46 - rain * 20 - clamp(state.data.cloud) * 10) * (1 - airPoor * 0.3);
    keyLight.color.setHSL(lerp(0.42, 0.55, rain), 0.5, 0.7); // cooler in rain
    warmLight.intensity = 14 + tempNorm * 30;
    warmLight.color.setHSL(lerp(0.6, 0.07, tempNorm), 0.8, 0.6); // hot -> warm
    ambientLight.intensity = 0.55 - airPoor * 0.2 - rain * 0.08;
    scene.fog.density = 0.035 + rain * 0.03 + airPoor * 0.03;

    deformGeometry(time, dt);
    updateParticles(time);
    updateAudio();
    updateMetrics();
    renderer.render(scene, camera);

    if (!started) {
      started = true;
      if (veil) veil.classList.add("hidden");
    }
    requestAnimationFrame(animate);
  }

  function bindEvents() {
    window.addEventListener("resize", resize);
    els.city.addEventListener("change", () => {
      state.cityKey = els.city.value;
      refreshData();
    });
    els.style.addEventListener("change", () => {
      state.styleKey = els.style.value;
    });
    els.audioSlider.addEventListener("input", () => {
      state.audioIntensity = Number(els.audioSlider.value);
    });
    els.speedSlider.addEventListener("input", () => {
      state.visualSpeed = Number(els.speedSlider.value);
    });
    els.timeToggle.addEventListener("change", () => {
      state.timeMode = els.timeToggle.checked;
    });
    els.refresh.addEventListener("click", refreshData);
    els.audioToggle.addEventListener("click", async () => {
      audio ||= setupAudio();
      if (audio.context.state === "suspended") await audio.context.resume();
      state.audioOn = !state.audioOn;
      els.audioToggle.setAttribute("aria-pressed", String(state.audioOn));
      els.audioIcon.textContent = state.audioOn ? "■" : "♪";
    });
    // Click-to-change-style works anywhere the sculpture is visible.
    // The canvas is behind the page content, so we listen on window and
    // ignore clicks that land on interactive UI (nav, console, buttons…).
    const interactiveSelector = "a, button, select, input, textarea, label, .console, .nav, .footer, .skip-link, .card";
    window.addEventListener("pointerdown", (event) => {
      if (event.target.closest && event.target.closest(interactiveSelector)) return;
      const rect = els.canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(sculpture)[0];
      if (hit) {
        const keys = Object.keys(styles);
        state.styleKey = keys[(keys.indexOf(state.styleKey) + 1) % keys.length];
        els.style.value = state.styleKey;
        state.clickPulse = 1;
        els.tooltip.textContent = `Breathing style changed to ${state.styleKey}.`;
      }
    });
    if (els.enterCta || els.closeConsole || els.toggleConsole) {
      const consoleEl = document.getElementById("console");
      const gateEl = document.getElementById("turnstileGate");
      const gateStatus = document.getElementById("turnstile-gate-status");
      const widgetMount = document.getElementById("turnstile-console-widget");
      let consoleUnlocked = false; // one successful check unlocks for the session
      let turnstileRendered = false;

      const openConsole = () => {
        if (!consoleEl) return;
        consoleEl.classList.remove("hidden");
        consoleEl.classList.add("active");
        document.body.classList.remove("focus-mode");
        document.body.classList.add("console-mode");
        els.enterCta.classList.add("hidden");
        if (gateEl) gateEl.hidden = true;
        els.tooltip.textContent = "Click the sculpture to change its breath. Enable sound to hear the city sing.";
      };
      const closeConsole = () => {
        if (!consoleEl) return;
        consoleEl.classList.remove("active");
        consoleEl.classList.add("hidden");
        document.body.classList.remove("console-mode");
        document.body.classList.remove("focus-mode");
        els.enterCta.classList.remove("hidden");
      };
      const toggleConsole = () => {
        if (!consoleEl) return;
        const isOpen = consoleEl.classList.contains("active");
        if (isOpen) {
          // Hide only the console panel; keep the front-end hidden (console-mode
          // stays) so the toggle button remains to bring it back.
          consoleEl.classList.remove("active");
          consoleEl.classList.add("hidden");
        } else if (consoleUnlocked) {
          consoleEl.classList.remove("hidden");
          consoleEl.classList.add("active");
          document.body.classList.add("console-mode");
          els.enterCta.classList.add("hidden");
        } else {
          // Not verified yet — route through the human check instead.
          requestConsole();
        }
      };

      // Show the Turnstile challenge, rendering the widget on demand once the
      // api.js script has loaded.
      const requestConsole = () => {
        if (consoleUnlocked) return openConsole();
        if (!gateEl || !widgetMount) return openConsole(); // no widget → fail open
        gateEl.hidden = false;
        if (gateStatus) gateStatus.textContent = "";
        if (!turnstileRendered && window.turnstile) {
          window.turnstile.render(widgetMount, {
            sitekey: TURNSTILE_SITEKEY,
            callback: onTurnstileVerified,
            theme: "dark"
          });
          turnstileRendered = true;
        } else if (!turnstileRendered) {
          setTimeout(requestConsole, 200); // api.js not ready yet
        }
      };

      // Called by Turnstile with a token; verify server-side, then open.
      const onTurnstileVerified = async (token) => {
        if (!gateStatus) return;
        gateStatus.textContent = "Verifying…";
        try {
          const res = await fetch("/api/verify-turnstile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
          });
          const data = await res.json();
          if (data.success) {
            consoleUnlocked = true;
            openConsole();
          } else {
            gateStatus.textContent = "Verification failed. Please try again.";
            resetTurnstile();
          }
        } catch {
          gateStatus.textContent = "Verification unavailable. Please try again.";
          resetTurnstile();
        }
      };
      window.onTurnstileVerified = onTurnstileVerified;

      const resetTurnstile = () => {
        if (widgetMount && window.turnstile && turnstileRendered) {
          try {
            window.turnstile.reset(widgetMount);
          } catch {
            /* widget already gone */
          }
        }
      };

      if (els.enterCta) els.enterCta.addEventListener("click", requestConsole);
      if (els.closeConsole) els.closeConsole.addEventListener("click", closeConsole);
      if (els.toggleConsole) els.toggleConsole.addEventListener("click", toggleConsole);
    }

    // Cursor-tracked light source for the liquid-glass specular sheen
    if (!reducedMotion) {
      window.addEventListener(
        "pointermove",
        (e) => {
          const root = document.documentElement;
          root.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
          root.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
        },
        { passive: true }
      );
    }

    // WebGL context loss resilience
    els.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      if (veil) {
        veil.classList.remove("hidden");
        veil.innerHTML = '<div class="veil-core"><p>Graphics context lost. Restoring…</p></div>';
      }
    });
    els.canvas.addEventListener("webglcontextrestored", () => {
      window.location.reload();
    });
  }

  function setupReveal() {
    const targets = document.querySelectorAll(
      ".hero .eyebrow, .hero h1, .hero .lede, .hero-actions, .scroll-cue, " +
      ".section-title, .section-body, .card, .feature-list li, .table-wrap"
    );
    targets.forEach((t) => t.classList.add("reveal"));
    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((t) => io.observe(t));
  }

  setupReveal();
  resize();
  bindEvents();
  watchTurnstile();
  refreshData();
  requestAnimationFrame(animate);
}

boot();
