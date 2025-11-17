// --- GLOBAL STATE ---
// DOM Elements
export const canvas = document.getElementById('mapCanvas');
export const ctx = canvas.getContext('2d');
export const canvasContainer = document.getElementById('canvasContainer');

export const roomListEl = document.getElementById('roomList');
export const newDungeonBtn = document.getElementById('newDungeonBtn');
export const mapFileInput = document.getElementById('mapFileInput');
export const jsonFileInput = document.getElementById('jsonFileInput');
export const placeMarkerBtn = document.getElementById('placeMarkerBtn');
export const exportPngBtn = document.getElementById('exportPngBtn');
export const exportJsonBtn = document.getElementById('exportJsonBtn');
export const sizeSelect = document.getElementById('sizeSelect');
export const densityRange = document.getElementById('densityRange');
export const densityValue = document.getElementById('densityValue');
export const themeSelect = document.getElementById('themeSelect');
export const algorithmSelect = document.getElementById('algorithmSelect');
export const templateSelect = document.getElementById('templateSelect');
export const loadTemplateBtn = document.getElementById('loadTemplateBtn');
export const clearStorageBtn = document.getElementById('clearStorageBtn');
export const statusText = document.getElementById('statusText');
export const zoomInBtn = document.getElementById('zoomInBtn');
export const zoomOutBtn = document.getElementById('zoomOutBtn');
export const zoomResetBtn = document.getElementById('zoomResetBtn');
export const zoomLabel = document.getElementById('zoomLabel');
export const undoBtn = document.getElementById('undoBtn');
export const redoBtn = document.getElementById('redoBtn');
export const renumberBtn = document.getElementById('renumberBtn');
export const renderStyleSelect = document.getElementById('renderStyleSelect');
export const stylePreview = document.getElementById('stylePreview');

// Constants
export const GRID_SIZE = 20;
export const GRID_COLS = canvas.width / GRID_SIZE;
export const GRID_ROWS = canvas.height / GRID_SIZE;

// --- PHASE 6: MULTI-LEVEL DUNGEON STATE ---
// Core multi-level structure
export let levels = [
  {
    id: 0,
    name: 'Level 1',
    depth: 0, // 0=ground, -1=basement 1, +1=tower 1
    rooms: [],
    symbols: [],
    annotations: [],
    traps: [],
    encounters: [],
    dmNotes: [],
    coffeeStains: [],
    effectsEnabled: {
      parchmentTexture: false,
      coffeeStains: false,
      ageSpots: false,
      titleBlock: true,
      compass: true
    },
    titleBlockData: {
      dungeonName: 'The Lost Crypt',
      dmName: 'DM',
      date: new Date().toLocaleDateString(),
      level: 'Level 1'
    },
    terrainLayers: [] // NEW: Environmental hazards for Phase 6
  }
];
export let currentLevel = 0; // Active level index

// Global UI State (shared across all levels)
export let selectedRoomId = null;
export let placingMarker = false;
export let backgroundImg = null;
export let zoomLevel = 1.0;
export let draggingRoom = null;
export let dragOffset = { x: 0, y: 0 };
export let renderStyle = 'dyson'; // 'modern', 'dyson', 'vintage'

// Symbol placement UI state (global)
export let selectedSymbol = null;
export let placingSymbolType = null;

// Parchment texture cache (global, shared across levels)
export let parchmentTextureCache = null;

// Undo/Redo system (global for now, may be per-level in future)
export let undoStack = [];
export let redoStack = [];
export const MAX_UNDO = 50;

// Mouse interaction state (global)
export let mouseDownPos = null;
export let hasDragged = false;

// Ruler and DM UI state (global)
export let rulerMode = false;          // Measurement tool active
export let rulerStart = null;          // {x, y} grid coords
export let rulerEnd = null;            // {x, y} grid coords
export let showDmNotes = true;         // Toggle DM notes visibility

// --- MULTI-LEVEL HELPER FUNCTIONS ---
// Get the currently active level's data
export function getCurrentLevelData() {
  return levels[currentLevel];
}

// Get the current level index
export function getCurrentLevel() {
  return currentLevel;
}

// Set the active level
export function setCurrentLevel(index) {
  if (index >= 0 && index < levels.length) {
    currentLevel = index;
    return true;
  }
  return false;
}

// Add a new level to the dungeon
export function addLevel(name, depth) {
  const newLevel = {
    id: levels.length,
    name: name || `Level ${levels.length + 1}`,
    depth: depth !== undefined ? depth : levels.length,
    rooms: [],
    symbols: [],
    annotations: [],
    traps: [],
    encounters: [],
    dmNotes: [],
    coffeeStains: [],
    effectsEnabled: {
      parchmentTexture: false,
      coffeeStains: false,
      ageSpots: false,
      titleBlock: false,
      compass: false
    },
    titleBlockData: {
      dungeonName: 'Untitled Dungeon',
      dmName: '',
      date: new Date().toLocaleDateString(),
      level: name || `Level ${levels.length + 1}`
    },
    terrainLayers: []
  };
  levels.push(newLevel);
  return newLevel;
}

// Remove a level from the dungeon
export function removeLevel(index) {
  if (levels.length > 1 && index >= 0 && index < levels.length) {
    levels.splice(index, 1);
    // Update IDs
    levels.forEach((level, idx) => {
      level.id = idx;
    });
    // Adjust currentLevel if needed
    if (currentLevel >= levels.length) {
      currentLevel = levels.length - 1;
    }
    return true;
  }
  return false;
}

// Set all levels (for import/load operations)
export function setLevels(newLevels) {
  levels = newLevels;
}

// --- BACKWARD COMPATIBILITY GETTERS ---
// These functions allow existing code to work without modification
export function getRooms() {
  return getCurrentLevelData().rooms;
}

export function getSymbols() {
  return getCurrentLevelData().symbols;
}

export function getAnnotations() {
  return getCurrentLevelData().annotations;
}

export function getTraps() {
  return getCurrentLevelData().traps;
}

export function getEncounters() {
  return getCurrentLevelData().encounters;
}

export function getDmNotes() {
  return getCurrentLevelData().dmNotes;
}

export function getCoffeeStains() {
  return getCurrentLevelData().coffeeStains;
}

export function getEffectsEnabled() {
  return getCurrentLevelData().effectsEnabled;
}

export function getTitleBlockData() {
  return getCurrentLevelData().titleBlockData;
}

export function getTerrainLayers() {
  return getCurrentLevelData().terrainLayers;
}

// --- STATE SETTERS ---
// Per-level state setters (modify current level)
export function setRooms(newRooms) {
  getCurrentLevelData().rooms = newRooms;
}

export function setSymbols(newSymbols) {
  getCurrentLevelData().symbols = newSymbols;
}

export function setAnnotations(val) {
  getCurrentLevelData().annotations = val;
}

export function setTraps(val) {
  getCurrentLevelData().traps = val;
}

export function setEncounters(val) {
  getCurrentLevelData().encounters = val;
}

export function setDmNotes(val) {
  getCurrentLevelData().dmNotes = val;
}

export function setCoffeeStains(stains) {
  getCurrentLevelData().coffeeStains = stains;
}

export function setEffectsEnabled(effects) {
  getCurrentLevelData().effectsEnabled = effects;
}

export function setTitleBlockData(data) {
  getCurrentLevelData().titleBlockData = data;
}

export function setTerrainLayers(layers) {
  getCurrentLevelData().terrainLayers = layers;
}

export function addTerrainLayer(terrain) {
  getCurrentLevelData().terrainLayers.push(terrain);
}

// Global state setters (shared across all levels)
export function setSelectedRoomId(id) { selectedRoomId = id; }
export function setPlacingMarker(value) { placingMarker = value; }
export function setBackgroundImg(img) { backgroundImg = img; }
export function setZoomLevel(level) { zoomLevel = level; }
export function setDraggingRoom(room) { draggingRoom = room; }
export function setDragOffset(offset) { dragOffset = offset; }
export function setRenderStyle(style) { renderStyle = style; }
export function setSelectedSymbol(symbol) { selectedSymbol = symbol; }
export function setPlacingSymbolType(type) { placingSymbolType = type; }
export function setUndoStack(stack) { undoStack = stack; }
export function setRedoStack(stack) { redoStack = stack; }
export function setMouseDownPos(pos) { mouseDownPos = pos; }
export function setHasDragged(value) { hasDragged = value; }
export function setRulerMode(val) { rulerMode = val; }
export function setRulerStart(val) { rulerStart = val; }
export function setRulerEnd(val) { rulerEnd = val; }
export function setShowDmNotes(val) { showDmNotes = val; }

// --- TEMPLATES ---
export const TEMPLATES = {
  starter: {
    name: "Starter Cave",
    rooms: [
      {id: 1, x: 5, y: 5, w: 6, h: 5, type: "entrance", description: "Cave entrance. A narrow passage leads into darkness. You hear dripping water echoing from deep within."},
      {id: 2, x: 12, y: 4, w: 5, h: 4, type: "normal", description: "Guard post. Two goblin sentries patrol this chamber. Crude weapons lean against the walls."},
      {id: 3, x: 18, y: 6, w: 6, h: 6, type: "normal", description: "Sleeping quarters. Filthy bedrolls and scattered bones suggest this is where the goblins rest."},
      {id: 4, x: 10, y: 11, w: 7, h: 5, type: "trap", description: "Trapped corridor. A tripwire stretches across the passage (DC 12 to spot). Triggers a rockfall (2d6 damage)."},
      {id: 5, x: 20, y: 14, w: 8, h: 7, type: "treasure", description: "Treasure cache. A locked chest (DC 15) contains 200gp, a +1 dagger, and a scroll of Identify."},
      {id: 6, x: 5, y: 14, w: 4, h: 5, type: "normal", description: "Food storage. Crates of stolen provisions and a barrel of questionable ale."},
      {id: 7, x: 14, y: 18, w: 9, h: 7, type: "boss", description: "Chieftain's lair. The goblin boss sits on a makeshift throne, flanked by two wolf companions."}
    ]
  },
  tower: {
    name: "Wizard's Tower",
    rooms: [
      {id: 1, x: 17, y: 24, w: 6, h: 5, type: "entrance", description: "Ground floor entrance. Dusty floor shows recent footprints. Arcane symbols glow faintly on the walls."},
      {id: 2, x: 16, y: 18, w: 8, h: 5, type: "normal", description: "Library (Floor 2). Shelves line the walls, filled with moldy tomes. A reading desk holds an open spellbook."},
      {id: 3, x: 15, y: 12, w: 9, h: 5, type: "trap", description: "Laboratory (Floor 3). Bubbling potions and strange apparatus. A failed experiment has created a toxic gas (CON save DC 13)."},
      {id: 4, x: 14, y: 6, w: 10, h: 5, type: "treasure", description: "Vault (Floor 4). Magical wards protect a chest containing a Wand of Magic Missiles and three spell scrolls."},
      {id: 5, x: 16, y: 1, w: 7, h: 4, type: "boss", description: "Sanctum (Floor 5). The rogue wizard performs a ritual. Teleportation circle active. Final confrontation."}
    ]
  },
  crypt: {
    name: "Ancient Crypt",
    rooms: [
      {id: 1, x: 15, y: 2, w: 8, h: 5, type: "entrance", description: "Crypt entrance. Stone doors carved with warnings. A cold draft flows from within."},
      {id: 2, x: 10, y: 8, w: 6, h: 6, type: "normal", description: "Hall of ancestors. Stone sarcophagi line the walls. Undisturbed for centuries."},
      {id: 3, x: 17, y: 9, w: 6, h: 5, type: "normal", description: "Offering chamber. Ancient coins and rotted flowers surround a central altar."},
      {id: 4, x: 24, y: 8, w: 5, h: 6, type: "trap", description: "Cursed passage. Those who pass must make a WIS save (DC 14) or be frightened for 1 minute."},
      {id: 5, x: 5, y: 15, w: 7, h: 6, type: "normal", description: "Burial vault. 2d4 skeletons animate when anyone enters. Attacking from alcoves."},
      {id: 6, x: 14, y: 16, w: 8, h: 7, type: "treasure", description: "Priest's tomb. A golden chalice (500gp) and ceremonial mace rest on the sarcophagus."},
      {id: 7, x: 24, y: 15, w: 9, h: 8, type: "boss", description: "Tomb of the death knight. The ancient warrior rises from his throne. Fights to protect his eternal rest."}
    ]
  },
  mine: {
    name: "Abandoned Mine",
    rooms: [
      {id: 1, x: 3, y: 10, w: 7, h: 6, type: "entrance", description: "Mine entrance. Old cart tracks lead into the mountain. Support beams look unstable."},
      {id: 2, x: 11, y: 9, w: 6, h: 8, type: "normal", description: "First shaft. Pickaxes and tools scattered about. Signs of a hasty evacuation."},
      {id: 3, x: 18, y: 8, w: 7, h: 5, type: "trap", description: "Unstable tunnel. Weakened supports. STR check (DC 13) or trigger cave-in (3d6 damage)."},
      {id: 4, x: 18, y: 14, w: 8, h: 7, type: "normal", description: "Storage cavern. Crates of supplies and mining equipment. A few uncut gems glitter in a corner."},
      {id: 5, x: 11, y: 18, w: 6, h: 6, type: "normal", description: "Flooded section. Knee-deep water. Strange echoes suggest something lurks below."},
      {id: 6, x: 4, y: 18, w: 6, h: 7, type: "treasure", description: "Rich vein. Exposed gold and mithril ore worth 800gp if properly extracted."},
      {id: 7, x: 27, y: 16, w: 8, h: 9, type: "boss", description: "Deep cavern. The reason the miners fled: an umber hulk has made this its lair."}
    ]
  },
  castle: {
    name: "Castle Ruins",
    rooms: [
      {id: 1, x: 8, y: 22, w: 8, h: 6, type: "entrance", description: "Gatehouse. Portcullis rusted open. Defensive positions along the walls."},
      {id: 2, x: 3, y: 15, w: 6, h: 6, type: "normal", description: "Guardroom. Weapon racks empty. A card game abandoned mid-play on a table."},
      {id: 3, x: 10, y: 15, w: 7, h: 6, type: "normal", description: "Courtyard. Overgrown with vines. A dry fountain stands in the center."},
      {id: 4, x: 18, y: 16, w: 6, h: 5, type: "trap", description: "Armory. Trapped chest (DC 15). Poisoned needle (2d4 poison damage and poisoned condition)."},
      {id: 5, x: 6, y: 8, w: 8, h: 6, type: "normal", description: "Great hall. Long tables and a raised dais. Tattered banners hang from the ceiling."},
      {id: 6, x: 15, y: 9, w: 7, h: 6, type: "treasure", description: "Lord's chamber. Hidden compartment (Investigation DC 14) contains the family signet ring and 300gp."},
      {id: 7, x: 23, y: 8, w: 8, h: 7, type: "normal", description: "Chapel. Defaced religious symbols. An unholy presence lingers here."},
      {id: 8, x: 20, y: 2, w: 9, h: 5, type: "boss", description: "Throne room. The vampire lord who claimed this castle awaits in the shadows."}
    ]
  }
};
