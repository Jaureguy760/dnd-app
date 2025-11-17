// --- UI EVENT HANDLERS AND INTERACTION CODE ---

import {
  canvas, ctx, GRID_SIZE, GRID_COLS, GRID_ROWS, rooms, selectedRoomId, placingMarker,
  symbols, selectedSymbol, placingSymbolType, effectsEnabled, coffeeStains, titleBlockData,
  backgroundImg, draggingRoom, dragOffset, mouseDownPos, hasDragged, statusText,
  roomListEl, newDungeonBtn, mapFileInput, jsonFileInput, placeMarkerBtn, exportPngBtn,
  exportJsonBtn, sizeSelect, densityRange, densityValue, themeSelect, algorithmSelect,
  templateSelect, loadTemplateBtn, clearStorageBtn, zoomInBtn, zoomOutBtn, zoomResetBtn,
  undoBtn, redoBtn, renumberBtn, renderStyleSelect, stylePreview, TEMPLATES,
  setRooms, setSelectedRoomId, setPlacingMarker, setBackgroundImg, setDraggingRoom,
  setSymbols, setSelectedSymbol, setPlacingSymbolType, setEffectsEnabled, setTitleBlockData,
  setUndoStack, setRedoStack, setMouseDownPos, setHasDragged, setRenderStyle
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
    document.getElementById('btnDeleteSymbol').disabled = false;

    statusText.textContent = `Placed ${placingSymbolType}`;
    setTimeout(() => { statusText.textContent = ''; }, 2000);

    // Keep placing mode active (comment out to place one at a time)
    // setPlacingSymbolType(null);
    // document.querySelectorAll('.symbol-btn').forEach(b => b.classList.remove('active'));

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

  window.ctx = previewCtx;
  window.renderStyle = document.querySelector('input[name="exportStyle"]:checked')?.value || 'dyson';

  render();

  window.ctx = oldCtx;
  window.renderStyle = oldStyle;

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
    if (!draggingRoom) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

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
      titleBlockData: titleBlockData
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
}
