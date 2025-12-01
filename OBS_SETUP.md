# 🎥 OBS Stream Overlay Setup Guide

## 🇩🇪 Deutsch

### 📍 Overlay-Datei finden

**Schnellste Methode:**
1. Drücke **Windows + R**
2. Füge ein: `%appdata%\Elgato\StreamDeck\Plugins\de.blackmautz.telemetry.all.sdPlugin`
3. Drücke **Enter**
4. Öffne `overlay_fully_custom.html` im Browser

**Alternative:**
- Navigiere zu: `C:\Users\[DeinBenutzername]\AppData\Roaming\Elgato\StreamDeck\Plugins\de.blackmautz.telemetry.all.sdPlugin`

**Tipp:** Erstelle eine Verknüpfung zu `overlay_fully_custom.html` auf deinem Desktop für schnellen Zugriff!

---

### 🎨 Overlay anpassen (Edit Mode)

1. **Overlay im Browser öffnen** (siehe oben)
2. **Felder positionieren:**
   - Klicke irgendwo auf ein Feld und ziehe es
   - Ziehe an den Kanten zum Ändern der Größe
   - Nutze die Kontroll-Buttons:
     - **📋** - Rahmen ein/aus
     - **👁️** - Feld in OBS verstecken (bleibt im Edit-Mode sichtbar)
     - **⬆️⬇️** - Z-Index ändern (welches Feld oben liegt)
3. **Hintergrund-Vorschau (optional):**
   - Klicke **🖼️** um ein 1920x1080 Vorschau-Bild anzuzeigen
   - Platziere Felder pixel-genau über dem Hintergrund
4. **Layout speichern:**
   - Klicke **"Speichern & URL anzeigen"**
   - Die OBS Info Box erscheint mit deiner gespeicherten URL

---

### 📺 In OBS einfügen

1. **In OBS:**
   - Rechtsklick auf Szene → **"Hinzufügen"** → **"Browser"**
   - Name: "TheBus Telemetry Overlay"
2. **Einstellungen:**
   - **URL kopieren** aus der OBS Info Box
   - **Breite:** 1920
   - **Höhe:** 1080
   - **FPS:** 30 (oder höher)
3. **Klicke "OK"** - Fertig! ✅

**Wichtig:** Die URL enthält dein komplettes Layout! Wenn du das Layout änderst, musst du die neue URL in OBS aktualisieren.

---

### 🔄 Layout ändern

1. Öffne `overlay_fully_custom.html` im Browser (Edit Mode)
2. Ändere Positionen/Größen wie gewünscht
3. Klicke **"Speichern & URL anzeigen"**
4. **Kopiere die neue URL**
5. In OBS: Rechtsklick auf Browser Source → **"Eigenschaften"** → **Neue URL einfügen**

---

### ⚡ Tipps & Tricks

**Auflösungs-Check:**
- Grünes Häkchen ✅ = Perfekt (1920x1080)
- Gelbes Warnsymbol ⚠️ = Andere Auflösung (könnte in OBS anders aussehen)

**Eye-Toggle (👁️):**
- Felder mit aktiviertem Eye-Toggle sind im Edit-Mode halbtransparent
- In OBS (mit `?obs=true` in URL) sind sie komplett unsichtbar
- Perfekt um temporäre Felder auszublenden!

**Z-Index:**
- Höherer Z-Index = Feld liegt oben
- Nutze ⬆️⬇️ um Überlappungen zu kontrollieren

**Border-Toggle:**
- Hilfreich im Edit-Mode zur Orientierung
- In OBS meist ohne Rahmen schöner (📋 deaktivieren)

---

### 🐛 Problemlösung

**Overlay zeigt keine Daten:**
- ✅ The Bus muss laufen
- ✅ Telemetry API muss aktiv sein (http://127.0.0.1:37337)
- ✅ Warte 1-2 Sekunden, Daten werden automatisch geladen

**Layout sieht in OBS anders aus:**
- ✅ Prüfe Browser-Auflösung im Edit-Mode (sollte 1920x1080 sein)
- ✅ Stelle sicher, dass OBS Browser Source auf 1920x1080 eingestellt ist
- ✅ Verwende die URL mit `?obs=true` Parameter

**URL zu lang für OBS:**
- ✅ Das ist normal! OBS akzeptiert auch sehr lange URLs
- ✅ Kopiere die komplette URL mit Strg+A → Strg+C aus der Info Box

---

<br><br>

## 🇬🇧 English

### 📍 Finding the Overlay File

**Fastest Method:**
1. Press **Windows + R**
2. Paste: `%appdata%\Elgato\StreamDeck\Plugins\de.blackmautz.telemetry.all.sdPlugin`
3. Press **Enter**
4. Open `overlay_fully_custom.html` in your browser

**Alternative:**
- Navigate to: `C:\Users\[YourUsername]\AppData\Roaming\Elgato\StreamDeck\Plugins\de.blackmautz.telemetry.all.sdPlugin`

**Tip:** Create a desktop shortcut to `overlay_fully_custom.html` for quick access!

---

### 🎨 Customizing the Overlay (Edit Mode)

1. **Open overlay in browser** (see above)
2. **Position fields:**
   - Click anywhere on a field and drag it
   - Drag edges to resize
   - Use control buttons:
     - **📋** - Toggle border on/off
     - **👁️** - Hide field in OBS (stays visible in Edit Mode)
     - **⬆️⬇️** - Change Z-Index (which field is on top)
3. **Background Preview (optional):**
   - Click **🖼️** to show 1920x1080 preview image
   - Position fields pixel-perfect over the background
4. **Save layout:**
   - Click **"Speichern & URL anzeigen"** (Save & Show URL)
   - The OBS Info Box appears with your saved URL

---

### 📺 Adding to OBS

1. **In OBS:**
   - Right-click on scene → **"Add"** → **"Browser"**
   - Name: "TheBus Telemetry Overlay"
2. **Settings:**
   - **Copy URL** from the OBS Info Box
   - **Width:** 1920
   - **Height:** 1080
   - **FPS:** 30 (or higher)
3. **Click "OK"** - Done! ✅

**Important:** The URL contains your complete layout! If you change the layout, you need to update the URL in OBS.

---

### 🔄 Changing the Layout

1. Open `overlay_fully_custom.html` in browser (Edit Mode)
2. Change positions/sizes as desired
3. Click **"Speichern & URL anzeigen"** (Save & Show URL)
4. **Copy the new URL**
5. In OBS: Right-click Browser Source → **"Properties"** → **Paste new URL**

---

### ⚡ Tips & Tricks

**Resolution Check:**
- Green checkmark ✅ = Perfect (1920x1080)
- Yellow warning ⚠️ = Different resolution (might look different in OBS)

**Eye Toggle (👁️):**
- Fields with eye toggle are semi-transparent in Edit Mode
- In OBS (with `?obs=true` in URL) they're completely invisible
- Perfect for hiding temporary fields!

**Z-Index:**
- Higher Z-Index = field on top
- Use ⬆️⬇️ to control overlapping

**Border Toggle:**
- Helpful in Edit Mode for orientation
- Usually looks better without borders in OBS (disable 📋)

---

### 🐛 Troubleshooting

**Overlay shows no data:**
- ✅ The Bus must be running
- ✅ Telemetry API must be active (http://127.0.0.1:37337)
- ✅ Wait 1-2 seconds, data loads automatically

**Layout looks different in OBS:**
- ✅ Check browser resolution in Edit Mode (should be 1920x1080)
- ✅ Make sure OBS Browser Source is set to 1920x1080
- ✅ Use the URL with `?obs=true` parameter

**URL too long for OBS:**
- ✅ That's normal! OBS accepts very long URLs
- ✅ Copy the complete URL with Ctrl+A → Ctrl+C from the Info Box

---

## 🎯 How It Works

```
Layout → saved in URL hash (#layout=...)
         ↓
Copy URL → Paste in OBS
         ↓
OBS reads layout from URL → Identical layout!
```

**No localStorage, no cookies, no server!**  
The layout is **directly in the URL**! 🚀

---

## 📋 Features Overview

| Feature | Description |
|---------|-------------|
| **34 Telemetry Fields** | Speed, fuel, temperature, doors, etc. |
| **2 UMG Widgets** | Real-time bus information displays |
| **Drag & Drop** | Click anywhere on field to move |
| **Manual Resize** | Drag edges to change size |
| **Border Toggle (📋)** | Show/hide borders per field |
| **Eye Toggle (👁️)** | Hide fields in OBS stream |
| **Z-Index (⬆️⬇️)** | Control field layering |
| **Background Preview** | 1920x1080 template for positioning |
| **URL Storage** | Complete layout saved in URL |
| **Resolution Check** | Validates 1920x1080 display |

---

**Happy Streaming! 🚌💨**
