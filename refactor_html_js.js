const fs = require('fs');

// ==== REFATOR index.html ====
let html = fs.readFileSync('index.html', 'utf8');

// The emoji array to strip
const emojis = ['🏠', '🏗️', '🎲', '▶️', '🧠', '📚', '💔', '❤️', '❌', '🔄', '🎯', '✅'];
emojis.forEach(e => {
    html = html.replace(new RegExp(e, 'g'), '');
});

// Clean up the main menu button which lost its emoji
html = html.replace(/title="Home Menu"\s*style="font-size: \d+\.\d+rem;/g, 'title="Home Menu" style="font-size: 0.95rem;');
html = html.replace(/justify-content:center;"><\/button>/g, 'justify-content:center;">Home</button>');

// Wrap action buttons in academic group container
html = html.replace(/<div class="control-group action-buttons"([^>]*)>([\s\S]*?)<\/div>/g, (match, attrs, inner) => {
    if(inner.includes('id="custom-start-btn"') || inner.includes('id="start-btn"') || inner.includes('id="anim-start-btn"') || inner.includes('id="quiz-start-btn"')) {
        return `<div class="control-group action-buttons button-group-academic"${attrs}>${inner}</div>`;
    }
    return match;
});

// Clean playful texts in HTML
html = html.replace(/Welcome to Dijkstra Visualizer/g, "Dijkstra's Algorithm Visualizer");
html = html.replace(/Explore, learn, and test your knowledge of Dijkstra's algorithm and Min-Heaps with our interactive tools./g, 'An interactive academic tool for exploring pathfinding workflows and minimum priority queue behaviors.');
html = html.replace(/but watch out—3 strikes and you're out!/g, 'Limit of 3 errors before simulation failure.');
html = html.replace(/Quiz Over!/g, 'Evaluation Concluded');
html = html.replace(/You made 3 mistakes.*?try again!/g, 'Maximum error threshold reached. Please review the algorithmic methodology.');
html = html.replace(/Wrong Answer!/g, 'Incorrect Selection');
html = html.replace(/Welcome! Tap the canvas to build your custom graph./g, 'System steady. Ready for custom edge inputs.');
html = html.replace(/Welcome! Generate a graph to begin./g, 'System steady. Waiting for generation parameters.');
html = html.replace(/Generate graph and click Lock &amp; Load to start playing./g, 'Parameterization required to begin sequence.');
html = html.replace(/Lock &amp; Load Algorithm/g, 'Initialize Sequence');
html = html.replace(/Start Quiz!/g, 'Begin Evaluation');
html = html.replace(/Auto Play/g, 'Play Simulation');
html = html.replace(/Auto Rewind/g, 'Rewind Simulation');
html = html.replace(/>📚/g, '>'); 
html = html.replace(/>↺/g, '>'); 

fs.writeFileSync('index.html', html);

// ==== REFATOR script.js ====
let script = fs.readFileSync('script.js', 'utf8');

// Strip emojis
emojis.forEach(e => {
    script = script.replace(new RegExp(e, 'g'), '');
});

// Clean playful texts in JS
script = script.replace(/Disabled! Enable Negative Edges via the checkboxes to allow mathematically dangerous graphs./g, 'Action disabled: Negative edges restrict standard Dijkstra behavior. Enable explicit override if required.');
script = script.replace(/🎯 QUIZ:/g, 'EVALUATION:');
script = script.replace(/✅ Quiz Complete!/g, 'Evaluation Complete.');
script = script.replace(/❌ Incorrect choice! That is not the unvisited node with the minimum distance. Look carefully and try again./g, 'Invalid transition. Select the boundary node with the currently established minimum distance.');
script = script.replace(/Welcome! Graph ready./g, 'System initialized.');
script = script.replace(/\(Hidden — make your guess!\)/g, '(Queue state abstracted during evaluation)');

fs.writeFileSync('script.js', script);
