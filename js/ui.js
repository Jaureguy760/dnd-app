// --- UI EVENT HANDLERS AND INTERACTION CODE ---

import {
  canvas, ctx, GRID_SIZE, GRID_COLS, GRID_ROWS, rooms, selectedRoomId, placingMarker,
  symbols, selectedSymbol, placingSymbolType, effectsEnabled, coffeeStains, titleBlockData,
  backgroundImg, draggingRoom, dragOffset, mouseDownPos, hasDragged, statusText,
  roomListEl, newDungeonBtn, mapFileInput, jsonFileInput, placeMarkerBtn, exportPngBtn,
  exportJsonBtn, sizeSelect, densityRange, densityValue, themeSelect, algorithmSelect,
  templateSelect, loadTemplateBtn, clearStorageBtn, zoomInBtn, zoomOutBtn, zoomResetBtn,
  undoBtn, redoBtn, renumberBtn, renderStyleSelect, stylePreview, TEMPLATES,
  rulerMode, rulerStart, rulerEnd, encounters, annotations, dmNotes, showDmNotes,
  setRooms, setSelectedRoomId, setPlacingMarker, setBackgroundImg, setDraggingRoom,
  setSymbols, setSelectedSymbol, setPlacingSymbolType, setEffectsEnabled, setTitleBlockData,
  setUndoStack, setRedoStack, setMouseDownPos, setHasDragged, setRenderStyle,
  setRulerMode, setRulerStart, setRulerEnd, setEncounters, setAnnotations,
  traps, setTraps, setDmNotes, setShowDmNotes
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

// --- ROOM LIST UI ---
export function rebuildRoomList() {
  roomListEl.innerHTML = '';
  rooms
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
  setRooms(rooms.filter(r => r.id !== roomId));
  if (selectedRoomId === roomId) {
    setSelectedRoomId(rooms[0]?.id ?? null);
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
  for (const room of rooms) {
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
  return symbols.find(s => s.x === gx && s.y === gy);
}

export function deleteSymbol(symbolId) {
  setSymbols(symbols.filter(s => s.id !== symbolId));
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
  const isRoom = rooms.some(r =>
    gx >= r.x && gx < r.x + r.w && gy >= r.y && gy < r.y + r.h
  );

  return !isWall && !isRoom;
}

function doorExistsAt(x, y) {
  return symbols.some(s =>
    (s.type === 'door' || s.type === 'secret_door' ||
     s.type === 'locked_door' || s.type === 'portcullis') &&
    s.x === x && s.y === y
  );
}

export function autoDetectDoors() {
  const newDoors = [];

  rooms.forEach(room => {
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

  symbols.push(...newDoors);
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

    setDmNotes([...dmNotes, newNote]);
    saveState();
    saveToLocalStorage();
    render();

    placingDmNote = false;
    pendingDmNoteText = '';
    statusText.textContent = '';
    return;
  }

  // Check if clicked on DM note (only when visible)
  if (showDmNotes) {
    const clickedNote = dmNotes.find(note => {
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
          setDmNotes([...dmNotes]);
          saveState();
          saveToLocalStorage();
          render();
        }
      } else {
        setDmNotes(dmNotes.filter(n => n.id !== clickedNote.id));
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
    setAnnotations([...annotations, newAnnotation]);
    saveState();
    saveToLocalStorage();

    placingAnnotation = false;
    annotationText = '';
    statusText.textContent = '';
    render();
    return;
  }

  // Check if clicked on annotation
  const clickedAnnotation = annotations.find(ann => {
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
        setAnnotations([...annotations]);
        saveState();
        saveToLocalStorage();
        render();
      }
    } else {
      setAnnotations(annotations.filter(a => a.id !== clickedAnnotation.id));
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
    saveState();

    // Determine direction based on symbol type
    let direction = 'north';
    let subtype = document.querySelector(`.symbol-btn[data-symbol="${placingSymbolType}"]`)?.dataset.subtype || 'normal';

    if (placingSymbolType.includes('stairs')) {
      direction = placingSymbolType.includes('up') ? 'up' : 'down';
    }

    const newSymbol = {
      id: Date.now() + Math.random(),
      type: placingSymbolType,
      subtype: subtype,
      x: gx,
      y: gy,
      direction: direction,
      roomId: null
    };

    symbols.push(newSymbol);
    render();
    saveToLocalStorage();

    // Deselect room, select symbol
    setSelectedRoomId(null);
    setSelectedSymbol(newSymbol);

  // Check if clicked on encounter
  const clickedEncounter = encounters.find(enc => {
    const encX = enc.x * GRID_SIZE + GRID_SIZE / 2;
    const encY = enc.y * GRID_SIZE + GRID_SIZE / 2;
    const dist = Math.sqrt((x - encX) ** 2 + (y - encY) ** 2);
    return dist < GRID_SIZE * 0.5;
  });

  if (clickedEncounter) {
    const info = `${clickedEncounter.count}x ${clickedEncounter.monsterType}\nAC: ${clickedEncounter.ac}, HP: ${clickedEncounter.hp}\nBehavior: ${clickedEncounter.behavior || 'None'}\n\nDelete this encounter?`;
    const action = confirm(info);
    if (action) {
      setEncounters(encounters.filter(e => e.id !== clickedEncounter.id));
      saveState();
      saveToLocalStorage();
      render();
    }
    return;
  }
    document.getElementById('btnDeleteSymbol').disabled = false;

    statusText.textContent = `Placed ${placingSymbolType}`;
    setTimeout(() => { statusText.textContent = ''; }, 2000);

    // Keep placing mode active (comment out to place one at a time)
    // setPlacingSymbolType(null);
    // document.querySelectorAll('.symbol-btn').forEach(b => b.classList.remove('active'));

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
    const id = rooms.length ? Math.max(...rooms.map(r => r.id)) + 1 : 1;
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
    const overlap = checkRoomOverlap(newRoom, rooms);
    if (overlap) {
      statusText.textContent = `Warning: New location overlaps with Location ${overlap.id}`;
      setTimeout(() => { statusText.textContent = ''; }, 3000);
    }

    rooms.push(newRoom);
    setSelectedRoomId(id);
    setPlacingMarker(false);
    placeMarkerBtn.textContent = 'Add Numbered Location';
    render();
    rebuildRoomList();
    saveToLocalStorage();
    return;
  }

  // Check if clicked on trap
  const clickedTrap = traps.find(trap => {
    const trapX = trap.x * GRID_SIZE + GRID_SIZE / 2;
    const trapY = trap.y * GRID_SIZE + GRID_SIZE / 2;
    const dist = Math.sqrt((x - trapX) ** 2 + (y - trapY) ** 2);
    return dist < GRID_SIZE * 0.5;
  });

  if (clickedTrap) {
    const action = confirm(`Trap: ${clickedTrap.trapType}\nDC ${clickedTrap.detectionDC}\nDamage: ${clickedTrap.damage}\n\nDelete this trap?`);
    if (action) {
      setTraps(traps.filter(t => t.id !== clickedTrap.id));
      saveState();
      saveToLocalStorage();
      render();
    }
    return;
  }

  // Check if clicking on a symbol
  const clickedSymbol = findSymbolAt(gx, gy);
  if (clickedSymbol) {
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
      const overlap = checkRoomOverlap(draggingRoom, rooms, draggingRoom.id);
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

  // JSON Import - FIXED to handle both formats
  jsonFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const data = JSON.parse(ev.target.result);
        sizeSelect.value = data.size || 'medium';
        densityRange.value = data.density || 5;
        densityValue.textContent = data.density || 5;
        themeSelect.value = data.theme || 'classic';
        algorithmSelect.value = data.algorithm || 'rooms';
        setRenderStyle(data.renderStyle || 'dyson');
        renderStyleSelect.value = data.renderStyle || 'dyson';

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
        setRooms(importedRooms);

        // Phase 2: Load symbols from JSON
        setSymbols(data.symbols || []);

        // Phase 3: Load effects data from JSON
        if (data.effectsEnabled) {
          setEffectsEnabled(data.effectsEnabled);
          document.getElementById('chkTitleBlock').checked = effectsEnabled.titleBlock;
          document.getElementById('chkCompass').checked = effectsEnabled.compass;
          document.getElementById('chkCoffeeStains').checked = effectsEnabled.coffeeStains;
          document.getElementById('chkAgeSpots').checked = effectsEnabled.ageSpots;
        }
        if (data.coffeeStains) {
          coffeeStains.splice(0, coffeeStains.length, ...data.coffeeStains);
        }
        if (data.titleBlockData) {
          setTitleBlockData(data.titleBlockData);
          document.getElementById('dungeonNameInput').value = titleBlockData.dungeonName;
          document.getElementById('dmNameInput').value = titleBlockData.dmName;
        }

        // Load encounters
        if (data.encounters) setEncounters(data.encounters);

        // Phase 5: Load annotations, traps, DM notes
        if (data.annotations) setAnnotations(data.annotations);
        if (data.traps) setTraps(data.traps);
        if (data.dmNotes) setDmNotes(data.dmNotes);
        if (typeof data.showDmNotes !== 'undefined') setShowDmNotes(data.showDmNotes);

        setSelectedRoomId(rooms[0]?.id ?? null);
        saveState();
        render();
        rebuildRoomList();
        saveToLocalStorage();
        statusText.textContent = 'Imported from JSON';
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

    const data = {
      size: sizeSelect.value,
      density: densityRange.value,
      theme: themeSelect.value,
      algorithm: algorithmSelect.value,
      renderStyle: window.renderStyle,
      rooms: rooms.map(r => ({
        id: r.id,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        type: r.type,
        description: r.description
      })),
      symbols: symbols.map(s => ({
        id: s.id,
        type: s.type,
        subtype: s.subtype,
        x: s.x,
        y: s.y,
        direction: s.direction,
        roomId: s.roomId
      })),
      effectsEnabled: effectsEnabled,
      coffeeStains: coffeeStains,
      titleBlockData: titleBlockData,
      encounters: encounters,
      // PHASE 5 additions:
      annotations: annotations,
      traps: traps,
      dmNotes: dmNotes,
      showDmNotes: showDmNotes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dungeon_data.json';
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
    setSelectedRoomId(rooms[0]?.id ?? null);
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

// --- SYMBOL PLACEMENT INTERACTION (PHASE 2) ---
function setupSymbolHandlers() {
  document.querySelectorAll('.symbol-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Toggle placing mode
      if (placingSymbolType === e.target.dataset.symbol) {
        // Cancel if clicking same button
        setPlacingSymbolType(null);
        document.querySelectorAll('.symbol-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('symbolHint').textContent = 'Click a symbol button, then click on the map to place it.';
        canvas.style.cursor = 'crosshair';
      } else {
        setPlacingSymbolType(e.target.dataset.symbol);
        setPlacingMarker(false); // Cancel room placement
        placeMarkerBtn.textContent = 'Add Numbered Location';

        // Highlight active button
        document.querySelectorAll('.symbol-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        document.getElementById('symbolHint').textContent = `Click on map to place ${e.target.textContent}`;
        canvas.style.cursor = 'crosshair';
      }
    });
  });

  document.getElementById('btnAutoDetectDoors').addEventListener('click', () => {
    autoDetectDoors();
  });

  document.getElementById('btnDeleteSymbol').addEventListener('click', () => {
    if (selectedSymbol) {
      deleteSymbol(selectedSymbol.id);
      document.getElementById('btnDeleteSymbol').disabled = true;
    }
  });

  document.getElementById('btnClearSymbols').addEventListener('click', () => {
    if (symbols.length === 0) {
      alert('No symbols to clear');
      return;
    }
    if (confirm(`Clear all ${symbols.length} symbols? This cannot be undone.`)) {
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
}

// --- PHASE 3 EVENT HANDLERS (EFFECTS) ---
function setupEffectsHandlers() {
  document.getElementById('chkTitleBlock').addEventListener('change', (e) => {
    effectsEnabled.titleBlock = e.target.checked;
    render();
    saveToLocalStorage();
  });

  document.getElementById('chkCompass').addEventListener('change', (e) => {
    effectsEnabled.compass = e.target.checked;
    render();
    saveToLocalStorage();
  });

  document.getElementById('chkCoffeeStains').addEventListener('change', (e) => {
    effectsEnabled.coffeeStains = e.target.checked;
    if (e.target.checked && coffeeStains.length === 0) {
      generateCoffeeStains(3);
    }
    render();
    saveToLocalStorage();
  });

  document.getElementById('chkAgeSpots').addEventListener('change', (e) => {
    effectsEnabled.ageSpots = e.target.checked;
    render();
    saveToLocalStorage();
  });

  document.getElementById('dungeonNameInput').addEventListener('input', (e) => {
    titleBlockData.dungeonName = e.target.value;
    render();
  });

  document.getElementById('dmNameInput').addEventListener('input', (e) => {
    titleBlockData.dmName = e.target.value;
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

    setEncounters([...encounters, newEncounter]);
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

    setTraps([...traps, newTrap]);
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
}
