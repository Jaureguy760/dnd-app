# Stair Linking System Implementation - Complete

## Summary
Successfully implemented a stair linking system that allows stairs to connect between dungeon levels, enabling navigation throughout multi-level dungeons.

## Files Modified

### 1. `/home/user/dnd-app/index.html`
**Lines Added:** 416-453 (38 lines)

**Changes:**
- Added stair linking modal (`stairLinkModal`) after the encounter modal
- Modal includes three destination options:
  - Create new level (auto-link) - Creates a new level and automatically places a linked return stair
  - Link to existing level - Links to an already created level
  - No link (decorative) - Places a non-functional stair

**Modal Elements:**
- Radio buttons for destination selection (`name="stairDest"`)
- Dropdown for selecting existing level (`id="stairDestLevel"`)
- Hint text that updates based on selection (`id="stairLinkHint"`)
- Save, Cancel, and Close buttons

### 2. `/home/user/dnd-app/js/ui.js`

#### A. State Variable (Line 53-54)
```javascript
// --- STAIR LINKING STATE ---
let pendingStair = null;
```
Stores stair placement data while waiting for user to configure the link.

#### B. Import Updates (Line 12)
Added imports: `levels, getCurrentLevel, addLevel, setCurrentLevel`
These were already present in the file from Phase 6 multi-level implementation.

#### C. Modified Stair Placement Logic (Lines 417-482)
**Before:** Stairs were placed immediately when clicked
**After:** Stairs show the linking modal first

Key changes:
- Intercepts stair placement when `placingSymbolType.includes('stairs')`
- Stores pending stair data (position, type, direction)
- Populates the level dropdown with all other levels
- Shows the modal instead of immediately placing the stair
- Non-stair symbols continue to work as before

#### D. Stair Linking Handlers (Lines 1361-1506)
New function `setupStairLinkingHandlers()` with three main handlers:

1. **Radio Button Handler** (Lines 1364-1379)
   - Enables/disables the level dropdown based on selection
   - Updates hint text dynamically

2. **Save Stair Link Button** (Lines 1381-1493)
   - Creates stair on current level with proper data structure
   - Handles three destination types:
     - **New Level**: Creates level with appropriate depth (+1 for up, -1 for down), places reciprocal stair at center
     - **Existing Level**: Places reciprocal stair on target level at center
     - **None**: Places decorative stair with no link
   - Establishes bidirectional links between stairs
   - Updates level tabs when new level is created
   - Saves state and renders

3. **Cancel/Close Buttons** (Lines 1495-1505)
   - Closes modal and clears pending stair data

#### E. Click Detection for Linked Stairs (Lines 569-580)
Modified symbol click detection in `handleCanvasClick()`:
- Detects clicks on stairs with `linkedStair` property
- Shows confirmation dialog with target level name
- Calls `switchToLevel()` to navigate to linked level
- Shows status message after jump

#### F. Setup Function Call (Line 1613)
Added `setupStairLinkingHandlers();` to `setupEventHandlers()`

## Data Structure

### Stair Symbol with Link
```javascript
{
  id: 'stair_1234567890_0.123',
  type: 'stairs_up' | 'stairs_down' | 'stairs_spiral',
  subtype: 'normal',
  x: 10,                    // Grid X position
  y: 5,                     // Grid Y position
  direction: 'up' | 'down' | 'spiral',
  roomId: null,
  linkedStair: {            // NEW - null if decorative
    levelIndex: 1,          // Target level array index
    stairId: 'stair_...'    // ID of linked stair on target level
  }
}
```

### Stair Linking is Bidirectional
When a stair is created with a link:
1. Stair A is placed on the current level with `linkedStair: {levelIndex: B, stairId: 'stairB_id'}`
2. Stair B is automatically placed on level B with `linkedStair: {levelIndex: A, stairId: 'stairA_id'}`

## User Flow

### Placing a Linked Stair
1. User clicks a stair button (Up/Down/Spiral) in the symbol palette
2. User clicks on the map where they want the stair
3. Modal appears with three options:
   - **Create new level**: Automatically creates a new level above/below current level and places reciprocal stair
   - **Link to existing**: Choose from dropdown of existing levels, places reciprocal stair on that level
   - **No link**: Places decorative stair
4. User clicks "Create Stair"
5. Stair is placed on current level
6. If linked, reciprocal stair is placed on target level at center (can be moved later)
7. Level tabs update if new level was created

### Using a Linked Stair
1. User clicks on a stair that has a link
2. Confirmation dialog appears: "This stair is linked to [Level Name]. Jump to that level?"
3. If confirmed, view switches to the target level
4. Status message shows: "Jumped to [Level Name]"

## Technical Notes

### Level Depth Calculation
- Ground level: `depth = 0`
- Tower levels: `depth = 1, 2, 3...` (positive)
- Basement levels: `depth = -1, -2, -3...` (negative)

When creating new level:
- Up stairs: `newDepth = currentDepth + 1`
- Down stairs: `newDepth = currentDepth - 1`

### Level Naming
Auto-generated names based on depth:
- `depth = 0`: "Ground Level"
- `depth > 0`: "Tower [depth]"
- `depth < 0`: "Basement [abs(depth)]"

### Reciprocal Stair Placement
Linked stairs on target level are placed at:
- X: `Math.floor(GRID_COLS / 2)` (center horizontally)
- Y: `Math.floor(GRID_ROWS / 2)` (center vertically)

This ensures they're visible and can be easily moved to the desired location.

### Stair Direction Inversion
Reciprocal stairs automatically invert direction:
- `stairs_up` creates `stairs_down` on target level
- `stairs_down` creates `stairs_up` on target level
- `stairs_spiral` remains `stairs_spiral` (bidirectional)

## Testing Checklist

- [x] Modal appears when placing stairs
- [x] Radio buttons enable/disable dropdown correctly
- [x] Hint text updates based on selection
- [x] "Create new level" option works
  - [x] Creates appropriate level (basement/tower)
  - [x] Places reciprocal stair
  - [x] Links are bidirectional
  - [x] Level tabs update
- [x] "Link to existing" option works
  - [x] Dropdown shows other levels
  - [x] Places reciprocal stair on target
  - [x] Links are bidirectional
- [x] "No link" option works
  - [x] Places decorative stair
  - [x] No linkedStair property
- [x] Clicking linked stair shows jump dialog
- [x] Jumping to linked level works
- [x] Status messages appear correctly
- [x] Cancel/Close buttons work
- [x] State is saved to localStorage
- [x] No JavaScript syntax errors

## Known Limitations

1. **No Link Editing**: Once a stair link is created, it cannot be edited through the UI. User must delete and recreate.
2. **No Link Breaking**: Deleting a stair doesn't automatically remove its reciprocal stair on the other level.
3. **Fixed Reciprocal Position**: Reciprocal stairs always appear at the center of the target level.
4. **Single Click to Jump**: Clicking a linked stair immediately shows the jump dialog (not double-click).

## Future Enhancements (Not Implemented)

1. Edit link destination after creation
2. Visual indicator on stairs showing they are linked (e.g., different color, icon)
3. Highlight linked stair on target level after jumping
4. Cascade delete (removing a stair removes its reciprocal)
5. Smart placement of reciprocal stair (e.g., near corridors/rooms)
6. Stair linking status in symbol properties panel
7. Keyboard shortcut for quick jump (e.g., Shift+Click)
8. Link visualization on minimap/level overview

## Integration with Existing Features

- ✅ Works with multi-level dungeon system (Phase 6)
- ✅ Works with undo/redo system
- ✅ Works with save/load (localStorage)
- ✅ Works with JSON export/import
- ✅ Works with symbol deletion
- ✅ Works with symbol selection
- ✅ Respects render styles (modern/dyson/vintage)

## Implementation Complete
All requested features have been successfully implemented and tested.
