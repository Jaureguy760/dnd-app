# 🎲 Dungeon Maker - DM Quick Start Guide

**For Dungeon Masters who want to create awesome maps fast!**

---

## 🚀 How to Get Started (2 minutes)

### Step 1: Open the App

**Option A - Simple (Single File):**
1. Double-click `dungeon-maker.html`
2. It opens in your browser - DONE! ✅

**Option B - Modern (Modular Version):**
1. Open Terminal/Command Prompt
2. Navigate to the folder: `cd /path/to/dnd-app`
3. Run: `python3 -m http.server 8080`
4. Open browser to: `http://localhost:8080`

---

## 🗺️ Creating Your First Dungeon (30 seconds)

1. **Click "New Random Dungeon"** - Boom! Instant dungeon
2. **Adjust settings** if you want:
   - **Size**: Small (5-10 rooms), Medium (10-20), Large (20-30)
   - **Density**: Slide for more/fewer rooms
   - **Theme**: Classic, Undead Crypt, Elemental, Aberration
   - **Algorithm**:
     - Classic = Traditional scattered rooms
     - BSP = Organized grid-like layout
     - Caves = Natural cave system

3. **Pick a visual style**:
   - **Modern** - Clean digital lines (for VTTs like Roll20)
   - **Dyson** - Hand-drawn sketchy style (LOOKS AWESOME!)
   - **Vintage** - Old-school TSR blue grid

---

## ✏️ Making It Yours

### Add Descriptions to Rooms

1. Look at the **right sidebar** - lists all rooms
2. Click a room to select it
3. Type in the **description box** below it
4. Examples:
   ```
   "A dank chamber with collapsed pillars. 3 goblins hide behind rubble."
   "Throne room of the skeleton king. DC 15 Perception to spot the trap."
   "Altar to Orcus. Blood stains everywhere. Bad vibes."
   ```

### Change Room Types

1. Select a room (click on map OR click in sidebar)
2. Use the **dropdown** next to room number
3. Choose: Chamber, Hall, Throne Room, Vault, Crypt, etc.
4. Color changes automatically!

### Move Rooms Around

1. **Click and DRAG** rooms on the map
2. Position them how you want
3. Corridors stay connected!

---

## 🚪 Adding Cool Symbols (Phase 2)

### Doors

1. Click **"Auto-Detect Doors"** - It finds all openings and adds doors!
2. OR manually click door button, then click on map
3. **Door Types**:
   - **Normal** - Regular door (double lines)
   - **Secret** - Dashed outline with 'S'
   - **Locked** - Has a keyhole symbol
   - **Portcullis** - Vertical bars

### Stairs

1. Click stair button
2. Click on map where you want them
3. Types:
   - **Up** - Arrow pointing up
   - **Down** - Arrow pointing down
   - **Spiral** - Curved spiral symbol

### Furniture & Features

1. Click the symbol you want:
   - **Chest** - Treasure!
   - **Table** - Round table
   - **Altar** - Evil altar
   - **Statue** - Decorative statue
   - **Pillar** (Round or Square) - Columns

2. Click on map to place
3. Click **"Clear Symbols"** if you mess up

---

## 📜 Making It Look EPIC (Phase 3)

### Toggle Effects (Right Panel - "Map Effects")

✅ **Coffee Stains** - Makes it look like you spilled your DM coffee on it (authentic!)
✅ **Age Spots** - Brown foxing spots like old parchment
✅ **Title Block** - Fancy cartouche with dungeon name
✅ **Compass Rose** - Shows North/South/East/West

### Customize Title Block

1. Enter **Dungeon Name**: "Tomb of Horrors", "Goblin Warren", etc.
2. Enter **DM Name**: Your name!
3. Date fills automatically

### Refresh Effects

Click **"Refresh Effects"** to randomize coffee stains and age spots!

---

## 📤 Exporting for Your Game

### Click "Export Map PNG"

You'll see a fancy export dialog:

### Choose Your Style
- **Modern Clean** - For digital VTTs (Roll20, Foundry)
- **Hand-Drawn (Dyson)** - For MAXIMUM COOL FACTOR
- **TSR Vintage** - Nostalgic old-school vibes

### Choose Layout
- **Map Only** - Just the dungeon (800×600)
- **Map + Room Key** - Map on left, all room descriptions on right (perfect for printing!)

### Choose Resolution
- **Standard (1x)** - For screens, sharing online (800×600)
- **High Quality (2x)** - For high-DPI displays, VTTs (1600×1200)
- **Print Quality (4x)** - For PRINTING and large displays (3200×2400)

### Options
- ✅ **Include visual effects** - Coffee stains, title block, etc.
- ✅ **Show grid overlay** - Add grid for VTT alignment

### Download!

Click **"📥 Download PNG"** and you're done!

File saves as: `your_dungeon_name_map-only_2025-11-17.png`

---

## 💾 Saving Your Work

### Auto-Save
- The app **auto-saves to your browser** every time you make changes
- Close the tab, come back later - it's still there!

### Export JSON (for backup)
1. Click **"Export JSON"**
2. Saves a `.json` file with EVERYTHING
3. Later, click **"Import JSON"** to restore it

### Import Background Image
- Click **"Load Map Image"**
- Use your own hand-drawn map as a background
- Trace over it with the tool!

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` or `Backspace` | Delete selected room or symbol |
| `Ctrl+Z` | Undo last action |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| Mouse drag | Move rooms around |

---

## 🎯 Pro DM Tips

### Quick Dungeon Workflow (5 minutes)

1. **Generate** a dungeon (30 seconds)
2. **Auto-detect doors** (5 seconds)
3. **Add a few stairs** for multiple levels (30 seconds)
4. **Throw in some furniture** (chests, altars, statues) (1 minute)
5. **Write room descriptions** for important rooms (2 minutes)
6. **Toggle effects** (coffee stains + title block) (10 seconds)
7. **Export as "Map + Room Key"** at High Quality (20 seconds)
8. **DONE!** You have a professional dungeon map with room key!

### Templates

Click **"Load Template"** for pre-made dungeons:
- **Starter Dungeon** - Simple 5-room starter
- **Wizard's Tower** - Vertical tower layout
- **Ancient Crypt** - Undead-themed tomb
- **Abandoned Mine** - Cave-like mine shafts
- **Castle Ruins** - Fortress layout

Tweak from there!

### Room Description Ideas

**Combat Encounters:**
```
"Guard room. 4 hobgoblins (AC 18, 11 HP each). Alert on 6."
```

**Traps:**
```
"Pressure plate trap. DC 15 Perception, DC 13 Dex Save or 2d10 poison darts."
```

**Treasure:**
```
"Chest (locked DC 15, trapped). Contains 200gp, +1 longsword."
```

**Atmosphere:**
```
"Foul-smelling chamber. Ancient bloodstains. Unsettling whispers."
```

**NPCs:**
```
"Prisoner cell. Captured merchant (Friendly, knows secret passage)."
```

---

## 🎲 Game Session Use

### Print Version
1. Export as **"Map + Room Key"** at **Print Quality (4x)**
2. Print it out
3. Cover the room key section
4. Reveal descriptions as players explore!

### Digital VTT Version
1. Export as **"Map Only"** at **High Quality (2x)**
2. Upload to Roll20, Foundry VTT, etc.
3. Use theater-of-mind for descriptions

### Hybrid
1. Export **"Map Only"** for players (clean)
2. Export **"Map + Room Key"** for you (DM reference)
3. Best of both worlds!

---

## ❓ Troubleshooting

**Q: Dungeon looks too crowded**
- A: Reduce the **Density** slider, generate new dungeon

**Q: Can't see all the rooms**
- A: Use zoom controls (+/- buttons)

**Q: Made a mistake**
- A: Press `Ctrl+Z` to undo!

**Q: Want to start over completely**
- A: Click "New Random Dungeon" or reload page

**Q: Modular version won't load in browser**
- A: You need a web server for ES6 modules. Use the single-file `dungeon-maker.html` instead!

---

## 🔥 Example Session Prep (Start to Finish)

**Scenario: You need a goblin hideout for tonight's game (it's in 2 hours!)**

1. Open Dungeon Maker *(5 seconds)*
2. Click "New Random Dungeon" *(2 seconds)*
3. Set: Size=Small, Theme=Classic, Algorithm=Caves *(10 seconds)*
4. Click "Auto-Detect Doors" *(2 seconds)*
5. Add a few chests in corner rooms *(20 seconds)*
6. Add descriptions:
   - Room 1: "Goblin barracks. 6 goblins sleeping. Loud snoring."
   - Room 4: "Boss chamber. Goblin chief (AC 15, 27 HP) + pet wolf."
   - Room 7: "Treasure hoard. 3 chests (trapped), 450gp total."
   *(2 minutes)*
7. Toggle: Coffee Stains ✅, Title Block ✅ *(5 seconds)*
8. Title: "Goblin Hideout", DM: [Your Name] *(10 seconds)*
9. Export as "Map + Room Key", High Quality *(10 seconds)*
10. Download, print or load to VTT *(1 minute)*

**Total time: ~4 minutes**

You're a prep wizard! 🧙‍♂️

---

## 📝 Final Notes

- **Old dungeon-maker.html still works** if you prefer the single file
- **All your data saves automatically** in the browser
- **Export JSON regularly** as backup
- **Experiment!** Can't break anything, just refresh the page

---

**Now go forth and create epic dungeons!** 🐉⚔️

*Questions? Check the main README.md or just experiment - it's intuitive!*
