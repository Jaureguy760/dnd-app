# Phase 5 DM Tools - Quick Reference Guide

## Overview
Phase 5 adds essential DM tools for map preparation and session management.

---

## Features

### 📏 Distance Ruler
**Purpose:** Measure distances on the map for movement and spell ranges

**How to Use:**
1. Click "📏 Measure Distance" button
2. Click first point on map
3. Click second point to see distance in feet
4. Press ESC to exit ruler mode

**Notes:**
- Distance calculated as 5 feet per grid square
- Uses Pythagorean distance (diagonal = √2)
- Distance label appears on map

---

### 📝 Annotations (Text Notes)
**Purpose:** Add custom text labels anywhere on the map

**How to Use:**
1. Click "📝 Add Note" button
2. Enter text in the prompt
3. Click on map to place the note
4. Click existing note to edit or delete

**Notes:**
- Appears as white box with black text
- Visible to players in all exports
- Use for room names, hints, instructions

---

### 🪤 Traps
**Purpose:** Mark trap locations with full 5e mechanics

**How to Use:**
1. Select trap type from dropdown (Bear Trap, Pit, Dart, etc.)
2. Click "Place Trap" button
3. Click on map to place trap
4. Fill in trap details modal:
   - Detection DC
   - Disarm DC
   - Save Type
   - Damage
   - Description
5. Click existing trap to view details and delete

**Available Trap Types:**
- 🪤 Bear Trap
- 🕳️ Pit Trap
- 🎯 Dart Trap
- ☠️ Poison Gas
- ⚔️ Spike Trap
- 🔥 Fire Trap
- ✨ Magical Trap

**Notes:**
- Orange icons on map
- Each type has unique icon
- Listed in Map+Key export with room

---

### 👹 Monsters/Encounters
**Purpose:** Place and track monsters with stats

**How to Use:**
1. Select creature type from dropdown
2. Click "Place Monster" button
3. Click on map to place encounter
4. Fill in encounter details:
   - Name/Type (e.g., "Goblin")
   - Count (how many)
   - AC
   - HP (per creature)
   - Difficulty (Easy/Medium/Hard)
   - Behavior notes
   - Additional notes
5. Click existing encounter to view/delete

**Difficulty Colors:**
- 🟢 Green = Easy
- 🟡 Yellow = Medium
- 🔴 Red = Hard

**Notes:**
- Colored tokens show count
- Listed in Map+Key export
- Full stats visible on click

---

### 🔒 DM Notes (Secret Layer)
**Purpose:** Add notes visible only to DM, hidden from players

**How to Use:**
1. Click "Add Secret Note" button
2. Enter secret text
3. Click map to place
4. Toggle "Show DM Notes" checkbox to hide/show
5. Click note to edit or delete

**Export Behavior:**
- **Player Export:** DM notes HIDDEN (default)
- **DM Export:** Check "Include DM Notes" in export modal

**Visual Styling:**
- Red dashed border
- Pink background
- Red text
- Only visible when checkbox checked

**Use Cases:**
- Hidden treasure locations
- Secret doors
- Plot hooks
- Trap solutions
- NPC motivations

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ESC | Cancel ruler mode |
| Delete | Delete selected room/symbol |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |

---

## Export Options

### JSON Export
**Includes ALL Phase 5 data:**
- ✅ Annotations
- ✅ Traps
- ✅ Encounters
- ✅ DM Notes
- ✅ DM Notes visibility state

### PNG Export
**Options:**
- Map style (Modern/Dyson/Vintage)
- Layout (Map Only / Map+Key)
- Resolution (Standard/High/Print)
- **Include DM Notes** checkbox

**Map+Key Export includes:**
- Room descriptions
- Trap locations and DCs
- Encounter stats and counts

---

## Data Persistence

### Auto-Save
All Phase 5 data is automatically saved to browser localStorage:
- Every time you place/edit/delete an element
- When toggling DM notes visibility
- Restored when you reload the page

### Manual Save
Use "Export JSON" to save a complete dungeon file that can be:
- Shared with other DMs
- Backed up externally
- Version controlled
- Imported on any device

---

## Best Practices

### For Session Prep
1. **First Pass:** Generate dungeon, adjust rooms
2. **Second Pass:** Add doors, symbols, furniture
3. **Third Pass:** Place traps and encounters
4. **Fourth Pass:** Add DM notes with secrets
5. **Final:** Export two versions (Player + DM)

### DM Notes Strategy
Use DM notes for:
- ✅ Secret doors and hidden passages
- ✅ Treasure details not visible on map
- ✅ NPC locations and motives
- ✅ Trap triggers and solutions
- ✅ Plot-critical information

Use Annotations for:
- ✅ Room names and numbers
- ✅ Public information players can see
- ✅ Direction indicators
- ✅ Points of interest

### Trap Placement Tips
- Place traps at chokepoints
- Use varied types for different challenges
- Set DC based on party level (Easy: 10-12, Medium: 13-15, Hard: 16+)
- Add description for flavor and narrative

### Encounter Placement
- Use difficulty color coding for balance
- Place easy encounters near entrance
- Save hard encounters for deeper areas
- Group related creatures together

---

## Workflow Example

**Preparing "The Lost Crypt" for Session 1:**

1. Generate dungeon with Crypt template
2. Add entrance doors (Auto-Detect)
3. Place 2 bear traps in corridor (DC 13)
4. Place 4 skeletons in main hall (Easy, green)
5. Place lich in final chamber (Hard, red)
6. Add DM note: "Secret door behind statue"
7. Add annotation: "Entrance Hall"
8. Export JSON for backup
9. Export PNG (Player version) - DM notes unchecked
10. Export PNG (DM version) - DM notes checked

**During Session:**
- Players see clean map with rooms and monsters
- DM sees secret notes about hidden doors
- Click monsters to recall stats quickly
- Use ruler to check spell ranges

**After Session:**
- Update notes based on what happened
- Remove defeated encounters
- Add new notes for next session
- Export updated JSON

---

## Troubleshooting

**DM Notes not visible?**
- Check "Show DM Notes" checkbox is enabled
- Verify notes were placed (red boxes)
- Ensure notes aren't behind other elements

**Traps not showing?**
- Orange icons should be visible after placement
- Click "Place Trap" and complete modal
- Check browser console for errors

**Exports missing data?**
- Verify "Include DM Notes" checkbox if needed
- Ensure data was saved (check auto-save message)
- Try exporting JSON first to verify data exists

**Can't delete element?**
- Click element to select it first
- Use Delete key or click element and confirm

---

## Technical Details

**Data Storage:**
- Phase 5 data stored in `annotations`, `traps`, `encounters`, `dmNotes` arrays
- Persisted to `localStorage.dungeonMaker_autoSave`
- Exported/imported via JSON with full fidelity

**Rendering Order:**
1. Background & grid
2. Rooms & corridors
3. Symbols (doors, stairs, furniture)
4. **Traps** ← Phase 5
5. **Encounters** ← Phase 5
6. **Annotations** ← Phase 5
7. **DM Notes** (if visible) ← Phase 5
8. **Ruler** (if active) ← Phase 5
9. Effects (coffee stains)
10. Title block & compass

**Performance:**
- All Phase 5 elements rendered every frame
- No performance impact with <100 elements
- Browser localStorage limit: ~5-10MB (sufficient for 1000+ elements)

---

## Future Enhancements (Not Yet Implemented)

Potential additions for Phase 6+:
- Sound/light radius indicators
- Line of sight visualization
- Initiative tracker integration
- Condition markers
- Area of effect templates
- Fog of war layer

---

**For questions or issues, refer to:**
- `INTEGRATION_REPORT.md` - Full technical integration details
- `PHASE_5_PLAN.md` - Original feature specifications
- GitHub issues (if applicable)
