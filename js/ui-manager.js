export class UIManager {
    constructor(game) {
        this.game = game;
        
        // Store all UI element references
        this.elements = {
            // Canvas elements
            canvas: document.getElementById('gameCanvas'),
            clickCounter: document.getElementById('clickCounter'),
            messageElement: document.getElementById('message'),
            
            // Game state elements
            gamePhaseElement: document.getElementById('gamePhase'),
            gameTimerElement: document.getElementById('gameTimer'),
            powerMeter: document.getElementById('powerFill'),
            
            // Currency and progression elements
            sausageCoins: document.getElementById('sausageCoins'),
            meatTokens: document.getElementById('meatTokens'),
            sausageDNA: document.getElementById('sausageDNA'),
            goonPoints: document.getElementById('goonPoints'),
            distance: document.getElementById('distance'),
            progressFill: document.getElementById('progressFill'),
            
            // Upgrade level elements
            clickPowerLevel: document.getElementById('clickPowerLevel'),
            clickPowerCost: document.getElementById('clickPowerCost'),
            autoClickLevel: document.getElementById('autoClickLevel'),
            autoClickCost: document.getElementById('autoClickCost'),
            coinMultiplierLevel: document.getElementById('coinMultiplierLevel'),
            coinMultiplierCost: document.getElementById('coinMultiplierCost'),
            throwPowerLevel: document.getElementById('throwPowerLevel'),
            throwPowerCost: document.getElementById('throwPowerCost'),
            tokenGeneratorLevel: document.getElementById('tokenGeneratorLevel'),
            tokenGeneratorCost: document.getElementById('tokenGeneratorCost'),
            sausageSizeLevel: document.getElementById('sausageSizeLevel'),
            sausageSizeCost: document.getElementById('sausageSizeCost'),
            popupRateLevel: document.getElementById('popupRateLevel'),
            popupRateCost: document.getElementById('popupRateCost')
        };
        
        // Click effect pool for performance
        this.clickEffects = [];
    }
    
    initialize() {
        console.log('Initializing UI Manager');
        
        // Setup click handler on canvas
        if (this.elements.canvas) {
            console.log('Adding click event listener to canvas');
            this.elements.canvas.addEventListener('click', (event) => {
                console.log('Canvas clicked!');
                if (this.game.state.currentPhase === this.game.PHASES.CHARGE) {
                    console.log('Processing click in charge phase');
                    this.game.phases[this.game.PHASES.CHARGE].processClick(true);
                }
            });
        } else {
            console.error('Canvas element not found for click listener!');
        }
        
        // Add a failsafe global click handler
        document.addEventListener('click', (event) => {
            // Check if the click was within the canvas bounds
            if (this.elements.canvas) {
                const rect = this.elements.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                    console.log('Document click detected in canvas area');
                    if (this.game.state.currentPhase === this.game.PHASES.CHARGE) {
                        this.game.phases[this.game.PHASES.CHARGE].processClick(true);
                    }
                }
            }
        });
        
        // Initial update of UI elements
        this.updateGamePhase(this.game.state.currentPhase);
        this.updateClickCounter(0);
    }
    
    updateClickCounter(clicks) {
        this.elements.clickCounter.textContent = `Jerks: ${clicks}`;
    }
    
    updateGamePhase(phase) {
        let phaseName = "UNKNOWN PHASE";
        let phaseColor = "#ffffff";
        
        switch(phase) {
            case this.game.PHASES.CHARGE:
                phaseName = "STROKING PHASE";
                phaseColor = "#ffcc00";
                break;
            case this.game.PHASES.FLIGHT:
                phaseName = "FLIGHT PHASE";
                phaseColor = "#00ccff";
                break;
            case this.game.PHASES.RESULT:
                phaseName = "RESULT PHASE";
                phaseColor = "#ff00cc";
                break;
        }
        
        this.elements.gamePhaseElement.textContent = phaseName;
        this.elements.gamePhaseElement.style.color = phaseColor;
    }
    
    updateGameTimer(time) {
        this.elements.gameTimerElement.textContent = time;
    }
    
    updatePowerMeter(power, maxPower) {
        const percentage = (power / maxPower) * 100;
        this.elements.powerMeter.style.width = `${percentage}%`;
        
        // Adjust color based on power level
        if (percentage < 33) {
            this.elements.powerMeter.style.backgroundColor = "#ff0000";
        } else if (percentage < 66) {
            this.elements.powerMeter.style.backgroundColor = "#ffcc00";
        } else {
            this.elements.powerMeter.style.backgroundColor = "#00ff00";
        }
    }
    
    showMessage(text, duration = 2000) {
        this.elements.messageElement.textContent = text;
        this.elements.messageElement.style.display = "block";
        
        // Clear any existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        
        // Set timeout to hide message
        this.messageTimeout = setTimeout(() => {
            this.elements.messageElement.style.display = "none";
        }, duration);
    }
    
    showPermanentMessage(text, color = "#ff0000", size = "24px") {
        this.elements.messageElement.textContent = text;
        this.elements.messageElement.style.display = "block";
        this.elements.messageElement.style.fontSize = size;
        this.elements.messageElement.style.color = color;
        this.elements.messageElement.style.fontWeight = "bold";
        
        // Clear any existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }
    }
    
    hideMessage() {
        this.elements.messageElement.style.display = "none";
    }
    
    createClickEffect(x, y, color) {
        const effect = {
            x: x,
            y: y,
            radius: 10,
            maxRadius: 50,
            alpha: 1,
            color: color || `hsl(${Math.random() * 360}, 100%, 50%)`,
            active: true
        };
        
        this.clickEffects.push(effect);
    }
} 