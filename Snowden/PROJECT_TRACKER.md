# Snowden Game - Development Tracker

## Project Overview
**Game:** Snowden - 2D Top-Down Stealth Game  
**Framework:** Phaser.js  
**Theme:** Government Surveillance Dystopia  
**Style:** Architectural Blueprint Aesthetic  

---

## Current Status: Level 3 Implementation Complete!

**Started:** Today  
**Current Phase:** Phase 8 🟢 Complete (Level 3 - Advanced Mechanics)  
**Progress:** 🟢 Three-Level Game Complete | 🟢 Level 3 Path-Following AI & Connection Puzzle Implemented

---

## Development Phases

### ✅ Phase 1: Foundation & Setup - COMPLETE
**Status:** 🟢 Complete  
**Goal:** Get basic game running

#### Tasks:
- [x] 1.1 - Create project folder structure
- [x] 1.2 - Set up HTML file
- [x] 1.3 - Install/link Phaser.js (via CDN)
- [x] 1.4 - Create basic game.js file
- [x] 1.5 - Test Phaser runs in browser

**Deliverable:** ✅ Black screen with Phaser running

**Notes:**
- Used Phaser 3.70.0 from CDN
- Created welcome screen to confirm Phaser is working
- Added console logs for debugging
- TESTED SUCCESSFULLY in Chrome browser
- AudioContext warning is normal (will be handled in Phase 6)

---

### ✅ Phase 2: Player Movement - COMPLETE
**Status:** 🟢 Complete  
**Goal:** Get player moving on screen

#### Tasks:
- [x] 2.1 - Create player sprite (simple colored shape)
- [x] 2.2 - Implement arrow key controls
- [x] 2.3 - Add screen boundary collision
- [x] 2.4 - Test smooth movement
- [x] 2.5 - Optimize movement speed

**Deliverable:** ✅ Player moves around empty screen

**Notes:**
- Blue circle player sprite
- Smooth 8-directional movement
- Diagonal movement normalized
- TESTED SUCCESSFULLY 

---

### ✅ Phase 3: Level 1 Map - COMPLETE
**Status:** 🟢 Complete  
**Goal:** Create the game environment

#### Tasks:
- [x] 3.1 - Receive floor plan from client
- [x] 3.2 - Create PNG map (Artboard 1.png - 6315x4467)
- [x] 3.3 - Load PNG in Phaser
- [x] 3.4 - Set up proper scaling (camera follows player)
- [x] 3.5 - Implement transparency-based collision detection
- [x] 3.6 - Optimize pixel-perfect collision system
- [x] 3.7 - Test player movement with walls
- [x] 3.8 - Set up local server for CORS-free asset loading

**Deliverable:** ✅ Player moves in map with working collision

**Notes:**
- **PNG TRANSPARENCY-BASED COLLISION:** Revolutionary approach using alpha channel
- Map is loaded from `assets/Artboard 1.png`
- Map dimensions: 6315 x 4467 pixels
- Player size: 41px diameter (20.5 radius)
- Player starts at position (2953, 2361)
- **Collision System:** Pixel-perfect transparency detection
  - Checks alpha channel of PNG pixels
  - Non-transparent pixels (alpha > 10) = impassable walls
  - Transparent pixels = walkable space
  - Samples 16 points around player's circular edge per frame
  - Smooth push-back when player hits walls
- **Simple Rule:** Anything visible on PNG = wall, transparent = walkable
- **Controls:** Both Arrow Keys and WASD supported
- Camera zoom: 1:1 scale
- Background: Pure black (#000000) for clean aesthetic
- **Performance:** Fast pixel lookups with cached ImageData
- **Local server:** Running on http://127.0.0.1:8000 to avoid CORS issues
- **TESTED SUCCESSFULLY** - All collisions working perfectly! 

---

### ✅ Phase 4: Guards & Detection - COMPLETE
**Status:** 🟢 Complete  
**Goal:** Add stealth mechanics

#### Tasks:
- [x] 4.1 - Create guard sprite (red)
- [x] 4.2 - Implement basic patrol route
- [x] 4.3 - Test guard movement
- [x] 4.4 - Create vision cone graphic
- [x] 4.5 - Implement line-of-sight detection
- [x] 4.6 - Add hearing radius (circle)
- [x] 4.7 - Test detection system
- [x] 4.8 - Create game over state
- [x] 4.9 - Add restart functionality
- [x] 4.10 - Create visual indicator system (Fortnite-style)
- [x] 4.11 - Replace player sprite with Snowdy character
- [x] 4.12 - Polish UI and remove clutter

**Deliverable:** ✅ Advanced stealth detection system with intelligent guard AI

**Notes:**
- **Player Character:** Snowdy sprite (snowdy.png), 41px diameter
- **Guard Sprites:** Red circles, 41px diameter (same size as player)
- **Guard Count:** 12 guards (2 per patrol path)
- **Guard Speed:** 65 normal, 102 when hearing player
- **Patrol System:**
  - 6 predefined complex patrol paths from LVL1-coppaths.png
  - Guards patrol back-and-forth along paths
  - 30% chance to pause for 3 seconds at waypoints
  - Guards reverse direction if they hear player from behind (>90° angle)
- **Vision System:**
  - Range: ~308px (PLAYER_RADIUS * 15)
  - Cone angle: 65 degrees
  - **Raycast rendering** - vision cones clip at walls (32 rays per cone)
  - Guards face their walking direction
  - Dynamic rotation: look left/right ±72° while moving
  - Full 360° rotation when paused
  - Rotation speed: 0.003-0.008 random (normal), 0.014 (when hearing)
- **Hearing System:**
  - Range: 150px radius
  - Triggers vision rotation toward sound source at 0.014 speed
  - Guards speed up to 102 when hearing player
  - Guards reverse patrol path if sound comes from behind
- **Detection Logic:**
  - Player only caught when vision cone **sees** them (not just hearing)
  - Line-of-sight blocked by walls (pixel-perfect)
  - Vision and hearing work together for realistic AI
- **Visual Indicator System (Fortnite-style):**
  - Directional threat awareness ring around player
  - 30px radius, renders below player sprite
  - Red pie-wedge sections point to guards within 425px
  - Transparent ring outline (only wedges visible)
  - 40° wedge width for clear directional cues
  - Ready for green objective wedges (Phase 5)
- **Game Over:**
  - "CAUGHT!" message displayed
  - 1-second delay before restart
  - Guards and player reset to starting positions
- **Wall Collision:** Guards obey same collision rules as player
- **UI:** Clean minimal interface, CSS vignette atmosphere
- **TESTED SUCCESSFULLY** - All systems working perfectly!

---

### ✅ Phase 5: Items & Objectives - COMPLETE
**Status:** 🟢 Complete  
**Goal:** Add collectibles and win condition

#### Tasks:
- [x] 5.1 - Create document plotter tool
- [x] 5.2 - Build complete UI grid system
- [x] 5.3 - Add CRT monitor effect
- [x] 5.4 - Implement document sprites with interactions
- [x] 5.5 - Build typing mini-game overlay
- [x] 5.6 - Implement timing slider checkpoints
- [x] 5.7 - Add green indicator wedges for documents
- [x] 5.8 - Implement exit door system
- [x] 5.9 - Create victory screen with stats
- [x] 5.10 - Add typewriter narrative effect

**Deliverable:** ✅ Complete Level 1 gameplay loop with advanced UI

**Notes:**
- **Document Plotter Tool:** Created `document-plotter-tool.html` for easy document/exit placement
- **UI Grid System:** Complete terminal aesthetic interface
  - Top bar: Floor title and objective
  - Left panel: Live mini-map showing player position
  - Right panel: Stats (difficulty, building, time, guards, documents)
  - Bottom panel: Narrative text with typewriter effect
  - CRT monitor effect on game viewport (scanlines, phosphor glow)
- **Document System:**
  - 3 collectible documents (placeholder graphics, will accept PNG uploads)
  - Blinking animation (stops when player is near)
  - "Press ENTER" prompt at 50px proximity
  - Green indicator wedge points to nearest uncollected document (1000px radius)
- **Mini-Game System:**
  - Typing challenge: Type any keys to decrypt file
  - Text reveals progressively as you type
  - 20-second timer (adjustable constant: `MINIGAME_TIME_LIMIT`)
  - 100 characters required (adjustable: `MINIGAME_CHARS_REQUIRED`)
  - Timing slider checkpoints at 50% and 100%
  - Fast slider speed (300px/s, adjustable: `TIMING_SLIDER_SPEED`)
  - Small tolerance zone (15px, adjustable: `TIMING_TOLERANCE`)
  - Guards can't catch you during mini-game
  - Time runs out = caught
  - "SUCCESS" message on completion
- **Exit Door:**
  - Orange rectangle, locked initially
  - Unlocks when all 3 documents collected
  - Changes to green when unlocked
  - Orange indicator wedge points to exit (1000px radius)
- **Victory Screen:**
  - "ACCESSED" fullscreen message (Serial font)
  - Shows stats: time, documents collected, level name
  - Continue button (same border style as UI)
  - Framework ready for Level 2 transition (Phase 7)
- **Narrative System:**
  - Typewriter effect in bottom panel
  - Different classified text for each document
  - Displays until next document or level complete
- **TESTED SUCCESSFULLY** - Full gameplay loop working!

---

### ✅ Phase 6: Polish & UI - COMPLETE
**Status:** 🟢 Complete  
**Goal:** Make it feel like a real game

#### Tasks:
- [x] 6.1 - Design and implement HUD
- [x] 6.2 - Add alert indicators
- [x] 6.3 - Create instruction screen
- [x] 6.4 - Add background music (optional)
- [x] 6.5 - Add sound effects (footsteps)
- [x] 6.6 - Balance guard speeds
- [x] 6.7 - Balance detection ranges
- [x] 6.8 - Full playthrough testing
- [x] 6.9 - Bug fixes

**Deliverable:** ✅ Polished Level 1

**Notes:**
- Complete UI grid system with mini-map, stats, time display
- Sprint system with energy bar
- Footstep sound effects with smooth fade
- Visual indicator system (Fortnite-style directional wedges)
- Guard sprites with cop PNG
- Balanced gameplay with clear objectives

---

### ✅ Phase 7: Multi-Level System - COMPLETE
**Status:** 🟢 Complete  
**Goal:** Expand the game with three distinct levels

#### Tasks:
- [x] 7.1 - Create Level 2 floor plan (lvl-2-map.png received)
- [x] 7.2 - Implement multi-level system architecture
- [x] 7.3 - Set up Level 1 cameras (9 cameras with camera-plotter-tool.html)
- [x] 7.4 - Set up Level 2 patrol paths (12 guards with 6 patrol paths)
- [x] 7.5 - Set up documents/exit for both levels
- [x] 7.6 - Enhanced camera plotter tool to show existing cameras
- [x] 7.7 - Test level switching and configurations
- [x] 7.8 - Test Level 1 → Level 2 transition via victory screen
- [x] 7.9 - Create Level 3 floor plan (lvl-3-map.png and lvl-3.1-map.png received)
- [x] 7.10 - Implement Level 3 advanced mechanics (path-following AI, connection puzzle)
- [x] 7.11 - Test all levels end-to-end
- [x] 7.12 - Final polish and collision fixes

**Deliverable:** ✅ Three-level game with distinct mechanics per level

**Notes:**
- **Multi-Level Architecture:** `LEVEL_CONFIGS` object supports unlimited levels
- **Level 1 - Server Room (lvl-2-map.png):**
  - 9 security cameras with rotating vision cones
  - Camera settings: 90° vision angle, rotation speed 0.006-0.011
  - 3 documents to collect
  - Exit door at (1468, 2519)
  - Player starts at (4445, 1856)
  - Uses camera.png sprite (30x30)
- **Level 2 - Lobby & Conference (lvl-1-map.png):**
  - 12 guards with intelligent patrol AI
  - 6 complex patrol paths (back-and-forth)
  - 3 documents to collect  
  - Exit door at (1441, 1216)
  - Player starts at (2953, 2361)
  - Uses existing guard system with vision cones and hearing
- **Level 3 - Research Labs (lvl-3-map.png / lvl-3.1-map.png):**
  - Two-part level with dynamic map change
  - Part 1: 4 guards with path-following AI, 3 documents
  - Part 2: 90-second connection puzzle (4 pairs, 8 points)
  - Orange doors (no victory, only transitions)
  - Guard hearing-only (200px), no vision
  - A* pathfinding with stamina system
  - Player starts at (1765, 1541)
  - Exit door at (2400, 2582)
- **Camera Plotter Tool Enhanced:**
  - Pre-loads existing cameras from game.js
  - Color-coded: Blue = existing, Red = new, Yellow = selected
  - "Reset to Existing" button to reload from game.js
  - Visual angle adjustment with drag-to-aim
  - Generates JavaScript code for easy copy/paste
- **Debug Controls:** Press "1" or "2" keys to switch between levels instantly
- **Cache-Busting:** Using `?v=4` parameter for fresh JS loads
- **TESTED SUCCESSFULLY** - Both levels working independently!

---

### ✅ Phase 8: Level 3 Advanced Mechanics - COMPLETE
**Status:** 🟢 Complete  
**Goal:** Implement complex multi-part level with new AI systems

#### Tasks:
- [x] 8.1 - Design Level 3 two-part structure
- [x] 8.2 - Implement player path recording system
- [x] 8.3 - Build 5-state guard AI (patrol/navigate/follow/exhausted/return)
- [x] 8.4 - Integrate A* pathfinding for guards
- [x] 8.5 - Add guard stamina system with energy bars
- [x] 8.6 - Implement dynamic map swapping
- [x] 8.7 - Create connection puzzle mini-game
- [x] 8.8 - Build connection plotter tool
- [x] 8.9 - Implement orange door system (non-victory)
- [x] 8.10 - Add green indicators for puzzle objectives
- [x] 8.11 - Fix collision system (24 points, 8px push)
- [x] 8.12 - Add typewriter effect for level intros
- [x] 8.13 - Create debug key for document collection
- [x] 8.14 - Test full Level 3 flow (Part 1 → Part 2)

**Deliverable:** ✅ Level 3 with path-following AI and interactive connection puzzle

**Notes:**
- **Level 3 - Research Labs:**
  - Two-part level: Document collection → Connection puzzle
  - Part 1: 4 guards with hearing-only detection (200px radius)
  - Guards record and follow player's exact path
  - A* pathfinding navigates around walls intelligently
  - Stamina system: 15s chase, 3s pause, return to patrol
  - Dynamic map change from `lvl-3-map.png` to `lvl-3.1-map.png`
  - Part 2: 90-second connection puzzle
  - 4 connection pairs (8 points), red circles and lines
  - Interactive line drawing follows player
  - Green indicators point to connection objectives
  - Orange doors for level transitions (never trigger victory)
- **Technical Implementation:**
  - Real-time path recording (50ms intervals)
  - 5-state AI state machine
  - A* pathfinding with 25px grid, 8-point collision checks
  - Guard energy bars (red, drain during chase only)
  - Connection plotter tool for puzzle design
  - Enhanced collision: 24 sample points, 8px push-back
  - Typewriter effect for level names
  - Debug key "D" auto-collects documents on Level 3
- **Tools Created:**
  - `connection-plotter-tool.html` - Visual connection point placement
  - Updated all plotter tools for Level 3 support
- **Cache Version:** v27
- **TESTED SUCCESSFULLY** - All Level 3 systems working perfectly!

---

## Change Log

### Session 8 - Level 3 Advanced Mechanics (CURRENT)

**Phase 8 - Level 3 Implementation COMPLETE:**

**Level 3 Overview:**
- ✅ **Two-Part Level Structure:**
  - Part 1: Document collection with path-following guard AI
  - Part 2: 90-second connection puzzle mini-game
  - Dynamic map change when all documents collected
  - Orange doors (never trigger victory/level completion)
  
**Part 1 - Path-Following AI System:**
- ✅ **4 Level 3 Guards (Droidbot sprites):**
  - Hearing-only detection (200px radius, no vision cones)
  - Records and follows player's exact movement path
  - 5-state AI system: patrol → navigating → following → exhausted → returning
  - A* pathfinding for intelligent navigation around walls
  - Player path frozen when player stops moving
  
- ✅ **Guard Stamina System:**
  - Energy bar below each guard (red, 35px wide)
  - Chases player for 15 seconds before exhaustion
  - Energy drains only during chase (not patrol/return)
  - 3-second pause to fully recharge energy
  - Returns to last patrol position if player out of range
  
- ✅ **Advanced Pathfinding:**
  - Grid size: 25 pixels (precise navigation)
  - 8-point collision checking around guard radius
  - Guards obey wall physics (no clipping through walls)
  - Maximum 2000 iterations per path calculation
  - Smooth movement with tween animations
  
- ✅ **Map Transition System:**
  - Initial map: `lvl-3-map.png` (door closed)
  - Collects 3 documents → unlocks orange door
  - Map changes to `lvl-3.1-map.png` (door open)
  - Document/guard positions remain unchanged
  - Blue indicator disappears when passing door (10px proximity)
  
**Part 2 - Connection Puzzle:**
- ✅ **Connection Mini-Game:**
  - 90-second timer starts when passing through first door
  - 4 connection pairs (8 points total) to complete
  - Connection points: Small red circles (15px radius)
  - Press ENTER on Point A → red line follows player
  - Press ENTER on Point B → line completes and locks
  - Solid red lines (4px thickness) for completed connections
  - Timer turns red at <10 seconds remaining
  - Time expires = caught/game over
  
- ✅ **Connection Plotter Tool:**
  - `connection-plotter-tool.html` for visual placement
  - Two-column layout matching other plotter tools
  - Terminal aesthetic with status panel
  - Real-time counters: Points Placed (0/8), Pairs Complete (0/4)
  - Zoom controls for precision (Zoom In, Out, Fit to Screen)
  - Dashed lines show paired connections
  - Generates code for `part2ConnectionPoints` array
  
**UI & Visual Indicators:**
- ✅ **Orange Door System:**
  - Level 3 uses orange doors instead of blue
  - Orange indicator wedge points to door
  - Doors never trigger victory screen
  - Only transitions between level parts
  
- ✅ **Green Indicators for Connections:**
  - Green wedges point to all Point A locations (start points)
  - Switches to Point B when active connection started
  - Multiple wedges show for incomplete connections
  - Disappear when connection complete
  - Same style as document indicators
  
- ✅ **Part 2 Timer Display:**
  - Large green timer at top center
  - Shows "TIME: 90s" and counts down
  - Turns red when <10 seconds remain
  - Hides when all connections complete
  
- ✅ **Typewriter Level Intro:**
  - Level names type out character by character
  - Blinking cursor effect during typing
  - Smooth animations for all level transitions
  
**Bug Fixes & Polish:**
- ✅ **Enhanced Collision System:**
  - Player collision: 24 sample points (up from 16)
  - 8-pixel push-back strength (up from 2-3)
  - Velocity stops completely on wall contact
  - Prevents sprint phase-through glitch
  
- ✅ **Guard Collision Improvements:**
  - Guards use same 24-point system as player
  - 8-pixel push-back for guards
  - Stops guard velocity and tweens on collision
  - No more wall clipping for any entity
  
- ✅ **Interaction Range:**
  - Connection points: 100px interaction radius (doubled from 50px)
  - Easier ENTER key detection for puzzle points
  
**Debug & Development Tools:**
- ✅ **Level 3 Debug Key:**
  - Press "D" on Level 3 to auto-collect all documents
  - Instantly unlocks door for Part 2 testing
  - Only works on Level 3
  
- ✅ **Enhanced Plotter Tools:**
  - All tools support Level 1, 2, and 3
  - Document plotter with Level 3 support
  - Patrol path plotter with Level 3 paths
  - Connection plotter for Part 2 puzzle
  
**Level 3 Configuration:**
- Player Start: (1765, 1541)
- Documents: 3 positions across the map
- Exit Door (Part 1): (2400, 2582)
- Guards: 4 guards on complex patrol paths
- Connection Points: 4 pairs in Part 2 area
- Maps: `lvl-3-map.png` and `lvl-3.1-map.png`

**Technical Achievements:**
- 5-state AI with A* pathfinding integration
- Real-time player path recording system
- Dynamic map swapping with collision data updates
- Complex multi-part level structure
- Interactive line-drawing mini-game
- Sophisticated stamina and energy management
- Green indicator system for puzzle objectives

**Testing Status:**
- ✅ Level 3 Part 1 document collection working
- ✅ Guard path-following AI functional
- ✅ Stamina system and energy bars working
- ✅ Map transition smooth and collision updated
- ✅ Part 2 connection puzzle fully functional
- ✅ 90-second timer and game over working
- ✅ Green indicators pointing to connection points
- ✅ Orange door system (no victory) confirmed
- ✅ Sprint/guard wall collision fixed
- ✅ Debug document collection key working

**Files Modified:**
- `js/game.js` - Level 3 AI, connection puzzle, collision fixes (v27)
- `index.html` - Part 2 timer UI, typewriter intro
- `connection-plotter-tool.html` - New tool for puzzle design
- `document-plotter-tool.html` - Level 3 support
- `patrol-path-tool.html` - Level 3 support

**Cache Version:** v27

---

### Session 7 - Intro Screen & Level-Specific Audio

**Intro Screen & Loading System:**
- ✅ **Intro Screen Overlay:**
  - Full-screen loading screen with `snowdenloadingscreen.png` background
  - Black overlay with centered "Press Enter to Start" button
  - Button styling: Green border, semi-transparent background, hover effects
  - Prevents game from loading until user interaction
  - Smooth fade transitions between screens
- ✅ **Dynamic Level Intro Screen:**
  - Reusable `showLevelIntro()` function for all level transitions
  - Appears after pressing Enter on main intro screen (Level 1)
  - Appears after clicking Continue on victory screen (Level 2+)
  - Black screen with level name (Serial font, 48px)
    - Level 1: "Floor 1 - Server Room"
    - Level 2: "Floor 2 - Lobby and Conference"
  - 3-second display with 1-second fade-in/fade-out
  - Seamlessly transitions to game start
  - Total delay: 4 seconds from trigger to level start
- ✅ **Audio System Enhancement:**
  - Beep warning sound (`beep-warning-6387.mp3`) plays when caught on Level 1 (cameras)
  - "Hey!" sound (`hey-89820.mp3`) plays when caught on Level 2 (guards)
  - Audio context resume handling for browser compatibility
  - Footstep sound stops immediately when caught
  - Catch sounds play at max volume (1.0) for clear feedback
  - Comprehensive debug logging for audio troubleshooting
- ✅ **Cache-Busting:**
  - Updated version to `?v=6` to force fresh JavaScript loads
  - Prevents browser caching issues with new features

**Technical Implementation:**
- Reusable `showLevelIntro(levelName, callback)` function in index.html
- Victory screen calls level intro before loading next level
- Dynamic level name text updates per level
- Audio context state management (suspended/running)
- Level-specific audio triggers on both catch scenarios:
  - Vision detection catch (cameras/guards see player)
  - Mini-game failure catch (hacking time expired)
- Extensive console logging for audio debugging

**Key Achievements:**
- Professional game intro flow with loading screen
- Level-specific audio feedback for different enemy types
- Solved browser audio context suspension issues
- Maintained clean separation between intro and game code

**Testing Status:**
- ✅ Intro screen displays correctly
- ✅ "Press Enter to Start" button centered and functional
- ✅ Level 1 intro screen ("Floor 1 - Server Room") fades in/out smoothly
- ✅ Level 2 intro screen ("Floor 2 - Lobby and Conference") appears on victory transition
- ✅ Beep warning plays on Level 1 camera catch
- ✅ "Hey!" sound plays on Level 2 guard catch
- ✅ Audio plays over footsteps correctly
- ✅ All sounds load successfully (confirmed in server logs)
- ✅ Complete Level 1 → Level 2 transition with intro screen working

**Files Modified:**
- `index.html` - Added intro screens, reusable `showLevelIntro()` function, cache-bust v6
- `js/game.js` - Level-specific audio triggers, victory screen level transition, debug logging

---

### Session 4 - Advanced Guard AI & Detection

**Phase 4 - Guards & Detection System COMPLETE:**
- ✅ **Player Character:** Replaced blue circle with Snowdy sprite (snowdy.png)
- ✅ **12 Guards:** Red circles, 41px diameter, 2 per patrol path
- ✅ **6 Predefined Patrol Paths:** Complex routes traced from LVL1-coppaths.png
- ✅ **Patrol Tool Created:** Built patrol-path-tool.html for visual path definition
- ✅ **Back-and-Forth Movement:** Guards traverse paths in both directions
- ✅ **Random Pauses:** 30% chance to pause for 3 seconds at waypoints
- ✅ **Raycast Vision Cones:** 
  - 65° cone angle, ~308px range
  - 32-ray raycasting system
  - Vision clips realistically at walls
  - Whitish-yellow color, semi-transparent
- ✅ **Dynamic Vision Rotation:**
  - Guards face their walking direction
  - Look ±72° left/right while moving
  - Full 360° rotation when paused
  - Slow random rotation (0.003-0.008 speed)
- ✅ **Hearing System:**
  - 150px detection radius
  - Turns vision toward sound source at 0.014 speed
  - Speed boost: 65 → 102 when hearing player
  - Path reversal if sound from behind (>90° angle)
  - Reset when player leaves range
- ✅ **Detection Logic:**
  - Vision cone must see player to catch (not just hearing)
  - Pixel-perfect line-of-sight through walls
  - Walls block guard vision
- ✅ **Visual Indicator System (Fortnite-style):**
  - Directional threat awareness ring around player
  - 30px radius, renders below player sprite (depth -1)
  - Red pie-wedge sections point to guards within 425px
  - Transparent ring outline (only colored wedges visible)
  - 40° wedge width for clear directional cues
  - Pie-chart style filling (wedges fill from center)
  - Prepared for green objective wedges in Phase 5
- ✅ **Guard Wall Collision:** Same pixel-perfect system as player
- ✅ **Game Over & Restart:**
  - "CAUGHT!" message on detection
  - 1-second delay before restart
  - All guards and player reset to starting positions
- ✅ **Speed Balancing:** Player 150, Guards 65 normal/102 alerted
- ✅ **UI Polish:** Clean minimal interface, CSS vignette atmosphere
- ✅ **TESTED EXTENSIVELY** - All systems working perfectly!

**Key Achievements:**
- Created AAA-quality guard AI with realistic vision, hearing, and pursuit behaviors
- Sophisticated multi-system interaction (vision + hearing + movement + collision)
- Implemented Fortnite-style directional threat indicator for enhanced player awareness
- Integrated custom Snowdy character sprite
- Challenging but fair stealth gameplay with clear visual feedback

**Next Phase:**
- ✅ Phase 5 Complete - Ready to begin Phase 6: Polish & UI (or continue customization)

---

### Session 5 - Complete Gameplay Loop with Advanced UI (CURRENT)

**Phase 5 - Items & Objectives COMPLETE:**
- ✅ **Document Plotter Tool:** `document-plotter-tool.html` for visual placement
- ✅ **Complete UI Grid System:**
  - Terminal green aesthetic with Roboto Mono font
  - Top bar: Floor title and objective text
  - Left panel: Live mini-map (250x400) with player dot
  - Right panel: Stats display (difficulty, building, time, guards, documents)
  - Bottom panel: Narrative text with typewriter effect
  - CRT monitor overlay on game viewport (scanlines + phosphor glow)
- ✅ **3 Collectible Documents:**
  - Placeholder green rectangles (30px, smaller than player)
  - Blinking animation (alpha 0.3 ↔ 1.0, 800ms)
  - Stops blinking + shows "Press ENTER" at 50px proximity
  - Green indicator wedge points to nearest (1000px radius)
- ✅ **Advanced Mini-Game System:**
  - Fullscreen overlay when interacting with document
  - **Typing Challenge:**
    - Type any keys to reveal classified text progressively
    - 20s timer (red warning at 5s) - adjustable via `MINIGAME_TIME_LIMIT`
    - 100 chars required - adjustable via `MINIGAME_CHARS_REQUIRED`
  - **Timing Slider Checkpoints:**
    - Appears at 50% and 100% progress
    - Fast horizontal slider (300px/s) - adjustable via `TIMING_SLIDER_SPEED`
    - Small tolerance zone (15px) - adjustable via `TIMING_TOLERANCE`
    - Press SPACE to stop on target
    - Miss = retry, success = continue
  - Guards can't catch during mini-game
  - Time expires = caught (game over)
  - Success = "SUCCESS" message → collect document
- ✅ **Exit Door System:**
  - Orange rectangle (35px), locked initially at 50% opacity
  - Unlocks when all 3 documents collected
  - Changes to green tint at 100% opacity
  - Orange indicator wedge when unlocked (1000px radius)
  - Touch exit = level complete
- ✅ **Victory Screen:**
  - "ACCESSED" fullscreen (96px, Serial font)
  - Stats: time elapsed, documents collected, level name
  - Continue button (green border, hover effect)
  - Restarts Level 1 (will load Level 2 in Phase 7)
- ✅ **Narrative System:**
  - Typewriter effect in bottom panel (50ms/char)
  - Different classified text for each document
  - Persists until next document or level complete
- ✅ **Time System:** In-game clock starts at 3:38:12 AM, advances in real-time
- ✅ **Document Counter:** Live updates in right panel (0/3 → 3/3)
- ✅ **Sprint System:**
  - Hold SPACEBAR to sprint at 225 speed (vs 100 normal)
  - Yellow energy bar below player character (35px wide)
  - 5 seconds sprint duration at full energy
  - 30 seconds full recharge time
  - Requires minimum 5 energy points to sprint
  - Energy drains only while sprinting and moving
  - Auto-recharges when not sprinting
  - Resets on game restart
- ✅ **Controls & Legend:**
  - Instructions above mini-map in left panel
  - Movement, sprint, and interact controls
  - Color-coded indicator legend (Red=Guard, Green=Document, Blue=Exit, Yellow=Energy)
- ✅ **Audio System:**
  - Footstep sound effects (looping, 1.25x speed)
  - Smooth fade-out when stopping
  - Auto-resume on movement
  - Browser autoplay policy handling
- ✅ **Guard Sprites:** Replaced red circles with cop PNG (coppng.png), scaled appropriately
- ✅ **Dynamic UI:** Guard count display reflects `GUARD_COUNT` constant
- ✅ **TESTED EXTENSIVELY** - Full gameplay loop working with sprint mechanics!

**Key Achievements:**
- Complete terminal/hacker aesthetic UI matching Figma mockup
- Complex mini-game with typing + timing mechanics
- Full Level 1 gameplay loop from start to victory
- All systems integrated: stealth, collection, hacking, escape
- Ready for document image uploads and position customization

**Next Phase:**
- ✅ Phase 5 Complete - Use document plotter to position items, then test full loop!

---

### Session 6 - Multi-Level System Implementation (CURRENT)

**Phase 7 - Level 2 Multi-Level System:**
- ✅ **Multi-Level Architecture:** Refactored game.js to support multiple levels
- ✅ **Level Configuration System:** Created `LEVEL_CONFIGS` with all level data (maps, positions, paths)
- ✅ **Level 2 Structure:** Added Level 2 configuration (placeholder patrol paths/positions)
- ✅ **Victory Screen Transition:** Victory screen now loads next level automatically
- ✅ **Dynamic UI:** Level name updates dynamically in top bar
- ✅ **Updated Plotter Tools:** Both patrol-path-tool.html and document-plotter-tool.html now support Level 1 and Level 2
- ✅ **Asset Loading:** Game preloads all level maps at startup

**Key Improvements:**
- Game now supports unlimited levels via `LEVEL_CONFIGS` object
- Each level can have unique: map, player start position, guard count, document positions, exit position, patrol paths
- Victory screen automatically transitions to next level
- Tools updated to support multi-level editing

**Camera System Update:**
- ✅ **Created camera-plotter-tool.html:** Visual tool to place cameras and set facing directions
- ✅ **Camera Implementation:** Cameras are stationary entities with rotating vision cones
  - Same vision cone rendering as guards (raycast with wall clipping)
  - Same detection logic (player caught if seen in vision cone)
  - No hearing system (cameras don't react to sound)
  - Continuous 360° rotation at slow speed
  - Red tinted sprites to differentiate from guards
- ✅ **Level Configuration:** Level 2 uses `usesCameras: true` flag and `cameras` array

**Next Steps:**
1. **Open camera-plotter-tool.html** at http://127.0.0.1:8000/camera-plotter-tool.html
   - Click to place each camera on the Level 2 map
   - Drag from camera to set initial facing direction (or use angle input box)
   - Place as many cameras as you want based on your reference PNG
   - Click "Generate Code" and copy the camera array
   - Update `LEVEL_CONFIGS[2].cameras` in game.js (line 208) with your generated cameras
2. **Open document-plotter-tool.html** at http://127.0.0.1:8000/document-plotter-tool.html
   - Click "Level 2" button to switch to Level 2 map
   - Place 3 documents and 1 exit door
   - Click "Generate Code" and copy the positions
   - Update `LEVEL_CONFIGS[2].documentPositions` (line 216) and `exitPosition` (line 221)
3. **Set player start position for Level 2:**
   - Use camera-plotter or document-plotter to click and get coordinates
   - Update `LEVEL_CONFIGS[2].playerStartX` and `playerStartY` in game.js (lines 202-203)
4. **Test the game:** Complete Level 1 and verify transition to Level 2 works with cameras!

---

### Session 3 - PNG Transparency Collision System

**Phase 3 - Map & Collision System COMPLETE:**
- ✅ **REVOLUTIONARY APPROACH:** PNG transparency-based collision detection
- ✅ Integrated client's `Artboard 1.png` (6315 x 4467 pixels)
- ✅ Implemented alpha channel pixel-perfect collision
- ✅ Works with ANY PNG - anything visible = wall, transparent = walkable
- ✅ Player size: 41px diameter (20.5 radius)
- ✅ Player spawns at position (2953, 2361)
- ✅ Camera follows player smoothly at 1:1 scale
- ✅ Collision checks 16 sample points around player circle per frame
- ✅ Cached ImageData for fast pixel lookups
- ✅ Black background (#000000) for clean terminal aesthetic
- ✅ Set up local HTTP server to avoid CORS issues
- ✅ Both Arrow Keys and WASD controls
- ✅ TESTED AND CONFIRMED WORKING by client!

**Key Achievement:**
- Created ultra-flexible collision system - client can swap PNG maps instantly
- Simple rule: Non-transparent pixels = walls, transparent = walkable
- No need to manually define collision areas

**Next Phase:**
- ✅ Phase 3 Complete - Ready to begin Phase 4: Guards & Detection

---

### Session 2 - Phase 3 Started

**Phase 3 - Initial Map Work:**
- Created complex FBI building floor plan with corridors and rooms
- Implemented fallback graphics system for missing assets

---

### Session 1 - Phase 1 Complete, Phase 2 Started

**Phase 1 - Foundation:**
- ✅ Created `index.html` - Main HTML file with Phaser.js CDN link
- ✅ Created `js/game.js` - Game configuration and initial scenes
- ✅ Created `PROJECT_TRACKER.md` - This tracking document
- ✅ Created `README.md` - User instructions
- ✅ Tested successfully in Chrome browser

**Phase 2 - Player Movement:**
- ✅ Created blue circle player sprite (32x32)
- ✅ Implemented arrow key controls
- ✅ Added screen boundary collision
- ✅ Added diagonal movement normalization
- ✅ Added on-screen instructions

**Next Action:**
- Client needs to test player movement by opening `index.html`

---

## Issues & Blockers

**Current Issues:**
- None

**Resolved Issues:**
- None

---

## Assets Needed

### Received:
- [x] Floor plan (Artboard 1.png / lvl-1-map.png) - Phase 3
- [x] Player sprite (snowdy.png) - Phase 4

### Created:
- [x] Guard sprites (red circles, procedural) - Phase 4
- [x] Vision cone graphics (raycast rendered) - Phase 4
- [x] Visual indicator system (graphics API) - Phase 4

### To Create:
- [ ] Key item sprites (Phase 5)
- [ ] Exit door graphic (Phase 5)
- [ ] HUD elements (Phase 6)

---

## Testing Notes

**Browser Tested:** Chrome (via http://127.0.0.1:8000)  
**Last Test Date:** October 1, 2025  
**Known Bugs:** None  
**Status:** Phase 4 fully tested and confirmed working
- Player movement: ✅ Smooth and responsive
- Snowdy character: ✅ Sprite loaded and scaled correctly
- Wall collision: ✅ Pixel-perfect for player and guards
- Guard patrols: ✅ All 12 guards following complex paths
- Vision cones: ✅ Raycast rendering clips at walls correctly
- Hearing system: ✅ Guards detect, turn, speed up, and reverse
- Detection: ✅ Only caught when vision cone sees player
- Visual indicator: ✅ Red wedges point to guards within 425px
- UI polish: ✅ Clean interface, CSS vignette atmosphere
- Game over/restart: ✅ Working perfectly

---

## Next Steps

**Completed This Session (Session 8):**
1. ✅ **Level 3 Part 1 - Path-Following AI**
   - 4 guards with hearing-only detection
   - Real-time player path recording and playback
   - 5-state AI: patrol, navigating, following, exhausted, returning
   - A* pathfinding for intelligent navigation
   - Guard stamina system with energy bars
   - Dynamic map change after document collection
   
2. ✅ **Level 3 Part 2 - Connection Puzzle**
   - 90-second timed mini-game
   - 4 connection pairs (8 points total)
   - Interactive line-drawing mechanic
   - Green directional indicators
   - Connection plotter tool for design
   
3. ✅ **Orange Door System**
   - Level 3 uses orange doors (not blue)
   - Doors never trigger victory/completion
   - Only transition between level parts
   
4. ✅ **Collision & Physics Improvements**
   - 24-point collision detection (up from 16)
   - 8-pixel push-back strength
   - Fixed sprint wall-phasing
   - Guards respect walls perfectly
   
5. ✅ **Polish & UX**
   - Typewriter effect for level intros
   - Green indicators for connection points
   - 100px interaction radius for puzzle
   - Debug key "D" for document auto-collection

**Game Status:**
- ✅ **Complete 3-level stealth game!**
- Level 1: Camera surveillance (stationary)
- Level 2: Guard patrols (vision + hearing)
- Level 3: Path-following AI + connection puzzle
- Professional UI with visual indicators
- Full audio system with level-specific sounds
- Comprehensive debug tools
- All core systems tested and working

**Future Enhancements (Optional):**
- Additional levels with new mechanics
- Sound effects (document collection, door unlock, connections)
- Music tracks for atmosphere
- More connection puzzle variations
- Achievement/scoring system
- Difficulty settings

**Current Status:**
- ✅ **Game is fully functional and ready to play!**
- ✅ **Three complete levels with unique mechanics**
- ✅ **All bugs fixed and collision system polished**

---

### Session 6 - Multi-Level System & Camera Mechanics (CURRENT)

**Phase 7 - Multi-Level System MOSTLY COMPLETE:**
- ✅ **Multi-Level Architecture:**
  - Created `LEVEL_CONFIGS` object to manage multiple levels
  - Each level has independent configuration (map, spawn point, enemies, documents, exit)
  - Seamless switching between levels via debug keys ("1", "2")
  - Level system ready for unlimited expansion
- ✅ **Level Naming Swap:**
  - Original Level 1 → Now Level 2 (guards with patrol paths)
  - Original Level 2 → Now Level 1 (cameras)
  - Levels configured correctly with proper maps and mechanics
- ✅ **Level 1 - Server Room (Camera Level):**
  - Map: `lvl-2-map.png` (6315 x 4467)
  - 9 security cameras with rotating vision cones
  - Camera vision: 90° angle, 246px range (~12x player radius)
  - Camera rotation: 0.006-0.011 speed (faster than guards)
  - Cameras are stationary entities (no movement, just rotation)
  - Camera sprite: 30x30 orange camera icon
  - 3 documents to collect: (2781, 1861), (2199, 3259), (4548, 2348)
  - Exit door at (1468, 2519)
  - Player spawn: (4445, 1856)
- ✅ **Level 2 - Lobby & Conference (Guard Level):**
  - Map: `lvl-1-map.png` (6315 x 4467)
  - 12 guards with 6 complex patrol paths
  - Full guard AI: vision cones, hearing, path reversal, random pauses
  - 3 documents to collect: (2523, 2976), (4810, 3732), (3710, 1564)
  - Exit door at (1441, 1216)
  - Player spawn: (2953, 2361)
- ✅ **Enhanced Camera Plotter Tool:**
  - `camera-plotter-tool.html` upgraded to show existing cameras
  - Pre-loads current 9 cameras from game.js configuration
  - Color coding: Blue = existing, Red = new, Yellow = selected
  - Click existing cameras to modify position/angle
  - Click map to add new cameras
  - Drag from camera to set facing direction visually
  - Manual angle input (0-359°) with reference guide
  - "Reset to Existing" button to reload from game.js
  - "Clear All" to start fresh
  - Generates JavaScript code ready for copy/paste
  - Zoom controls for precision placement
- ✅ **Camera System Implementation:**
  - Cameras use separate logic from guards
  - No movement, only rotation
  - Vision cones render with raycasting (clips at walls)
  - Rotation alternates between left/right sweep patterns
  - Independent rotation speeds per camera
  - Cameras stored in separate `cameras[]` array
  - `usesCameras` flag determines if level uses cameras vs guards
- ✅ **Cache-Busting Solution:**
  - Added `?v=4` parameter to game.js script tag
  - Forces browser to load fresh JavaScript on updates
  - Increment version number for future updates
  - Solves 304 "Not Modified" caching issues
- ✅ **Debug Controls:**
  - Press "1" key: Jump to Level 1 (cameras)
  - Press "2" key: Jump to Level 2 (guards)
  - Instant level switching for testing
  - All entities reset on level change

**Key Achievements:**
- Created scalable multi-level architecture
- Implemented camera-based stealth mechanics (alternative to guards)
- Built visual camera placement tool with live preview
- Successfully configured two distinct levels with different enemy types
- Solved browser caching issues with version parameters

**Testing Status:**
- ✅ Level 1 loads correctly with 9 cameras
- ✅ Level 2 loads correctly with 12 guards
- ✅ Camera vision cones working properly
- ✅ Guard patrol paths working as before
- ✅ Debug level switching functional
- ⏳ Victory screen level transition (not yet tested)

**Next Steps:**
- Test completing Level 1 and transitioning to Level 2 via victory screen
- Ensure document collection and exit work on both levels
- Plan Level 3 design and mechanics
- Consider difficulty progression between levels

**Files Modified:**
- `js/game.js` - Multi-level configs, camera system, level switching
- `index.html` - Cache-busting version parameter
- `camera-plotter-tool.html` - Enhanced with existing camera display

---

## Resources & Links

- **Phaser.js Docs:** https://photonstorm.github.io/phaser3-docs/
- **Phaser Examples:** https://phaser.io/examples
- **Free Assets:** 
  - Kenney.nl: https://kenney.nl/
  - OpenGameArt: https://opengameart.org/

---

**Legend:**
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Complete
- ⚠️ Blocked
- ✅ Phase Complete
