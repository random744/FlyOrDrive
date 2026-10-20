# FlyOrDrive

Website zur Vertiefungsarbeit **«Wie effizient ist das Kleinflugzeug im Betrieb im Vergleich zum Auto?»**
von Tiziano Berger (INAP23A). Verglichen werden die Cherry BX-2 (Rotax 912 iS) und ein Smart fortwo.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite: Projekt, Fahrzeuge, Methodik, Erklärvideo, Interview |
| `karte.html` | Interaktive Karte mit Routenvergleich |
| `assets/js/config.js` | **Alle Daten**: Fahrzeugwerte, Links, Flugplätze, Routen |
| `assets/js/main.js` | Logik der Startseite |
| `assets/js/map.js` | Karte und Berechnung |
| `assets/css/style.css` | Design |
| `assets/img/` | Fotos (`cherry-bx2.jpg`, `smart-fortwo.jpg`) |

Reines HTML/CSS/JavaScript – kein Build-Schritt nötig.

## Inhalte anpassen

Alles wird in `assets/js/config.js` gepflegt:

- **Homebases**: Bad Ragaz (LSZE) und Locarno (LSZL), markiert mit `home: true` unter `airfields`.
  Jede Route muss bei einer Homebase starten oder enden.
- **Routen**: unter `routes` eintragen, z.B. `{ from: "LSZE", to: "LSZS", title: "…", note: "…" }`.
  Fehlt ein Flugplatz, zuerst unter `airfields` mit ICAO-Code und Koordinaten ergänzen.
- **Flugdaten**: jede Route braucht `flight: { minutes: 52, fuelL: 12.5, date: "2026-10-18" }` (Flugzeit in der Luft, verbrauchte Liter, Datum).
  Optional `km` für die geflogene Distanz. Routen ohne Flugdaten werden nicht angezeigt – es erscheinen nur echt geflogene Strecken.
  Das Auto wird immer über die reale Strassenroute berechnet.
- **Treibstoffpreis**: `constants.petrolPriceChf` – Bleifrei 95, gilt für Flugzeug und Auto.
- **Video**: `media.videoUrl` – YouTube-Link oder Pfad zu einer `.mp4`-Datei.
- **Interview**: `media.interviewUrl` – Link oder Pfad (z.B. `assets/media/interview.pdf`).
- **Fotos**: als `assets/img/cherry-bx2.jpg` und `assets/img/smart-fortwo.jpg` ablegen. Ohne Foto wird ein Icon angezeigt.

Eine Route lässt sich direkt verlinken: `karte.html#LSZF-LSZS`.

## Lokal ansehen

```bash
python -m http.server 8000
# danach http://localhost:8000 öffnen
```

## Veröffentlichen mit GitHub Pages

1. Repository auf GitHub pushen.
2. *Settings → Pages → Build and deployment*: Source «Deploy from a branch», Branch `main`, Ordner `/ (root)`.
3. Nach ca. einer Minute ist die Seite unter `https://<benutzername>.github.io/FlyOrDrive/` erreichbar.

## Datenquellen

- Karte: © OpenStreetMap-Mitwirkende
- Strassenrouten: [OSRM](https://project-osrm.org) (öffentlicher Demo-Server; bei Ausfall wird die Strecke geschätzt)
- Heizwert Benzin ≈ 8.9 kWh/L, CO₂ 2.37 kg/L, Schweizer Strommix ≈ 128 g CO₂/kWh
