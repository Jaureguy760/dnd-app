const { contextBridge, ipcRenderer } = require('electron');

// Expose safe IPC methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // DM functions
  updateDungeon: (data) => ipcRenderer.send('dm-update-dungeon', data),
  revealRoom: (roomId) => ipcRenderer.send('dm-reveal-room', roomId),
  hideRoom: (roomId) => ipcRenderer.send('dm-hide-room', roomId),
  revealAll: () => ipcRenderer.send('dm-reveal-all'),
  hideAll: () => ipcRenderer.send('dm-hide-all'),
  openPlayerWindow: () => ipcRenderer.send('open-player-window'),

  // Fog of war - reveal areas by coordinates
  revealArea: (x, y, radius) => ipcRenderer.send('dm-reveal-area', { x, y, radius }),

  // Player receives updates
  onMapUpdate: (callback) => ipcRenderer.on('update-map', (event, data) => callback(data)),
  onFogUpdate: (callback) => ipcRenderer.on('update-fog', (event, data) => callback(data))
});
