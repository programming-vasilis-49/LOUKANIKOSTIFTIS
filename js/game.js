console.log('Loading UIManager...');
import { UIManager } from './ui-manager.js';
console.log('Loading GameState...');
import { GameState } from './game-state.js';
console.log('Loading UpgradeManager...');
import { UpgradeManager } from './upgrade-manager.js';
console.log('Loading PopupManager...');
import { PopupManager } from './popup-manager.js';
console.log('Loading Renderer...');
import { Renderer } from './renderer.js';
console.log('Loading ChargePhase...');
import { ChargePhase } from './phases/charge-phase.js';
console.log('Loading FlightPhase...');
import { FlightPhase } from './phases/flight-phase.js';
console.log('Loading ResultPhase...');
import { ResultPhase } from './phases/result-phase.js';
console.log('All modules loaded!');

export class Game {
    constructor() {
        console.log('Game constructor started');
        
        // Game constants
        this.PHASES = {
            CHARGE: 'CHARGE',
            FLIGHT: 'FLIGHT',
            RESULT: 'RESULT'
        };
        
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        console.log('Canvas element:', this.canvas);
        
        if (!this.canvas) {
            console.error('Canvas element not found! Make sure your HTML has an element with id "gameCanvas"');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        console.log('Canvas context:', this.ctx);
        
        this.canvas.width = 600;
        this.canvas.height = 400;
        console.log('Canvas dimensions set to', this.canvas.width, 'x', this.canvas.height);
        
        // Game systems
        console.log('Creating game systems...');
        this.ui = new UIManager(this);
        this.state = new GameState(this);
        this.upgradeManager = new UpgradeManager(this);
        this.popupManager = new PopupManager(this);
        this.renderer = new Renderer(this);
        console.log('Game systems created');
        
        // Game phases
        console.log('Creating game phases...');
        this.phases = {
            [this.PHASES.CHARGE]: new ChargePhase(this),
            [this.PHASES.FLIGHT]: new FlightPhase(this),
            [this.PHASES.RESULT]: new ResultPhase(this)
        };
        console.log('Game phases created');
        
        // Animation
        this.animationFrame = null;
        console.log('Game constructor completed');
    }
    
    initialize() {
        // Initialize UI elements
        this.ui.initialize();
        
        // Set canvas dimensions to match container
        this.resizeCanvas();
        
        // Add event listener for window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize game state
        this.state.initialize();
        
        // Setup upgrade listeners
        this.upgradeManager.initialize();
        
        // Start the game loop
        this.startGameLoop();
        
        // Start with the charge phase
        this.phases[this.PHASES.CHARGE].start();
    }
    
    // New method to resize canvas based on container size
    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        // Get container dimensions
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Set canvas dimensions to match container
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        
        // Update ground level in all phases
        if (this.phases) {
            // Update ground level for all phases
            if (this.phases[this.PHASES.FLIGHT]) {
                this.phases[this.PHASES.FLIGHT].groundLevel = this.canvas.height * 0.85;
            }
        }
        
        console.log('Canvas resized to', this.canvas.width, 'x', this.canvas.height);
    }
    
    startGameLoop() {
        console.log('Starting game loop...');
        
        // Clear any existing animation frame to prevent duplicates
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Reference to this for the closure
        const game = this;
        
        // Define the animate function
        function animate() {
            // Update game state
            game.update();
            
            // Render game
            game.render();
            
            // Request next frame
            game.animationFrame = requestAnimationFrame(animate);
        }
        
        // Start the animation loop
        this.animationFrame = requestAnimationFrame(animate);
        console.log('Game loop started, animation frame requested:', this.animationFrame);
    }
    
    update() {
        // Only log occasionally to avoid console spam
        if (Math.random() < 0.01) {
            console.log('Update called, current phase:', this.state.currentPhase);
        }
        
        // Update current phase
        if (this.phases[this.state.currentPhase] && typeof this.phases[this.state.currentPhase].update === 'function') {
            this.phases[this.state.currentPhase].update();
        } else {
            console.error('Cannot update phase:', this.state.currentPhase);
        }
        
        // Check for win condition
        if (this.state.distance >= this.state.goalDistance) {
            console.log('Win condition met!');
            this.winGame();
        }
        
        // Handle auto-clicking if enabled
        const autoClickLevel = this.upgradeManager.getUpgradeValue('autoClick');
        if (autoClickLevel > 0 && this.state.currentPhase === this.PHASES.CHARGE) {
            // Auto-click at a rate of once per second times the auto-click level
            if (Math.random() < autoClickLevel / 60) {  // Assumes 60 FPS
                this.phases[this.PHASES.CHARGE].processClick(false);
            }
        }
    }
    
    render() {
        // Only render if we have a canvas context
        if (!this.ctx) {
            console.error('No rendering context available');
            return;
        }
        
        // Clear the canvas first
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Only log occasionally to avoid console spam
        if (Math.random() < 0.01) {
            console.log('Rendering phase:', this.state.currentPhase);
        }
        
        // Render current phase
        if (this.phases[this.state.currentPhase] && typeof this.phases[this.state.currentPhase].render === 'function') {
            this.phases[this.state.currentPhase].render();
        } else {
            console.error('Cannot render phase:', this.state.currentPhase);
        }
    }
    
    changePhase(newPhase) {
        // End current phase
        this.phases[this.state.currentPhase].end();
        
        // Switch to new phase
        this.state.currentPhase = newPhase;
        
        // Start new phase
        this.phases[newPhase].start();
    }
    
    winGame() {
        // Create win message
        const winMessage = document.createElement('div');
        winMessage.className = 'end-game-message';
        winMessage.innerHTML = `
            <h1>YOU WIN!</h1>
            <p>You've reached ${this.state.goalDistance}m with your sausage!</p>
            <button id="restartBtn">Play Again</button>
        `;
        document.body.appendChild(winMessage);
        
        // Display win message
        winMessage.style.display = 'flex';
        
        // Add restart button event listener
        document.getElementById('restartBtn').addEventListener('click', () => {
            location.reload();
        });
        
        // Stop game
        cancelAnimationFrame(this.animationFrame);
    }
}
