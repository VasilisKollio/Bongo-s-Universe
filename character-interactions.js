// Fixed character-interaction.js

// Character Animation Enhancements
document.addEventListener('DOMContentLoaded', function() {
    console.log("Character interaction script is running!");
    
    // Get the character element
    const character = document.querySelector('.pixel-character');
    const container = document.querySelector('.stock-ticker-container');
    
    if (!character || !container) {
        console.error("Character or container elements not found!");
        return;
    }
    
    console.log("Character and container elements found");
    
    // Track if character is currently jumping
    let isJumping = false;
    
    // Make character jump when clicking on ticker
    container.addEventListener('click', function(e) {
        // Prevent multiple jumps
        if (isJumping) return;
        
        isJumping = true;
        
        // Add jump class
        character.classList.add('character-jump');
        
        // Remove jump class after animation completes
        setTimeout(() => {
            character.classList.remove('character-jump');
            isJumping = false;
        }, 500);
    });
    
    // Make character follow cursor on hover (subtle movement)
    container.addEventListener('mousemove', function(e) {
        // Calculate position relative to ticker center
        const tickerRect = container.getBoundingClientRect();
        const centerX = tickerRect.width / 2;
        const mouseX = e.clientX - tickerRect.left;
        
        // Calculate distance from center (as percentage of container width)
        const offsetPercent = (mouseX - centerX) / centerX;
        
        // Apply a subtle vertical tilt based on mouse position
        // This creates the effect of character "watching" the cursor
        character.style.transform = `translateY(${offsetPercent * -5}px)`;
    });
    
    // Reset transform when mouse leaves
    container.addEventListener('mouseleave', function() {
        character.style.transform = '';
    });
    
    // Make character react to stock changes
    // This function would be called when stock data updates
    // RENAMED FUNCTION to avoid recursion
    window.updateCharacterMoodState = function(stocksUp, stocksDown) {
        console.log(`Updating character mood: Up stocks: ${stocksUp}, Down stocks: ${stocksDown}`);
        
        // Calculate if more stocks are up or down
        const mood = stocksUp >= stocksDown ? 'happy' : 'sad';
        
        // Update character mood
        character.setAttribute('data-mood', mood);
        
        // If most stocks are up, make character jump happily
        if (mood === 'happy' && !isJumping) {
            character.classList.add('character-excited');
            setTimeout(() => {
                character.classList.remove('character-excited');
            }, 2000);
        }
    };
    
    // Make the character react to clicks directly on him
    character.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent container click from firing
        
        // Play a special animation when clicked
        character.classList.add('character-clicked');
        
        // Show a speech bubble
        showSpeechBubble();
        
        // Remove the clicked class after animation
        setTimeout(() => {
            character.classList.remove('character-clicked');
        }, 500);
    });
    
    // Function to show a speech bubble with market commentary
    function showSpeechBubble() {
        // Create speech bubble if it doesn't exist
        let bubble = document.querySelector('.speech-bubble');
        if (!bubble) {
            bubble = document.createElement('div');
            bubble.className = 'speech-bubble';
            document.querySelector('.walking-character-container').appendChild(bubble);
        }
        
        // Get random market quote
        const quotes = [
            "To the moon! 🚀",
            "Buy low, sell high!",
            "Stonks only go up!",
            "Bears and bulls!",
            "Diamond hands! 💎",
            "Time in market > timing market",
            "HODL!",
            "What a volatile day!",
            "Market looks bullish!",
            "Buying the dip!"
        ];
        
        // Select random quote
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        // Set content and show bubble
        bubble.textContent = randomQuote;
        bubble.classList.add('show-bubble');
        
        // Hide bubble after 3 seconds
        setTimeout(() => {
            bubble.classList.remove('show-bubble');
        }, 3000);
    }
});