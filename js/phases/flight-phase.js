export class FlightPhase {
    constructor(game) {
        this.game = game;
        this.flightDuration = 0;
        this.maxFlightDuration = 45; // seconds - increased to 45 seconds for even longer flights
        this.gravity = 0.15; // Reduced from 0.2 to allow longer horizontal flight
        this.airResistance = 0.002; // Reduced for better flight
        this.groundLevel = 350;
        this.hasLanded = false;
        
        // Background elements
        this.stars = [];
        this.generateStars(50);
    }
    
    generateStars(count) {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.game.canvas.width,
                y: Math.random() * (this.groundLevel - 50),
                size: 1 + Math.random() * 3,
                speed: 0.5 + Math.random() * 2,
                color: `rgba(${155 + Math.random() * 100}, ${155 + Math.random() * 100}, ${255}, ${0.5 + Math.random() * 0.5})`
            });
        }
    }
    
    start() {
        const { state, ui } = this.game;
        
        console.log('Starting flight phase with power:', state.chargePower);
        
        // Reset flight variables
        state.isFlying = true;
        state.flightDistance = 0;
        state.flightHeight = 0;
        this.hasLanded = false;
        this.flightDuration = 0;
        
        // Calculate initial velocities based on charge power
        // This is what translates charge power to horizontal distance
        const throwPowerValue = this.game.upgradeManager.getUpgradeValue('throwPower');
        
        // Increased base velocity calculation to reach 5000m with full charge
        // Multiplied by 8 (was 5) to achieve maximum flight distance
        this.velocityX = (state.chargePower / 1000) * 8 * throwPowerValue;
        
        // Controls height of the arc
        this.velocityY = -12; // Negative for initial upward movement
        
        // Set the ground level
        this.groundLevel = this.game.canvas.height - 50;
        
        // Create obstacles
        state.generateObstacles();
        
        // Update UI
        ui.updateGamePhase(this.game.PHASES.FLIGHT);
        
        // Show flight power in UI
        ui.showMessage(`Flight Power: ${Math.round(this.velocityX)}`, 2000);
        
        // Display flight distance multiplier if it exists
        if (state.flightDistanceMultiplier && state.flightDistanceMultiplier > 1) {
            setTimeout(() => {
                ui.showMessage(`Distance Multiplier: x${state.flightDistanceMultiplier.toFixed(1)}`, 2000);
            }, 2200);
        }
        
        // Regenerate stars for the new canvas size
        this.generateStars(50);
        
        // Initial visual effect
        ui.showMessage("VVVVVRRRRRROOOM!", 1000);
    }
    
    update() {
        const { state } = this.game;
        
        if (state.isFlying && !this.hasLanded) {
            // Update flight duration
            this.flightDuration += 1/60; // Assumes 60 FPS
            
            // Debug log every few frames to see what's happening
            if (Math.random() < 0.05) {
                console.log('Flight update:', 
                    'Distance:', state.flightDistance.toFixed(2), 
                    'Height:', state.flightHeight.toFixed(2),
                    'VelX:', this.velocityX.toFixed(2),
                    'VelY:', this.velocityY.toFixed(2));
            }
            
            // Update velocity with gravity
            this.velocityY += this.gravity;
            
            // Minimized air resistance for much longer flights
            this.velocityX *= 0.998; // Almost no drag to reach 5000m (was 0.995)
            
            // Force minimum velocity
            this.velocityX = Math.max(1, this.velocityX);
            
            // Apply flightDistanceMultiplier if it exists
            let distanceMultiplier = 1;
            if (state.flightDistanceMultiplier) {
                distanceMultiplier = state.flightDistanceMultiplier;
            }
            
            // Update position with current velocities and apply multiplier
            state.flightDistance += this.velocityX * distanceMultiplier;
            state.flightHeight -= this.velocityY; // Note: negative because we're using screen coordinates
            
            // Keep maximum height limited to prevent too high flights
            if (state.flightHeight > this.game.canvas.height * 0.6) {
                state.flightHeight = this.game.canvas.height * 0.6;
                this.velocityY = Math.max(this.velocityY, 0); // Force downward motion
            }
            
            // Artificially cap maximum distance at 5,000 meters with gentler slowdown
            if (state.flightDistance > 5000) {
                // Slower deceleration after 5,000 meters to allow reaching it
                this.velocityX *= 0.95; // Was 0.9, now gentler to allow reaching 5000m
                
                // Force landing if significantly over the limit
                if (state.flightDistance > 5200) { // Increased from 5500 to end flight faster after goal
                    this.velocityY = Math.max(this.velocityY, 7); // Force stronger downward motion
                }
            }
            
            // Keep sausage at a fixed X on screen - scale to canvas width
            state.sausage.x = this.game.canvas.width * 0.2;
            
            // Update Y position based on height - make sure to convert from distance to screen position
            state.sausage.y = this.groundLevel - state.sausage.height - state.flightHeight;
            
            // Make sure sausage doesn't go below ground
            if (state.sausage.y + state.sausage.height > this.groundLevel) {
                state.sausage.y = this.groundLevel - state.sausage.height;
                this.landSausage();
            }
            
            // Make sure sausage doesn't go above screen
            if (state.sausage.y < 0) {
                state.sausage.y = 0;
            }
            
            // Create smoke trail
            this.createSmokeTrail();
            
            // Update particles
            this.updateParticles();
            
            // Update stars (parallax background)
            this.updateStars();
            
            // Check for collisions with obstacles
            this.checkObstacleCollisions();
            
            // Check if flight should end due to maximum flight duration
            if (this.flightDuration > this.maxFlightDuration) {
                this.endFlight();
            }
        }
    }
    
    updateStars() {
        // Move stars based on flight speed for parallax effect
        for (const star of this.stars) {
            star.x -= star.speed * (this.velocityX / 5);
            
            // Wrap stars to the other side when they go off screen
            if (star.x < 0) {
                star.x = this.game.canvas.width;
                star.y = Math.random() * (this.groundLevel - 50);
            }
        }
    }
    
    render() {
        const { ctx, canvas, renderer, state } = this.game;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw sky - black background
        ctx.fillStyle = '#000022'; // Dark blue for space feel
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw stars
        this.drawStars();
        
        // Draw flight path line
        this.drawFlightPath();
        
        // Draw ground
        ctx.fillStyle = '#553311';
        ctx.fillRect(0, this.groundLevel, canvas.width, canvas.height - this.groundLevel);
        
        // Draw distance meter
        this.drawDistanceMeter(state.flightDistance);
        
        // Draw velocity indicator
        this.drawVelocityIndicator();
        
        // Draw obstacles
        this.drawObstacles();
        
        // Draw flying sausages (particles)
        renderer.drawFlyingSausages(state.flyingSausages);
        
        // Draw smoke trail
        this.drawSmokeTrail();
        
        // Draw sausage with rotation - using white version for flight phase
        const rotationAngle = Math.atan2(this.velocityY, this.velocityX) * (180/Math.PI);
        renderer.drawSausage(state.sausage, rotationAngle, true); // true = isFlightPhase
    }
    
    drawStars() {
        const { ctx } = this.game;
        
        for (const star of this.stars) {
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawDistanceMeter(distance) {
        const { ctx, canvas } = this.game;
        
        // Maximum possible distance
        const maxDistance = 5000;
        
        // Draw a distance meter at the top of the screen
        const meterWidth = canvas.width * 0.6;
        const meterHeight = 25; // Increased height
        const meterX = canvas.width * 0.2;
        const meterY = 30;
        
        // Draw background with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Darker background
        ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw progress
        const progress = Math.min(distance / maxDistance, 1.0);
        
        // Choose color based on distance - gradient from green to red
        let progressColor;
        if (progress < 0.25) {
            progressColor = '#2ecc71'; // Green
        } else if (progress < 0.5) {
            progressColor = '#f1c40f'; // Yellow
        } else if (progress < 0.75) {
            progressColor = '#e67e22'; // Orange
        } else {
            progressColor = '#e74c3c'; // Red
        }
        
        // Create gradient for fill
        const gradient = ctx.createLinearGradient(meterX, meterY, meterX, meterY + meterHeight);
        gradient.addColorStop(0, progressColor);
        gradient.addColorStop(1, shadeColor(progressColor, -20)); // Darker shade at bottom
        
        ctx.fillStyle = gradient;
        ctx.fillRect(meterX, meterY, meterWidth * progress, meterHeight);
        
        // Inner highlight (add 3D effect)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(meterX, meterY, meterWidth * progress, meterHeight / 2);
        
        // Draw border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
        
        // Draw markers with clearer labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 1; i <= 5; i++) {
            const markerX = meterX + (meterWidth * (i / 5));
            ctx.fillRect(markerX - 1, meterY, 2, meterHeight);
            
            // Draw distance labels
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i}km`, markerX, meterY - 5);
        }
        
        // Draw current distance text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(distance)}m`, meterX + meterWidth / 2, meterY + meterHeight / 2);
        
        // Add a flag icon at 5000m
        const flagX = meterX + meterWidth;
        
        // Draw flag pole
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(flagX, meterY - 15);
        ctx.lineTo(flagX, meterY + meterHeight + 15);
        ctx.stroke();
        
        // Draw flag
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(flagX, meterY - 15);
        ctx.lineTo(flagX - 15, meterY - 5);
        ctx.lineTo(flagX, meterY + 5);
        ctx.closePath();
        ctx.fill();
        
        // Draw max text
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('MAX', flagX - 20, meterY + 10);
        
        // Helper function to darken a color
        function shadeColor(color, percent) {
            let R = parseInt(color.substring(1, 3), 16);
            let G = parseInt(color.substring(3, 5), 16);
            let B = parseInt(color.substring(5, 7), 16);
            
            R = parseInt(R * (100 + percent) / 100);
            G = parseInt(G * (100 + percent) / 100);
            B = parseInt(B * (100 + percent) / 100);
            
            R = (R < 255) ? R : 255;
            G = (G < 255) ? G : 255;
            B = (B < 255) ? B : 255;
            
            const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
            const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
            const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));
            
            return "#" + RR + GG + BB;
        }
    }
    
    drawVelocityIndicator() {
        const { ctx } = this.game;
        
        // Show current velocity
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Speed: ${Math.round(this.velocityX * 10)}km/h`, 20, 80);
        
        // Arrow showing trajectory
        const angle = Math.atan2(this.velocityY, this.velocityX);
        const arrowLength = 40;
        const arrowX = 100;
        const arrowY = 90;
        
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        
        // Draw arrow
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(arrowLength, 0);
        ctx.lineTo(arrowLength - 10, -5);
        ctx.moveTo(arrowLength, 0);
        ctx.lineTo(arrowLength - 10, 5);
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawSmokeTrail() {
        const { ctx, state } = this.game;
        
        // Update existing smoke particles
        for (let i = 0; i < state.flyingClouds.length; i++) {
            const cloud = state.flyingClouds[i];
            
            // Draw the cloud
            ctx.fillStyle = cloud.color.replace(/[\d.]+\)$/g, `${cloud.alpha})`);
            
            // Draw a more detailed cloud shape for the white sausage trail
            ctx.beginPath();
            
            // Main circle
            ctx.arc(cloud.x, cloud.y, cloud.size/2, 0, Math.PI * 2);
            
            // Additional circles to create irregular cloud shape
            const numBubbles = 4 + Math.floor(Math.random() * 3);
            for (let j = 0; j < numBubbles; j++) {
                const angle = j * (Math.PI * 2 / numBubbles);
                const distance = cloud.size * 0.3;
                const bubbleX = cloud.x + Math.cos(angle) * distance;
                const bubbleY = cloud.y + Math.sin(angle) * distance;
                const bubbleSize = cloud.size * (0.3 + Math.random() * 0.2);
                
                ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            }
            
            ctx.fill();
            
            // Update physics
            cloud.x += cloud.speedX;
            cloud.y += cloud.speedY;
            cloud.speedY += cloud.gravity;
            cloud.alpha -= 0.01;
            cloud.size += 0.2; // Gradually expand
            
            // Remove if faded or off-screen
            if (cloud.alpha <= 0 || 
                cloud.y > this.groundLevel || 
                cloud.x < 0 || 
                cloud.x > this.game.canvas.width) {
                state.flyingClouds.splice(i, 1);
                i--;
            }
        }
    }
    
    end() {
        // Clean up anything needed when phase ends
        this.game.state.isFlying = false;
    }
    
    landSausage() {
        const { state } = this.game;
        
        // Mark as landed to prevent further physics updates
        this.hasLanded = true;
            state.isFlying = false;
        
        // Add the flight distance to the total distance
        state.addDistance(Math.round(state.flightDistance));
        
        // Wait a second before showing results
        setTimeout(() => {
            this.endFlight();
        }, 1000);
    }
    
    endFlight() {
        // Switch to result phase
        this.game.changePhase(this.game.PHASES.RESULT);
    }
    
    checkObstacleCollisions() {
        const { state } = this.game;
        
        for (const obstacle of state.obstacles) {
            // Skip obstacles that are already broken
            if (obstacle.broken) continue;
            
            // Check if sausage is at the obstacle distance - increased collision tolerance
            if (Math.abs(state.flightDistance - obstacle.distance) < 60) {
                console.log('Near obstacle at distance:', obstacle.distance);
                
                // Check if sausage height collides with obstacle
                const sausageBottom = this.groundLevel - state.flightHeight;
                const sausageTop = sausageBottom - state.sausage.height;
                const obstacleTop = this.groundLevel - obstacle.heightFromGround - obstacle.height;
                const obstacleBottom = this.groundLevel - obstacle.heightFromGround;
                
                const verticalCollision = 
                    (sausageBottom >= obstacleTop && sausageBottom <= obstacleBottom) ||
                    (sausageTop <= obstacleBottom && sausageTop >= obstacleTop) ||
                    (sausageTop <= obstacleTop && sausageBottom >= obstacleBottom);
                
                if (verticalCollision) {
                    console.log('Collision with obstacle!');
                    // Collision detected!
                    obstacle.broken = true;
                    
                    // Reduce velocity based on obstacle type
                    this.velocityX *= 0.9 - (obstacle.type * 0.05);
                    
                    // Award tokens & DNA for breaking obstacles
                    // Award 2 meat tokens for breaking an obstacle
                    state.meatTokens += 2;
                    state.updateCurrency('meatTokens');
                    
                    // Award 1 sausage DNA for breaking an obstacle
                    state.sausageDNA += 1;
                    state.updateCurrency('sausageDNA');
                    
                    // Visual feedback
                    this.game.ui.showMessage(`+2 🥩 +1 🧬`, 1000);
                    
                    // Create explosion effect
                    this.createObstacleExplosion(150, sausageBottom);
                }
            }
        }
    }
    
    createObstacleExplosion(x, y) {
        const { state } = this.game;
        
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            
            state.flyingSausages.push({
                x: x,
                y: y,
                width: 5 + Math.random() * 15,
                height: 5 + Math.random() * 15,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed - 2, // Initial upward velocity
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 20,
                gravity: 0.2,
                color: `#${Math.floor(Math.random() * 155 + 100).toString(16)}${Math.floor(Math.random() * 100).toString(16)}${Math.floor(Math.random() * 50).toString(16)}`
            });
        }
    }
    
    drawObstacles() {
        const { ctx, canvas, state } = this.game;
        
        // Fixed X position for sausage - scaled to canvas width
        const sausageFixedX = canvas.width * 0.2;
        
        // Calculate visual scale for 5000 meters to fit within screen
        const distanceScale = canvas.width * 0.7 / 5000; // Adjusted from 0.8 to 0.7 for better spacing
        
        // Draw the flight path grid
        this.drawDistanceGrid(distanceScale, sausageFixedX);
        
        for (const obstacle of state.obstacles) {
            // Calculate screen position based on relative distance from sausage
            const relativeDistance = obstacle.distance - state.flightDistance;
            // Scale distances to fit max range on screen
            const screenX = sausageFixedX + (relativeDistance * distanceScale);
            
            // Only draw if on screen or close to it
            if (screenX > -obstacle.width * 2 && screenX < canvas.width + obstacle.width) {
                const screenY = this.groundLevel - obstacle.heightFromGround - obstacle.height;
                
                // Draw obstacle with glow effect for visibility
                if (!obstacle.broken) {
                    // Stronger glow effect for better visibility
                    const glow = ctx.createRadialGradient(
                        screenX + obstacle.width/2, screenY + obstacle.height/2, 1,
                        screenX + obstacle.width/2, screenY + obstacle.height/2, obstacle.width * 1.5
                    );
                    glow.addColorStop(0, 'rgba(255, 100, 0, 0.7)');
                    glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
                    
                    ctx.fillStyle = glow;
                    ctx.fillRect(screenX - obstacle.width/2, screenY - obstacle.height/2, 
                                 obstacle.width * 2, obstacle.height * 2);
                    
                    // Draw a pulsing outline around obstacles
                    const pulseIntensity = (Math.sin(Date.now() / 300) + 1) / 2; // 0-1 pulsing value
                    ctx.strokeStyle = `rgba(255, 200, 0, ${0.3 + pulseIntensity * 0.7})`;
                    ctx.lineWidth = 3;
                    ctx.strokeRect(screenX - 5, screenY - 5, obstacle.width + 10, obstacle.height + 10);
                }
                
                // Draw main obstacle
                ctx.fillStyle = obstacle.broken ? '#555555' : obstacle.color;
                ctx.fillRect(screenX, screenY, obstacle.width, obstacle.height);
                
                // Draw obstacle details
                if (!obstacle.broken) {
                    // Highlight
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(screenX, screenY, obstacle.width, 5);
                    
                    // Pattern/texture
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < obstacle.type * 3; i++) {
                        const lineY = screenY + (obstacle.height / (obstacle.type * 3 + 1)) * (i + 1);
                        ctx.beginPath();
                        ctx.moveTo(screenX, lineY);
                        ctx.lineTo(screenX + obstacle.width, lineY);
                        ctx.stroke();
                    }
                } else {
                    // Draw broken effect
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                    ctx.lineTo(screenX + obstacle.width, screenY + obstacle.height);
                    ctx.moveTo(screenX + obstacle.width, screenY);
                    ctx.lineTo(screenX, screenY + obstacle.height);
                    ctx.stroke();
                }
                
                // Draw distance indicator for clarity
                if (!obstacle.broken) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${Math.round(obstacle.distance)}m`, screenX + obstacle.width/2, screenY - 10);
                }
            }
            
            // Distance indicator if far away but coming up (improved version)
            if (relativeDistance > 0 && relativeDistance < 1500 && screenX > canvas.width) {
                // Make the approaching obstacle warning more prominent
                const warningOpacity = Math.min(1, 1 - relativeDistance/1500);
                
                // Draw a triangle/arrow indicator
                ctx.fillStyle = `rgba(255, 50, 50, ${warningOpacity})`;
                
                // Bigger arrow
                const arrowSize = 20;
                const arrowX = canvas.width - 20;
                const arrowY = this.groundLevel - obstacle.heightFromGround - obstacle.height/2;
                
                // Pulsing effect for important warning
                const pulse = Math.sin(Date.now() / 200) > 0 ? 1 : 0.7;
                
                // Draw arrow
                ctx.save();
                ctx.globalAlpha = pulse * warningOpacity;
                
                // Triangle pointing left
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX + arrowSize, arrowY - arrowSize);
                ctx.lineTo(arrowX + arrowSize, arrowY + arrowSize);
                ctx.closePath();
                ctx.fill();
                
                // Add distance text
                ctx.fillStyle = `rgba(255, 255, 255, ${pulse * warningOpacity})`;
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(`${Math.round(relativeDistance)}m`, arrowX - 10, arrowY + 5);
                
                // Draw warning line to indicate height
                ctx.strokeStyle = `rgba(255, 50, 50, ${0.5 * warningOpacity})`;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(canvas.width, arrowY);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.restore();
            }
        }
    }
    
    drawDistanceGrid(distanceScale, sausageFixedX) {
        const { ctx, canvas } = this.game;
        
        // Draw distance markings on the ground for better visual reference
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        // Draw kilometer markings
        for (let km = 1; km <= 5; km++) {
            const kmX = sausageFixedX + (km * 1000 * distanceScale);
            
            // Skip if off screen
            if (kmX < 0 || kmX > canvas.width) continue;
            
            // Vertical line
            ctx.beginPath();
            ctx.moveTo(kmX, this.groundLevel - 40);
            ctx.lineTo(kmX, this.groundLevel + 20);
            ctx.stroke();
            
            // Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${km}km`, kmX, this.groundLevel + 40);
        }
        
        // Draw 500m markings
        for (let m = 500; m < 5000; m += 500) {
            if (m % 1000 === 0) continue; // Skip kilometer marks
            
            const mX = sausageFixedX + (m * distanceScale);
            
            // Skip if off screen
            if (mX < 0 || mX > canvas.width) continue;
            
            // Shorter vertical line
            ctx.beginPath();
            ctx.moveTo(mX, this.groundLevel - 20);
            ctx.lineTo(mX, this.groundLevel + 10);
            ctx.stroke();
            
            // Smaller label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${m/1000}km`, mX, this.groundLevel + 30);
        }
    }
    
    drawFlightPath() {
        const { ctx } = this.game;
        
        // Draw an arc showing the approximated flight path
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        
        const startX = 150;
        const startY = this.game.state.sausage.y + this.game.state.sausage.height/2;
        
        // Calculate arc parameters based on velocity
        const arcHeight = -this.velocityY * 10;
        const arcWidth = this.velocityX * 20;
        
        // Draw a simple parabola as the flight path prediction
        for (let i = 0; i < 20; i++) {
            const t = i / 19;
            const x = startX + arcWidth * t;
            
            // Parabolic path y = at² + bt + c
            const y = startY + arcHeight * t - 0.5 * this.gravity * 100 * t * t;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // New method to separate smoke trail creation from drawing
    createSmokeTrail() {
        const { state } = this.game;
        
        // Don't add too many smoke particles to avoid performance issues
        if (state.flyingClouds.length > 50) return;
        
        // Create white smoke particles with blue accents for the white sausage
        // Add random rotation to make it look more dynamic
        const angle = Math.random() * 360;
        const distance = 5 + Math.random() * 10;
        
        // Calculate particle starting position based on sausage angle
        const offsetX = Math.cos(angle * Math.PI / 180) * distance;
        const offsetY = Math.sin(angle * Math.PI / 180) * distance;
        
        // Create particle at sausage position with offset
        const particle = {
            x: state.sausage.x + state.sausage.width/2 + offsetX,
            y: state.sausage.y + state.sausage.height/2 + offsetY,
            size: 10 + Math.random() * 15,
            speedX: -this.velocityX * 0.05 + (Math.random() - 0.5) * 2,
            speedY: -this.velocityY * 0.05 + (Math.random() - 0.5) * 2,
            gravity: 0.02,
            alpha: 0.7 + Math.random() * 0.3,
            // Create white smoke with blue tint for contrast
            color: Math.random() < 0.3 ? 
                   `rgba(220, 220, 255, 1)` : 
                   `rgba(255, 255, 255, 1)`
        };
        
        state.flyingClouds.push(particle);
    }
    
    // New method to update all particles
    updateParticles() {
        const { state } = this.game;
        
        // Update smoke particles
        for (let i = 0; i < state.flyingClouds.length; i++) {
            const cloud = state.flyingClouds[i];
            
            // Update position
            cloud.x += cloud.speedX;
            cloud.y += cloud.speedY;
            cloud.speedY += cloud.gravity;
            cloud.alpha -= 0.015; // Slower fade out for longer trail
            cloud.size += 0.3; // Slower size increase
            
            // Remove if faded out
            if (cloud.alpha <= 0 || cloud.x < -cloud.size) {
                state.flyingClouds.splice(i, 1);
                i--;
            }
        }
        
        // Update explosion particles
        for (let i = 0; i < state.flyingSausages.length; i++) {
            const particle = state.flyingSausages[i];
            
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.speedY += particle.gravity;
            particle.rotation += particle.rotationSpeed;
            
            // Check if off-screen
            if (particle.y > this.groundLevel || particle.x < -particle.width || particle.x > this.game.canvas.width + particle.width) {
                state.flyingSausages.splice(i, 1);
                i--;
            }
        }
    }
} 