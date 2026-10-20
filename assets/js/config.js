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
    co2PerKWhGrid: 0.128,     // kg CO₂ pro kWh, Schweizer Verbrauchermix
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
      "Angetrieben wird mein Flugzeug von einem Rotax 912 iS mit elektronischer Einspritzung – " +
      "einem der sparsamsten Flugmotoren seiner Klasse.",
  },

  /* ---------- Auto ---------- */
  car: {
    name: "Smart fortwo",
    category: "Kleinstwagen",
    seats: 2,
    variants: {
      petrol: {
        label: "Benzin (71 PS)",
        powerKW: 52,
        consumptionPer100: 5.0,   // L/100 km (Praxiswert)
        unit: "L",
        // Preis: constants.petrolPriceChf
      },
      electric: {
        label: "EQ elektrisch",
        powerKW: 60,
        consumptionPer100: 17,    // kWh/100 km inkl. Ladeverluste
        unit: "kWh",
        priceChf: 0.30,           // CHF pro kWh
      },
    },
    defaultVariant: "petrol",
    roadFactorFallback: 1.3,     // falls kein Routing möglich: Luftlinie × Faktor
    avgKmhFallback: 75,
    image: "assets/img/smart-fortwo.jpg",
    description:
      "Der Smart fortwo ist mit nur 2.70 m Länge eines der kleinsten und leichtesten Autos auf dem Markt. " +
      "Wie die Cherry bietet er genau zwei Sitzplätze – damit ist er der ideale, faire Vergleichspartner " +
      "für ein zweisitziges Kleinflugzeug.",
  },

  /* ---------- Flugplätze ----------
     home: true = Homebase. Alle Routen starten oder enden an einer Homebase. */
  airfields: [
    { icao: "LSZE", name: "Bad Ragaz", lat: 47.0150, lon: 9.4820, home: true },
    { icao: "LSZL", name: "Locarno", lat: 46.1608, lon: 8.8786, home: true },
    { icao: "LSZF", name: "Birrfeld", lat: 47.4436, lon: 8.2336 },
    { icao: "LSZG", name: "Grenchen", lat: 47.1816, lon: 7.4172 },
    { icao: "LSZB", name: "Bern-Belp", lat: 46.9141, lon: 7.4971 },
    { icao: "LSGC", name: "Les Eplatures", lat: 47.0839, lon: 6.7928 },
    { icao: "LSGG", name: "Genève", lat: 46.2381, lon: 6.1090 },
    { icao: "LSGS", name: "Sion", lat: 46.2196, lon: 7.3268 },
    { icao: "LSZA", name: "Lugano", lat: 46.0040, lon: 8.9106 },
    { icao: "LSZC", name: "Buochs", lat: 46.9744, lon: 8.3969 },
    { icao: "LSZS", name: "Samedan", lat: 46.5341, lon: 9.8841 },
    { icao: "LSZR", name: "St. Gallen-Altenrhein", lat: 47.4850, lon: 9.5608 },
    { icao: "EDNY", name: "Friedrichshafen", lat: 47.6713, lon: 9.5115 },
    { icao: "LIRJ", name: "Elba Marina di Campo", lat: 42.7603, lon: 10.2394 },
    { icao: "LFMD", name: "Cannes-Mandelieu", lat: 43.5420, lon: 6.9535 },
  ],

  /* ---------- Geflogene Routen ----------
     Hier stehen NUR echt geflogene Strecken. Jede Route muss bei einer Homebase starten oder enden.
       minutes: Flugzeit in der Luft (min)
       fuelL:   verbrauchter Treibstoff (L Bleifrei 95)
       date:    Datum des Fluges
       km:      optional – tatsächlich geflogene Distanz laut Track (sonst Luftlinie + 5 %)
     Das Auto wird über die reale Strassenroute berechnet (OpenStreetMap).

     Vorlage zum Kopieren:
       { from: "LSZE", to: "LSZL", title: "Homebase zu Homebase", note: "…",
         flight: { minutes: 0, fuelL: 0, date: "2026-01-01" } },

     Ideen für weitere Flüge: LSZE→LSZL, LSZE→LSZS Samedan, LSZE→LSZG Grenchen, LSZE→LSGG Genf,
     LSZE→EDNY Friedrichshafen, LSZL→LSGS Sion, LSZL→LSZB Bern, LSZL→LSZF Birrfeld, LSZL→LIRJ Elba */
  routes: [
    { from: "LFMD", to: "LSZL", title: "Von der Côte d'Azur heim", note: "Über die Seealpen statt der Küste entlang.",
      flight: { minutes: 108, fuelL: 27, km: 378, date: "2026-10-18" } },
  ],
};
