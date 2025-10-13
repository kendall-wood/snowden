/**
 * SNOWDEN - 2D Top-Down Stealth Game
 * PNG Transparency-Based Collision System
 */

// Game configuration - responsive canvas that fills viewport
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,  // Will be adjusted after DOM loads
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#000000',  // Black background
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false  // Debug off for clean gameplay
        }
    },
    input: {
        gamepad: true  // Enable gamepad/controller support
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Create the game instance
const game = new Phaser.Game(config);

// Global game variables
let player;
let cursors;
let map;
let collisionMap;  // PNG collision map for pixel-perfect detection
let collisionTexture;  // Texture data for pixel checking
let collisionPixelData;  // Cached pixel data for fast lookups
let guards = [];  // Array to store all guard/camera objects
let visionCones = [];  // Array to store vision cone graphics
let cameras = [];  // Array to store camera objects (for camera-based levels)
let gameOver = false;  // Track if player was caught
let sceneReference;  // Store scene reference for restart
let darknessOverlay;  // Full darkness overlay with player visibility cutout
let visualIndicator;  // Visual sound/objective indicator (Fortnite-style)

// Multi-level system
let currentLevel = 1;  // Track current level (1, 2, 3, etc.)
let currentLevelPart = 1;  // Track level parts (for Level 3: part 1 = door locked, part 2 = door open)

// DEBUG MODE - Set to true for testing, false for production
const DEBUG_MODE = true;  // Change to false to disable
const DEBUG_START_LEVEL = 1;  // Which level to start at in debug mode (1, 2, or 3)

// Level 3 path recording system
let playerPathRecording = [];  // Array of {x, y, timestamp} positions
let isRecordingPath = false;  // Whether to record player movement
let pathRecordingStartTime = 0;  // When recording started

// Level 3 Part 2 - Connection Puzzle System
let part2Active = false;  // Whether Part 2 puzzle is active
let part2TimerStart = 0;  // When Part 2 timer started
let part2TimeLimit = 90;  // 90 seconds to complete connections
let connectionPoints = [];  // Array of connection point sprites
let connections = [];  // Array of {pointA, pointB, completed, lineGraphic}
let activeConnection = null;  // Current connection being drawn {pairIndex, lineGraphic}
let part2ExitDoor = null;  // Part 2 exit door sprite
let connectionLineGraphics;  // Graphics object for drawing lines

// UI variables
let miniMapCanvas;  // Canvas for mini-map
let miniMapCtx;     // Context for mini-map
let gameStartTime;  // Track when game started for time display
let documentsCollected = 0;  // Track collected documents

// Audio variables
let footstepSound;  // Footstep sound effect
let heySound;  // "Hey!" sound when caught on level 2
let beepWarningSound;  // Beep warning sound when caught on level 1
let isPlayerMoving = false;  // Track if player is currently moving
let audioUnlocked = false;  // Track if audio has been unlocked

// Sprint variables
const SPRINT_SPEED = 225;  // Speed when sprinting
const NORMAL_SPEED = 100;  // Normal walking speed
const MAX_SPRINT_ENERGY = 100;  // Maximum sprint energy (100 = 5 seconds at drain rate 20/sec)
const SPRINT_DRAIN_RATE = 20;  // Energy drained per second while sprinting
const SPRINT_RECHARGE_RATE = 100 / 30;  // Recharge rate (full bar in 15 seconds)
let sprintEnergy = MAX_SPRINT_ENERGY;  // Current sprint energy
let isSprinting = false;  // Track if player is sprinting
let spaceKey;  // Spacebar for sprinting
let energyBar;  // Energy bar graphic

// PS5 Controller support (separate control configuration, doesn't replace keyboard)
let gamepad;  // PS5 controller reference
let lastXButtonState = false;  // Track X button state for single-press detection
let lastR2ButtonState = false;  // Track R2 button state

// Level 3 Guard Stamina System
const MAX_GUARD_ENERGY = 100;  // Maximum guard energy (15 seconds at drain rate)
const GUARD_ENERGY_DRAIN_RATE = 100 / 15;  // Drain full bar in 15 seconds
const GUARD_ENERGY_RECHARGE_RATE = 100 / 3;  // Recharge full bar in 3 seconds
let guardEnergyBars;  // Graphics for guard energy bars

// LEVEL CONFIGURATIONS
// Each level has its own map, patrol paths, document/exit positions, and metadata
const LEVEL_CONFIGS = {
    1: {
        name: "Floor 1 - Server Room",
        mapKey: "level1Map",
        mapFile: "assets/lvl-2-map.png",
        mapWidth: 6315,
        mapHeight: 4467,
        playerStartX: 4445,
        playerStartY: 1856,
        
        // Level 1 uses CAMERAS
        usesCameras: true,  // Flag to use cameras instead of guards
        cameraCount: 0,  // 9 security cameras
        cameras: [
            {x: 4674, y: 2024, facingAngle: 2.3562},  // Camera 1
            {x: 3298, y: 2908, facingAngle: 5.4978},  // Camera 2
            {x: 3846, y: 2424, facingAngle: 0.0000},  // Camera 3
            {x: 2526, y: 1660, facingAngle: 0.7854},  // Camera 4
            {x: 2514, y: 2420, facingAngle: 0.0000},  // Camera 5
            {x: 1218, y: 1660, facingAngle: 0.7854},  // Camera 6
            {x: 1214, y: 3400, facingAngle: 5.4978},  // Camera 7
            {x: 3776, y: 1646, facingAngle: 1.5708},  // Camera 8
            {x: 4865, y: 3398, facingAngle: 3.9270}   // Camera 9
        ],
        
        documentCount: 3,
        documentPositions: [
            {x: 2781, y: 1861},  // Document 1
            {x: 2199, y: 3259},  // Document 2
            {x: 4548, y: 2348}   // Document 3
        ],
        exitPosition: {x: 1468, y: 2519}  // Exit door
    },
    2: {
        name: "Floor 2 - Lobby and Conference",
        mapKey: "level2Map",
        mapFile: "assets/lvl-1-map.png",
        mapWidth: 6315,
        mapHeight: 4467,
        playerStartX: 2953,
        playerStartY: 2361,
        
        // Level 2 uses GUARDS with patrol paths
        guardCount: 12,
        
        cameras: [],  // No cameras on Level 2
        
        documentCount: 3,
        documentPositions: [
            {x: 2523, y: 2976},  // Document 1
            {x: 4810, y: 3732},  // Document 2
            {x: 3710, y: 1564}   // Document 3
        ],
        exitPosition: {x: 1441, y: 1216},
        
        patrolPaths: [
            // Path 1 (16 waypoints)
            [
                {x: 2106, y: 855},
                {x: 2105, y: 948},
                {x: 2176, y: 948},
                {x: 2177, y: 1202},
                {x: 1485, y: 1201},
                {x: 2178, y: 1199},
                {x: 2177, y: 1345},
                {x: 1273, y: 1344},
                {x: 1272, y: 2130},
                {x: 1934, y: 2129},
                {x: 1933, y: 1343},
                {x: 2177, y: 1345},
                {x: 2176, y: 1199},
                {x: 2175, y: 947},
                {x: 2102, y: 948},
                {x: 2107, y: 855}
            ],
            // Path 2 (13 waypoints)
            [
                {x: 2240, y: 1301},
                {x: 2570, y: 1300},
                {x: 2570, y: 1203},
                {x: 2954, y: 1203},
                {x: 2952, y: 1114},
                {x: 3561, y: 1113},
                {x: 3561, y: 634},
                {x: 3560, y: 1112},
                {x: 3826, y: 1114},
                {x: 3826, y: 1201},
                {x: 4226, y: 1201},
                {x: 4224, y: 1119},
                {x: 4833, y: 1119}
            ],
            // Path 3 (2 waypoints)
            [
                {x: 2219, y: 1507},
                {x: 2221, y: 3004}
            ],
            // Path 4 (14 waypoints)
            [
                {x: 1710, y: 3451},
                {x: 1710, y: 3291},
                {x: 2133, y: 3284},
                {x: 2130, y: 3093},
                {x: 1875, y: 3089},
                {x: 1875, y: 3173},
                {x: 1271, y: 3170},
                {x: 1271, y: 2351},
                {x: 1924, y: 2350},
                {x: 1926, y: 3085},
                {x: 2129, y: 3085},
                {x: 2134, y: 3285},
                {x: 1709, y: 3284},
                {x: 1706, y: 3465}
            ],
            // Path 5 (20 waypoints)
            [
                {x: 2689, y: 3287},
                {x: 3141, y: 3289},
                {x: 3143, y: 3823},
                {x: 3141, y: 3423},
                {x: 3595, y: 3424},
                {x: 3600, y: 3827},
                {x: 3597, y: 3420},
                {x: 3906, y: 3426},
                {x: 3138, y: 3428},
                {x: 3141, y: 3285},
                {x: 2918, y: 3288},
                {x: 2917, y: 3093},
                {x: 3384, y: 3093},
                {x: 3383, y: 2999},
                {x: 3643, y: 2997},
                {x: 3380, y: 2991},
                {x: 3388, y: 3096},
                {x: 2918, y: 3090},
                {x: 2915, y: 3288},
                {x: 2688, y: 3293}
            ],
            // Path 6 (18 waypoints)
            [
                {x: 4817, y: 3111},
                {x: 4694, y: 3107},
                {x: 4693, y: 3347},
                {x: 4156, y: 3349},
                {x: 4157, y: 3261},
                {x: 4100, y: 3261},
                {x: 4101, y: 3136},
                {x: 4417, y: 3134},
                {x: 4417, y: 2838},
                {x: 4050, y: 2836},
                {x: 4050, y: 3098},
                {x: 4100, y: 3094},
                {x: 4099, y: 3263},
                {x: 4158, y: 3259},
                {x: 4156, y: 3352},
                {x: 4693, y: 3345},
                {x: 4689, y: 3107},
                {x: 4816, y: 3106}
            ]
        ]
    },
    3: {
        name: "Floor 3 - Intellectual Property Vault",
        mapKey: "level3Map",
        mapFile: "assets/lvl-3-map.png",  // Door locked version
        mapFileOpen: "assets/lvl-3.1-map.png",  // Door open version
        mapWidth: 6315,
        mapHeight: 4467,
        playerStartX: 1765,
        playerStartY: 1541,
        
        // Level 3 uses PATH-FOLLOWING GUARDS (unique behavior)
        guardCount: 4,
        usesPathFollowing: true,  // Flag for special Level 3 guard behavior
        guardHearingRange: 200,  // Hearing radius in pixels
        guardCatchRange: 15,  // Proximity catch radius
        guardSpeed: 107,  // Player speed (100) + 7
        
        cameras: [],  // No cameras on Level 3
        
        documentCount: 3,
        documentPositions: [
            {x: 3276, y: 1722},  // Document 1
            {x: 4858, y: 1658},  // Document 2
            {x: 3152, y: 2492}   // Document 3
        ],
        exitPosition: {x: 2400, y: 2582},  // Door position
        
        // Part 2 objectives (after door opens)
        part2Objectives: {
            // Connection puzzle - 45 seconds to connect all pairs
            documentsNeeded: 0,  // No additional documents for Part 2
            exitPosition: {x: 500, y: 1000}  // Final exit - TODO: Get coordinates
        },
        
        // Part 2 connection points (4 pairs = 8 points)
        part2ConnectionPoints: [
            // Connection 1
            {
                pointA: {x: 1447, y: 2989},
                pointB: {x: 1447, y: 3164}
            },
            // Connection 2
            {
                pointA: {x: 1593, y: 2989},
                pointB: {x: 1592, y: 3164}
            },
            // Connection 3
            {
                pointA: {x: 1739, y: 2989},
                pointB: {x: 1738, y: 3163}
            },
            // Connection 4
            {
                pointA: {x: 1884, y: 2989},
                pointB: {x: 1884, y: 3163}
            }
        ],
        
        // Patrol paths (4 guards, 1 per path)
        patrolPaths: [
            // Path 1 (6 waypoints)
            [
                {x: 2184, y: 1549},
                {x: 2504, y: 1549},
                {x: 2495, y: 1968},
                {x: 3566, y: 1957},
                {x: 3566, y: 1915},
                {x: 4683, y: 1901}
            ],
            // Path 2 (6 waypoints)
            [
                {x: 1455, y: 2639},
                {x: 2084, y: 2635},
                {x: 2095, y: 2519},
                {x: 2675, y: 2519},
                {x: 2660, y: 2648},
                {x: 3511, y: 2657}
            ],
            // Path 3 (6 waypoints)
            [
                {x: 2399, y: 2520},
                {x: 2373, y: 2124},
                {x: 2493, y: 2104},
                {x: 2493, y: 1975},
                {x: 2886, y: 1966},
                {x: 2888, y: 2333}
            ],
            // Path 4 (6 waypoints)
            [
                {x: 3509, y: 2660},
                {x: 2658, y: 2648},
                {x: 2666, y: 2506},
                {x: 2084, y: 2515},
                {x: 2082, y: 2653},
                {x: 1451, y: 2637}
            ]
        ]
    }
};

// Legacy references for backward compatibility (point to Level 1)
const DOCUMENT_POSITIONS = LEVEL_CONFIGS[1].documentPositions;
const EXIT_POSITION = LEVEL_CONFIGS[1].exitPosition;

// Document variables
let documents = [];  // Array of document sprites
let documentPrompts = [];  // Array of "Press Enter" text objects
let exitDoor = null;  // Exit door sprite
let nearestDocument = null;  // Track which document player is near
let enterKey;  // Enter key input

// Mini-game constants (adjustable)
const MINIGAME_TIME_LIMIT = 20;  // Seconds to complete typing challenge
const MINIGAME_CHARS_REQUIRED = 110;  // Number of characters to type (adjustable)
const TIMING_SLIDER_SPEED = 350;  // Pixels per second (fast but doable)
const TIMING_TOLERANCE = 20;  // Tolerance zone for timing (pixels)

// Mini-game variables
let miniGameActive = false;
let miniGameContainer = null;  // HTML overlay container
let miniGameState = null;  // Current mini-game state
let miniGameStartTime = null;
let typingInterval = null;
let sliderInterval = null;

// Player constants
const PLAYER_SPEED = 100;  // Reduced by 50%
let MAP_WIDTH = 6315;   // PNG width (dynamic based on level)
let MAP_HEIGHT = 4467;  // PNG height (dynamic based on level)
const PLAYER_RADIUS = 20.5; // Match the blue dot in SVG
let PLAYER_START_X = 2953; // Blue dot position (dynamic based on level)
let PLAYER_START_Y = 2361; // Blue dot position (dynamic based on level)
const PLAYER_VISIBILITY_RANGE = 300;  // How far player can see (adjust for more/less visibility)
const PLAYER_VISION_ANGLE = 90;  // Vision cone angle in degrees (wider = see more)

// Guard constants (easy to modify!)
let GUARD_COUNT = 6;  // 2 guards per path (dynamic based on level)
const GUARD_RADIUS = 20.5;  // Same size as player
const GUARD_SPEED = 60;  // Reduced by 50%
const VISION_RANGE = PLAYER_RADIUS * 12;  // How far guards can see (~205 pixels) - dramatically increased!
const VISION_ANGLE = 35;  // Vision cone angle in degrees (for guards)
const HEARING_RANGE = 225;  // How close player must be to be heard
const PAUSE_CHANCE = 0.3;  // 30% chance to pause at each waypoint
const PAUSE_DURATION = 3000;  // 3 seconds pause in milliseconds
const LOOK_AROUND_SPEED_MIN = 0.003;  // Minimum rotation speed (very slow)
const LOOK_AROUND_SPEED_MAX = 0.008;  // Maximum rotation speed (still slow)
const LOOK_AROUND_ANGLE_RIGHT = Math.PI / 3;  // How far right guards look (72 degrees)
const LOOK_AROUND_ANGLE_LEFT = Math.PI / 3;  // How far left guards look (72 degrees)
const LOOK_AROUND_ANGLE_PAUSED = Math.PI * 2;  // Full 360° rotation when paused

// Camera constants (separate from guards)
const CAMERA_VISION_ANGLE = 90;  // 180-degree vision cone for cameras
const CAMERA_ROTATION_SPEED_MIN = 0.006;  // Faster rotation for cameras
const CAMERA_ROTATION_SPEED_MAX = 0.011;  // Maximum rotation speed for cameras

/**
 * A* PATHFINDING SYSTEM (for Level 3 guards)
 * Based on standard A* algorithm with grid-based navigation
 */

// A* Node class
class AStarNode {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.g = 0;  // Cost from start
        this.h = 0;  // Heuristic cost to end
        this.f = 0;  // Total cost (g + h)
        this.parent = null;
    }
}

// A* pathfinding function
// Returns array of {x, y} waypoints from start to end, navigating around walls
function findPath(startX, startY, endX, endY) {
    const gridSize = 25;  // Smaller grid for more precise pathfinding (was 40)
    
    // Convert world coordinates to grid coordinates
    const startGridX = Math.floor(startX / gridSize);
    const startGridY = Math.floor(startY / gridSize);
    const endGridX = Math.floor(endX / gridSize);
    const endGridY = Math.floor(endY / gridSize);
    
    const startNode = new AStarNode(startGridX, startGridY);
    const endNode = new AStarNode(endGridX, endGridY);
    
    const openList = [startNode];
    const closedList = [];
    const openSet = new Set([`${startGridX},${startGridY}`]);
    const closedSet = new Set();
    
    // Heuristic: Manhattan distance
    function heuristic(node, end) {
        return Math.abs(node.x - end.x) + Math.abs(node.y - end.y);
    }
    
    // Check if a grid cell is walkable (accounting for guard radius)
    function isWalkable(gridX, gridY) {
        const worldX = gridX * gridSize + gridSize / 2;
        const worldY = gridY * gridSize + gridSize / 2;
        
        // Check center point and points around the guard's circular body
        const guardRadius = GUARD_RADIUS;  // 20.5 pixels
        const checkPoints = 8;  // Check 8 points around the circle
        
        // First check center
        if (isWallPixel(worldX, worldY)) {
            return false;
        }
        
        // Then check points around the guard's edge
        for (let i = 0; i < checkPoints; i++) {
            const angle = (i / checkPoints) * Math.PI * 2;
            const checkX = worldX + Math.cos(angle) * guardRadius;
            const checkY = worldY + Math.sin(angle) * guardRadius;
            
            if (isWallPixel(checkX, checkY)) {
                return false;
            }
        }
        
        return true;
    }
    
    // Get neighbors (8-directional movement)
    function getNeighbors(node) {
        const neighbors = [];
        const directions = [
            {x: 0, y: -1},   // Up
            {x: 1, y: -1},   // Up-right
            {x: 1, y: 0},    // Right
            {x: 1, y: 1},    // Down-right
            {x: 0, y: 1},    // Down
            {x: -1, y: 1},   // Down-left
            {x: -1, y: 0},   // Left
            {x: -1, y: -1}   // Up-left
        ];
        
        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;
            
            if (isWalkable(newX, newY)) {
                neighbors.push(new AStarNode(newX, newY));
            }
        }
        return neighbors;
    }
    
    // Main A* loop
    let iterations = 0;
    const maxIterations = 2000;  // Increased for smaller grid size (was 1000)
    
    while (openList.length > 0 && iterations < maxIterations) {
        iterations++;
        
        // Get node with lowest f score
        let currentIndex = 0;
        for (let i = 1; i < openList.length; i++) {
            if (openList[i].f < openList[currentIndex].f) {
                currentIndex = i;
            }
        }
        
        const current = openList[currentIndex];
        
        // Check if we reached the goal
        if (current.x === endNode.x && current.y === endNode.y) {
            // Reconstruct path
            const path = [];
            let temp = current;
            while (temp) {
                path.unshift({
                    x: temp.x * gridSize + gridSize / 2,
                    y: temp.y * gridSize + gridSize / 2
                });
                temp = temp.parent;
            }
            return path;
        }
        
        // Move current from open to closed
        openList.splice(currentIndex, 1);
        openSet.delete(`${current.x},${current.y}`);
        closedList.push(current);
        closedSet.add(`${current.x},${current.y}`);
        
        // Check neighbors
        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            
            if (closedSet.has(neighborKey)) {
                continue;
            }
            
            // Calculate costs
            const gScore = current.g + 1;
            neighbor.g = gScore;
            neighbor.h = heuristic(neighbor, endNode);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.parent = current;
            
            if (!openSet.has(neighborKey)) {
                openList.push(neighbor);
                openSet.add(neighborKey);
            }
        }
    }
    
    // No path found - return direct line as fallback
    console.warn('A* pathfinding failed, using direct line');
    return [{x: startX, y: startY}, {x: endX, y: endY}];
}

// Record player position for Level 3 guards to follow
function recordPlayerPosition() {
    if (!isRecordingPath || !player) return;
    
    const currentTime = Date.now();
    const timeSinceStart = currentTime - pathRecordingStartTime;
    
    playerPathRecording.push({
        x: player.x,
        y: player.y,
        timestamp: timeSinceStart
    });
}

// Get player position from recording at a specific time offset
function getPlayerPositionAtTime(timeOffset) {
    if (playerPathRecording.length === 0) return null;
    
    // Find the closest recorded position to this time
    for (let i = 0; i < playerPathRecording.length; i++) {
        if (playerPathRecording[i].timestamp >= timeOffset) {
            return playerPathRecording[i];
        }
    }
    
    // Return last position if we've caught up
    return playerPathRecording[playerPathRecording.length - 1];
}

/**
 * PRELOAD
 * Loads all assets before the game starts
 */
function preload() {
    console.log('Preload: Loading assets for level', currentLevel);
    
    // Load all level maps
    Object.keys(LEVEL_CONFIGS).forEach(levelNum => {
        const levelConfig = LEVEL_CONFIGS[levelNum];
        this.load.image(levelConfig.mapKey, levelConfig.mapFile);
        
        // Load open map for Level 3
        if (levelConfig.mapFileOpen) {
            this.load.image(levelConfig.mapKey + 'Open', levelConfig.mapFileOpen);
        }
    });
    
    // Load player sprite (Snowdy character)
    this.load.image('playerSprite', 'assets/snowdy.png');
    
    // Load guard sprite (cop image for Level 2)
    this.load.image('guardSprite', 'assets/coppng.png');
    
    // Load droid bot sprite (for Level 3 guards)
    this.load.image('droidSprite', 'assets/droidbot.png');
    
    // Load camera sprite for Level 1
    this.load.image('cameraSprite', 'assets/camera.png');
    
    // Load footstep sound
    this.load.audio('footsteps', 'assets/Footstep sound effects (walking sound effect).mp3');
    
    // Load "hey" sound for when caught on level 2
    this.load.audio('hey', 'assets/hey-89820.mp3');
    
    // Load beep warning sound for when caught on level 1
    this.load.audio('beepWarning', 'assets/beep-warning-6387.mp3');
    
    // Add error handler
    this.load.on('loaderror', function(file) {
        console.error('Error loading file:', file.key, file.src);
    });
    
    this.load.on('complete', function() {
        console.log('✓ All assets loaded successfully');
    });
}

/**
 * CREATE
 * Sets up the game world with PNG transparency-based collision
 */

// Helper function to check if a pixel is a wall based on transparency
// RULE: Non-transparent pixels = WALL, transparent = walkable
function isWallPixel(x, y) {
    // Bounds check
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) {
        return true;  // Treat out of bounds as wall
    }
    
    // Get pixel from cached pixel data
    const pixelX = Math.floor(x);
    const pixelY = Math.floor(y);
    const index = (pixelY * MAP_WIDTH + pixelX) * 4;  // RGBA = 4 bytes per pixel
    
    // Get alpha (transparency) value
    const alpha = collisionPixelData.data[index + 3];
    
    // If pixel is NOT transparent (has any opacity), it's a wall
    const transparencyThreshold = 10;  // Anything with alpha > 10 = wall
    return (alpha > transparencyThreshold);
}

function create() {
    // DEBUG: Apply debug settings
    if (DEBUG_MODE && !this.registry.get('debugApplied')) {
        currentLevel = DEBUG_START_LEVEL;
        this.registry.set('debugApplied', true);
        console.log(`🐛 DEBUG MODE: Starting at Level ${currentLevel}`);
    }
    
    console.log('Create: Setting up level', currentLevel);
    
    // Get current level configuration
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    
    // Update dynamic constants from level config
    MAP_WIDTH = levelConfig.mapWidth;
    MAP_HEIGHT = levelConfig.mapHeight;
    PLAYER_START_X = levelConfig.playerStartX;
    PLAYER_START_Y = levelConfig.playerStartY;
    GUARD_COUNT = levelConfig.guardCount;
    
    // Store scene reference for restart functionality
    sceneReference = this;
    const scene = this;
    
    // Reset game over state
    gameOver = false;
    
    // Set world bounds to match the PNG size
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    
    // Load the PNG map for current level
    map = this.add.image(0, 0, levelConfig.mapKey);
    map.setOrigin(0, 0);
    
    console.log('✓ PNG map loaded for level', currentLevel);
    console.log('Map dimensions:', map.width, 'x', map.height);
    
    // Get the texture and cache pixel data for fast collision checks
    collisionTexture = this.textures.get(levelConfig.mapKey).getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width = collisionTexture.width;
    canvas.height = collisionTexture.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(collisionTexture, 0, 0);
    collisionPixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    console.log('✓ Transparency-based collision active: Any non-transparent pixel = wall');
    
    // Create player sprite (Snowdy character)
    player = this.physics.add.sprite(PLAYER_START_X, PLAYER_START_Y, 'playerSprite');
    player.setCollideWorldBounds(true);
    
    // Scale the Snowdy sprite to match the player size (41px diameter)
    const targetSize = PLAYER_RADIUS * 2;  // 41 pixels
    player.setDisplaySize(targetSize, targetSize);
    
    // Set up circular collision body
    player.body.setCircle(PLAYER_RADIUS);
    player.body.offset.set(0, 0);
    
    // Initialize player facing direction (start facing down)
    player.facingAngle = Math.PI / 2;  // Start facing down (90 degrees)
    
    // Camera setup
    this.cameras.main.startFollow(player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setZoom(1);  // 1:1 scale to match SVG design
    
    // Set up keyboard controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // Also add WASD keys
    const wasd = this.input.keyboard.addKeys({
        up: 'W',
        down: 'S',
        left: 'A',
        right: 'D'
    });
    
    // Merge WASD with cursors
    cursors.w = wasd.up;
    cursors.s = wasd.down;
    cursors.a = wasd.left;
    cursors.d = wasd.right;
    
    // Guard sprite will use the cop image loaded in preload
    
    // Spawn guards or cameras based on level configuration
    if (levelConfig.usesCameras) {
        spawnCameras(this);
    } else {
        spawnGuards(this);
    }
    
    // Create document sprites (placeholder - green rectangles slightly smaller than player)
    createDocuments(this);
    
    // Create exit door sprite (orange rectangle, locked initially)
    createExitDoor(this);
    
    // Set up Enter key for document interaction
    enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    
    // Set up Spacebar for sprinting
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // PS5 Controller Support - Enable gamepad input
    if (this.input.gamepad) {
        this.input.gamepad.once('connected', (pad) => {
            gamepad = pad;
            console.log('🎮 PS5 Controller connected:', pad.id);
            console.log('🎮 Controls: X = Interact, R2 = Sprint, Left Stick = Move');
            console.log('🎮 Button count:', pad.buttons.length, '| Axes count:', pad.axes.length);
        });
        
        // Start listening for gamepads
        this.input.gamepad.start();
        
        // Check if gamepad is already connected
        if (this.input.gamepad.total > 0) {
            gamepad = this.input.gamepad.getPad(0);
            console.log('🎮 PS5 Controller already connected:', gamepad.id);
            console.log('🎮 Controls: X = Interact, R2 = Sprint, Left Stick = Move');
            console.log('🎮 Button count:', gamepad.buttons.length, '| Axes count:', gamepad.axes.length);
        }
    } else {
        console.warn('⚠️ Gamepad API not available in this browser');
    }
    
    // DEBUG: Add keyboard shortcuts for level switching
    if (DEBUG_MODE) {
        this.input.keyboard.on('keydown-ONE', () => {
            console.log('🐛 DEBUG: Switching to Level 1');
            loadLevel(1);
        });
        this.input.keyboard.on('keydown-TWO', () => {
            console.log('🐛 DEBUG: Switching to Level 2');
            loadLevel(2);
        });
        this.input.keyboard.on('keydown-THREE', () => {
            console.log('🐛 DEBUG: Switching to Level 3');
            loadLevel(3);
        });
        this.input.keyboard.on('keydown-V', () => {
            console.log('🐛 DEBUG: Showing victory screen');
            showVictoryScreen();
        });
        this.input.keyboard.on('keydown-D', () => {
            if (currentLevel === 3 && documents && documents.length > 0) {
                console.log('🐛 DEBUG: Auto-collecting all Level 3 documents');
                const levelConfig = LEVEL_CONFIGS[currentLevel];
                
                // Mark all documents as collected and hide them
                documents.forEach((doc, index) => {
                    if (!doc.collected) {
                        doc.collected = true;
                        doc.setVisible(false);
                        documentPrompts[index].setVisible(false);
                        documentsCollected++;
                    }
                });
                
                // Update UI
                updateDocumentCounter();
                
                // Unlock door
                if (documentsCollected >= levelConfig.documentCount) {
                    unlockExitDoor();
                }
                
                console.log(`✓ All ${documentsCollected} documents collected! Door unlocked.`);
            } else {
                console.log('❌ Debug auto-collect only works on Level 3');
            }
        });
        this.input.keyboard.on('keydown-G', () => {
            if (gamepad) {
                console.log('🎮 GAMEPAD DEBUG:');
                console.log('   ID:', gamepad.id);
                console.log('   Buttons:', gamepad.buttons.length);
                console.log('   Axes:', gamepad.axes.length);
                console.log('   X button (0):', gamepad.buttons[0]?.pressed);
                console.log('   L1 button (4):', gamepad.buttons[4]?.pressed);
                console.log('   R1 button (5):', gamepad.buttons[5]?.pressed);
                console.log('   R2 trigger (7):', gamepad.buttons[7]?.value);
                console.log('   Left stick X:', gamepad.axes[0]?.value);
                console.log('   Left stick Y:', gamepad.axes[1]?.value);
            } else {
                console.log('⚠️ No gamepad connected');
            }
        });
        console.log('🐛 DEBUG CONTROLS ACTIVE:');
        console.log('   Press 1 = Level 1');
        console.log('   Press 2 = Level 2');
        console.log('   Press 3 = Level 3');
        console.log('   Press G = Show gamepad info');
        console.log('   Press D = Auto-collect Level 3 documents');
        console.log('   Press V = Victory Screen');
    }
    
    // Create energy bar graphic (rendered below player)
    energyBar = this.add.graphics();
    energyBar.setDepth(10);  // Above player
    
    // Create guard energy bars graphic (for Level 3 guards)
    guardEnergyBars = this.add.graphics();
    guardEnergyBars.setDepth(10);  // Above guards
    
    // DISABLED: Player visibility system (using CSS vignette only)
    // darknessOverlay = this.add.graphics();
    // darknessOverlay.setDepth(100);  // Above everything else
    // darknessOverlay.setScrollFactor(0);  // Fixed to camera
    
    // Create visual indicator (ring around player)
    visualIndicator = this.add.graphics();
    visualIndicator.setScrollFactor(1);  // Follows the world (moves with player)
    visualIndicator.setDepth(-1);  // BELOW player sprite
    console.log('✓ Visual indicator created - ring around player');
    
    // Create footstep sound (loop continuously)
    footstepSound = this.sound.add('footsteps', {
        loop: true,
        volume: 0.3,  // Adjust volume (0 to 1)
        rate: 1.25    // Playback speed (1.25 = 25% faster)
    });
    console.log('✓ Footstep sound loaded');
    
    // Create "hey" sound for when caught on level 2 (one-shot)
    heySound = this.sound.add('hey', {
        loop: false,
        volume: 0.8
    });
    console.log('✓ Hey sound loaded');
    
    // Create beep warning sound for when caught on level 1 (one-shot)
    beepWarningSound = this.sound.add('beepWarning', {
        loop: false,
        volume: 0.8
    });
    console.log('✓ Beep warning sound loaded');
    
    // Unlock audio on first user interaction (required by browsers)
    const unlockAudio = () => {
        if (!audioUnlocked && this.sound.context) {
            this.sound.context.resume().then(() => {
                audioUnlocked = true;
                console.log('✓ Audio unlocked');
            });
        }
    };
    
    // Listen for any key press or click to unlock audio
    this.input.keyboard.on('keydown', unlockAudio, this);
    this.input.once('pointerdown', unlockAudio, this);
    
    // Instructions removed - not visible with vignette overlay
    
    console.log('✓ Game ready - try moving with arrow keys or WASD!');
    console.log('✓ Transparency-based collision: transparent = walkable, opaque = wall');
    console.log(`✓ Snowdy character spawned at position (${PLAYER_START_X}, ${PLAYER_START_Y})`);
    console.log(`✓ Character size: ${PLAYER_RADIUS * 2}px diameter`);
    console.log('✓ ALL PNG content (lines, shapes) acts as impassable walls');
    console.log(`✓ ${GUARD_COUNT} guards spawned with patrol routes`);
    console.log(`✓ Vision range: ${VISION_RANGE}px | Hearing range: ${HEARING_RANGE}px`);
    console.log('✓ Guards: FACE walking direction, look left/right while moving, 360° when paused!');
    console.log('✓ Guards: Hear player at 150px (turn at 0.016 speed, SPEED UP to 105), catch ONLY when vision cone sees player!');
    console.log('✓ Guards: REVERSE patrol direction if sound comes from behind!');
    console.log('✓ Vision cones: Raycast rendering - vision is cut off by walls!');
    console.log(`✓ Player visibility: ${PLAYER_VISIBILITY_RANGE}px radius with wall-clipping (darkness overlay enabled)`);
    
    // Initialize mini-map
    initializeMiniMap();
    
    // Initialize game time (start at 3:38:12 AM)
    gameStartTime = Date.now();
    
    // Update guard count display
    updateGuardCount();
    
    // Update level name in UI
    updateLevelName();
    
    console.log('✓ UI Grid System initialized with mini-map and stats!');
}

// Update level name in top bar
function updateLevelName() {
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const floorTitleEl = document.getElementById('floor-title');
    if (floorTitleEl) {
        floorTitleEl.textContent = levelConfig.name;
    }
}

/**
 * HELPER FUNCTIONS FOR GUARDS & DETECTION
 */

// Check if a position is valid (not in a wall)
function isValidPosition(x, y) {
    // Check if position would collide with walls
    const checkRadius = GUARD_RADIUS;
    const numSamples = 8;
    
    for (let i = 0; i < numSamples; i++) {
        const angle = (i / numSamples) * Math.PI * 2;
        const checkX = x + Math.cos(angle) * checkRadius;
        const checkY = y + Math.sin(angle) * checkRadius;
        
        if (isWallPixel(checkX, checkY)) {
            return false;  // Position would be in a wall
        }
    }
    return true;  // Position is clear
}

// Check if there's a clear path between two points (no walls blocking)
function hasLineOfSight(x1, y1, x2, y2) {
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const steps = Math.ceil(distance / 10);  // Check every 10 pixels
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const checkX = x1 + (x2 - x1) * t;
        const checkY = y1 + (y2 - y1) * t;
        
        // Check if this point would be valid for a guard
        if (!isValidPosition(checkX, checkY)) {
            return false;  // Wall blocks the path
        }
    }
    
    return true;  // Clear path!
}

// Spawn all guards with predefined patrol paths
function spawnGuards(scene) {
    guards = [];  // Reset guards array
    visionCones = [];  // Reset vision cones array
    
    // Skip spawning if GUARD_COUNT is 0 (for debugging)
    if (GUARD_COUNT === 0) {
        console.log('⚠️ No guards spawned (GUARD_COUNT = 0 for debugging)');
        return;
    }
    
    // Get current level's patrol paths and configuration
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const PATROL_PATHS = levelConfig.patrolPaths;
    const isLevel3 = levelConfig.usesPathFollowing === true;
    
    // Determine sprite based on level
    const guardSprite = isLevel3 ? 'droidSprite' : 'guardSprite';
    
    if (isLevel3) {
        // LEVEL 3: Path-following guards (1 per patrol path)
        console.log(`Spawning ${GUARD_COUNT} path-following guards for Level 3...`);
        
        const guardSize = GUARD_RADIUS * 2;  // 41 pixels
        
        for (let pathIndex = 0; pathIndex < PATROL_PATHS.length; pathIndex++) {
            const patrolPath = PATROL_PATHS[pathIndex];
            const guardStartPos = patrolPath[0];
            
            const guard = scene.physics.add.sprite(guardStartPos.x, guardStartPos.y, guardSprite);
            guard.setDisplaySize(guardSize, guardSize);
            guard.body.setCircle(GUARD_RADIUS);
            guard.body.offset.set(0, 0);
            
            // Level 3 specific properties
            guard.isLevel3 = true;
            guard.patrolPath = patrolPath;
            guard.currentWaypoint = 0;
            guard.patrolSpeed = levelConfig.guardSpeed;  // 107 (player speed + 7)
            guard.patrolDirection = 1;
            guard.isPaused = false;
            guard.currentTween = null;
            
            // Path following state
            guard.aiMode = 'patrol';  // 'patrol', 'navigating', 'following', 'exhausted', 'returning'
            guard.hasHeardPlayer = false;
            guard.pathfindingWaypoints = [];
            guard.currentPathfindingWaypoint = 0;
            guard.followingStartTime = 0;
            guard.frozenPosition = null;
            
            // Stamina system
            guard.energy = MAX_GUARD_ENERGY;
            guard.isExhausted = false;
            guard.exhaustedStartTime = 0;
            guard.lastPatrolPosition = {x: guardStartPos.x, y: guardStartPos.y};  // Position before chasing
            guard.returnPath = [];  // Path to return to last position
            
            // Initialize base angle
            const nextWaypoint = patrolPath[1] || patrolPath[0];
            guard.baseAngle = Phaser.Math.Angle.Between(guardStartPos.x, guardStartPos.y, nextWaypoint.x, nextWaypoint.y);
            
            // No vision cone for Level 3 (hearing only)
            const visionCone = scene.add.graphics();
            visionCone.setDepth(-1);
            
            guards.push(guard);
            visionCones.push(visionCone);
            moveToNextWaypoint(scene, guard, guards.length - 1);
            
            console.log(`✓ Level 3 Guard ${guards.length} (Path ${pathIndex + 1}) spawned at (${guardStartPos.x}, ${guardStartPos.y})`);
        }
        
        console.log(`✓ All ${guards.length} Level 3 guards spawned (hearing only, path-following AI)`);
    } else {
        // LEVELS 1 & 2: Normal guards (2 per patrol path)
        console.log(`Spawning ${GUARD_COUNT} guards (2 per path) for Level ${currentLevel}...`);
        
        const guardSize = GUARD_RADIUS * 2;  // 41 pixels
        
        for (let pathIndex = 0; pathIndex < PATROL_PATHS.length; pathIndex++) {
            const patrolPath = PATROL_PATHS[pathIndex];
            
            // Guard 1: Starts at beginning of path (index 0), moves forward
            const guard1StartPos = patrolPath[0];
            const guard1 = scene.physics.add.sprite(guard1StartPos.x, guard1StartPos.y, guardSprite);
            guard1.setDisplaySize(guardSize, guardSize);
            guard1.body.setCircle(GUARD_RADIUS);
            guard1.body.offset.set(0, 0);
            
            const visionCone1 = scene.add.graphics();
            visionCone1.setDepth(-1);
            
            guard1.patrolPath = patrolPath;
            guard1.currentWaypoint = 0;
            guard1.patrolSpeed = GUARD_SPEED;
            guard1.patrolDirection = 1;
            guard1.isPaused = false;
            
            const nextWaypoint1 = patrolPath[1] || patrolPath[0];
            guard1.baseAngle = Phaser.Math.Angle.Between(guard1StartPos.x, guard1StartPos.y, nextWaypoint1.x, nextWaypoint1.y);
            
            guard1.lookAngle = 0;
            guard1.lookDirection = 1;
            guard1.lookSpeed = Phaser.Math.FloatBetween(LOOK_AROUND_SPEED_MIN, LOOK_AROUND_SPEED_MAX);
            guard1.hasRedirected = false;
            guard1.currentTween = null;
            
            guards.push(guard1);
            visionCones.push(visionCone1);
            moveToNextWaypoint(scene, guard1, guards.length - 1);
            
            console.log(`✓ Guard ${guards.length} (Path ${pathIndex + 1}A) spawned at START (${guard1StartPos.x}, ${guard1StartPos.y})`);
            
            // Guard 2: Starts at end of path, moves backward
            const guard2StartPos = patrolPath[patrolPath.length - 1];
            const guard2 = scene.physics.add.sprite(guard2StartPos.x, guard2StartPos.y, guardSprite);
            guard2.setDisplaySize(guardSize, guardSize);
            guard2.body.setCircle(GUARD_RADIUS);
            guard2.body.offset.set(0, 0);
            
            const visionCone2 = scene.add.graphics();
            visionCone2.setDepth(-1);
            
            guard2.patrolPath = patrolPath;
            guard2.currentWaypoint = patrolPath.length - 1;
            guard2.patrolSpeed = GUARD_SPEED;
            guard2.patrolDirection = -1;
            guard2.isPaused = false;
            
            const prevWaypoint2 = patrolPath[patrolPath.length - 2] || patrolPath[patrolPath.length - 1];
            guard2.baseAngle = Phaser.Math.Angle.Between(guard2StartPos.x, guard2StartPos.y, prevWaypoint2.x, prevWaypoint2.y);
            
            guard2.lookAngle = 0;
            guard2.lookDirection = 1;
            guard2.lookSpeed = Phaser.Math.FloatBetween(LOOK_AROUND_SPEED_MIN, LOOK_AROUND_SPEED_MAX);
            guard2.hasRedirected = false;
            guard2.currentTween = null;
            
            guards.push(guard2);
            visionCones.push(visionCone2);
            moveToNextWaypoint(scene, guard2, guards.length - 1);
            
            console.log(`✓ Guard ${guards.length} (Path ${pathIndex + 1}B) spawned at END (${guard2StartPos.x}, ${guard2StartPos.y})`);
        }
        
        console.log(`✓ All ${guards.length} guards spawned (2 per path, starting at opposite ends)`);
    }
}

// Spawn security cameras (stationary with rotating vision)
function spawnCameras(scene) {
    guards = [];  // Reuse guards array for cameras (same collision/detection logic)
    visionCones = [];
    cameras = [];  // Store camera-specific data
    
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const cameraPositions = levelConfig.cameras;
    
    if (!cameraPositions || cameraPositions.length === 0) {
        console.log('⚠️ No cameras configured for this level');
        return;
    }
    
    console.log(`Spawning ${cameraPositions.length * 2} security cameras (2 per location) for Level ${currentLevel}...`);
    
    const cameraSize = GUARD_RADIUS * 2;  // Same size as guards (41px)
    
    cameraPositions.forEach((camData, index) => {
        // Create 2 cameras at each location
        for (let i = 0; i < 2; i++) {
            // Create camera sprite using camera PNG
            const camera = scene.add.sprite(camData.x, camData.y, 'cameraSprite');
            camera.setDisplaySize(cameraSize, cameraSize);
            // No red tint - just use the camera PNG as-is
            
            // Camera properties
            camera.isCamera = true;  // Flag to identify as camera
            camera.baseAngle = camData.facingAngle;  // Initial facing direction
            camera.lookAngle = 0;  // Current rotation offset
            camera.lookDirection = 1;  // 1 = rotating right, -1 = rotating left
            camera.lookSpeed = Phaser.Math.FloatBetween(CAMERA_ROTATION_SPEED_MIN, CAMERA_ROTATION_SPEED_MAX);  // Faster rotation for cameras
            
            const visionCone = scene.add.graphics();
            visionCone.setDepth(-1);
            
            guards.push(camera);  // Add to guards array for unified detection logic
            visionCones.push(visionCone);
        }
        
        cameras.push(camData);
        
        console.log(`✓ 2 Cameras spawned at position ${index + 1}: (${camData.x}, ${camData.y}), facing ${(camData.facingAngle * 180 / Math.PI).toFixed(0)}°`);
    });
    
    console.log(`✓ All ${guards.length} cameras spawned and active (${cameraPositions.length} locations × 2)`);
}

// Create document collectibles
function createDocuments(scene) {
    documents = [];  // Reset documents array
    documentPrompts = [];  // Reset prompts array
    
    // Get current level configuration
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const documentPositions = levelConfig.documentPositions;
    
    // Document size (slightly smaller than player: 30px instead of 41px)
    const docSize = 30;
    
    // Create document graphic (green rectangle placeholder)
    const docGraphics = scene.add.graphics();
    docGraphics.fillStyle(0x00ff00, 1);  // Green color
    docGraphics.fillRect(0, 0, docSize, docSize);
    docGraphics.generateTexture('document', docSize, docSize);
    docGraphics.destroy();
    
    // Spawn documents at level-specific positions
    documentPositions.forEach((pos, index) => {
        const doc = scene.add.sprite(pos.x, pos.y, 'document');
        doc.setOrigin(0.5);
        doc.collected = false;
        doc.documentIndex = index;
        
        // Add blinking animation using scene tweens
        scene.tweens.add({
            targets: doc,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Create "Press Enter" prompt (hidden by default)
        const prompt = scene.add.text(pos.x, pos.y - 40, 'Press ENTER / X', {
            fontSize: '14px',
            fill: '#00ff00',
            fontFamily: 'Roboto Mono',
            stroke: '#000000',
            strokeThickness: 3
        });
        prompt.setOrigin(0.5);
        prompt.setVisible(false);
        
        documents.push(doc);
        documentPrompts.push(prompt);
    });
    
    console.log(`✓ ${documents.length} documents spawned (placeholder positions)`);
}

// Create exit door
function createExitDoor(scene) {
    // Get current level configuration
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const exitPosition = levelConfig.exitPosition;
    
    const doorSize = 35;
    
    // Level 3 uses orange doors, other levels use blue
    const doorColor = (currentLevel === 3) ? 0xff9900 : 0x0099ff;  // Orange for Level 3, Blue for others
    
    // Create exit door graphic
    const doorGraphics = scene.add.graphics();
    doorGraphics.fillStyle(doorColor, 1);
    doorGraphics.fillRect(0, 0, doorSize, doorSize);
    doorGraphics.generateTexture('exitDoor', doorSize, doorSize);
    doorGraphics.destroy();
    
    // Spawn exit door at level-specific position
    exitDoor = scene.add.sprite(exitPosition.x, exitPosition.y, 'exitDoor');
    exitDoor.setOrigin(0.5);
    exitDoor.locked = true;  // Locked until all documents collected
    exitDoor.setAlpha(0.5);  // Dimmed when locked
    exitDoor.isLevel3Door = (currentLevel === 3);  // Flag for Level 3 doors
    
    console.log(`✓ Exit door spawned (${currentLevel === 3 ? 'ORANGE' : 'BLUE'} - locked until all documents collected)`);
}

// Initialize Level 3 Part 2 connection puzzle
function initializeConnectionPuzzle(scene) {
    if (currentLevel !== 3 || currentLevelPart !== 2) return;
    
    console.log('🔴 Initializing Level 3 Part 2 - Connection Puzzle');
    
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const connectionData = levelConfig.part2ConnectionPoints;
    
    if (!connectionData || connectionData.length === 0) {
        console.warn('⚠️ No connection points configured for Level 3 Part 2');
        return;
    }
    
    // Clear any existing connection data
    connectionPoints = [];
    connections = [];
    activeConnection = null;
    
    // Create connection line graphics
    if (connectionLineGraphics) {
        connectionLineGraphics.destroy();
    }
    connectionLineGraphics = scene.add.graphics();
    connectionLineGraphics.setDepth(5);  // Above ground, below player
    
    connectionData.forEach((pair, pairIndex) => {
        // Create Point A
        const pointASize = 15;
        const pointAGraphics = scene.add.graphics();
        pointAGraphics.fillStyle(0xff0000, 0.8);  // Red, semi-transparent
        pointAGraphics.fillCircle(0, 0, pointASize);
        pointAGraphics.lineStyle(3, 0xffffff, 1);  // White border
        pointAGraphics.strokeCircle(0, 0, pointASize);
        pointAGraphics.generateTexture(`connectionPointA_${pairIndex}`, pointASize * 2, pointASize * 2);
        pointAGraphics.destroy();
        
        const pointASprite = scene.add.sprite(pair.pointA.x, pair.pointA.y, `connectionPointA_${pairIndex}`);
        pointASprite.pairIndex = pairIndex;
        pointASprite.isPointA = true;
        pointASprite.connected = false;
        
        // Create Point B
        const pointBGraphics = scene.add.graphics();
        pointBGraphics.fillStyle(0xff0000, 0.8);  // Red, semi-transparent
        pointBGraphics.fillCircle(0, 0, pointASize);
        pointBGraphics.lineStyle(3, 0xffffff, 1);  // White border
        pointBGraphics.strokeCircle(0, 0, pointASize);
        pointBGraphics.generateTexture(`connectionPointB_${pairIndex}`, pointASize * 2, pointASize * 2);
        pointBGraphics.destroy();
        
        const pointBSprite = scene.add.sprite(pair.pointB.x, pair.pointB.y, `connectionPointB_${pairIndex}`);
        pointBSprite.pairIndex = pairIndex;
        pointBSprite.isPointA = false;
        pointBSprite.connected = false;
        
        connectionPoints.push(pointASprite, pointBSprite);
        
        // Initialize connection state
        connections.push({
            pairIndex: pairIndex,
            pointA: pointASprite,
            pointB: pointBSprite,
            completed: false,
            lineGraphic: null
        });
        
        console.log(`✓ Connection ${pairIndex + 1}: Point A (${pair.pointA.x}, ${pair.pointA.y}) ↔ Point B (${pair.pointB.x}, ${pair.pointB.y})`);
    });
    
    // Start the 45-second timer
    part2Active = true;
    part2TimerStart = Date.now();
    
    // Show timer UI
    const timerEl = document.getElementById('part2-timer');
    if (timerEl) {
        timerEl.classList.add('active');
        timerEl.textContent = `TIME: ${part2TimeLimit}s`;
        timerEl.style.color = '#00ff00';
    }
    
    console.log(`✓ Connection puzzle initialized - 45 seconds to complete ${connections.length} connections!`);
    console.log(`✓ Connection points created: ${connectionPoints.length} points`);
    console.log('✓ Press ENTER / X near Point A to start drawing, then ENTER / X at Point B to complete');
}

// Move guard to next waypoint in patrol path (back and forth with random pauses)
function moveToNextWaypoint(scene, guard, guardIndex) {
    if (!guard.patrolPath || guard.patrolPath.length === 0) return;
    
    const waypoint = guard.patrolPath[guard.currentWaypoint];
    const distance = Phaser.Math.Distance.Between(guard.x, guard.y, waypoint.x, waypoint.y);
    const duration = (distance / guard.patrolSpeed) * 1000;  // Convert to milliseconds
    
    // Use Phaser tween for smooth movement and store it on the guard
    guard.currentTween = scene.tweens.add({
        targets: guard,
        x: waypoint.x,
        y: waypoint.y,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
            guard.currentTween = null;  // Clear tween reference
            
            // Decide whether to pause at this waypoint
            const shouldPause = Math.random() < PAUSE_CHANCE;
            
            if (shouldPause) {
                // Guard pauses for 3 seconds
                guard.isPaused = true;
                scene.time.delayedCall(PAUSE_DURATION, () => {
                    guard.isPaused = false;
                    continuePatrol(scene, guard, guardIndex);
                });
            } else {
                // Continue immediately
                continuePatrol(scene, guard, guardIndex);
            }
        }
    });
}

// Helper function to continue patrol after reaching a waypoint
function continuePatrol(scene, guard, guardIndex) {
    // Move to next waypoint (back and forth)
    guard.currentWaypoint += guard.patrolDirection;
    
    // Check if we've reached the end or beginning
    if (guard.currentWaypoint >= guard.patrolPath.length) {
        // Reached the end, go backward
        guard.currentWaypoint = guard.patrolPath.length - 2;
        guard.patrolDirection = -1;
    } else if (guard.currentWaypoint < 0) {
        // Reached the beginning, go forward
        guard.currentWaypoint = 1;
        guard.patrolDirection = 1;
    }
    
    moveToNextWaypoint(scene, guard, guardIndex);
}

// Draw vision cone for a guard or camera (with rotating look-around behavior)
function drawVisionCone(visionCone, guard) {
    visionCone.clear();
    
    // Check if this is a camera (stationary)
    const isCamera = guard.isCamera === true;
    
    if (!isCamera) {
        // For guards: Calculate base direction from movement (direction they're walking)
        const angle = Phaser.Math.Angle.Between(
            guard.body.prev.x, guard.body.prev.y,
            guard.x, guard.y
        );
        
        // Always update base angle when moving - this is the direction they're heading
        if (guard.body.speed > 0.1) {
            guard.baseAngle = angle;
        }
    }
    
    // Check if player is within hearing range (guards only, not cameras)
    const distanceToPlayer = Phaser.Math.Distance.Between(guard.x, guard.y, player.x, player.y);
    const canHear = !isCamera && (distanceToPlayer <= HEARING_RANGE);
    
    if (canHear) {
        // HEARING MODE: Turn toward the sound source (player)
        // Speed up when hearing the player
        if (guard.patrolSpeed !== 103) {
            guard.patrolSpeed = 103;
            
            // If already moving, restart the tween with new speed
            if (guard.currentTween && guard.currentTween.isPlaying()) {
                const guardIndex = guards.indexOf(guard);
                guard.currentTween.stop();
                if (sceneReference) {
                    moveToNextWaypoint(sceneReference, guard, guardIndex);
                }
            }
        }
        
        // Calculate angle to player relative to guard's base direction
        const angleToPlayer = Phaser.Math.Angle.Between(guard.x, guard.y, player.x, player.y);
        const targetLookAngle = Phaser.Math.Angle.Wrap(angleToPlayer - guard.baseAngle);
        
        // Check if sound is coming from behind (more than 90° off from current direction)
        if (!guard.hasRedirected && Math.abs(targetLookAngle) > Math.PI / 2) {
            // Sound is behind! Reverse patrol direction
            const oldDirection = guard.patrolDirection;
            guard.patrolDirection *= -1;
            guard.hasRedirected = true;  // Only redirect once per hearing event
            
            // Update waypoint to go back the way we came
            // If we were going to waypoint X, go back to the previous waypoint
            guard.currentWaypoint = guard.currentWaypoint - oldDirection;
            
            // Clamp to valid waypoint range
            if (guard.currentWaypoint >= guard.patrolPath.length) {
                guard.currentWaypoint = guard.patrolPath.length - 1;
            } else if (guard.currentWaypoint < 0) {
                guard.currentWaypoint = 0;
            }
            
            // Stop current tween and move to next waypoint in new direction
            if (guard.currentTween) {
                guard.currentTween.stop();
            }
            
            // Find the scene reference and restart movement
            if (sceneReference) {
                // Get guard index from guards array
                const guardIndex = guards.indexOf(guard);
                moveToNextWaypoint(sceneReference, guard, guardIndex);
            }
        }
        
        // Rotate toward the sound at fixed speed of 0.014
        const rotateSpeed = 0.018;
        const angleDiff = Phaser.Math.Angle.Wrap(targetLookAngle - guard.lookAngle);
        
        if (Math.abs(angleDiff) > rotateSpeed) {
            // Still rotating toward target
            guard.lookAngle += Math.sign(angleDiff) * rotateSpeed;
        } else {
            // Close enough to target angle
            guard.lookAngle = targetLookAngle;
        }
        
    } else {
        // NORMAL MODE: Look around normally
        if (!isCamera) {
            // Guards only: Reset redirection flag when player leaves hearing range
            guard.hasRedirected = false;
            
            // Reset speed to normal when not hearing
            if (guard.patrolSpeed !== GUARD_SPEED) {
                guard.patrolSpeed = GUARD_SPEED;
                
                // If already moving, restart the tween with new (slower) speed
                if (guard.currentTween && guard.currentTween.isPlaying()) {
                    const guardIndex = guards.indexOf(guard);
                    guard.currentTween.stop();
                    if (sceneReference) {
                        moveToNextWaypoint(sceneReference, guard, guardIndex);
                    }
                }
            }
        }
        
        // Determine rotation limits based on type
        let maxLookAngleRight, maxLookAngleLeft;
        
        if (isCamera) {
            // Cameras rotate full 360° continuously
            maxLookAngleRight = LOOK_AROUND_ANGLE_PAUSED;
            maxLookAngleLeft = LOOK_AROUND_ANGLE_PAUSED;
        } else if (guard.isPaused) {
            // Guards when paused look full 360°
            maxLookAngleRight = LOOK_AROUND_ANGLE_PAUSED;
            maxLookAngleLeft = LOOK_AROUND_ANGLE_PAUSED;
        } else {
            // Guards when moving look left and right from their walking direction
            maxLookAngleRight = LOOK_AROUND_ANGLE_RIGHT;
            maxLookAngleLeft = LOOK_AROUND_ANGLE_LEFT;
        }
        
        // Oscillate the look angle
        // Use the entity's unique random rotation speed
        guard.lookAngle += guard.lookSpeed * guard.lookDirection;
        
        // Reverse direction when reaching the limit
        if (guard.lookAngle > maxLookAngleRight) {
            guard.lookDirection = -1;
        } else if (guard.lookAngle < -maxLookAngleLeft) {
            guard.lookDirection = 1;
        }
    }
    
    // Combine base angle (walking direction) with look-around offset (left/right)
    const facingAngle = guard.baseAngle + guard.lookAngle;
    
    // Determine vision angle based on entity type
    const visionAngle = isCamera ? CAMERA_VISION_ANGLE : VISION_ANGLE;
    const halfAngle = (visionAngle / 2) * (Math.PI / 180);
    
    if (isCamera) {
        // CAMERAS: Draw simple cone without wall clipping (pass through walls)
        const rayPoints = [];
        rayPoints.push({ x: guard.x, y: guard.y });
        
        const numPoints = 32;  // Smooth cone
        for (let i = 0; i <= numPoints; i++) {
            const rayAngle = facingAngle - halfAngle + (i / numPoints) * (halfAngle * 2);
            const endX = guard.x + Math.cos(rayAngle) * VISION_RANGE;
            const endY = guard.y + Math.sin(rayAngle) * VISION_RANGE;
            rayPoints.push({ x: endX, y: endY });
        }
        
        // Draw camera vision cone (passes through walls)
        if (rayPoints.length > 2) {
            visionCone.fillStyle(0xffff99, 0.3);  // Whitish-yellow, 30% opacity
            visionCone.beginPath();
            visionCone.moveTo(rayPoints[0].x, rayPoints[0].y);
            for (let i = 1; i < rayPoints.length; i++) {
                visionCone.lineTo(rayPoints[i].x, rayPoints[i].y);
            }
            visionCone.closePath();
            visionCone.fillPath();
            
            // Draw outline
            visionCone.lineStyle(1, 0xffff00, 0.5);
            visionCone.strokePath();
        }
    } else {
        // GUARDS: Draw vision cone with wall clipping using raycasting
        const numRays = 32;  // More rays = smoother edges
        const rayPoints = [];
        
        // Always start at the guard position
        rayPoints.push({ x: guard.x, y: guard.y });
        
        // Cast rays from left edge to right edge of vision cone
        for (let i = 0; i <= numRays; i++) {
            const rayAngle = facingAngle - halfAngle + (i / numRays) * (halfAngle * 2);
            
            // Raycast to find where this ray hits a wall (or max range)
            const rayEndpoint = castRay(guard.x, guard.y, rayAngle, VISION_RANGE);
            rayPoints.push(rayEndpoint);
        }
        
        // Draw the vision cone as a polygon connecting all ray endpoints
        if (rayPoints.length > 2) {
            visionCone.fillStyle(0xffff99, 0.3);  // Whitish-yellow, 30% opacity
            visionCone.beginPath();
            visionCone.moveTo(rayPoints[0].x, rayPoints[0].y);
            for (let i = 1; i < rayPoints.length; i++) {
                visionCone.lineTo(rayPoints[i].x, rayPoints[i].y);
            }
            visionCone.closePath();
            visionCone.fillPath();
            
            // Draw outline
            visionCone.lineStyle(1, 0xffff00, 0.5);
            visionCone.strokePath();
        }
    }
}

// Cast a ray from (x, y) in a direction (angle) up to maxDistance
// Returns the point where the ray hits a wall, or the max distance point
function castRay(x, y, angle, maxDistance) {
    const stepSize = 5;  // Check every 5 pixels
    const dx = Math.cos(angle) * stepSize;
    const dy = Math.sin(angle) * stepSize;
    
    let currentX = x;
    let currentY = y;
    let distance = 0;
    
    while (distance < maxDistance) {
        currentX += dx;
        currentY += dy;
        distance += stepSize;
        
        // Check if we hit a wall
        if (isWallPixel(currentX, currentY)) {
            // Back up a bit for smoother edge
            return {
                x: currentX - dx,
                y: currentY - dy
            };
        }
    }
    
    // No wall hit, return max distance point
    return {
        x: x + Math.cos(angle) * maxDistance,
        y: y + Math.sin(angle) * maxDistance
    };
}

// Draw player visibility (directional cone based on movement)
function drawPlayerVisibility(camera) {
    if (!darknessOverlay || !player) return;
    
    // Clear graphics
    darknessOverlay.clear();
    
    // Get player position in screen coordinates
    const screenX = player.x - camera.scrollX;
    const screenY = player.y - camera.scrollY;
    
    // Cast rays in a CONE based on player facing direction
    const halfAngle = (PLAYER_VISION_ANGLE / 2) * (Math.PI / 180);
    const numRays = 48;  // More rays = smoother cone
    const rayPoints = [];
    
    // Always start at the player position
    rayPoints.push({ x: screenX, y: screenY });
    
    // Cast rays from left edge to right edge of vision cone
    for (let i = 0; i <= numRays; i++) {
        const rayAngle = player.facingAngle - halfAngle + (i / numRays) * (halfAngle * 2);
        
        // Raycast to find where this ray hits a wall (or max range)
        const rayEndpoint = castRay(player.x, player.y, rayAngle, PLAYER_VISIBILITY_RANGE);
        
        // Convert to screen coordinates
        rayPoints.push({
            x: rayEndpoint.x - camera.scrollX,
            y: rayEndpoint.y - camera.scrollY
        });
    }
    
    // Draw full-screen darkness with a hole cut out for visibility
    const camWidth = camera.width;
    const camHeight = camera.height;
    
    // Draw COMPLETE darkness (opacity 1.0) to hide everything outside visibility
    darknessOverlay.fillStyle(0x000000, 0.3);  // Temporarily semi-transparent to debug
    darknessOverlay.beginPath();
    
    // Outer rectangle (entire screen)
    darknessOverlay.moveTo(0, 0);
    darknessOverlay.lineTo(camWidth, 0);
    darknessOverlay.lineTo(camWidth, camHeight);
    darknessOverlay.lineTo(0, camHeight);
    darknessOverlay.lineTo(0, 0);
    
    // Inner shape (visibility cone) - drawn in reverse to create a hole
    if (rayPoints.length > 2) {
        darknessOverlay.moveTo(rayPoints[0].x, rayPoints[0].y);
        for (let i = rayPoints.length - 1; i >= 0; i--) {
            darknessOverlay.lineTo(rayPoints[i].x, rayPoints[i].y);
        }
    }
    
    darknessOverlay.closePath();
    darknessOverlay.fillPath();
}

// Check if guard/camera can see the player
function canSeePlayer(guard) {
    const isCamera = guard.isCamera === true;
    const distance = Phaser.Math.Distance.Between(guard.x, guard.y, player.x, player.y);
    
    // First check: Is player in range?
    if (distance > VISION_RANGE) return false;
    
    // Second check: Is player in the vision cone angle?
    const angleToPlayer = Phaser.Math.Angle.Between(guard.x, guard.y, player.x, player.y);
    const guardFacing = guard.baseAngle + guard.lookAngle;  // Use the same angle as vision cone
    const visionAngle = isCamera ? CAMERA_VISION_ANGLE : VISION_ANGLE;
    const halfAngle = (visionAngle / 2) * (Math.PI / 180);
    
    let angleDiff = angleToPlayer - guardFacing;
    // Normalize angle difference to -PI to PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    if (Math.abs(angleDiff) > halfAngle) return false;
    
    // Third check: Is there a wall blocking line of sight?
    // CAMERAS: Skip wall check (vision passes through walls)
    // GUARDS: Check for wall blocking
    if (!isCamera) {
        // Sample points along the line from guard to player
        const steps = Math.ceil(distance / 5);  // Check every 5 pixels
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkX = guard.x + (player.x - guard.x) * t;
            const checkY = guard.y + (player.y - guard.y) * t;
            
            if (isWallPixel(checkX, checkY)) {
                return false;  // Wall blocks vision
            }
        }
    }
    
    return true;  // Player is visible!
}

// Check if guard can hear the player (proximity)
function canHearPlayer(guard) {
    const distance = Phaser.Math.Distance.Between(guard.x, guard.y, player.x, player.y);
    return distance <= HEARING_RANGE;
}

// Restart the game
function restartGame() {
    console.log('Game over! Restarting...');
    
    // Stop footstep sound
    if (footstepSound && footstepSound.isPlaying) {
        footstepSound.stop();
    }
    isPlayerMoving = false;
    
    // Reset sprint energy
    sprintEnergy = MAX_SPRINT_ENERGY;
    isSprinting = false;
    
    // Reset Level 3 state
    currentLevelPart = 1;
    isRecordingPath = false;
    playerPathRecording = [];
    pathRecordingStartTime = 0;
    part2Active = false;
    
    // Hide Part 2 timer
    const timerEl = document.getElementById('part2-timer');
    if (timerEl) {
        timerEl.classList.remove('active');
    }
    
    // Reset document counter
    documentsCollected = 0;
    updateDocumentCounter();
    
    // Reset narrative text
    const narrativeEl = document.getElementById('narrative-text');
    if (narrativeEl) {
        narrativeEl.textContent = 'Type populates this box after each objective is reached.';
    }
    
    // Clear all guards and vision cones
    guards.forEach(guard => guard.destroy());
    visionCones.forEach(cone => cone.destroy());
    guards = [];
    visionCones = [];
    
    // Restart the scene
    sceneReference.scene.restart();
}

/**
 * VISUAL INDICATOR (Fortnite-style)
 * Draws directional indicators for guards, sounds, and objectives
 */
let indicatorLogCount = 0;
function drawVisualIndicator() {
    if (!visualIndicator || !player || !sceneReference) {
        if (indicatorLogCount < 5) {
            console.log('❌ Indicator check failed:', { 
                visualIndicator: !!visualIndicator, 
                player: !!player, 
                sceneReference: !!sceneReference 
            });
            indicatorLogCount++;
        }
        return;
    }
    
    if (indicatorLogCount === 0) {
        console.log('✅ INDICATOR IS DRAWING! White ring around player with RED pie wedges for guards');
        indicatorLogCount = 1;
    }
    
    visualIndicator.clear();
    
    // Ring positioned around the PLAYER character
    const indicatorX = player.x;  // Player's X position
    const indicatorY = player.y;  // Player's Y position
    const ringRadius = 30;  // Ring radius around player (tighter)
    
    // Draw base ring (outline/stroke only) - TRANSPARENT
    // visualIndicator.lineStyle(4, 0xffffff, 0.4);  // White stroke ring - disabled
    // visualIndicator.strokeCircle(indicatorX, indicatorY, ringRadius);
    
    // Process guards and draw indicators
    let guardsDetected = 0;
    if (guards.length > 0) {
        for (let i = 0; i < guards.length; i++) {
            const guard = guards[i];
            const distance = Phaser.Math.Distance.Between(player.x, player.y, guard.x, guard.y);
            
            // Show guards within player visibility range + 200px
            const detectionRange = PLAYER_VISIBILITY_RANGE + 125;  // 300 + 200 = 500px
            if (distance > detectionRange) {
                continue;  // Skip guards beyond detection range
            }
            
            guardsDetected++;
            
            // Calculate angle from player to guard
            const angleToGuard = Phaser.Math.Angle.Between(player.x, player.y, guard.x, guard.y);
            
            // Red filled pie wedge in the ring
            const arcWidth = 40;  // Width of pie wedge in degrees
            const arcStart = angleToGuard - (arcWidth * Math.PI / 180) / 2;
            const arcEnd = angleToGuard + (arcWidth * Math.PI / 180) / 2;
            
            // Draw filled pie wedge (red section of the ring)
            visualIndicator.fillStyle(0xff0000, 0.8);  // Red, semi-transparent
            visualIndicator.beginPath();
            visualIndicator.arc(indicatorX, indicatorY, ringRadius, arcStart, arcEnd, false);
            visualIndicator.lineTo(indicatorX, indicatorY);
            visualIndicator.closePath();
            visualIndicator.fillPath();
        }
    }
    
    
    // Green objective wedges for next uncollected document (1000px radius)
    if (documents && documents.length > 0) {
        let nearestDoc = null;
        let nearestDocDist = Infinity;
        
        // Find nearest uncollected document within 1000px
        documents.forEach((doc) => {
            if (!doc.collected) {
                const dist = Phaser.Math.Distance.Between(player.x, player.y, doc.x, doc.y);
                if (dist <= 1000 && dist < nearestDocDist) {
                    nearestDocDist = dist;
                    nearestDoc = doc;
                }
            }
        });
        
        // Draw green wedge pointing to nearest document
        if (nearestDoc) {
            const angleToDoc = Phaser.Math.Angle.Between(player.x, player.y, nearestDoc.x, nearestDoc.y);
            const arcWidth = 40;  // Same width as threat wedges
            const arcStart = angleToDoc - (arcWidth * Math.PI / 180) / 2;
            const arcEnd = angleToDoc + (arcWidth * Math.PI / 180) / 2;
            
            visualIndicator.fillStyle(0x00ff00, 0.8);  // Green
            visualIndicator.beginPath();
            visualIndicator.arc(indicatorX, indicatorY, ringRadius, arcStart, arcEnd, false);
            visualIndicator.lineTo(indicatorX, indicatorY);
            visualIndicator.closePath();
            visualIndicator.fillPath();
        }
    }
    
    // Exit door indicator (blue for Levels 1 & 2, orange for Level 3)
    // Hide on Level 3 Part 2 (after passing through door)
    const showExitIndicator = exitDoor && !exitDoor.locked && !(currentLevel === 3 && currentLevelPart === 2);
    if (showExitIndicator) {
        const angleToExit = Phaser.Math.Angle.Between(player.x, player.y, exitDoor.x, exitDoor.y);
        const arcWidth = 40;
        const arcStart = angleToExit - (arcWidth * Math.PI / 180) / 2;
        const arcEnd = angleToExit + (arcWidth * Math.PI / 180) / 2;
        
        // Orange for Level 3, Blue for other levels
        const exitColor = (currentLevel === 3) ? 0xff9900 : 0x0099ff;
        visualIndicator.fillStyle(exitColor, 0.8);
        visualIndicator.beginPath();
        visualIndicator.arc(indicatorX, indicatorY, ringRadius, arcStart, arcEnd, false);
        visualIndicator.lineTo(indicatorX, indicatorY);
        visualIndicator.closePath();
        visualIndicator.fillPath();
    }
    
    // Level 3 Part 2: Green wedges for connection points (show one per incomplete connection pair)
    if (currentLevel === 3 && currentLevelPart === 2 && part2Active && connectionPoints && connections) {
        // Find all uncompleted connections
        const incompleteConnections = connections.filter(conn => !conn.completed);
        
        // For each incomplete connection, show indicators to BOTH Point A and Point B
        incompleteConnections.forEach(conn => {
            const pointA = conn.pointA;
            const pointB = conn.pointB;
            
            // Draw indicator to Point A (if not connected yet)
            if (pointA && !pointA.connected) {
                const angleToPointA = Phaser.Math.Angle.Between(player.x, player.y, pointA.x, pointA.y);
                const arcWidth = 40;
                const arcStart = angleToPointA - (arcWidth * Math.PI / 180) / 2;
                const arcEnd = angleToPointA + (arcWidth * Math.PI / 180) / 2;
                
                visualIndicator.fillStyle(0x00ff00, 0.8);  // Green
                visualIndicator.beginPath();
                visualIndicator.arc(indicatorX, indicatorY, ringRadius, arcStart, arcEnd, false);
                visualIndicator.lineTo(indicatorX, indicatorY);
                visualIndicator.closePath();
                visualIndicator.fillPath();
            }
            
            // Draw indicator to Point B (if Point A is connected but B is not)
            if (pointA && pointA.connected && pointB && !pointB.connected) {
                const angleToPointB = Phaser.Math.Angle.Between(player.x, player.y, pointB.x, pointB.y);
                const arcWidth = 40;
                const arcStart = angleToPointB - (arcWidth * Math.PI / 180) / 2;
                const arcEnd = angleToPointB + (arcWidth * Math.PI / 180) / 2;
                
                visualIndicator.fillStyle(0x00ff00, 0.8);  // Green
                visualIndicator.beginPath();
                visualIndicator.arc(indicatorX, indicatorY, ringRadius, arcStart, arcEnd, false);
                visualIndicator.lineTo(indicatorX, indicatorY);
                visualIndicator.closePath();
                visualIndicator.fillPath();
            }
        });
    }
}

/**
 * Draw energy bar below player character
 */
function drawEnergyBar() {
    if (!energyBar || !player) return;
    
    energyBar.clear();
    
    // Energy bar dimensions
    const barWidth = 35;
    const barHeight = 6;
    const barX = player.x - barWidth / 2;
    const barY = player.y + PLAYER_RADIUS + 10;  // Below player sprite
    
    // Draw grey background (empty energy)
    energyBar.fillStyle(0x666666, 0.8);
    energyBar.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw yellow foreground (current energy)
    const energyPercent = sprintEnergy / MAX_SPRINT_ENERGY;
    const currentBarWidth = barWidth * energyPercent;
    energyBar.fillStyle(0xffff00, 1.0);  // Yellow
    energyBar.fillRect(barX, barY, currentBarWidth, barHeight);
}

/**
 * Draw energy bars below Level 3 guards
 */
function drawGuardEnergyBars() {
    if (!guardEnergyBars || !guards || guards.length === 0) return;
    
    guardEnergyBars.clear();
    
    // Only draw for Level 3 guards
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    if (!levelConfig || !levelConfig.usesPathFollowing) return;
    
    const barWidth = 35;
    const barHeight = 6;
    
    guards.forEach(guard => {
        if (!guard.isLevel3) return;
        
        const barX = guard.x - barWidth / 2;
        const barY = guard.y + GUARD_RADIUS + 10;  // Below guard sprite
        
        // Draw grey background (empty energy)
        guardEnergyBars.fillStyle(0x666666, 0.8);
        guardEnergyBars.fillRect(barX, barY, barWidth, barHeight);
        
        // Draw red foreground (current energy)
        const energyPercent = guard.energy / MAX_GUARD_ENERGY;
        const currentBarWidth = barWidth * energyPercent;
        guardEnergyBars.fillStyle(0xff0000, 1.0);  // Red (threat color)
        guardEnergyBars.fillRect(barX, barY, currentBarWidth, barHeight);
    });
}

/**
 * LEVEL 3 GUARD AI - Path Following System with Stamina
 */
function updateLevel3GuardAI(guard, guardIndex) {
    if (!player || !guard.isLevel3) return;
    
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const distanceToPlayer = Phaser.Math.Distance.Between(guard.x, guard.y, player.x, player.y);
    const canHear = distanceToPlayer <= levelConfig.guardHearingRange;
    
    // STATE 1: PATROL MODE (initial state, hasn't heard player yet)
    if (guard.aiMode === 'patrol' && canHear && !guard.hasHeardPlayer) {
        console.log(`Guard ${guardIndex + 1} heard player! Starting path recording and navigation...`);
        
        // Save current position before chasing
        guard.lastPatrolPosition = {x: guard.x, y: guard.y};
        
        // Mark that this guard has heard the player
        guard.hasHeardPlayer = true;
        guard.aiMode = 'navigating';
        
        // Start path recording (first guard to hear triggers this)
        if (!isRecordingPath) {
            isRecordingPath = true;
            pathRecordingStartTime = Date.now();
            playerPathRecording = [];
            console.log('✓ Path recording started!');
        }
        
        // Calculate A* path to player's current location
        guard.lastHeardPlayerX = player.x;
        guard.lastHeardPlayerY = player.y;
        guard.pathfindingWaypoints = findPath(guard.x, guard.y, player.x, player.y);
        guard.currentPathfindingWaypoint = 0;
        
        // Stop current patrol tween
        if (guard.currentTween) {
            guard.currentTween.stop();
            guard.currentTween = null;
        }
        
        // Start A* navigation
        moveToNextPathfindingWaypoint(sceneReference, guard, guardIndex);
    }
    
    // STATE 2: NAVIGATING TO LAST HEARD LOCATION (using A*)
    if (guard.aiMode === 'navigating') {
        // Energy doesn't drain during navigation
        
        // Check if reached destination
        if (guard.pathfindingWaypoints.length > 0) {
            const currentWaypoint = guard.pathfindingWaypoints[guard.currentPathfindingWaypoint];
            const distToWaypoint = Phaser.Math.Distance.Between(guard.x, guard.y, currentWaypoint.x, currentWaypoint.y);
            
            // If close enough to current waypoint, move to next one
            if (distToWaypoint < 20 && !guard.currentTween) {
                guard.currentPathfindingWaypoint++;
                
                if (guard.currentPathfindingWaypoint >= guard.pathfindingWaypoints.length) {
                    // Reached destination! Start following immediately
                    console.log(`Guard ${guardIndex + 1} reached player's location! Starting to follow path...`);
                    guard.aiMode = 'following';
                    guard.pathFollowStartTime = Date.now() - pathRecordingStartTime;
                    guard.chasingStartTime = Date.now();  // Start stamina timer
                } else {
                    // Move to next waypoint
                    moveToNextPathfindingWaypoint(sceneReference, guard, guardIndex);
                }
            }
        }
        
        // Continue hearing check - if hears player again, update destination
        if (canHear) {
            const timeSinceLastUpdate = Date.now() - (guard.lastDestinationUpdate || 0);
            if (timeSinceLastUpdate > 1000) {  // Update destination every 1 second
                guard.lastDestinationUpdate = Date.now();
                guard.lastPatrolPosition = {x: guard.x, y: guard.y};  // Update patrol position
                guard.lastHeardPlayerX = player.x;
                guard.lastHeardPlayerY = player.y;
                guard.pathfindingWaypoints = findPath(guard.x, guard.y, player.x, player.y);
                guard.currentPathfindingWaypoint = 0;
                
                if (guard.currentTween) {
                    guard.currentTween.stop();
                    guard.currentTween = null;
                }
                
                moveToNextPathfindingWaypoint(sceneReference, guard, guardIndex);
            }
        }
    }
    
    // STATE 3: FOLLOWING PLAYER'S RECORDED PATH (15 second limit with energy drain)
    if (guard.aiMode === 'following') {
        // Check if player is moving
        const playerIsMoving = player.body && (player.body.velocity.x !== 0 || player.body.velocity.y !== 0);
        
        if (!playerIsMoving) {
            // Player stopped - freeze guard (energy doesn't drain)
            if (!guard.frozenPosition) {
                guard.frozenPosition = {x: guard.x, y: guard.y};
                if (guard.currentTween) {
                    guard.currentTween.stop();
                    guard.currentTween = null;
                }
                console.log(`Guard ${guardIndex + 1} frozen (player stopped)`);
            }
        } else {
            // Player is moving - unfreeze and follow path
            if (guard.frozenPosition) {
                guard.frozenPosition = null;
                console.log(`Guard ${guardIndex + 1} unfrozen (player moving)`);
            }
            
            // Drain energy while chasing (15 seconds = drain full bar)
            guard.energy -= GUARD_ENERGY_DRAIN_RATE * (1/60);  // Per frame at 60fps
            if (guard.energy < 0) guard.energy = 0;
            
            // Check if exhausted
            if (guard.energy <= 0 && !guard.isExhausted) {
                console.log(`Guard ${guardIndex + 1} exhausted! Taking 3-second break...`);
                guard.isExhausted = true;
                guard.exhaustedStartTime = Date.now();
                guard.aiMode = 'exhausted';
                
                if (guard.currentTween) {
                    guard.currentTween.stop();
                    guard.currentTween = null;
                }
                return;
            }
            
            // Calculate which position in the recorded path the guard should be at
            const currentTime = Date.now() - pathRecordingStartTime;
            const guardTimeOffset = currentTime;  // No delay - follow immediately
            
            const targetPosition = getPlayerPositionAtTime(guardTimeOffset);
            
            if (targetPosition && !guard.currentTween) {
                // Update patrol position while following
                guard.lastPatrolPosition = {x: guard.x, y: guard.y};
                
                // Move toward target position
                const distToTarget = Phaser.Math.Distance.Between(guard.x, guard.y, targetPosition.x, targetPosition.y);
                
                if (distToTarget > 5) {
                    const duration = (distToTarget / levelConfig.guardSpeed) * 1000;
                    
                    guard.currentTween = sceneReference.tweens.add({
                        targets: guard,
                        x: targetPosition.x,
                        y: targetPosition.y,
                        duration: duration,
                        ease: 'Linear',
                        onComplete: () => {
                            guard.currentTween = null;
                        }
                    });
                }
            }
        }
    }
    
    // STATE 4: EXHAUSTED (3-second pause, recharging energy)
    if (guard.aiMode === 'exhausted') {
        const exhaustedDuration = (Date.now() - guard.exhaustedStartTime) / 1000;
        
        // Recharge energy during pause
        guard.energy += GUARD_ENERGY_RECHARGE_RATE * (1/60);
        if (guard.energy > MAX_GUARD_ENERGY) guard.energy = MAX_GUARD_ENERGY;
        
        // Check if pause is over
        if (exhaustedDuration >= 3) {
            console.log(`Guard ${guardIndex + 1} finished resting.`);
            guard.isExhausted = false;
            
            // Check if player is still in hearing range
            if (canHear) {
                // Player is still audible - resume following
                console.log(`Guard ${guardIndex + 1} still hears player, resuming chase...`);
                guard.aiMode = 'following';
                guard.chasingStartTime = Date.now();
            } else {
                // Player escaped hearing range - return to last position
                console.log(`Guard ${guardIndex + 1} lost track of player, returning to patrol...`);
                guard.aiMode = 'returning';
                
                // Calculate path back to last patrol position (reverse the path taken)
                guard.returnPath = findPath(guard.x, guard.y, guard.lastPatrolPosition.x, guard.lastPatrolPosition.y);
                guard.currentReturnWaypoint = 0;
                
                if (guard.returnPath.length > 0) {
                    moveToReturnWaypoint(sceneReference, guard, guardIndex);
                } else {
                    // Direct path back
                    returnToPatrolPosition(sceneReference, guard, guardIndex);
                }
            }
        }
    }
    
    // STATE 5: RETURNING TO PATROL POSITION
    if (guard.aiMode === 'returning') {
        // Energy doesn't drain while returning
        
        // Check if reached destination
        if (guard.returnPath && guard.returnPath.length > 0) {
            const currentWaypoint = guard.returnPath[guard.currentReturnWaypoint];
            const distToWaypoint = Phaser.Math.Distance.Between(guard.x, guard.y, currentWaypoint.x, currentWaypoint.y);
            
            if (distToWaypoint < 20 && !guard.currentTween) {
                guard.currentReturnWaypoint++;
                
                if (guard.currentReturnWaypoint >= guard.returnPath.length) {
                    // Reached patrol position! Resume normal patrol
                    console.log(`Guard ${guardIndex + 1} returned to patrol route.`);
                    guard.aiMode = 'patrol';
                    guard.hasHeardPlayer = false;
                    guard.energy = MAX_GUARD_ENERGY;  // Full energy for next chase
                    
                    // Resume normal patrol movement
                    const guardIndex2 = guards.indexOf(guard);
                    moveToNextWaypoint(sceneReference, guard, guardIndex2);
                } else {
                    // Move to next return waypoint
                    moveToReturnWaypoint(sceneReference, guard, guardIndex);
                }
            }
        }
        
        // If we hear player again during return, switch back to navigating
        if (canHear) {
            console.log(`Guard ${guardIndex + 1} heard player again during return!`);
            guard.lastPatrolPosition = {x: guard.x, y: guard.y};
            guard.aiMode = 'navigating';
            guard.lastHeardPlayerX = player.x;
            guard.lastHeardPlayerY = player.y;
            guard.pathfindingWaypoints = findPath(guard.x, guard.y, player.x, player.y);
            guard.currentPathfindingWaypoint = 0;
            
            if (guard.currentTween) {
                guard.currentTween.stop();
                guard.currentTween = null;
            }
            
            moveToNextPathfindingWaypoint(sceneReference, guard, guardIndex);
        }
    }
}

// Move Level 3 guard to next A* pathfinding waypoint
function moveToNextPathfindingWaypoint(scene, guard, guardIndex) {
    if (!guard.pathfindingWaypoints || guard.pathfindingWaypoints.length === 0) return;
    if (guard.currentPathfindingWaypoint >= guard.pathfindingWaypoints.length) return;
    
    const waypoint = guard.pathfindingWaypoints[guard.currentPathfindingWaypoint];
    const distance = Phaser.Math.Distance.Between(guard.x, guard.y, waypoint.x, waypoint.y);
    const duration = (distance / guard.patrolSpeed) * 1000;
    
    guard.currentTween = scene.tweens.add({
        targets: guard,
        x: waypoint.x,
        y: waypoint.y,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
            guard.currentTween = null;
        }
    });
}

// Move Level 3 guard to next return waypoint (returning to patrol)
function moveToReturnWaypoint(scene, guard, guardIndex) {
    if (!guard.returnPath || guard.returnPath.length === 0) return;
    if (guard.currentReturnWaypoint >= guard.returnPath.length) return;
    
    const waypoint = guard.returnPath[guard.currentReturnWaypoint];
    const distance = Phaser.Math.Distance.Between(guard.x, guard.y, waypoint.x, waypoint.y);
    const duration = (distance / guard.patrolSpeed) * 1000;
    
    guard.currentTween = scene.tweens.add({
        targets: guard,
        x: waypoint.x,
        y: waypoint.y,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
            guard.currentTween = null;
        }
    });
}

// Direct return to patrol position (if A* fails)
function returnToPatrolPosition(scene, guard, guardIndex) {
    const distance = Phaser.Math.Distance.Between(guard.x, guard.y, guard.lastPatrolPosition.x, guard.lastPatrolPosition.y);
    const duration = (distance / guard.patrolSpeed) * 1000;
    
    guard.currentTween = scene.tweens.add({
        targets: guard,
        x: guard.lastPatrolPosition.x,
        y: guard.lastPatrolPosition.y,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
            guard.currentTween = null;
            
            // Back to patrol mode
            console.log(`Guard ${guardIndex + 1} returned to patrol route (direct path).`);
            guard.aiMode = 'patrol';
            guard.hasHeardPlayer = false;
            guard.energy = MAX_GUARD_ENERGY;
            
            const guardIndex2 = guards.indexOf(guard);
            moveToNextWaypoint(scene, guard, guardIndex2);
        }
    });
}

/**
 * LEVEL 3 PART 2 - CONNECTION PUZZLE FUNCTIONS
 */

// Update connection puzzle state
function updateConnectionPuzzle() {
    if (!player || !part2Active) return;
    
    // Check timer
    const elapsed = (Date.now() - part2TimerStart) / 1000;
    const remaining = part2TimeLimit - elapsed;
    
    // Update timer UI
    const timerEl = document.getElementById('part2-timer');
    if (timerEl) {
        timerEl.textContent = `TIME: ${Math.ceil(Math.max(0, remaining))}s`;
        if (remaining < 10) {
            timerEl.style.color = '#ff0000';
        }
    }
    
    // Check if time expired
    if (remaining <= 0) {
        console.log('💀 Part 2 FAILED! Time expired.');
        gameOver = true;
        
        if (footstepSound && footstepSound.isPlaying) {
            footstepSound.stop();
        }
        
        const gameOverText = sceneReference.add.text(
            player.x, player.y - 50,
            'TIME EXPIRED!',
            {
                fontSize: '32px',
                fill: '#ff0000',
                fontFamily: 'Courier New',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        gameOverText.setOrigin(0.5);
        
        sceneReference.time.delayedCall(1500, () => {
            restartGame();
        });
        return;
    }
    
    // Check proximity to connection points
    let nearestPoint = null;
    let nearestDistance = Infinity;
    
    connectionPoints.forEach(point => {
        if (!point.connected) {
            const distance = Phaser.Math.Distance.Between(player.x, player.y, point.x, point.y);
            if (distance <= 100 && distance < nearestDistance) {  // Increased from 50 to 100
                nearestDistance = distance;
                nearestPoint = point;
            }
        }
    });
    
    // Handle ENTER key or PS5 X button press for connection points
    if (nearestPoint && (Phaser.Input.Keyboard.JustDown(enterKey) || isPS5XButtonPressed())) {
        handleConnectionPointInteraction(nearestPoint);
    }
    
    // Check if all connections complete
    const completedCount = connections.filter(conn => conn.completed).length;
    const allComplete = connections.length > 0 && connections.every(conn => conn.completed);
    
    if (allComplete) {
        console.log(`✅ All ${completedCount}/${connections.length} connections complete! Part 2 finished!`);
        part2Active = false;
        
        // Hide Part 2 timer
        const timerEl = document.getElementById('part2-timer');
        if (timerEl) {
            timerEl.classList.remove('active');
        }
        
        // Level 3 orange doors NEVER show victory screen
        // Players can continue exploring or we can add more objectives here later
        console.log('✓ Level 3 Part 2 complete - No victory screen for orange doors');
    }
}

// Handle connection point interaction
function handleConnectionPointInteraction(point) {
    const connection = connections[point.pairIndex];
    
    if (!activeConnection) {
        // Starting a new connection from Point A
        if (point.isPointA) {
            console.log(`Starting connection ${point.pairIndex + 1} from Point A`);
            activeConnection = {
                pairIndex: point.pairIndex,
                startPoint: point
            };
            point.connected = true;
        } else {
            console.log('❌ Must start connection from Point A');
        }
    } else {
        // Completing a connection at Point B
        if (activeConnection.pairIndex === point.pairIndex && !point.isPointA) {
            console.log(`Completing connection ${point.pairIndex + 1} at Point B`);
            point.connected = true;
            connection.completed = true;
            
            // Clear active connection
            activeConnection = null;
            
            console.log(`✓ Connection ${point.pairIndex + 1} complete!`);
        } else if (activeConnection.pairIndex !== point.pairIndex) {
            console.log('❌ Wrong connection point! Must connect matching pairs.');
        } else {
            console.log('❌ Already started from Point A, connect to Point B.');
        }
    }
}

// Draw connection lines
function drawConnectionLines() {
    if (!connectionLineGraphics || !player) return;
    
    connectionLineGraphics.clear();
    
    // Draw completed connections (solid red lines)
    connections.forEach(connection => {
        if (connection.completed) {
            const pointA = connection.pointA;
            const pointB = connection.pointB;
            
            connectionLineGraphics.lineStyle(4, 0xff0000, 1);  // Red, solid
            connectionLineGraphics.beginPath();
            connectionLineGraphics.moveTo(pointA.x, pointA.y);
            connectionLineGraphics.lineTo(pointB.x, pointB.y);
            connectionLineGraphics.strokePath();
        }
    });
    
    // Draw active connection line (follows player)
    if (activeConnection) {
        const startPoint = activeConnection.startPoint;
        
        connectionLineGraphics.lineStyle(4, 0xff0000, 0.8);  // Red, slightly transparent
        connectionLineGraphics.beginPath();
        connectionLineGraphics.moveTo(startPoint.x, startPoint.y);
        connectionLineGraphics.lineTo(player.x, player.y);
        connectionLineGraphics.strokePath();
    }
}

/**
 * PS5 CONTROLLER HELPER FUNCTIONS
 * Separate control configuration alongside keyboard controls
 */

// Check if PS5 X button is pressed (button 0 - acts as Enter/Interact)
function isPS5XButtonPressed() {
    if (!gamepad || !gamepad.buttons[0]) return false;
    
    const currentState = gamepad.buttons[0].pressed;
    const wasPressed = !lastXButtonState && currentState;  // Rising edge detection
    lastXButtonState = currentState;
    
    return wasPressed;
}

// Check if PS5 R2 trigger is pressed (button 7 - acts as Sprint)
function isPS5R2Pressed() {
    if (!gamepad || !gamepad.buttons[7]) return false;
    
    // R2 trigger has analog value, treat > 0.5 as pressed
    return gamepad.buttons[7].value > 0.5;
}

// Get PS5 left stick movement (for player movement)
function getPS5LeftStick() {
    if (!gamepad) return { x: 0, y: 0 };
    
    // Left stick axes: 0 = horizontal, 1 = vertical
    // Phaser gamepad axes are accessed as array values, not objects with getValue()
    const x = gamepad.axes.length > 0 ? gamepad.axes[0].value : 0;
    const y = gamepad.axes.length > 1 ? gamepad.axes[1].value : 0;
    
    // Apply deadzone (ignore small drift)
    const deadzone = 0.15;
    const finalX = Math.abs(x) > deadzone ? x : 0;
    const finalY = Math.abs(y) > deadzone ? y : 0;
    
    return { x: finalX, y: finalY };
}

/**
 * UPDATE
 * Game loop - runs every frame
 */
function update() {
    // Safety check
    if (!player || !player.body || !cursors) {
        return;
    }
    
    // Reset player velocity
    player.setVelocity(0);
    
    // Track movement direction for facing angle
    let moveX = 0;
    let moveY = 0;
    
    // Determine if player should sprint
    // Clamp energy first to ensure it's never below 0
    if (sprintEnergy < 0) sprintEnergy = 0;
    
    // Check sprint input from keyboard OR PS5 controller R2
    const wantsToSprint = spaceKey.isDown || isPS5R2Pressed();
    const canSprint = sprintEnergy >= 5;  // Require at least 5 energy to sprint
    isSprinting = wantsToSprint && canSprint && !miniGameActive;
    
    // Set current speed based on sprint state
    const currentSpeed = isSprinting ? SPRINT_SPEED : NORMAL_SPEED;
    
    // Get PS5 controller input (separate from keyboard)
    const leftStick = getPS5LeftStick();
    
    // Check which keys are pressed and move accordingly (Arrow keys or WASD or PS5 Left Stick)
    if (cursors.left.isDown || cursors.a.isDown || leftStick.x < -0.1) {
        player.setVelocityX(-currentSpeed);
        moveX = -1;
    }
    else if (cursors.right.isDown || cursors.d.isDown || leftStick.x > 0.1) {
        player.setVelocityX(currentSpeed);
        moveX = 1;
    }
    
    if (cursors.up.isDown || cursors.w.isDown || leftStick.y < -0.1) {
        player.setVelocityY(-currentSpeed);
        moveY = -1;
    }
    else if (cursors.down.isDown || cursors.s.isDown || leftStick.y > 0.1) {
        player.setVelocityY(currentSpeed);
        moveY = 1;
    }
    
    // Normalize diagonal movement (keyboard or controller)
    const hasKeyboardInput = (cursors.left.isDown || cursors.right.isDown || cursors.a.isDown || cursors.d.isDown) && 
                            (cursors.up.isDown || cursors.down.isDown || cursors.w.isDown || cursors.s.isDown);
    const hasStickInput = (Math.abs(leftStick.x) > 0.1 && Math.abs(leftStick.y) > 0.1);
    
    if (hasKeyboardInput || hasStickInput) {
        player.body.velocity.normalize().scale(currentSpeed);
    }
    
    // Update player facing direction based on movement
    if (moveX !== 0 || moveY !== 0) {
        player.facingAngle = Math.atan2(moveY, moveX);
    }
    
    // Handle footstep sound based on movement
    const playerIsMoving = (moveX !== 0 || moveY !== 0);
    if (playerIsMoving && !isPlayerMoving && footstepSound) {
        // Ensure audio context is running
        if (sceneReference.sound.context && sceneReference.sound.context.state === 'suspended') {
            sceneReference.sound.context.resume();
        }
        
        // Player just started moving - play footsteps at full volume
        footstepSound.setVolume(0.3);
        footstepSound.play();
        isPlayerMoving = true;
    } else if (!playerIsMoving && isPlayerMoving && footstepSound && footstepSound.isPlaying) {
        // Player just stopped moving - fade out footsteps smoothly
        sceneReference.tweens.add({
            targets: footstepSound,
            volume: 0,
            duration: 200,  // Fade out over 200ms
            onComplete: () => {
                footstepSound.stop();
                footstepSound.setVolume(0.3);  // Reset volume for next time
            }
        });
        isPlayerMoving = false;
    }
    
    // Pixel-perfect collision detection - PREVENT movement into walls
    // Check pixels in a circle around the player
    const px = player.x;
    const py = player.y;
    const checkRadius = PLAYER_RADIUS;
    
    // Sample points around the player's circular edge  
    const numSamples = 24;  // More samples for better collision (was 16)
    let collisionDetected = false;
    let pushX = 0;
    let pushY = 0;
    
    for (let i = 0; i < numSamples; i++) {
        const angle = (i / numSamples) * Math.PI * 2;
        const checkX = px + Math.cos(angle) * checkRadius;
        const checkY = py + Math.sin(angle) * checkRadius;
        
        if (isWallPixel(checkX, checkY)) {
            collisionDetected = true;
            // Stronger push-back to counteract velocity
            const pushStrength = 8;  // Much stronger push
            pushX -= Math.cos(angle) * pushStrength;
            pushY -= Math.sin(angle) * pushStrength;
        }
    }
    
    // Apply push-back if collision detected
    if (collisionDetected) {
        player.x += pushX;
        player.y += pushY;
        
        // STOP all velocity immediately to prevent phase-through
        player.body.setVelocity(0, 0);
    }
    
    // Level 3: Path recording system (record every 50ms when active)
    if (currentLevel === 3 && isRecordingPath) {
        const currentTime = Date.now();
        if (!player.lastRecordTime || (currentTime - player.lastRecordTime) >= 50) {
            recordPlayerPosition();
            player.lastRecordTime = currentTime;
        }
    }
    
    // PHASE 4: Guard/Camera collision with walls and detection (skip if mini-game active)
    if (!gameOver && !miniGameActive && guards.length > 0) {
        for (let i = 0; i < guards.length; i++) {
            const guard = guards[i];
            const visionCone = visionCones[i];
            const isCamera = guard.isCamera === true;
            
            // Check guard collision with walls (skip for cameras - they're stationary)
            if (!isCamera) {
                const gx = guard.x;
                const gy = guard.y;
                const guardCheckRadius = GUARD_RADIUS;
                const numSamples = 24;  // More samples for better collision (was 16)
                let guardCollision = false;
                let guardPushX = 0;
                let guardPushY = 0;
                
                for (let j = 0; j < numSamples; j++) {
                    const angle = (j / numSamples) * Math.PI * 2;
                    const checkX = gx + Math.cos(angle) * guardCheckRadius;
                    const checkY = gy + Math.sin(angle) * guardCheckRadius;
                    
                    if (isWallPixel(checkX, checkY)) {
                        guardCollision = true;
                        guardPushX -= Math.cos(angle) * 8;  // Much stronger push (was 2)
                        guardPushY -= Math.sin(angle) * 8;
                    }
                }
                
                // Apply push-back if guard hit a wall
                if (guardCollision) {
                    guard.x += guardPushX;
                    guard.y += guardPushY;
                    
                    // Stop guard movement when hitting wall
                    if (guard.body) {
                        guard.body.setVelocity(0, 0);
                    }
                    
                    // Stop any active tweens to prevent phase-through
                    if (guard.currentTween) {
                        guard.currentTween.stop();
                        guard.currentTween = null;
                    }
                }
            }
            
            // Level 3: Special path-following AI (hearing only, no vision)
            if (guard.isLevel3) {
                updateLevel3GuardAI(guard, i);
                
                // Level 3 guards catch by proximity only (15px)
                const levelConfig = LEVEL_CONFIGS[currentLevel];
                const distanceToPlayer = Phaser.Math.Distance.Between(guard.x, guard.y, player.x, player.y);
                if (distanceToPlayer <= levelConfig.guardCatchRange) {
                    gameOver = true;
                    console.log('💀 CAUGHT BY LEVEL 3 GUARD! Restarting in 1 second...');
                    
                    if (footstepSound && footstepSound.isPlaying) {
                        footstepSound.stop();
                    }
                    
                    const gameOverText = sceneReference.add.text(
                        player.x, player.y - 50,
                        'CAUGHT!',
                        {
                            fontSize: '32px',
                            fill: '#ff0000',
                            fontFamily: 'Courier New',
                            stroke: '#000000',
                            strokeThickness: 4
                        }
                    );
                    gameOverText.setOrigin(0.5);
                    
                    sceneReference.time.delayedCall(1000, () => {
                        restartGame();
                    });
                    
                    break;  // Stop checking other guards
                }
                
                continue;  // Skip vision cone logic for Level 3
            }
            
            // Draw the vision cone (Levels 1 & 2 only)
            drawVisionCone(visionCone, guard);
            
            // Check if guard SEES the player (hearing only makes them turn, not catch)
            if (canSeePlayer(guard)) {
                gameOver = true;
                console.log('💀 CAUGHT! Restarting in 1 second...');
                console.log('Current level:', currentLevel);
                console.log('beepWarningSound exists:', !!beepWarningSound);
                console.log('heySound exists:', !!heySound);
                console.log('Audio context state:', sceneReference.sound.context ? sceneReference.sound.context.state : 'no context');
                
                // Stop footstep sound immediately
                if (footstepSound && footstepSound.isPlaying) {
                    footstepSound.stop();
                    console.log('Stopped footstep sound');
                }
                
                // Force audio context to resume and play sound
                const playSound = () => {
                    if (currentLevel === 1 && beepWarningSound) {
                        console.log('🔊 ATTEMPTING to play beep warning sound...');
                        beepWarningSound.setVolume(1.0);
                        const result = beepWarningSound.play();
                        console.log('Play result:', result);
                    } else if (currentLevel === 2 && heySound) {
                        console.log('🔊 ATTEMPTING to play hey sound...');
                        heySound.setVolume(1.0);
                        const result = heySound.play();
                        console.log('Play result:', result);
                    }
                };
                
                // Always try to resume audio context first
                if (sceneReference.sound.context) {
                    sceneReference.sound.context.resume().then(() => {
                        console.log('Audio context resumed successfully');
                        audioUnlocked = true;
                        playSound();
                    }).catch(err => {
                        console.error('Failed to resume audio context:', err);
                        playSound(); // Try anyway
                    });
                } else {
                    console.log('No audio context, playing directly');
                    playSound();
                }
                
                // Show game over message
                const gameOverText = sceneReference.add.text(
                    player.x, player.y - 50,
                    'CAUGHT!',
                    {
                        fontSize: '32px',
                        fill: '#ff0000',
                        fontFamily: 'Courier New',
                        stroke: '#000000',
                        strokeThickness: 4
                    }
                );
                gameOverText.setOrigin(0.5);
                
                // Restart after delay
                sceneReference.time.delayedCall(1000, () => {
                    restartGame();
                });
                
                break;  // Stop checking other guards
            }
        }
    }
    
    // PHASE 5: Document interaction
    checkDocumentProximity();
    
    // PHASE 5: Exit door interaction
    checkExitDoorProximity();
    
    // PHASE 6: Level 3 Part 2 - Connection Puzzle
    if (part2Active && !gameOver) {
        updateConnectionPuzzle();
        drawConnectionLines();
    }
    
    // Handle sprint energy management
    const isMoving = (moveX !== 0 || moveY !== 0);
    if (isSprinting && isMoving) {
        // Drain energy while sprinting
        sprintEnergy -= SPRINT_DRAIN_RATE * (1/60);  // Drain per frame (60fps)
        if (sprintEnergy < 0) sprintEnergy = 0;
    } else if (!isSprinting) {
        // Recharge energy when not sprinting
        sprintEnergy += SPRINT_RECHARGE_RATE * (1/60);  // Recharge per frame
        if (sprintEnergy > MAX_SPRINT_ENERGY) sprintEnergy = MAX_SPRINT_ENERGY;
    }
    
    // Draw energy bar below player
    drawEnergyBar();
    
    // Draw energy bars below Level 3 guards
    drawGuardEnergyBars();
    
    // Update visual indicator (Fortnite-style directional threats/objectives)
    drawVisualIndicator();
    
    // Update UI elements (mini-map, time, stats)
    updateUI();
    
    // Check PS5 controller input for mini-game
    checkPS5SliderInput();  // Slider timing (R2)
    checkPS5TypingInput();  // Typing phase (L1/R1)
    
    // Player visibility system disabled - using CSS vignette effect only
    // if (sceneReference && sceneReference.cameras && sceneReference.cameras.main) {
    //     drawPlayerVisibility(sceneReference.cameras.main);
    // }
}

/**
 * UI SYSTEM - Mini-map, Stats, Time Updates
 */

// Initialize the mini-map canvas
function initializeMiniMap() {
    miniMapCanvas = document.getElementById('mini-map-canvas');
    if (!miniMapCanvas) {
        console.error('Mini-map canvas not found!');
        return;
    }
    
    miniMapCtx = miniMapCanvas.getContext('2d');
    
    // Set mini-map to VERTICAL orientation (rotated 90 degrees) and fill the panel
    const mapAspectRatio = MAP_WIDTH / MAP_HEIGHT;  // ~1.41 (wider than tall)
    const panelWidth = 280;  // Panel width (full width)
    const panelHeight = 900; // Much larger height to fill panel
    
    // For vertical display, swap dimensions: height should be larger
    // Original map is 6315w x 4467h, when rotated becomes 4467w x 6315h
    const rotatedAspectRatio = MAP_HEIGHT / MAP_WIDTH;  // ~0.71 (taller than wide)
    
    // Fit to panel: use full height, calculate width from rotated aspect ratio
    miniMapCanvas.height = panelHeight;
    miniMapCanvas.width = panelHeight * rotatedAspectRatio;
    
    // Draw the map rotated 90 degrees clockwise
    if (collisionTexture) {
        miniMapCtx.save();
        // Translate to center, rotate, then draw
        miniMapCtx.translate(miniMapCanvas.width / 2, miniMapCanvas.height / 2);
        miniMapCtx.rotate(Math.PI / 2); // 90 degrees clockwise
        miniMapCtx.drawImage(collisionTexture, -miniMapCanvas.height / 2, -miniMapCanvas.width / 2, miniMapCanvas.height, miniMapCanvas.width);
        miniMapCtx.restore();
    }
    
    console.log('✓ Mini-map initialized (vertical):', miniMapCanvas.width, 'x', miniMapCanvas.height);
}

// Update mini-map with player position
function updateMiniMap() {
    if (!miniMapCanvas || !miniMapCtx || !player) return;
    
    // Clear canvas
    miniMapCtx.clearRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);
    
    // Redraw rotated map background
    if (collisionTexture) {
        miniMapCtx.save();
        miniMapCtx.translate(miniMapCanvas.width / 2, miniMapCanvas.height / 2);
        miniMapCtx.rotate(Math.PI / 2); // 90 degrees clockwise
        miniMapCtx.drawImage(collisionTexture, -miniMapCanvas.height / 2, -miniMapCanvas.width / 2, miniMapCanvas.height, miniMapCanvas.width);
        miniMapCtx.restore();
    }
    
    // Calculate player position on rotated mini-map
    // Normalize player position to 0-1 range
    const normalizedX = player.x / MAP_WIDTH;
    const normalizedY = player.y / MAP_HEIGHT;
    
    // For 90° clockwise rotation of the map:
    // The transformation is: (x,y) → (1-y, x)
    // This means: new_x = (1 - old_y), new_y = old_x
    const rotatedX = (1 - normalizedY) * miniMapCanvas.width;
    const rotatedY = normalizedX * miniMapCanvas.height;
    
    // Draw player dot (green)
    miniMapCtx.fillStyle = '#00FF00';
    miniMapCtx.beginPath();
    miniMapCtx.arc(rotatedX, rotatedY, 4, 0, Math.PI * 2);
    miniMapCtx.fill();
    
    // Draw white outline for visibility
    miniMapCtx.strokeStyle = '#FFFFFF';
    miniMapCtx.lineWidth = 2;
    miniMapCtx.beginPath();
    miniMapCtx.arc(rotatedX, rotatedY, 4, 0, Math.PI * 2);
    miniMapCtx.stroke();
}

// Update game time display
function updateGameTime() {
    const timeEl = document.getElementById('game-time');
    if (!timeEl || !gameStartTime) return;
    
    // Calculate elapsed time
    const elapsed = Date.now() - gameStartTime;
    const seconds = Math.floor(elapsed / 1000);
    
    // Start time: 3:38:12 AM, advance by elapsed seconds
    const startHour = 3;
    const startMinute = 38;
    const startSecond = 12;
    
    const totalSeconds = startHour * 3600 + startMinute * 60 + startSecond + seconds;
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const ampm = hours < 12 ? 'AM' : 'PM';
    const displayHour = hours % 12 || 12;
    
    timeEl.textContent = `${displayHour}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')} ${ampm}`;
}

// Update document counter
function updateDocumentCounter() {
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const docCountEl = document.getElementById('document-count');
    if (docCountEl) {
        docCountEl.textContent = `${documentsCollected}/${levelConfig.documentCount}`;
    }
}

// Update guard counter
function updateGuardCount() {
    const guardCountEl = document.getElementById('guard-count');
    if (guardCountEl) {
        guardCountEl.textContent = GUARD_COUNT;
    }
}

// Main UI update function (called every frame)
function updateUI() {
    updateMiniMap();
    updateGameTime();
}

// Typewriter effect for narrative box
function typewriterNarrative(text, speed = 50) {
    const narrativeEl = document.getElementById('narrative-text');
    if (!narrativeEl) return;
    
    narrativeEl.innerHTML = '';
    narrativeEl.classList.add('typing');
    
    let index = 0;
    const typeInterval = setInterval(() => {
        if (index < text.length) {
            narrativeEl.innerHTML += text.charAt(index);
            index++;
        } else {
            clearInterval(typeInterval);
            narrativeEl.classList.remove('typing');
        }
    }, speed);
}

/**
 * DOCUMENT INTERACTION SYSTEM
 */

// Check if player is near any uncollected documents
function checkDocumentProximity() {
    if (!player || documents.length === 0) return;
    
    nearestDocument = null;
    let nearestDistance = Infinity;
    
    // Check each document
    documents.forEach((doc, index) => {
        if (!doc.collected) {
            const distance = Phaser.Math.Distance.Between(player.x, player.y, doc.x, doc.y);
            
            // Check if within 5px range
            if (distance <= 50) {  // 50px range (5px was too small, user meant reasonable proximity)
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestDocument = {doc, index};
                }
            }
        }
    });
    
    // Update prompts visibility
    documentPrompts.forEach((prompt, index) => {
        if (nearestDocument && nearestDocument.index === index) {
            // Show prompt and stop blinking for nearest document
            prompt.setVisible(true);
            documents[index].clearTint();
            documents[index].setAlpha(1);  // Stop blinking by setting full opacity
        } else if (!documents[index].collected) {
            // Hide prompt and restore blinking for other documents
            prompt.setVisible(false);
            // Blinking is handled by the tween, so we don't need to do anything
        }
    });
    
    // Handle Enter key or PS5 X button press
    if (nearestDocument && (Phaser.Input.Keyboard.JustDown(enterKey) || isPS5XButtonPressed())) {
        startMiniGame(nearestDocument.index);
    }
}

// Start mini-game when player interacts with document
function startMiniGame(documentIndex) {
    console.log(`Starting mini-game for document ${documentIndex + 1}`);
    
    miniGameActive = true;
    miniGameStartTime = Date.now();
    
    // Stop footstep sound during mini-game
    if (footstepSound && footstepSound.isPlaying) {
        footstepSound.stop();
    }
    isPlayerMoving = false;
    
    // Create mini-game overlay
    createMiniGameOverlay(documentIndex);
}

// Collect a document
function collectDocument(documentIndex) {
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const doc = documents[documentIndex];
    const prompt = documentPrompts[documentIndex];
    
    // Mark as collected
    doc.collected = true;
    doc.setVisible(false);
    prompt.setVisible(false);
    
    documentsCollected++;
    console.log(`✓ Document ${documentIndex + 1} collected! (${documentsCollected}/${levelConfig.documentCount})`);
    
    // Update UI counter
    updateDocumentCounter();
    
    // Show narrative text (level-specific narratives)
    const narrativeTexts = {
        1: [
            "FILE ACCESSED: Classified server access logs. Backdoor installations on major tech platforms documented.",
            "FILE ACCESSED: International surveillance partnerships. Five Eyes intelligence sharing beyond legal limits.",
            "FILE ACCESSED: Encryption breaking capabilities. NSA maintains backdoors in commercial cryptography."
        ],
        2: [
            "FILE ACCESSED: Operation PRISM surveillance protocols. Congressional oversight bypassed. Mass data collection authorized without warrants.",
            "FILE ACCESSED: XKEYSCORE search system documentation. Real-time interception of internet activity. No prior authorization required.",
            "FILE ACCESSED: BOUNDLESS INFORMANT heat maps. Global surveillance statistics. They're watching everyone, everywhere."
        ],
        3: [
            "FILE ACCESSED: Advanced AI surveillance integration. Autonomous threat detection systems deployed without human oversight or legal framework.",
            "FILE ACCESSED: Quantum decryption prototypes. All current encryption standards compromised. Global communications fully transparent to agency.",
            "FILE ACCESSED: Executive authorization for unrestricted domestic surveillance. Constitutional protections suspended under classified directive."
        ]
    };
    
    const levelNarratives = narrativeTexts[currentLevel] || narrativeTexts[1];
    typewriterNarrative(levelNarratives[documentIndex]);
    
    // Check if all documents collected
    if (documentsCollected >= levelConfig.documentCount) {
        unlockExitDoor();
    }
}

// Unlock exit door when all documents collected
function unlockExitDoor() {
    if (exitDoor) {
        exitDoor.locked = false;
        exitDoor.setAlpha(1);  // Full opacity (stays blue, just brighter)
        exitDoor.clearTint();  // Remove any tint to show pure blue
        console.log('✓ Exit door UNLOCKED! All documents collected.');
        
        // Level 3: Change map to "open" version
        if (currentLevel === 3 && currentLevelPart === 1) {
            console.log('✓ Level 3: Swapping map to open version...');
            const levelConfig = LEVEL_CONFIGS[currentLevel];
            
            // Load and swap to the open map
            if (map && sceneReference) {
                map.setTexture(levelConfig.mapKey + 'Open');
                
                // Update collision data with new map
                const newCollisionTexture = sceneReference.textures.get(levelConfig.mapKey + 'Open').getSourceImage();
                const canvas = document.createElement('canvas');
                canvas.width = newCollisionTexture.width;
                canvas.height = newCollisionTexture.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(newCollisionTexture, 0, 0);
                collisionPixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                collisionTexture = newCollisionTexture;
                
                console.log('✓ Level 3: Map changed to open version (door removed)');
            }
        }
    }
}

/**
 * MINI-GAME SYSTEM - Typing Challenge with Timing Sliders
 */

// Classified text for each document (placeholder)
const CLASSIFIED_TEXTS = [
    "TOP SECRET//NOFORN: PRISM collection directly from servers of U.S. service providers. Congressional oversight bypassed. Mass surveillance authorized without individual warrants.",
    "TOP SECRET//COMINT: XKEYSCORE allows analysts to search without prior authorization. Real-time monitoring of emails, social media, browsing history worldwide.",
    "TOP SECRET//SI: BOUNDLESS INFORMANT metadata repository. Heat maps show global surveillance coverage. They are watching everyone, everywhere, all the time."
];

function createMiniGameOverlay(documentIndex) {
    // Create fullscreen overlay container
    miniGameContainer = document.createElement('div');
    miniGameContainer.id = 'minigame-overlay';
    miniGameContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.95);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Roboto Mono', monospace;
        color: #00FF00;
    `;
    
    // Initialize state
    miniGameState = {
        documentIndex: documentIndex,
        phase: 'typing',  // 'typing', 'slider1', 'slider2', 'complete'
        charsTyped: 0,
        targetText: CLASSIFIED_TEXTS[documentIndex],
        revealedText: '',
        sliderPosition: 0,
        sliderDirection: 1,
        checkpointHit: false
    };
    
    // Create typing area
    const typingArea = document.createElement('div');
    typingArea.id = 'typing-area';
    typingArea.style.cssText = `
        width: 80%;
        max-width: 800px;
        text-align: center;
    `;
    
    // Timer display
    const timerEl = document.createElement('div');
    timerEl.id = 'minigame-timer';
    timerEl.style.cssText = `
        font-size: 48px;
        margin-bottom: 30px;
        color: #00FF00;
    `;
    timerEl.textContent = MINIGAME_TIME_LIMIT;
    
    // Revealed text display
    const textDisplay = document.createElement('div');
    textDisplay.id = 'revealed-text';
    textDisplay.style.cssText = `
        font-size: 18px;
        line-height: 1.6;
        margin-bottom: 30px;
        min-height: 100px;
        border: 2px solid #00FF00;
        padding: 20px;
        text-align: left;
    `;
    
    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.id = 'typing-progress';
    progressBar.style.cssText = `
        width: 100%;
        height: 20px;
        border: 2px solid #00FF00;
        margin-bottom: 20px;
        position: relative;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.id = 'progress-fill';
    progressFill.style.cssText = `
        height: 100%;
        width: 0%;
        background-color: #00FF00;
        transition: width 0.1s;
    `;
    progressBar.appendChild(progressFill);
    
    // Instructions
    const instructions = document.createElement('div');
    instructions.id = 'minigame-instructions';
    instructions.style.cssText = `
        font-size: 16px;
        margin-top: 20px;
    `;
    instructions.textContent = 'TYPE ANY KEYS / PRESS L1+R1 TO DECRYPT FILE';
    
    // Append elements
    typingArea.appendChild(timerEl);
    typingArea.appendChild(textDisplay);
    typingArea.appendChild(progressBar);
    typingArea.appendChild(instructions);
    miniGameContainer.appendChild(typingArea);
    document.body.appendChild(miniGameContainer);
    
    // Start typing listener
    document.addEventListener('keydown', miniGameKeyHandler);
    
    // Start timer countdown
    updateMiniGameTimer();
}

// Handle typing in mini-game
function miniGameKeyHandler(e) {
    if (!miniGameActive || !miniGameState) return;
    
    if (miniGameState.phase === 'typing') {
        // Any key press counts as typing
        if (e.key.length === 1 || e.key === 'Space') {
            miniGameState.charsTyped++;
            
            // Reveal text progressively
            const progress = miniGameState.charsTyped / MINIGAME_CHARS_REQUIRED;
            const revealLength = Math.floor(miniGameState.targetText.length * progress);
            miniGameState.revealedText = miniGameState.targetText.substring(0, revealLength);
            
            // Update display
            document.getElementById('revealed-text').textContent = miniGameState.revealedText;
            
            // Update progress bar (cap at 50% for first checkpoint)
            let displayProgress = progress;
            if (!miniGameState.checkpoint1Hit && progress >= 0.5) {
                displayProgress = 0.5; // Stop at 50%
            }
            document.getElementById('progress-fill').style.width = (displayProgress * 100) + '%';
            
            // Check for checkpoints
            if (miniGameState.charsTyped >= MINIGAME_CHARS_REQUIRED * 0.5 && !miniGameState.checkpoint1Hit) {
                miniGameState.checkpoint1Hit = true;
                miniGameState.phase = 'checkpoint1'; // Pause typing
                
                // Show "AUTHENTICATION ERROR" message and wait 2 seconds before timing slider
                const typingArea = document.getElementById('typing-area');
                const errorMsg = document.createElement('div');
                errorMsg.style.cssText = `
                    font-size: 32px;
                    color: #FF0000;
                    margin-top: 20px;
                `;
                errorMsg.textContent = 'AUTHENTICATION ERROR';
                typingArea.appendChild(errorMsg);
                
                setTimeout(() => {
                    errorMsg.remove();
                    startTimingSlider(1);
                }, 2000);
            } else if (miniGameState.charsTyped >= MINIGAME_CHARS_REQUIRED && !miniGameState.checkpoint2Hit) {
                miniGameState.checkpoint2Hit = true;
                miniGameState.phase = 'checkpoint2'; // Pause typing
                
                // Show "AUTHENTICATION ERROR" message and wait 2 seconds before timing slider
                const typingArea = document.getElementById('typing-area');
                const errorMsg = document.createElement('div');
                errorMsg.style.cssText = `
                    font-size: 32px;
                    color: #FF0000;
                    margin-top: 20px;
                `;
                errorMsg.textContent = 'AUTHENTICATION ERROR';
                typingArea.appendChild(errorMsg);
                
                setTimeout(() => {
                    errorMsg.remove();
                    startTimingSlider(2);
                }, 2000);
            }
        }
    } else if (miniGameState.phase.startsWith('slider')) {
        // Space bar or Enter to hit timing (PS5 R2 is checked separately in update loop)
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            checkTimingHit();
        }
    }
}

// Check PS5 controller input during mini-game slider phase
// This is called from the main update loop
function checkPS5SliderInput() {
    if (!miniGameActive || !miniGameState) return;
    
    if (miniGameState.phase.startsWith('slider')) {
        // PS5 R2 trigger to hit timing (same as Space)
        if (isPS5R2Pressed()) {
            checkTimingHit();
        }
    }
}

// Check L1 and R1 button presses (button 4 = L1, button 5 = R1)
// Used for typing mini-game
let lastL1State = false;
let lastR1State = false;

function isPS5L1Pressed() {
    if (!gamepad || !gamepad.buttons[4]) return false;
    
    const currentState = gamepad.buttons[4].pressed;
    const wasPressed = !lastL1State && currentState;  // Rising edge detection
    lastL1State = currentState;
    
    return wasPressed;
}

function isPS5R1Pressed() {
    if (!gamepad || !gamepad.buttons[5]) return false;
    
    const currentState = gamepad.buttons[5].pressed;
    const wasPressed = !lastR1State && currentState;  // Rising edge detection
    lastR1State = currentState;
    
    return wasPressed;
}

// Check PS5 controller input during mini-game typing phase
// This is called from the main update loop
function checkPS5TypingInput() {
    if (!miniGameActive || !miniGameState) return;
    
    if (miniGameState.phase === 'typing') {
        // L1 or R1 button press counts as typing (same as keyboard)
        if (isPS5L1Pressed() || isPS5R1Pressed()) {
            miniGameState.charsTyped++;
            
            // Reveal text progressively
            const progress = miniGameState.charsTyped / MINIGAME_CHARS_REQUIRED;
            const revealLength = Math.floor(miniGameState.targetText.length * progress);
            miniGameState.revealedText = miniGameState.targetText.substring(0, revealLength);
            
            // Update display
            const revealedTextEl = document.getElementById('revealed-text');
            if (revealedTextEl) {
                revealedTextEl.textContent = miniGameState.revealedText;
            }
            
            // Update progress bar (cap at 50% for first checkpoint)
            let displayProgress = progress;
            if (!miniGameState.checkpoint1Hit && progress >= 0.5) {
                displayProgress = 0.5; // Stop at 50%
            }
            const progressFillEl = document.getElementById('progress-fill');
            if (progressFillEl) {
                progressFillEl.style.width = (displayProgress * 100) + '%';
            }
            
            // Check for checkpoints
            if (miniGameState.charsTyped >= MINIGAME_CHARS_REQUIRED * 0.5 && !miniGameState.checkpoint1Hit) {
                miniGameState.checkpoint1Hit = true;
                miniGameState.phase = 'checkpoint1'; // Pause typing
                
                // Show "AUTHENTICATION ERROR" message and wait 2 seconds before timing slider
                const typingArea = document.getElementById('typing-area');
                if (typingArea) {
                    const errorMsg = document.createElement('div');
                    errorMsg.style.cssText = `
                        font-size: 32px;
                        color: #FF0000;
                        margin-top: 20px;
                    `;
                    errorMsg.textContent = 'AUTHENTICATION ERROR';
                    typingArea.appendChild(errorMsg);
                    
                    setTimeout(() => {
                        errorMsg.remove();
                        startTimingSlider(1);
                    }, 2000);
                }
            } else if (miniGameState.charsTyped >= MINIGAME_CHARS_REQUIRED && !miniGameState.checkpoint2Hit) {
                miniGameState.checkpoint2Hit = true;
                miniGameState.phase = 'checkpoint2'; // Pause typing
                
                // Show "AUTHENTICATION ERROR" message and wait 2 seconds before timing slider
                const typingArea = document.getElementById('typing-area');
                if (typingArea) {
                    const errorMsg = document.createElement('div');
                    errorMsg.style.cssText = `
                        font-size: 32px;
                        color: #FF0000;
                        margin-top: 20px;
                    `;
                    errorMsg.textContent = 'AUTHENTICATION ERROR';
                    typingArea.appendChild(errorMsg);
                    
                    setTimeout(() => {
                        errorMsg.remove();
                        startTimingSlider(2);
                    }, 2000);
                }
            }
        }
    }
}

// Update timer display
function updateMiniGameTimer() {
    if (!miniGameActive || !miniGameStartTime) return;
    
    const elapsed = (Date.now() - miniGameStartTime) / 1000;
    const remaining = Math.max(0, MINIGAME_TIME_LIMIT - elapsed);
    
    const timerEl = document.getElementById('minigame-timer');
    if (timerEl) {
        timerEl.textContent = Math.ceil(remaining);
        
        // Red warning when low on time
        if (remaining < 5) {
            timerEl.style.color = '#FF0000';
        }
    }
    
    // Check if time expired
    if (remaining <= 0) {
        miniGameFailed();
        return;
    }
    
    // Continue countdown
    if (miniGameActive) {
        requestAnimationFrame(updateMiniGameTimer);
    }
}

// Start timing slider challenge
function startTimingSlider(checkpoint) {
    miniGameState.phase = `slider${checkpoint}`;
    miniGameState.sliderPosition = 0;
    miniGameState.sliderDirection = 1;
    
    // Update UI
    const typingArea = document.getElementById('typing-area');
    typingArea.innerHTML = '';
    
    const instructions = document.createElement('div');
    instructions.style.cssText = `font-size: 24px; margin-bottom: 30px;`;
    instructions.textContent = `CHECKPOINT ${checkpoint}/2 - HIT THE TARGET!`;
    
    // Slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.id = 'slider-container';
    sliderContainer.style.cssText = `
        width: 600px;
        height: 60px;
        border: 2px solid #00FF00;
        position: relative;
        margin: 20px auto;
    `;
    
    // Target zone (center)
    const targetZone = document.createElement('div');
    targetZone.id = 'target-zone';
    targetZone.style.cssText = `
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: ${TIMING_TOLERANCE * 2}px;
        height: 100%;
        background-color: rgba(0, 255, 0, 0.3);
    `;
    
    // Target dot
    const targetDot = document.createElement('div');
    targetDot.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 10px;
        height: 10px;
        background-color: #00FF00;
        border-radius: 50%;
    `;
    targetZone.appendChild(targetDot);
    
    // Slider bar
    const sliderBar = document.createElement('div');
    sliderBar.id = 'slider-bar';
    sliderBar.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        width: 4px;
        height: 100%;
        background-color: #00FF00;
    `;
    
    const pressPrompt = document.createElement('div');
    pressPrompt.style.cssText = `font-size: 18px; margin-top: 30px;`;
    pressPrompt.textContent = 'PRESS SPACE / R2 TO STOP';
    
    sliderContainer.appendChild(targetZone);
    sliderContainer.appendChild(sliderBar);
    typingArea.appendChild(instructions);
    typingArea.appendChild(sliderContainer);
    typingArea.appendChild(pressPrompt);
    
    // Animate slider
    animateSlider();
}

// Animate slider movement
function animateSlider() {
    if (miniGameState.phase.startsWith('slider')) {
        const sliderBar = document.getElementById('slider-bar');
        const container = document.getElementById('slider-container');
        
        if (sliderBar && container) {
            const containerWidth = 600;
            const speed = TIMING_SLIDER_SPEED / 60;  // Per frame at 60fps
            
            miniGameState.sliderPosition += speed * miniGameState.sliderDirection;
            
            // Bounce at edges
            if (miniGameState.sliderPosition >= containerWidth) {
                miniGameState.sliderPosition = containerWidth;
                miniGameState.sliderDirection = -1;
            } else if (miniGameState.sliderPosition <= 0) {
                miniGameState.sliderPosition = 0;
                miniGameState.sliderDirection = 1;
            }
            
            sliderBar.style.left = miniGameState.sliderPosition + 'px';
        }
        
        requestAnimationFrame(animateSlider);
    }
}

// Check if timing was hit correctly
function checkTimingHit() {
    const containerWidth = 600;
    const targetCenter = containerWidth / 2;
    const distance = Math.abs(miniGameState.sliderPosition - targetCenter);
    
    if (distance <= TIMING_TOLERANCE) {
        // Success!
        if (miniGameState.phase === 'slider1') {
            // Back to typing for second half
            miniGameState.phase = 'typing';
            miniGameState.checkpoint1Hit = true;
            returnToTyping();
        } else if (miniGameState.phase === 'slider2') {
            // Complete!
            miniGameComplete();
        }
    } else {
        // Missed - retry
        showTimingMiss();
    }
}

// Show miss message and retry
function showTimingMiss() {
    const typingArea = document.getElementById('typing-area');
    const missMsg = document.createElement('div');
    missMsg.style.cssText = `
        font-size: 24px;
        color: #FF0000;
        margin-top: 20px;
    `;
    missMsg.textContent = 'MISSED! TRY AGAIN';
    typingArea.appendChild(missMsg);
    
    setTimeout(() => {
        missMsg.remove();
        // Reset slider
        miniGameState.sliderPosition = 0;
        miniGameState.sliderDirection = 1;
    }, 500);
}

// Return to typing phase
function returnToTyping() {
    const typingArea = document.getElementById('typing-area');
    typingArea.innerHTML = '';
    
    const timerEl = document.createElement('div');
    timerEl.id = 'minigame-timer';
    timerEl.style.cssText = `font-size: 48px; margin-bottom: 30px; color: #00FF00;`;
    
    const textDisplay = document.createElement('div');
    textDisplay.id = 'revealed-text';
    textDisplay.style.cssText = `
        font-size: 18px;
        line-height: 1.6;
        margin-bottom: 30px;
        min-height: 100px;
        border: 2px solid #00FF00;
        padding: 20px;
        text-align: left;
    `;
    textDisplay.textContent = miniGameState.revealedText;
    
    const progressBar = document.createElement('div');
    progressBar.id = 'typing-progress';
    progressBar.style.cssText = `
        width: 100%;
        height: 20px;
        border: 2px solid #00FF00;
        margin-bottom: 20px;
        position: relative;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.id = 'progress-fill';
    const currentProgress = (miniGameState.charsTyped / MINIGAME_CHARS_REQUIRED) * 100;
    progressFill.style.cssText = `
        height: 100%;
        width: ${currentProgress}%;
        background-color: #00FF00;
        transition: width 0.1s;
    `;
    progressBar.appendChild(progressFill);
    
    const instructions = document.createElement('div');
    instructions.style.cssText = `font-size: 16px; margin-top: 20px;`;
    instructions.textContent = 'KEEP TYPING TO DECRYPT FILE';
    
    typingArea.appendChild(timerEl);
    typingArea.appendChild(textDisplay);
    typingArea.appendChild(progressBar);
    typingArea.appendChild(instructions);
}

// Mini-game complete - success!
function miniGameComplete() {
    document.removeEventListener('keydown', miniGameKeyHandler);
    
    // Store document index before clearing state
    const docIndex = miniGameState.documentIndex;
    
    // Show success message
    const typingArea = document.getElementById('typing-area');
    typingArea.innerHTML = `
        <div style="font-size: 64px; font-family: 'Serial', sans-serif; font-weight: 300; margin-bottom: 20px;">
            SUCCESS
        </div>
        <div style="font-size: 18px;">FILE DECRYPTED</div>
    `;
    
    setTimeout(() => {
        closeMiniGame();
        collectDocument(docIndex);
    }, 1500);
}

// Mini-game failed - time expired
function miniGameFailed() {
    miniGameActive = false;
    document.removeEventListener('keydown', miniGameKeyHandler);
    
    if (miniGameContainer) {
        miniGameContainer.remove();
        miniGameContainer = null;
    }
    
    // Trigger caught state
    gameOver = true;
    console.log('💀 FAILED HACK! Caught...');
    console.log('Current level:', currentLevel);
    console.log('beepWarningSound exists:', !!beepWarningSound);
    console.log('heySound exists:', !!heySound);
    
    // Stop footstep sound immediately
    if (footstepSound && footstepSound.isPlaying) {
        footstepSound.stop();
        console.log('Stopped footstep sound');
    }
    
    // Force audio context to resume and play sound
    const playSound = () => {
        if (currentLevel === 1 && beepWarningSound) {
            console.log('🔊 ATTEMPTING to play beep warning sound (mini-game failed)...');
            beepWarningSound.setVolume(1.0);
            const result = beepWarningSound.play();
            console.log('Play result:', result);
        } else if (currentLevel === 2 && heySound) {
            console.log('🔊 ATTEMPTING to play hey sound (mini-game failed)...');
            heySound.setVolume(1.0);
            const result = heySound.play();
            console.log('Play result:', result);
        }
    };
    
    // Always try to resume audio context first
    if (sceneReference.sound.context) {
        sceneReference.sound.context.resume().then(() => {
            console.log('Audio context resumed successfully');
            audioUnlocked = true;
            playSound();
        }).catch(err => {
            console.error('Failed to resume audio context:', err);
            playSound(); // Try anyway
        });
    } else {
        console.log('No audio context, playing directly');
        playSound();
    }
    
    const gameOverText = sceneReference.add.text(
        player.x, player.y - 50,
        'CAUGHT!',
        {
            fontSize: '32px',
            fill: '#ff0000',
            fontFamily: 'Courier New',
            stroke: '#000000',
            strokeThickness: 4
        }
    );
    gameOverText.setOrigin(0.5);
    
    sceneReference.time.delayedCall(1000, () => {
        restartGame();
    });
}

// Close mini-game overlay
function closeMiniGame() {
    miniGameActive = false;
    document.removeEventListener('keydown', miniGameKeyHandler);
    
    if (miniGameContainer) {
        miniGameContainer.remove();
        miniGameContainer = null;
    }
    
    miniGameState = null;
}

/**
 * EXIT DOOR & VICTORY SCREEN
 */

// Check if player is near unlocked exit door
function checkExitDoorProximity() {
    if (!player || !exitDoor || exitDoor.locked || gameOver) return;
    
    const distance = Phaser.Math.Distance.Between(player.x, player.y, exitDoor.x, exitDoor.y);
    
    // Level 3: NEVER trigger victory - orange doors don't complete the level
    if (currentLevel === 3) {
        // Part 1: Transition to Part 2 at 10px proximity
        if (currentLevelPart === 1 && distance <= 10) {
            console.log('✓ Level 3: Player passed through door, entering Part 2...');
            currentLevelPart = 2;
            
            // Orange indicator will be hidden automatically by drawVisualIndicator logic
            
            // Initialize Part 2 connection puzzle
            if (sceneReference) {
                initializeConnectionPuzzle(sceneReference);
            }
        }
        // Part 2 or any other state: Do nothing, no victory on Level 3
        return;  // Exit early - Level 3 NEVER shows victory screen
    }
    
    // Check if player is touching exit door (within 50px) - ONLY for Levels 1 & 2
    if (distance <= 60













































































































































































        
    ) {
        // Level complete!
        gameOver = true;  // Prevent multiple calls
        showVictoryScreen();
    }
}

// Show victory screen with stats
function showVictoryScreen() {
    gameOver = true;  // Stop game logic
    
    // Get current level config
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const nextLevel = currentLevel + 1;
    const hasNextLevel = LEVEL_CONFIGS[nextLevel] !== undefined;
    
    // Calculate stats
    const timeElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    const timeString = `${minutes}:${String(seconds).padStart(2, '0')}`;
    
    // Create victory overlay
    const victoryContainer = document.createElement('div');
    victoryContainer.id = 'victory-overlay';
    victoryContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.95);
        z-index: 2000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: 'Roboto Mono', monospace;
        color: #00FF00;
    `;
    
    // Victory title
    const title = document.createElement('div');
    title.style.cssText = `
        font-size: 96px;
        font-family: 'Serial', sans-serif;
        font-weight: 300;
        margin-bottom: 50px;
        color: #00FF00;
    `;
    title.textContent = 'ACCESSED';
    
    // Stats container
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
        font-size: 24px;
        margin-bottom: 50px;
        text-align: center;
        line-height: 2;
    `;
    
    statsContainer.innerHTML = `
        <div>TIME: ${timeString}</div>
        <div>DOCUMENTS COLLECTED: ${documentsCollected}/${levelConfig.documentCount}</div>
        <div>LEVEL: ${levelConfig.name}</div>
    `;
    
    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.textContent = hasNextLevel ? 'CONTINUE' : 'GAME COMPLETE';
    continueBtn.style.cssText = `
        background-color: transparent;
        color: #00FF00;
        border: 2px solid #00FF00;
        padding: 15px 40px;
        font-family: 'Roboto Mono', monospace;
        font-size: 20px;
        cursor: pointer;
        margin-top: 20px;
    `;
    
    continueBtn.addEventListener('mouseenter', () => {
        continueBtn.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
    });
    
    continueBtn.addEventListener('mouseleave', () => {
        continueBtn.style.backgroundColor = 'transparent';
    });
    
    continueBtn.addEventListener('click', () => {
        victoryContainer.remove();
        
        if (hasNextLevel) {
            // Load next level (will show loading screen automatically)
            loadLevel(nextLevel);
        } else {
            // Game complete - restart from Level 1
            currentLevel = 1;
            restartGame();
        }
    });
    
    victoryContainer.appendChild(title);
    victoryContainer.appendChild(statsContainer);
    victoryContainer.appendChild(continueBtn);
    document.body.appendChild(victoryContainer);
    
    console.log('✅ LEVEL COMPLETE! Victory screen shown.');
}

// Load a specific level (with loading screen)
function loadLevel(levelNum) {
    console.log(`Loading Level ${levelNum}...`);
    
    // Get level configuration for name
    const levelConfig = LEVEL_CONFIGS[levelNum];
    const levelName = levelConfig ? levelConfig.name : `Level ${levelNum}`;
    
    // Show loading screen first
    if (typeof showLevelIntro === 'function') {
        showLevelIntro(levelName, () => {
            // After loading screen completes, actually load the level
            loadLevelImmediate(levelNum);
        }, levelNum);  // Pass level number for background image
    } else {
        // Fallback if showLevelIntro not available
        loadLevelImmediate(levelNum);
    }
}

// Actually load the level (called after loading screen)
function loadLevelImmediate(levelNum) {
    console.log(`✓ Actually loading Level ${levelNum} now...`);
    
    // Update current level
    currentLevel = levelNum;
    currentLevelPart = 1;  // Reset to Part 1
    
    // Reset Level 3 path recording state
    isRecordingPath = false;
    playerPathRecording = [];
    pathRecordingStartTime = 0;
    
    // Reset game state
    documentsCollected = 0;
    sprintEnergy = MAX_SPRINT_ENERGY;
    isSprinting = false;
    
    // Stop footstep sound
    if (footstepSound && footstepSound.isPlaying) {
        footstepSound.stop();
    }
    isPlayerMoving = false;
    
    // Reset document counter
    updateDocumentCounter();
    
    // Reset narrative text
    const narrativeEl = document.getElementById('narrative-text');
    if (narrativeEl) {
        narrativeEl.textContent = 'Type populates this box after each objective is reached.';
    }
    
    // Clear all guards and vision cones
    guards.forEach(guard => guard.destroy());
    visionCones.forEach(cone => cone.destroy());
    guards = [];
    visionCones = [];
    
    // Clear documents
    documents.forEach(doc => doc.destroy());
    documentPrompts.forEach(prompt => prompt.destroy());
    documents = [];
    documentPrompts = [];
    
    // Destroy exit door
    if (exitDoor) {
        exitDoor.destroy();
        exitDoor = null;
    }
    
    // Restart the scene (which will now load the new level)
    sceneReference.scene.restart();
    
    // Reset game start time for new level
    gameStartTime = Date.now();
}