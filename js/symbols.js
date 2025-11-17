import { ctx, GRID_SIZE, GRID_COLS, GRID_ROWS, rooms, symbols, selectedSymbol, setSymbols, setSelectedSymbol, statusText } from './state.js';
import { getWallRegions } from './renderer.js';
import { render } from './renderer.js';
import { saveState } from './main.js';

// --- SYMBOL RENDERING FUNCTIONS (PHASE 2) ---

export function drawArrow(x1, y1, x2, y2, size = 5) {
  // Draw arrow from (x1,y1) to (x2,y2)
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - size * Math.cos(angle - Math.PI / 6),
    y2 - size * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - size * Math.cos(angle + Math.PI / 6),
    y2 - size * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

export function drawDoor(symbol) {
  const px = symbol.x * GRID_SIZE;
  const py = symbol.y * GRID_SIZE;
  const isVertical = (symbol.direction === 'east' || symbol.direction === 'west');

  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#654321'; // Wood brown
  ctx.lineWidth = 2;

  if (symbol.subtype === 'secret') {
    // Secret door - dashed outline with 'S'
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 2, py + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    ctx.setLineDash([]);
    ctx.restore();

    ctx.font = '10px serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', px + GRID_SIZE/2, py + GRID_SIZE/2);

  } else if (symbol.subtype === 'portcullis') {
    // Portcullis - grid of bars
    const bars = 5;
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;

    if (isVertical) {
      for (let i = 0; i <= bars; i++) {
        const x = px + (i / bars) * GRID_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, py);
        ctx.lineTo(x, py + GRID_SIZE);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i <= bars; i++) {
        const y = py + (i / bars) * GRID_SIZE;
        ctx.beginPath();
        ctx.moveTo(px, y);
        ctx.lineTo(px + GRID_SIZE, y);
        ctx.stroke();
      }
    }

  } else {
    // Normal/locked door - rectangle across opening
    if (isVertical) {
      ctx.fillRect(px - 1, py + GRID_SIZE * 0.3, 2, GRID_SIZE * 0.4);
      ctx.strokeRect(px - 1, py + GRID_SIZE * 0.3, 2, GRID_SIZE * 0.4);
    } else {
      ctx.fillRect(px + GRID_SIZE * 0.3, py - 1, GRID_SIZE * 0.4, 2);
      ctx.strokeRect(px + GRID_SIZE * 0.3, py - 1, GRID_SIZE * 0.4, 2);
    }

    // Lock symbol for locked doors
    if (symbol.subtype === 'locked') {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(px + GRID_SIZE/2, py + GRID_SIZE/2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawStairs(symbol) {
  const px = symbol.x * GRID_SIZE;
  const py = symbol.y * GRID_SIZE;

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;

  if (symbol.subtype === 'spiral') {
    // Spiral stairs
    const centerX = px + GRID_SIZE/2;
    const centerY = py + GRID_SIZE/2;
    const maxRadius = GRID_SIZE * 0.35;

    ctx.beginPath();
    for (let angle = 0; angle < Math.PI * 4; angle += 0.15) {
      const radius = (angle / (Math.PI * 4)) * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (angle === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Direction arrow
    const arrowY = symbol.direction === 'up' ? centerY - 8 : centerY + 8;
    drawArrow(centerX, centerY, centerX, arrowY, 4);

  } else {
    // Regular stairs - parallel lines
    const stepCount = 6;
    const stepSpacing = GRID_SIZE / stepCount;

    for (let i = 0; i < stepCount; i++) {
      const offset = i * stepSpacing;
      ctx.beginPath();
      ctx.moveTo(px + 2, py + offset);
      ctx.lineTo(px + GRID_SIZE - 2, py + offset);
      ctx.stroke();
    }

    // Direction indicator
    const arrowY = symbol.direction === 'up' ? py + GRID_SIZE * 0.2 : py + GRID_SIZE * 0.8;
    const targetY = symbol.direction === 'up' ? py + 2 : py + GRID_SIZE - 2;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    drawArrow(px + GRID_SIZE/2, arrowY, px + GRID_SIZE/2, targetY, 4);
  }
}

export function drawPillar(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const radius = GRID_SIZE * 0.3;

  ctx.fillStyle = '#666';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;

  if (symbol.subtype === 'square') {
    // Square pillar
    ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    ctx.strokeRect(px - radius, py - radius, radius * 2, radius * 2);
  } else {
    // Round pillar (default)
    ctx.beginPath();
    const segments = 12;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const wobble = 0.5;
      const r = radius + (Math.random() - 0.5) * wobble;
      const x = px + Math.cos(angle) * r;
      const y = py + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

export function drawFurniture(symbol) {
  const px = symbol.x * GRID_SIZE;
  const py = symbol.y * GRID_SIZE;

  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#8B4513'; // Saddle brown
  ctx.lineWidth = 1;

  switch(symbol.type) {
    case 'chest':
      const chestW = GRID_SIZE * 0.6;
      const chestH = GRID_SIZE * 0.4;
      const chestX = px + (GRID_SIZE - chestW) / 2;
      const chestY = py + (GRID_SIZE - chestH) / 2;

      ctx.fillRect(chestX, chestY, chestW, chestH);
      ctx.strokeRect(chestX, chestY, chestW, chestH);

      // Lid line
      ctx.beginPath();
      ctx.moveTo(chestX, chestY + chestH * 0.4);
      ctx.lineTo(chestX + chestW, chestY + chestH * 0.4);
      ctx.stroke();

      // Lock
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(chestX + chestW/2, chestY + chestH * 0.6, 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'table':
      const tableW = GRID_SIZE * 0.7;
      const tableH = GRID_SIZE * 0.5;
      ctx.fillRect(px + (GRID_SIZE - tableW)/2, py + (GRID_SIZE - tableH)/2, tableW, tableH);
      ctx.strokeRect(px + (GRID_SIZE - tableW)/2, py + (GRID_SIZE - tableH)/2, tableW, tableH);
      break;

    case 'altar':
      const altarW = GRID_SIZE * 0.7;
      const altarH = GRID_SIZE * 0.6;
      const altarX = px + (GRID_SIZE - altarW) / 2;
      const altarY = py + (GRID_SIZE - altarH) / 2;

      // Base (wider)
      ctx.fillRect(altarX - 3, altarY + altarH * 0.7, altarW + 6, altarH * 0.3);
      ctx.strokeRect(altarX - 3, altarY + altarH * 0.7, altarW + 6, altarH * 0.3);

      // Top
      ctx.fillRect(altarX, altarY, altarW, altarH * 0.7);
      ctx.strokeRect(altarX, altarY, altarW, altarH * 0.7);
      break;

    case 'statue':
      const statueR = GRID_SIZE * 0.2;
      const statueX = px + GRID_SIZE/2;
      const statueY = py + GRID_SIZE/2;

      // Base
      ctx.fillRect(statueX - statueR * 1.5, statueY + statueR, statueR * 3, statueR);
      ctx.strokeRect(statueX - statueR * 1.5, statueY + statueR, statueR * 3, statueR);

      // Column
      ctx.fillRect(statueX - statueR, statueY - statueR * 2, statueR * 2, statueR * 3);
      ctx.strokeRect(statueX - statueR, statueY - statueR * 2, statueR * 2, statueR * 3);
      break;
  }
}

export function renderSymbols() {
  symbols.forEach(symbol => {
    ctx.save();

    // Render based on symbol type
    if (symbol.type === 'door' || symbol.type === 'secret_door' ||
        symbol.type === 'locked_door' || symbol.type === 'portcullis') {
      drawDoor(symbol);
    } else if (symbol.type === 'stairs_up' || symbol.type === 'stairs_down' ||
               symbol.type === 'stairs_spiral') {
      drawStairs(symbol);
    } else if (symbol.type === 'pillar') {
      drawPillar(symbol);
    } else if (symbol.type === 'chest' || symbol.type === 'table' ||
               symbol.type === 'altar' || symbol.type === 'statue') {
      drawFurniture(symbol);
    }

    // Highlight if selected
    if (selectedSymbol && selectedSymbol.id === symbol.id) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(symbol.x * GRID_SIZE - 2, symbol.y * GRID_SIZE - 2,
                     GRID_SIZE + 4, GRID_SIZE + 4);
      ctx.setLineDash([]);
    }

    ctx.restore();
  });
}

export function isCorridorAt(gx, gy) {
  if (gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) return false;

  const wallGrid = getWallRegions();
  const isWall = wallGrid[gy][gx];
  const isRoom = rooms.some(r =>
    gx >= r.x && gx < r.x + r.w && gy >= r.y && gy < r.y + r.h
  );

  return !isWall && !isRoom;
}

export function doorExistsAt(x, y) {
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

  statusText.textContent = `Auto-detected ${newDoors.length} doors`;
  setTimeout(() => { statusText.textContent = ''; }, 3000);

  return newDoors.length;
}

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
}
