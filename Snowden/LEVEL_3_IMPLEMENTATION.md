# Level 3 Implementation Summary

## ✅ What Was Implemented

### 1. Level 3 Configuration
- Added complete Level 3 configuration to `LEVEL_CONFIGS` in `game.js`
- **Level Name:** "Floor 3 - Research Lab"
- **Guard Count:** 4 guards (1 per patrol path)
- **Document Count:** 3 documents
- **Hearing Range:** 200px
- **Catch Range:** 15px (proximity only, no vision)
- **Guard Speed:** 107 (Player speed 100 + 7)
- **Two-stage map system:**
  - `lvl-3-map.png` (door locked)
  - `lvl-3-map-open.png` (door open)

### 2. A* Pathfinding System
- Implemented standard A* pathfinding algorithm with grid-based navigation
- Grid size: 40px (balances performance and precision)
- 8-directional movement support
- Wall-aware navigation (respects PNG transparency collision)
- Fallback to direct line if path not found
- **Source:** Classic A* algorithm adapted for 2D game environment

### 3. Player Path Recording
- Records player position every 50ms (20 samples/second)
- Starts recording when first guard hears player
- Stores position + timestamp for synchronized playback
- Smooth enough for natural following behavior
- Minimal memory impact

### 4. Level 3 Guard AI (Path-Following)
Four distinct AI states:

#### State 1: PATROL MODE
- Guards patrol their assigned paths (like Levels 1 & 2)
- **Trigger:** When guard hears player within 200px
- **Action:** Start path recording, switch to "navigating" state

#### State 2: NAVIGATING
- Uses A* pathfinding to navigate to player's last heard location
- Updates destination every 1 second if player still in hearing range
- Smart pathfinding around walls
- Speed: 107 (slightly faster than player)

#### State 3: WAITING
- 3-second delay after reaching player's location
- Guards freeze in place
- Prepares to follow recorded path

#### State 4: FOLLOWING
- Follows player's recorded path with 3-second delay
- **Freeze mechanic:** When player stops moving, guard freezes immediately
- **Resume:** When player moves again, guard resumes following
- Guards maintain speed advantage (107 vs 100)

### 5. Map Transition System
- When all 3 documents collected:
  - Map automatically swaps from `lvl-3-map.png` to `lvl-3-map-open.png`
  - Collision data updates to match new map
  - Blue indicator appears pointing to door
- When player approaches door within 10px:
  - Blue indicator disappears
  - Transitions to "Level 3 Part 2"
  - Door passage opens new area (for future objectives)

### 6. Detection Changes
- **NO VISION CONES** on Level 3 (hearing only)
- Guards catch player by proximity only (15px)
- Red indicator wedges still show guard locations
- Guards are completely silent until they hear you

### 7. Assets & Sprites
- Added support for `droidbot.png` sprite (Level 3 guards)
- Preloads both map versions (`lvl-3-map.png` and `lvl-3-map-open.png`)
- Separate sprite system from Level 1 cameras and Level 2 cops

### 8. Debug Controls
- Press `3` to jump to Level 3 in debug mode
- All existing debug controls maintained

### 9. Narrative Text
Added 3 new Level 3 document narratives:
1. "Advanced AI surveillance integration..."
2. "Quantum decryption prototypes..."
3. "Executive authorization for unrestricted domestic surveillance..."

---

## 📋 What You Need to Do Next

### REQUIRED: Create Level 3 Assets

#### 1. Map PNG Files (CRITICAL)
You need to create **TWO** PNG files for Level 3:

**File 1:** `assets/lvl-3-map.png`
- Your Level 3 floor plan with the door **CLOSED**
- The door should be a solid wall blocking Part 2 of the map
- Same dimensions as your other maps (6315 x 4467 recommended)
- Non-transparent pixels = walls, transparent pixels = walkable

**File 2:** `assets/lvl-3-map-open.png`
- **EXACT SAME** floor plan as `lvl-3-map.png`
- But with the door **REMOVED** (transparent where the door was)
- Guard positions, document positions, everything else stays the same
- Only difference: the door area is now walkable

#### 2. Droid Bot Sprite
**File:** `assets/droidbot.png`
- Sprite for Level 3 guards
- Recommended size: similar to your cop sprite (~41px)
- Will be automatically scaled to match guard size

### RECOMMENDED: Set Positions Using Tools

#### 3. Document Positions
**Tool:** `document-plotter-tool.html`
- Open the tool in your browser
- Load your `lvl-3-map.png`
- Click to place 3 documents
- Copy the coordinates and paste into `LEVEL_CONFIGS[3].documentPositions` in `game.js`

**Current placeholder positions:**
```javascript
documentPositions: [
    {x: 2500, y: 2000},  // Document 1 - Placeholder
    {x: 3500, y: 2500},  // Document 2 - Placeholder
    {x: 4000, y: 3000}   // Document 3 - Placeholder
]
```

#### 4. Exit Door Position
**Tool:** `document-plotter-tool.html`
- Place the exit door where you want it
- This is the door that "unlocks" Part 2
- Copy coordinates to `LEVEL_CONFIGS[3].exitPosition`

**Current placeholder:**
```javascript
exitPosition: {x: 1500, y: 2000}  // Door position - Placeholder
```

#### 5. Player Start Position
- Set where player spawns on Level 3
- Update `LEVEL_CONFIGS[3].playerStartX` and `playerStartY`

**Current placeholder:**
```javascript
playerStartX: 3000,  // Placeholder
playerStartY: 2000   // Placeholder
```

#### 6. Guard Patrol Paths (4 guards)
**Tool:** `patrol-path-tool.html`
- Create 4 patrol paths (one for each guard)
- These are their INITIAL patrols before hearing the player
- Copy all 4 paths and replace `LEVEL_CONFIGS[3].patrolPaths`

**Current placeholder:**
```javascript
patrolPaths: [
    // Path 1 - Simple placeholder
    [
        {x: 2000, y: 1500},
        {x: 2500, y: 1500},
        {x: 2500, y: 2000},
        {x: 2000, y: 2000}
    ],
    // ... 3 more paths (see game.js for all 4)
]
```

---

## 🎮 Testing Checklist

Once you have the assets in place:

### Basic Functionality
- [ ] Level 3 loads without errors
- [ ] Player spawns at correct position
- [ ] Map displays correctly
- [ ] 4 droid guards spawn and patrol

### Path Recording & Following
- [ ] Get within 200px of a guard (they should hear you)
- [ ] Guard should use A* to navigate toward you
- [ ] After reaching you, guard waits 3 seconds
- [ ] Guard then follows your exact path with 3-second delay
- [ ] When you stop moving, guard freezes
- [ ] When you move again, guard resumes

### Document Collection
- [ ] Collect all 3 documents
- [ ] Map should swap to `lvl-3-map-open.png` automatically
- [ ] Blue indicator appears pointing to door

### Part 2 Transition
- [ ] Approach door within 10px
- [ ] Blue indicator disappears
- [ ] Console shows "Level 3: Player passed through door, entering Part 2..."

### Guards
- [ ] Guards catch you at 15px proximity (no vision cones)
- [ ] Red indicator wedges show guard positions
- [ ] Multiple guards can hear you and all start following
- [ ] Each guard has independent delays

---

## 🔧 Configuration Guide

All Level 3 settings are in `game.js` under `LEVEL_CONFIGS[3]`:

```javascript
3: {
    name: "Floor 3 - Research Lab",           // Level name
    guardCount: 4,                            // Number of guards
    guardHearingRange: 200,                   // How far guards can hear (px)
    guardCatchRange: 15,                      // Catch radius (px)
    guardSpeed: 107,                          // Guard speed (player is 100)
    usesPathFollowing: true,                  // Enable Level 3 AI
    
    // Asset files
    mapFile: "assets/lvl-3-map.png",          // Door closed
    mapFileOpen: "assets/lvl-3-map-open.png", // Door open
    
    // Positions (use plotter tools!)
    documentPositions: [...],
    exitPosition: {...},
    patrolPaths: [...]
}
```

---

## 🐛 Troubleshooting

### Guards not moving
- Check that `patrolPaths` has 4 valid paths
- Make sure path waypoints are not inside walls

### Path recording not starting
- Verify guard hearing range (200px)
- Check console for "Guard heard player!" message

### Map not swapping
- Ensure `lvl-3-map-open.png` exists in assets folder
- Check that file is loaded in preload (should be automatic)
- Look for console message: "Map changed to open version"

### A* pathfinding failing
- Grid size is 40px - very tight spaces may cause issues
- Guards will use direct line as fallback (watch console warnings)
- Consider making corridors at least 80px wide

### Guards catching through walls
- Check that map PNG has proper collision (non-transparent walls)
- Guards use same collision detection as player

---

## 📝 Future: Level 3 Part 2 Objectives

Currently, Part 2 is set up but has no objectives. When you're ready to add Part 2 content:

1. Define new document positions in `LEVEL_CONFIGS[3].part2Objectives`
2. Add additional guards for Part 2
3. Create final exit door position
4. Add Part 2 narrative text

**Location in code:** Search for `// TODO: Add Part 2 objectives` in `checkExitDoorProximity()` function

---

## 📊 Performance Notes

- A* pathfinding runs only when needed (guard hears player)
- Path recording is very lightweight (50ms intervals)
- Grid-based A* with 40px cells balances performance and precision
- Maximum 1000 iterations per pathfinding call (prevents hangs)

---

## 🎯 Key Differences from Levels 1 & 2

| Feature | Level 1 | Level 2 | Level 3 |
|---------|---------|---------|---------|
| Enemy Type | Cameras | Guards | Droid Guards |
| Detection | Vision (90°) | Vision (35°) + Hearing | **Hearing Only (200px)** |
| Catch Method | Vision | Vision | **Proximity (15px)** |
| AI Behavior | Rotate in place | Patrol + turn toward sound | **Path following** |
| Guard Count | 18 cameras | 12 guards | 4 guards |
| Guards per path | 2 | 2 | **1** |
| Map Changes | No | No | **Yes (door removal)** |
| Multi-part level | No | No | **Yes (Part 1 & 2)** |

---

## ✨ Implementation Highlights

1. **Zero impact on Levels 1 & 2** - All Level 3 code is isolated
2. **Smart pathfinding** - A* algorithm ensures guards navigate around obstacles
3. **Synchronized following** - Guards follow your exact path with perfect timing
4. **Dynamic map swapping** - Seamless transition when documents collected
5. **Scalable design** - Easy to add Part 2 objectives later

---

## 🚀 Next Steps

1. **Create the 3 required assets** (2 maps + 1 sprite)
2. **Use the plotter tools** to set exact positions
3. **Test the mechanics** with placeholder positions first
4. **Refine patrol paths** for optimal difficulty
5. **Add Part 2 objectives** when ready

---

**Questions?** Review the code comments in `game.js` - all Level 3 functions are well-documented!

