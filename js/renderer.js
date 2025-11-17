import { canvas, ctx, GRID_SIZE, GRID_COLS, GRID_ROWS, rooms, selectedRoomId, backgroundImg, renderStyle } from './state.js';
import { renderSymbols } from './symbols.js';
import { renderCoffeeStains, drawTitleBlock, getCompassPosition, drawCompassRose, drawAgeSpots } from './effects.js';
import { getRoomColor } from './main.js';

// --- HAND-DRAWN LINE RENDERING (DYSON STYLE) ---

export function drawHandDrawnLine(x1, y1, x2, y2, roughness = 1.5) {
  // Create organic, wobbly line using bezier curves
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const segments = Math.max(3, Math.floor(length / 15));

  ctx.beginPath();
  ctx.moveTo(x1, y1);

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x = x1 + dx * t;
    const y = y1 + dy * t;

    // Add perpendicular wobble
    const wobbleX = (Math.random() - 0.5) * roughness;
    const wobbleY = (Math.random() - 0.5) * roughness;

    // Control points for bezier curve
    const cpx = x + wobbleX;
    const cpy = y + wobbleY;

    if (i === segments) {
      ctx.lineTo(x2, y2);
    } else {
      ctx.quadraticCurveTo(cpx, cpy, x, y);
    }
  }

  ctx.stroke();
}

export function drawHandDrawnRect(x, y, w, h, roughness = 1.5) {
  // Draw each side with slight wobble
  drawHandDrawnLine(x, y, x + w, y, roughness);
  drawHandDrawnLine(x + w, y, x + w, y + h, roughness);
  drawHandDrawnLine(x + w, y + h, x, y + h, roughness);
  drawHandDrawnLine(x, y + h, x, y, roughness);
}

export function fillCrossHatch(x, y, w, h, angle = 45, spacing = 8) {
  // Fill area with diagonal hatching lines
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const angleRad = angle * Math.PI / 180;
  const maxDim = Math.max(w, h) * 2;

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;

  for (let i = -maxDim; i < maxDim; i += spacing) {
    const x1 = x + i;
    const y1 = y;
    const x2 = x + i + maxDim * Math.cos(angleRad);
    const y2 = y + maxDim * Math.sin(angleRad);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}

export function getWallRegions() {
  // Create grid to mark rooms and corridors
  const grid = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(true));

  // Mark rooms as non-wall
  rooms.forEach(room => {
    for (let gy = room.y; gy < room.y + room.h; gy++) {
      for (let gx = room.x; gx < room.x + room.w; gx++) {
        if (gy >= 0 && gy < GRID_ROWS && gx >= 0 && gx < GRID_COLS) {
          grid[gy][gx] = false;
        }
      }
    }
  });

  // Mark corridor paths as non-wall (simple flood along connections)
  const connections = getClosestRooms();
  connections.forEach(([r1, r2]) => {
    const x1 = Math.floor(r1.x + r1.w / 2);
    const y1 = Math.floor(r1.y + r1.h / 2);
    const x2 = Math.floor(r2.x + r2.w / 2);
    const y2 = Math.floor(r2.y + r2.h / 2);

    // Carve horizontal then vertical corridor
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    // Horizontal corridor (width 1-2 cells)
    for (let gx = minX; gx <= maxX; gx++) {
      if (y1 >= 0 && y1 < GRID_ROWS && gx >= 0 && gx < GRID_COLS) {
        grid[y1][gx] = false;
        if (y1 + 1 < GRID_ROWS) grid[y1 + 1][gx] = false;
      }
    }

    // Vertical corridor
    for (let gy = minY; gy <= maxY; gy++) {
      if (gy >= 0 && gy < GRID_ROWS && x2 >= 0 && x2 < GRID_COLS) {
        grid[gy][x2] = false;
        if (x2 + 1 < GRID_COLS) grid[gy][x2 + 1] = false;
      }
    }
  });

  return grid;
}

export function getClosestRooms() {
  if (rooms.length === 0) return [];

  // Use minimum spanning tree approach for better corridors
  const connections = [];
  const connected = new Set([rooms[0].id]);
  const unconnected = new Set(rooms.slice(1).map(r => r.id));

  while (unconnected.size > 0) {
    let minDist = Infinity;
    let bestPair = null;

    for (const connId of connected) {
      const connRoom = rooms.find(r => r.id === connId);
      for (const unconId of unconnected) {
        const unconRoom = rooms.find(r => r.id === unconId);
        const cx1 = connRoom.x + connRoom.w / 2;
        const cy1 = connRoom.y + connRoom.h / 2;
        const cx2 = unconRoom.x + unconRoom.w / 2;
        const cy2 = unconRoom.y + unconRoom.h / 2;
        const dist = Math.sqrt((cx2 - cx1) ** 2 + (cy2 - cy1) ** 2);

        if (dist < minDist) {
          minDist = dist;
          bestPair = [connRoom, unconRoom];
        }
      }
    }

    if (bestPair) {
      connections.push(bestPair);
      connected.add(bestPair[1].id);
      unconnected.delete(bestPair[1].id);
    } else {
      break;
    }
  }

  return connections;
}

export function createLCorridor(x1, y1, x2, y2) {
  const paths = [];

  if (Math.random() > 0.5) {
    // Horizontal first, then vertical
    paths.push({ x1: x1, y1: y1, x2: x2, y2: y1 });
    paths.push({ x1: x2, y1: y1, x2: x2, y2: y2 });
  } else {
    // Vertical first, then horizontal
    paths.push({ x1: x1, y1: y1, x2: x1, y2: y2 });
    paths.push({ x1: x1, y1: y2, x2: x2, y2: y2 });
  }

  return paths;
}

// --- RENDERING ---
export function drawGrid() {
  if (renderStyle === 'vintage') {
    // TSR blue grid style
    ctx.strokeStyle = '#6495ED';
    ctx.lineWidth = 0.5;
  } else if (renderStyle === 'dyson') {
    // Very subtle grid for Dyson style
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.3;
  } else {
    // Modern clean grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
  }

  for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

export function drawRoomsModern() {
  // Original clean digital style
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;

  const connections = getClosestRooms();
  connections.forEach(([r1, r2]) => {
    const x1 = (r1.x + r1.w / 2) * GRID_SIZE;
    const y1 = (r1.y + r1.h / 2) * GRID_SIZE;
    const x2 = (r2.x + r2.w / 2) * GRID_SIZE;
    const y2 = (r2.y + r2.h / 2) * GRID_SIZE;

    const corridors = createLCorridor(x1, y1, x2, y2);
    corridors.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x1, c.y1);
      ctx.lineTo(c.x2, c.y2);
      ctx.stroke();
    });
  });

  rooms.forEach(room => {
    const isSelected = room.id === selectedRoomId;

    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeStyle = isSelected ? '#4b7abf' : getRoomColor(room.type);
    ctx.fillStyle = '#222';

    const x = room.x * GRID_SIZE;
    const y = room.y * GRID_SIZE;
    const w = room.w * GRID_SIZE;
    const h = room.h * GRID_SIZE;

    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // Room number
    ctx.fillStyle = '#fff';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.fillText(String(room.id), cx, cy);

    // Room type indicator
    if (room.type !== 'normal') {
      ctx.font = '10px system-ui';
      ctx.fillStyle = getRoomColor(room.type);
      ctx.fillText(room.type.toUpperCase(), cx, cy + 12);
    }
  });
}

export function drawRoomsDyson() {
  // Hand-drawn Dyson Logos style

  // First: Draw cross-hatching on wall regions
  const wallGrid = getWallRegions();

  // Find contiguous wall regions and hatch them
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;

  for (let gy = 0; gy < GRID_ROWS; gy++) {
    for (let gx = 0; gx < GRID_COLS; gx++) {
      if (wallGrid[gy][gx]) {
        const x = gx * GRID_SIZE;
        const y = gy * GRID_SIZE;
        fillCrossHatch(x, y, GRID_SIZE, GRID_SIZE, 45, 6);
      }
    }
  }

  // Second: Draw corridors with hand-drawn lines
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;

  const connections = getClosestRooms();
  connections.forEach(([r1, r2]) => {
    const x1 = (r1.x + r1.w / 2) * GRID_SIZE;
    const y1 = (r1.y + r1.h / 2) * GRID_SIZE;
    const x2 = (r2.x + r2.w / 2) * GRID_SIZE;
    const y2 = (r2.y + r2.h / 2) * GRID_SIZE;

    const corridors = createLCorridor(x1, y1, x2, y2);
    corridors.forEach(c => {
      drawHandDrawnLine(c.x1, c.y1, c.x2, c.y2, 2);
    });
  });

  // Third: Draw rooms with hand-drawn organic shapes
  rooms.forEach(room => {
    const isSelected = room.id === selectedRoomId;

    ctx.strokeStyle = isSelected ? '#4b7abf' : '#000';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.fillStyle = renderStyle === 'vintage' ? '#fff' : '#f5f5dc'; // White or parchment

    const x = room.x * GRID_SIZE;
    const y = room.y * GRID_SIZE;
    const w = room.w * GRID_SIZE;
    const h = room.h * GRID_SIZE;

    // Add slight organic distortion to corners
    const wobble = 3;
    const x1 = x + (Math.random() - 0.5) * wobble;
    const y1 = y + (Math.random() - 0.5) * wobble;
    const x2 = x + w + (Math.random() - 0.5) * wobble;
    const y2 = y + h + (Math.random() - 0.5) * wobble;

    // Fill room
    ctx.fillRect(x, y, w, h);

    // Draw hand-drawn outline
    drawHandDrawnRect(x, y, w, h, 2);

    // Room number
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.fillText(String(room.id), cx, cy);

    // Room type indicator (small text below number)
    if (room.type !== 'normal') {
      ctx.font = '9px serif';
      ctx.fillStyle = '#444';
      ctx.fillText(room.type.toUpperCase(), cx, cy + 12);
    }
  });
}

export function render() {
  ctx.save();

  // Background color based on style
  if (renderStyle === 'vintage') {
    ctx.fillStyle = '#e8f0ff'; // Light blue for TSR vintage
  } else if (renderStyle === 'dyson') {
    ctx.fillStyle = '#faf8f0'; // Parchment for Dyson
  } else {
    ctx.fillStyle = '#000'; // Black for modern
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Phase 3: Age spots (behind everything)
  drawAgeSpots(20);

  if (backgroundImg) {
    const scale = Math.min(
      canvas.width / backgroundImg.width,
      canvas.height / backgroundImg.height
    );
    const imgW = backgroundImg.width * scale;
    const imgH = backgroundImg.height * scale;
    const offsetX = (canvas.width - imgW) / 2;
    const offsetY = (canvas.height - imgH) / 2;
    ctx.drawImage(backgroundImg, offsetX, offsetY, imgW, imgH);
  }

  drawGrid();

  // Choose rendering style
  if (renderStyle === 'dyson' || renderStyle === 'vintage') {
    drawRoomsDyson();
  } else {
    drawRoomsModern();
  }

  // Render symbols (Phase 2)
  renderSymbols();

  // Phase 3: Coffee stains (over map)
  renderCoffeeStains();

  // Phase 3: Title block
  drawTitleBlock();

  // Phase 3: Compass rose
  const compassPos = getCompassPosition();
  drawCompassRose(compassPos.x, compassPos.y);

  ctx.restore();
}
