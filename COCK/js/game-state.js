export class GameState {
    constructor(game) {
        this.game = game;
        
        // Game phase variables
        this.currentPhase = game.PHASES.CHARGE;
        this.chargePower = 0;
        this.maxChargePower = 10000;
        this.chargeTimer = 30;
        this.chargeInterval = null;
        this.flightDistance = 0;
        this.flightSpeed = 0;
        this.flightHeight = 0;
        this.isFlying = false;
        
        // Currency and progression
        this.sausageCoins = 0;
        this.meatTokens = 0;
        this.sausageDNA = 0;
        this.goonPoints = 0;
        this.distance = 0;
        this.bestDistance = 0; // Track best single flight distance
        this.goalDistance = 10000; // The goal is now to reach 10,000m in a single flight
        
        // Click-related variables
        this.clicks = 0;
        this.animationSpeed = 1;
        this.sausageAngle = 0;
        this.isExploding = false;
        this.explosionSize = 0;
        this.explosionAlpha = 1;
        
        // Visual effects
        this.flyingSausages = [];
        this.flyingClouds = [];
        
        // Game objects
        this.character = {
            x: 100,
            y: 100,
            width: 100,
            height: 200,
            color: '#800000'
        };
        
        this.sausage = {
            x: 250,
            y: 150,
            width: 150,
            height: 40,
            color: '#FF0000',
            size: 1  // Size factor
        };
        
        // Obstacles for flight phase
        this.obstacles = [];
    }
    
    initialize() {
        console.log('Initializing game state');
        
        // Initialize any state variables that need default values
        this.sausageCoins = 0;
        this.meatTokens = 0;
        this.sausageDNA = 0;
        this.goonPoints = 0;
        this.distance = 0;
        this.chargePower = 0;
        this.clicks = 0;
        
        // Reset flight distance multiplier
        this.flightDistanceMultiplier = 1;
        
        // Get canvas dimensions
        const canvasWidth = this.game.canvas.width;
        const canvasHeight = this.game.canvas.height;
        
        // Adjust character size based on canvas dimensions
        this.character.width = Math.max(100, canvasWidth * 0.1);
        this.character.height = Math.max(200, canvasHeight * 0.3);
        
        // Set character and sausage initial positions
        this.character.x = canvasWidth * 0.2;
        this.character.y = canvasHeight * 0.6;
        
        // Scale sausage size based on character size
        this.sausage.width = this.character.width * 1.5;
        this.sausage.height = this.character.height * 0.15;
        
        // Position sausage based on character position (will be updated in render)
        this.updateSausagePosition();
        
        // Update UI with initial values
        this.updateCurrency('sausageCoins');
        this.updateCurrency('meatTokens');
        this.updateCurrency('sausageDNA');
        this.updateCurrency('goonPoints');
        this.updateProgress();
    }
    
    updateCurrency(type) {
        switch(type) {
            case 'sausageCoins':
                this.game.ui.elements.sausageCoins.textContent = this.sausageCoins;
                break;
            case 'meatTokens':
                this.game.ui.elements.meatTokens.textContent = this.meatTokens;
                break;
            case 'sausageDNA':
                this.game.ui.elements.sausageDNA.textContent = this.sausageDNA;
                break;
            case 'goonPoints':
                this.game.ui.elements.goonPoints.textContent = this.goonPoints;
                break;
        }
    }
    
    updateProgress() {
        // Update the distance display with current flight distance
        this.game.ui.elements.distance.textContent = this.distance;
        
        // Calculate progress toward the 10,000m goal based on best distance
        const progress = Math.min((this.bestDistance / this.goalDistance) * 100, 100);
        this.game.ui.elements.progressFill.style.width = `${progress}%`;
        
        // Update best distance display if we have one
        if (this.game.ui.elements.bestDistance) {
            this.game.ui.elements.bestDistance.textContent = this.bestDistance;
        }
    }
    
    addDistance(amount) {
        // Update the best distance if the current flight is better
        if (amount > this.bestDistance) {
            this.bestDistance = amount;
            console.log('New best distance:', this.bestDistance);
        }
        
        // Set the current distance to the amount from this flight
        this.distance = amount;
        
        // Update the progress bar based on best distance toward goal
        this.updateProgress();
    }
    
    resetFlightVariables() {
        this.flightDistance = 0;
        this.flightHeight = 0;
        this.isFlying = false;
    }
    
    generateObstacles() {
        this.obstacles = [];
        
        // Create obstacles with better spacing across the 5,000 meter range
        // Fewer obstacles to prevent clustering
        const obstacleCount = 3 + Math.floor(Math.random() * 4); // 3-6 obstacles (reduced for less clustering)
        const maxDistance = 4800; // Keep obstacles within visible range but not at max flight
        
        // Create zones for obstacle placement to ensure good distribution
        // Divide the 5000m into several zones
        const zones = [
            { min: 800, max: 1200 },    // First obstacle zone (800-1200m)
            { min: 1800, max: 2200 },   // Second obstacle zone (1800-2200m)
            { min: 2800, max: 3200 },   // Third obstacle zone (2800-3200m)
            { min: 3800, max: 4200 },   // Fourth obstacle zone (3800-4200m)
            { min: 4500, max: 4800 }    // Final obstacle zone (4500-4800m)
        ];
        
        console.log('Generating obstacles:', obstacleCount);
        
        // Place one obstacle in each zone until we have enough
        let placedCount = 0;
        for (let i = 0; i < zones.length && placedCount < obstacleCount; i++) {
            const zone = zones[i];
            
            // Always place an obstacle in the first zone and final zone
            // For middle zones, random chance to skip
            if (i > 0 && i < zones.length - 1 && Math.random() < 0.3) {
                continue; // Skip this zone
            }
            
            // Calculate random distance within this zone
            const distance = zone.min + Math.random() * (zone.max - zone.min);
            
            // Higher difficulty for obstacles further away
            const difficultyFactor = distance / maxDistance; // 0 to 1 based on distance
            const type = 1 + Math.floor(difficultyFactor * 2); // Types 1-3 (difficulty increases with distance)
            
            // Size based on type but with less variation
            const width = 60 + type * 15;
            
            // Building height - make them tall enough to reach from ground to max flight height
            // This ensures the player will always hit them when they reach this distance
            const height = 300; // Tall enough to block path
            
            // Set heightFromGround to 0 so buildings start from the ground
            const heightFromGround = 0;
            
            // Building colors - more building-like
            const buildingColors = ['#505050', '#404040', '#303030', '#606060', '#707070'];
            const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
            
            this.obstacles.push({
                distance: distance,
                width: width,
                height: height,
                heightFromGround: heightFromGround,
                type: type,
                broken: false,
                color: color,
                isBuilding: true // Flag this as a building-type obstacle
            });
            
            // Log obstacle details
            console.log(`Building ${placedCount}: distance=${Math.round(distance)}m, width=${width}, type=${type}`);
            
            placedCount++;
        }
        
        // Always add a final challenging obstacle near the max distance if we don't have one
        const hasEndObstacle = this.obstacles.some(o => o.distance >= 4500);
        
        if (!hasEndObstacle) {
            const finalDistance = 4600 + Math.random() * 200;
            
            this.obstacles.push({
                distance: finalDistance,
                width: 100,
                height: 300, // Tall building
                heightFromGround: 0, // Start from ground
                type: 3, // Hardest type
                broken: false,
                color: '#252525',
                isBuilding: true,
                isFinalObstacle: true
            });
            
            console.log(`Added final building: distance=${Math.round(finalDistance)}m`);
        }
        
        // Sort by distance (just to be safe)
        this.obstacles.sort((a, b) => a.distance - b.distance);
    }
    
    // New method to update sausage position based on character
    updateSausagePosition() {
        // Position the sausage horizontally with one end at the character's belt
        // The belt is around the middle of the character
        const beltX = this.character.x + this.character.width * 0.7; // Position right side of character
        const beltY = this.character.y + this.character.height * 0.4; // Belt position
        
        // Position sausage so its left end is at the belt
        this.sausage.x = beltX;
        this.sausage.y = beltY - this.sausage.height / 2; // Center on belt height
    }
} 