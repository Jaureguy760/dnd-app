import { getRooms, GRID_COLS, GRID_ROWS, sizeSelect, densityRange, themeSelect, algorithmSelect, setRooms, setSelectedRoomId, getCurrentLevel } from './state.js';
import { randInt, getThemePrompt } from './main.js';
import { render } from './renderer.js';
import { generateRoomContent } from './content-generator.js';

// --- DUNGEON GENERATION ALGORITHMS ---

// Classic room-based generation
export function generateRoomsDungeon() {
  const size = sizeSelect.value;
  const density = parseInt(densityRange.value, 10);

  let roomCount;
  let minSize, maxSize;

  if (size === 'small') {
    roomCount = 5 + density;
    minSize = 3; maxSize = 6;
  } else if (size === 'large') {
    roomCount = 12 + density;
    minSize = 4; maxSize = 8;
  } else {
    roomCount = 8 + density;
    minSize = 3; maxSize = 7;
  }

  // Override with custom sizes if available
  if (typeof window !== 'undefined' && window.customMinSize) {
    minSize = window.customMinSize;
  }
  if (typeof window !== 'undefined' && window.customMaxSize) {
    maxSize = window.customMaxSize;
  }

  const newRooms = [];
  let id = 1;

  while (newRooms.length < roomCount && id < roomCount + 20) {
    const w = randInt(minSize, maxSize);
    const h = randInt(minSize, maxSize);
    const x = randInt(1, GRID_COLS - w - 1);
    const y = randInt(1, GRID_ROWS - h - 1);

    let overlaps = false;
    for (const r of newRooms) {
      if (x < r.x + r.w + 1 && x + w + 1 > r.x &&
          y < r.y + r.h + 1 && y + h + 1 > r.y) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    newRooms.push({
      id: id,
      x, y, w, h,
      type: 'normal',
      description: '',
    });
    id++;
  }

  // Mark special rooms
  if (newRooms.length > 0) {
    newRooms[0].type = 'entrance';
    if (newRooms.length > 2) {
      newRooms[newRooms.length - 1].type = 'boss';
    }
    if (newRooms.length > 4) {
      newRooms[Math.floor(newRooms.length / 2)].type = 'treasure';
    }
    if (newRooms.length > 6) {
      newRooms[Math.floor(newRooms.length / 3)].type = 'trap';
    }
  }

  setRooms(newRooms);
  setSelectedRoomId(getRooms()[0]?.id ?? null);
  autoFillDescriptions();
}

// BSP (Binary Space Partitioning) algorithm
export function generateBSPDungeon() {
  const size = sizeSelect.value;
  const density = parseInt(densityRange.value, 10);

  let minRoomSize = size === 'small' ? 4 : size === 'large' ? 6 : 5;
  let splits = size === 'small' ? 3 : size === 'large' ? 5 : 4;
  splits += Math.floor(density / 3);

  class BSPNode {
    constructor(x, y, w, h) {
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.left = null; this.right = null;
      this.room = null;
    }

    split(depth) {
      if (depth === 0) return;

      const horizontal = Math.random() > 0.5;

      if (horizontal) {
        if (this.h < minRoomSize * 2) return;
        const splitPos = randInt(minRoomSize, this.h - minRoomSize);
        this.left = new BSPNode(this.x, this.y, this.w, splitPos);
        this.right = new BSPNode(this.x, this.y + splitPos, this.w, this.h - splitPos);
      } else {
        if (this.w < minRoomSize * 2) return;
        const splitPos = randInt(minRoomSize, this.w - minRoomSize);
        this.left = new BSPNode(this.x, this.y, splitPos, this.h);
        this.right = new BSPNode(this.x + splitPos, this.y, this.w - splitPos, this.h);
      }

      if (this.left) this.left.split(depth - 1);
      if (this.right) this.right.split(depth - 1);
    }

    createRoom() {
      if (this.left || this.right) {
        if (this.left) this.left.createRoom();
        if (this.right) this.right.createRoom();
      } else {
        const roomW = randInt(Math.floor(this.w * 0.5), Math.max(Math.floor(this.w * 0.9), Math.floor(this.w * 0.5) + 1));
        const roomH = randInt(Math.floor(this.h * 0.5), Math.max(Math.floor(this.h * 0.9), Math.floor(this.h * 0.5) + 1));
        const roomX = this.x + randInt(0, this.w - roomW);
        const roomY = this.y + randInt(0, this.h - roomH);
        this.room = { x: roomX, y: roomY, w: roomW, h: roomH };
      }
    }

    getRooms() {
      if (this.room) return [this.room];
      const rooms = [];
      if (this.left) rooms.push(...this.left.getRooms());
      if (this.right) rooms.push(...this.right.getRooms());
      return rooms;
    }
  }

  const root = new BSPNode(1, 1, GRID_COLS - 2, GRID_ROWS - 2);
  root.split(splits);
  root.createRoom();

  const bspRooms = root.getRooms();
  const newRooms = bspRooms.map((r, i) => ({
    id: i + 1,
    x: r.x,
    y: r.y,
    w: r.w,
    h: r.h,
    type: 'normal',
    description: ''
  }));

  // Mark special rooms
  if (newRooms.length > 0) {
    newRooms[0].type = 'entrance';
    if (newRooms.length > 2) {
      newRooms[newRooms.length - 1].type = 'boss';
    }
    if (newRooms.length > 4) {
      newRooms[Math.floor(newRooms.length / 2)].type = 'treasure';
    }
    if (newRooms.length > 6) {
      newRooms[Math.floor(newRooms.length / 3)].type = 'trap';
    }
  }

  setRooms(newRooms);
  setSelectedRoomId(getRooms()[0]?.id ?? null);
  autoFillDescriptions();
}

// Cellular Automata cave generation
export function generateCavesDungeon() {
  const density = parseInt(densityRange.value, 10);
  const fillProbability = 0.45 - (density * 0.02);

  // Create grid
  let grid = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));

  // Random fill
  for (let y = 1; y < GRID_ROWS - 1; y++) {
    for (let x = 1; x < GRID_COLS - 1; x++) {
      grid[y][x] = Math.random() < fillProbability ? 1 : 0;
    }
  }

  // Cellular automata iterations
  for (let iter = 0; iter < 4; iter++) {
    const newGrid = grid.map(row => [...row]);
    for (let y = 1; y < GRID_ROWS - 1; y++) {
      for (let x = 1; x < GRID_COLS - 1; x++) {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            neighbors += grid[y + dy][x + dx];
          }
        }
        newGrid[y][x] = neighbors >= 5 ? 1 : 0;
      }
    }
    grid = newGrid;
  }

  // Convert to rooms (find open areas)
  const visited = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(false));
  const foundRooms = [];
  let roomId = 1;

  function floodFill(startX, startY) {
    const cells = [];
    const queue = [[startX, startY]];
    visited[startY][startX] = true;

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      cells.push([x, y]);

      for (const [dx, dy] of [[-1,0], [1,0], [0,-1], [0,1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS &&
            !visited[ny][nx] && grid[ny][nx] === 0) {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }
    return cells;
  }

  for (let y = 1; y < GRID_ROWS - 1; y++) {
    for (let x = 1; x < GRID_COLS - 1; x++) {
      if (grid[y][x] === 0 && !visited[y][x]) {
        const cells = floodFill(x, y);
        if (cells.length > 15) {
          const xs = cells.map(c => c[0]);
          const ys = cells.map(c => c[1]);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          foundRooms.push({
            id: roomId++,
            x: minX,
            y: minY,
            w: maxX - minX + 1,
            h: maxY - minY + 1,
            type: 'normal',
            description: ''
          });
        }
      }
    }
  }

  const newRooms = foundRooms.slice(0, 15);

  if (newRooms.length > 0) {
    newRooms[0].type = 'entrance';
    if (newRooms.length > 2) {
      newRooms[newRooms.length - 1].type = 'boss';
    }
    if (newRooms.length > 4) {
      newRooms[Math.floor(newRooms.length / 2)].type = 'treasure';
    }
  }

  setRooms(newRooms);
  setSelectedRoomId(getRooms()[0]?.id ?? null);
  autoFillDescriptions();
}

export function generateDungeon() {
  const algorithm = algorithmSelect.value;

  switch(algorithm) {
    case 'bsp':
      generateBSPDungeon();
      break;
    case 'caves':
      generateCavesDungeon();
      break;
    default:
      generateRoomsDungeon();
  }

  render();
}

export function autoFillDescriptions() {
  const theme = themeSelect.value;
  const dungeonLevel = getCurrentLevel() + 1; // Convert 0-indexed to 1-indexed

  getRooms().forEach((room) => {
    if (!room.description) {
      room.description = generateRoomContent(room, theme, dungeonLevel);
    }
  });
}
