# Phase 6 Browser Testing Checklist

## Multi-Level Dungeons
- [ ] Click "Add Level" button - new level tab appears
- [ ] Switch between level tabs - map updates correctly
- [ ] Place stairs - stair link modal appears
- [ ] Select "Create new level" - new level created with reciprocal stair
- [ ] Select "Link to existing level" - link works
- [ ] Click linked stairs - modal offers to jump to linked level
- [ ] Jump to linked level - switches correctly
- [ ] Delete level (with confirmation) - level removed
- [ ] Cannot delete last level - button disabled
- [ ] Rename level - name updates in tab
- [ ] Generate dungeon on different levels - each level independent
- [ ] Save dungeon - reload page - all levels persist
- [ ] Export all levels (checkbox enabled) - multiple PNGs downloaded
- [ ] Export single level (checkbox disabled) - only current level exported
- [ ] Export includes level name in filename

## Environmental Hazards
- [ ] Click "Paint Mode" button - button highlights
- [ ] Click canvas in paint mode - terrain appears
- [ ] Change terrain type - different visuals render
- [ ] Adjust brush size slider - painted area size changes
- [ ] Click "Erase Mode" button - button highlights
- [ ] Click terrain in erase mode - terrain removed
- [ ] Paint water terrain - blue with waves
- [ ] Paint lava terrain - orange/red with glow
- [ ] Paint pit terrain - black with depth rings
- [ ] Paint difficult terrain - green with vegetation marks
- [ ] Paint darkness terrain - purple with fog
- [ ] Paint ice terrain - light blue with crystalline pattern
- [ ] Paint poison terrain - green with cloud effect
- [ ] Clear all terrain - all terrain removed on current level
- [ ] Export map with terrain - terrain visible in PNG
- [ ] Switch levels - terrain per-level works correctly

## Treasure Generation
- [ ] Click "Generate Loot" button - modal opens
- [ ] Set CR to 1 - generate treasure - low value loot
- [ ] Set CR to 20 - generate treasure - high value loot
- [ ] Uncheck "Coins" - generate - no coins in output
- [ ] Uncheck "Magic Items" - generate - no magic items
- [ ] Click "Re-roll" - new random treasure generated
- [ ] Click "Copy to Clipboard" - shows "Copied!" feedback
- [ ] Paste clipboard - treasure text pasted correctly
- [ ] Click "Add to DM Notes" - modal closes, note added
- [ ] Toggle "Show DM Notes" - treasure note visible/hidden

## More Symbols (Phase 6 Expansion)
- [ ] Change category to "Terrain Features" - symbols update
- [ ] Change category to "Interactive Objects" - symbols update
- [ ] Change category to "Containers" - symbols update
- [ ] Change category to "Dressing" - symbols update
- [ ] Change category to "Natural" - symbols update
- [ ] Select "fountain" - subtypes populate (ornate, simple, magical, dried)
- [ ] Select "lever" - subtypes populate (wall, floor, up, down)
- [ ] Select "brazier" - subtypes populate (lit, unlit, magical, cold)
- [ ] Place fountain symbol - fountain appears on map
- [ ] Place lever symbol - lever appears on map
- [ ] Place brazier symbol - brazier appears on map
- [ ] Place barrel symbol - barrel appears on map
- [ ] Place crate symbol - crate appears on map
- [ ] Place sack symbol - sack appears on map
- [ ] Place bones symbol - bones appear on map
- [ ] Place web symbol - web appears on map
- [ ] Place rubble symbol - rubble appears on map
- [ ] Place mushroom symbol - mushroom appears on map
- [ ] Place plant symbol - plant appears on map
- [ ] Place crystal symbol - crystal appears on map
- [ ] Place pool symbol - pool appears on map
- [ ] Change subtype - symbol renders with correct variant
- [ ] Export map with new symbols - symbols visible in PNG
- [ ] Load dungeon - all symbols persist
- [ ] Delete symbol - symbol removed

## Backward Compatibility
- [ ] Open old save (Phase 5) - auto-migrates to multi-level
- [ ] Old dungeon loads as "Level 1"
- [ ] All old features still work (rooms, doors, traps, etc.)
- [ ] Export old dungeon - exports correctly

## Integration
- [ ] No console errors on page load
- [ ] No console errors when using features
- [ ] All buttons clickable and working
- [ ] All modals open/close properly
- [ ] No visual glitches
- [ ] Performance is acceptable (no lag)
- [ ] Multi-level dungeons save to localStorage
- [ ] Multi-level dungeons export to JSON correctly
- [ ] Multi-level dungeons import from JSON correctly
- [ ] Terrain layers save per-level
- [ ] Symbols save per-level
- [ ] All Phase 5 DM tools work on each level independently

## Edge Cases
- [ ] Create 10+ levels - tabs scroll or wrap correctly
- [ ] Paint terrain over entire map - no performance issues
- [ ] Generate large treasure hoard - formats correctly
- [ ] Place 50+ symbols on one level - renders correctly
- [ ] Switch rapidly between levels - no glitches
- [ ] Delete level with linked stairs - links update correctly
- [ ] Export all levels with different terrain per level - each correct

## Known Limitations
- Maximum suggested levels: 10 (UI may become cluttered beyond this)
- Terrain brush size: 1-5 grid squares
- Symbol subtypes: Not all combinations have unique visuals
