# 🎲 Dungeon Maker - Dyson Style

A professional D&D dungeon map generator with Dyson Logos-inspired hand-drawn aesthetics, interactive symbols, vintage parchment effects, and comprehensive export capabilities.

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎨 Hand-Drawn Aesthetics (Phase 1)
- **Dyson Logos Style**: Organic, hand-drawn walls with natural wobble using Bezier curves
- **Cross-Hatching**: Authentic 45° diagonal line wall fills
- **Multiple Render Styles**: Modern (clean), Dyson (hand-drawn), Vintage (TSR blue grid)
- **Sketchy Corridors**: Natural variation in corridor rendering

### 🚪 Interactive Symbols (Phase 2)
- **Doors** (4 types): Normal, Secret (dashed with 'S'), Locked (keyhole), Portcullis (bars)
- **Stairs** (3 types): Up, Down, Spiral with directional arrows
- **Pillars**: Round and Square variants
- **Furniture**: Chest, Table, Altar, Statue
- **Auto-Detect Doors**: Automatically finds and places doors at corridor/room connections
- **Click-to-Place**: Interactive symbol placement system

### 📜 Parchment Effects (Phase 3)
- **Coffee Stains**: Realistic radial gradients with multiple rings
- **Title Block**: Ornate cartouche with dungeon name, DM name, date
- **Compass Rose**: 8-point directional indicator
- **Age Spots (Foxing)**: Authentic aged parchment effect
- **Live Toggles**: Enable/disable effects in real-time

### 📤 Professional Export (Phase 4)
- **Export Modal**: Beautiful dialog with live preview
- **Visual Styles**: Choose from Modern, Dyson, or Vintage rendering
- **Layouts**:
  - Map Only (800×600)
  - Map + Room Key (1700×1100 side-by-side)
- **Resolutions**: Standard (1x), High-DPI (2x), Print Quality (4x up to 3200×2400)
- **Smart Naming**: `dungeon_name_layout_YYYY-MM-DD.png`
- **Options**: Toggle effects, show grid overlay

### 🎲 Dungeon Generation
- **3 Algorithms**:
  - Classic Rooms (random placement)
  - BSP (Binary Space Partitioning)
  - Caves (Cellular Automata)
- **5 Templates**: Starter, Tower, Crypt, Mine, Castle
- **3 Size Options**: Small, Medium, Large
- **Density Control**: Adjust room density with slider
- **4 Themes**: Classic, Undead, Elemental, Aberration

### 💾 Save & Load
- **Auto-Save**: localStorage persistence
- **JSON Export/Import**: Full dungeon state serialization
- **Undo/Redo**: 50-level history stack
- **Background Images**: Import custom map backgrounds

## 🏗️ Architecture

### Modular Structure

```
dungeon-maker/
├── index.html              # Clean HTML structure (280 lines)
├── dungeon-maker.html      # Original monolithic version (3,000 lines)
├── README.md               # This file
│
├── css/                    # Stylesheets (568 lines total)
│   ├── main.css           # Base styles, layout, canvas (285 lines)
│   ├── controls.css       # UI controls, buttons, panels (165 lines)
│   └── modal.css          # Export modal styling (118 lines)
│
└── js/                     # JavaScript modules (2,851 lines total)
    ├── state.js           # Global state management (160 lines)
    ├── renderer.js        # Drawing & rendering functions (399 lines)
    ├── generator.js       # Dungeon generation algorithms (302 lines)
    ├── exporter.js        # Export system with DungeonExporter class (239 lines)
    ├── symbols.js         # Symbol system (doors, stairs, etc.) (397 lines)
    ├── effects.js         # Parchment effects (coffee stains, etc.) (298 lines)
    ├── ui.js              # Event handlers & interactions (869 lines)
    └── main.js            # Utilities, undo/redo, initialization (187 lines)
```

### Module Dependencies

```
state.js (no dependencies)
    ↓
effects.js, symbols.js
    ↓
renderer.js
    ↓
generator.js, exporter.js
    ↓
ui.js, main.js
```

## 🚀 Quick Start

### Option 1: Modular Version (Recommended)

```bash
# Clone the repository
git clone https://github.com/Jaureguy760/dnd-app.git
cd dnd-app

# Open in browser (requires web server for ES6 modules)
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### Option 2: Single File Version

Simply open `dungeon-maker.html` directly in your browser - no server required!

## 📖 Usage

1. **Generate a Dungeon**: Click "New Random Dungeon" or load a template
2. **Customize**: Adjust size, density, theme, and algorithm
3. **Add Symbols**: Click symbol buttons and place on map
4. **Apply Effects**: Toggle coffee stains, title block, compass
5. **Edit Rooms**: Click to select, drag to move, type descriptions
6. **Export**: Click "Export Map PNG" for professional output

### Keyboard Shortcuts

- `Delete/Backspace` - Remove selected room or symbol
- `Ctrl+Z` - Undo
- `Ctrl+Y` or `Ctrl+Shift+Z` - Redo
- Mouse drag - Move rooms

## 🛠️ Technical Details

- **Pure Vanilla JavaScript** - No framework dependencies
- **ES6 Modules** - Modern import/export syntax
- **Canvas 2D API** - All rendering done on HTML5 canvas
- **localStorage** - Auto-save functionality
- **File API** - Import/export JSON and images
- **Blob API** - PNG generation and download

### Browser Requirements

- Modern browser with ES6 module support
- Chrome 61+, Firefox 60+, Safari 11+, Edge 79+

## 📊 Stats

- **Total Lines**: ~3,699 lines (modular version)
- **Original**: ~3,000 lines (single file)
- **Refactoring**: 90.3% smaller main HTML file
- **Modules**: 8 JavaScript files, 3 CSS files
- **Features**: 4 major phases implemented

## 🎯 Development

### File Structure Overview

| File | Purpose | Lines |
|------|---------|-------|
| `state.js` | Global state, constants, templates | 160 |
| `renderer.js` | Drawing functions (hand-drawn, modern) | 399 |
| `generator.js` | 3 dungeon algorithms (BSP, CA, Rooms) | 302 |
| `exporter.js` | Professional export system | 239 |
| `symbols.js` | Doors, stairs, pillars, furniture | 397 |
| `effects.js` | Coffee stains, title block, compass | 298 |
| `ui.js` | All event handlers & interactions | 869 |
| `main.js` | Utilities, undo/redo, init | 187 |

### Key Classes

- **DungeonExporter** - Handles all export functionality with multi-resolution rendering

### Key Functions

- `render()` - Main rendering pipeline
- `generateDungeon()` - Dungeon generation dispatcher
- `setupEventHandlers()` - UI initialization
- `saveToLocalStorage()` - Persistence
- `autoDetectDoors()` - Smart door placement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - Feel free to use this for your D&D games!

## 🎮 Credits

- Inspired by **Dyson Logos** hand-drawn dungeon map style
- Built with ❤️ for the D&D community

## 🔮 Future Ideas

- [ ] More symbol types (traps, monsters, treasure)
- [ ] Multiple floors/levels
- [ ] Outdoor/wilderness generation
- [ ] SVG export option
- [ ] More parchment effects (burn marks, torn edges)
- [ ] Collaborative editing
- [ ] Mobile/touch support improvements

---

**Enjoy creating epic dungeons!** 🐉
