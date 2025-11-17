# Multi-Level Dungeon API Reference

Quick reference for working with the new multi-level state structure.

## Core Concepts

- **levels**: Array of level objects, each containing its own rooms, symbols, traps, etc.
- **currentLevel**: Index of the active level (0-based)
- Each level has its own state (rooms, symbols, effects, etc.)
- Global state (zoom, UI, selections) is shared across all levels

## Quick Start

### Access Current Level Data
```javascript
import { getCurrentLevelData } from './state.js';

const level = getCurrentLevelData();
console.log(level.rooms);       // Current level's rooms
console.log(level.name);        // "Level 1"
console.log(level.depth);       // 0 (ground level)
```

### Use Backward-Compatible Getters
```javascript
import { getRooms, getSymbols, getTraps } from './state.js';

const rooms = getRooms();       // Same as getCurrentLevelData().rooms
const symbols = getSymbols();   // Same as getCurrentLevelData().symbols
const traps = getTraps();       // Same as getCurrentLevelData().traps
```

### Switch Between Levels
```javascript
import { setCurrentLevel, getCurrentLevel } from './state.js';

setCurrentLevel(0);  // Switch to Level 1
setCurrentLevel(1);  // Switch to Level 2
const current = getCurrentLevel();  // Returns current index
```

### Add New Levels
```javascript
import { addLevel } from './state.js';

// Add basement level
const basement = addLevel('Basement 1', -1);

// Add tower level
const tower = addLevel('Tower 2nd Floor', 1);

// Add generic level
const level3 = addLevel('Level 3');
```

### Remove Levels
```javascript
import { removeLevel } from './state.js';

removeLevel(2);  // Remove level at index 2
// Note: Cannot remove if only 1 level remains
// Note: Automatically adjusts currentLevel if needed
```

## Level Structure

```javascript
{
  id: 0,                    // Unique level ID
  name: 'Level 1',          // Display name
  depth: 0,                 // Floor depth (0=ground, -1=basement, +1=upper)

  // Per-level state
  rooms: [],                // Room objects
  symbols: [],              // Door/trap/treasure markers
  annotations: [],          // Text annotations
  traps: [],                // Trap data
  encounters: [],           // Monster encounters
  dmNotes: [],              // DM-only notes
  coffeeStains: [],         // Coffee stain positions

  // Per-level settings
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
    date: '11/17/2025',
    level: 'Level 1'
  },

  // NEW: Phase 6 terrain system
  terrainLayers: []         // Environmental hazards
}
```

## Common Patterns

### Modify Current Level
```javascript
import { setRooms, getRooms } from './state.js';

// Get current rooms
const rooms = getRooms();

// Modify and save back
rooms.push(newRoom);
setRooms(rooms);  // Updates current level
```

### Work with All Levels
```javascript
import { levels } from './state.js';

// Iterate through all levels
levels.forEach((level, index) => {
  console.log(`${level.name}: ${level.rooms.length} rooms`);
});

// Find specific level
const basement = levels.find(l => l.depth === -1);
```

### Save/Load Complete State
```javascript
import { levels, currentLevel, setLevels, setCurrentLevel } from './state.js';

// Save
const saveData = {
  levels: JSON.parse(JSON.stringify(levels)),
  currentLevel: currentLevel
};

// Load
setLevels(saveData.levels);
setCurrentLevel(saveData.currentLevel);
```

## Migration Guide

### Old Code (Phase 1-5)
```javascript
import { rooms, symbols, effectsEnabled } from './state.js';

function doSomething() {
  rooms.forEach(room => { /* ... */ });
  const doorCount = symbols.filter(s => s.type === 'door').length;
  if (effectsEnabled.compass) { /* ... */ }
}
```

### New Code (Phase 6)
```javascript
import { getRooms, getSymbols, getEffectsEnabled } from './state.js';

function doSomething() {
  getRooms().forEach(room => { /* ... */ });
  const doorCount = getSymbols().filter(s => s.type === 'door').length;
  if (getEffectsEnabled().compass) { /* ... */ }
}
```

## Complete API Reference

### Level Management
- `getCurrentLevelData()` - Get active level object
- `getCurrentLevel()` - Get active level index
- `setCurrentLevel(index)` - Switch active level
- `addLevel(name, depth)` - Create new level
- `removeLevel(index)` - Delete level
- `setLevels(newLevels)` - Replace all levels

### Getters (Per-Level)
- `getRooms()` - Get current level's rooms
- `getSymbols()` - Get current level's symbols
- `getAnnotations()` - Get current level's annotations
- `getTraps()` - Get current level's traps
- `getEncounters()` - Get current level's encounters
- `getDmNotes()` - Get current level's DM notes
- `getCoffeeStains()` - Get current level's coffee stains
- `getEffectsEnabled()` - Get current level's effects settings
- `getTitleBlockData()` - Get current level's title block data
- `getTerrainLayers()` - Get current level's terrain layers (NEW)

### Setters (Per-Level)
- `setRooms(rooms)` - Update current level's rooms
- `setSymbols(symbols)` - Update current level's symbols
- `setAnnotations(annotations)` - Update current level's annotations
- `setTraps(traps)` - Update current level's traps
- `setEncounters(encounters)` - Update current level's encounters
- `setDmNotes(dmNotes)` - Update current level's DM notes
- `setCoffeeStains(stains)` - Update current level's coffee stains
- `setEffectsEnabled(effects)` - Update current level's effects
- `setTitleBlockData(data)` - Update current level's title block
- `setTerrainLayers(layers)` - Update current level's terrain (NEW)

### Global State (Unchanged)
- `selectedRoomId`, `setSelectedRoomId(id)`
- `zoomLevel`, `setZoomLevel(level)`
- `renderStyle`, `setRenderStyle(style)`
- `placingMarker`, `setPlacingMarker(value)`
- `selectedSymbol`, `setSelectedSymbol(symbol)`
- `rulerMode`, `setRulerMode(value)`
- ... and all other global UI state

## Example: Multi-Level Dungeon

```javascript
import { addLevel, setCurrentLevel, getRooms, setRooms } from './state.js';

// Create a 3-level tower
addLevel('Ground Floor', 0);
addLevel('Second Floor', 1);
addLevel('Third Floor', 2);

// Add rooms to each level
for (let i = 0; i < 3; i++) {
  setCurrentLevel(i);
  const rooms = [
    { id: 1, x: 10, y: 10, w: 8, h: 8, type: 'normal', description: `Floor ${i+1} main hall` }
  ];
  setRooms(rooms);
}

// Navigate back to ground floor
setCurrentLevel(0);
```

## Phase 6 Preview: Terrain Layers

```javascript
import { getTerrainLayers, setTerrainLayers } from './state.js';

// Add environmental hazards to current level
const terrain = [
  { x: 5, y: 5, type: 'water', depth: 'shallow' },
  { x: 10, y: 10, type: 'lava', damage: '2d6' },
  { x: 15, y: 15, type: 'ice', slippery: true }
];

setTerrainLayers(terrain);
```
