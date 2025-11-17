import {
  getRooms, getSymbols, getEffectsEnabled, getCoffeeStains, getTitleBlockData,
  getDmNotes, getAnnotations, getEncounters, getTraps,
  selectedRoomId, undoStack, redoStack, MAX_UNDO, statusText, undoBtn, redoBtn,
  sizeSelect, densityRange, densityValue, themeSelect, algorithmSelect, renderStyle,
  canvas, zoomLevel, zoomLabel, showDmNotes, levels,
  setRooms, setSelectedRoomId, setUndoStack, setRedoStack, setRenderStyle, setSymbols,
  setEffectsEnabled, setCoffeeStains, setTitleBlockData, setZoomLevel, renderStyleSelect,
  setDmNotes, setShowDmNotes, setAnnotations, setEncounters, setTraps,
  setLevels, getCurrentLevel, setCurrentLevel
} from './state.js';
import { render } from './renderer.js';
import { rebuildRoomList, setupEventHandlers } from './ui.js';
import { generateDungeon } from './generator.js';

// --- UNDO/REDO SYSTEM ---
export function saveState() {
  const state = {
    rooms: JSON.parse(JSON.stringify(getRooms())),
    selectedRoomId: selectedRoomId
  };
  undoStack.push(state);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  setRedoStack([]);
  updateUndoRedoButtons();
}

export function undo() {
  if (undoStack.length === 0) return;
  const currentState = {
    rooms: JSON.parse(JSON.stringify(getRooms())),
    selectedRoomId: selectedRoomId
  };
  redoStack.push(currentState);
  const prevState = undoStack.pop();
  setRooms(prevState.rooms);
  setSelectedRoomId(prevState.selectedRoomId);
  render();
  rebuildRoomList();
  updateUndoRedoButtons();
  saveToLocalStorage();
}

export function redo() {
  if (redoStack.length === 0) return;
  const currentState = {
    rooms: JSON.parse(JSON.stringify(getRooms())),
    selectedRoomId: selectedRoomId
  };
  undoStack.push(currentState);
  const nextState = redoStack.pop();
  setRooms(nextState.rooms);
  setSelectedRoomId(nextState.selectedRoomId);
  render();
  rebuildRoomList();
  updateUndoRedoButtons();
  saveToLocalStorage();
}

export function updateUndoRedoButtons() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

// --- UTILS ---
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getThemePrompt(theme) {
  switch (theme) {
    case 'undead': return 'Undead crypt: bones, sarcophagi, necromantic energies.';
    case 'cavern': return 'Natural caverns: stalactites, underground lakes, strange fungi.';
    case 'arcane': return 'Arcane ruin: magical traps, glyphs, summoning circles.';
    default: return 'Classic dungeon: stone corridors, doors, traps, treasure.';
  }
}

export function getRoomColor(type) {
  switch(type) {
    case 'entrance': return '#4a9eff';
    case 'treasure': return '#ffd700';
    case 'boss': return '#ff4444';
    case 'trap': return '#ff8800';
    default: return '#aaa';
  }
}

export function checkRoomOverlap(newRoom, existingRooms, excludeId = null) {
  for (const r of existingRooms) {
    if (excludeId !== null && r.id === excludeId) continue;
    if (newRoom.x < r.x + r.w && newRoom.x + newRoom.w > r.x &&
        newRoom.y < r.y + r.h && newRoom.y + newRoom.h > r.y) {
      return r;
    }
  }
  return null;
}

export function renumberRooms() {
  saveState();
  getRooms().forEach((room, idx) => {
    room.id = idx + 1;
  });
  setSelectedRoomId(getRooms()[0]?.id ?? null);
  render();
  rebuildRoomList();
  saveToLocalStorage();
  statusText.textContent = 'Rooms renumbered';
  setTimeout(() => { statusText.textContent = ''; }, 2000);
}

// --- ZOOM CONTROLS ---
export function setZoom(newZoom) {
  const newLevel = Math.max(0.5, Math.min(2.0, newZoom));
  setZoomLevel(newLevel);
  canvas.style.transform = `scale(${newLevel})`;
  canvas.style.transformOrigin = 'top left';
  zoomLabel.textContent = `${Math.round(newLevel * 100)}%`;
}

// --- LOCAL STORAGE ---
export function saveToLocalStorage() {
  const data = {
    // NEW: Save entire levels array
    levels: levels,
    currentLevel: getCurrentLevel(),

    // OLD format (for backward compat, remove later):
    size: sizeSelect.value,
    density: densityRange.value,
    theme: themeSelect.value,
    algorithm: algorithmSelect.value,
    renderStyle: renderStyle,
    timestamp: Date.now()
  };
  localStorage.setItem('dungeonMaker_autoSave', JSON.stringify(data));
  console.log('Multi-level dungeon saved to localStorage');
  statusText.textContent = 'Auto-saved';
  setTimeout(() => { statusText.textContent = ''; }, 2000);
}

export function loadFromLocalStorage() {
  const saved = localStorage.getItem('dungeonMaker_autoSave');
  if (!saved) return false;

  try {
    const data = JSON.parse(saved);

    // Check if this is NEW multi-level format
    if (data.levels && Array.isArray(data.levels)) {
      // Load multi-level dungeon
      setLevels(data.levels);
      setCurrentLevel(data.currentLevel || 0);

      // Update UI dropdowns from saved data
      if (data.size) sizeSelect.value = data.size;
      if (data.density) {
        densityRange.value = data.density;
        densityValue.textContent = data.density;
      }
      if (data.theme) themeSelect.value = data.theme;
      if (data.algorithm) algorithmSelect.value = data.algorithm;
      if (data.renderStyle) {
        setRenderStyle(data.renderStyle);
        renderStyleSelect.value = data.renderStyle;
      }

      console.log(`Loaded multi-level dungeon: ${data.levels.length} levels`);

    } else {
      // MIGRATE OLD single-level format to new format
      console.log('Migrating old save format to multi-level...');

      const migratedLevel = {
        id: 0,
        name: 'Level 1',
        depth: 0,
        rooms: data.rooms || [],
        symbols: data.symbols || [],
        annotations: data.annotations || [],
        traps: data.traps || [],
        encounters: data.encounters || [],
        dmNotes: data.dmNotes || [],
        coffeeStains: data.coffeeStains || [],
        effectsEnabled: data.effectsEnabled || {
          parchmentTexture: false,
          coffeeStains: false,
          ageSpots: false,
          titleBlock: false,
          compass: false
        },
        titleBlockData: data.titleBlockData || {
          dungeonName: 'Untitled Dungeon',
          dmName: '',
          date: new Date().toLocaleDateString()
        },
        terrainLayers: []
      };

      setLevels([migratedLevel]);
      setCurrentLevel(0);

      // Load UI state
      if (data.size) sizeSelect.value = data.size;
      if (data.density) {
        densityRange.value = data.density;
        densityValue.textContent = data.density;
      }
      if (data.theme) themeSelect.value = data.theme;
      if (data.algorithm) algorithmSelect.value = data.algorithm;
      if (data.renderStyle) {
        setRenderStyle(data.renderStyle);
        renderStyleSelect.value = data.renderStyle;
      }

      // Save migrated data
      saveToLocalStorage();

      console.log('Migration complete!');
    }

    // Update UI from current level
    if (getEffectsEnabled()) {
      document.getElementById('chkTitleBlock').checked = getEffectsEnabled().titleBlock;
      document.getElementById('chkCompass').checked = getEffectsEnabled().compass;
      document.getElementById('chkCoffeeStains').checked = getEffectsEnabled().coffeeStains;
      document.getElementById('chkAgeSpots').checked = getEffectsEnabled().ageSpots;
    }
    if (getTitleBlockData()) {
      document.getElementById('dungeonNameInput').value = getTitleBlockData().dungeonName;
      document.getElementById('dmNameInput').value = getTitleBlockData().dmName;
    }
    if (typeof showDmNotes !== 'undefined') {
      const chkShowDmNotes = document.getElementById('chkShowDmNotes');
      if (chkShowDmNotes) chkShowDmNotes.checked = showDmNotes;
    }

    setSelectedRoomId(getRooms()[0]?.id ?? null);
    render();
    rebuildRoomList();
    statusText.textContent = 'Loaded from auto-save';
    setTimeout(() => { statusText.textContent = ''; }, 3000);
    return true;

  } catch(e) {
    console.error('Failed to load from localStorage', e);
    return false;
  }
}

// --- INITIALIZATION ---
// Set up all event handlers
setupEventHandlers();

// Try to load from localStorage, otherwise generate initial dungeon
if (!loadFromLocalStorage()) {
  generateDungeon();
}
