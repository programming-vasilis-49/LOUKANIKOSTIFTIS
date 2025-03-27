export class ChargePhase {
    constructor(game) {
        this.game = game;
        this.chargeInterval = null;
        this.lastClickTime = null;
        this.recentClicks = null;
    }
    
    start() {
        const { state, ui } = this.game;
        
        console.log('Starting charge phase');
        
        // Reset phase-specific variables
        state.chargePower = 0;
        state.chargeTimer = 30;
        state.clicks = 0;
        
        // Update UI
        ui.updateClickCounter(state.clicks);
        ui.updateGamePhase(this.game.PHASES.CHARGE);
        ui.updateGameTimer(state.chargeTimer);
        ui.updatePowerMeter(state.chargePower, state.maxChargePower);
        
        // Start the charge timer
        this.chargeInterval = setInterval(() => {
            state.chargeTimer--;
            ui.updateGameTimer(state.chargeTimer);
            console.log('Timer tick:', state.chargeTimer);
            
            if (state.chargeTimer <= 0) {
                this.endCharge();
            }
        }, 1000);
        
        // Start popup ads
        if (this.game.popupManager) {
            this.game.popupManager.startPopupAds();
        }
        
        // Debug message
        ui.showMessage("Click to start stroking!", 3000);
    }
    
    update() {
        // Update animation here if needed
    }
    
    render() {
        const { ctx, canvas, renderer, state, ui } = this.game;
        if (Math.random() < 0.01) console.log('ChargePhase render called');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background (changed to black)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw character
        if (Math.random() < 0.01) console.log('Drawing character...');
        renderer.drawCharacter(state.character);
        
        // Position the sausage horizontally over the character's belt
        // Update sausage position using the new method but adjust it to be on top of the belt
        state.updateSausagePosition();
        
        // Draw sausage horizontal instead of angled
        renderer.drawSausage(state.sausage, 0);
        
        // Draw the character's hand on top of the sausage with stroking animation
        this.drawStrokingHand(state.character, state.sausage, state.chargePower);
        
        // Draw click effects
        renderer.drawClickEffects(ui.clickEffects);
        
        // Draw flying sausages and clouds if any
        renderer.drawFlyingSausages(state.flyingSausages);
        renderer.drawFlyingClouds(state.flyingClouds);
        
        // Draw liquid stream effect if exploding (replacing explosion)
        if (state.isExploding && state.liquidStream) {
            this.updateAndDrawLiquidStream();
            
            // Check if the animation is complete
            state.liquidStream.duration += 1/60; // Assuming 60fps
            if (state.liquidStream.duration >= state.liquidStream.maxDuration) {
                this.resetAfterExplosion();
            }
        }
    }
    
    // Replace the old hand drawing method with a stroking animation
    drawStrokingHand(character, sausage, chargePower) {
        const { ctx } = this.game;
        
        // Calculate hand position based on click power and animation state
        // Use sine wave for smooth up and down motion
        const clickTime = Date.now() / 200; // Time factor for animation
        
        // Determine stroke position (0 to 1) along the sausage
        // Higher charge power means faster stroking
        const speedFactor = 1 + (chargePower / 100) * 3;
        const strokePosition = (Math.sin(clickTime * speedFactor) + 1) / 2;
        
        // Calculate hand position along the sausage
        const handX = sausage.x + strokePosition * (sausage.width - 40); // -40 to keep hand visible on sausage
        const handY = sausage.y - 15; // Slightly above the sausage
        
        // Draw hand (fist)
        ctx.fillStyle = '#800000'; // Match character's skin tone
        
        // Draw fist
        ctx.beginPath();
        ctx.arc(handX, handY, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw fingers wrapping around sausage
        // First finger
        ctx.beginPath();
        ctx.ellipse(handX + 15, handY + 10, 8, 15, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Second finger
        ctx.beginPath();
        ctx.ellipse(handX - 5, handY + 15, 15, 8, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Add arm connecting to character
        ctx.beginPath();
        ctx.moveTo(handX, handY);
        ctx.lineTo(character.x + character.width / 2, character.y + character.height / 3);
        ctx.lineTo(character.x + character.width / 2 + 15, character.y + character.height / 3 + 10);
        ctx.lineTo(handX + 15, handY + 5);
        ctx.closePath();
        ctx.fill();
        
        // Draw grip effect (hand squeezing the sausage)
        const squeezeAmount = 5 + (strokePosition * 2); // Varies squeeze based on position
        
        // Draw the squeeze effect on the sausage
        ctx.fillStyle = '#ff6666'; // Slightly lighter color to show pressure
        ctx.beginPath();
        ctx.ellipse(handX, sausage.y + sausage.height/2, 15, sausage.height/2 - squeezeAmount/2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    end() {
        // Clear the charge timer
        if (this.chargeInterval) {
            clearInterval(this.chargeInterval);
            this.chargeInterval = null;
        }
    }
    
    processClick(isUserClick = true) {
        const { state, ui, upgradeManager } = this.game;
        
        console.log('Process click called, isUserClick:', isUserClick);
        
        // Don't process clicks if exploding or not in charge phase
        if (state.isExploding || state.currentPhase !== this.game.PHASES.CHARGE) {
            console.log('Click rejected. isExploding:', state.isExploding, 'currentPhase:', state.currentPhase);
            return;
        }
        
        // Increment click counter
        state.clicks++;
        ui.updateClickCounter(state.clicks);
        
        // Get base click power from upgrades
        let powerToAdd = upgradeManager.getUpgradeValue('clickPower');
        
        // Scale click power based on clicks per second
        // This accelerates filling the bar as clicking gets faster
        const currentTime = Date.now();
        if (!this.lastClickTime) this.lastClickTime = currentTime;
        
        const timeSinceLastClick = currentTime - this.lastClickTime;
        this.lastClickTime = currentTime;
        
        // Calculate clicks per second (capped at 20 CPS for balance)
        if (timeSinceLastClick < 3000) { // Only count if less than 3 seconds between clicks
            if (!this.recentClicks) this.recentClicks = [];
            
            // Add this click to recent clicks
            this.recentClicks.push(currentTime);
            
            // Remove clicks older than 1 second
            const oneSecondAgo = currentTime - 1000;
            this.recentClicks = this.recentClicks.filter(time => time >= oneSecondAgo);
            
            // Calculate clicks per second and add bonus
            const clicksPerSecond = this.recentClicks.length;
            const speedMultiplier = Math.min(1 + (clicksPerSecond / 10), 3); // Cap at 3x multiplier
            
            // Apply speed multiplier to power
            powerToAdd = Math.round(powerToAdd * speedMultiplier);
            
            // Show CPS indicator if clicking fast
            if (clicksPerSecond >= 5) {
                ui.showMessage(`${clicksPerSecond} CPS! x${speedMultiplier.toFixed(1)}`, 500);
            }
        }
        
        // Add to charge power
        state.chargePower = Math.min(state.chargePower + powerToAdd, state.maxChargePower);
        
        // Update power meter
        ui.updatePowerMeter(state.chargePower, state.maxChargePower);
        
        // Show percentage every 1000 points
        if (state.chargePower % 1000 === 0 || state.chargePower === state.maxChargePower / 2) {
            const percent = Math.floor((state.chargePower / state.maxChargePower) * 100);
            ui.showMessage(`${percent}% CHARGED!`, 1000);
        }
        
        console.log('Click processed: Clicks:', state.clicks, 'Power:', state.chargePower);
        
        // Calculate currencies earned
        if (isUserClick) {
            // Create click effect at sausage position
            ui.createClickEffect(
                state.sausage.x + state.sausage.width/2,
                state.sausage.y + state.sausage.height/2
            );
            
            // Award sausage coins based on multiplier upgrade
            const coinsToAdd = 1 * upgradeManager.getUpgradeValue('coinMultiplier');
            state.sausageCoins += coinsToAdd;
            state.updateCurrency('sausageCoins');
            
            // Check token generator
            const tokenGeneratorLevel = upgradeManager.getUpgradeValue('tokenGenerator');
            if (tokenGeneratorLevel > 0 && state.clicks % Math.max(50 - tokenGeneratorLevel * 5, 5) === 0) {
                state.meatTokens++;
                state.updateCurrency('meatTokens');
                ui.showMessage(`+1 🥩`, 1000);
            }
            
            // Check for max power explosion
            if (state.chargePower >= state.maxChargePower) {
                this.startExplosion();
            }
        }
    }
    
    startExplosion() {
        const { state, ui } = this.game;
        
        // Change from explosion to liquid release
        state.isExploding = true;
        state.liquidStream = {
            particles: [],
            duration: 0,
            maxDuration: 3 // seconds
        };
        
        // Create initial particles for the stream
        this.createLiquidStream();
        
        // Display message
        ui.showPermanentMessage("AAAAAAAAAAHH!! IM COMING!", "#ff0000", "24px");
    }
    
    resetAfterExplosion() {
        const { state } = this.game;
        
        state.isExploding = false;
        state.liquidStream = null;
        state.animationSpeed = 1;
        
        // End charge phase and move to flight
        this.endCharge();
    }
    
    createLiquidStream() {
        const { state } = this.game;
        
        // Get the tip position of the sausage
        const tipX = state.sausage.x + state.sausage.width;
        const tipY = state.sausage.y + state.sausage.height / 2;
        
        // Create initial particles
        for (let i = 0; i < 20; i++) {
            this.addLiquidParticle(tipX, tipY);
        }
    }
    
    addLiquidParticle(sourceX, sourceY) {
        const { state } = this.game;
        
        // Base speed and direction
        const baseSpeed = 5 + Math.random() * 10;
        const angle = -30 + Math.random() * 60; // -30 to 30 degrees (mostly upward)
        
        // Convert to velocities
        const speedX = baseSpeed * Math.cos(angle * Math.PI / 180);
        const speedY = -baseSpeed * Math.sin(angle * Math.PI / 180) - 2; // Negative for upward
        
        // Add a new particle
        state.liquidStream.particles.push({
            x: sourceX,
            y: sourceY,
            speedX: speedX,
            speedY: speedY,
            size: 3 + Math.random() * 5,
            gravity: 0.2,
            alpha: 0.8 + Math.random() * 0.2, // 0.8-1.0
            color: Math.random() < 0.1 ? 'rgba(255, 255, 255, ' : 'rgba(255, 255, 255, ', // Mostly white
            lifetime: 0,
            maxLifetime: 60 + Math.random() * 60 // 1-2 seconds at 60fps
        });
    }
    
    updateAndDrawLiquidStream() {
        const { ctx, state } = this.game;
        
        // Get the tip position of the sausage
        const tipX = state.sausage.x + state.sausage.width;
        const tipY = state.sausage.y + state.sausage.height / 2;
        
        // Add new particles
        for (let i = 0; i < 5; i++) {
            this.addLiquidParticle(tipX, tipY);
        }
        
        // Draw and update existing particles
        for (let i = 0; i < state.liquidStream.particles.length; i++) {
            const particle = state.liquidStream.particles[i];
            
            // Draw the particle
            ctx.fillStyle = particle.color + particle.alpha + ')';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add trail effect
            for (let t = 1; t <= 3; t++) {
                const trailAlpha = particle.alpha * (1 - t/4);
                if (trailAlpha > 0) {
                    ctx.fillStyle = particle.color + trailAlpha + ')';
                    ctx.beginPath();
                    ctx.arc(
                        particle.x - particle.speedX * (t*0.5), 
                        particle.y - particle.speedY * (t*0.5), 
                        particle.size * (1 - t/10), 
                        0, Math.PI * 2
                    );
                    ctx.fill();
                }
            }
            
            // Update physics
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.speedY += particle.gravity;
            particle.lifetime++;
            
            // Fade out as lifetime approaches max
            if (particle.lifetime > particle.maxLifetime * 0.7) {
                particle.alpha = particle.alpha * 0.95;
            }
            
            // Remove if too old or off screen
            if (particle.lifetime > particle.maxLifetime || 
                particle.y > this.game.canvas.height ||
                particle.alpha < 0.1) {
                state.liquidStream.particles.splice(i, 1);
                i--;
            }
        }
        
        // Draw glow effect at the tip
        const glowSize = 8 + Math.sin(Date.now() / 50) * 2;
        const gradient = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, glowSize * 2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(tipX, tipY, glowSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pulsing inner glow at the tip
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(tipX, tipY, glowSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    endCharge() {
        // End charge phase and switch to flight phase
        this.game.changePhase(this.game.PHASES.FLIGHT);
    }
} 