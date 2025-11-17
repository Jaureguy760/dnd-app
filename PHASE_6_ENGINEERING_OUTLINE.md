# 🏗️ Phase 6: Engineering Outline & Implementation Plan

**Based on Deep Analysis** - See `PHASE_6_ANALYSIS.md` for full reasoning

---

## 🎯 RECOMMENDED APPROACH: Multi-Level First

**Total Time:** 8-10 hours
**Total Lines:** ~1,600-1,900

---

## 📐 Architecture Overview

### Current State Structure:
```javascript
// Single dungeon
let rooms = [];
let symbols = [];
let annotations = [];
// ... etc
```

### New State Structure:
```javascript
// Multi-level dungeons
let levels = [
  {
    id: 0,
    name: 'Level 1 - Main Hall',
    depth: 0, // 0=ground, -1=basement, +1=tower
    rooms: [],
    symbols: [],
    annotations: [],
    traps: [],
    encounters: [],
    dmNotes: [],
    terrainLayers: [],
    coffeeStains: [],
    effectsEnabled: {...}
  }
];
let currentLevel = 0;
```

**Impact:** Touches every file that uses state!

---

## 🌊 WAVE 1: Multi-Level Foundation (5-6 hours)

### Task 1.1: State Refactoring (1.5 hours)

**File:** `js/state.js`

**Changes:**
```javascript
// BEFORE:
let rooms = [];
let symbols = [];
// ... etc

// AFTER:
let levels = [
  {
    id: 0,
    name: 'Level 1',
    depth: 0,
    rooms: [],
    symbols: [],
    annotations: [],
    traps: [],
    encounters: [],
    dmNotes: [],
    terrainLayers: [], // NEW for Phase 6
    // Copy all Phase 5 state here
  }
];
let currentLevel = 0;

// Helper functions
export function getCurrentLevelData() {
  return levels[currentLevel];
}

export function switchLevel(index) {
  currentLevel = index;
}

// Getters now pull from current level
export const rooms = () => levels[currentLevel].rooms;
export const symbols = () => levels[currentLevel].symbols;
// ... etc
```

**Complexity:** High - changes core data model

---

### Task 1.2: Update All Imports (1 hour)

**Affected Files:**
- `js/renderer.js`
- `js/ui.js`
- `js/generator.js`
- `js/exporter.js`
- `js/main.js`
- `js/effects.js`
- `js/symbols.js`

**Pattern:**
```javascript
// BEFORE:
import { rooms, setRooms } from './state.js';

// AFTER:
import { getCurrentLevelData, rooms } from './state.js';

// Usage BEFORE:
rooms.forEach(room => ...);

// Usage AFTER:
getCurrentLevelData().rooms.forEach(room => ...);
// OR
rooms().forEach(room => ...); // If rooms() is a function
```

**Risk:** Breaking changes everywhere!
**Mitigation:** Keep backward compatibility with getter functions

---

### Task 1.3: Level Navigation UI (1.5 hours)

**File:** `index.html` + `css/controls.css`

**Add Level Tabs:**
```html
<div class="level-tabs" id="levelTabs">
  <button class="level-tab active" data-level="0">Level 1</button>
  <button class="level-tab" data-level="1">Level 2</button>
  <button class="level-tab-add" id="btnAddLevel">+ Add Level</button>
</div>
```

**CSS:**
```css
.level-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid #444;
}

.level-tab {
  padding: 0.5rem 1rem;
  border: none;
  background: #333;
  color: #aaa;
  cursor: pointer;
}

.level-tab.active {
  background: #4a9eff;
  color: #fff;
  border-bottom: 2px solid #4a9eff;
}
```

**File:** `js/ui.js`

**Event Handlers:**
```javascript
// Level switching
document.querySelectorAll('.level-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const levelIndex = parseInt(e.target.dataset.level);
    switchLevel(levelIndex);
    updateLevelTabs();
    render();
    rebuildRoomList();
  });
});

// Add new level
document.getElementById('btnAddLevel').addEventListener('click', () => {
  const newLevel = {
    id: levels.length,
    name: `Level ${levels.length + 1}`,
    depth: levels.length,
    rooms: [],
    symbols: [],
    // ... empty state
  };
  levels.push(newLevel);
  switchLevel(levels.length - 1);
  updateLevelTabs();
  render();
});

function updateLevelTabs() {
  // Rebuild tabs to reflect current levels
  // Highlight active tab
}
```

---

### Task 1.4: Stair Linking System (2 hours)

**Concept:**
- Stairs on Level 1 can link to stairs on Level 2
- Clicking a stair shows where it leads
- Double-click to jump to linked level

**State Structure:**
```javascript
// In symbols array
{
  id: 's1',
  type: 'stairs',
  subtype: 'down',
  x: 10,
  y: 5,
  linkedStair: {
    levelId: 1,
    stairId: 's2'
  }
}
```

**Placement Flow:**
1. User places "stairs down" on Level 1
2. Modal appears: "Where does this lead?"
   - [ ] New level (create Level 2)
   - [x] Existing level: [Level 2 ▼]
   - [ ] Nowhere (unlinked)
3. If "New level", auto-create Level 2 with linked stair
4. If "Existing level", user clicks on target level to place linked stair

**UI:**
```html
<!-- Stair Link Modal -->
<div id="stairLinkModal" class="modal">
  <div class="modal-content">
    <h2>🪜 Where does this stair lead?</h2>
    <label>
      <input type="radio" name="stairDest" value="new" checked> Create new level
    </label>
    <label>
      <input type="radio" name="stairDest" value="existing"> Existing level:
      <select id="stairDestLevel">
        <option value="0">Level 1</option>
        <option value="1">Level 2</option>
      </select>
    </label>
    <label>
      <input type="radio" name="stairDest" value="none"> Unlinked (decorative)
    </label>
    <button id="btnSaveStairLink">Save</button>
  </div>
</div>
```

**Implementation:**
```javascript
// When placing stairs
function placeStairs(x, y, type) {
  // Create stair object
  const stair = {
    id: generateId(),
    type: 'stairs',
    subtype: type, // 'up' or 'down'
    x, y,
    linkedStair: null
  };

  // Show linking modal
  showStairLinkModal(stair);
}

function showStairLinkModal(stair) {
  document.getElementById('stairLinkModal').style.display = 'block';

  document.getElementById('btnSaveStairLink').onclick = () => {
    const dest = document.querySelector('input[name="stairDest"]:checked').value;

    if (dest === 'new') {
      // Create new level
      const newLevel = createNewLevel();
      const linkedStair = {
        id: generateId(),
        type: 'stairs',
        subtype: stair.subtype === 'down' ? 'up' : 'down',
        x: Math.floor(GRID_COLS / 2), // Center of new level
        y: Math.floor(GRID_ROWS / 2),
        linkedStair: {levelId: currentLevel, stairId: stair.id}
      };

      newLevel.symbols.push(linkedStair);
      stair.linkedStair = {levelId: newLevel.id, stairId: linkedStair.id};

    } else if (dest === 'existing') {
      const targetLevel = parseInt(document.getElementById('stairDestLevel').value);
      // User must click on target level to place linked stair
      enterStairPlacementMode(stair, targetLevel);
    }

    getCurrentLevelData().symbols.push(stair);
    document.getElementById('stairLinkModal').style.display = 'none';
    render();
  };
}
```

**Complexity:** Medium-High

---

### Task 1.5: Export Multi-Level (1 hour)

**File:** `js/exporter.js`

**Export Options:**
```javascript
this.options.exportAllLevels = document.getElementById('exportAllLevels')?.checked ?? false;
```

**Export Logic:**
```javascript
export() {
  this.gatherOptions();

  if (this.options.exportAllLevels) {
    // Export each level as separate PNG
    levels.forEach((level, index) => {
      const exportCanvas = this.createExportCanvas();
      this.renderLevel(exportCanvas, level);
      this.downloadPNG(exportCanvas, `${titleBlockData.dungeonName}_level${index+1}`);
    });
  } else {
    // Export current level only
    const exportCanvas = this.createExportCanvas();
    this.renderCurrentLevel(exportCanvas);
    this.downloadPNG(exportCanvas);
  }
}
```

**HTML Update:**
```html
<!-- In export modal -->
<label>
  <input type="checkbox" id="exportAllLevels"> Export all levels (separate files)
</label>
```

---

### Task 1.6: localStorage Multi-Level (30 min)

**File:** `js/main.js`

**Save:**
```javascript
localStorage.setItem('dungeonData', JSON.stringify({
  levels: levels,
  currentLevel: currentLevel
}));
```

**Load:**
```javascript
const data = JSON.parse(localStorage.getItem('dungeonData'));
if (data.levels) {
  levels = data.levels;
  currentLevel = data.currentLevel || 0;
} else {
  // Backward compatibility: convert old format
  levels = [{
    id: 0,
    name: 'Level 1',
    rooms: data.rooms || [],
    symbols: data.symbols || [],
    // ... migrate old data
  }];
}
```

---

## 🌊 WAVE 2: Independent Features (3-4 hours, PARALLEL)

### Agent 1: Environmental Hazards (3-4 hours)

**Files:**
- `js/state.js` - Add terrainLayers to level state
- `js/renderer.js` - Add drawTerrainLayers()
- `js/ui.js` - Add paint tool event handlers
- `index.html` - Add terrain palette UI

**State:**
```javascript
// In each level
terrainLayers: [
  {
    id: 'layer1',
    type: 'water', // water, lava, pit, difficult, darkness, ice, poison, unstable
    cells: new Set([[5,7], [5,8], [6,7]]), // Grid cells
    opacity: 0.6,
    metadata: {damage: '2d6 fire', saveDC: 13}
  }
]
```

**UI:**
```html
<h4>Environmental Hazards</h4>
<select id="terrainTypeSelect">
  <option value="water">🌊 Water</option>
  <option value="lava">🔥 Lava</option>
  <option value="pit">🕳️ Pit</option>
  <option value="difficult">🪨 Difficult Terrain</option>
  <option value="darkness">🌑 Magical Darkness</option>
  <option value="ice">🧊 Ice/Slippery</option>
  <option value="poison">☠️ Poison Gas</option>
</select>
Brush Size: <input type="range" id="brushSize" min="1" max="5" value="1">
<button id="btnPaintMode">🖌️ Paint Mode</button>
<button id="btnClearTerrain">✕ Clear All Terrain</button>
```

**Paint Tool:**
```javascript
let paintMode = false;
let paintType = 'water';
let brushSize = 1;
let isPainting = false;

canvas.addEventListener('mousedown', (e) => {
  if (paintMode) {
    isPainting = true;
    paintCell(getCellFromMouse(e));
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (paintMode && isPainting) {
    paintCell(getCellFromMouse(e));
  }
});

canvas.addEventListener('mouseup', () => {
  isPainting = false;
});

function paintCell(cell) {
  const layer = getCurrentTerrainLayer(paintType) || createTerrainLayer(paintType);

  // Add cell and surrounding cells based on brush size
  for (let dx = -brushSize + 1; dx < brushSize; dx++) {
    for (let dy = -brushSize + 1; dy < brushSize; dy++) {
      layer.cells.add([cell.x + dx, cell.y + dy]);
    }
  }

  render();
}
```

**Rendering:**
```javascript
function drawTerrainLayers() {
  getCurrentLevelData().terrainLayers.forEach(layer => {
    ctx.save();

    switch(layer.type) {
      case 'water':
        ctx.fillStyle = `rgba(0, 100, 255, ${layer.opacity})`;
        break;
      case 'lava':
        const gradient = ctx.createLinearGradient(0, 0, GRID_SIZE, GRID_SIZE);
        gradient.addColorStop(0, `rgba(255, 100, 0, ${layer.opacity})`);
        gradient.addColorStop(1, `rgba(200, 0, 0, ${layer.opacity})`);
        ctx.fillStyle = gradient;
        break;
      case 'pit':
        ctx.fillStyle = '#000';
        break;
      // ... more types
    }

    layer.cells.forEach(([x, y]) => {
      ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });

    ctx.restore();
  });
}
```

**Lines:** ~400-500

---

### Agent 2: Treasure Generation (2-3 hours)

**Files:**
- `js/treasure.js` (NEW FILE)
- `js/ui.js` - Add "Generate Treasure" button
- `index.html` - Add treasure modal

**treasure.js:**
```javascript
export const TREASURE_TABLES = {
  individual: {
    'CR0-4': {
      coins: () => rollDice(5, 6) + ' cp',
      gems: 0.1,
      magic: 0.01
    },
    'CR5-10': {
      coins: () => (rollDice(4, 6) * 10) + ' gp',
      gems: 0.3,
      magic: 0.1
    },
    // ... more tiers
  }
};

export const MAGIC_ITEMS = {
  common: ['Potion of Healing', 'Torch (everburning)', 'Rope of Climbing'],
  uncommon: ['+1 Weapon', '+1 Armor', 'Bag of Holding', 'Boots of Elvenkind'],
  rare: ['+2 Weapon', 'Ring of Protection', 'Cloak of Elvenkind'],
  veryRare: ['+3 Weapon', 'Ring of Spell Storing', 'Staff of Power'],
  legendary: ['Vorpal Sword', 'Belt of Storm Giant Strength']
};

export function generateTreasure(partyLevel, hoardType = 'individual', theme = 'classic') {
  const crTier = getCRTier(partyLevel);
  const table = TREASURE_TABLES[hoardType][crTier];

  const treasure = {
    coins: table.coins(),
    gems: rollGems(table.gems),
    magic: rollMagicItems(table.magic, theme)
  };

  return formatTreasure(treasure);
}

function rollDice(num, sides) {
  let total = 0;
  for (let i = 0; i < num; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

function formatTreasure(treasure) {
  let text = '**Treasure:**\n';
  if (treasure.coins) text += `- ${treasure.coins}\n`;
  treasure.gems.forEach(gem => text += `- ${gem}\n`);
  treasure.magic.forEach(item => text += `- ${item}\n`);
  return text;
}
```

**UI Modal:**
```html
<div id="treasureModal" class="modal">
  <div class="modal-content">
    <h2>💰 Generate Treasure</h2>
    Party Level: <input type="number" id="treasurePartyLevel" value="5" min="1" max="20">
    Hoard Type:
    <select id="treasureHoardType">
      <option value="individual">Individual</option>
      <option value="hoard">Hoard</option>
    </select>
    Theme:
    <select id="treasureTheme">
      <option value="classic">Classic</option>
      <option value="undead">Undead</option>
      <option value="dragon">Dragon Hoard</option>
    </select>
    <div id="treasureResult"></div>
    <button id="btnGenerateTreasure">Generate</button>
    <button id="btnRerollTreasure">Re-roll</button>
    <button id="btnAddTreasureToRoom">Add to Room Description</button>
  </div>
</div>
```

**Event Handler:**
```javascript
document.getElementById('btnGenerateTreasure').addEventListener('click', () => {
  const level = parseInt(document.getElementById('treasurePartyLevel').value);
  const type = document.getElementById('treasureHoardType').value;
  const theme = document.getElementById('treasureTheme').value;

  const treasure = generateTreasure(level, type, theme);
  document.getElementById('treasureResult').textContent = treasure;
});

document.getElementById('btnAddTreasureToRoom').addEventListener('click', () => {
  if (selectedRoomId) {
    const room = getCurrentLevelData().rooms.find(r => r.id === selectedRoomId);
    const treasure = document.getElementById('treasureResult').textContent;
    room.description += '\n\n' + treasure;
    rebuildRoomList();
    document.getElementById('treasureModal').style.display = 'none';
  }
});
```

**Lines:** ~300-400

---

### Agent 3: More Symbols (2-3 hours)

**Add 20 New Symbols:**

**Terrain Features:**
- Fountain, Well, Brazier, Throne, Bookshelf

**Interactive:**
- Lever, Button, Chain, Ladder, Mirror

**Containers:**
- Barrel, Crate, Sarcophagus, Urn

**Dressing:**
- Rubble, Bones, Bloodstain, Chains

**Natural:**
- Mushrooms, Roots, Stalagmite

**Files:**
- `js/symbols.js` - Add drawing functions
- `index.html` - Add to symbol palette

**Pattern:**
```javascript
// In symbols.js
export function drawFountain(symbol) {
  const px = symbol.x * GRID_SIZE;
  const py = symbol.y * GRID_SIZE;

  ctx.save();
  // Draw fountain shape
  ctx.beginPath();
  ctx.arc(px + GRID_SIZE/2, py + GRID_SIZE/2, GRID_SIZE/3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
  ctx.fill();
  ctx.strokeStyle = '#666';
  ctx.stroke();

  // Water spray lines
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const x1 = px + GRID_SIZE/2;
    const y1 = py + GRID_SIZE/2;
    const x2 = x1 + Math.cos(angle) * GRID_SIZE/4;
    const y2 = y1 + Math.sin(angle) * GRID_SIZE/4;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  ctx.restore();
}

// Register symbol
SYMBOL_RENDERERS.fountain = drawFountain;
```

**UI Update:**
```html
<!-- Categorize symbols -->
<h4>Symbols</h4>
<select id="symbolCategory">
  <option value="doors">Doors</option>
  <option value="stairs">Stairs</option>
  <option value="furniture">Furniture</option>
  <option value="terrain">Terrain Features</option>  <!-- NEW -->
  <option value="interactive">Interactive Objects</option>  <!-- NEW -->
  <option value="containers">Containers</option>  <!-- NEW -->
</select>

<div id="symbolPalette">
  <!-- Dynamically populate based on category -->
</div>
```

**Lines:** ~300

---

## 📊 Total Effort Summary

| Wave | Task | Time | Lines | Agents |
|------|------|------|-------|--------|
| **Wave 1** | Multi-Level Foundation | 5-6 hours | ~700 | 1 |
| **Wave 2** | Environmental Hazards | 3-4 hours | ~450 | 1 (parallel) |
| **Wave 2** | Treasure Generation | 2-3 hours | ~350 | 1 (parallel) |
| **Wave 2** | More Symbols | 2-3 hours | ~300 | 1 (parallel) |
| **TOTAL** | | **8-10 hours** | **~1,800** | **4 agents** |

---

## ✅ Definition of Done

**Each Feature:**
- [ ] State variables added/refactored
- [ ] UI controls added
- [ ] Event handlers implemented
- [ ] Rendering function implemented
- [ ] localStorage persistence
- [ ] JSON export/import
- [ ] No console errors
- [ ] Documentation updated

**Multi-Level Specific:**
- [ ] Can create/delete levels
- [ ] Can switch between levels
- [ ] Stairs link between levels
- [ ] Export all levels or current only
- [ ] Backward compatibility with single-level saves

**Environmental Hazards Specific:**
- [ ] Paint tool works
- [ ] 7+ terrain types
- [ ] Layers can overlap
- [ ] Clear/erase functionality

**Treasure Specific:**
- [ ] Generate button works
- [ ] Re-roll works
- [ ] Add to room description works
- [ ] CR-appropriate loot

**Symbols Specific:**
- [ ] 20+ new symbols
- [ ] Categorized palette
- [ ] All symbols render correctly

---

## 🚨 Risk Assessment

**High Risk:**
- Multi-level state refactoring (could break everything)
- Backward compatibility with old saves

**Medium Risk:**
- Paint tool performance (many cells)
- Stair linking UX complexity

**Low Risk:**
- Treasure generation (isolated)
- New symbols (follows existing pattern)

**Mitigation:**
- Extensive testing after Wave 1
- Keep old save format converter
- Test with large dungeons (performance)

---

## 🎯 Next Steps

**Ready to proceed?**

**Option A:** Build everything (8-10 hours)
**Option B:** Build Wave 1 only (multi-level), assess, then Wave 2
**Option C:** Skip multi-level, just do Wave 2 features (4-6 hours)
**Option D:** Custom - tell me which features to prioritize

**What's your call?** 🎲
