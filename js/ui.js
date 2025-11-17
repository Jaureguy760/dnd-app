// --- UI EVENT HANDLERS AND INTERACTION CODE ---

import {
  getRooms, getSymbols, getEffectsEnabled, getCoffeeStains, getTitleBlockData,
  getEncounters, getAnnotations, getDmNotes, getTraps, getTerrainLayers,
  canvas, ctx, GRID_SIZE, GRID_COLS, GRID_ROWS, selectedRoomId, placingMarker,
  selectedSymbol, placingSymbolType,
  backgroundImg, draggingRoom, dragOffset, mouseDownPos, hasDragged, statusText,
  roomListEl, newDungeonBtn, mapFileInput, jsonFileInput, placeMarkerBtn, exportPngBtn,
  exportJsonBtn, sizeSelect, densityRange, densityValue, themeSelect, algorithmSelect,
  templateSelect, loadTemplateBtn, clearStorageBtn, zoomInBtn, zoomOutBtn, zoomResetBtn,
  undoBtn, redoBtn, renumberBtn, renderStyleSelect, stylePreview, TEMPLATES,
  rulerMode, rulerStart, rulerEnd, showDmNotes,
  setRooms, setSelectedRoomId, setPlacingMarker, setBackgroundImg, setDraggingRoom,
  setSymbols, setSelectedSymbol, setPlacingSymbolType, setEffectsEnabled, setTitleBlockData,
  setUndoStack, setRedoStack, setMouseDownPos, setHasDragged, setRenderStyle,
  setRulerMode, setRulerStart, setRulerEnd, setEncounters, setAnnotations, setCoffeeStains,
  setTraps, setDmNotes, setShowDmNotes, setTerrainLayers, addTerrainLayer,
  levels, getCurrentLevel, setCurrentLevel, addLevel, removeLevel
} from './state.js';

import { render } from './renderer.js';
import { getWallRegions } from './renderer.js';
import {
  saveState, undo, redo, updateUndoRedoButtons, renumberRooms, setZoom,
  saveToLocalStorage, loadFromLocalStorage, checkRoomOverlap
} from './main.js';
import { generateDungeon } from './generator.js';
import { DungeonExporter } from './exporter.js';
import { generateCoffeeStains } from './effects.js';
import { generateTreasure, formatTreasure } from './treasure.js';

// Initialize exporter
const exporter = new DungeonExporter();

// --- ENCOUNTER PLACEMENT STATE ---
let placingEncounter = false;
let currentEncounterType = 'humanoid';
let pendingEncounterPosition = null;

// --- TRAP PLACEMENT STATE ---
let placingTrap = false;
let currentTrapType = 'bear';
let pendingTrapPosition = null;

// --- ANNOTATION PLACEMENT STATE ---
let placingAnnotation = false;
let annotationText = '';

// --- DM NOTES STATE ---
let placingDmNote = false;
let pendingDmNoteText = '';

// --- STAIR LINKING STATE ---
let pendingStair = null;

// --- TREASURE GENERATION STATE ---
let lastGeneratedTreasure = null;

// --- TERRAIN PAINTING STATE ---
let paintingTerrain = false;
let erasingTerrain = false;
let terrainBrushSize = 2;

// --- ROOM LIST UI ---
export function rebuildRoomList() {
  roomListEl.innerHTML = '';
  getRooms()
    .slice()
    .sort((a, b) => a.id - b.id)
    .forEach(room => {
      const li = document.createElement('li');
      li.dataset.id = room.id;
      li.className = `room-${room.type}`;
      if (room.id === selectedRoomId) li.classList.add('selected');

      const title = document.createElement('div');
      title.textContent = `Location ${room.id}`;
      li.appendChild(title);

      // Room controls (type selector + delete button)
      const controls = document.createElement('div');
      controls.className = 'room-controls';

      const typeSelector = document.createElement('select');
      typeSelector.className = 'room-type-selector';
      ['normal', 'entrance', 'treasure', 'boss', 'trap'].forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        if (room.type === type) opt.selected = true;
        typeSelector.appendChild(opt);
      });
      typeSelector.addEventListener('change', (e) => {
        saveState();
        room.type = e.target.value;
        render();
        rebuildRoomList();
        saveToLocalStorage();
      });
      controls.appendChild(typeSelector);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '✕ Delete';
      deleteBtn.className = 'delete-room-btn';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteRoom(room.id);
      });
      controls.appendChild(deleteBtn);

      li.appendChild(controls);

      const textarea = document.createElement('textarea');
      textarea.value = room.description || '';
      textarea.addEventListener('input', (e) => {
        room.description = e.target.value;
        saveToLocalStorage();
      });
      li.appendChild(textarea);

      li.addEventListener('click', (e) => {
        if (e.target === textarea || e.target === typeSelector || e.target === deleteBtn) return;
        setSelectedRoomId(room.id);
        render();
        rebuildRoomList();
      });

      roomListEl.appendChild(li);
    });
}

export function deleteRoom(roomId) {
  if (!confirm(`Delete Location ${roomId}? This cannot be undone.`)) return;
  saveState();
  setRooms(getRooms().filter(r => r.id !== roomId));
  if (selectedRoomId === roomId) {
    setSelectedRoomId(getRooms()[0]?.id ?? null);
  }
  render();
  rebuildRoomList();
  saveToLocalStorage();
  statusText.textContent = `Location ${roomId} deleted`;
  setTimeout(() => { statusText.textContent = ''; }, 2000);
}

// --- HIT TEST / INTERACTION ---
export function roomAtCanvasPosition(px, py) {
  const gx = px / GRID_SIZE;
  const gy = py / GRID_SIZE;
  for (const room of getRooms()) {
    if (
      gx >= room.x &&
      gx <= room.x + room.w &&
      gy >= room.y &&
      gy <= room.y + room.h
    ) return room;
  }
  return null;
}

// --- SYMBOL HELPER FUNCTIONS ---
export function findSymbolAt(gx, gy) {
  return getSymbols().find(s => s.x === gx && s.y === gy);
}

export function deleteSymbol(symbolId) {
  setSymbols(getSymbols().filter(s => s.id !== symbolId));
  if (selectedSymbol && selectedSymbol.id === symbolId) {
    setSelectedSymbol(null);
  }
  saveState();
  render();
  saveToLocalStorage();
}

function isCorridorAt(gx, gy) {
  if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) return false;

  const wallGrid = getWallRegions();
  const isWall = wallGrid[gy][gx];
  const isRoom = getRooms().some(r =>
    gx >= r.x && gx < r.x + r.w && gy >= r.y && gy < r.y + r.h
  );

  return !isWall && !isRoom;
}

function doorExistsAt(x, y) {
  return getSymbols().some(s =>
    (s.type === 'door' || s.type === 'secret_door' ||
     s.type === 'locked_door' || s.type === 'portcullis') &&
    s.x === x && s.y === y
  );
}

export function autoDetectDoors() {
  const newDoors = [];

  getRooms().forEach(room => {
    // Check north wall
    for (let x = room.x; x < room.x + room.w; x++) {
      if (room.y > 0 && isCorridorAt(x, room.y - 1)) {
        if (!doorExistsAt(x, room.y)) {
          newDoors.push({
            id: Date.now() + Math.random(),
            type: 'door',
            subtype: 'normal',
            x: x,
            y: room.y,
            direction: 'north',
            roomId: room.id
          });
        }
      }
    }

    // Check south wall
    for (let x = room.x; x < room.x + room.w; x++) {
      if (room.y + room.h < GRID_ROWS && isCorridorAt(x, room.y + room.h)) {
        if (!doorExistsAt(x, room.y + room.h - 1)) {
          newDoors.push({
            id: Date.now() + Math.random(),
            type: 'door',
            subtype: 'normal',
            x: x,
            y: room.y + room.h - 1,
            direction: 'south',
            roomId: room.id
          });
        }
      }
    }

    // Check east wall
    for (let y = room.y; y < room.y + room.h; y++) {
      if (room.x + room.w < GRID_COLS && isCorridorAt(room.x + room.w, y)) {
        if (!doorExistsAt(room.x + room.w - 1, y)) {
          newDoors.push({
            id: Date.now() + Math.random(),
            type: 'door',
            subtype: 'normal',
            x: room.x + room.w - 1,
            y: y,
            direction: 'east',
            roomId: room.id
          });
        }
      }
    }

    // Check west wall
    for (let y = room.y; y < room.y + room.h; y++) {
      if (room.x > 0 && isCorridorAt(room.x - 1, y)) {
        if (!doorExistsAt(room.x, y)) {
          newDoors.push({
            id: Date.now() + Math.random(),
            type: 'door',
            subtype: 'normal',
            x: room.x,
            y: y,
            direction: 'west',
            roomId: room.id
          });
        }
      }
    }
  });

  const currentSymbols = getSymbols();
  currentSymbols.push(...newDoors);
  setSymbols(currentSymbols);
  saveState();
  render();
  saveToLocalStorage();

  statusText.textContent = `Auto-detected ${newDoors.length} doors`;
  setTimeout(() => { statusText.textContent = ''; }, 3000);

  return newDoors.length;
}

// --- CANVAS CLICK HANDLER ---
export function handleCanvasClick(x, y) {
  const gx = Math.floor(x / GRID_SIZE);
  const gy = Math.floor(y / GRID_SIZE);

  // If placing DM note
  if (placingDmNote) {
    const newNote = {
      id: Date.now() + Math.random(),
      x: gx,
      y: gy,
      text: pendingDmNoteText,
      noteType: 'secret'
    };

    setDmNotes([...getDmNotes(), newNote]);
    saveState();
    saveToLocalStorage();
    render();

    placingDmNote = false;
    pendingDmNoteText = '';
    statusText.textContent = '';
    return;
  }

  // If painting or erasing terrain
  if (paintingTerrain || erasingTerrain) {
    const gx = Math.floor(x / GRID_SIZE);
    const gy = Math.floor(y / GRID_SIZE);

    if (paintingTerrain) {
      const terrainType = document.getElementById('terrainTypeSelect').value;
      const newTerrain = {
        id: `terrain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: gx,
        y: gy,
        width: terrainBrushSize,
        height: terrainBrushSize,
        type: terrainType,
        metadata: getTerrainMetadata(terrainType)
      };
      addTerrainLayer(newTerrain);
      saveState();
      saveToLocalStorage();
      render();
      return;
    }

    if (erasingTerrain) {
      // Remove terrain at this location
      const terrainLayers = getTerrainLayers();
      const filtered = terrainLayers.filter(t => {
        return !(gx >= t.x && gx < t.x + t.width &&
                 gy >= t.y && gy < t.y + t.height);
      });
      setTerrainLayers(filtered);
      saveState();
      saveToLocalStorage();
      render();
      return;
    }
  }

  // Check if clicked on DM note (only when visible)
  if (showDmNotes) {
    const clickedNote = getDmNotes().find(note => {
      const noteX = note.x * GRID_SIZE;
      const noteY = note.y * GRID_SIZE;
      const fontSize = 12;
      const textWidth = ctx.measureText(note.text).width || 50;
      return x >= noteX - 4 && x <= noteX + textWidth + 4 &&
             y >= noteY - fontSize - 4 && y <= noteY + 4;
    });

    if (clickedNote) {
      const action = confirm('Edit DM note? (Cancel to delete)');
      if (action) {
        const newText = prompt('Edit DM note:', clickedNote.text);
        if (newText) {
          clickedNote.text = newText;
          setDmNotes([...getDmNotes()]);
          saveState();
          saveToLocalStorage();
          render();
        }
      } else {
        setDmNotes(getDmNotes().filter(n => n.id !== clickedNote.id));
        saveState();
        saveToLocalStorage();
        render();
      }
      return;
    }
  }

  // If ruler mode is active, handle ruler clicks
  if (rulerMode) {
    if (!rulerStart) {
      setRulerStart({x: gx, y: gy});
    } else if (!rulerEnd) {
      setRulerEnd({x: gx, y: gy});
      // Show distance in status
      const dx = Math.abs(gx - rulerStart.x);
      const dy = Math.abs(gy - rulerStart.y);
      const distance = Math.sqrt(dx * dx + dy * dy) * 5;
      statusText.textContent = `Distance: ${Math.round(distance)}ft`;
      setTimeout(() => { statusText.textContent = ''; }, 3000);
      // Reset for next measurement
      setRulerStart(null);
      setRulerEnd(null);
    }
    render();
    return; // Don't process other clicks
  }

  // If placing annotation
  if (placingAnnotation) {
    const newAnnotation = {
      id: Date.now() + Math.random(),
      x: gx,
      y: gy,
      text: annotationText,
      fontSize: 12,
      color: '#000'
    };
    setAnnotations([...getAnnotations(), newAnnotation]);
    saveState();
    saveToLocalStorage();

    placingAnnotation = false;
    annotationText = '';
    statusText.textContent = '';
    render();
    return;
  }

  // Check if clicked on annotation
  const clickedAnnotation = getAnnotations().find(ann => {
    const annX = ann.x * GRID_SIZE;
    const annY = ann.y * GRID_SIZE;
    const fontSize = ann.fontSize || 12;
    const textWidth = ctx.measureText(ann.text).width || 50;
    return x >= annX - 4 && x <= annX + textWidth + 4 &&
           y >= annY - fontSize - 4 && y <= annY + 4;
  });

  if (clickedAnnotation) {
    const action = confirm('Edit annotation? (Cancel to delete)');
    if (action) {
      const newText = prompt('Edit annotation:', clickedAnnotation.text);
      if (newText) {
        clickedAnnotation.text = newText;
        setAnnotations([...getAnnotations()]);
        saveState();
        saveToLocalStorage();
        render();
      }
    } else {
      setAnnotations(getAnnotations().filter(a => a.id !== clickedAnnotation.id));
      saveState();
      saveToLocalStorage();
      render();
    }
    return;
  }

  // If placing encounter
  if (placingEncounter) {
    const gx = Math.floor(x / GRID_SIZE);
    const gy = Math.floor(y / GRID_SIZE);
    
    pendingEncounterPosition = {x: gx, y: gy};
    placingEncounter = false;
    
    // Show encounter details modal
    document.getElementById('encounterModal').style.display = 'block';
    statusText.textContent = '';
    return;
  }

  // Symbol placement mode
  if (placingSymbolType) {
    // Determine direction based on symbol type
    let direction = 'north';
    // Get subtype from the dropdown selector (Phase 6 update)
    let subtype = document.getElementById('symbolSubtypeSelect')?.value || 'normal';

    if (placingSymbolType.includes('stairs')) {
      direction = placingSymbolType.includes('up') ? 'up' : placingSymbolType.includes('down') ? 'down' : 'spiral';

      // INTERCEPT STAIR PLACEMENT - Show link modal instead
      pendingStair = {
        x: gx,
        y: gy,
        type: placingSymbolType,
        subtype: subtype,
        direction: direction
      };

      // Populate destination dropdown with other levels
      const select = document.getElementById('stairDestLevel');
      select.innerHTML = '';
      levels.forEach((level, idx) => {
        if (idx !== getCurrentLevel()) {
          const option = document.createElement('option');
          option.value = idx;
          const depthLabel = level.depth === 0 ? 'Ground' :
                             level.depth > 0 ? `Tower ${level.depth}` :
                             `Basement ${Math.abs(level.depth)}`;
          option.textContent = `${level.name} (${depthLabel})`;
          select.appendChild(option);
        }
      });

      // Show modal
      document.getElementById('stairLinkModal').style.display = 'block';
      return; // Don't place the stair yet
    }

    // Non-stair symbol placement (existing logic)
    saveState();
    const newSymbol = {
      id: Date.now() + Math.random(),
      type: placingSymbolType,
      subtype: subtype,
      x: gx,
      y: gy,
      direction: direction,
      roomId: null
    };

    const currentSymbols = getSymbols();
    currentSymbols.push(newSymbol);
    setSymbols(currentSymbols);
    render();
    saveToLocalStorage();

    // Deselect room, select symbol
    setSelectedRoomId(null);
    setSelectedSymbol(newSymbol);
    document.getElementById('btnDeleteSymbol').disabled = false;

    statusText.textContent = `Placed ${placingSymbolType}`;
    setTimeout(() => { statusText.textContent = ''; }, 2000);

    return;
  }

  // Check if clicked on encounter
  const clickedEncounter = getEncounters().find(enc => {
    const encX = enc.x * GRID_SIZE + GRID_SIZE / 2;
    const encY = enc.y * GRID_SIZE + GRID_SIZE / 2;
    const dist = Math.sqrt((x - encX) ** 2 + (y - encY) ** 2);
    return dist < GRID_SIZE * 0.5;
  });

  if (clickedEncounter) {
    const info = `${clickedEncounter.count}x ${clickedEncounter.monsterType}\nAC: ${clickedEncounter.ac}, HP: ${clickedEncounter.hp}\nBehavior: ${clickedEncounter.behavior || 'None'}\n\nDelete this encounter?`;
    const action = confirm(info);
    if (action) {
      setEncounters(getEncounters().filter(e => e.id !== clickedEncounter.id));
      saveState();
      saveToLocalStorage();
      render();
    }
    return;
  }
  // If placing trap
  if (placingTrap) {
    pendingTrapPosition = {x: gx, y: gy};
    placingTrap = false;

    // Show trap details modal
    document.getElementById('trapModal').style.display = 'block';
    statusText.textContent = '';
    return;
  }


  if (placingMarker) {
    saveState();
    const currentRooms = getRooms();
    const id = currentRooms.length ? Math.max(...currentRooms.map(r => r.id)) + 1 : 1;
    const newRoom = {
      id,
      x: Math.max(0, Math.min(gx - 1, GRID_COLS - 4)),
      y: Math.max(0, Math.min(gy - 1, GRID_ROWS - 4)),
      w: 3,
      h: 3,
      type: 'normal',
      description: `Location ${id}. Describe what is here.`
    };

    // Check for overlap
    const overlap = checkRoomOverlap(newRoom, currentRooms);
    if (overlap) {
      statusText.textContent = `Warning: New location overlaps with Location ${overlap.id}`;
      setTimeout(() => { statusText.textContent = ''; }, 3000);
    }

    currentRooms.push(newRoom);
    setRooms(currentRooms);
    setSelectedRoomId(id);
    setPlacingMarker(false);
    placeMarkerBtn.textContent = 'Add Numbered Location';
    render();
    rebuildRoomList();
    saveToLocalStorage();
    return;
  }

  // Check if clicked on trap
  const clickedTrap = getTraps().find(trap => {
    const trapX = trap.x * GRID_SIZE + GRID_SIZE / 2;
    const trapY = trap.y * GRID_SIZE + GRID_SIZE / 2;
    const dist = Math.sqrt((x - trapX) ** 2 + (y - trapY) ** 2);
    return dist < GRID_SIZE * 0.5;
  });

  if (clickedTrap) {
    const action = confirm(`Trap: ${clickedTrap.trapType}\nDC ${clickedTrap.detectionDC}\nDamage: ${clickedTrap.damage}\n\nDelete this trap?`);
    if (action) {
      setTraps(getTraps().filter(t => t.id !== clickedTrap.id));
      saveState();
      saveToLocalStorage();
      render();
    }
    return;
  }

  // Check if clicking on a symbol
  const clickedSymbol = findSymbolAt(gx, gy);
  if (clickedSymbol) {
    // Check if it's a linked stair - show option to jump
    if ((clickedSymbol.type === 'stairs_up' || clickedSymbol.type === 'stairs_down' ||
         clickedSymbol.type === 'stairs_spiral') && clickedSymbol.linkedStair) {
      const targetLevel = clickedSymbol.linkedStair.levelIndex;
      const action = confirm(`This stair is linked to ${levels[targetLevel].name}.\n\nJump to that level?`);
      if (action) {
        switchToLevel(targetLevel);
        statusText.textContent = `Jumped to ${levels[targetLevel].name}`;
        setTimeout(() => { statusText.textContent = ''; }, 2000);
      }
      return;
    }

    setSelectedSymbol(clickedSymbol);
    setSelectedRoomId(null);
    document.getElementById('btnDeleteSymbol').disabled = false;
    render();
    return;
  }

  // Check if clicking on a room
  const room = roomAtCanvasPosition(x, y);
  if (room) {
    setSelectedRoomId(room.id);
    setSelectedSymbol(null);
    document.getElementById('btnDeleteSymbol').disabled = true;
    render();
    rebuildRoomList();
  } else {
    // Clicked empty space - deselect
    setSelectedRoomId(null);
    setSelectedSymbol(null);
    document.getElementById('btnDeleteSymbol').disabled = true;
    render();
    rebuildRoomList();
  }
}

// --- EXPORT MODAL FUNCTIONS ---
export function updateExportPreview() {
  const previewCanvas = document.getElementById('exportPreviewCanvas');
  const previewCtx = previewCanvas.getContext('2d');

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  const scale = Math.min(
    previewCanvas.width / 800,
    previewCanvas.height / 600
  );

  previewCtx.save();
  previewCtx.scale(scale, scale);

  const oldCtx = window.ctx;
  const oldStyle = window.renderStyle;
  const oldShowDmNotes = showDmNotes;

  window.ctx = previewCtx;
  window.renderStyle = document.querySelector('input[name="exportStyle"]:checked')?.value || 'dyson';

  // Respect includeDmNotes checkbox in export preview
  const includeDmNotes = document.getElementById('exportIncludeDmNotes')?.checked ?? false;
  setShowDmNotes(includeDmNotes);

  render();

  window.ctx = oldCtx;
  window.renderStyle = oldStyle;
  setShowDmNotes(oldShowDmNotes);

  previewCtx.restore();

  // Update info
  const res = parseInt(document.querySelector('input[name="exportRes"]:checked')?.value || '1');
  const w = 800 * res;
  const h = 600 * res;
  document.getElementById('exportInfo').textContent =
    `${w}×${h} @ ${res}x | ~${Math.round(w * h * 4 / 1024)} KB`;
}

// --- MOUSE INTERACTION (Drag + Click) ---
function setupCanvasInteraction() {
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setMouseDownPos({ x, y });
    setHasDragged(false);

    const room = roomAtCanvasPosition(x, y);
    if (room && !placingMarker) {
      setDraggingRoom(room);
      dragOffset.x = room.x - (x / GRID_SIZE);
      dragOffset.y = room.y - (y / GRID_SIZE);
      canvas.style.cursor = 'move';
      canvas.classList.add('dragging');
    }
  });

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // If ruler mode and have start point, show preview
    if (rulerMode && rulerStart && !rulerEnd) {
      const gx = Math.floor(x / GRID_SIZE);
      const gy = Math.floor(y / GRID_SIZE);
      setRulerEnd({x: gx, y: gy});
      render();
      return;
    }

    if (!draggingRoom) return;

    // Check if actually dragged (not just a tiny move)
    if (mouseDownPos && Math.abs(x - mouseDownPos.x) + Math.abs(y - mouseDownPos.y) > 5) {
      setHasDragged(true);
    }

    const newX = Math.floor(x / GRID_SIZE + dragOffset.x);
    const newY = Math.floor(y / GRID_SIZE + dragOffset.y);

    // Bounds check
    if (newX >= 0 && newX + draggingRoom.w <= GRID_COLS &&
        newY >= 0 && newY + draggingRoom.h <= GRID_ROWS) {
      draggingRoom.x = newX;
      draggingRoom.y = newY;
      render();
    }
  });

  canvas.addEventListener('mouseup', (event) => {
    if (draggingRoom && hasDragged) {
      // Check for overlap after drag
      const overlap = checkRoomOverlap(draggingRoom, getRooms(), draggingRoom.id);
      if (overlap) {
        statusText.textContent = `Warning: Overlaps with Location ${overlap.id}`;
        setTimeout(() => { statusText.textContent = ''; }, 3000);
      }
      saveState();
      saveToLocalStorage();
    }

    if (draggingRoom && !hasDragged) {
      // It was a click, not a drag
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      handleCanvasClick(x, y);
    } else if (!draggingRoom) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      handleCanvasClick(x, y);
    }

    setDraggingRoom(null);
    canvas.style.cursor = 'crosshair';
    canvas.classList.remove('dragging');
  });
}

// --- KEYBOARD SHORTCUTS ---
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // ESC key to cancel ruler mode
    if (event.key === 'Escape' && rulerMode) {
      setRulerMode(false);
      setRulerStart(null);
      setRulerEnd(null);
      document.getElementById('btnRulerMode').textContent = '📏 Measure Distance';
      document.getElementById('rulerHint').style.display = 'none';
      render();
      return;
    }

    // Delete key to remove selected room OR selected symbol
    if ((event.key === 'Delete' || event.key === 'Backspace')) {
      // Don't trigger if typing in a text field
      if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') return;
      event.preventDefault();

      if (selectedSymbol !== null) {
        deleteSymbol(selectedSymbol.id);
      } else if (selectedRoomId !== null) {
        deleteRoom(selectedRoomId);
      }
    }

    // Ctrl+Z for undo
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    }

    // Ctrl+Shift+Z or Ctrl+Y for redo
    if ((event.ctrlKey && event.shiftKey && event.key === 'z') || (event.ctrlKey && event.key === 'y')) {
      event.preventDefault();
      redo();
    }
  });
}

// --- BUTTON EVENT HANDLERS ---
function setupButtonHandlers() {
  newDungeonBtn.addEventListener('click', () => {
    setBackgroundImg(null);
    generateDungeon();
  });

  placeMarkerBtn.addEventListener('click', () => {
    const newPlacingMarker = !placingMarker;
    setPlacingMarker(newPlacingMarker);
    placeMarkerBtn.textContent = newPlacingMarker
      ? 'Click on Map to Place'
      : 'Add Numbered Location';
  });

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  renumberBtn.addEventListener('click', renumberRooms);

  // Place Encounter
  document.getElementById('btnPlaceEncounter').addEventListener('click', () => {
    const encounterType = document.getElementById('encounterTypeSelect').value;
    currentEncounterType = encounterType;
    placingEncounter = true;
    statusText.textContent = `Click on map to place ${encounterType}`;
  });

  // Clear Encounters
  document.getElementById('btnClearEncounters').addEventListener('click', () => {
    if (!confirm('Clear all monsters?')) return;
    setEncounters([]);
    render();
    saveToLocalStorage();
  });

  // Ruler Mode
  document.getElementById('btnRulerMode').addEventListener('click', () => {
    setRulerMode(!rulerMode);
    document.getElementById('btnRulerMode').textContent = rulerMode ? '📏 Ruler Active' : '📏 Measure Distance';
    document.getElementById('rulerHint').style.display = rulerMode ? 'block' : 'none';
    if (!rulerMode) {
      setRulerStart(null);
      setRulerEnd(null);
    }
    render();
  });
}

// --- FILE INPUT HANDLERS ---
function setupFileInputHandlers() {
  mapFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const img = new Image();
      img.onload = function() {
        setBackgroundImg(img);
        render();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // JSON Import - Handles both old single-level and new multi-level formats
  jsonFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const data = JSON.parse(ev.target.result);

        // Load UI settings
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

        // Check format
        if (data.version === '2.0-multilevel' && data.levels) {
          // Load multi-level
          setLevels(data.levels);
          setCurrentLevel(data.currentLevel || 0);
          console.log(`Imported multi-level dungeon: ${data.levels.length} levels`);

        } else {
          // Migrate old format
          console.log('Migrating old single-level import to multi-level...');

          // Handle both export formats (gridRect vs flat x,y,w,h)
          const importedRooms = (data.rooms || []).map(r => {
            if (r.gridRect) {
              // Old export format
              return {
                id: r.id,
                x: r.gridRect.x,
                y: r.gridRect.y,
                w: r.gridRect.w,
                h: r.gridRect.h,
                type: r.type || 'normal',
                description: r.description || ''
              };
            } else {
              // New flat format
              return {
                id: r.id,
                x: r.x,
                y: r.y,
                w: r.w,
                h: r.h,
                type: r.type || 'normal',
                description: r.description || ''
              };
            }
          });

          const migratedLevel = {
            id: 0,
            name: 'Level 1',
            depth: 0,
            rooms: importedRooms,
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
        if (typeof data.showDmNotes !== 'undefined') {
          setShowDmNotes(data.showDmNotes);
          const chkShowDmNotes = document.getElementById('chkShowDmNotes');
          if (chkShowDmNotes) chkShowDmNotes.checked = data.showDmNotes;
        }

        setSelectedRoomId(getRooms()[0]?.id ?? null);
        saveState();
        render();
        rebuildRoomList();
        saveToLocalStorage();
        statusText.textContent = 'Imported multi-level dungeon';
        setTimeout(() => { statusText.textContent = ''; }, 3000);
      } catch(err) {
        alert('Failed to import JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  });
}

// --- EXPORT HANDLERS ---
function setupExportHandlers() {
  // Phase 4: Export PNG - Show modal
  exportPngBtn.addEventListener('click', () => {
    document.getElementById('exportModal').style.display = 'block';
    updateExportPreview();
  });

  // Export modal handlers
  document.getElementById('btnExecuteExport').addEventListener('click', async () => {
    document.getElementById('exportModal').style.display = 'none';

    statusText.textContent = 'Exporting...';
    await exporter.export();
    statusText.textContent = 'Export complete!';
    setTimeout(() => { statusText.textContent = ''; }, 3000);
  });

  document.getElementById('btnCancelExport').addEventListener('click', () => {
    document.getElementById('exportModal').style.display = 'none';
  });

  document.getElementById('btnCloseExport').addEventListener('click', () => {
    document.getElementById('exportModal').style.display = 'none';
  });

  // Live preview update
  document.querySelectorAll('input[name="exportStyle"], input[name="exportLayout"], input[name="exportRes"]')
    .forEach(input => input.addEventListener('change', updateExportPreview));

  // Update preview when DM notes checkbox changes
  document.getElementById('exportIncludeDmNotes')?.addEventListener('change', updateExportPreview);

  // JSON Export
  exportJsonBtn.addEventListener('click', () => {
    // Warn if background image is loaded
    if (backgroundImg) {
      if (!confirm('Warning: Custom background images are not saved in JSON export. Only room data will be exported. Continue?')) {
        return;
      }
    }

    // Export entire multi-level structure
    const data = {
      version: '2.0-multilevel', // NEW
      levels: levels,
      currentLevel: getCurrentLevel(),
      // Global settings
      size: sizeSelect.value,
      density: densityRange.value,
      theme: themeSelect.value,
      algorithm: algorithmSelect.value,
      renderStyle: window.renderStyle
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dungeon_multilevel_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// --- ZOOM CONTROLS ---
function setupZoomControls() {
  zoomInBtn.addEventListener('click', () => setZoom(window.zoomLevel + 0.1));
  zoomOutBtn.addEventListener('click', () => setZoom(window.zoomLevel - 0.1));
  zoomResetBtn.addEventListener('click', () => setZoom(1.0));
}

// --- RENDER STYLE SELECTION ---
function setupRenderStyleHandlers() {
  renderStyleSelect.addEventListener('change', (e) => {
    setRenderStyle(e.target.value);

    // Update style preview text
    switch(window.renderStyle) {
      case 'dyson':
        stylePreview.textContent = '✨ Sketchy lines + cross-hatching';
        break;
      case 'vintage':
        stylePreview.textContent = '📘 TSR blue grid + hand-drawn';
        break;
      case 'modern':
        stylePreview.textContent = '💻 Clean digital lines';
        break;
    }

    render();
    saveToLocalStorage();
  });
}

// --- TEMPLATE LOADING ---
function setupTemplateHandlers() {
  loadTemplateBtn.addEventListener('click', () => {
    const templateName = templateSelect.value;
    if (!templateName || !TEMPLATES[templateName]) {
      alert('Please select a template');
      return;
    }

    saveState();
    const template = TEMPLATES[templateName];
    setRooms(JSON.parse(JSON.stringify(template.rooms))); // Deep clone
    setSelectedRoomId(getRooms()[0]?.id ?? null);
    setBackgroundImg(null);
    render();
    rebuildRoomList();
    saveToLocalStorage();
    statusText.textContent = `Loaded template: ${template.name}`;
    setTimeout(() => { statusText.textContent = ''; }, 3000);
  });

  clearStorageBtn.addEventListener('click', () => {
    if (confirm('Clear auto-saved data? This cannot be undone.')) {
      localStorage.removeItem('dungeonMaker_autoSave');
      setUndoStack([]);
      setRedoStack([]);
      updateUndoRedoButtons();
      statusText.textContent = 'Auto-save cleared';
      setTimeout(() => { statusText.textContent = ''; }, 3000);
    }
  });
}

// --- DENSITY SLIDER ---
function setupDensitySlider() {
  densityRange.addEventListener('input', (e) => {
    densityValue.textContent = e.target.value;
  });
}

// --- SYMBOL PLACEMENT INTERACTION (PHASE 2 + PHASE 6 EXPANSION) ---

// Symbol categories and their types
const symbolCategories = {
  basic: ['door', 'secret_door', 'locked_door', 'portcullis', 'stairs_up', 'stairs_down', 'stairs_spiral', 'pillar', 'chest', 'table', 'altar', 'statue'],
  terrain: ['fountain', 'statue2', 'altar2'],
  interactive: ['lever', 'brazier', 'chain'],
  containers: ['barrel', 'crate', 'sack'],
  dressing: ['bones', 'web', 'rubble'],
  natural: ['mushroom', 'plant', 'crystal', 'pool']
};

// Subtypes for each symbol type
const symbolSubtypes = {
  // Basic
  door: ['normal', 'wooden', 'metal'],
  secret_door: ['secret'],
  locked_door: ['locked'],
  portcullis: ['portcullis'],
  stairs_up: ['normal', 'spiral'],
  stairs_down: ['normal', 'spiral'],
  stairs_spiral: ['spiral'],
  pillar: ['round', 'square'],
  chest: ['closed', 'open'],
  table: ['wooden'],
  altar: ['stone'],
  statue: ['humanoid'],
  // Terrain Features
  fountain: ['ornate', 'simple', 'magical', 'dried'],
  statue2: ['humanoid', 'dragon', 'angel', 'demon'],
  altar2: ['stone', 'blood', 'holy', 'cursed'],
  // Interactive Objects
  lever: ['wall', 'floor', 'up', 'down'],
  brazier: ['lit', 'unlit', 'magical', 'cold'],
  chain: ['vertical', 'horizontal', 'hanging'],
  // Containers
  barrel: ['intact', 'broken', 'open'],
  crate: ['closed', 'open', 'broken'],
  sack: ['full', 'empty', 'coins'],
  // Room Dressing
  bones: ['pile', 'skull', 'skeleton'],
  web: ['corner', 'full', 'torn'],
  rubble: ['light', 'heavy', 'magical'],
  // Natural Elements
  mushroom: ['small', 'large', 'glowing', 'cluster'],
  plant: ['fern', 'vine', 'thorns', 'mushrooms'],
  crystal: ['blue', 'red', 'purple', 'cluster'],
  pool: ['water', 'blood', 'acid', 'magical']
};

// Friendly names for symbols
const symbolNames = {
  door: 'Door',
  secret_door: 'Secret Door',
  locked_door: 'Locked Door',
  portcullis: 'Portcullis',
  stairs_up: 'Stairs Up',
  stairs_down: 'Stairs Down',
  stairs_spiral: 'Spiral Stairs',
  pillar: 'Pillar',
  chest: 'Chest',
  table: 'Table',
  altar: 'Altar',
  statue: 'Statue',
  fountain: 'Fountain',
  statue2: 'Statue',
  altar2: 'Altar',
  lever: 'Lever',
  brazier: 'Brazier',
  chain: 'Chain',
  barrel: 'Barrel',
  crate: 'Crate',
  sack: 'Sack',
  bones: 'Bones',
  web: 'Spider Web',
  rubble: 'Rubble',
  mushroom: 'Mushroom',
  plant: 'Plant',
  crystal: 'Crystal',
  pool: 'Pool'
};

function setupSymbolHandlers() {
  const categorySelect = document.getElementById('symbolCategorySelect');
  const typeSelect = document.getElementById('symbolTypeSelect');
  const subtypeSelect = document.getElementById('symbolSubtypeSelect');
  const placeBtn = document.getElementById('btnPlaceSymbol');

  // Category selector handler
  categorySelect?.addEventListener('change', (e) => {
    const category = e.target.value;
    typeSelect.innerHTML = '';

    symbolCategories[category].forEach(symbolType => {
      const option = document.createElement('option');
      option.value = symbolType;
      option.textContent = symbolNames[symbolType] || symbolType.charAt(0).toUpperCase() + symbolType.slice(1);
      typeSelect.appendChild(option);
    });

    // Trigger type change to update subtypes
    typeSelect.dispatchEvent(new Event('change'));
  });

  // Symbol type selector handler
  typeSelect?.addEventListener('change', (e) => {
    const symbolType = e.target.value;
    subtypeSelect.innerHTML = '';

    // Get subtypes for this symbol type
    const subtypes = symbolSubtypes[symbolType] || ['default'];
    subtypes.forEach(subtype => {
      const option = document.createElement('option');
      option.value = subtype;
      option.textContent = subtype.charAt(0).toUpperCase() + subtype.slice(1);
      subtypeSelect.appendChild(option);
    });
  });

  // Place Symbol button handler
  placeBtn?.addEventListener('click', () => {
    const symbolType = typeSelect.value;
    const subtype = subtypeSelect.value;

    if (!symbolType) {
      alert('Please select a symbol type');
      return;
    }

    // Set placing mode
    setPlacingSymbolType(symbolType);
    setPlacingMarker(false); // Cancel room placement
    placeMarkerBtn.textContent = 'Add Numbered Location';

    // Update hint
    document.getElementById('symbolHint').textContent = `Click on map to place ${symbolNames[symbolType]} (${subtype})`;
    canvas.style.cursor = 'crosshair';
    statusText.textContent = `Click on map to place ${symbolNames[symbolType]}`;
  });

  // Auto-detect doors
  document.getElementById('btnAutoDetectDoors')?.addEventListener('click', () => {
    autoDetectDoors();
  });

  // Delete selected symbol
  document.getElementById('btnDeleteSymbol')?.addEventListener('click', () => {
    if (selectedSymbol) {
      deleteSymbol(selectedSymbol.id);
      document.getElementById('btnDeleteSymbol').disabled = true;
    }
  });

  // Clear all symbols
  document.getElementById('btnClearSymbols')?.addEventListener('click', () => {
    if (getSymbols().length === 0) {
      alert('No symbols to clear');
      return;
    }
    if (confirm(`Clear all ${getSymbols().length} symbols? This cannot be undone.`)) {
      saveState();
      setSymbols([]);
      setSelectedSymbol(null);
      document.getElementById('btnDeleteSymbol').disabled = true;
      render();
      saveToLocalStorage();
      statusText.textContent = 'All symbols cleared';
      setTimeout(() => { statusText.textContent = ''; }, 2000);
    }
  });

  // Initialize category selector on page load
  categorySelect?.dispatchEvent(new Event('change'));
}

// --- PHASE 3 EVENT HANDLERS (EFFECTS) ---
function setupEffectsHandlers() {
  document.getElementById('chkTitleBlock').addEventListener('change', (e) => {
    const effects = getEffectsEnabled();
    effects.titleBlock = e.target.checked;
    setEffectsEnabled(effects);
    render();
    saveToLocalStorage();
  });

  document.getElementById('chkCompass').addEventListener('change', (e) => {
    const effects = getEffectsEnabled();
    effects.compass = e.target.checked;
    setEffectsEnabled(effects);
    render();
    saveToLocalStorage();
  });

  document.getElementById('chkCoffeeStains').addEventListener('change', (e) => {
    const effects = getEffectsEnabled();
    effects.coffeeStains = e.target.checked;
    setEffectsEnabled(effects);
    if (e.target.checked && getCoffeeStains().length === 0) {
      generateCoffeeStains(3);
    }
    render();
    saveToLocalStorage();
  });

  document.getElementById('chkAgeSpots').addEventListener('change', (e) => {
    const effects = getEffectsEnabled();
    effects.ageSpots = e.target.checked;
    setEffectsEnabled(effects);
    render();
    saveToLocalStorage();
  });

  document.getElementById('dungeonNameInput').addEventListener('input', (e) => {
    const titleBlock = getTitleBlockData();
    titleBlock.dungeonName = e.target.value;
    setTitleBlockData(titleBlock);
    render();
  });

  document.getElementById('dmNameInput').addEventListener('input', (e) => {
    const titleBlock = getTitleBlockData();
    titleBlock.dmName = e.target.value;
    setTitleBlockData(titleBlock);
    render();
  });

  document.getElementById('btnRefreshEffects').addEventListener('click', () => {
    generateCoffeeStains(3);
    render();
    saveToLocalStorage();
    statusText.textContent = 'Effects regenerated';
    setTimeout(() => { statusText.textContent = ''; }, 2000);
  });
}

// --- PHASE 5: ANNOTATION HANDLERS ---
function setupAnnotationHandlers() {
  // Add Annotation
  document.getElementById('btnAddAnnotation').addEventListener('click', () => {
    const text = prompt('Enter annotation text:');
    if (!text) return;

    statusText.textContent = 'Click on map to place annotation';
    placingAnnotation = true;
    annotationText = text;
  });

  // Clear Annotations
  document.getElementById('btnClearAnnotations').addEventListener('click', () => {
    if (!confirm('Clear all annotations?')) return;
    setAnnotations([]);
    render();
    saveToLocalStorage();
  });
}

// --- ENCOUNTER MODAL HANDLERS ---
function setupEncounterHandlers() {
  // Encounter Modal - Save
  document.getElementById('btnSaveEncounter').addEventListener('click', () => {
    if (!pendingEncounterPosition) return;

    const newEncounter = {
      id: Date.now() + Math.random(),
      x: pendingEncounterPosition.x,
      y: pendingEncounterPosition.y,
      monsterType: document.getElementById('encounterName').value || currentEncounterType,
      count: parseInt(document.getElementById('encounterCount').value) || 1,
      ac: parseInt(document.getElementById('encounterAC').value) || 13,
      hp: document.getElementById('encounterHP').value || '7',
      difficulty: document.getElementById('encounterDifficulty').value || 'easy',
      behavior: document.getElementById('encounterBehavior').value || '',
      notes: document.getElementById('encounterNotes').value || ''
    };

    setEncounters([...getEncounters(), newEncounter]);
    saveState();
    saveToLocalStorage();
    render();

    // Close modal and reset
    document.getElementById('encounterModal').style.display = 'none';
    pendingEncounterPosition = null;

    // Clear form
    document.getElementById('encounterName').value = '';
    document.getElementById('encounterCount').value = 1;
    document.getElementById('encounterAC').value = 13;
    document.getElementById('encounterHP').value = '';
    document.getElementById('encounterBehavior').value = '';
    document.getElementById('encounterNotes').value = '';
  });

  // Encounter Modal - Cancel
  document.getElementById('btnCancelEncounter').addEventListener('click', () => {
    document.getElementById('encounterModal').style.display = 'none';
    pendingEncounterPosition = null;
  });

  // Encounter Modal - Close X
  document.getElementById('btnCloseEncounter').addEventListener('click', () => {
    document.getElementById('encounterModal').style.display = 'none';
    pendingEncounterPosition = null;
  });
}

// --- DM NOTES EVENT HANDLERS ---
function setupDmNotesHandlers() {
  // Toggle DM Notes visibility
  document.getElementById('chkShowDmNotes').addEventListener('change', (e) => {
    setShowDmNotes(e.target.checked);
    render();
  });

  // Add DM Note
  document.getElementById('btnAddDmNote').addEventListener('click', () => {
    const text = prompt('Enter secret DM note:');
    if (!text) return;

    statusText.textContent = 'Click on map to place secret note';
    placingDmNote = true;
    pendingDmNoteText = text;
  });

  // Clear DM Notes
  document.getElementById('btnClearDmNotes').addEventListener('click', () => {
    if (!confirm('Clear all DM notes?')) return;
    setDmNotes([]);
    render();
    saveToLocalStorage();
  });
}


// --- TRAP HANDLERS ---
function setupTrapHandlers() {
  // Place Trap
  document.getElementById('btnPlaceTrap').addEventListener('click', () => {
    const trapType = document.getElementById('trapTypeSelect').value;
    currentTrapType = trapType;
    placingTrap = true;
    statusText.textContent = `Click on map to place ${trapType} trap`;
  });

  // Clear Traps
  document.getElementById('btnClearTraps').addEventListener('click', () => {
    if (!confirm('Clear all traps?')) return;
    setTraps([]);
    render();
    saveToLocalStorage();
  });

  // Trap Modal - Save
  document.getElementById('btnSaveTrap').addEventListener('click', () => {
    if (!pendingTrapPosition) return;

    const newTrap = {
      id: Date.now() + Math.random(),
      x: pendingTrapPosition.x,
      y: pendingTrapPosition.y,
      trapType: currentTrapType,
      detectionDC: parseInt(document.getElementById('trapDetectionDC').value) || 15,
      disarmDC: parseInt(document.getElementById('trapDisarmDC').value) || 13,
      saveType: document.getElementById('trapSaveType').value || 'Dexterity',
      damage: document.getElementById('trapDamage').value || '',
      description: document.getElementById('trapDescription').value || ''
    };

    setTraps([...getTraps(), newTrap]);
    saveState();
    saveToLocalStorage();
    render();

    // Close modal and reset
    document.getElementById('trapModal').style.display = 'none';
    pendingTrapPosition = null;

    // Clear form
    document.getElementById('trapDetectionDC').value = 15;
    document.getElementById('trapDisarmDC').value = 13;
    document.getElementById('trapDamage').value = '';
    document.getElementById('trapDescription').value = '';
  });

  // Trap Modal - Cancel
  document.getElementById('btnCancelTrap').addEventListener('click', () => {
    document.getElementById('trapModal').style.display = 'none';
    pendingTrapPosition = null;
  });

  // Trap Modal - Close X
  document.getElementById('btnCloseTrap').addEventListener('click', () => {
    document.getElementById('trapModal').style.display = 'none';
    pendingTrapPosition = null;
  });
}

// --- STAIR LINKING HANDLERS ---
function setupStairLinkingHandlers() {
  // Radio button handlers
  document.querySelectorAll('input[name="stairDest"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const select = document.getElementById('stairDestLevel');
      const hint = document.getElementById('stairLinkHint');

      if (e.target.value === 'existing') {
        select.disabled = false;
        hint.textContent = 'A linked stair will be placed on the target level.';
      } else {
        select.disabled = true;
        hint.textContent = e.target.value === 'new' ?
          'A new level will be created with a linked stair.' :
          'Stair will be decorative only.';
      }
    });
  });

  // Save Stair Link button
  document.getElementById('btnSaveStairLink').addEventListener('click', () => {
    if (!pendingStair) return;

    const dest = document.querySelector('input[name="stairDest"]:checked').value;
    const currentLevelIdx = getCurrentLevel();

    saveState();

    // Create the stair
    const stair = {
      id: 'stair_' + Date.now() + '_' + Math.random(),
      type: pendingStair.type,
      subtype: pendingStair.subtype,
      x: pendingStair.x,
      y: pendingStair.y,
      direction: pendingStair.direction,
      roomId: null,
      linkedStair: null
    };

    if (dest === 'new') {
      // Create new level
      const newLevelDepth = pendingStair.direction === 'down' ?
        (levels[currentLevelIdx].depth - 1) :
        (levels[currentLevelIdx].depth + 1);
      const newLevelName = newLevelDepth < 0 ?
        `Basement ${Math.abs(newLevelDepth)}` :
        newLevelDepth > 0 ?
        `Tower ${newLevelDepth}` :
        'Ground Level';

      const newLevel = addLevel(newLevelName, newLevelDepth);

      // Create linked stair on new level (at center)
      const linkedStair = {
        id: 'stair_' + Date.now() + '_' + Math.random() + '_linked',
        type: pendingStair.direction === 'down' ? 'stairs_up' : 'stairs_down',
        subtype: pendingStair.subtype,
        x: Math.floor(GRID_COLS / 2),
        y: Math.floor(GRID_ROWS / 2),
        direction: pendingStair.direction === 'down' ? 'up' : 'down',
        roomId: null,
        linkedStair: {
          levelIndex: currentLevelIdx,
          stairId: stair.id
        }
      };

      newLevel.symbols.push(linkedStair);

      // Link back
      stair.linkedStair = {
        levelIndex: levels.length - 1,
        stairId: linkedStair.id
      };

      statusText.textContent = `Stairs linked to new ${newLevel.name}!`;

    } else if (dest === 'existing') {
      const targetLevelIdx = parseInt(document.getElementById('stairDestLevel').value);

      // Create linked stair on target level (at center)
      const linkedStair = {
        id: 'stair_' + Date.now() + '_' + Math.random() + '_linked',
        type: pendingStair.direction === 'down' ? 'stairs_up' : 'stairs_down',
        subtype: pendingStair.subtype,
        x: Math.floor(GRID_COLS / 2),
        y: Math.floor(GRID_ROWS / 2),
        direction: pendingStair.direction === 'down' ? 'up' : 'down',
        roomId: null,
        linkedStair: {
          levelIndex: currentLevelIdx,
          stairId: stair.id
        }
      };

      levels[targetLevelIdx].symbols.push(linkedStair);

      // Link back
      stair.linkedStair = {
        levelIndex: targetLevelIdx,
        stairId: linkedStair.id
      };

      statusText.textContent = `Stairs linked to ${levels[targetLevelIdx].name}!`;
    } else {
      statusText.textContent = 'Decorative stairs placed.';
    }

    // Add stair to current level
    const currentSymbols = getSymbols();
    currentSymbols.push(stair);
    setSymbols(currentSymbols);

    // Deselect room, select new stair
    setSelectedRoomId(null);
    setSelectedSymbol(stair);
    document.getElementById('btnDeleteSymbol').disabled = false;

    // Close modal
    document.getElementById('stairLinkModal').style.display = 'none';
    pendingStair = null;

    // Update level tabs if new level was created
    if (dest === 'new') {
      updateLevelTabs();
    }

    saveToLocalStorage();
    render();
    setTimeout(() => { statusText.textContent = ''; }, 3000);
  });

  // Cancel button
  document.getElementById('btnCancelStairLink').addEventListener('click', () => {
    document.getElementById('stairLinkModal').style.display = 'none';
    pendingStair = null;
  });

  // Close X button
  document.getElementById('btnCloseStairLink').addEventListener('click', () => {
    document.getElementById('stairLinkModal').style.display = 'none';
    pendingStair = null;
  });
}

// --- LEVEL NAVIGATION FUNCTIONS ---
export function updateLevelTabs() {
  const tabsContainer = document.getElementById('levelTabs');
  const addBtn = document.getElementById('btnAddLevel');

  // Clear existing tabs
  tabsContainer.innerHTML = '';

  // Create tab for each level
  levels.forEach((level, index) => {
    const tab = document.createElement('button');
    tab.className = 'level-tab' + (index === getCurrentLevel() ? ' active' : '');
    tab.dataset.level = index;

    const depthLabel = level.depth === 0 ? 'Ground' :
                       level.depth > 0 ? `Tower ${level.depth}` :
                       `Basement ${Math.abs(level.depth)}`;

    tab.innerHTML = `${level.name}<span class="level-depth">${depthLabel}</span>`;

    tab.addEventListener('click', () => switchToLevel(index));
    tabsContainer.appendChild(tab);
  });

  // Re-add the + button
  tabsContainer.appendChild(addBtn);

  // Update level name input
  document.getElementById('levelNameInput').value = levels[getCurrentLevel()].name;

  // Update delete button state
  document.getElementById('btnDeleteLevel').disabled = levels.length <= 1;
}

function switchToLevel(index) {
  saveState(); // Save current level state
  setCurrentLevel(index);
  updateLevelTabs();
  render();
  rebuildRoomList();
  statusText.textContent = `Switched to ${levels[index].name}`;
  setTimeout(() => { statusText.textContent = ''; }, 2000);
}

// --- TREASURE HANDLERS ---
function setupTreasureHandlers() {
  // Open treasure modal
  document.getElementById('btnOpenTreasure')?.addEventListener('click', () => {
    document.getElementById('treasureModal').style.display = 'block';
  });

  // Close treasure modal
  document.getElementById('treasureModalClose')?.addEventListener('click', () => {
    document.getElementById('treasureModal').style.display = 'none';
  });

  // Generate treasure button
  document.getElementById('btnGenerateTreasure')?.addEventListener('click', () => {
    const cr = parseInt(document.getElementById('treasureCR').value) || 5;
    const includeCoins = document.getElementById('treasureIncludeCoins').checked;
    const includeGems = document.getElementById('treasureIncludeGems').checked;
    const includeArt = document.getElementById('treasureIncludeArt').checked;
    const includeMagic = document.getElementById('treasureIncludeMagic').checked;

    lastGeneratedTreasure = generateTreasure(cr, includeCoins, includeGems, includeArt, includeMagic);
    const formatted = formatTreasure(lastGeneratedTreasure);

    document.getElementById('treasureOutput').textContent = formatted;
  });

  // Re-roll button (same as generate)
  document.getElementById('btnRerollTreasure')?.addEventListener('click', () => {
    document.getElementById('btnGenerateTreasure').click();
  });

  // Copy to clipboard button
  document.getElementById('btnCopyTreasure')?.addEventListener('click', () => {
    const text = document.getElementById('treasureOutput').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('btnCopyTreasure');
      const oldText = btn.textContent;
      btn.textContent = '✅ Copied!';
      setTimeout(() => { btn.textContent = oldText; }, 2000);
    });
  });

  // Add to DM notes button
  document.getElementById('btnAddTreasureToDmNotes')?.addEventListener('click', () => {
    if (!lastGeneratedTreasure) {
      alert('Generate treasure first!');
      return;
    }

    const formatted = formatTreasure(lastGeneratedTreasure);
    const dmNotes = getDmNotes();

    // Add as DM note annotation
    const newNote = {
      id: `dmnote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: Math.floor(GRID_COLS / 2),  // Center of map
      y: Math.floor(GRID_ROWS / 2),
      text: formatted,
      noteType: 'treasure',
      isSecret: true
    };

    setDmNotes([...dmNotes, newNote]);
    saveState();
    saveToLocalStorage();
    render();

    document.getElementById('treasureModal').style.display = 'none';
    statusText.textContent = 'Treasure added to DM Notes layer!';
    setTimeout(() => { statusText.textContent = ''; }, 3000);
  });
}

// --- TERRAIN HELPER FUNCTION ---
function getTerrainMetadata(type) {
  const metadata = {
    water: { moveCost: 2, damage: null, dc: null, saveType: null },
    lava: { moveCost: null, damage: '4d10 fire', dc: null, saveType: null },
    pit: { moveCost: null, damage: '1d6 bludgeoning', dc: null, saveType: 'Dex' },
    difficult: { moveCost: 2, damage: null, dc: null, saveType: null },
    darkness: { moveCost: 1, damage: null, dc: null, saveType: null, obscured: 'heavily' },
    ice: { moveCost: 1, damage: null, dc: 10, saveType: 'Dex', effect: 'prone on fail' },
    poison: { moveCost: 1, damage: '2d8 poison', dc: 12, saveType: 'Con' }
  };
  return metadata[type] || {};
}

// --- TERRAIN EVENT HANDLERS ---
function setupTerrainHandlers() {
  // Brush size slider
  const brushSizeRange = document.getElementById('terrainBrushSize');
  const brushSizeLabel = document.getElementById('brushSizeLabel');
  brushSizeRange?.addEventListener('input', (e) => {
    terrainBrushSize = parseInt(e.target.value);
    brushSizeLabel.textContent = `${terrainBrushSize} grid`;
  });

  // Paint mode button
  document.getElementById('btnPaintTerrain')?.addEventListener('click', () => {
    paintingTerrain = !paintingTerrain;
    erasingTerrain = false;
    const btn = document.getElementById('btnPaintTerrain');
    btn.textContent = paintingTerrain ? '🖌️ Painting...' : '🖌️ Paint Mode';
    btn.style.background = paintingTerrain ? '#4a9eff' : '';
    const eraseBtn = document.getElementById('btnEraseTerrain');
    if (eraseBtn) eraseBtn.style.background = '';
    if (paintingTerrain) {
      statusText.textContent = 'Click on map to paint terrain';
    } else {
      statusText.textContent = '';
    }
  });

  // Erase mode button
  document.getElementById('btnEraseTerrain')?.addEventListener('click', () => {
    erasingTerrain = !erasingTerrain;
    paintingTerrain = false;
    const btn = document.getElementById('btnEraseTerrain');
    btn.textContent = erasingTerrain ? '🧹 Erasing...' : '🧹 Erase Terrain';
    btn.style.background = erasingTerrain ? '#ff6b6b' : '';
    const paintBtn = document.getElementById('btnPaintTerrain');
    if (paintBtn) paintBtn.style.background = '';
    if (erasingTerrain) {
      statusText.textContent = 'Click on terrain to erase';
    } else {
      statusText.textContent = '';
    }
  });

  // Clear all button
  document.getElementById('btnClearAllTerrain')?.addEventListener('click', () => {
    if (confirm('Clear all terrain on this level?')) {
      setTerrainLayers([]);
      saveState();
      saveToLocalStorage();
      render();
      statusText.textContent = 'All terrain cleared';
      setTimeout(() => { statusText.textContent = ''; }, 2000);
    }
  });
}

// --- LEVEL NAVIGATION EVENT HANDLERS ---
function setupLevelHandlers() {
  // Add Level button
  document.getElementById('btnAddLevel').addEventListener('click', () => {
    const newLevel = addLevel(`Level ${levels.length + 1}`);
    switchToLevel(levels.length - 1);
    statusText.textContent = 'New level created!';
    setTimeout(() => { statusText.textContent = ''; }, 2000);
  });

  // Delete Level button
  document.getElementById('btnDeleteLevel').addEventListener('click', () => {
    if (levels.length <= 1) return;
    if (!confirm(`Delete ${levels[getCurrentLevel()].name}? This cannot be undone.`)) return;

    const currentIdx = getCurrentLevel();
    removeLevel(currentIdx);
    setCurrentLevel(Math.min(currentIdx, levels.length - 1));
    updateLevelTabs();
    render();
    rebuildRoomList();
  });

  // Level name input
  document.getElementById('levelNameInput').addEventListener('change', (e) => {
    levels[getCurrentLevel()].name = e.target.value;
    updateLevelTabs();
    saveToLocalStorage();
  });
}
// --- MAIN INITIALIZATION FUNCTION ---
export function setupEventHandlers() {
  setupCanvasInteraction();
  setupKeyboardShortcuts();
  setupButtonHandlers();
  setupFileInputHandlers();
  setupExportHandlers();
  setupZoomControls();
  setupRenderStyleHandlers();
  setupTemplateHandlers();
  setupDensitySlider();
  setupSymbolHandlers();
  setupEffectsHandlers();
  setupAnnotationHandlers();
  setupTrapHandlers();
  setupDmNotesHandlers();
  setupEncounterHandlers();
  setupLevelHandlers();
  setupStairLinkingHandlers();
  setupTreasureHandlers();
  setupTerrainHandlers();

  // Initialize level tabs on startup
  updateLevelTabs();
}
