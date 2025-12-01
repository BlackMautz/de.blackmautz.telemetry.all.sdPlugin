# Changelog - BlackMautz TML Telemetry (Universal Edition)

All notable changes to the Universal Edition will be documented in this file.

## [2.31.24] - 2025-12-01

### 🎨 Icon Updates

#### Changed
- 🚪 **Door Button Icon** - Updated to custom ALL icon
- 💡 **Driver Light Icon** - Updated to custom driver-light icon (both manifest and app.js)
- 🖼️ **Additional Icons** - Added 4 new icon assets

#### Technical
- ✅ Unified icon naming: `driver-light.png` and `driver-light_On.png`
- ✅ Updated all references in app.js to match new icon paths
- ✅ Total assets: 287 files (1750.47 KB)

## [2.31.19] - 2025-12-01

### 🎨 UI/UX Improvements - Complete Action Reorganization

#### Changed
- ✨ **51 Total Actions** - 11 Category Headers + 40 Functional Buttons
- 📋 **Category Headers with Visual Separators** - Format: ━━━ 📡 EMOJI CATEGORY ━━━
  - 📡 SYSTEM (1 button)
  - 🚗 MOTOR (4 buttons)
  - 🚪 TÜREN (4 buttons)
  - 🚦 LICHTER (6 buttons)
  - 🔊 BEDIENUNG (5 buttons)
  - 🛑 BREMSEN (2 buttons)
  - ❄️ KOMFORT (3 buttons)
  - ⚡ ELEKTRO (2 buttons)
  - ℹ️ DISPLAYS (6 buttons)
  - 💰 TICKETING (2 buttons)
  - 🛠️ ERWEITERT (2 buttons)
  - ⚙️ CUSTOM (3 buttons)
- 🏷️ **LED Monitor** - Marked as "(experimental/untested)" - 60+ LED monitoring options available but untested
- 📝 **Improved Tooltips** - Clearer descriptions for all buttons
- 🎯 **Logical Grouping** - All buttons organized by function for easier navigation

#### Technical
- ✅ Category header UUIDs: `de.blackmautz.telemetry.all.header.{system|motor|doors|lights|controls|brakes|comfort|electric|displays|ticketing|advanced|custom}`
- ✅ All 40 functional buttons preserved from previous versions
- ✅ Maintained backward compatibility - all UUIDs unchanged

## [2.0.4] - 2025-11-29

### 🚀 VDL Extended Features & Universal Enhancements

#### Added
- 💡 **Reading Light Clearance (VDL)** - Leselampen-Freigabe für Passagiere
  - Event: `ToggleReadingLightClearance`
  - Button: `ReadingLight` (Secondary State = ON)
- 🚦 **Retarder Toggle (Universal)** - Motorbremse/Dauerbremse für alle Busse
  - Events: `RetarderOn` / `RetarderOff`
  - Button: `Retarder` (Secondary State = ON)
- 🚗 **Traction Control/ASR Toggle (Universal)** - Antriebsschlupfregelung
  - Events: `ASRThresholdOn` / `ASRThresholdOff`
  - Button: `TractionControl` (Secondary State = ON)
- 🚦 **RBL Toggle (Universal)** - Ampel-Vorrang-System für grüne Welle
  - Event: `RBL`
  - RBL = Rechnergesteuertes Betriebsleitsystem
  - Computer-gesteuertes System für automatische Grünphasen an Ampeln
  - Häufig in Deutschland/Österreich bei ÖPNV verwendet
  - Button: `RBL` (Secondary State = ON)

#### Fixed
- 📹 **Camera Switch** - Funktioniert jetzt mit allen 4 Bussen!
  - Sendet sowohl `SwitchCamera` (Solaris/Mercedes/Scania) als auch `SwitchPreviousCamera` (VDL)
  - Jeder Bus reagiert nur auf sein eigenes Event

#### Technical
- ✅ Neue Action UUIDs: `readinglight`, `retarder`, `tractioncontrol`, `rbl`
- ✅ API-basierte Status-Synchronisation für alle Toggle-Buttons
- ✅ Universal Event Pattern: Mehrere Events gleichzeitig senden, jeder Bus reagiert auf sein Event

## [2.0.3] - 2025-11-29

### 🚌 VDL Citea LLE Support

#### Added
- ✨ **VDL Citea LLE** - Vierter Bus komplett unterstützt!
- 💡 **Interior Light Dim Toggle (VDL)** - Innenbeleuchtung 30% gedimmt
  - Event: `InteriorLightDimmed` / `InteriorLightOff`
  - 3-State Button: Primary (Off), Tertiary (Dimmed)
- 💡 **Interior Light Full Toggle (VDL)** - Innenbeleuchtung 100% hell
  - Event: `InteriorLightBright` / `InteriorLightOff`
  - 3-State Button: Primary (Off), Secondary (Bright)
- 🔄 **API-basierte Status-Synchronisation** - Icons zeigen immer echten Bus-Status
  - Neue Funktion: `UpdateInteriorLightState`
  - Polling alle 200ms über `/vehicles/current` Endpoint
  - Funktioniert auch nach StreamDeck-Neustart
- 🚪 **VDL Door Events** - Spezielle Event-Namen für VDL
  - `MiddleDoorOpenClose`, `RearDoorOpenClose`, `FourthDoorOpenClose`
  - Unterschiedliche Benennung zu Solaris/Mercedes/Scania

#### Technical
- ✅ `/vehicles/current` API-Endpoint für VDL (buttonview.html zeigt falsche Daten)
- ✅ `InteriorLightLevel` Button mit Primary/Secondary/Tertiary States
- ✅ LED-Tracking: "Interior Lights Dimmed" (0.1) und "Interior Lights Bright" (3.0)

## [2.0.2] - 2025-11-29

### 🚍 Scania Citywide Support & Door Progress

#### Added
- ✨ **Scania Citywide** - Dritter Bus komplett unterstützt!
- 📊 **Door Progress Display** - Türöffnung in Echtzeit anzeigen
  - Checkbox "Show Progress" in Door Button Settings
  - Scania: 0-100% präzise (nutzt `door.Progress` Property)
  - Solaris/Mercedes: Nur 0% oder 100% (keine Zwischenwerte)
- 💡 **Light Switch Button** - 3-Wege Lichtschalter
  - Mode 1: Nach Rechts schalten (Off → Parking → Headlights → High Beam → Fog Front → Fog Rear)
  - Mode 2: Nach Links schalten (umgekehrt)
  - Mode 3: Status anzeigen
  - Auto-Icon Update basierend auf aktuellem Status
- 💡 **Scania Lights Button** - Spezielle Scania-Lichter
  - 6 Optionen: Fog Light Front/Rear, Interior Light Front/Back Up/Down
  - Event: `FogBackLight` (für Nebellichter)
  - Toggle-Funktion für Interior Lights (Gedimmt/Hell)
- 🪟 **Window Shade Scania** - 4 neue Optionen
  - Window Shade Front Up/Down
  - Window Shade Left Up/Down
  - Events: `RightWindowShade`, `LeftWindowShade`

#### Fixed
- 🔧 **Fixing Brake** - Jetzt vollständig implementiert für alle Busse
- 🛑 **Stop Brake** - Triple-Fallback System
  - LED Stop Brake / ButtonLight BusStopBrake / LedStopBrake
  - Funktioniert jetzt zuverlässig in allen 3 Bussen

#### Technical
- ✅ API Fallback: `/vehicles/current` wenn `/vehicles/[id]` nicht verfügbar
- ✅ Progress-basierte Door Detection: `door.Progress > 0.5`
- ✅ Unified DoorLock für Scania (Tertiary/Secondary States)
- ✅ Fake Ignition: `MotorStartStop` Event für Scania
- ✅ Icons für alle 10 Window Shade Varianten

## [2.0.1] - 2025-11-29

### 🐛 Critical Bugfixes

#### Fixed
- ✅ **Door-Buttons funktionieren jetzt vollständig** in beiden Bussen (Solaris & Mercedes)
- ✅ **Door-Bilder wechseln korrekt** zwischen offen/geschlossen Status
- 🔧 Fixed: Alle 15 Event-Handler hatten falsche UUIDs (`solaris` statt `universal`)
- 🔧 Mercedes Lamp-Namen für Türen hinzugefügt (`ButtonLight Door 1/2/3/4`)
- 🔧 Beide API-Endpunkte werden jetzt unterstützt (`/sendevent` + `/sendeventpress`)

#### Tested & Verified
- ✅ Alle 4 Türen getestet: Front, Middle, Rear, Fourth Door
- ✅ Door Clearance, Auto Kneeling, Door Autoclose funktionieren
- ✅ Warnblinker, Blinker, Scheibenwischer, Feststellbremse getestet
- ✅ Kneeling/Lifting Up/Down funktioniert
- ✅ **Alle Events in BEIDEN Bussen erfolgreich getestet!**

## [2.0.0] - 2025-11-28

### 🎉 Initial Universal Release

First release combining **Solaris Urbino** and **Mercedes eCitaro** support in one plugin!

### Added
- ✨ **Universal Plugin** - Works with both bus types automatically
- 🚎 **All Solaris Features** - Complete Solaris Urbino support (18m/12m)
- 🚌 **All Mercedes Features** - Complete Mercedes eCitaro support
- ⚡ **Pantograph On/Off** - Trolleybus feature (Solaris only)
- 💡 **Interior Light Dim Toggle** - 30% dimmed lighting (Mercedes only)
- 💡 **Interior Light Full Toggle** - 100% bright lighting (Mercedes only)
- 🅿️ **Stop Brake** - Automatic station brake (Mercedes only)
- 📋 **Separate Category** - "BlackMautz TML Telemetry - ALL"

### Technical Details
- **Plugin UUID:** `de.blackmautz.telemetry.universal`
- **Action UUIDs:** `de.blackmautz.telemetry.universal.*`
- **Version:** 2.0.0.0
- **Compatible with:** The Bus (Solaris Urbino & Mercedes eCitaro)

### Known Issues
- 🐛 **Mercedes API Bug:** Event names `InteriorLightDim`/`Bright` are swapped in the game
  - ✅ Plugin automatically compensates - works correctly!

### Migration from Separate Plugins
If you're upgrading from individual Solaris or Mercedes plugins:
1. This plugin can be installed **alongside** the separate plugins
2. Different UUID prevents conflicts (`universal` vs `solaris`/`mercedes`)
3. Choose which plugin to use - or use both!

---

## Previous Versions

### Solaris Edition - v1.7.0
See: [BlackMautz_telemetry_TheBus-streamdeck-custom_Solaris](https://github.com/BlackMautz/BlackMautz_telemetry_TheBus-streamdeck-custom_Solaris)

### Mercedes Edition - v1.0.2
See: [BlackMautz_telemetry_TheBus-streamdeck-custom_Mercedes](https://github.com/BlackMautz/BlackMautz_telemetry_TheBus-streamdeck-custom_Mercedes)
