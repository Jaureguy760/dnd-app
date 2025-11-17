import { GRID_SIZE, rooms, titleBlockData, traps, encounters, dmNotes, showDmNotes } from './state.js';
import { render } from './renderer.js';

// --- PHASE 4: EXPORT SYSTEM ---

export class DungeonExporter {
  constructor() {
    this.options = {
      style: 'dyson',
      layout: 'map-only',
      resolution: 1,
      includeEffects: true,
      showGrid: false,
      includeDmNotes: false
    };
  }

  gatherOptions() {
    this.options.style = document.querySelector('input[name="exportStyle"]:checked')?.value || 'dyson';
    this.options.layout = document.querySelector('input[name="exportLayout"]:checked')?.value || 'map-only';
    this.options.resolution = parseInt(document.querySelector('input[name="exportRes"]:checked')?.value || '1');
    this.options.includeEffects = document.getElementById('exportIncludeEffects')?.checked ?? true;
    this.options.showGrid = document.getElementById('exportShowGrid')?.checked ?? false;
    this.options.includeDmNotes = document.getElementById('exportIncludeDmNotes')?.checked ?? false;
  }

  createExportCanvas() {
    const canvas = document.createElement('canvas');
    const scale = this.options.resolution;

    if (this.options.layout === 'map-only') {
      canvas.width = 800 * scale;
      canvas.height = 600 * scale;
    } else if (this.options.layout === 'map-key') {
      canvas.width = 1700 * scale;
      canvas.height = 1100 * scale;
    }

    return canvas;
  }

  async renderMapOnly(exportCanvas) {
    const exportCtx = exportCanvas.getContext('2d');
    const scale = this.options.resolution;

    exportCtx.scale(scale, scale);

    // Save current state
    const oldCtx = window.ctx;
    const oldStyle = window.renderStyle;
    const oldEffects = {...window.effectsEnabled};
    const oldShowDmNotes = window.showDmNotes;

    // Set export context
    window.ctx = exportCtx;
    window.renderStyle = this.options.style;

    if (!this.options.includeEffects) {
      window.effectsEnabled = {
        parchmentTexture: false,
        coffeeStains: false,
        ageSpots: false,
        titleBlock: false,
        compass: false
      };
    }

    // Hide DM notes if not included
    if (!this.options.includeDmNotes) {
      window.showDmNotes = false;
    }

    // Render full map
    render();

    // Add grid overlay if requested
    if (this.options.showGrid) {
      exportCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      exportCtx.lineWidth = 0.5;

      for (let x = 0; x <= 800; x += GRID_SIZE) {
        exportCtx.beginPath();
        exportCtx.moveTo(x, 0);
        exportCtx.lineTo(x, 600);
        exportCtx.stroke();
      }

      for (let y = 0; y <= 600; y += GRID_SIZE) {
        exportCtx.beginPath();
        exportCtx.moveTo(0, y);
        exportCtx.lineTo(800, y);
        exportCtx.stroke();
      }
    }

    // Restore state
    window.ctx = oldCtx;
    window.renderStyle = oldStyle;
    window.effectsEnabled = oldEffects;
    window.showDmNotes = oldShowDmNotes;

    exportCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  async renderMapAndKey(exportCanvas) {
    const exportCtx = exportCanvas.getContext('2d');
    const scale = this.options.resolution;

    exportCtx.scale(scale, scale);

    // Background
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, 1700, 1100);

    // Left 60%: Map
    const mapWidth = 1700 * 0.58;
    const mapHeight = 1100;
    const mapScale = Math.min(
      (mapWidth - 40) / 800,
      (mapHeight - 40) / 600
    );

    const mapX = 20;
    const mapY = (mapHeight - 600 * mapScale) / 2;

    exportCtx.save();
    exportCtx.translate(mapX, mapY);
    exportCtx.scale(mapScale, mapScale);

    // Render map
    const oldCtx = window.ctx;
    const oldStyle = window.renderStyle;
    const oldEffects = {...window.effectsEnabled};
    const oldShowDmNotes = window.showDmNotes;

    window.ctx = exportCtx;
    window.renderStyle = this.options.style;

    if (!this.options.includeEffects) {
      window.effectsEnabled = {
        parchmentTexture: false,
        coffeeStains: false,
        ageSpots: false,
        titleBlock: false,
        compass: false
      };
    }

    // Hide DM notes if not included
    if (!this.options.includeDmNotes) {
      window.showDmNotes = false;
    }

    render();

    window.ctx = oldCtx;
    window.renderStyle = oldStyle;
    window.effectsEnabled = oldEffects;
    window.showDmNotes = oldShowDmNotes;

    exportCtx.restore();

    // Right 40%: Room key
    const keyX = mapWidth + 20;
    const keyY = 40;
    const keyWidth = 1700 - keyX - 20;

    this.renderRoomKey(exportCtx, keyX, keyY, keyWidth);

    exportCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  renderRoomKey(ctx, x, y, maxWidth) {
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('Room Key', x, y);

    let currentY = y + 30;
    ctx.font = '14px Georgia, serif';
    const lineHeight = 20;

    rooms.forEach(room => {
      // Room header
      ctx.font = 'bold 14px Georgia, serif';
      const header = `${room.id}. ${room.type.toUpperCase()}`;
      ctx.fillText(header, x, currentY);
      currentY += lineHeight;

      // Description
      if (room.description) {
        ctx.font = '13px Georgia, serif';
        const wrapped = this.wrapText(ctx, room.description, maxWidth - 20);
        wrapped.forEach(line => {
          ctx.fillText(line, x + 15, currentY);
          currentY += lineHeight - 2;
        });
      }

      // Add trap info
      const roomTraps = traps.filter(t => {
        // Check if trap is within this room's bounds
        return t.x >= room.x && t.x < room.x + room.w &&
               t.y >= room.y && t.y < room.y + room.h;
      });

      if (roomTraps.length > 0) {
        ctx.font = 'italic 12px Georgia, serif';
        ctx.fillStyle = '#ff6600';
        roomTraps.forEach(trap => {
          const trapText = `⚠️ Trap: ${trap.trapType} (DC ${trap.detectionDC || '?'})`;
          ctx.fillText(trapText, x + 15, currentY);
          currentY += lineHeight - 4;
        });
        ctx.fillStyle = '#000';
      }

      // Add encounter info
      const roomEncounters = encounters.filter(e => {
        return e.x >= room.x && e.x < room.x + room.w &&
               e.y >= room.y && e.y < room.y + room.h;
      });

      if (roomEncounters.length > 0) {
        ctx.font = 'italic 12px Georgia, serif';
        ctx.fillStyle = '#cc0000';
        roomEncounters.forEach(enc => {
          const encText = `👹 ${enc.count || 1}x ${enc.monsterType || 'Monster'} (AC ${enc.ac || '?'}, HP ${enc.hp || '?'})`;
          ctx.fillText(encText, x + 15, currentY);
          currentY += lineHeight - 4;
        });
        ctx.fillStyle = '#000';
      }

      currentY += 10; // Spacing
    });
  }

  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  async export() {
    this.gatherOptions();
    const exportCanvas = this.createExportCanvas();

    // Render based on layout
    if (this.options.layout === 'map-only') {
      await this.renderMapOnly(exportCanvas);
    } else if (this.options.layout === 'map-key') {
      await this.renderMapAndKey(exportCanvas);
    }

    this.downloadPNG(exportCanvas);
  }

  downloadPNG(exportCanvas) {
    exportCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const timestamp = new Date().toISOString().slice(0, 10);
      const name = titleBlockData.dungeonName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${name}_${this.options.layout}_${timestamp}.png`;

      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png', 0.95);
  }
}

// Initialize exporter
export const exporter = new DungeonExporter();
