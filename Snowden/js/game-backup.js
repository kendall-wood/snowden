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
let guards = [];  // Array to store all guard objects
let visionCones = [];  // Array to store vision cone graphics
let gameOver = false;  // Track if player was caught
let sceneReference;  // Store scene reference for restart
let darknessOverlay;  // Full darkness overlay with player visibility cutout
let visualIndicator;  // Visual sound/objective indicator (Fortnite-style)

// UI variables
let miniMapCanvas;  // Canvas for mini-map
let miniMapCtx;     // Context for mini-map
let gameStartTime;  // Track when game started for time display
let documentsCollected = 0;  // Track collected documents

// Audio variables
let footstepSound;  // Footstep sound effect
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

// Document and exit positions for Level 1
const DOCUMENT_POSITIONS = [
    {x: 2523, y: 2976},  // Document 1
    {x: 4810, y: 3732},  // Document 2
    {x: 3710, y: 1564}   // Document 3
];

const EXIT_POSITION = {x: 1441, y: 1216};  // Exit door

// Document variables
let documents = [];  // Array of document sprites
let documentPrompts = [];  // Array of "Press Enter" text objects
let exitDoor = null;  // Exit door sprite
let nearestDocument = null;  // Track which document player is near
let enterKey;  // Enter key input

// Mini-game constants (adjustable)
const MINIGAME_TIME_LIMIT = 20;  // Seconds to complete typing challenge
const MINIGAME_CHARS_REQUIRED = 100;  // Number of characters to type (adjustable)
const TIMING_SLIDER_SPEED = 300;  // Pixels per second (fast but doable)
const TIMING_TOLERANCE = 15;  // Tolerance zone for timing (pixels)

// Mini-game variables
let miniGameActive = false;
let miniGameContainer = null;  // HTML overlay container
let miniGameState = null;  // Current mini-game state
let miniGameStartTime = null;
let typingInterval = null;
let sliderInterval = null;

// Player constants
const PLAYER_SPEED = 100;  // Reduced by 50%
const MAP_WIDTH = 6315;   // PNG width
const MAP_HEIGHT = 4467;  // PNG height
const PLAYER_RADIUS = 20.5; // Match the blue dot in SVG
const PLAYER_START_X = 2953; // Blue dot position
const PLAYER_START_Y = 2361; // Blue dot position
const PLAYER_VISIBILITY_RANGE = 300;  // How far player can see (adjust for more/less visibility)
const PLAYER_VISION_ANGLE = 90;  // Vision cone angle in degrees (wider = see more)

// Guard constants (easy to modify!)
const GUARD_COUNT = 6;  // 2 guards per path (6 paths × 2)
const GUARD_RADIUS = 20.5;  // Same size as player
const GUARD_SPEED = 60;  // Reduced by 50%
const VISION_RANGE = PLAYER_RADIUS * 12;  // How far guards can see (~205 pixels) - dramatically increased!
const VISION_ANGLE = 35;  // Vision cone angle in degrees
const HEARING_RANGE = 225;  // How close player must be to be heard
const PAUSE_CHANCE = 0.3;  // 30% chance to pause at each waypoint
const PAUSE_DURATION = 3000;  // 3 seconds pause in milliseconds
const LOOK_AROUND_SPEED_MIN = 0.003;  // Minimum rotation speed (very slow)
const LOOK_AROUND_SPEED_MAX = 0.008;  // Maximum rotation speed (still slow)
const LOOK_AROUND_ANGLE_RIGHT = Math.PI / 3;  // How far right guards look (72 degrees)
const LOOK_AROUND_ANGLE_LEFT = Math.PI / 3;  // How far left guards look (72 degrees)
const LOOK_AROUND_ANGLE_PAUSED = Math.PI * 2;  // Full 360° rotation when paused

// Predefined patrol paths from LVL1-coppaths.png
const PATROL_PATHS = [
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
];

/**
 * PRELOAD
 * Loads all assets before the game starts
 */
function preload() {
    console.log('Preload: Loading map...');
    
    // Load the PNG for both display and collision detection
    this.load.image('collisionMap', 'assets/lvl-1-map.png');
    
    // Load player sprite (Snowdy character)
    this.load.image('playerSprite', 'assets/snowdy.png');
    
    // Load guard sprite (cop image)
    this.load.image('guardSprite', 'assets/coppng.png');
    
    // Load footstep sound
    this.load.audio('footsteps', 'assets/Footstep sound effects (walking sound effect).mp3');
    
    // Add error handler
    this.load.on('loaderror', function(file) {
        console.error('Error loading file:', file.key, file.src);
    });
    
    this.load.on('complete', function() {
        console.log('✓ Map loaded successfully');
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
    console.log('Create: Setting up PNG collision map...');
    
    // Store scene reference for restart functionality
    sceneReference = this;
    const scene = this;
    
    // Reset game over state
    gameOver = false;
    
    // Set world bounds to match the PNG size
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    
    // Load the PNG map
    map = this.add.image(0, 0, 'collisionMap');
    map.setOrigin(0, 0);
    
    console.log('✓ PNG map loaded');
    console.log('Map dimensions:', map.width, 'x', map.height);
    
    // Get the texture and cache pixel data for fast collision checks
    collisionTexture = this.textures.get('collisionMap').getSourceImage();
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
    
    // Spawn guards
    spawnGuards(this);
    
    // Create document sprites (placeholder - green rectangles slightly smaller than player)
    createDocuments(this);
    
    // Create exit door sprite (orange rectangle, locked initially)
    createExitDoor(this);
    
    // Set up Enter key for document interaction
    enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    
    // Set up Spacebar for sprinting
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Create energy bar graphic (rendered below player)
    energyBar = this.add.graphics();
    energyBar.setDepth(10);  // Above player
    
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
    
    console.log('✓ UI Grid System initialized with mini-map and stats!');
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

// Spawn all guards with predefined patrol paths (2 per path)
function spawnGuards(scene) {
    guards = [];  // Reset guards array
    visionCones = [];  // Reset vision cones array
    
    // Skip spawning if GUARD_COUNT is 0 (for debugging)
    if (GUARD_COUNT === 0) {
        console.log('⚠️ No guards spawned (GUARD_COUNT = 0 for debugging)');
        return;
    }
    
    console.log(`Spawning ${GUARD_COUNT} guards (2 per path) with predefined patrol paths...`);
    
    // For each of the 6 patrol paths, create 2 guards
    const guardSize = GUARD_RADIUS * 2;  // 41 pixels - guard sprite size
    
    for (let pathIndex = 0; pathIndex < PATROL_PATHS.length; pathIndex++) {
        const patrolPath = PATROL_PATHS[pathIndex];
        
        // Guard 1: Starts at beginning of path (index 0), moves forward
        const guard1StartPos = patrolPath[0];
        const guard1 = scene.physics.add.sprite(guard1StartPos.x, guard1StartPos.y, 'guardSprite');
        
        // Scale cop sprite to match guard size
        guard1.setDisplaySize(guardSize, guardSize);
        
        guard1.body.setCircle(GUARD_RADIUS);
        guard1.body.offset.set(0, 0);
        
        const visionCone1 = scene.add.graphics();
        visionCone1.setDepth(-1);
        
        guard1.patrolPath = patrolPath;
        guard1.currentWaypoint = 0;
        guard1.patrolSpeed = GUARD_SPEED;
        guard1.patrolDirection = 1;  // Moving forward
        guard1.isPaused = false;  // Track if guard is paused
        
        // Initialize base angle to face first waypoint (direction of travel)
        const nextWaypoint1 = patrolPath[1] || patrolPath[0];
        guard1.baseAngle = Phaser.Math.Angle.Between(guard1StartPos.x, guard1StartPos.y, nextWaypoint1.x, nextWaypoint1.y);
        
        guard1.lookAngle = 0;  // Current looking direction offset
        guard1.lookDirection = 1;  // 1 = looking right, -1 = looking left
        guard1.lookSpeed = Phaser.Math.FloatBetween(LOOK_AROUND_SPEED_MIN, LOOK_AROUND_SPEED_MAX);  // Random rotation speed
        guard1.hasRedirected = false;  // Track if guard has redirected due to hearing
        guard1.currentTween = null;  // Store current movement tween
        
        guards.push(guard1);
        visionCones.push(visionCone1);
        moveToNextWaypoint(scene, guard1, guards.length - 1);
        
        console.log(`✓ Guard ${guards.length} (Path ${pathIndex + 1}A) spawned at START (${guard1StartPos.x}, ${guard1StartPos.y})`);
        
        // Guard 2: Starts at end of path (last index), moves backward
        const guard2StartPos = patrolPath[patrolPath.length - 1];
        const guard2 = scene.physics.add.sprite(guard2StartPos.x, guard2StartPos.y, 'guardSprite');
        
        // Scale cop sprite to match guard size
        guard2.setDisplaySize(guardSize, guardSize);
        
        guard2.body.setCircle(GUARD_RADIUS);
        guard2.body.offset.set(0, 0);
        
        const visionCone2 = scene.add.graphics();
        visionCone2.setDepth(-1);
        
        guard2.patrolPath = patrolPath;
        guard2.currentWaypoint = patrolPath.length - 1;
        guard2.patrolSpeed = GUARD_SPEED;
        guard2.patrolDirection = -1;  // Moving backward
        guard2.isPaused = false;  // Track if guard is paused
        
        // Initialize base angle to face previous waypoint (direction of travel)
        const prevWaypoint2 = patrolPath[patrolPath.length - 2] || patrolPath[patrolPath.length - 1];
        guard2.baseAngle = Phaser.Math.Angle.Between(guard2StartPos.x, guard2StartPos.y, prevWaypoint2.x, prevWaypoint2.y);
        
        guard2.lookAngle = 0;  // Current looking direction offset
        guard2.lookDirection = 1;  // 1 = looking right, -1 = looking left
        guard2.lookSpeed = Phaser.Math.FloatBetween(LOOK_AROUND_SPEED_MIN, LOOK_AROUND_SPEED_MAX);  // Random rotation speed
        guard2.hasRedirected = false;  // Track if guard has redirected due to hearing
        guard2.currentTween = null;  // Store current movement tween
        
        guards.push(guard2);
        visionCones.push(visionCone2);
        moveToNextWaypoint(scene, guard2, guards.length - 1);
        
        console.log(`✓ Guard ${guards.length} (Path ${pathIndex + 1}B) spawned at END (${guard2StartPos.x}, ${guard2StartPos.y})`);
    }
    
    console.log(`✓ All ${guards.length} guards spawned (2 per path, starting at opposite ends)`);
}

// Create document collectibles
function createDocuments(scene) {
    documents = [];  // Reset documents array
    documentPrompts = [];  // Reset prompts array
    
    // Document size (slightly smaller than player: 30px instead of 41px)
    const docSize = 30;
    
    // Create document graphic (green rectangle placeholder)
    const docGraphics = scene.add.graphics();
    docGraphics.fillStyle(0x00ff00, 1);  // Green color
    docGraphics.fillRect(0, 0, docSize, docSize);
    docGraphics.generateTexture('document', docSize, docSize);
    docGraphics.destroy();
    
    // Spawn documents at predefined positions
    DOCUMENT_POSITIONS.forEach((pos, index) => {
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
        const prompt = scene.add.text(pos.x, pos.y - 40, 'Press ENTER', {
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
    const doorSize = 35;
    
    // Create exit door graphic (blue rectangle, locked initially)
    const doorGraphics = scene.add.graphics();
    doorGraphics.fillStyle(0x0099ff, 1);  // Blue color
    doorGraphics.fillRect(0, 0, doorSize, doorSize);
    doorGraphics.generateTexture('exitDoor', doorSize, doorSize);
    doorGraphics.destroy();
    
    // Spawn exit door
    exitDoor = scene.add.sprite(EXIT_POSITION.x, EXIT_POSITION.y, 'exitDoor');
    exitDoor.setOrigin(0.5);
    exitDoor.locked = true;  // Locked until all documents collected
    exitDoor.setAlpha(0.5);  // Dimmed when locked
    
    console.log('✓ Exit door spawned (locked until all documents collected)');
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

// Draw vision cone for a guard (with rotating look-around behavior)
function drawVisionCone(visionCone, guard) {
    visionCone.clear();
    
    // Calculate base direction from movement (direction they're walking)
    const angle = Phaser.Math.Angle.Between(
        guard.body.prev.x, guard.body.prev.y,
        guard.x, guard.y
    );
    
    // Always update base angle when moving - this is the direction they're heading
    if (guard.body.speed > 0.1) {
        guard.baseAngle = angle;
    }
    
    // Check if player is within hearing range
    const distanceToPlayer = Phaser.Math.Distance.Between(guard.x, guard.y, player.x, player.y);
    const canHear = distanceToPlayer <= HEARING_RANGE;
    
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
        // Reset redirection flag when player leaves hearing range
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
        
        // Determine rotation limits based on whether guard is paused
        let maxLookAngleRight, maxLookAngleLeft;
        
        if (guard.isPaused) {
            // When paused, look full 360°
            maxLookAngleRight = LOOK_AROUND_ANGLE_PAUSED;
            maxLookAngleLeft = LOOK_AROUND_ANGLE_PAUSED;
        } else {
            // When moving, look left and right from their walking direction
            maxLookAngleRight = LOOK_AROUND_ANGLE_RIGHT;
            maxLookAngleLeft = LOOK_AROUND_ANGLE_LEFT;
        }
        
        // Oscillate the look angle (guards look left and right from walking direction)
        // Use the guard's unique random rotation speed
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
    
    // Draw vision cone with wall clipping using raycasting
    const halfAngle = (VISION_ANGLE / 2) * (Math.PI / 180);
    
    // Cast multiple rays across the vision cone to find wall intersections
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

// Check if guard can see the player
function canSeePlayer(guard) {
    const distance = Phaser.Math.Distance.Between(guard.x, guard.y, player.x, player.y);
    
    // First check: Is player in range?
    if (distance > VISION_RANGE) return false;
    
    // Second check: Is player in the vision cone angle?
    const angleToPlayer = Phaser.Math.Angle.Between(guard.x, guard.y, player.x, player.y);
    const guardFacing = guard.baseAngle + guard.lookAngle;  // Use the same angle as vision cone
    const halfAngle = (VISION_ANGLE / 2) * (Math.PI / 180);
    
    let angleDiff = angleToPlayer - guardFacing;
    // Normalize angle difference to -PI to PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    if (Math.abs(angleDiff) > halfAngle) return false;
    
    // Third check: Is there a wall blocking line of sight?
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
    
    // Blue wedge for exit door (when all documents collected) - always visible
    if (exitDoor && !exitDoor.locked) {
        const angleToExit = Phaser.Math.Angle.Between(player.x, player.y, exitDoor.x, exitDoor.y);
        const arcWidth = 40;
        const arcStart = angleToExit - (arcWidth * Math.PI / 180) / 2;
        const arcEnd = angleToExit + (arcWidth * Math.PI / 180) / 2;
        
        visualIndicator.fillStyle(0x0099ff, 0.8);  // Blue
        visualIndicator.beginPath();
        visualIndicator.arc(indicatorX, indicatorY, ringRadius, arcStart, arcEnd, false);
        visualIndicator.lineTo(indicatorX, indicatorY);
        visualIndicator.closePath();
        visualIndicator.fillPath();
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
    
    const wantsToSprint = spaceKey.isDown;
    const canSprint = sprintEnergy >= 5;  // Require at least 5 energy to sprint
    isSprinting = wantsToSprint && canSprint && !miniGameActive;
    
    // Set current speed based on sprint state
    const currentSpeed = isSprinting ? SPRINT_SPEED : NORMAL_SPEED;
    
    // Check which keys are pressed and move accordingly (Arrow keys or WASD)
    if (cursors.left.isDown || cursors.a.isDown) {
        player.setVelocityX(-currentSpeed);
        moveX = -1;
    }
    else if (cursors.right.isDown || cursors.d.isDown) {
        player.setVelocityX(currentSpeed);
        moveX = 1;
    }
    
    if (cursors.up.isDown || cursors.w.isDown) {
        player.setVelocityY(-currentSpeed);
        moveY = -1;
    }
    else if (cursors.down.isDown || cursors.s.isDown) {
        player.setVelocityY(currentSpeed);
        moveY = 1;
    }
    
    // Normalize diagonal movement
    if ((cursors.left.isDown || cursors.right.isDown || cursors.a.isDown || cursors.d.isDown) && 
        (cursors.up.isDown || cursors.down.isDown || cursors.w.isDown || cursors.s.isDown)) {
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
    
    // Pixel-perfect collision detection
    // Check pixels in a circle around the player
    const px = player.x;
    const py = player.y;
    const checkRadius = PLAYER_RADIUS;
    
    // Sample points around the player's circular edge
    const numSamples = 16;  // Check 16 points around the circle
    let collisionDetected = false;
    let pushX = 0;
    let pushY = 0;
    
    for (let i = 0; i < numSamples; i++) {
        const angle = (i / numSamples) * Math.PI * 2;
        const checkX = px + Math.cos(angle) * checkRadius;
        const checkY = py + Math.sin(angle) * checkRadius;
        
        if (isWallPixel(checkX, checkY)) {
            collisionDetected = true;
            // Push away from the collision point
            pushX -= Math.cos(angle) * 2;
            pushY -= Math.sin(angle) * 2;
        }
    }
    
    // Apply push-back if collision detected
    if (collisionDetected) {
        player.x += pushX;
        player.y += pushY;
    }
    
    // PHASE 4: Guard collision with walls and detection (skip if mini-game active)
    if (!gameOver && !miniGameActive && guards.length > 0) {
        for (let i = 0; i < guards.length; i++) {
            const guard = guards[i];
            const visionCone = visionCones[i];
            
            // Check guard collision with walls (same as player)
            const gx = guard.x;
            const gy = guard.y;
            const guardCheckRadius = GUARD_RADIUS;
            const numSamples = 16;
            let guardCollision = false;
            let guardPushX = 0;
            let guardPushY = 0;
            
            for (let j = 0; j < numSamples; j++) {
                const angle = (j / numSamples) * Math.PI * 2;
                const checkX = gx + Math.cos(angle) * guardCheckRadius;
                const checkY = gy + Math.sin(angle) * guardCheckRadius;
                
                if (isWallPixel(checkX, checkY)) {
                    guardCollision = true;
                    guardPushX -= Math.cos(angle) * 2;
                    guardPushY -= Math.sin(angle) * 2;
                }
            }
            
            // Apply push-back if guard hit a wall
            if (guardCollision) {
                guard.x += guardPushX;
                guard.y += guardPushY;
            }
            
            // Draw the vision cone
            drawVisionCone(visionCone, guard);
            
            // Check if guard SEES the player (hearing only makes them turn, not catch)
            if (canSeePlayer(guard)) {
                gameOver = true;
                console.log('💀 CAUGHT! Restarting in 1 second...');
                
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
    
    // Update visual indicator (Fortnite-style directional threats/objectives)
    drawVisualIndicator();
    
    // Update UI elements (mini-map, time, stats)
    updateUI();
    
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
    const docCountEl = document.getElementById('document-count');
    if (docCountEl) {
        docCountEl.textContent = `${documentsCollected}/3`;
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
    
    // Handle Enter key press
    if (nearestDocument && Phaser.Input.Keyboard.JustDown(enterKey)) {
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
    const doc = documents[documentIndex];
    const prompt = documentPrompts[documentIndex];
    
    // Mark as collected
    doc.collected = true;
    doc.setVisible(false);
    prompt.setVisible(false);
    
    documentsCollected++;
    console.log(`✓ Document ${documentIndex + 1} collected! (${documentsCollected}/3)`);
    
    // Update UI counter
    updateDocumentCounter();
    
    // Show narrative text
    const narrativeTexts = [
        "FILE ACCESSED: Operation PRISM surveillance protocols. Congressional oversight bypassed. Mass data collection authorized without warrants.",
        "FILE ACCESSED: XKEYSCORE search system documentation. Real-time interception of internet activity. No prior authorization required.",
        "FILE ACCESSED: BOUNDLESS INFORMANT heat maps. Global surveillance statistics. They're watching everyone, everywhere."
    ];
    
    typewriterNarrative(narrativeTexts[documentIndex]);
    
    // Check if all documents collected
    if (documentsCollected >= 3) {
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
    instructions.textContent = 'TYPE ANY KEYS TO DECRYPT FILE';
    
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
        // Space bar to hit timing
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            checkTimingHit();
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
    pressPrompt.textContent = 'PRESS SPACE TO STOP';
    
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
    
    // Check if player is touching exit door (within 50px)
    if (distance <= 50) {
        // Level complete!
        gameOver = true;  // Prevent multiple calls
        showVictoryScreen();
    }
}

// Show victory screen with stats
function showVictoryScreen() {
    gameOver = true;  // Stop game logic
    
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
        <div>DOCUMENTS COLLECTED: 3/3</div>
        <div>LEVEL: Floor 1 - Lobby and Conference</div>
    `;
    
    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.textContent = 'CONTINUE';
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
        // TODO: Load Level 2 when Phase 7 is complete
        // For now, restart Level 1
        restartGame();
    });
    
    victoryContainer.appendChild(title);
    victoryContainer.appendChild(statsContainer);
    victoryContainer.appendChild(continueBtn);
    document.body.appendChild(victoryContainer);
    
    console.log('✅ LEVEL COMPLETE! Victory screen shown.');
}