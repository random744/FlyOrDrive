/* FlyOrDrive – Interaktive Karte */
(function () {
  const cfg = window.FOD_CONFIG;
  const C = cfg.constants;
  const $ = (id) => document.getElementById(id);
  const fmt = (n, d = 0) => n.toLocaleString("de-CH", { minimumFractionDigits: d, maximumFractionDigits: d });
  const byIcao = Object.fromEntries(cfg.airfields.map((a) => [a.icao, a]));
  const homes = cfg.airfields.filter((a) => a.home);
  const isHome = (icao) => !!(byIcao[icao] && byIcao[icao].home);

  const ICON_PLANE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>';
  const ICON_CAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>';

  // Nur echt geflogene Routen mit Homebase-Beteiligung
  const routeHome = (r) => (isHome(r.from) ? r.from : isHome(r.to) ? r.to : null);
  const flights = cfg.routes.filter((r) => {
    const ok = byIcao[r.from] && byIcao[r.to] && routeHome(r) && r.flight && r.flight.minutes > 0 && r.flight.fuelL > 0;
    if (!ok) console.warn(`Route ${r.from}–${r.to} ignoriert: unbekannter Flugplatz, keine Homebase oder Flugdaten fehlen.`);
    return ok;
  });
  const usedIcaos = new Set([...homes.map((h) => h.icao), ...flights.flatMap((r) => [r.from, r.to])]);

  /* ---------- Zustand ---------- */
  const state = {
    route: null,         // aktuell gewählter Flug
    get from() { return this.route && this.route.from; },
    get to() { return this.route && this.route.to; },
    pax: 2,
    carVariant: cfg.car.defaultVariant,
    carCons: { ...Object.fromEntries(Object.entries(cfg.car.variants).map(([k, v]) => [k, v.consumptionPer100])) },
    road: null,          // { km, h, geometry, estimated }
  };
  const roadCache = new Map();
  let pending = null;

  /* ---------- Navigation (Mobile) ---------- */
  const links = $("navLinks");
  $("navToggle").addEventListener("click", () => links.classList.toggle("open"));

  /* ---------- Karte ---------- */
  const map = L.map("map", { zoomControl: true, attributionControl: true }).setView([46.8, 8.2], 8);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
  }).addTo(map);

  const markers = {};
  cfg.airfields.filter((af) => usedIcaos.has(af.icao)).forEach((af) => {
    markers[af.icao] = L.marker([af.lat, af.lon], { icon: afIcon(af, af.home ? "home" : ""), riseOnHover: true })
      .addTo(map)
      .bindTooltip(`<strong>${af.name}</strong><br>${af.icao}${af.home ? " · Homebase" : ""}`, { direction: "top", offset: [0, -10] })
      .on("click", () => pickAirfield(af.icao));
  });
  const overview = L.latLngBounds(Object.values(markers).map((m) => m.getLatLng()));

  function afIcon(af, cls) {
    return L.divIcon({ className: "", html: `<div class="af-marker ${cls}">${af.icao}</div>`, iconSize: [0, 0] });
  }

  const routeLayer = L.layerGroup().addTo(map);

  /* ---------- Menü: Flüge nach Homebase gruppiert ---------- */
  const routeList = $("routeList");
  homes.forEach((h) => {
    const group = flights.filter((r) => routeHome(r) === h.icao);
    if (!group.length) return;
    const head = document.createElement("div");
    head.className = "route-group";
    head.textContent = `Homebase ${h.name} (${h.icao})`;
    routeList.appendChild(head);
    group.forEach((r) => {
      const btn = document.createElement("button");
      btn.className = "route-item";
      btn.route = r;
      btn.innerHTML = `<div><strong>${r.title}</strong>
                       <small>${byIcao[r.from].name} → ${byIcao[r.to].name}</small>
                       <small style="display:block">${fmtDate(r.flight.date)}${r.flight.date ? " · " : ""}${fmtTime(r.flight.minutes / 60)} · ${fmt(r.flight.fuelL, 1)} L</small></div>
                       <span class="codes">${r.from} → ${r.to}</span>`;
      btn.addEventListener("click", () => selectRoute(r));
      routeList.appendChild(btn);
    });
  });
  if (!flights.length) {
    routeList.innerHTML = '<p class="intro">Noch keine Flüge eingetragen. Flüge werden in <code>assets/js/config.js</code> unter <code>routes</code> ergänzt.</p>';
  }
  $("flightCount").textContent = flights.length === 1 ? "1 Flug" : `${flights.length} Flüge`;

  $("backBtn").addEventListener("click", () => selectRoute(null));

  /* ---------- Ansichten: Menü ↔ Vergleich ---------- */
  const panel = document.querySelector(".panel");
  function showView(name) {
    const toResult = name === "result";
    $("menuView").hidden = toResult;
    $("resultView").hidden = !toResult;
    panel.scrollTop = 0;
    // Mobile: Panel liegt unter der Karte – Anfang der neuen Ansicht sichtbar machen
    if (panel.getBoundingClientRect().top < 0) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  segment("paxSeg", (v) => { state.pax = +v; render(); });
  segment("carSeg", (v) => { state.carVariant = v; syncInputs(); render(); });

  function segment(id, onChange) {
    const el = $(id);
    el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      el.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      onChange(b.dataset.v);
    }));
  }

  $("pCar").addEventListener("input", (e) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v) && v > 0) { state.carCons[state.carVariant] = v; render(); }
  });

  function syncInputs() {
    $("pCar").value = state.carCons[state.carVariant];
    $("pCarUnit").textContent = cfg.car.variants[state.carVariant].unit;
  }

  /* ---------- Auswahl ---------- */
  // Klick auf einen Flugplatz öffnet den (ersten) Flug dorthin bzw. von dort
  function pickAirfield(icao) {
    if (isHome(icao)) { selectRoute(null); return; }
    const r = flights.find((f) => f.to === icao) || flights.find((f) => f.from === icao);
    if (r) selectRoute(r);
  }

  function selectRoute(r) {
    state.route = r;
    const { from, to } = state;

    routeList.querySelectorAll(".route-item").forEach((b) => b.classList.toggle("active", b.route === r));
    Object.entries(markers).forEach(([icao, m]) => {
      const af = byIcao[icao];
      m.setIcon(afIcon(af, [af.home ? "home" : "", icao === from ? "start" : icao === to ? "end" : ""].join(" ")));
    });

    if (r) $("resSub").textContent = `${r.title} · ${byIcao[from].name} → ${byIcao[to].name}`;
    $("mapHint").textContent = r
      ? `${byIcao[from].name} → ${byIcao[to].name}`
      : "Wähle einen Flug links oder klicke auf einen Flugplatz";

    history.replaceState(null, "", r ? `#${from}-${to}` : location.pathname);
    showView(r ? "result" : "menu");
    loadRoad();
  }

  /* ---------- Strassenroute (OSRM) ---------- */
  async function loadRoad() {
    state.road = null;
    routeLayer.clearLayers();
    if (!state.route) {
      render();
      if (overview.isValid()) map.fitBounds(overview, { padding: [60, 60], maxZoom: 9 });
      return;
    }

    const a = byIcao[state.from], b = byIcao[state.to];
    const key = [a.icao, b.icao].join("-");
    drawPlane(a, b);
    map.fitBounds(L.latLngBounds([[a.lat, a.lon], [b.lat, b.lon]]), { padding: [60, 60] });

    if (roadCache.has(key)) {
      state.road = roadCache.get(key);
      drawRoad();
      render();
      return;
    }

    setStatus("Strassenroute wird berechnet…", true);
    render();
    if (pending) pending.abort();
    const ctrl = new AbortController();
    pending = ctrl;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes.length) throw new Error(data.code);
      const r = data.routes[0];
      state.road = { km: r.distance / 1000, h: r.duration / 3600, geometry: r.geometry.coordinates, estimated: false };
    } catch (err) {
      if (err.name === "AbortError") return;
      const km = haversine(a, b) * cfg.car.roadFactorFallback;
      state.road = { km, h: km / cfg.car.avgKmhFallback, geometry: null, estimated: true };
    }
    pending = null;
    if (state.from !== a.icao || state.to !== b.icao) return;
    roadCache.set(key, state.road);
    drawRoad();
    render();
  }

  function drawPlane(a, b) {
    const pts = greatCircle(a, b, 64);
    L.polyline(pts, { color: "#ffffff", weight: 7, opacity: .8 }).addTo(routeLayer);
    L.polyline(pts, { color: "#2f7cf6", weight: 3.5, dashArray: "2 9", lineCap: "round" }).addTo(routeLayer);

    const mid = pts[Math.floor(pts.length / 2)];
    const p1 = map.project(pts[Math.floor(pts.length / 2) - 1], 0);
    const p2 = map.project(pts[Math.floor(pts.length / 2) + 1], 0);
    const angle = Math.atan2(p2.x - p1.x, -(p2.y - p1.y)) * 180 / Math.PI;
    L.marker(mid, {
      interactive: false,
      icon: L.divIcon({
        className: "",
        iconSize: [0, 0],
        html: `<div style="position:absolute;transform:translate(-50%,-50%) rotate(${angle}deg);width:30px;height:30px;color:#2f7cf6;filter:drop-shadow(0 0 2px #fff) drop-shadow(0 1px 3px rgba(0,0,0,.35))">${ICON_PLANE}</div>`,
      }),
    }).addTo(routeLayer);
  }

  function drawRoad() {
    if (!state.road || !state.road.geometry) return;
    const pts = state.road.geometry.map(([lon, lat]) => [lat, lon]);
    const casing = L.polyline(pts, { color: "#ffffff", weight: 7, opacity: .9 }).addTo(routeLayer);
    const line = L.polyline(pts, { color: "#f2792b", weight: 4, opacity: .95 }).addTo(routeLayer);
    // Strasse unter die Fluglinie legen
    line.bringToBack();
    casing.bringToBack();
    map.fitBounds(line.getBounds().extend(markers[state.from].getLatLng()).extend(markers[state.to].getLatLng()), { padding: [50, 50] });
  }

  /* ---------- Berechnung ---------- */
  function compute() {
    const a = byIcao[state.from], b = byIcao[state.to];
    const ac = cfg.aircraft;
    const gcKm = haversine(a, b);

    const f = state.route.flight;
    const plane = {
      km: f.km || gcKm * ac.routingFactor,
      h: f.minutes / 60,
      fuel: f.fuelL,
      kWh: f.fuelL * C.kWhPerLiterPetrol,
      co2: f.fuelL * C.co2PerLiterPetrol,
      chf: f.fuelL * C.petrolPriceChf,
    };

    let car = null;
    if (state.road) {
      const v = cfg.car.variants[state.carVariant];
      const amount = state.road.km * state.carCons[state.carVariant] / 100;
      const isEl = state.carVariant === "electric";
      car = {
        km: state.road.km,
        h: state.road.h,
        fuel: amount, fuelUnit: v.unit,
        kWh: isEl ? amount : amount * C.kWhPerLiterPetrol,
        co2: isEl ? amount * C.co2PerKWhGrid : amount * C.co2PerLiterPetrol,
        chf: amount * (isEl ? v.priceChf : C.petrolPriceChf),
      };
    }
    return { gcKm, plane, car };
  }

  /* ---------- Darstellung ---------- */
  function render() {
    const metricsEl = $("metrics");
    if (!state.route) { setStatus(""); return; }

    const { gcKm, plane, car } = compute();
    const pax = state.pax;
    $("resTitle").textContent = `${state.from} → ${state.to}`;

    const rows = [
      { name: "Strecke", unit: "km", p: plane.km, c: car && car.km, d: 0 },
      { name: "Reisezeit", p: plane.h, c: car && car.h, time: true },
      { name: pax > 1 ? "Energie pro Person" : "Energie", unit: "kWh", p: plane.kWh / pax, c: car && car.kWh / pax, d: 1 },
      { name: "Energie pro 100 km Luftlinie", unit: "kWh", p: plane.kWh / pax / gcKm * 100, c: car && car.kWh / pax / gcKm * 100, d: 1, hint: pax > 1 ? "pro Person" : "" },
      { name: pax > 1 ? "CO₂ pro Person" : "CO₂", unit: "kg", p: plane.co2 / pax, c: car && car.co2 / pax, d: 1 },
      { name: pax > 1 ? "Treibstoffkosten pro Person" : "Treibstoffkosten", unit: "CHF", p: plane.chf / pax, c: car && car.chf / pax, d: 2, prefix: true },
    ];

    metricsEl.innerHTML = rows.map(metricRow).join("") +
      `<div class="metric"><div class="metric-top"><span class="name">Verbrauch gesamt</span></div>
         <div class="bar-row p">${ICON_PLANE}<span style="font-size:.88rem">${fmt(plane.fuel, 1)} L Bleifrei 95</span><span></span></div>
         ${car ? `<div class="bar-row c">${ICON_CAR}<span style="font-size:.88rem">${fmt(car.fuel, 1)} ${car.fuelUnit} ${state.carVariant === "electric" ? "Strom" : "Bleifrei 95"}</span><span></span></div>` : ""}
       </div>`;

    if (car) {
      $("headline").innerHTML = headline(plane, car);
      setStatus(state.road.estimated ? "Strasse geschätzt (offline)" : "");
    } else {
      $("headline").innerHTML = "<strong>Berechne Strassenroute…</strong>Die Werte für das Flugzeug sind bereits verfügbar.";
    }

    const f = state.route.flight;
    $("footnote").innerHTML =
      `Flugzeug: Flug${f.date ? " vom " + fmtDate(f.date) : ""} – ${fmtTime(f.minutes / 60)} in der Luft, ${fmt(f.fuelL, 1)} L Bleifrei 95. ` +
      (f.km ? `Geflogene Distanz ${fmt(f.km)} km. ` : `Distanz: Luftlinie ${fmt(gcKm)} km + 5 %. `) +
      `Beide Fahrzeuge tanken Bleifrei 95 zu CHF ${fmt(C.petrolPriceChf, 2)}/L. ` +
      `Smart ${cfg.car.variants[state.carVariant].label}: ${fmt(state.carCons[state.carVariant], 1)} ${cfg.car.variants[state.carVariant].unit}/100 km. ` +
      `Fahrten zum/vom Flugplatz und Wartezeiten sind nicht eingerechnet. ` +
      (state.road && state.road.estimated
        ? `Strassendistanz geschätzt (Luftlinie × ${cfg.car.roadFactorFallback}).`
        : `Strassenroute: <a href="https://project-osrm.org" target="_blank" rel="noopener">OSRM</a> / OpenStreetMap.`);
  }

  function metricRow(r) {
    const val = (x) => {
      if (x == null) return "…";
      if (r.time) return fmtTime(x);
      return r.prefix ? `${r.unit} ${fmt(x, r.d)}` : `${fmt(x, r.d)} ${r.unit}`;
    };
    const max = Math.max(r.p, r.c || 0) || 1;
    const pWin = r.c != null && r.p < r.c;
    const cWin = r.c != null && r.c < r.p;
    let ratio = "";
    if (r.c != null && r.p > 0 && r.c > 0) {
      const f = r.p / r.c;
      ratio = f >= 1 ? `Flugzeug ${fmt(f, 1)}× mehr` : `Auto ${fmt(1 / f, 1)}× mehr`;
    }
    return `<div class="metric">
      <div class="metric-top"><span class="name">${r.name}${r.hint ? ` <small style="color:var(--muted);font-weight:400">(${r.hint})</small>` : ""}</span><span class="ratio">${ratio}</span></div>
      <div class="bar-row p">${ICON_PLANE}<div class="bar"><div style="width:${(r.p / max) * 100}%"></div></div><span class="val ${pWin ? "win" : ""}">${val(r.p)}</span></div>
      <div class="bar-row c">${ICON_CAR}<div class="bar"><div style="width:${r.c != null ? (r.c / max) * 100 : 0}%"></div></div><span class="val ${cWin ? "win" : ""}">${val(r.c)}</span></div>
    </div>`;
  }

  function headline(p, c) {
    const e = p.kWh / c.kWh;
    const t = c.h / p.h;
    const energy = e >= 1
      ? `braucht <b>${fmt(e, 1)}× so viel Energie</b>`
      : `braucht <b>${fmt((1 - e) * 100)} % weniger Energie</b>`;
    const speed = t >= 1 ? `<b>${fmt(t, 1)}× schneller</b>` : `<b>${fmt(1 / t, 1)}× langsamer</b>`;
    const time = (e >= 1) === (t >= 1) ? `ist aber ${speed}` : `und ist ${speed}`;
    const saved = c.h - p.h;
    return `<strong>Das Flugzeug ${energy}, ${time}.</strong>` +
      (saved > 0 ? `Zeitersparnis: ${fmtTime(saved)} pro Weg.` : `Das Auto ist auf dieser Strecke ${fmtTime(-saved)} schneller.`);
  }

  function setStatus(text, loading) {
    const s = $("status");
    s.textContent = text;
    s.classList.toggle("loading", !!loading);
  }

  /* ---------- Hilfsfunktionen ---------- */
  function fmtDate(d) {
    return d ? new Date(d + "T12:00:00").toLocaleDateString("de-CH") : "";
  }

  function fmtTime(h) {
    const total = Math.round(h * 60);
    const hh = Math.floor(total / 60), mm = total % 60;
    return hh ? `${hh} h ${String(mm).padStart(2, "0")} min` : `${mm} min`;
  }

  function haversine(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function greatCircle(a, b, n) {
    const rad = Math.PI / 180;
    const φ1 = a.lat * rad, λ1 = a.lon * rad, φ2 = b.lat * rad, λ2 = b.lon * rad;
    const d = haversine(a, b) / 6371;
    if (d === 0) return [[a.lat, a.lon]];
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
      const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
      const z = A * Math.sin(φ1) + B * Math.sin(φ2);
      pts.push([Math.atan2(z, Math.hypot(x, y)) / rad, Math.atan2(y, x) / rad]);
    }
    return pts;
  }

  /* ---------- Start ---------- */
  syncInputs();
  const h = location.hash.toUpperCase().match(/^#([A-Z0-9]{4})-([A-Z0-9]{4})$/);
  selectRoute((h && flights.find((r) => r.from === h[1] && r.to === h[2])) || null);
})();
