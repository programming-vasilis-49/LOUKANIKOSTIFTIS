export class UI {
    constructor(game) {
        this.game = game;
        this.elements = {
            clickCounter: document.getElementById('click-counter'),
            gamePhase: document.getElementById('game-phase'),
            gameTimer: document.getElementById('game-timer'),
            powerMeter: document.getElementById('power-meter'),
            progressFill: document.getElementById('progress-fill'),
            distance: document.getElementById('distance'),
            sausageCoins: document.getElementById('sausage-coins'),
            meatTokens: document.getElementById('meat-tokens'),
            sausageDNA: document.getElementById('sausage-dna'),
            goonPoints: document.getElementById('goon-points'),
            message: document.getElementById('message'),
            upgradeContainer: document.getElementById('upgrade-container')
        };
        
        // Click effects for visual feedback
        this.clickEffects = [];
    }
    
    initialize() {
        console.log('Initializing UI');
        
        // Set initial values
        this.updateClickCounter(0);
        this.updateGamePhase(this.game.PHASES.CHARGE);
        this.updateGameTimer(30);
        this.updatePowerMeter(0, this.game.state.maxChargePower);
        
        // Set up event listeners
        this.addEventListeners();
    }
    
    addEventListeners() {
        // Canvas click handler
        this.game.canvas.addEventListener('click', (e) => {
            const rect = this.game.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Process click based on game phase
            this.game.handleClick(x, y);
        });
    }
    
    updateClickCounter(clicks) {
        if (this.elements.clickCounter) {
            this.elements.clickCounter.textContent = clicks;
        }
    }
    
    updateGamePhase(phase) {
        if (this.elements.gamePhase) {
            let phaseName = 'Unknown';
            
            switch (phase) {
                case this.game.PHASES.CHARGE:
                    phaseName = 'CHARGING UP';
                    break;
                case this.game.PHASES.FLIGHT:
                    phaseName = 'FLIGHT';
                    break;
                case this.game.PHASES.RESULT:
                    phaseName = 'RESULTS';
                    break;
                case this.game.PHASES.SHOP:
                    phaseName = 'SHOP';
                    break;
            }
            
            this.elements.gamePhase.textContent = phaseName;
        }
    }
    
    updateGameTimer(seconds) {
        if (this.elements.gameTimer) {
            this.elements.gameTimer.textContent = seconds;
        }
    }
    
    updatePowerMeter(power, maxPower) {
        if (!this.elements.powerMeter) return;
        
        // Calculate percentage
        const percentage = (power / maxPower) * 100;
        
        // Make the power bar more visible
        this.elements.powerMeter.innerHTML = '';
        
        // Power meter container - add a text display showing the actual value
        this.elements.powerMeter.style.position = 'relative';
        
        // Create the fill element
        const fillElement = document.createElement('div');
        fillElement.style.width = `${percentage}%`;
        fillElement.style.height = '100%';
        fillElement.style.backgroundColor = this.getPowerColor(percentage);
        fillElement.style.transition = 'width 0.2s, background-color 0.5s';
        fillElement.style.borderRadius = '5px';
        
        // Add pulsing effect when getting close to full
        if (percentage > 90) {
            fillElement.style.animation = 'pulse 0.5s infinite alternate';
            // Add keyframes if they don't exist
            if (!document.querySelector('#power-meter-animation')) {
                const style = document.createElement('style');
                style.id = 'power-meter-animation';
                style.textContent = `
                    @keyframes pulse {
                        from { opacity: 0.8; }
                        to { opacity: 1; box-shadow: 0 0 10px 5px rgba(255, 255, 255, 0.7); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Create the text element
        const textElement = document.createElement('div');
        textElement.style.position = 'absolute';
        textElement.style.top = '0';
        textElement.style.left = '0';
        textElement.style.width = '100%';
        textElement.style.height = '100%';
        textElement.style.display = 'flex';
        textElement.style.alignItems = 'center';
        textElement.style.justifyContent = 'center';
        textElement.style.color = percentage > 50 ? '#000' : '#fff';
        textElement.style.fontWeight = 'bold';
        textElement.style.fontSize = '14px';
        textElement.style.textShadow = '0 0 3px rgba(0,0,0,0.5)';
        
        // Show both percentage and actual value/max
        textElement.textContent = `${Math.floor(percentage)}% (${power.toLocaleString()}/${maxPower.toLocaleString()})`;
        
        // Add a visual marker for every 10% increment
        const markersContainer = document.createElement('div');
        markersContainer.style.position = 'absolute';
        markersContainer.style.top = '0';
        markersContainer.style.left = '0';
        markersContainer.style.width = '100%';
        markersContainer.style.height = '100%';
        markersContainer.style.pointerEvents = 'none';
        
        for (let i = 10; i < 100; i += 10) {
            const marker = document.createElement('div');
            marker.style.position = 'absolute';
            marker.style.left = `${i}%`;
            marker.style.top = '0';
            marker.style.height = '100%';
            marker.style.width = '2px';
            marker.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            markersContainer.appendChild(marker);
            
            // Add a small label for each 25% increment
            if (i % 25 === 0) {
                const label = document.createElement('div');
                label.style.position = 'absolute';
                label.style.left = `${i}%`;
                label.style.top = '-15px';
                label.style.transform = 'translateX(-50%)';
                label.style.fontSize = '10px';
                label.style.color = '#fff';
                label.style.background = 'rgba(0, 0, 0, 0.5)';
                label.style.padding = '2px 4px';
                label.style.borderRadius = '3px';
                label.textContent = `${i}%`;
                markersContainer.appendChild(label);
            }
        }
        
        // Append elements
        this.elements.powerMeter.appendChild(fillElement);
        this.elements.powerMeter.appendChild(markersContainer);
        this.elements.powerMeter.appendChild(textElement);
    }
    
    getPowerColor(percentage) {
        // Color gradient based on power percentage
        if (percentage < 20) {
            return '#3498db'; // Blue
        } else if (percentage < 40) {
            return '#2ecc71'; // Green
        } else if (percentage < 60) {
            return '#f1c40f'; // Yellow
        } else if (percentage < 80) {
            return '#e67e22'; // Orange
        } else if (percentage < 95) {
            return '#e74c3c'; // Red
        } else {
            // Rainbow effect for near-max power
            return `hsl(${(Date.now() / 20) % 360}, 100%, 50%)`;
        }
    }
    
    showMessage(text, duration = 3000) {
        if (this.elements.message) {
            this.elements.message.textContent = text;
            this.elements.message.style.display = 'block';
            
            // Clear any existing timer
            if (this.messageTimer) {
                clearTimeout(this.messageTimer);
            }
            
            // Set timer to hide message
            this.messageTimer = setTimeout(() => {
                this.hideMessage();
            }, duration);
        }
    }
    
    showPermanentMessage(text, color = '#FFFFFF', fontSize = '18px') {
        if (this.elements.message) {
            this.elements.message.textContent = text;
            this.elements.message.style.display = 'block';
            this.elements.message.style.color = color;
            this.elements.message.style.fontSize = fontSize;
            
            // Clear any existing timer
            if (this.messageTimer) {
                clearTimeout(this.messageTimer);
            }
        }
    }
    
    hideMessage() {
        if (this.elements.message) {
            this.elements.message.style.display = 'none';
        }
    }
    
    createClickEffect(x, y) {
        // Create a visual effect for clicks
        this.clickEffects.push({
            x: x,
            y: y,
            radius: 10,
            maxRadius: 50,
            alpha: 1,
            color: `hsl(${Math.random() * 360}, 100%, 70%)`,
            active: true
        });
    }
    
    updateUpgradeDisplay(upgrades) {
        if (!this.elements.upgradeContainer) return;
        
        // Clear existing upgrades
        this.elements.upgradeContainer.innerHTML = '';
        
        // Add each upgrade
        for (const key in upgrades) {
            const upgrade = upgrades[key];
            
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'upgrade';
            
            const title = document.createElement('h3');
            title.textContent = upgrade.name;
            
            const description = document.createElement('p');
            description.textContent = upgrade.description;
            
            const levelInfo = document.createElement('div');
            levelInfo.textContent = `Level ${upgrade.level}/${upgrade.maxLevel}`;
            
            const costInfo = document.createElement('div');
            costInfo.textContent = `Cost: ${upgrade.cost} ${upgrade.currency === 'sausageCoins' ? '🌭' : '🥩'}`;
            
            const button = document.createElement('button');
            button.textContent = 'Upgrade';
            button.disabled = upgrade.level >= upgrade.maxLevel;
            button.onclick = () => this.game.upgradeManager.purchaseUpgrade(key);
            
            upgradeElement.appendChild(title);
            upgradeElement.appendChild(description);
            upgradeElement.appendChild(levelInfo);
            upgradeElement.appendChild(costInfo);
            upgradeElement.appendChild(button);
            
            this.elements.upgradeContainer.appendChild(upgradeElement);
        }
    }
} 