# 🎯 Phase 5: DM Essentials Pack - Implementation Plan

**Goal:** Add 5 critical features that DMs use every session

**Estimated Time:** 6-8 hours
**Status:** IN PROGRESS

---

## 📋 Feature List

### 1. ✅ Measurement Ruler (30 min)
**What:** Click two points, show distance in feet
**UI:** Button to toggle ruler mode, line drawn between points, distance label
**State:** `rulerMode: boolean`, `rulerStart: {x, y}`, `rulerEnd: {x, y}`
**Implementation:**
- Add ruler button to toolbar
- Mouse click captures start point
- Mouse move shows preview line
- Second click captures end point
- Calculate distance (grid squares × 5ft)
- Render line + label on canvas
- ESC key to cancel

---

### 2. ✅ Text Annotations (1 hour)
**What:** Add text labels anywhere on map
**UI:** Button to enter annotation mode, click to place, edit text
**State:** `annotations: [{id, x, y, text, fontSize, color}]`
**Implementation:**
- Add "Add Note" button
- Click on map → prompt for text
- Render text at position
- Click annotation → edit or delete
- Different styles: label, callout, arrow
- Export includes annotations

---

### 3. ✅ Trap Markers (2 hours)
**What:** Place trap icons with DC/damage info
**UI:** Trap palette, click to place, dialog for details
**State:** `traps: [{id, x, y, trapType, detectionDC, disarmDC, damage, description}]`
**Implementation:**
- Trap types: bear trap, pit, poison gas, dart, spike, fire, magical
- Icon rendering for each type
- Click trap → modal with form:
  - Detection DC (e.g., "15")
  - Disarm DC (e.g., "13")
  - Save type (Dex, Con, etc.)
  - Damage (e.g., "2d10 piercing")
  - Description
- Render icons on map
- Export adds trap details to room key

---

### 4. ✅ Monster/Encounter Markers (2 hours)
**What:** Place monster tokens with stats
**UI:** Monster palette, click to place, dialog for details
**State:** `encounters: [{id, x, y, monsterType, count, ac, hp, behavior, notes}]`
**Implementation:**
- Monster categories: humanoid, beast, undead, dragon, fiend, aberration
- Generic token icons (colored by category)
- Click monster → modal with form:
  - Name/Type (e.g., "Goblin")
  - Count (e.g., "3")
  - AC (e.g., "15")
  - HP (e.g., "7 each")
  - Behavior (e.g., "Patrol, alert on 5+")
  - Notes
- Color-coded by difficulty: green (easy), yellow (medium), red (hard)
- Numbered tokens (1, 2, 3...)
- Export lists all encounters in room key

---

### 5. ✅ DM Notes Layer (1-2 hours)
**What:** Hidden layer for DM-only info
**UI:** Toggle "Show DM Notes", separate color/style
**State:** `dmNotes: [{id, x, y, noteType, text, isSecret}]`
**Implementation:**
- Toggle button: "Show/Hide DM Notes"
- When active, can place secret notes:
  - Secret doors
  - Hidden treasure
  - Monster weaknesses
  - Plot clues
- Render with distinct style (red text, dashed border)
- Export options:
  - "Player Map" - hides DM notes
  - "DM Map" - shows everything
- Add checkbox in export modal: "Include DM Notes"

---

## 🏗️ Technical Architecture

### State Management (state.js)
```javascript
// Phase 5 additions
let annotations = [];
let rulerMode = false;
let rulerStart = null;
let rulerEnd = null;
let traps = [];
let encounters = [];
let dmNotes = [];
let showDmNotes = true; // DM view by default

// Setters
export function setAnnotations(val) { annotations = val; }
export function setRulerMode(val) { rulerMode = val; }
// ... etc
```

### Rendering (renderer.js)
```javascript
// New render functions
export function drawRuler(start, end) { ... }
export function drawAnnotations() { ... }
export function drawTraps() { ... }
export function drawEncounters() { ... }
export function drawDmNotes() { ... }
```

### UI (ui.js)
```javascript
// New event handlers
btnRulerMode.addEventListener('click', () => { ... });
btnAddAnnotation.addEventListener('click', () => { ... });
btnAddTrap.addEventListener('click', () => { ... });
btnAddEncounter.addEventListener('click', () => { ... });
btnToggleDmNotes.addEventListener('click', () => { ... });
```

### Export (exporter.js)
```javascript
// Update export to include/exclude DM notes
if (this.options.includeDmNotes) {
  drawDmNotes();
} else {
  // Skip DM notes for player map
}
```

---

## 📦 HTML UI Changes

### Toolbar Additions
```html
<!-- Measurement Tool -->
<button id="btnRulerMode">📏 Measure Distance</button>

<!-- Annotations -->
<button id="btnAddAnnotation">📝 Add Note</button>
<button id="btnClearAnnotations">✕ Clear Notes</button>

<!-- Right Panel: Phase 5 Section -->
<div class="panel">
  <h3>🎲 DM Tools</h3>

  <!-- Traps -->
  <h4>Traps</h4>
  <select id="trapTypeSelect">
    <option value="bear">Bear Trap</option>
    <option value="pit">Pit Trap</option>
    <option value="dart">Dart Trap</option>
    <option value="poison">Poison Gas</option>
    <option value="spike">Spike Trap</option>
    <option value="fire">Fire Trap</option>
    <option value="magic">Magical Trap</option>
  </select>
  <button id="btnPlaceTrap">Place Trap</button>

  <!-- Encounters -->
  <h4>Monsters</h4>
  <select id="encounterTypeSelect">
    <option value="humanoid">Humanoid</option>
    <option value="beast">Beast</option>
    <option value="undead">Undead</option>
    <option value="dragon">Dragon</option>
    <option value="fiend">Fiend</option>
    <option value="aberration">Aberration</option>
  </select>
  <button id="btnPlaceEncounter">Place Monster</button>

  <!-- DM Notes -->
  <h4>DM Notes</h4>
  <label>
    <input type="checkbox" id="chkShowDmNotes" checked> Show DM Notes
  </label>
  <button id="btnAddDmNote">Add Secret Note</button>
</div>
```

### Export Modal Update
```html
<!-- Add to export options -->
<label>
  <input type="checkbox" id="exportIncludeDmNotes"> Include DM notes (for DM map)
</label>
```

---

## 🎨 Visual Design

### Icons
- **Ruler:** Dashed line with distance label
- **Annotations:** Text with small background box
- **Traps:** Custom icons for each type (bear trap = serrated circle, pit = black hole, etc.)
- **Monsters:** Colored tokens with letter (H=humanoid, B=beast, U=undead, etc.)
- **DM Notes:** Red/orange text with dashed border

### Colors
- Annotations: Black text, white background
- Traps: Orange/red icons
- Monsters: Green (easy), Yellow (medium), Red (hard)
- DM Notes: Red text, orange dashed border

---

## 🔄 Implementation Order

**Easiest → Hardest:**

1. **Measurement Ruler** (30 min)
   - Simple line drawing + distance calculation
   - No persistence needed
   - Just toggle mode + click handlers

2. **Text Annotations** (1 hour)
   - Basic text rendering
   - Simple data structure
   - Edit/delete functionality

3. **Trap Markers** (2 hours)
   - Icon rendering for 7 trap types
   - Modal dialog for details
   - Export integration

4. **Monster Markers** (2 hours)
   - Token rendering (6 categories)
   - Modal dialog for stats
   - Export integration

5. **DM Notes Layer** (1-2 hours)
   - Toggle visibility
   - Special rendering style
   - Export option (include/exclude)

---

## ✅ Definition of Done

For each feature:
- [ ] State variables added
- [ ] UI buttons/controls added
- [ ] Event handlers implemented
- [ ] Rendering function implemented
- [ ] Click interaction works
- [ ] Edit/delete functionality
- [ ] localStorage persistence
- [ ] JSON export includes data
- [ ] PNG export includes visual
- [ ] No console errors
- [ ] Tested in browser

---

## 📊 Progress Tracking

- [ ] Feature 1: Measurement Ruler
- [ ] Feature 2: Text Annotations
- [ ] Feature 3: Trap Markers
- [ ] Feature 4: Monster Markers
- [ ] Feature 5: DM Notes Layer
- [ ] Export system updated
- [ ] Testing complete
- [ ] Committed & pushed

---

**LET'S BUILD THIS!** 🚀
