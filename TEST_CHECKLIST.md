# 🧪 Dungeon Maker - Test Checklist

**Before your brother uses this, run through this 5-minute checklist!**

---

## 🚀 Step 0: Open the App

### For Single File Version (Easiest):
1. Navigate to `/home/user/dnd-app/`
2. Double-click `dungeon-maker.html`
3. Opens in your default browser

### For Modular Version:
```bash
cd /home/user/dnd-app
python3 -m http.server 8080
```
Then open: `http://localhost:8080` in Chrome/Firefox

**Open DevTools (F12) and check Console tab for errors!**

---

## ✅ Test 1: Initial Load (30 seconds)

**What to check:**
- [ ] Page loads without errors
- [ ] Console shows NO red errors (yellow warnings are OK)
- [ ] You see a canvas with a dungeon already on it (auto-generated)
- [ ] Right sidebar shows list of rooms
- [ ] All buttons are visible

**If you see errors in console:** Copy and paste them! Send them back.

**Expected result:** Clean page load, no red errors in console.

---

## ✅ Test 2: Generate New Dungeon (1 minute)

### 2.1 Basic Generation
- [ ] Click **"New Random Dungeon"** button
- [ ] A new dungeon appears on canvas
- [ ] Room list updates in sidebar
- [ ] No errors in console

### 2.2 Try Different Settings
- [ ] Change **Size** dropdown (Small/Medium/Large)
- [ ] Click "New Random Dungeon" again
- [ ] Map changes size accordingly

- [ ] Change **Algorithm** dropdown (Classic/BSP/Caves)
- [ ] Click "New Random Dungeon" again
- [ ] Map style changes (BSP is grid-like, Caves is organic)

- [ ] Adjust **Density** slider
- [ ] Generate new dungeon
- [ ] More/fewer rooms appear

**Expected result:** All generation options work, different dungeons each time.

---

## ✅ Test 3: Visual Styles (30 seconds)

- [ ] Change **Render Style** dropdown to "Modern Clean"
- [ ] Map updates to clean digital lines
- [ ] Walls are solid, no cross-hatching

- [ ] Change to "Hand-Drawn (Dyson)"
- [ ] Map updates to sketchy lines
- [ ] Walls have cross-hatch shading

- [ ] Change to "TSR Vintage"
- [ ] Map updates to blue grid style

**Expected result:** All three styles render correctly in real-time.

---

## ✅ Test 4: Room Interaction (1 minute)

### 4.1 Select Room
- [ ] Click a room on the canvas
- [ ] Room highlights (changes color or outline)
- [ ] Room is highlighted in sidebar too

### 4.2 Drag Room
- [ ] Click and hold on a room
- [ ] Drag it to a new position
- [ ] Room moves smoothly
- [ ] Release mouse - room stays in new position

### 4.3 Edit Room
- [ ] Click a room in sidebar
- [ ] Change room **type** dropdown (Chamber → Vault)
- [ ] Room color changes on map
- [ ] Type in **description** textarea
- [ ] Text saves (refresh page later to verify)

### 4.4 Delete Room
- [ ] Click a room on canvas
- [ ] Press **Delete** or **Backspace** key
- [ ] Room disappears from map and sidebar

**Expected result:** Full room editing works, drag-and-drop smooth.

---

## ✅ Test 5: Undo/Redo (30 seconds)

- [ ] Delete a room
- [ ] Click **"↶ Undo"** button (or press Ctrl+Z)
- [ ] Room comes back!

- [ ] Click **"↷ Redo"** button (or press Ctrl+Y)
- [ ] Room disappears again

- [ ] Make several changes, undo multiple times
- [ ] History works correctly

**Expected result:** Undo/redo work for all actions.

---

## ✅ Test 6: Symbols - Auto-Detect Doors (30 seconds)

- [ ] Generate a new dungeon (any algorithm)
- [ ] Click **"🚪 Auto-Detect Doors"** button
- [ ] Doors appear at corridor/room openings
- [ ] Doors show as double lines at thresholds
- [ ] Status message shows: "Auto-detected X doors"

**Expected result:** Doors automatically placed at all openings.

---

## ✅ Test 7: Symbols - Manual Placement (1 minute)

### 7.1 Place Door
- [ ] Click **"Door: Normal"** button
- [ ] Cursor changes or hint appears
- [ ] Click on map where you want door
- [ ] Door symbol appears

### 7.2 Place Stairs
- [ ] Click **"Stairs: Up"** button
- [ ] Click on map
- [ ] Stairs with up arrow appear

- [ ] Try "Stairs: Down" and "Stairs: Spiral"
- [ ] Different stair symbols appear

### 7.3 Place Furniture
- [ ] Click **"Furniture: Chest"** button
- [ ] Click on map
- [ ] Chest symbol appears

- [ ] Try Table, Altar, Statue
- [ ] All symbols place correctly

### 7.4 Place Pillars
- [ ] Click **"Pillar: Round"** or "Pillar: Square"
- [ ] Click on map
- [ ] Pillar appears

### 7.5 Delete Symbol
- [ ] Click on a placed symbol
- [ ] Press **Delete** key
- [ ] Symbol disappears

- [ ] OR click **"✕ Clear All Symbols"** button
- [ ] All symbols disappear

**Expected result:** All 10+ symbol types can be placed and deleted.

---

## ✅ Test 8: Parchment Effects (30 seconds)

### 8.1 Coffee Stains
- [ ] Check **"☕ Coffee Stains"** checkbox
- [ ] Brown stains appear on map
- [ ] Uncheck - stains disappear

### 8.2 Age Spots
- [ ] Check **"📜 Age Spots"** checkbox
- [ ] Small brown spots appear randomly
- [ ] Uncheck - spots disappear

### 8.3 Title Block
- [ ] Check **"🏰 Title Block"** checkbox
- [ ] Decorative box appears (top-right usually)
- [ ] Shows dungeon name, DM name, date

- [ ] Type in **"Dungeon Name"** input
- [ ] Title updates on map in real-time

- [ ] Type in **"DM Name"** input
- [ ] Name updates on map

### 8.4 Compass Rose
- [ ] Check **"🧭 Compass"** checkbox
- [ ] Compass appears showing N/S/E/W
- [ ] Uncheck - compass disappears

### 8.5 Refresh Effects
- [ ] Click **"🔄 Refresh Effects"** button
- [ ] Coffee stains move to new random positions
- [ ] Age spots regenerate

**Expected result:** All effects toggle on/off, title block updates dynamically.

---

## ✅ Test 9: Zoom Controls (30 seconds)

- [ ] Click **"+"** zoom button
- [ ] Map zooms in (gets bigger)

- [ ] Click **"-"** zoom button
- [ ] Map zooms out (gets smaller)

- [ ] Zoom label shows percentage (e.g., "150%")

- [ ] Click **"Reset"** button
- [ ] Zoom returns to 100%

**Expected result:** Zoom works smoothly at all levels (50% to 200%).

**CRITICAL:** This was one of the bugs we fixed! If zoom doesn't work, there's still a problem.

---

## ✅ Test 10: Export PNG (2 minutes) **MOST IMPORTANT**

### 10.1 Open Export Modal
- [ ] Click **"Export Map PNG"** button
- [ ] Modal dialog appears with fancy UI
- [ ] Preview canvas shows miniature version of map
- [ ] All options visible (Style, Layout, Resolution)

### 10.2 Change Options & Watch Preview
- [ ] Click **"Modern Clean"** radio button
- [ ] Preview updates to modern style

- [ ] Click **"Hand-Drawn (Dyson)"** radio button
- [ ] Preview updates to sketchy style

- [ ] Click **"Map + Room Key"** layout
- [ ] Preview shows map on left, room list on right

- [ ] Click **"Map Only"** layout
- [ ] Preview shows just the map

- [ ] Click **"High Quality (2x)"** resolution
- [ ] Info text updates to show "1600×1200"

### 10.3 Download PNG
- [ ] Set options you want (e.g., Dyson, Map Only, 2x)
- [ ] Click **"📥 Download PNG"** button
- [ ] File downloads (check Downloads folder)
- [ ] Filename is like: `my_dungeon_map-only_2025-11-17.png`

### 10.4 Verify Downloaded File
- [ ] Open the downloaded PNG file
- [ ] Image looks good, high quality
- [ ] All details visible (doors, symbols, effects)
- [ ] If "Map + Key" was selected, room descriptions are there

### 10.5 Try Different Combinations
- [ ] Export as "Vintage" + "Map + Key" + "Print Quality (4x)"
- [ ] Download and open - should be huge file (3200×2400)

**Expected result:** Export modal works, preview updates, PNG downloads correctly.

**This is the most important feature for your brother!**

---

## ✅ Test 11: Save & Load (1 minute)

### 11.1 Auto-Save
- [ ] Make some changes (move rooms, add symbols)
- [ ] Close the browser tab
- [ ] Reopen `index.html` (or reload page)
- [ ] Your changes are still there!
- [ ] Status shows "Loaded from auto-save"

### 11.2 Export JSON
- [ ] Click **"Export JSON"** button
- [ ] JSON file downloads
- [ ] Open in text editor - should see room data

### 11.3 Import JSON
- [ ] Click **"Import JSON"** button
- [ ] Select the JSON file you just exported
- [ ] Dungeon loads from file
- [ ] Everything restored (rooms, symbols, effects)

**Expected result:** All save/load mechanisms work.

---

## ✅ Test 12: Templates (30 seconds)

- [ ] Click **"Load Template"** dropdown
- [ ] Select **"Wizard's Tower"**
- [ ] Click **"Load Template"** button
- [ ] Tower dungeon loads

- [ ] Try other templates:
  - [ ] Starter Dungeon
  - [ ] Ancient Crypt
  - [ ] Abandoned Mine
  - [ ] Castle Ruins

**Expected result:** All 5 templates load different dungeon layouts.

---

## ✅ Test 13: Keyboard Shortcuts (30 seconds)

- [ ] Select a room, press **Delete** key → Room deleted
- [ ] Make a change, press **Ctrl+Z** → Undo works
- [ ] Press **Ctrl+Y** → Redo works
- [ ] Press **Ctrl+Shift+Z** → Also does redo

**Expected result:** All keyboard shortcuts functional.

---

## ✅ Test 14: Background Image Import (30 seconds) (Optional)

- [ ] Click **"Load Map Image"** button
- [ ] Select an image file (PNG/JPG)
- [ ] Image loads as background on canvas
- [ ] You can trace over it with symbols

**Expected result:** Background image loads and displays.

---

## 📊 Final Check: Browser Console

**Before closing, check DevTools Console one more time:**

- [ ] **0 errors** (red text)
- [ ] Maybe some warnings (yellow) - that's OK
- [ ] No "Uncaught" exceptions
- [ ] No "Cannot read property of undefined"
- [ ] No "Module not found" errors

---

## 🎯 Summary Report

After completing all tests, rate each feature:

| Feature | Working? | Notes |
|---------|----------|-------|
| Dungeon Generation | ☐ Yes ☐ No | |
| Visual Styles | ☐ Yes ☐ No | |
| Room Editing | ☐ Yes ☐ No | |
| Drag & Drop | ☐ Yes ☐ No | |
| Undo/Redo | ☐ Yes ☐ No | |
| Auto-Detect Doors | ☐ Yes ☐ No | |
| Symbol Placement | ☐ Yes ☐ No | |
| Parchment Effects | ☐ Yes ☐ No | |
| Zoom Controls | ☐ Yes ☐ No | |
| **Export PNG** | ☐ Yes ☐ No | **CRITICAL** |
| Save/Load | ☐ Yes ☐ No | |
| Templates | ☐ Yes ☐ No | |
| Keyboard Shortcuts | ☐ Yes ☐ No | |

---

## 🐛 If You Find Bugs

**For each bug:**

1. **What did you do?** (exact steps)
2. **What happened?** (wrong behavior)
3. **What should have happened?** (expected behavior)
4. **Console errors?** (copy/paste from DevTools)
5. **Screenshot?** (if visual bug)

**Send this info and I'll fix it ASAP!**

---

## 🏁 Checklist Complete!

If **80%+ features work**, it's good enough for your brother to try!

If **critical features fail** (Export, Generation, Symbols), report bugs immediately.

---

**Time to complete:** ~5-10 minutes

**Good luck!** 🎲
