# TheBus Overlay - Desktop Telemetrie Anzeige

Desktop Overlay für The Bus Simulator - zeigt Telemetriedaten transparent über dem Spiel an, genau wie bei Assetto Corsa Competizione.

## ✨ Features

- 🎮 **Click-Through Modus** - Durchklicken in leeren Bereichen, Interaktion mit Widgets
- 🖱️ **Drag & Drop** - Alle Widgets frei verschiebbar mit der Maus
- 📏 **Resize** - Größe ändern durch Ziehen an der Ecke (wie bei normalen Fenstern)
- 💾 **Layout Speicherung** - Position und Größe werden automatisch gespeichert
- 🎨 **OBS-Kompatibel** - Identisches Design wie das OBS Overlay
- 🚪 **Türanzeige** - Live-Anzeige aller Bustüren mit Öffnungsgrad
- 📊 **Alle Telemetrie-Daten** - Speed, RPM, Gang, Fuel, Passagiere, etc.
- ⚙️ **Einstellungen** - Rechtsklick auf Widget öffnet Einstellungen
- 🚪 **Sauberes Beenden** - Close-Button im Kontextmenü

## 🚀 Installation

### Als .exe starten
1. Doppelklick auf `TheBus Overlay.exe`
2. Fertig! 🎉

### Mit npm starten (für Entwickler)
```bash
npm install
npm start
```

## 🎮 Bedienung

### Widgets verschieben
- **Linksklick halten** auf einem Widget und ziehen

### Größe ändern
- **An der rechten unteren Ecke** eines Widgets ziehen (Resize-Handle erscheint)

### Einstellungen öffnen
- **Rechtsklick** auf ein beliebiges Widget

### App beenden
1. **Rechtsklick** auf ein Widget → Einstellungen öffnen
2. **"🚪 App beenden"** Button unten rechts klicken

### Click-Through
- Maus über **Widget** → Klicks gehen zum Widget
- Maus über **leere Fläche** → Klicks gehen durch zum Spiel

## ⚙️ Einstellungen

- **Türanzahl** - 2, 3 oder 4 Türen je nach Bus
- **Sichtbare Daten** - Aktiviere/Deaktiviere einzelne Telemetrie-Felder
- Alle Einstellungen werden automatisch gespeichert

## 📋 Verfügbare Telemetrie-Daten

### 🚪 Türen & Fahrzeug
Türen (Live-Öffnungsgrad) • Geschwindigkeit • Gang • Kraftstoff • Passagiere • Fahrzeugmodell • Tempolimit • Gewicht • Sitzplätze • Verschmutzung

### 🔧 Motor & Steuerung
RPM • Temperatur • Bremse • Gas • Lenkung • Passagier-Auslastung • Motor Status • Max RPM • Motorlast

### 🚦 Info & Wischer
Haltestelle • Blinker • Scheibenwischer • Fahrer Display • ATRON

### 💡 Beleuchtung
Abblendlicht • Fernlicht • Innenraumbeleuchtung • Warnblinker

### 🟢 Status & Warnungen
Zündung • Retarder • Feststellbremse • Tempomat • Fuel Warning • Zielanzeige

## 🔧 Technische Details

- **Framework:** Electron 28.0.0
- **Port:** 37337 (TheBus Telemetry API)
- **Transparenz:** Ja, frameless window
- **Always on Top:** Ja
- **Background Rendering:** Aktiv (läuft auch ohne Fokus weiter)

## 📝 Changelog

### Version 1.0.0
- ✅ Desktop Overlay mit Click-Through
- ✅ Drag & Drop für alle Widgets
- ✅ Resize an der Ecke (natives Browser-Verhalten)
- ✅ Keine gestrichelten Borders
- ✅ Close-Button im Kontextmenü
- ✅ Background Rendering (kein schwarzer Bildschirm)
- ✅ Alle Control-Buttons in Desktop Mode versteckt
- ✅ Layout-Speicherung

## 👨‍💻 Entwickler

**BlackMautz**

## 📄 Lizenz

MIT License
