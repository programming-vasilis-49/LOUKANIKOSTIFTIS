export class PopupManager {
    constructor(game) {
        this.game = game;
        
        // Popup data
        this.popupMessages = [
            { title: "HOT MILFS IN YOUR AREA", image: "images/fat.png", color: "#ff3366" },
            { title: "LONELY SINGLES WANT TO CHAT", image: "images/hot_milf.jpg", color: "#ff6600" },
            { title: "CLICK HERE FOR A GOOD TIME", image: "images/bby.jpg", color: "#cc33ff" }
        ];
        
        this.popupInterval = null;
        this.activePopups = [];
    }
    
    initialize() {
        // Initial popup setup if needed
    }
    
    startPopupAds() {
        // Clear any existing interval
        if (this.popupInterval) {
            clearInterval(this.popupInterval);
        }
        
        // Create new popup based on popup rate upgrade level
        const popupRate = 15000 / Math.pow(2, this.game.upgradeManager.getUpgradeValue('popupRate') - 1);
        this.popupInterval = setInterval(() => this.createRandomPopup(), popupRate);
    }
    
    stopPopupAds() {
        if (this.popupInterval) {
            clearInterval(this.popupInterval);
            this.popupInterval = null;
        }
        
        // Don't remove popups anymore - they stay visible
        // this.removeAllPopups();
    }
    
    createRandomPopup() {
        // Get a random popup message
        const popup = this.popupMessages[Math.floor(Math.random() * this.popupMessages.length)];
        
        // Create popup element
        const popupElement = document.createElement('div');
        popupElement.className = 'popup-ad';
        
        // Get game container
        const gameContainer = document.querySelector('.game-container');
        
        // Set random position anywhere on screen with minimal edge padding
        const padding = 20;
        const maxX = window.innerWidth - 320; // account for popup width + padding
        const maxY = window.innerHeight - 260; // account for popup height + padding
        
        const randomX = Math.floor(Math.random() * maxX) + padding;
        const randomY = Math.floor(Math.random() * maxY) + padding;
        
        popupElement.style.left = `${randomX}px`;
        popupElement.style.top = `${randomY}px`;
        popupElement.style.backgroundColor = popup.color;
        
        // Create popup content
        popupElement.innerHTML = `
            <div class="popup-header">
                <span>${popup.title}</span>
                <button class="popup-close">X</button>
            </div>
            <div class="popup-body">
                <img src="${popup.image}" class="popup-image">
            </div>
        `;
        
        // Add close button functionality
        gameContainer.appendChild(popupElement);
        const closeButton = popupElement.querySelector('.popup-close');
        closeButton.addEventListener('click', () => {
            popupElement.remove();
            
            // Remove from active popups array
            const index = this.activePopups.indexOf(popupElement);
            if (index > -1) {
                this.activePopups.splice(index, 1);
            }
        });
        
        // Add to active popups array
        this.activePopups.push(popupElement);
        
        // Award goon points based on number of active popups
        const goonPointsToAdd = this.activePopups.length;
        this.game.state.goonPoints += goonPointsToAdd;
        this.game.state.updateCurrency('goonPoints');
    }
    
    removeAllPopups() {
        this.activePopups.forEach(popup => {
            if (popup.parentNode) {
                popup.remove();
            }
        });
        this.activePopups = [];
    }
} 