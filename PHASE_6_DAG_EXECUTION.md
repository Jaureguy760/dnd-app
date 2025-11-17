# 🔀 Phase 6: DAG-Based Execution Plan

**Goal:** Build all 4 features in 8-10 hours with maximum parallelization

---

## 📊 Refined Dependency DAG

```
┌──────────────────────────────────────────────────────────────┐
│  WAVE 1a: State Refactoring (SEQUENTIAL - 1.5 hours)        │
│  - Refactor state.js for multi-level                         │
│  - Must be done first, everything depends on this            │
└────────────────────────────┬─────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┬──────────────┐
          │                  │                  │              │
          ▼                  ▼                  ▼              ▼
┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│ WAVE 1b (PARALLEL - 2 hours)                                          │
├─────────────────┼─┼─────────────────┼─┼──────────────┼─┼──────────────┤
│ Level Tabs UI   │ │ Stair Linking   │ │ Export Multi │ │ localStorage │
│ + CSS           │ │ System + Modal  │ │ Level Updates│ │ Multi-Level  │
│ (Agent 1)       │ │ (Agent 2)       │ │ (Agent 3)    │ │ (Agent 4)    │
└─────────────────┘ └─────────────────┘ └──────────────┘ └──────────────┘
          │                  │                  │              │
          └──────────────────┴──────────────────┴──────────────┘
                             │
          ┌──────────────────┴──────────────────┬──────────────┐
          │                                     │              │
          ▼                                     ▼              ▼
┌─────────────────────┐ ┌──────────────────────────┐ ┌─────────────────┐
│ WAVE 2 (PARALLEL - 3-4 hours)                                        │
├─────────────────────┼─┼──────────────────────────┼─┼─────────────────┤
│ Environmental       │ │ Treasure Generation      │ │ More Symbols    │
│ Hazards             │ │ + Loot Tables            │ │ (20+ types)     │
│ (Paint Tool)        │ │ + Modal                  │ │ + Categories    │
│ (Agent 5)           │ │ (Agent 6)                │ │ (Agent 7)       │
└─────────────────────┘ └──────────────────────────┘ └─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Integration &       │
                  │  Testing             │
                  │  (1 hour)            │
                  └──────────────────────┘
```

---

## 🌊 Execution Waves

### **Wave 1a: State Refactoring** (Sequential - 1.5 hours)
**1 agent, cannot be parallelized**
- Must be done first
- Changes core data model
- Everything else depends on this

### **Wave 1b: Infrastructure** (Parallel - 2 hours)
**4 agents running simultaneously**
- All depend on Wave 1a being complete
- Independent of each other
- Can run in parallel

### **Wave 2: Features** (Parallel - 3-4 hours)
**3 agents running simultaneously**
- All depend on Wave 1 being complete
- Independent of each other
- Can run in parallel

### **Wave 3: Integration** (Sequential - 1 hour)
**1 agent**
- Test all features together
- Fix integration issues
- Update documentation

---

## ⏱️ Time Breakdown

| Wave | Agents | Parallel? | Time |
|------|--------|-----------|------|
| 1a | 1 | No (sequential) | 1.5 hours |
| 1b | 4 | Yes | 2 hours |
| 2 | 3 | Yes | 3-4 hours |
| 3 | 1 | No (sequential) | 1 hour |
| **TOTAL** | **9 agents** | | **7.5-8.5 hours** |

**vs Sequential:** 12-16 hours
**Time Saved:** 40-50% faster! ⚡

---

## 🎯 Agent Task Assignments

### **Wave 1a: Agent 1 - State Refactoring**
**File:** `js/state.js`
**Task:** Refactor state from single-level to multi-level structure
**Time:** 1.5 hours
**Dependencies:** None (starting point)

### **Wave 1b: Agent 2 - Level Tabs UI**
**Files:** `index.html`, `css/controls.css`
**Task:** Add level navigation tabs and styling
**Time:** 2 hours
**Dependencies:** Wave 1a complete

### **Wave 1b: Agent 3 - Stair Linking**
**Files:** `js/ui.js`, `index.html` (stair modal)
**Task:** Implement stair linking system between levels
**Time:** 2 hours
**Dependencies:** Wave 1a complete

### **Wave 1b: Agent 4 - Export Multi-Level**
**File:** `js/exporter.js`
**Task:** Update export system for multiple levels
**Time:** 2 hours
**Dependencies:** Wave 1a complete

### **Wave 1b: Agent 5 - localStorage Multi-Level**
**File:** `js/main.js`
**Task:** Update persistence for multi-level + backward compatibility
**Time:** 2 hours
**Dependencies:** Wave 1a complete

### **Wave 2: Agent 6 - Environmental Hazards**
**Files:** `js/state.js`, `js/renderer.js`, `js/ui.js`, `index.html`
**Task:** Full paint tool + terrain rendering
**Time:** 3-4 hours
**Dependencies:** Wave 1 complete

### **Wave 2: Agent 7 - Treasure Generation**
**Files:** `js/treasure.js` (new), `js/ui.js`, `index.html`
**Task:** Loot tables + generation + modal
**Time:** 2-3 hours
**Dependencies:** Wave 1 complete

### **Wave 2: Agent 8 - More Symbols**
**Files:** `js/symbols.js`, `index.html`
**Task:** Add 20+ new symbol types + category system
**Time:** 2-3 hours
**Dependencies:** Wave 1 complete

### **Wave 3: Agent 9 - Integration**
**Files:** All modified files
**Task:** Test, debug, integrate, document
**Time:** 1 hour
**Dependencies:** All features complete

---

## 🚀 Ready to Execute!

**Total Sub-Agents:** 9 agents across 4 waves
**Total Time:** ~7.5-8.5 hours
**Parallelization:** 7 agents run in parallel (Waves 1b and 2)

Let's go! 🎲
