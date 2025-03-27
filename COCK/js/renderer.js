export class Renderer {
    constructor(game) {
        this.game = game;
    }
    
    drawCharacter(character, breathAnimState = 0) {
        try {
            const { ctx } = this.game;
            
            if (!ctx) {
                console.error('No canvas context available in drawCharacter');
                return;
            }
            
            const breathingOffset = Math.sin(Date.now() / 500) * 3;
            const armSwing = Math.sin(Date.now() / 400) * 5;
            
            // Save the context state
            ctx.save();
            
            // Draw "pants"
            ctx.fillStyle = '#800000';
            ctx.fillRect(character.x, character.y + character.height/2, character.width, character.height/2);
            
            // Draw belt
            ctx.fillStyle = '#4D0000';
            ctx.fillRect(character.x, character.y + character.height/2 - 10, character.width, 15);
            ctx.fillStyle = '#FFC800';
            ctx.fillRect(character.x + character.width/2 - 15, character.y + character.height/2 - 10, 30, 15);
            
            // Draw "shirt" with animation
            ctx.fillStyle = '#B30000';
            ctx.fillRect(character.x, character.y, character.width, character.height/2 - 10);
            
            // Add shirt details
            ctx.fillStyle = '#8A0000';
            ctx.beginPath();
            ctx.ellipse(character.x + character.width/4, character.y + character.height/5, 20, 25 + breathingOffset, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(character.x + character.width/4 * 3, character.y + character.height/5, 20, 25 + breathingOffset, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw arms
            ctx.fillStyle = '#B30000';
            ctx.fillRect(character.x - 20, character.y + 20 + armSwing, 20, 80);
            ctx.fillRect(character.x + character.width, character.y + 20 - armSwing, 20, 80);
            
            // Draw head
            ctx.fillStyle = '#800000';
            ctx.beginPath();
            ctx.arc(character.x + character.width / 2, character.y - 30, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(character.x + character.width/2 - 10, character.y - 35, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(character.x + character.width/2 + 10, character.y - 35, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            const blinkState = Math.sin(Date.now() / 2000) > 0.95 ? 0 : 1;
            if (blinkState) {
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(character.x + character.width/2 - 10, character.y - 35, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(character.x + character.width/2 + 10, character.y - 35, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Mouth
            ctx.fillStyle = '#FF6666';
            ctx.beginPath();
            ctx.arc(character.x + character.width/2, character.y - 20, 5, 0, Math.PI);
            ctx.fill();
            
            ctx.restore();
        } catch (err) {
            console.error('Error drawing character:', err);
        }
    }
    
    drawSausage(sausage, angle = 0, isFlightPhase = false) {
        if (Math.random() < 0.01) console.log('Drawing sausage at', sausage.x, sausage.y, 'with angle', angle);
        
        const { ctx } = this.game;
        
        // Save the current context state
        ctx.save();
        
        // Move to sausage position (left end at belt)
        ctx.translate(sausage.x, sausage.y + sausage.height/2);
        
        // Rotate around left end (at the belt)
        ctx.rotate(angle * Math.PI / 180);
        
        // Draw sausage body (relative to the rotation point)
        // Use white color in flight phase, red otherwise
        ctx.fillStyle = isFlightPhase ? '#FFFFFF' : '#FF4444';
        ctx.beginPath();
        
        // Use our roundRect implementation
        this.roundRect(0, -sausage.height/2, sausage.width, sausage.height, sausage.height/2);
        
        // Draw sausage details
        this.drawSausageDetails(0, -sausage.height/2, sausage.width, sausage.height, isFlightPhase);
        
        // Restore the context
        ctx.restore();
    }
    
    drawSausageDetails(x, y, width, height, isFlightPhase = false) {
        const { ctx } = this.game;
        
        // Draw texture - sausage veins
        ctx.strokeStyle = isFlightPhase ? 'rgba(220, 220, 255, 0.6)' : '#CC0000';
        ctx.lineWidth = 2;
        
        // Draw curved veins
        for (let i = 0; i < 5; i++) {
            const startX = x + width * 0.2 + (width * 0.6 * i / 5);
            
            ctx.beginPath();
            ctx.moveTo(startX, y);
            
            // Curvy line
            ctx.bezierCurveTo(
                startX + 10, y + height * 0.3,
                startX - 10, y + height * 0.7,
                startX, y + height
            );
            
            ctx.stroke();
        }
        
        // Add glistening effect - small white spots
        ctx.fillStyle = isFlightPhase ? 'rgba(220, 220, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)';
        
        for (let i = 0; i < 8; i++) {
            const spotX = x + 10 + Math.random() * (width - 20);
            const spotY = y + Math.random() * height;
            const spotSize = 2 + Math.random() * 3;
            
            ctx.beginPath();
            ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw left cap (at the belt) - rounded end
        ctx.fillStyle = isFlightPhase ? '#F0F0FF' : '#CC0000';
        ctx.beginPath();
        ctx.arc(x, y + height/2, height/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw right cap - sausage tip
        ctx.fillStyle = isFlightPhase ? '#F0F0FF' : '#CC0000';
        ctx.beginPath();
        ctx.arc(x + width, y + height/2, height/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add highlight on tip
        ctx.fillStyle = isFlightPhase ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 200, 200, 0.6)';
        ctx.beginPath();
        ctx.arc(x + width, y + height/2, height/4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Fix for roundRect if not available in the browser
    roundRect(x, y, width, height, radius) {
        const { ctx } = this.game;
        
        if (ctx.roundRect) {
            // Use native implementation if available
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, radius);
            ctx.fill();
        } else {
            // Fallback implementation
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    drawFlyingSausages(flyingSausages) {
        const { ctx } = this.game;
        
        for (let i = 0; i < flyingSausages.length; i++) {
            const sausage = flyingSausages[i];
            
            ctx.save();
            ctx.translate(sausage.x, sausage.y);
            ctx.rotate(sausage.rotation * Math.PI / 180);
            
            ctx.fillStyle = sausage.color;
            this.roundRect(-sausage.width/2, -sausage.height/2, sausage.width, sausage.height, sausage.height/2);
            
            ctx.restore();
            
            // Update physics
            sausage.x += sausage.speedX;
            sausage.y += sausage.speedY;
            sausage.speedY += sausage.gravity;
            sausage.rotation += sausage.rotationSpeed;
            
            // Check if off-screen
            if (sausage.y > this.game.canvas.height) {
                flyingSausages.splice(i, 1);
                i--;
            }
        }
    }
    
    drawFlyingClouds(flyingClouds) {
        const { ctx } = this.game;
        
        for (let i = 0; i < flyingClouds.length; i++) {
            const cloud = flyingClouds[i];
            
            ctx.fillStyle = cloud.color.replace(/[\d.]+\)$/g, `${cloud.alpha})`);
            
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size/2, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size/3, cloud.y - cloud.size/3, cloud.size/2.5, 0, Math.PI * 2);
            ctx.arc(cloud.x - cloud.size/3, cloud.y - cloud.size/4, cloud.size/2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Update physics
            cloud.x += cloud.speedX;
            cloud.y += cloud.speedY;
            cloud.speedY += cloud.gravity;
            cloud.alpha -= 0.01;
            
            if (cloud.alpha <= 0 || cloud.y > this.game.canvas.height) {
                flyingClouds.splice(i, 1);
                i--;
            }
        }
    }
    
    drawExplosion(x, y, size, alpha) {
        const { ctx } = this.game;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(255, 200, 50, ${alpha * 0.8})`);
        gradient.addColorStop(0.7, `rgba(255, 50, 0, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Particles
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * size * 0.8;
            const particleX = x + Math.cos(angle) * distance;
            const particleY = y + Math.sin(angle) * distance;
            const particleSize = 2 + Math.random() * 5;
            
            ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawClickEffects(clickEffects) {
        const { ctx } = this.game;
        
        for (let i = 0; i < clickEffects.length; i++) {
            const effect = clickEffects[i];
            
            if (effect.active) {
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 3;
                ctx.globalAlpha = effect.alpha;
                
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                effect.radius += 2;
                effect.alpha -= 0.03;
                
                if (effect.radius >= effect.maxRadius || effect.alpha <= 0) {
                    effect.active = false;
                }
            }
        }
        
        ctx.globalAlpha = 1;
        
        // Remove inactive effects
        for (let i = clickEffects.length - 1; i >= 0; i--) {
            if (!clickEffects[i].active) {
                clickEffects.splice(i, 1);
            }
        }
    }
    
    drawFlightScene(state) {
        const { ctx, canvas } = this.game;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#E0F7FF');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Background clouds
        const cloudCount = 5;
        for (let i = 0; i < cloudCount; i++) {
            const x = (i / cloudCount) * canvas.width;
            const y = 50 + Math.sin(x * 0.01) * 20;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
            ctx.arc(x - 25, y - 5, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ground
        const groundY = canvas.height - 50;
        const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
        groundGradient.addColorStop(0, '#8B4513');
        groundGradient.addColorStop(1, '#654321');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
        
        // Obstacles
        this.drawObstacles(state.obstacles, state.flightDistance);
        
        // Sausage position
        const sausageX = 150;
        const sausageY = canvas.height - 50 - state.flightHeight;
        const customSausage = {
            x: sausageX,
            y: sausageY,
            width: 80,
            height: 20,
            color: '#590000'
        };
        
        // Angle based on velocity
        const angle = Math.atan2(-state.flightSpeed * 0.25, state.flightSpeed) * 180 / Math.PI;
        this.drawSausage(customSausage, angle);
        
        // Distance marker
        this.drawDistanceMarker(state.flightDistance);
    }
    
    drawObstacles(obstacles, flightDistance) {
        const { ctx, canvas } = this.game;
        
        for (const obstacle of obstacles) {
            const relativeDistance = obstacle.distance - flightDistance;
            
            if (relativeDistance > -100 && relativeDistance < 700) {
                const obstacleX = 150 + relativeDistance * 0.5;
                const obstacleY = canvas.height - 50 - obstacle.heightFromGround;
                
                if (obstacle.broken) {
                    // Draw broken building
                    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                    ctx.fillRect(
                        obstacleX, 
                        obstacleY - obstacle.height, 
                        obstacle.width, 
                        obstacle.height
                    );
                    
                    // Broken pieces and debris
                    const pieceCount = 10;
                    ctx.fillStyle = obstacle.color;
                    
                    for (let i = 0; i < pieceCount; i++) {
                        const pieceX = obstacleX + Math.random() * obstacle.width;
                        const pieceY = obstacleY - Math.random() * 50;
                        const pieceSize = 5 + Math.random() * 15;
                        
                        ctx.beginPath();
                        ctx.moveTo(pieceX, pieceY);
                        ctx.lineTo(pieceX + pieceSize, pieceY + pieceSize / 2);
                        ctx.lineTo(pieceX + pieceSize / 2, pieceY + pieceSize);
                        ctx.lineTo(pieceX - pieceSize / 2, pieceY + pieceSize / 2);
                        ctx.closePath();
                        ctx.fill();
                    }
                } else {
                    // Draw building base
                    ctx.fillStyle = obstacle.color;
                    ctx.fillRect(
                        obstacleX, 
                        obstacleY - obstacle.height, 
                        obstacle.width, 
                        obstacle.height
                    );
                    
                    // Building highlights/shadow
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.fillRect(
                        obstacleX, 
                        obstacleY - obstacle.height, 
                        obstacle.width * 0.3, 
                        obstacle.height
                    );
                    
                    // Draw building details (windows)
                    const windowRows = Math.floor(obstacle.height / 30);
                    const windowCols = Math.floor(obstacle.width / 20);
                    
                    // Window pattern
                    ctx.fillStyle = 'rgba(255, 255, 200, 0.3)'; // Lit windows
                    
                    for (let row = 0; row < windowRows; row++) {
                        for (let col = 0; col < windowCols; col++) {
                            // Skip some windows randomly to create pattern
                            if (Math.random() < 0.3) continue;
                            
                            const windowX = obstacleX + 5 + col * 20;
                            const windowY = obstacleY - obstacle.height + 10 + row * 30;
                            const windowWidth = 10;
                            const windowHeight = 15;
                            
                            // Random window color (some lit, some dark)
                            ctx.fillStyle = Math.random() < 0.7 ? 
                                'rgba(255, 255, 150, 0.5)' : 
                                'rgba(50, 50, 80, 0.7)';
                                
                            ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
                        }
                    }
                    
                    // Building top
                    ctx.fillStyle = 'rgba(80, 80, 80, 0.8)';
                    ctx.fillRect(
                        obstacleX - 5, 
                        obstacleY - obstacle.height, 
                        obstacle.width + 10, 
                        8
                    );
                    
                    // Building name/number (if close enough)
                    if (relativeDistance < 300) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.font = '12px Arial';
                        ctx.textAlign = 'center';
                        
                        // Show building number or name
                        const buildingNum = Math.floor(obstacle.distance / 100);
                        ctx.fillText(`B-${buildingNum}`, obstacleX + obstacle.width/2, obstacleY - obstacle.height + 25);
                    }
                }
            }
        }
    }
    
    drawDistanceMarker(distance) {
        const { ctx } = this.game;
        
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.fillText(`Distance: ${Math.floor(distance)}m`, 20, 30);
    }
    
    drawResultsScreen(distanceGained) {
        const { ctx, canvas } = this.game;
        
        // Background
        const characterX = canvas.width / 2;
        const characterY = canvas.height / 2;
        
        const gradient = ctx.createRadialGradient(
            characterX, characterY, 0,
            characterX, characterY, canvas.width
        );
        gradient.addColorStop(0, '#FFCC99');
        gradient.addColorStop(1, '#FF6666');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Result text
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#FFC800';
        ctx.textAlign = 'center';
        ctx.fillText('FLIGHT RESULTS', canvas.width / 2, 70);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Distance: ${Math.floor(distanceGained)}m`, canvas.width / 2, 120);
        
        // Rewards
        const sausageCoinsGained = Math.floor(distanceGained / 10);
        const meatTokensGained = Math.floor(distanceGained / 50);
        const dnaGained = Math.floor(distanceGained / 500);
        
        ctx.font = '20px Arial';
        ctx.fillText(`Rewards:`, canvas.width / 2, 170);
        ctx.fillText(`${sausageCoinsGained} 🌭`, canvas.width / 2, 200);
        ctx.fillText(`${meatTokensGained} 🥩`, canvas.width / 2, 230);
        if (dnaGained > 0) {
            ctx.fillText(`${dnaGained} 🧬`, canvas.width / 2, 260);
        }
        
        // Fireworks
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * canvas.width;
            const y = 100 + Math.random() * (canvas.height - 200);
            const size = 20 + Math.random() * 30;
            const hue = Math.random() * 360;
            
            ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${Math.random() * 0.5 + 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Particles
            for (let j = 0; j < 8; j++) {
                const angle = j * Math.PI / 4;
                const particleX = x + Math.cos(angle) * size * 1.5;
                const particleY = y + Math.sin(angle) * size * 1.5;
                const particleSize = 5 + Math.random() * 10;
                
                ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${Math.random() * 0.7 + 0.3})`;
                ctx.beginPath();
                ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Continue button
        ctx.fillStyle = '#4C8C4A';
        this.roundRect(canvas.width / 2 - 100, canvas.height - 80, 200, 50, 10);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('CONTINUE', canvas.width / 2, canvas.height - 45);
    }
} 