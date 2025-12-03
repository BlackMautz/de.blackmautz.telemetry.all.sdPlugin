const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let overlayWindow;

function createOverlayWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    overlayWindow = new BrowserWindow({
        width: width,
        height: height,
        x: 0,
        y: 0,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: false,
        resizable: true,
        movable: true,
        type: 'toolbar', // Höchste Priorität - immer sichtbar
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false, // Rendering läuft weiter auch ohne Fokus
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Click-through disabled - elements are fully interactive
    overlayWindow.setIgnoreMouseEvents(false);

    // Load OUR overlay.html that we've been working on together
    overlayWindow.loadFile(path.join(__dirname, 'renderer', 'overlay.html'));

    // DevTools ausgeschaltet - nur Overlay sichtbar
    // overlayWindow.webContents.openDevTools();

    overlayWindow.on('closed', () => {
        overlayWindow = null;
    });
}

// Toggle click-through (for future use)
ipcMain.on('toggle-click-through', (event, clickThrough) => {
    if (overlayWindow) {
        overlayWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
    }
});

// Close app
ipcMain.on('close-app', () => {
    app.quit();
});

app.whenReady().then(() => {
    createOverlayWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createOverlayWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
