# State Refactoring Report: Multi-Level Dungeon Support

## Status: COMPLETE ✓

The state.js file has been successfully refactored to support multi-level dungeons. This is the foundational change for Phase 6.

---

## New State Structure

### Multi-Level Architecture (Lines 38-68)
```javascript
export let levels = [{
  id: 0,
  name: 'Level 1',
  depth: 0,
  rooms: [],
  symbols: [],
  annotations: [],
  traps: [],
  encounters: [],
  dmNotes: [],
  coffeeStains: [],
  effectsEnabled: {...},
  titleBlockData: {...},
  terrainLayers: []  // NEW for Phase 6
}];
export let currentLevel = 0;
```

### Global UI State (Lines 70-99)
Reorganized to clearly distinguish between:
- Per-level state (now in levels array)
- Global UI state (shared across all levels)

---

## New Functions Added

### Core Multi-Level Functions
| Function | Line | Purpose |
|----------|------|---------|
| `getCurrentLevelData()` | 103 | Returns the active level's data object |
| `getCurrentLevel()` | 108 | Returns the current level index |
| `setCurrentLevel(index)` | 113 | Switch to a different level |
| `addLevel(name, depth)` | 122 | Create a new dungeon level |
| `removeLevel(index)` | 154 | Delete a level (minimum 1 level required) |
| `setLevels(newLevels)` | 171 | Replace all levels (for import/load) |

### Backward Compatibility Getters (Lines 177-215)
All per-level state now has getter functions:
| Getter Function | Returns | Line |
|----------------|---------|------|
| `getRooms()` | Current level's rooms | 177 |
| `getSymbols()` | Current level's symbols | 181 |
| `getAnnotations()` | Current level's annotations | 185 |
| `getTraps()` | Current level's traps | 189 |
| `getEncounters()` | Current level's encounters | 193 |
| `getDmNotes()` | Current level's DM notes | 197 |
| `getCoffeeStains()` | Current level's coffee stains | 201 |
| `getEffectsEnabled()` | Current level's effects settings | 205 |
| `getTitleBlockData()` | Current level's title block | 209 |
| `getTerrainLayers()` | Current level's terrain layers (NEW) | 213 |

---

## Old Exports Preserved

### Unchanged Exports
- ✓ All DOM element exports (canvas, ctx, buttons, etc.)
- ✓ All constants (GRID_SIZE, GRID_COLS, GRID_ROWS, MAX_UNDO)
- ✓ All global UI state (selectedRoomId, zoomLevel, renderStyle, etc.)
- ✓ All templates (TEMPLATES object)

### Updated Setters (Lines 217-276)
All setter functions updated to work with current level:
- `setRooms()` - Now modifies current level's rooms
- `setSymbols()` - Now modifies current level's symbols
- `setAnnotations()` - Now modifies current level's annotations
- `setTraps()` - Now modifies current level's traps
- `setEncounters()` - Now modifies current level's encounters
- `setDmNotes()` - Now modifies current level's DM notes
- `setCoffeeStains()` - Now modifies current level's coffee stains
- `setEffectsEnabled()` - Now modifies current level's effects
- `setTitleBlockData()` - Now modifies current level's title block
- `setTerrainLayers()` - NEW setter for terrain layers

Global setters remain unchanged (zoom, render style, UI state, etc.)

---

## BREAKING CHANGES ⚠️

### Direct Variable Imports No Longer Available
The following variables are no longer exported directly because they're now per-level:
- `rooms` → Use `getRooms()`
- `symbols` → Use `getSymbols()`
- `annotations` → Use `getAnnotations()`
- `traps` → Use `getTraps()`
- `encounters` → Use `getEncounters()`
- `dmNotes` → Use `getDmNotes()`
- `coffeeStains` → Use `getCoffeeStains()`
- `effectsEnabled` → Use `getEffectsEnabled()`
- `titleBlockData` → Use `getTitleBlockData()`

### Files That Need Updates

**js/main.js** (Lines 2-5, 17, 29)
```javascript
// BEFORE:
import { rooms, symbols, effectsEnabled, coffeeStains, titleBlockData, ... } from './state.js';
const state = { rooms: JSON.parse(JSON.stringify(rooms)), ... };

// AFTER:
import { getRooms, getSymbols, getEffectsEnabled, getCoffeeStains, getTitleBlockData, ... } from './state.js';
const state = { rooms: JSON.parse(JSON.stringify(getRooms())), ... };
```

**js/ui.js** (Lines 4-6, 11, 16)
```javascript
// BEFORE:
import { rooms, symbols, effectsEnabled, coffeeStains, titleBlockData, annotations, traps, encounters, dmNotes, ... } from './state.js';

// AFTER:
import { getRooms, getSymbols, getEffectsEnabled, getCoffeeStains, getTitleBlockData, getAnnotations, getTraps, getEncounters, getDmNotes, ... } from './state.js';
```

**js/renderer.js** (Line 1)
```javascript
// BEFORE:
import { rooms, annotations, traps, encounters, dmNotes, ... } from './state.js';

// AFTER:
import { getRooms, getAnnotations, getTraps, getEncounters, getDmNotes, ... } from './state.js';
```

**js/exporter.js** (Line 1)
```javascript
// BEFORE:
import { rooms, titleBlockData, traps, encounters, dmNotes, ... } from './state.js';

// AFTER:
import { getRooms, getTitleBlockData, getTraps, getEncounters, getDmNotes, ... } from './state.js';
```

**js/generator.js** (Line 1)
```javascript
// BEFORE:
import { rooms, ... } from './state.js';

// AFTER:
import { getRooms, ... } from './state.js';
```

**js/symbols.js** (Line 1)
```javascript
// BEFORE:
import { rooms, symbols, ... } from './state.js';

// AFTER:
import { getRooms, getSymbols, ... } from './state.js';
```

**js/effects.js** (Line 1)
```javascript
// BEFORE:
import { effectsEnabled, coffeeStains, titleBlockData, ... } from './state.js';

// AFTER:
import { getEffectsEnabled, getCoffeeStains, getTitleBlockData, ... } from './state.js';
```

---

## Migration Path

### For Existing Dungeons
The default initialization (line 40-67) creates one level with all state arrays empty. When loading saved dungeons:

1. **If saved data has old format** (flat structure):
   - Migrate all data to `levels[0]`
   - Set `currentLevel = 0`

2. **If saved data has new format** (levels array):
   - Load directly into `levels`
   - Restore `currentLevel`

### For New Features
Phase 6 features can now:
- Access current level: `getCurrentLevelData()`
- Switch levels: `setCurrentLevel(index)`
- Add levels: `addLevel('Basement 1', -1)`
- Remove levels: `removeLevel(index)`
- Work with terrain: `getTerrainLayers()`, `setTerrainLayers()`

---

## Key Line Numbers

| Section | Lines | Description |
|---------|-------|-------------|
| Multi-level state | 38-68 | Core levels array and currentLevel |
| Global UI state | 70-99 | Shared state across all levels |
| Helper functions | 101-173 | Multi-level management + getters |
| State setters | 217-276 | Updated per-level setters |
| Templates | 278-339 | Unchanged dungeon templates |

---

## Next Steps

1. **Update all importing files** to use getter functions
2. **Update save/load logic** in exporter.js to handle levels array
3. **Update undo/redo** to work with multi-level state
4. **Create level switcher UI** for Phase 6
5. **Test backward compatibility** with existing saved dungeons

---

## Testing Checklist

- [ ] Verify all files compile without import errors
- [ ] Test getRooms() returns current level's rooms
- [ ] Test setRooms() modifies current level's rooms
- [ ] Test addLevel() creates new level correctly
- [ ] Test removeLevel() prevents deleting last level
- [ ] Test setCurrentLevel() switches active level
- [ ] Test save/load preserves multi-level structure
- [ ] Test undo/redo works with new structure
- [ ] Test all Phase 5 features still work
- [ ] Test backward compatibility with old saves

---

**Date:** 2025-11-17
**Status:** Refactoring Complete - Integration Required
**Impact:** Medium-High (Breaking changes require updates to 7 files)
