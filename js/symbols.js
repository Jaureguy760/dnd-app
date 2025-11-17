import { getRooms, getSymbols, ctx, GRID_SIZE, GRID_COLS, GRID_ROWS, selectedSymbol, setSymbols, setSelectedSymbol, statusText } from './state.js';
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

// --- NEW TERRAIN FEATURE SYMBOLS (PHASE 6) ---

export function drawFountain(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'ornate';

  ctx.save();

  if (subtype === 'magical') {
    // Magical fountain - glowing gradient
    const gradient = ctx.createRadialGradient(px, py, GRID_SIZE/4, px, py, GRID_SIZE/2);
    gradient.addColorStop(0, '#44aaff');
    gradient.addColorStop(1, '#0088ff');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, GRID_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Basin
  ctx.strokeStyle = subtype === 'dried' ? '#888' : '#44aaff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, GRID_SIZE/2, 0, Math.PI * 2);
  ctx.stroke();

  // Water ripples (if not dried)
  if (subtype !== 'dried') {
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, GRID_SIZE/3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, GRID_SIZE/4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center spout
  ctx.fillStyle = '#666';
  ctx.fillRect(px - GRID_SIZE/8, py - GRID_SIZE/8, GRID_SIZE/4, GRID_SIZE/4);

  ctx.restore();
}

export function drawStatue2(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'humanoid';

  ctx.save();
  ctx.fillStyle = '#999';
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;

  // Pedestal
  ctx.fillRect(px - GRID_SIZE/4, py + GRID_SIZE/8, GRID_SIZE/2, GRID_SIZE/4);

  // Figure
  if (subtype === 'dragon') {
    // Dragon head
    ctx.beginPath();
    ctx.moveTo(px - GRID_SIZE/3, py);
    ctx.lineTo(px, py - GRID_SIZE/3);
    ctx.lineTo(px + GRID_SIZE/3, py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Humanoid/angel/demon figure
    ctx.beginPath();
    ctx.arc(px, py - GRID_SIZE/4, GRID_SIZE/6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px - GRID_SIZE/8, py - GRID_SIZE/8, GRID_SIZE/4, GRID_SIZE/3);
  }

  ctx.restore();
}

export function drawAltar2(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'stone';

  ctx.save();

  const color = subtype === 'blood' ? '#800' :
                subtype === 'holy' ? '#ff8' :
                subtype === 'cursed' ? '#508' : '#888';

  ctx.fillStyle = color;
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;

  // Altar table
  ctx.fillRect(px - GRID_SIZE/2, py - GRID_SIZE/4, GRID_SIZE, GRID_SIZE/2);
  ctx.strokeRect(px - GRID_SIZE/2, py - GRID_SIZE/4, GRID_SIZE, GRID_SIZE/2);

  // Symbol on top
  ctx.strokeStyle = subtype === 'holy' ? '#fff' : subtype === 'cursed' ? '#f0f' : '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (subtype === 'holy') {
    // Cross
    ctx.moveTo(px, py - GRID_SIZE/6);
    ctx.lineTo(px, py + GRID_SIZE/6);
    ctx.moveTo(px - GRID_SIZE/8, py);
    ctx.lineTo(px + GRID_SIZE/8, py);
  } else if (subtype === 'cursed') {
    // Pentagram
    ctx.arc(px, py, GRID_SIZE/8, 0, Math.PI * 2);
  }
  ctx.stroke();

  ctx.restore();
}

// --- INTERACTIVE OBJECTS ---

export function drawLever(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'wall';

  ctx.save();

  // Base
  ctx.fillStyle = '#666';
  ctx.fillRect(px - GRID_SIZE/6, py - GRID_SIZE/8, GRID_SIZE/3, GRID_SIZE/4);

  // Lever handle
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (subtype === 'up') {
    ctx.moveTo(px, py);
    ctx.lineTo(px, py - GRID_SIZE/3);
  } else if (subtype === 'down') {
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + GRID_SIZE/3);
  } else {
    ctx.moveTo(px, py);
    ctx.lineTo(px + GRID_SIZE/3, py - GRID_SIZE/6);
  }
  ctx.stroke();

  // Handle ball
  ctx.fillStyle = '#f44';
  ctx.beginPath();
  const ballY = subtype === 'up' ? py - GRID_SIZE/3 : subtype === 'down' ? py + GRID_SIZE/3 : py - GRID_SIZE/6;
  const ballX = subtype === 'wall' ? px + GRID_SIZE/3 : px;
  ctx.arc(ballX, ballY, GRID_SIZE/8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawBrazier(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'lit';

  ctx.save();

  // Bowl
  ctx.fillStyle = '#666';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, GRID_SIZE/3, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stand
  ctx.fillStyle = '#444';
  ctx.fillRect(px - GRID_SIZE/12, py, GRID_SIZE/6, GRID_SIZE/4);

  // Fire/effect
  if (subtype === 'lit') {
    const gradient = ctx.createRadialGradient(px, py - GRID_SIZE/4, 0, px, py - GRID_SIZE/4, GRID_SIZE/3);
    gradient.addColorStop(0, '#ff0');
    gradient.addColorStop(0.5, '#f80');
    gradient.addColorStop(1, '#f00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - GRID_SIZE/6, py - GRID_SIZE/3);
    ctx.lineTo(px, py - GRID_SIZE/2);
    ctx.lineTo(px + GRID_SIZE/6, py - GRID_SIZE/3);
    ctx.closePath();
    ctx.fill();
  } else if (subtype === 'magical') {
    ctx.fillStyle = '#44aaff';
    ctx.beginPath();
    ctx.arc(px, py - GRID_SIZE/4, GRID_SIZE/6, 0, Math.PI * 2);
    ctx.fill();
  } else if (subtype === 'cold') {
    ctx.fillStyle = '#88eeff';
    ctx.beginPath();
    ctx.moveTo(px, py - GRID_SIZE/3);
    ctx.lineTo(px - GRID_SIZE/8, py);
    ctx.lineTo(px + GRID_SIZE/8, py);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawChain(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'vertical';

  ctx.save();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 3;

  if (subtype === 'vertical' || subtype === 'hanging') {
    // Draw chain links vertically
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(px, py - GRID_SIZE/2 + i * GRID_SIZE/4, GRID_SIZE/12, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Draw chain links horizontally
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(px - GRID_SIZE/2 + i * GRID_SIZE/4, py, GRID_SIZE/12, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// --- CONTAINERS ---

export function drawBarrel(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'intact';

  ctx.save();
  ctx.fillStyle = '#864';
  ctx.strokeStyle = '#543';
  ctx.lineWidth = 2;

  if (subtype === 'broken') {
    // Broken barrel pieces
    ctx.fillRect(px - GRID_SIZE/4, py - GRID_SIZE/6, GRID_SIZE/2, GRID_SIZE/3);
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(px - GRID_SIZE/4, py - GRID_SIZE/6);
    ctx.lineTo(px + GRID_SIZE/4, py + GRID_SIZE/6);
    ctx.moveTo(px + GRID_SIZE/4, py - GRID_SIZE/6);
    ctx.lineTo(px - GRID_SIZE/4, py + GRID_SIZE/6);
    ctx.stroke();
  } else {
    // Intact barrel
    ctx.beginPath();
    ctx.ellipse(px, py, GRID_SIZE/3, GRID_SIZE/4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bands
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - GRID_SIZE/3, py - GRID_SIZE/8);
    ctx.lineTo(px + GRID_SIZE/3, py - GRID_SIZE/8);
    ctx.moveTo(px - GRID_SIZE/3, py + GRID_SIZE/8);
    ctx.lineTo(px + GRID_SIZE/3, py + GRID_SIZE/8);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawCrate(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'closed';

  ctx.save();
  ctx.fillStyle = '#a86';
  ctx.strokeStyle = '#654';
  ctx.lineWidth = 2;

  // Main box
  ctx.fillRect(px - GRID_SIZE/3, py - GRID_SIZE/3, GRID_SIZE*0.66, GRID_SIZE*0.66);
  ctx.strokeRect(px - GRID_SIZE/3, py - GRID_SIZE/3, GRID_SIZE*0.66, GRID_SIZE*0.66);

  // Wood grain
  ctx.strokeStyle = '#765';
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(px - GRID_SIZE/3, py + i * GRID_SIZE/8);
    ctx.lineTo(px + GRID_SIZE/3, py + i * GRID_SIZE/8);
    ctx.stroke();
  }

  if (subtype === 'open') {
    // Open lid
    ctx.fillStyle = '#987';
    ctx.fillRect(px - GRID_SIZE/3, py - GRID_SIZE/2, GRID_SIZE*0.66, GRID_SIZE/8);
  }

  ctx.restore();
}

export function drawSack(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'full';

  ctx.save();
  ctx.fillStyle = subtype === 'coins' ? '#da6' : '#987';
  ctx.strokeStyle = '#654';
  ctx.lineWidth = 2;

  // Sack body
  ctx.beginPath();
  ctx.moveTo(px, py - GRID_SIZE/4);
  ctx.quadraticCurveTo(px - GRID_SIZE/3, py, px - GRID_SIZE/4, py + GRID_SIZE/4);
  ctx.lineTo(px + GRID_SIZE/4, py + GRID_SIZE/4);
  ctx.quadraticCurveTo(px + GRID_SIZE/3, py, px, py - GRID_SIZE/4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tie rope
  ctx.strokeStyle = '#543';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px - GRID_SIZE/6, py - GRID_SIZE/8);
  ctx.lineTo(px + GRID_SIZE/6, py - GRID_SIZE/8);
  ctx.stroke();

  if (subtype === 'coins') {
    // Gold shimmer
    ctx.fillStyle = '#fd8';
    ctx.beginPath();
    ctx.arc(px, py, GRID_SIZE/8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// --- ROOM DRESSING ---

export function drawBones(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'pile';

  ctx.save();
  ctx.strokeStyle = '#ddd';
  ctx.fillStyle = '#eee';
  ctx.lineWidth = 2;

  if (subtype === 'skull') {
    // Skull
    ctx.beginPath();
    ctx.arc(px, py - GRID_SIZE/6, GRID_SIZE/4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye sockets
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(px - GRID_SIZE/8, py - GRID_SIZE/6, GRID_SIZE/12, 0, Math.PI * 2);
    ctx.arc(px + GRID_SIZE/8, py - GRID_SIZE/6, GRID_SIZE/12, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Bone pile
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const bx = px + Math.cos(angle) * GRID_SIZE/4;
      const by = py + Math.sin(angle) * GRID_SIZE/4;
      ctx.strokeRect(bx - GRID_SIZE/12, by - GRID_SIZE/24, GRID_SIZE/6, GRID_SIZE/12);
    }
  }

  ctx.restore();
}

export function drawWeb(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;

  ctx.save();
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
  ctx.lineWidth = 1;

  // Radial web pattern
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(angle) * GRID_SIZE/2, py + Math.sin(angle) * GRID_SIZE/2);
    ctx.stroke();
  }

  // Circular strands
  for (let r = 1; r <= 3; r++) {
    ctx.beginPath();
    ctx.arc(px, py, (r / 3) * GRID_SIZE/2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawRubble(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'light';

  ctx.save();
  ctx.fillStyle = subtype === 'magical' ? '#84f' : '#888';
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;

  // Random debris chunks
  const count = subtype === 'heavy' ? 8 : 5;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = (i % 3) * GRID_SIZE/8;
    const rx = px + Math.cos(angle) * dist;
    const ry = py + Math.sin(angle) * dist;
    const size = GRID_SIZE/8 + (i % 2) * GRID_SIZE/12;

    ctx.fillRect(rx - size/2, ry - size/2, size, size);
    ctx.strokeRect(rx - size/2, ry - size/2, size, size);
  }

  ctx.restore();
}

// --- NATURAL ELEMENTS ---

export function drawMushroom(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'small';

  ctx.save();

  const isGlowing = subtype === 'glowing';
  const isLarge = subtype === 'large';
  const isCluster = subtype === 'cluster';

  const drawSingleMushroom = (mx, my, size) => {
    // Stem
    ctx.fillStyle = '#ddd';
    ctx.fillRect(mx - size/8, my - size/4, size/4, size/2);

    // Cap
    ctx.fillStyle = isGlowing ? '#4f8' : '#f44';
    ctx.beginPath();
    ctx.arc(mx, my - size/4, size/2, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();

    // Spots
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
      const sx = mx + (i - 1) * size/4;
      ctx.beginPath();
      ctx.arc(sx, my - size/4, size/12, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  if (isCluster) {
    drawSingleMushroom(px - GRID_SIZE/4, py, GRID_SIZE/3);
    drawSingleMushroom(px + GRID_SIZE/4, py, GRID_SIZE/4);
    drawSingleMushroom(px, py + GRID_SIZE/4, GRID_SIZE/5);
  } else {
    const size = isLarge ? GRID_SIZE/2 : GRID_SIZE/3;
    drawSingleMushroom(px, py, size);
  }

  ctx.restore();
}

export function drawPlant(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'fern';

  ctx.save();
  ctx.strokeStyle = subtype === 'thorns' ? '#6a4' : '#4a6';
  ctx.lineWidth = 2;

  if (subtype === 'vine') {
    // Curvy vine
    ctx.beginPath();
    ctx.moveTo(px - GRID_SIZE/2, py - GRID_SIZE/2);
    ctx.quadraticCurveTo(px, py, px + GRID_SIZE/2, py - GRID_SIZE/2);
    ctx.stroke();

    // Leaves
    ctx.fillStyle = '#4a6';
    for (let i = 0; i < 3; i++) {
      const lx = px + (i - 1) * GRID_SIZE/3;
      ctx.beginPath();
      ctx.arc(lx, py - GRID_SIZE/6, GRID_SIZE/8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Fern/thorns - radial leaves
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(angle) * GRID_SIZE/3, py + Math.sin(angle) * GRID_SIZE/3);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawCrystal(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'blue';

  ctx.save();

  const colors = {
    blue: '#44aaff',
    red: '#f44',
    purple: '#a4f',
    cluster: '#8f8'
  };

  ctx.fillStyle = colors[subtype] || '#44aaff';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;

  // Crystal point
  ctx.beginPath();
  ctx.moveTo(px, py - GRID_SIZE/2);
  ctx.lineTo(px - GRID_SIZE/4, py + GRID_SIZE/4);
  ctx.lineTo(px + GRID_SIZE/4, py + GRID_SIZE/4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawPool(symbol) {
  const px = symbol.x * GRID_SIZE + GRID_SIZE/2;
  const py = symbol.y * GRID_SIZE + GRID_SIZE/2;
  const subtype = symbol.subtype || 'water';

  ctx.save();

  const colors = {
    water: 'rgba(100, 150, 255, 0.6)',
    blood: 'rgba(139, 0, 0, 0.7)',
    acid: 'rgba(150, 255, 0, 0.6)',
    magical: 'rgba(200, 0, 255, 0.6)'
  };

  ctx.fillStyle = colors[subtype];
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 2;

  // Pool shape
  ctx.beginPath();
  ctx.ellipse(px, py, GRID_SIZE/2, GRID_SIZE/3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ripples
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(px, py, (i/3) * GRID_SIZE/2, (i/3) * GRID_SIZE/3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderSymbols() {
  getSymbols().forEach(symbol => {
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
    // NEW TERRAIN FEATURES (Phase 6)
    else if (symbol.type === 'fountain') {
      drawFountain(symbol);
    } else if (symbol.type === 'statue2') {
      drawStatue2(symbol);
    } else if (symbol.type === 'altar2') {
      drawAltar2(symbol);
    }
    // INTERACTIVE OBJECTS
    else if (symbol.type === 'lever') {
      drawLever(symbol);
    } else if (symbol.type === 'brazier') {
      drawBrazier(symbol);
    } else if (symbol.type === 'chain') {
      drawChain(symbol);
    }
    // CONTAINERS
    else if (symbol.type === 'barrel') {
      drawBarrel(symbol);
    } else if (symbol.type === 'crate') {
      drawCrate(symbol);
    } else if (symbol.type === 'sack') {
      drawSack(symbol);
    }
    // ROOM DRESSING
    else if (symbol.type === 'bones') {
      drawBones(symbol);
    } else if (symbol.type === 'web') {
      drawWeb(symbol);
    } else if (symbol.type === 'rubble') {
      drawRubble(symbol);
    }
    // NATURAL ELEMENTS
    else if (symbol.type === 'mushroom') {
      drawMushroom(symbol);
    } else if (symbol.type === 'plant') {
      drawPlant(symbol);
    } else if (symbol.type === 'crystal') {
      drawCrystal(symbol);
    } else if (symbol.type === 'pool') {
      drawPool(symbol);
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

function autoDetectDoors() {
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

  statusText.textContent = `Auto-detected ${newDoors.length} doors`;
  setTimeout(() => { statusText.textContent = ''; }, 3000);

  return newDoors.length;
}

function findSymbolAt(gx, gy) {
  return getSymbols().find(s => s.x === gx && s.y === gy);
}

function deleteSymbol(symbolId) {
  setSymbols(getSymbols().filter(s => s.id !== symbolId));
  if (selectedSymbol && selectedSymbol.id === symbolId) {
    setSelectedSymbol(null);
  }
  saveState();
  render();
}
