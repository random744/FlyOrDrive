/* =====================================================================
   FlyOrDrive – zentrale Konfiguration
   Hier werden alle Daten gepflegt: Fahrzeugdaten, Links, Flugplätze
   und Beispielrouten. Werte mit "TODO" bitte mit eigenen Daten prüfen.
   ===================================================================== */

window.FOD_CONFIG = {

  /* ---------- Medien (Startseite) ---------- */
  media: {
    // YouTube-Link oder Pfad zu einer Datei, z.B. "assets/media/erklaervideo.mp4"
    videoUrl: "",          // TODO: z.B. "https://www.youtube.com/embed/VIDEO_ID"
    // Link zum Interview (PDF, Audio, Video oder Seite)
    interviewUrl: "",      // TODO: z.B. "assets/media/interview.pdf"
    interviewPartner: "Jonathan Höhn",
  },

  /* ---------- Physikalische Konstanten ---------- */
  constants: {
    kWhPerLiterPetrol: 8.9,   // Heizwert Bleifrei 95 ≈ 32 MJ/L
    co2PerLiterPetrol: 2.37,  // kg CO₂ pro Liter Bleifrei 95 (Verbrennung)
    petrolPriceChf: 2.05,     // CHF pro Liter Bleifrei 95 – gilt für Flugzeug UND Auto
  },

  /* ---------- Flugzeug ---------- */
  aircraft: {
    name: "Cherry BX-2",
    engine: "Rotax 912 iS",
    category: "Experimental (Eigenbau)",
    seats: 2,
    powerKW: 73.5,            // 100 PS
    cruiseKmh: 250,           // typische Reisegeschwindigkeit (nur Info auf der Startseite)
    fuelLph: 13,              // typischer Verbrauch im Reiseflug (nur Info auf der Startseite)
    fuelType: "Bleifrei 95 (Autotankstelle)",
    routingFactor: 1.05,      // nur falls bei einem Flug keine geflogene Distanz (km) eingetragen ist
    image: "assets/img/cherry-bx2.jpg",
    description:
      "Die Cherry BX-2 ist ein zweisitziges Tiefdecker-Eigenbauflugzeug, entworfen vom Schweizer " +
      "Max Brändli. Gebaut aus Holz und Verbundwerkstoffen ist sie leicht und aerodynamisch sauber. " +
      "Angetrieben wird die Cherry von einem Rotax 912 iS mit elektronischer Einspritzung – " +
      "einem der sparsamsten Flugmotoren seiner Klasse.",
  },

  /* ---------- Auto ---------- */
  car: {
    name: "Smart fortwo",
    category: "Kleinstwagen · Benzin",
    seats: 2,
    powerKW: 52,
    consumptionPer100: 5.5,     // L/100 km Bleifrei 95 (fester Wert, nicht anpassbar)
    roadFactorFallback: 1.3,     // falls kein Routing möglich: Luftlinie × Faktor
    avgKmhFallback: 75,
    image: "assets/img/smart-fortwo.jpg",
    description:
      "Der Smart fortwo ist mit nur 2.70 m Länge eines der kleinsten und leichtesten Autos auf dem Markt. " +
      "Wie die Cherry bietet er genau zwei Sitzplätze – damit ist er der ideale, faire Vergleichspartner " +
      "für ein zweisitziges Kleinflugzeug.",
  },

  /* ---------- Flugplätze ----------
     place: optional – kurzer Ortsname für die Karte (sonst name)
     home: true = Homebase. Alle Routen starten oder enden an einer Homebase. */
  airfields: [
    { icao: "LSZE", name: "Bad Ragaz", lat: 47.0150, lon: 9.4820, home: true },
    { icao: "LSZL", name: "Locarno", lat: 46.1608, lon: 8.8786, home: true },
    { icao: "LSZF", name: "Birrfeld", lat: 47.4436, lon: 8.2336 },
    { icao: "LSZG", name: "Grenchen", lat: 47.1816, lon: 7.4172 },
    { icao: "LSGL", name: "Lausanne-Blécherette", place: "Lausanne", lat: 46.5453, lon: 6.6167 },
    { icao: "LSZB", name: "Bern-Belp", lat: 46.9141, lon: 7.4971 },
    { icao: "LSGC", name: "Les Eplatures", lat: 47.0839, lon: 6.7928 },
    { icao: "LSGG", name: "Genève", lat: 46.2381, lon: 6.1090 },
    { icao: "LSGS", name: "Sion", lat: 46.2196, lon: 7.3268 },
    { icao: "LSZA", name: "Lugano", lat: 46.0040, lon: 8.9106 },
    { icao: "LSZC", name: "Buochs", lat: 46.9744, lon: 8.3969 },
    { icao: "LSZS", name: "Samedan", lat: 46.5341, lon: 9.8841 },
    { icao: "LSZR", name: "St. Gallen-Altenrhein", place: "Altenrhein", lat: 47.4850, lon: 9.5608 },
    { icao: "EDNY", name: "Friedrichshafen", lat: 47.6713, lon: 9.5115 },
    { icao: "LIRJ", name: "Elba Marina di Campo", place: "Elba", lat: 42.7603, lon: 10.2394 },
    { icao: "LFMD", name: "Cannes-Mandelieu", place: "Cannes", lat: 43.5420, lon: 6.9535 },
  ],

  /* ---------- Geflogene Routen ----------
     Hier stehen NUR echt geflogene Strecken. Jede Route muss bei einer Homebase starten oder enden.
       minutes: Flugzeit in der Luft (min)
       fuelL:   verbrauchter Treibstoff (L Bleifrei 95)
       date:    Datum des Fluges
       km:      optional – tatsächlich geflogene Distanz laut Track
       via:     optional – Wegpunkte [Name, lat, lon]; die Linie auf der Karte folgt ihnen und
                die Distanz wird entlang der Wegpunkte berechnet (sonst Luftlinie + 5 %)
     Das Auto wird über die reale Strassenroute berechnet (OpenStreetMap).

     Vorlage zum Kopieren:
       { from: "LSZE", to: "LSZL", title: "Homebase zu Homebase", note: "…",
         flight: { minutes: 0, fuelL: 0, date: "2026-01-01" } },

     Ideen für weitere Flüge: LSZE→LSZL, LSZE→LSZS Samedan, LSZE→LSZG Grenchen, LSZE→LSGG Genf,
     LSZE→EDNY Friedrichshafen, LSZL→LSGS Sion, LSZL→LSZB Bern, LSZL→LSZF Birrfeld, LSZL→LIRJ Elba */
  routes: [
    { from: "LSZE", to: "LSZL", title: "Homebase zu Homebase", note: "Durchs Rheintal und über den San Bernardino.",
      via: [["Landquart", 46.967, 9.555], ["Chur", 46.850, 9.532], ["Thusis", 46.697, 9.440],
            ["San Bernardino", 46.461, 9.192], ["Arbedo", 46.212, 9.040]],
      flight: { minutes: 40, fuelL: 9.5, date: "2026-10-31" } },
    { from: "LSZE", to: "LSGL", title: "Quer durchs Mittelland", note: "Über Walensee, Zürichsee und Thun an den Genfersee.",
      via: [["Walenstadt", 47.124, 9.312], ["Weesen", 47.135, 9.097], ["Reichenburg", 47.171, 8.977],
            ["Horgen", 47.260, 8.598], ["Sursee", 47.171, 8.111], ["Thun", 46.758, 7.628]],
      flight: { minutes: 75, fuelL: 16.2, date: "2026-03-07" } },
    { from: "LFMD", to: "LSZL", title: "Von der Côte d'Azur heim", note: "Über die Seealpen statt der Küste entlang.",
      // KENIM, BARSO, VEVAR, NITAM: IFR-Wegpunkte (ZENHO fehlt noch – Koordinaten unbekannt)
      via: [["KENIM", 43.7714, 6.8031], ["BARSO", 44.1436, 6.8903], ["VEVAR", 44.8000, 7.0125],
            ["NITAM", 45.1061, 7.1578], ["Laveno", 45.909, 8.616], ["Cannobio", 46.061, 8.698],
            ["Brissago", 46.120, 8.711]],
      flight: { minutes: 105, fuelL: 26.5, date: "2026-10-17" } },
  ],
};
