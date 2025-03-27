export class UpgradeManager {
    constructor(game) {
        this.game = game;
        
        // Define all upgrades
        this.upgrades = {
            clickPower: {
                level: 1,
                cost: 10,
                costMultiplier: 1.5,
                getValue: () => this.upgrades.clickPower.level,
                currency: 'sausageCoins'
            },
            autoClick: {
                level: 0,
                cost: 50,
                costMultiplier: 1.7,
                getValue: () => this.upgrades.autoClick.level,
                currency: 'sausageCoins',
                lastTick: Date.now()
            },
            coinMultiplier: {
                level: 1,
                cost: 100,
                costMultiplier: 2,
                getValue: () => this.upgrades.coinMultiplier.level,
                currency: 'sausageCoins'
            },
            throwPower: {
                level: 1,
                cost: 25,
                costMultiplier: 1.8,
                getValue: () => this.upgrades.throwPower.level,
                currency: 'meatTokens'
            },
            tokenGenerator: {
                level: 0,
                cost: 200,
                costMultiplier: 2.5,
                getValue: () => this.upgrades.tokenGenerator.level,
                currency: 'sausageCoins'
            },
            sausageSize: {
                level: 1,
                cost: 5,
                costMultiplier: 2,
                getValue: () => this.upgrades.sausageSize.level,
                currency: 'sausageDNA'
            },
            popupRate: {
                level: 1,
                cost: 100,
                costMultiplier: 2,
                getValue: () => this.upgrades.popupRate.level,
                currency: 'goonPoints'
            }
        };
    }
    
    initialize() {
        // Update initial display
        Object.keys(this.upgrades).forEach(upgradeId => {
            this.updateUpgradeDisplay(upgradeId);
        });
        
        // Setup auto-click functionality
        setInterval(() => {
            if (this.upgrades.autoClick.level > 0 && 
                this.game.state.currentPhase === this.game.PHASES.CHARGE) {
                
                const now = Date.now();
                const deltaTime = now - this.upgrades.autoClick.lastTick;
                const clicksToAdd = Math.floor(deltaTime / 1000 * this.upgrades.autoClick.level);
                
                if (clicksToAdd > 0) {
                    for (let i = 0; i < clicksToAdd; i++) {
                        this.game.phases[this.game.PHASES.CHARGE].processClick(true);
                    }
                    this.upgrades.autoClick.lastTick = now;
                }
            }
        }, 100);
        
        // Add upgrade button event listeners
        document.querySelectorAll('.upgrade .buy-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const upgradeElement = e.target.closest('.upgrade');
                const upgradeId = upgradeElement.id.replace('Upgrade', '');
                this.buyUpgrade(upgradeId);
            });
        });
    }
    
    buyUpgrade(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        const currencyType = upgrade.currency;
        let currencyValue = 0;
        
        // Get currency value based on type
        switch(currencyType) {
            case 'sausageCoins':
                currencyValue = this.game.state.sausageCoins;
                break;
            case 'meatTokens':
                currencyValue = this.game.state.meatTokens;
                break;
            case 'sausageDNA':
                currencyValue = this.game.state.sausageDNA;
                break;
            case 'goonPoints':
                currencyValue = this.game.state.goonPoints;
                break;
        }
        
        if (currencyValue >= upgrade.cost) {
            // Deduct cost
            switch(currencyType) {
                case 'sausageCoins':
                    this.game.state.sausageCoins -= upgrade.cost;
                    break;
                case 'meatTokens':
                    this.game.state.meatTokens -= upgrade.cost;
                    break;
                case 'sausageDNA':
                    this.game.state.sausageDNA -= upgrade.cost;
                    
                    // Update sausage size if this is the size upgrade
                    if (upgradeId === 'sausageSize') {
                        this.game.state.sausage.size = upgrade.level;
                        
                        // Increase flight distance multiplier by x1.3 each time
                        // Store the flight distance multiplier in the game state if it doesn't exist
                        if (!this.game.state.flightDistanceMultiplier) {
                            this.game.state.flightDistanceMultiplier = 1;
                        }
                        
                        // Apply the 1.3x multiplier
                        this.game.state.flightDistanceMultiplier *= 1.3;
                        
                        // Show message about the increased flight distance
                        this.game.ui.showMessage(`Flight Distance x${this.game.state.flightDistanceMultiplier.toFixed(1)}`, 2000);
                    }
                    break;
                case 'goonPoints':
                    this.game.state.goonPoints -= upgrade.cost;
                    break;
            }
            
            // Update currency display
            this.game.state.updateCurrency(currencyType);
            
            // Increase level
            upgrade.level++;
            
            // Update cost
            upgrade.cost = Math.floor(upgrade.cost * upgrade.costMultiplier);
            
            // Update display
            this.updateUpgradeDisplay(upgradeId);
        }
    }
    
    updateUpgradeDisplay(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        const levelElement = document.getElementById(`${upgradeId}Level`);
        const costElement = document.getElementById(`${upgradeId}Cost`);
        
        if (levelElement && costElement) {
            levelElement.textContent = upgrade.getValue();
            costElement.textContent = upgrade.cost;
        }
    }
    
    getUpgradeValue(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        return upgrade ? upgrade.getValue() : 0;
    }
} 