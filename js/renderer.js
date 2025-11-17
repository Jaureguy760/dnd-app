import { getRooms, getAnnotations, getTraps, getEncounters, getDmNotes, getTerrainLayers, canvas, ctx, GRID_SIZE, GRID_COLS, GRID_ROWS, selectedRoomId, backgroundImg, renderStyle, rulerMode, rulerStart, rulerEnd, showDmNotes } from './state.js';
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
  getRooms().forEach(room => {
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
  const rooms = getRooms();
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

  getRooms().forEach(room => {
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
  // Hand-drawn Dyson Logos style - BOLD & DRAMATIC

  // First: Draw HEAVY cross-hatching on wall regions
  const wallGrid = getWallRegions();

  // Find contiguous wall regions and hatch them - THICKER LINES, DENSER
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.2; // THICKER hatching

  for (let gy = 0; gy < GRID_ROWS; gy++) {
    for (let gx = 0; gx < GRID_COLS; gx++) {
      if (wallGrid[gy][gx]) {
        const x = gx * GRID_SIZE;
        const y = gy * GRID_SIZE;
        fillCrossHatch(x, y, GRID_SIZE, GRID_SIZE, 45, 4); // DENSER hatching (4 instead of 6)
      }
    }
  }

  // Second: Draw corridors with BOLD hand-drawn lines
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5; // THICKER corridors

  const connections = getClosestRooms();
  connections.forEach(([r1, r2]) => {
    const x1 = (r1.x + r1.w / 2) * GRID_SIZE;
    const y1 = (r1.y + r1.h / 2) * GRID_SIZE;
    const x2 = (r2.x + r2.w / 2) * GRID_SIZE;
    const y2 = (r2.y + r2.h / 2) * GRID_SIZE;

    const corridors = createLCorridor(x1, y1, x2, y2);
    corridors.forEach(c => {
      drawHandDrawnLine(c.x1, c.y1, c.x2, c.y2, 3); // THICKER wobble
    });
  });

  // Third: Draw rooms with BOLD hand-drawn organic shapes
  getRooms().forEach(room => {
    const isSelected = room.id === selectedRoomId;

    ctx.strokeStyle = isSelected ? '#4b7abf' : '#000';
    ctx.lineWidth = isSelected ? 4 : 3; // MUCH THICKER outlines
    ctx.fillStyle = '#fff'; // Pure white rooms for contrast

    const x = room.x * GRID_SIZE;
    const y = room.y * GRID_SIZE;
    const w = room.w * GRID_SIZE;
    const h = room.h * GRID_SIZE;

    // Fill room with white
    ctx.fillRect(x, y, w, h);

    // Draw BOLD hand-drawn outline
    drawHandDrawnRect(x, y, w, h, 4); // THICKER wobble

    // Room number - BIGGER & BOLDER
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px serif'; // LARGER font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Draw number with slight shadow for emphasis
    ctx.fillStyle = '#666';
    ctx.fillText(String(room.id), cx + 1, cy + 1);
    ctx.fillStyle = '#000';
    ctx.fillText(String(room.id), cx, cy);

    // Room type indicator (small text below number)
    if (room.type !== 'normal') {
      ctx.font = 'bold 10px serif';
      ctx.fillStyle = '#333';
      ctx.fillText(room.type.toUpperCase(), cx, cy + 14);
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

  // Phase 6: Terrain layers (before symbols)
  drawTerrainLayers();

  // Render symbols (Phase 2)
  renderSymbols();

  // Phase 5: DM Tools
  drawTraps();
  drawEncounters();
  drawAnnotations();
  drawDmNotes();
  drawRuler();

  // Phase 3: Coffee stains (over map)
  renderCoffeeStains();

  // Phase 3: Title block
  drawTitleBlock();

  // Phase 3: Compass rose
  const compassPos = getCompassPosition();
  drawCompassRose(compassPos.x, compassPos.y);

  ctx.restore();
}

// --- PHASE 5: DM TOOLS RENDERING ---

export function drawRuler() {
  if (!rulerMode || !rulerStart) return;

  ctx.save();
  ctx.strokeStyle = '#4a9eff';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  const startX = rulerStart.x * GRID_SIZE + GRID_SIZE / 2;
  const startY = rulerStart.y * GRID_SIZE + GRID_SIZE / 2;

  if (rulerEnd) {
    const endX = rulerEnd.x * GRID_SIZE + GRID_SIZE / 2;
    const endY = rulerEnd.y * GRID_SIZE + GRID_SIZE / 2;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Calculate distance
    const dx = Math.abs(rulerEnd.x - rulerStart.x);
    const dy = Math.abs(rulerEnd.y - rulerStart.y);
    const distance = Math.sqrt(dx * dx + dy * dy) * 5; // 5ft per square

    // Draw label
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(midX - 30, midY - 12, 60, 24);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(distance)}ft`, midX, midY);
  }

  ctx.restore();
}

export function drawAnnotations() {
  const annotations = getAnnotations();
  if (!annotations || annotations.length === 0) return;

  ctx.save();
  annotations.forEach(ann => {
    const x = ann.x * GRID_SIZE;
    const y = ann.y * GRID_SIZE;

    // Background box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    const padding = 4;
    const fontSize = ann.fontSize || 12;
    ctx.font = `${fontSize}px sans-serif`;
    const textWidth = ctx.measureText(ann.text).width;
    ctx.fillRect(x - padding, y - fontSize - padding, textWidth + padding * 2, fontSize + padding * 2);
    ctx.strokeRect(x - padding, y - fontSize - padding, textWidth + padding * 2, fontSize + padding * 2);

    // Text
    ctx.fillStyle = ann.color || '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(ann.text, x, y - fontSize);
  });
  ctx.restore();
}

export function drawTraps() {
  const traps = getTraps();
  if (!traps || traps.length === 0) return;

  ctx.save();
  traps.forEach(trap => {
    const x = trap.x * GRID_SIZE + GRID_SIZE / 2;
    const y = trap.y * GRID_SIZE + GRID_SIZE / 2;
    const size = GRID_SIZE * 0.4;

    ctx.strokeStyle = '#ff6600';
    ctx.fillStyle = 'rgba(255, 102, 0, 0.3)';
    ctx.lineWidth = 2;

    // Draw icon based on trap type
    ctx.beginPath();
    if (trap.trapType === 'bear') {
      // Serrated circle
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const r = i % 2 === 0 ? size : size * 0.7;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (trap.trapType === 'pit') {
      // Black circle
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
    } else if (trap.trapType === 'dart') {
      // Arrow
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.moveTo(x + size - 5, y - 5);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size - 5, y + 5);
    } else if (trap.trapType === 'poison') {
      // Skull
      ctx.arc(x, y - 3, size * 0.6, 0, Math.PI * 2);
      ctx.rect(x - size * 0.4, y + 3, size * 0.8, size * 0.5);
    } else if (trap.trapType === 'spike') {
      // Spikes
      for (let i = 0; i < 5; i++) {
        ctx.moveTo(x - size + i * size / 2, y + size);
        ctx.lineTo(x - size + i * size / 2 + size / 4, y - size);
      }
    } else if (trap.trapType === 'fire') {
      // Flame
      ctx.moveTo(x, y + size);
      ctx.quadraticCurveTo(x - size, y, x, y - size);
      ctx.quadraticCurveTo(x + size, y, x, y + size);
    } else {
      // Default: triangle with !
      ctx.moveTo(x, y - size);
      ctx.lineTo(x - size, y + size);
      ctx.lineTo(x + size, y + size);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

export function drawEncounters() {
  const encounters = getEncounters();
  if (!encounters || encounters.length === 0) return;

  ctx.save();
  encounters.forEach((enc, idx) => {
    const x = enc.x * GRID_SIZE + GRID_SIZE / 2;
    const y = enc.y * GRID_SIZE + GRID_SIZE / 2;
    const size = GRID_SIZE * 0.4;

    // Color by difficulty
    let color = '#4CAF50'; // Easy (green)
    if (enc.difficulty === 'medium') color = '#FFC107'; // Medium (yellow)
    if (enc.difficulty === 'hard') color = '#F44336'; // Hard (red)

    // Draw token circle
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw count/number
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enc.count || '1', x, y);
  });
  ctx.restore();
}

export function drawDmNotes() {
  const dmNotes = getDmNotes();
  if (!dmNotes || dmNotes.length === 0 || !showDmNotes) return;

  ctx.save();
  dmNotes.forEach(note => {
    const x = note.x * GRID_SIZE;
    const y = note.y * GRID_SIZE;

    // Dashed red border
    ctx.strokeStyle = '#ff4444';
    ctx.fillStyle = 'rgba(255, 200, 200, 0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);

    const padding = 4;
    const fontSize = 12;
    ctx.font = `${fontSize}px sans-serif`;
    const textWidth = ctx.measureText(note.text).width;

    ctx.fillRect(x - padding, y - fontSize - padding, textWidth + padding * 2, fontSize + padding * 2);
    ctx.strokeRect(x - padding, y - fontSize - padding, textWidth + padding * 2, fontSize + padding * 2);

    // Text in red
    ctx.fillStyle = '#cc0000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(note.text, x, y - fontSize);
  });
  ctx.restore();
}

export function drawTerrainLayers() {
  const terrainLayers = getTerrainLayers();
  if (!terrainLayers || terrainLayers.length === 0) return;

  terrainLayers.forEach(terrain => {
    const x = terrain.x * GRID_SIZE;
    const y = terrain.y * GRID_SIZE;
    const w = terrain.width * GRID_SIZE;
    const h = terrain.height * GRID_SIZE;

    ctx.save();

    switch(terrain.type) {
      case 'water':
        ctx.fillStyle = 'rgba(100, 150, 255, 0.4)';
        ctx.fillRect(x, y, w, h);
        // Add wave pattern
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < w; i += 10) {
          ctx.beginPath();
          ctx.moveTo(x + i, y);
          ctx.quadraticCurveTo(x + i + 5, y + 5, x + i + 10, y);
          ctx.stroke();
        }
        break;

      case 'lava':
        ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
        ctx.fillRect(x, y, w, h);
        // Add glow effect
        const gradient = ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, w/2);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0.4)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);
        break;

      case 'pit':
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, w, h);
        // Add depth lines
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const offset = i * (w / 6);
          ctx.strokeRect(x + offset, y + offset, w - offset*2, h - offset*2);
        }
        break;

      case 'difficult':
        ctx.fillStyle = 'rgba(100, 150, 50, 0.3)';
        ctx.fillRect(x, y, w, h);
        // Add vegetation marks
        ctx.strokeStyle = 'rgba(50, 100, 30, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < w; i += 15) {
          for (let j = 0; j < h; j += 15) {
            ctx.beginPath();
            ctx.moveTo(x + i, y + j + 5);
            ctx.lineTo(x + i, y + j - 5);
            ctx.stroke();
          }
        }
        break;

      case 'darkness':
        ctx.fillStyle = 'rgba(30, 0, 60, 0.7)';
        ctx.fillRect(x, y, w, h);
        // Add fog effect
        ctx.fillStyle = 'rgba(50, 0, 80, 0.4)';
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, w/2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'ice':
        ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
        ctx.fillRect(x, y, w, h);
        // Add crystalline pattern
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.moveTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.stroke();
        break;

      case 'poison':
        ctx.fillStyle = 'rgba(150, 255, 0, 0.3)';
        ctx.fillRect(x, y, w, h);
        // Add poison cloud effect
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = `rgba(100, 200, 50, ${0.2 - i*0.05})`;
          ctx.beginPath();
          ctx.arc(x + w/2 + (i-1)*10, y + h/2, w/3 + i*5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }

    ctx.restore();
  });
}
