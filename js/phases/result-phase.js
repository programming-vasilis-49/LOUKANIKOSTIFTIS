export class ResultPhase {
    constructor(game) {
        this.game = game;
        this.splatters = [];
        this.resultsShown = false;
        this.waitTimer = 0;
    }
    
    start() {
        const { state, ui } = this.game;
        
        console.log('Starting result phase');
        
        // Update UI
        ui.updateGamePhase(this.game.PHASES.RESULT);
        
        // Calculate rewards first
        this.calculateRewards();
        
        // Show distance achieved
        ui.showPermanentMessage(`DISTANCE: ${Math.round(state.flightDistance)}m`, "#00ff00", "24px");
        
        // Reset flight variables
        state.resetFlightVariables();
        
        // Reset results state
        this.resultsShown = false;
        this.waitTimer = 0;
        
        // Add click handler for the entire canvas
        this.addClickHandler();
    }
    
    addClickHandler() {
        // Store reference to this for callback
        const self = this;
        
        // Define the click handler
        this.clickHandler = function(e) {
            console.log('Result phase click detected');
            
            // Check if clicking on the continue button
            const canvas = self.game.canvas;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Button position and dimensions
            const boxWidth = Math.min(500, canvas.width * 0.8);
            const boxHeight = 300;
            const boxY = (canvas.height - boxHeight) / 2;
            const buttonX = canvas.width/2 - 100;
            const buttonY = boxY + boxHeight + 20;
            const buttonWidth = 200;
            const buttonHeight = 50;
            
            // Check if click is within button bounds
            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                console.log('Continue button clicked');
                
                // Remove click handler
                canvas.removeEventListener('click', self.clickHandler);
                
                // Reset to charge phase
                self.game.changePhase(self.game.PHASES.CHARGE);
            } else {
                console.log('Click outside button, showing rewards again');
                // Any click elsewhere just goes to charge phase too for better UX
                canvas.removeEventListener('click', self.clickHandler);
                self.game.changePhase(self.game.PHASES.CHARGE);
            }
        };
        
        // Add the event listener
        this.game.canvas.addEventListener('click', this.clickHandler);
    }
    
    update() {
        // Wait a bit before showing the return button
        this.waitTimer++;
        
        // Update splatter positions (slower movement)
        for (let i = 0; i < this.splatters.length; i++) {
            const splatter = this.splatters[i];
            
            // Reduced movement speed by half
            splatter.x += splatter.speedX * 0.5;
            splatter.y += splatter.speedY * 0.5;
            
            // Slow gravity effect
            splatter.speedY += 0.05;
            
            // Slow fade out
            splatter.alpha -= 0.002;
            
            // Remove faded splatters
            if (splatter.alpha <= 0) {
                this.splatters.splice(i, 1);
                i--;
            }
        }
        
        // Show return button after splatter animation
        if (!this.resultsShown && this.waitTimer > 180) { // 3 seconds at 60fps
            this.showResults();
        }
    }
    
    render() {
        const { ctx, canvas, renderer, state } = this.game;
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a celebratory background
        this.drawCelebrationBackground();
        
        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Flight Results', canvas.width/2, 80);
        
        // Draw the distance bar showing how close to max 10000m
        this.drawDistanceAchievement();
        
        // Results box
        const boxWidth = Math.min(500, canvas.width * 0.8);
        const boxHeight = 300;
        const boxX = (canvas.width - boxWidth) / 2;
        const boxY = (canvas.height - boxHeight) / 2 + 40; // Moved down slightly
        
        // Draw box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Draw reward information
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        
        // Distance
        ctx.fillText(`Distance: ${this.rewards.distance}m`, canvas.width/2, boxY + 70);
        
        // Best distance (if different)
        if (this.rewards.bestDistance > this.rewards.distance) {
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.fillText(`Best Distance: ${this.rewards.bestDistance}m`, canvas.width/2, boxY + 110);
            ctx.fillStyle = '#FFFFFF'; // Reset color
        }
        
        // Goal progress
        const goalProgress = Math.min(100, Math.round((this.rewards.bestDistance / this.rewards.goalDistance) * 100));
        ctx.fillText(`Goal Progress: ${goalProgress}%`, canvas.width/2, boxY + 150);
        
        // Currency rewards
        ctx.fillText(`Sausage Coins: +${this.rewards.sausageCoins}`, canvas.width/2, boxY + 190);
        ctx.fillText(`Meat Tokens: +${this.rewards.meatTokens}`, canvas.width/2, boxY + 230);
        
        // Milestone text if any
        if (this.rewards.milestoneText) {
            ctx.fillStyle = '#FFD700'; // Gold color
            ctx.fillText(this.rewards.milestoneText, canvas.width/2, boxY + 270);
        }
        
        // Continue button
        this.drawButton('Continue to Shop', canvas.width/2 - 100, boxY + boxHeight + 20, 200, 50);
    }
    
    end() {
        // Clean up
        this.splatters = [];
        if (this.clickHandler) {
            this.game.canvas.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
    }
    
    createSplatters(count) {
        for (let i = 0; i < count; i++) {
            const size = 10 + Math.random() * 40;
            
            this.splatters.push({
                x: this.game.canvas.width / 2 + (Math.random() - 0.5) * 100,
                y: this.game.canvas.height / 2 + (Math.random() - 0.5) * 100,
                size: size,
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8,
                color: `rgba(${Math.floor(Math.random() * 100 + 155)}, 0, 0, 1)`,
                alpha: 1
            });
        }
    }
    
    drawSplatters() {
        const { ctx } = this.game;
        
        for (const splatter of this.splatters) {
            // Get color components
            let colorMatch = splatter.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
            if (!colorMatch) continue;
            
            const r = parseInt(colorMatch[1]);
            const g = parseInt(colorMatch[2]);
            const b = parseInt(colorMatch[3]);
            
            // Draw with current alpha
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${splatter.alpha})`;
            
            // Draw irregular splatter shape
            ctx.beginPath();
            const points = 8;
            const angleStep = (Math.PI * 2) / points;
            
            for (let i = 0; i < points; i++) {
                const angle = i * angleStep;
                const radiusVariation = 0.7 + Math.random() * 0.6;
                const radius = splatter.size * radiusVariation;
                
                const x = splatter.x + Math.cos(angle) * radius;
                const y = splatter.y + Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.closePath();
            ctx.fill();
        }
    }
    
    showResults() {
        this.resultsShown = true;
        
        // Create results container
        const resultsEl = document.createElement('div');
        resultsEl.className = 'results-container';
        resultsEl.innerHTML = `
            <div class="results-content">
                <h2>KAVLI RESULT</h2>
                <p>Your sausage traveled ${this.game.state.distance}m!</p>
                <button id="continueBtn">CONTINUE JERKING</button>
            </div>
        `;
        
        document.body.appendChild(resultsEl);
        
        // Add event listener to continue button
        document.getElementById('continueBtn').addEventListener('click', () => {
            // Remove results element
            resultsEl.remove();
            
            // Reset to charge phase
            this.game.changePhase(this.game.PHASES.CHARGE);
        });
    }
    
    calculateRewards() {
        const { state } = this.game;
        
        // Maximum possible distance is now 5000m for standard rewards
        const standardMaxDistance = 5000;
        
        // Goal distance is 10,000m
        const goalDistance = 10000;
        
        // Calculate percentage of standard max distance achieved
        const percentageAchieved = Math.min(1, state.flightDistance / standardMaxDistance);
        
        // Calculate percentage of goal distance achieved
        const goalPercentage = Math.min(1, state.flightDistance / goalDistance);
        
        // Base rewards on percentage of max distance
        const baseSausageCoins = Math.round(percentageAchieved * 100);
        const baseMeatTokens = Math.floor(percentageAchieved * 10);
        
        // Milestone bonuses
        let milestoneBonus = 0;
        let milestoneText = '';
        
        // Standard milestone bonuses (up to 5000m)
        if (percentageAchieved >= 1.0) {
            // Reached the full 5000m
            milestoneBonus = 50;
            milestoneText = 'MAX STANDARD DISTANCE! +50 COINS!';
        } else if (percentageAchieved >= 0.9) {
            // At least 4500m
            milestoneBonus = 25;
            milestoneText = 'ALMOST THERE! +25 COINS!';
        } else if (percentageAchieved >= 0.75) {
            // At least 3750m
            milestoneBonus = 15;
            milestoneText = 'GREAT DISTANCE! +15 COINS!';
        } else if (percentageAchieved >= 0.5) {
            // At least 2500m
            milestoneBonus = 10;
            milestoneText = 'GOOD EFFORT! +10 COINS!';
        }
        
        // Special bonus for approaching or reaching the 10,000m goal
        let goalBonus = 0;
        let goalText = '';
        
        if (state.flightDistance >= goalDistance) {
            // Reached the full 10,000m goal!
            goalBonus = 500;
            goalText = 'GOAL REACHED! +500 COINS AND 50 TOKENS!';
            state.meatTokens += 50; // Special token bonus
        } else if (state.flightDistance >= 7500) {
            // At least 7500m (75% to goal)
            goalBonus = 200;
            goalText = 'GETTING CLOSER TO GOAL! +200 COINS!';
        } else if (state.flightDistance >= 6000) {
            // At least 6000m (60% to goal)
            goalBonus = 100;
            goalText = 'EXCEPTIONAL DISTANCE! +100 COINS!';
        }
        
        // Apply multiplier upgrades
        const coinMultiplier = this.game.upgradeManager.getUpgradeValue('coinMultiplier');
        const totalSausageCoins = (baseSausageCoins + milestoneBonus + goalBonus) * coinMultiplier;
        const totalMeatTokens = baseMeatTokens;
        
        // Add to player's currencies
        state.sausageCoins += totalSausageCoins;
        state.meatTokens += totalMeatTokens;
        
        // Use the more impressive milestone text if both are earned
        const displayText = goalText || milestoneText;
        
        // Store for display
        this.rewards = {
            sausageCoins: totalSausageCoins,
            meatTokens: totalMeatTokens,
            distance: Math.round(state.flightDistance),
            bestDistance: Math.round(state.bestDistance),
            goalDistance: goalDistance,
            milestoneText: displayText,
            percentageAchieved: percentageAchieved,
            goalPercentage: goalPercentage
        };
        
        // Update UI
        state.updateCurrency('sausageCoins');
        state.updateCurrency('meatTokens');
        
        // Add to best distance tracking
        state.addDistance(Math.round(state.flightDistance));
    }
    
    drawDistanceAchievement() {
        const { ctx, canvas } = this.game;
        
        const standardMaxDistance = 5000;
        const goalDistance = 10000;
        
        // For displaying percentage, use goal percentage
        const percentage = this.rewards.distance / goalDistance;
        const standardPercentage = this.rewards.percentageAchieved;
        
        // Draw progress bar
        const barWidth = canvas.width * 0.6;
        const barHeight = 30;
        const barX = (canvas.width - barWidth) / 2;
        const barY = 120;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progress color
        let color;
        if (percentage >= 1) {
            // Rainbow effect for goal reached
            const hue = (Date.now() / 20) % 360;
            color = `hsl(${hue}, 100%, 50%)`;
        } else if (percentage >= 0.75) {
            color = '#e74c3c'; // Red
        } else if (percentage >= 0.5) {
            color = '#e67e22'; // Orange
        } else if (percentage >= 0.25) {
            color = '#f1c40f'; // Yellow
        } else {
            color = '#2ecc71'; // Green
        }
        
        // Draw both standard and goal progress markings
        
        // Draw standard progress (5,000m)
        ctx.fillStyle = 'rgba(100, 100, 255, 0.7)';
        const standardWidth = Math.min(1, this.rewards.distance / standardMaxDistance) * barWidth * 0.5; // 50% of bar is standard
        ctx.fillRect(barX, barY, standardWidth, barHeight);
        
        // Draw goal progress (beyond 5,000m)
        if (this.rewards.distance > standardMaxDistance) {
            ctx.fillStyle = color;
            const goalPortion = Math.min(1, (this.rewards.distance - standardMaxDistance) / (goalDistance - standardMaxDistance));
            const goalWidth = goalPortion * barWidth * 0.5; // Remaining 50% of bar is goal
            ctx.fillRect(barX + barWidth * 0.5, barY, goalWidth, barHeight);
        }
        
        // Border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Draw midpoint marker at 5,000m
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(barX + barWidth * 0.5 - 2, barY - 5, 4, barHeight + 10);
        
        // Draw markers for standard part (0m to 5000m)
        for (let i = 1; i <= 5; i++) {
            const markerX = barX + (barWidth * 0.5 * i / 5);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(markerX - 1, barY, 2, barHeight);
            
            // Label (every 1000m)
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i}k`, markerX, barY - 5);
        }
        
        // Draw markers for goal part (5000m to 10000m)
        for (let i = 6; i <= 10; i++) {
            const markerX = barX + barWidth * 0.5 + (barWidth * 0.5 * (i-5) / 5);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(markerX - 1, barY, 2, barHeight);
            
            // Label (every 1000m)
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i}k`, markerX, barY - 5);
        }
        
        // Text showing distance
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${this.rewards.distance}m / ${goalDistance}m (${Math.round(percentage * 100)}%)`, 
            canvas.width/2, 
            barY + barHeight + 25
        );
        
        // Best distance if different from current
        if (this.rewards.bestDistance > this.rewards.distance) {
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.fillText(
                `Best: ${this.rewards.bestDistance}m`, 
                canvas.width/2, 
                barY + barHeight + 50
            );
        }
        
        // Achievement text
        let achievementText;
        if (percentage >= 1) {
            achievementText = "GOAL REACHED! CONGRATULATIONS!";
        } else if (percentage >= 0.75) {
            achievementText = "EXCEPTIONAL FLIGHT!";
        } else if (percentage >= 0.5) {
            achievementText = "IMPRESSIVE DISTANCE!";
        } else if (percentage >= 0.25) {
            achievementText = "GOOD FLIGHT!";
        } else {
            achievementText = "KEEP PRACTICING!";
        }
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(achievementText, canvas.width/2, barY + barHeight + 75);
    }
    
    drawCelebrationBackground() {
        const { ctx, canvas } = this.game;
        
        // Draw a starry background with beam effects
        // Add randomly positioned stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2 + 1;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw light beams
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 3;
        const beamCount = 12;
        
        for (let i = 0; i < beamCount; i++) {
            const angle = (i / beamCount) * Math.PI * 2;
            const length = Math.max(canvas.width, canvas.height);
            
            const pulse = (Math.sin(Date.now() / 1000 + i) + 1) / 2;
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.2 + pulse * 0.3})`;
            ctx.lineWidth = 10 + pulse * 20;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * length,
                centerY + Math.sin(angle) * length
            );
            ctx.stroke();
        }
    }
    
    drawButton(text, x, y, width, height) {
        const { ctx } = this.game;
        
        // Button background with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(1, '#45a049');
        
        // Draw button with rounded corners
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();
        
        // Button border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.stroke();
        
        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width/2, y + height/2);
        
        // Add hover effect
        const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.5})`;
        ctx.lineWidth = 2 + pulse * 2;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.stroke();
    }
} 