const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    toggleClickThrough: (enabled) => {
        ipcRenderer.send('toggle-click-through', enabled);
    },
    isElectron: true,
    closeApp: () => {
        ipcRenderer.send('close-app');
    }
});
