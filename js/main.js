// Main entry point for the game
console.log('Loading game modules...');

// Make sure we wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game modules...');
    
    try {
        import('./game.js')
        .then(module => {
            const { Game } = module;
            console.log('Game module loaded successfully!');
            
            try {
                console.log('Creating game instance...');
                // Debug DOM elements
                const canvas = document.getElementById('gameCanvas');
                console.log('Canvas element:', canvas);
                
                if (canvas) {
                    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
                    console.log('Canvas found, initializing game...');
                    
                    // Set the initial canvas size
                    canvas.width = 600;
                    canvas.height = 400;
                    
                    // Create and initialize the game
                    const game = new Game();
                    console.log('Game instance created, initializing...');
                    
                    // Small delay to ensure everything is loaded
                    setTimeout(() => {
                        game.initialize();
                        console.log('Game started successfully!');
                    }, 100);
                } else {
                    console.error('Could not find canvas element');
                }
                
                console.log('UI elements:');
                console.log('- clickCounter:', document.getElementById('clickCounter'));
                console.log('- gamePhase:', document.getElementById('gamePhase'));
                console.log('- gameTimer:', document.getElementById('gameTimer'));
                console.log('- powerFill:', document.getElementById('powerFill'));
            } catch (err) {
                console.error('Error initializing game:', err);
            }
        })
        .catch(err => {
            console.error('Error loading Game module:', err);
        });
    } catch (err) {
        console.error('Error in main.js:', err);
    }
}); 