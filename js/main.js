import {
  rooms, selectedRoomId, undoStack, redoStack, MAX_UNDO, statusText, undoBtn, redoBtn,
  sizeSelect, densityRange, densityValue, themeSelect, algorithmSelect, renderStyle,
  symbols, effectsEnabled, coffeeStains, titleBlockData, canvas, zoomLevel, zoomLabel,
  dmNotes, showDmNotes, annotations, encounters, traps,
  setRooms, setSelectedRoomId, setUndoStack, setRedoStack, setRenderStyle, setSymbols,
  setEffectsEnabled, setCoffeeStains, setTitleBlockData, setZoomLevel, renderStyleSelect,
  setDmNotes, setShowDmNotes, setAnnotations, setEncounters, setTraps
} from './state.js';
import { render } from './renderer.js';
import { rebuildRoomList, setupEventHandlers } from './ui.js';
import { generateDungeon } from './generator.js';

// --- UNDO/REDO SYSTEM ---
export function saveState() {
  const state = {
    rooms: JSON.parse(JSON.stringify(rooms)),
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
    rooms: JSON.parse(JSON.stringify(rooms)),
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
    rooms: JSON.parse(JSON.stringify(rooms)),
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
  rooms.forEach((room, idx) => {
    room.id = idx + 1;
  });
  setSelectedRoomId(rooms[0]?.id ?? null);
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
    size: sizeSelect.value,
    density: densityRange.value,
    theme: themeSelect.value,
    algorithm: algorithmSelect.value,
    renderStyle: renderStyle,
    rooms: rooms,
    symbols: symbols,
    effectsEnabled: effectsEnabled,
    coffeeStains: coffeeStains,
    titleBlockData: titleBlockData,
    dmNotes: dmNotes,
    showDmNotes: showDmNotes,
    annotations: annotations,
    encounters: encounters,
    traps: traps,
    timestamp: Date.now()
  };
  localStorage.setItem('dungeonMaker_autoSave', JSON.stringify(data));
  statusText.textContent = 'Auto-saved';
  setTimeout(() => { statusText.textContent = ''; }, 2000);
}

export function loadFromLocalStorage() {
  const saved = localStorage.getItem('dungeonMaker_autoSave');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      sizeSelect.value = data.size || 'medium';
      densityRange.value = data.density || 5;
      densityValue.textContent = data.density || 5;
      themeSelect.value = data.theme || 'classic';
      algorithmSelect.value = data.algorithm || 'rooms';
      setRenderStyle(data.renderStyle || 'dyson');
      renderStyleSelect.value = renderStyle;
      setRooms(data.rooms || []);
      setSymbols(data.symbols || []);

      if (data.effectsEnabled) {
        setEffectsEnabled(data.effectsEnabled);
        document.getElementById('chkTitleBlock').checked = effectsEnabled.titleBlock;
        document.getElementById('chkCompass').checked = effectsEnabled.compass;
        document.getElementById('chkCoffeeStains').checked = effectsEnabled.coffeeStains;
        document.getElementById('chkAgeSpots').checked = effectsEnabled.ageSpots;
      }
      setCoffeeStains(data.coffeeStains || []);
      if (data.titleBlockData) {
        setTitleBlockData(data.titleBlockData);
        document.getElementById('dungeonNameInput').value = titleBlockData.dungeonName;
        document.getElementById('dmNameInput').value = titleBlockData.dmName;
      }

      if (data.dmNotes) setDmNotes(data.dmNotes);
      if (typeof data.showDmNotes !== 'undefined') setShowDmNotes(data.showDmNotes);
      if (data.annotations) setAnnotations(data.annotations);
      if (data.traps) setTraps(data.traps);
      if (data.encounters) setEncounters(data.encounters);

      setSelectedRoomId(rooms[0]?.id ?? null);
      render();
      rebuildRoomList();
      statusText.textContent = 'Loaded from auto-save';
      setTimeout(() => { statusText.textContent = ''; }, 3000);
      return true;
    } catch(e) {
      console.error('Failed to load from localStorage', e);
    }
  }
  return false;
}

// --- INITIALIZATION ---
// Set up all event handlers
setupEventHandlers();

// Try to load from localStorage, otherwise generate initial dungeon
if (!loadFromLocalStorage()) {
  generateDungeon();
}
