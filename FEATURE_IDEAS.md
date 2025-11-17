# 🎲 Dungeon Maker - Feature Priority Analysis

**What features would actually help DMs vs what's just cool?**

---

## 🔥 **HIGH IMPACT - DMs Will Use Every Session**

These directly solve real DM pain points during session prep and gameplay:

### 1. **Trap Markers with DC/Damage Notation** ⭐⭐⭐⭐⭐
**Problem:** DMs currently have to write trap info on paper or remember it
**Solution:**
- Trap icon markers (bear trap, pit, poison gas, dart, spike, etc.)
- Click trap → popup to enter:
  - Detection DC (e.g., "DC 15 Perception")
  - Disarm DC (e.g., "DC 13 Thieves' Tools")
  - Damage (e.g., "2d10 piercing")
  - Description (e.g., "Poison darts shoot from walls")
- Shows on map as small icon
- Export includes trap details in room key

**Effort:** Medium (2-3 hours)
**Value:** HUGE - every dungeon has traps!

---

### 2. **Monster/Encounter Markers** ⭐⭐⭐⭐⭐
**Problem:** DMs forget what monsters are in which rooms
**Solution:**
- Monster placement icons (generic tokens: humanoid, beast, undead, etc.)
- Click monster → enter:
  - Count (e.g., "3 goblins")
  - Stats (e.g., "AC 15, HP 7 each")
  - Behavior (e.g., "Patrol, alert on 5+")
- Color-coded by threat level (green=easy, yellow=medium, red=deadly)
- Shows as numbered tokens on map
- Export lists all encounters in room key

**Effort:** Medium (2-3 hours)
**Value:** HUGE - every room needs this!

---

### 3. **Text Annotations Anywhere** ⭐⭐⭐⭐
**Problem:** Can only add descriptions to rooms, not to specific spots
**Solution:**
- "Add Note" tool
- Click anywhere on map → type text
- Text appears as label or callout box
- Use cases:
  - "Secret door here (DC 18 Investigation)"
  - "Pressure plate - don't step!"
  - "Magical darkness - disadvantage on attacks"
  - "10ft pit (DC 12 Dex save or 1d6 damage)"

**Effort:** Low (1 hour)
**Value:** HIGH - super flexible!

---

### 4. **Measurement Ruler** ⭐⭐⭐⭐
**Problem:** Players ask "How far is that?" and you guess
**Solution:**
- Toggle "Ruler Mode"
- Click two points on map
- Shows distance in feet (assuming 5ft grid squares)
- Useful for:
  - Spell ranges (Fireball is 150ft)
  - Movement calculations
  - Line of sight checks

**Effort:** Low (30 minutes)
**Value:** HIGH - used every combat!

---

### 5. **DM Notes Layer (Hidden from Player Export)** ⭐⭐⭐⭐
**Problem:** DMs want to add notes players shouldn't see
**Solution:**
- Toggle "DM Notes" layer
- Add secret info invisible to players:
  - Secret doors location
  - Hidden treasure
  - Monster weaknesses
  - Plot clues
- When exporting:
  - "Player Map" - hides DM notes
  - "DM Map" - shows everything
- Two separate PNG exports

**Effort:** Medium (1-2 hours)
**Value:** HIGH - keeps secrets secret!

---

## 🎯 **MEDIUM IMPACT - Useful But Not Essential**

These are "nice to have" features that improve workflow:

### 6. **Treasure/Loot Generation** ⭐⭐⭐
**Problem:** DMs spend time rolling random treasure
**Solution:**
- Button: "Generate Treasure for Room"
- Based on:
  - Party level (input)
  - Room difficulty
  - Theme (classic = gold/gems, undead = cursed items)
- Auto-populates room description with loot
- Uses CR-appropriate treasure tables

**Effort:** Medium (2 hours)
**Value:** Medium - saves prep time

---

### 7. **Environmental Hazards** ⭐⭐⭐
**Problem:** Hard to show water, lava, chasms, etc.
**Solution:**
- New terrain types:
  - Water (blue fill, movement cost)
  - Lava (red/orange, damage zones)
  - Pit/Chasm (black void)
  - Difficult terrain (brown crosshatch)
  - Magical darkness (dark gray)
- Paint tool to draw areas
- Shows on map with distinct visual style

**Effort:** Medium (2-3 hours)
**Value:** Medium - not every dungeon needs it

---

### 8. **Multi-Level Dungeons** ⭐⭐⭐
**Problem:** Dungeons often have multiple floors
**Solution:**
- "Add Floor" button
- Floor tabs: "Level 1", "Level 2", "Level 3"
- Stairs connect between levels (click to jump)
- Export can show:
  - All levels separately
  - All levels on one sheet (stacked)

**Effort:** High (4-5 hours)
**Value:** Medium - only for complex dungeons

---

### 9. **Light Sources & Darkness Zones** ⭐⭐
**Problem:** Hard to track which areas are lit/dark
**Solution:**
- Toggle "Lighting Layer"
- Paint darkness zones (gray overlay)
- Add light source markers (torch, lantern, magical light)
- Shows radius of illumination
- Export with lighting effects

**Effort:** Medium (2 hours)
**Value:** Low-Medium - rarely critical

---

### 10. **Random Encounter Tables** ⭐⭐
**Problem:** DMs want random events in specific areas
**Solution:**
- Per-room encounter tables
- Click "Add Random Encounter"
- Enter list: "1-2: Wandering patrol, 3-4: Trap triggers, 5-6: Nothing"
- Button to roll encounter
- Stores in room description

**Effort:** Low (1 hour)
**Value:** Low - most DMs prep encounters ahead

---

## 📦 **LOW IMPACT - Cool But Niche**

These are "maybe someday" features:

### 11. **Area of Effect Templates** ⭐⭐
- Overlay spell AoE (Fireball = 20ft radius circle)
- Drag and position to see who's hit
- Useful for combat planning

**Effort:** Medium | **Value:** Low

---

### 12. **Token/Miniature Placement** ⭐⭐
- Drag tokens onto map
- Track initiative order
- Move during combat

**Effort:** High | **Value:** Low (VTTs do this better)

---

### 13. **Collaborative Editing** ⭐
- Multiple DMs edit same dungeon
- Real-time sync
- Requires server backend

**Effort:** VERY High | **Value:** Very Low

---

### 14. **3D Preview Mode** ⭐
- Render dungeon in 3D
- Walk through it

**Effort:** VERY High | **Value:** Low (gimmick)

---

### 15. **Sound Effects / Music** ⭐
- Play ambiance while editing
- Export with audio layers

**Effort:** High | **Value:** Very Low

---

## 🎯 **RECOMMENDED: What to Build Next**

If you want **maximum impact for minimum effort**, build these **5 features**:

### **Phase 5: DM Essentials Pack** (~6-8 hours total)

1. **Text Annotations** (1 hour) - Add notes anywhere
2. **Measurement Ruler** (30 min) - Measure distances
3. **Trap Markers** (2 hours) - Trap icons with DC/damage
4. **Monster Markers** (2 hours) - Encounter placement
5. **DM Notes Layer** (1-2 hours) - Hidden info for DM only

**Why these 5?**
- ✅ DMs use them EVERY session
- ✅ Solve real pain points
- ✅ Relatively easy to implement
- ✅ Don't duplicate what VTTs already do well
- ✅ Enhance the "map making" focus (not combat simulation)

---

## 🤔 **What NOT to Build**

**Don't build these** (at least not yet):

❌ **Combat Tracker** - VTTs do this better (Roll20, Foundry, etc.)
❌ **Initiative Tracker** - Same reason
❌ **Character Sheets** - Out of scope
❌ **Dice Roller** - Tons of apps already do this
❌ **Real-time Multiplayer** - Too complex, wrong tool for the job
❌ **3D Rendering** - Gimmick, not useful for DMs

**Why?** These duplicate existing tools or add complexity without value.

---

## 📊 **Feature Comparison Matrix**

| Feature | DM Value | Implementation Effort | Priority |
|---------|----------|---------------------|----------|
| Text Annotations | ⭐⭐⭐⭐⭐ | Low | **BUILD NOW** |
| Measurement Ruler | ⭐⭐⭐⭐⭐ | Low | **BUILD NOW** |
| Trap Markers | ⭐⭐⭐⭐⭐ | Medium | **BUILD NOW** |
| Monster Markers | ⭐⭐⭐⭐⭐ | Medium | **BUILD NOW** |
| DM Notes Layer | ⭐⭐⭐⭐ | Medium | **BUILD NOW** |
| Treasure Generation | ⭐⭐⭐ | Medium | Later |
| Environmental Hazards | ⭐⭐⭐ | Medium | Later |
| Multi-Level Dungeons | ⭐⭐⭐ | High | Later |
| Lighting Zones | ⭐⭐ | Medium | Maybe |
| Random Encounters | ⭐⭐ | Low | Maybe |
| AoE Templates | ⭐⭐ | Medium | Probably Not |
| Combat Tracker | ⭐ | High | **NO** |
| 3D Preview | ⭐ | Very High | **NO** |

---

## 💬 **Real DM Feedback** (Anticipated)

**What DMs will likely say:**

✅ **"I love the trap markers!"** - Solves a real problem
✅ **"DM notes layer is genius!"** - Keeps secrets organized
✅ **"Measurement tool saves time!"** - No more guessing distances
✅ **"Monster placement is perfect!"** - Visual encounter planning

❌ **"Why no initiative tracker?"** - "Use a VTT for combat"
❌ **"Can it do fog of war?"** - "Use a VTT, this is for prep"
❌ **"No 3D view?"** - "Not needed for D&D maps"

---

## 🎯 **Decision Framework**

### **Ask yourself for each feature:**

1. **Does it solve a REAL DM pain point?** (Not just "cool")
2. **Can't be done better by existing tools?** (VTTs, dice apps, etc.)
3. **Fits the "map making" scope?** (Not combat simulation)
4. **Is implementation effort worth the value?** (ROI)

**If YES to all 4 → Build it!**
**If NO to any → Skip it (for now)**

---

## ✅ **My Recommendation**

Build **Phase 5: DM Essentials Pack** with these 5 features:

1. Text Annotations
2. Measurement Ruler
3. Trap Markers
4. Monster Markers
5. DM Notes Layer

**Total time:** ~6-8 hours
**Total value:** MASSIVE for DMs
**Scope:** Focused on map prep, not combat

**After Phase 5, your app will be 95% of what DMs need!**

---

**Want me to build Phase 5?** Let me know which features to prioritize! 🎲
