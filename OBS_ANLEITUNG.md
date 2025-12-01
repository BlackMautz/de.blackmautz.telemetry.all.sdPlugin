# 🎥 OBS Setup - TheBus Overlay (ENDLICH EINFACH!)

## ⚡ 3 Schritte - Layout bleibt in der URL!

### 1️⃣ Stream Deck Button drücken
- Overlay öffnet sich im Edit-Mode
- Verschiebe Felder wie du willst
- Layout wird **automatisch in der URL** gespeichert!

### 2️⃣ URL kopieren
- Klicke **"📋 URL Kopieren"** in der Info-Box
- Die URL enthält **dein komplettes Layout**!

### 3️⃣ In OBS einfügen - FERTIG!
- OBS → Browser Source → URL einfügen
- Breite: 1920 | Höhe: 1080
- **Layout ist perfekt** - keine Sync-Probleme mehr!

---

## 🎯 Wie es funktioniert:

```
Layout → gespeichert in URL-Hash (#layout=...)
         ↓
Kopiere URL → Paste in OBS
         ↓
OBS liest Layout aus URL → Identisches Layout!
```

**Keine localStorage, keine Cookies, keine Server!**  
Das Layout steckt **direkt in der URL**! 🚀

---

## 📝 Beispiel URL:

```
file:///.../overlay_fully_custom.html?obs=true#layout=eyJpdGVtX3NwZWVkIjp7ImxlZnQiOiI...
                                                        ↑
                                                   Dein Layout!
```

---

## ✏️ Layout ändern:

1. **Edit-Mode öffnen** (ohne ?obs=true)
2. **Felder verschieben** → URL ändert sich automatisch
3. **"URL Kopieren"** klicken
4. **In OBS aktualisieren** → Neue URL einfügen

**So einfach!**

---

## 💡 Vorteile:

✅ **Kein Sync-Problem** - Layout ist in der URL  
✅ **Funktioniert immer** - egal welcher Browser  
✅ **Teilbar** - URL an Freunde schicken!  
✅ **Kein Setup** - keine Server, nichts installieren  

---

## ❓ Troubleshooting:

### Layout sieht anders aus
→ Hast du die **komplette URL** kopiert (inkl. `#layout=...`)?

### URL zu lang?
→ Normal! Browser können sehr lange URLs - kein Problem!

### Layout zurücksetzen?
→ Entferne einfach den `#layout=...` Teil aus der URL!





