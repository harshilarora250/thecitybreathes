// The City Breathes — front-end engine
// Three.js (3D) + Web Audio API (sound), with graceful degradation.

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

function makeFallbackData(cityKey) {
  const city = cities[cityKey];
  const now = Date.now();
  const hour = new Date().getHours();
  const commute = Math.max(
    Math.exp(-Math.pow(hour - 8, 2) / 10),
    Math.exp(-Math.pow(hour - 18, 2) / 10)
  );
  const seed = Math.abs(Math.sin(city.lat * 0.13 + city.lon * 0.07 + now / 3600000));
  const traffic = clamp(0.25 + commute * 0.55 + seed * 0.18);
  const air = clamp(0.35 + seed * 0.45 + (city.lat > 27 ? 0.12 : 0));
  const weather = clamp(0.25 + Math.abs(Math.sin(now / 4800000 + city.lon)) * 0.65);
  const social = clamp(0.2 + Math.abs(Math.sin(now / 2100000 + city.lat)) * 0.7);
  return {
    city: city.name,
    timestamp: new Date().toISOString(),
    live: false,
    traffic,
    air,
    weather,
    social,
    overall: (traffic + air + weather + social) / 4
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
    const weatherNow = weatherJson.current || {};
    const airNow = airJson.current || {};
    const fallback = makeFallbackData(cityKey);

    const wind = clamp((weatherNow.wind_speed_10m || 0) / 55);
    const cloud = clamp((weatherNow.cloud_cover || 0) / 100);
    const rain = clamp((weatherNow.precipitation || 0) / 12);
    const weather = clamp(wind * 0.45 + cloud * 0.35 + rain * 0.2);
    const pm25 = clamp((airNow.pm2_5 || 0) / 80);
    const pm10 = clamp((airNow.pm10 || 0) / 140);
    const no2 = clamp((airNow.nitrogen_dioxide || 0) / 120);
    const air = clamp(pm25 * 0.5 + pm10 * 0.3 + no2 * 0.2);

    return {
      city: city.name,
      timestamp: new Date().toISOString(),
      live: true,
      traffic: fallback.traffic,
      air,
      weather,
      social: fallback.social,
      overall: (fallback.traffic + air + weather + fallback.social) / 4
    };
  } catch {
    return makeFallbackData(cityKey);
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
    focusToggle: document.querySelector("#focusToggle"),
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
    lastFetch: 0
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

  scene.add(new THREE.AmbientLight(0xd8fff0, 0.55));
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
    const stressed = new THREE.Color(0xff7b6e);
    const electric = new THREE.Color(0x72b8ff);
    const warm = new THREE.Color(0xf1c76d);
    // Lower values = worse: invert so low air/social/weather drives stressed color
    const air = 1 - data.air;
    const social = 1 - data.social;
    const weather = 1 - data.weather;
    const base = clean.clone().lerp(stressed, air);
    return base.lerp(electric, social * 0.28).lerp(warm, weather * 0.18);
  }

  function deformGeometry(time) {
    const data = state.data;
    const style = styles[state.styleKey];
    // Lower values = worse: invert each metric so low readings drive stress/distortion
    const traffic = 1 - data.traffic;
    const air = 1 - data.air;
    const social = 1 - data.social;
    const overall = 1 - data.overall;
    const weather = 1 - data.weather;
    const breathPhase = time * style.speed * state.visualSpeed * (0.65 + traffic * 1.1);
    const breath = Math.sin(breathPhase);
    const pulse = Math.pow(Math.max(0, breath), state.styleKey === "pulse" ? 3.5 : 1.4);
    const amplitude = style.amp + overall * 0.34 + state.clickPulse * 0.3;
    const roughness = style.roughness + air * 0.38 + social * 0.18;
    const color = palette(data);
    const pos = geometry.attributes.position.array;
    const wirePos = wire.geometry.attributes.position.array;

    for (let i = 0; i < pos.length; i += 3) {
      const x = basePositions[i];
      const y = basePositions[i + 1];
      const z = basePositions[i + 2];
      const len = Math.hypot(x, y, z) || 1;
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;
      const wave =
        Math.sin(nx * 7.2 + time * 1.7) *
        Math.cos(ny * 5.6 - time * 1.2) *
        Math.sin(nz * 4.8 + time * 0.9);
      const fracture = state.styleKey === "fracture" ? Math.sign(wave) * 0.08 : 0;
      const radius = 1 + pulse * amplitude + wave * roughness * 0.22 + fracture + weather * 0.05;
      pos[i] = x * radius;
      pos[i + 1] = y * radius * (1 + traffic * 0.05);
      pos[i + 2] = z * radius;
      wirePos[i] = pos[i] * 1.012;
      wirePos[i + 1] = pos[i + 1] * 1.012;
      wirePos[i + 2] = pos[i + 2] * 1.012;

      const cIndex = i;
      vertexColors[cIndex] = clamp(color.r + wave * 0.08 + social * 0.12);
      vertexColors[cIndex + 1] = clamp(color.g + pulse * 0.08);
      vertexColors[cIndex + 2] = clamp(color.b + weather * 0.12);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    wire.geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  function updateParticles(time) {
    // Lower values = worse: invert social/overall so low readings => calmer particles
    const social = 1 - state.data.social;
    const overall = 1 - state.data.overall;
    particles.rotation.y = time * (0.025 + social * 0.08);
    particles.rotation.x = Math.sin(time * 0.12) * 0.12;
    particles.material.opacity = 0.24 + social * 0.42 + state.clickPulse * 0.15;
    particles.material.size = 0.012 + overall * 0.015;
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

    return { context, master, filter, oscA, oscB, lfo };
  }

  function updateAudio() {
    if (!audio) return;
    const now = audio.context.currentTime;
    const data = state.data;
    // Lower values = worse: invert each metric so low readings => darker/quieter tone
    const traffic = 1 - data.traffic;
    const air = 1 - data.air;
    const social = 1 - data.social;
    const overall = 1 - data.overall;
    const weather = 1 - data.weather;
    const volume = state.audioOn ? 0.02 + overall * 0.16 * state.audioIntensity : 0;
    const baseFreq = 120 + weather * 130 + social * 90;
    audio.master.gain.setTargetAtTime(volume, now, 0.08);
    audio.oscA.frequency.setTargetAtTime(baseFreq, now, 0.08);
    audio.oscB.frequency.setTargetAtTime(baseFreq * (1.49 + air * 0.08), now, 0.08);
    audio.filter.frequency.setTargetAtTime(420 + traffic * 1600 + social * 700, now, 0.12);
    audio.lfo.frequency.setTargetAtTime(0.12 + traffic * 2.8, now, 0.12);
  }

  function updateMetrics() {
    const data = state.data;
    els.traffic.textContent = formatPct(data.traffic);
    els.air.textContent = formatPct(data.air);
    els.weather.textContent = formatPct(data.weather);
    els.social.textContent = formatPct(data.social);
    els.dot.className = `dot ${data.live ? "live" : "fallback"}`;
    els.status.textContent = data.live
      ? `${data.city} live signal · ${new Date(data.timestamp).toLocaleTimeString()}`
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
        traffic: clamp(0.5 + Math.sin(cycle * 1.7) * 0.32),
        air: clamp(0.48 + Math.sin(cycle * 1.1 + 2) * 0.28),
        weather: clamp(0.45 + Math.sin(cycle * 0.8 + 4) * 0.35),
        social: clamp(0.5 + Math.sin(cycle * 2.3 + 1) * 0.36)
      };
      target.overall = (target.traffic + target.air + target.weather + target.social) / 4;
    }

    const t = clamp(dt * 1.8);
    for (const key of ["traffic", "air", "weather", "social", "overall"]) {
      state.data[key] = lerp(state.data[key], target[key], t);
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
    const traffic = 1 - state.data.traffic;
    const spin = reducedMotion ? 0.06 : 1;
    group.rotation.y += dt * (0.18 + traffic * 0.18) * spin;
    group.rotation.x = Math.sin(time * 0.2) * (reducedMotion ? 0.03 : 0.08);
    keyLight.intensity = 42 + (1 - state.data.overall) * 42;
    warmLight.intensity = 12 + (1 - state.data.air) * 35;
    deformGeometry(time);
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
    if (els.enterCta || els.focusToggle || els.closeConsole) {
      const consoleEl = document.getElementById("console");
      const showConsole = () => {
        if (!consoleEl) return;
        consoleEl.classList.remove("hidden");
        consoleEl.classList.add("active");
        document.body.classList.remove("focus-mode");
        document.body.classList.add("console-mode");
        els.enterCta.classList.add("hidden");
        els.tooltip.textContent = "Click the sculpture to change its breath. Enable sound to hear the city sing.";
      };
      const hideConsole = () => {
        if (!consoleEl) return;
        consoleEl.classList.remove("active");
        consoleEl.classList.add("hidden");
        document.body.classList.remove("console-mode");
        document.body.classList.remove("focus-mode");
        els.enterCta.classList.remove("hidden");
      };
      if (els.enterCta) els.enterCta.addEventListener("click", showConsole);
      if (els.focusToggle) {
        els.focusToggle.addEventListener("click", () => {
          // Hide the console and bring the front-end (with the Open-console
          // button in #try) back into view.
          document.body.classList.remove("focus-mode");
          hideConsole();
        });
      }
      if (els.closeConsole) els.closeConsole.addEventListener("click", hideConsole);
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
  refreshData();
  requestAnimationFrame(animate);
}

boot();
