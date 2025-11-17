import { getEffectsEnabled, getCoffeeStains, getTitleBlockData, canvas, ctx, renderStyle, setCoffeeStains } from './state.js';
import { drawHandDrawnRect, drawHandDrawnLine } from './renderer.js';

// --- PHASE 3: MAP EFFECTS RENDERING ---

// Coffee Stain System
export function generateCoffeeStains(count = 3) {
  const newStains = [];

  for (let i = 0; i < count; i++) {
    newStains.push({
      x: 80 + Math.random() * (canvas.width - 160),
      y: 80 + Math.random() * (canvas.height - 160),
      radius: 15 + Math.random() * 35,
      opacity: 0.1 + Math.random() * 0.15,
      rings: 1 + Math.floor(Math.random() * 3)
    });
  }

  setCoffeeStains(newStains);
}

export function drawCoffeeStain(stain) {
  const {x, y, radius, opacity, rings} = stain;

  // Main stain body with radial gradient
  const mainGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  mainGradient.addColorStop(0, `rgba(101, 67, 33, ${opacity * 0.4})`);
  mainGradient.addColorStop(0.6, `rgba(101, 67, 33, ${opacity})`);
  mainGradient.addColorStop(1, 'rgba(101, 67, 33, 0)');

  ctx.fillStyle = mainGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Add darker rings at edges
  for (let ring = 0; ring < rings; ring++) {
    const ringRadius = radius * (0.85 + ring * 0.05);
    const ringWidth = radius * 0.1;

    const ringGradient = ctx.createRadialGradient(
      x, y, ringRadius - ringWidth,
      x, y, ringRadius + ringWidth
    );
    ringGradient.addColorStop(0, 'rgba(101, 67, 33, 0)');
    ringGradient.addColorStop(0.5, `rgba(80, 50, 20, ${opacity * 1.5})`);
    ringGradient.addColorStop(1, 'rgba(101, 67, 33, 0)');

    ctx.fillStyle = ringGradient;
    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Occasional drip effect
  if (Math.random() < 0.3) {
    const dripAngle = Math.random() * Math.PI * 2;
    const dripLength = radius * (0.5 + Math.random() * 0.5);
    const dripX = x + Math.cos(dripAngle) * radius;
    const dripY = y + Math.sin(dripAngle) * radius;

    const dripGradient = ctx.createLinearGradient(
      dripX, dripY,
      dripX + Math.cos(dripAngle + Math.PI/2) * dripLength,
      dripY + Math.sin(dripAngle + Math.PI/2) * dripLength
    );
    dripGradient.addColorStop(0, `rgba(101, 67, 33, ${opacity * 0.8})`);
    dripGradient.addColorStop(1, 'rgba(101, 67, 33, 0)');

    ctx.fillStyle = dripGradient;
    ctx.fillRect(dripX, dripY, 3, dripLength);
  }
}

export function renderCoffeeStains() {
  if (!getEffectsEnabled().coffeeStains) return;
  getCoffeeStains().forEach(stain => drawCoffeeStain(stain));
}

// Title Block System
export function drawCornerFlourish(x, y, corner) {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;

  const size = 8;
  ctx.beginPath();

  switch(corner) {
    case 'top-left':
      ctx.moveTo(x, y + size);
      ctx.lineTo(x, y);
      ctx.lineTo(x + size, y);
      break;
    case 'top-right':
      ctx.moveTo(x - size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + size);
      break;
    case 'bottom-left':
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y);
      ctx.lineTo(x + size, y);
      break;
    case 'bottom-right':
      ctx.moveTo(x - size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y - size);
      break;
  }

  ctx.stroke();
}

export function drawTitleBlock() {
  if (!getEffectsEnabled().titleBlock) return;

  const blockW = 220;
  const blockH = 150;
  const margin = 20;

  // Position: top-right by default
  const blockX = canvas.width - blockW - margin;
  const blockY = margin;

  // Decorative border
  ctx.strokeStyle = '#000';
  ctx.fillStyle = 'rgba(250, 248, 240, 0.9)';
  ctx.lineWidth = 2;

  // Outer border
  if (renderStyle === 'dyson' || renderStyle === 'vintage') {
    drawHandDrawnRect(blockX, blockY, blockW, blockH, 1);
  } else {
    ctx.strokeRect(blockX, blockY, blockW, blockH);
  }
  ctx.fillRect(blockX, blockY, blockW, blockH);
  ctx.stroke();

  // Inner border
  ctx.lineWidth = 1;
  if (renderStyle === 'dyson' || renderStyle === 'vintage') {
    drawHandDrawnRect(blockX + 8, blockY + 8, blockW - 16, blockH - 16, 0.5);
  } else {
    ctx.strokeRect(blockX + 8, blockY + 8, blockW - 16, blockH - 16);
  }

  // Corner flourishes
  drawCornerFlourish(blockX + 5, blockY + 5, 'top-left');
  drawCornerFlourish(blockX + blockW - 5, blockY + 5, 'top-right');
  drawCornerFlourish(blockX + 5, blockY + blockH - 5, 'bottom-left');
  drawCornerFlourish(blockX + blockW - 5, blockY + blockH - 5, 'bottom-right');

  // Text content
  ctx.fillStyle = '#000';
  let textY = blockY + 30;
  const textX = blockX + 15;

  // Dungeon name (larger, bold)
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(getTitleBlockData().dungeonName, textX, textY);
  textY += 28;

  // Divider line
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  if (renderStyle === 'dyson' || renderStyle === 'vintage') {
    drawHandDrawnLine(blockX + 15, textY - 10, blockX + blockW - 15, textY - 10, 0.5);
  } else {
    ctx.beginPath();
    ctx.moveTo(blockX + 15, textY - 10);
    ctx.lineTo(blockX + blockW - 15, textY - 10);
    ctx.stroke();
  }
  textY += 5;

  // Details (smaller font)
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`Level: ${getTitleBlockData().level}`, textX, textY);
  textY += 20;
  ctx.fillText(`DM: ${getTitleBlockData().dmName}`, textX, textY);
  textY += 20;
  ctx.fillText(`Date: ${getTitleBlockData().date}`, textX, textY);
}

// Compass Rose System
export function getCompassPosition() {
  // Default: bottom-left corner
  return {
    x: 60,
    y: canvas.height - 60
  };
}

export function drawCompassRose(x, y, size = 50) {
  if (!getEffectsEnabled().compass) return;

  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#000';
  ctx.lineWidth = 1.5;

  // North (filled arrow)
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size * 0.15, y);
  ctx.lineTo(x, y - size * 0.2);
  ctx.lineTo(x + size * 0.15, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // South (outline arrow)
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x - size * 0.15, y);
  ctx.lineTo(x, y + size * 0.2);
  ctx.lineTo(x + size * 0.15, y);
  ctx.closePath();
  ctx.stroke();

  // East (filled)
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x, y - size * 0.15);
  ctx.lineTo(x + size * 0.2, y);
  ctx.lineTo(x, y + size * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // West (outline)
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x, y - size * 0.15);
  ctx.lineTo(x - size * 0.2, y);
  ctx.lineTo(x, y + size * 0.15);
  ctx.closePath();
  ctx.stroke();

  // Diagonal cross (NE, SE, SW, NW) - smaller
  const diagSize = size * 0.6;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + diagSize * 0.7, y - diagSize * 0.7);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + diagSize * 0.7, y + diagSize * 0.7);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - diagSize * 0.7, y + diagSize * 0.7);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - diagSize * 0.7, y - diagSize * 0.7);
  ctx.stroke();

  // Center circle
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Cardinal letters
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText('N', x, y - size - 12);
  ctx.fillText('S', x, y + size + 12);
  ctx.fillText('E', x + size + 12, y);
  ctx.fillText('W', x - size - 12, y);
}

// Age Spots (Foxing) Effect
export function drawAgeSpots(count = 20) {
  if (!getEffectsEnabled().ageSpots) return;

  ctx.fillStyle = 'rgba(139, 90, 43, 0.2)';

  for (let i = 0; i < count; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 1 + Math.random() * 3;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
