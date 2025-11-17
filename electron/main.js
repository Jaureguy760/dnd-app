const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let dmWindow = null;
let playerWindow = null;

// Shared state between windows
let sharedState = {
  rooms: [],
  revealedRooms: [], // IDs of rooms visible to players
  renderStyle: 'dyson'
};

function createDMWindow() {
  dmWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Dungeon Master View',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  dmWindow.loadFile('dm-view.html');

  dmWindow.on('closed', () => {
    dmWindow = null;
    // Close player window when DM closes
    if (playerWindow) playerWindow.close();
  });
}

function createPlayerWindow() {
  playerWindow = new BrowserWindow({
    width: 900,
    height: 700,
    title: 'Player View - Map Only',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  playerWindow.loadFile('player-view.html');

  playerWindow.on('closed', () => {
    playerWindow = null;
  });
}

app.whenReady().then(() => {
  createDMWindow();

  // Create player window after DM window is ready
  setTimeout(() => {
    createPlayerWindow();
  }, 500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createDMWindow();
  }
});

// IPC Handlers - Communication between windows

// DM updates dungeon data
ipcMain.on('dm-update-dungeon', (event, data) => {
  sharedState.rooms = data.rooms;
  sharedState.renderStyle = data.renderStyle;

  // Send to player window
  if (playerWindow) {
    playerWindow.webContents.send('update-map', {
      rooms: sharedState.rooms.filter(r => sharedState.revealedRooms.includes(r.id)),
      renderStyle: sharedState.renderStyle
    });
  }
});

// DM reveals a room to players
ipcMain.on('dm-reveal-room', (event, roomId) => {
  if (!sharedState.revealedRooms.includes(roomId)) {
    sharedState.revealedRooms.push(roomId);
  }

  // Send updated visible rooms to player
  if (playerWindow) {
    playerWindow.webContents.send('update-map', {
      rooms: sharedState.rooms.filter(r => sharedState.revealedRooms.includes(r.id)),
      renderStyle: sharedState.renderStyle
    });
  }
});

// DM hides a room from players
ipcMain.on('dm-hide-room', (event, roomId) => {
  sharedState.revealedRooms = sharedState.revealedRooms.filter(id => id !== roomId);

  if (playerWindow) {
    playerWindow.webContents.send('update-map', {
      rooms: sharedState.rooms.filter(r => sharedState.revealedRooms.includes(r.id)),
      renderStyle: sharedState.renderStyle
    });
  }
});

// DM reveals all rooms
ipcMain.on('dm-reveal-all', (event) => {
  sharedState.revealedRooms = sharedState.rooms.map(r => r.id);

  if (playerWindow) {
    playerWindow.webContents.send('update-map', {
      rooms: sharedState.rooms,
      renderStyle: sharedState.renderStyle
    });
  }
});

// DM hides all rooms
ipcMain.on('dm-hide-all', (event) => {
  sharedState.revealedRooms = [];

  if (playerWindow) {
    playerWindow.webContents.send('update-map', {
      rooms: [],
      renderStyle: sharedState.renderStyle
    });
  }
});

// Open player window if closed
ipcMain.on('open-player-window', () => {
  if (!playerWindow) {
    createPlayerWindow();
  } else {
    playerWindow.focus();
  }
});
