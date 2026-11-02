/* FlyOrDrive – Startseite */
(function () {
  const cfg = window.FOD_CONFIG;
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), cfg);
  const fmt = (n, d = 0) => n.toLocaleString("de-CH", { minimumFractionDigits: d, maximumFractionDigits: d });

  /* Navigation */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = document.getElementById("navLinks");
  document.getElementById("navToggle").addEventListener("click", () => links.classList.toggle("open"));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));

  /* Texte aus der Konfiguration */
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const v = get(el.dataset.bind);
    if (v !== undefined && v !== "") el.textContent = v;
  });

  /* Fotos: nur anzeigen, wenn die Datei existiert */
  document.querySelectorAll("img[data-src]").forEach((img) => {
    const src = get(img.dataset.src);
    if (!src) return;
    img.onload = () => { img.hidden = false; };
    img.src = src;
  });

  /* Technische Daten */
  const specs = (el, items) => {
    el.innerHTML = items.map(([k, v]) => `<div class="spec"><span>${k}</span><strong>${v}</strong></div>`).join("");
  };
  const a = cfg.aircraft;
  specs(document.getElementById("aircraftSpecs"), [
    ["Leistung", `${fmt(a.powerKW, 1)} kW (${fmt(a.powerKW * 1.36)} PS)`],
    ["Reisegeschwindigkeit", `${fmt(a.cruiseKmh)} km/h`],
    ["Verbrauch Reiseflug", `${fmt(a.fuelLph, 1)} L/h`],
    ["Sitzplätze", a.seats],
    ["Homebases", cfg.airfields.filter((f) => f.home).map((f) => f.name).join(" / ")],
    ["Treibstoff", a.fuelType],
  ]);
  const c = cfg.car;
  specs(document.getElementById("carSpecs"), [
    ["Leistung", `${fmt(c.powerKW)} kW (${fmt(c.powerKW * 1.36)} PS)`],
    ["Verbrauch", `${fmt(c.consumptionPer100, 1)} L/100 km`],
    ["Sitzplätze", cfg.car.seats],
    ["Länge", "2.70 m"],
    ["Treibstoff", "Bleifrei 95"],
  ]);

  /* Erklärvideo */
  const video = cfg.media.videoUrl;
  if (video) {
    const frame = document.getElementById("videoFrame");
    const yt = video.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (yt) {
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Erklärvideo" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    } else if (/\.(mp4|webm|mov)$/i.test(video)) {
      frame.innerHTML = `<video src="${video}" controls preload="metadata"></video>`;
    } else {
      frame.innerHTML = `<iframe src="${video}" title="Erklärvideo" allowfullscreen></iframe>`;
    }
  }

  /* Interview */
  const partner = cfg.media.interviewPartner || "";
  document.getElementById("interviewInitials").textContent =
    partner.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  if (cfg.media.interviewUrl) {
    const btn = document.getElementById("interviewBtn");
    btn.href = cfg.media.interviewUrl;
    btn.target = "_blank";
    btn.rel = "noopener";
    btn.removeAttribute("aria-disabled");
    btn.querySelector("span").textContent = "Interview ansehen";
  }

  document.getElementById("year").textContent = new Date().getFullYear();

  /* Einblend-Animation */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
