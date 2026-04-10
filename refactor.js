const fs = require('fs');
let css = fs.readFileSync('style.css', 'utf8');

// 1. Root variables
css = css.replace(/:root\s*\{[\s\S]*?\}/, `:root {
    --bg-color: #ffffff;
    --sidebar-bg: #fafafa;
    --text-main: #111827;
    --primary: #2563eb;
    --primary-hover: #1d4ed8;
    --border-color: #e5e7eb;
    --accent: #2563eb;
}`);

// 2. Typography
css = css.replace(/font-family:\s*[^;]+;/, "font-family: 'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;");

// 3. Top nav
css = css.replace(/\.top-nav\s*\{[\s\S]*?\}/, `.top-nav {
    height: 60px;
    background-color: #ffffff;
    color: #111827;
    display: flex;
    align-items: center;
    padding: 0 20px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
}`);

css = css.replace(/\.nav-brand\s*\{[\s\S]*?\}/, `.nav-brand {
    font-size: 1.2rem;
    font-weight: 600;
    margin-right: 30px;
    color: #111827;
}`);

// 4. Nav buttons
css = css.replace(/\.nav-btn\s*\{[\s\S]*?\}/g, `.nav-btn {
    background: transparent;
    color: #4b5563;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 0.95rem;
    border: none;
    cursor: pointer;
    transition: 0.2s;
}`);
css = css.replace(/\.nav-btn\.active\s*\{[\s\S]*?\}/g, `.nav-btn.active {
    background: var(--primary);
    color: white;
}`);
css = css.replace(/\.nav-btn:hover:not\(\.active\)\s*\{[\s\S]*?\}/g, `.nav-btn:hover:not(.active) {
    background: #f3f4f6;
    color: #111827;
}`);

// 5. Remove all box-shadows globally
css = css.replace(/box-shadow:[^;]+;/g, '/* box-shadow removed for minimalism */');

// 6. Remove gradients globally
css = css.replace(/background-image:\s*radial-gradient[^;]+;/g, 'background-color: var(--bg-color);');
css = css.replace(/background-size:[^;]+;/g, '/* background-size removed */');

// 7. Graph container custom background (just in case the regex missed it)
css = css.replace(/\.graph-container\s*\{[\s\S]*?\}/g, `.graph-container {
    flex: 1;
    position: relative;
    background-color: var(--bg-color);
}`);

// 8. Animations
css = css.replace(/@keyframes\s+([a-zA-Z0-9_-]+)\s*\{[\s\S]*?\}/g, '/* keyframes removed */');
css = css.replace(/animation:\s*[^;]+;/g, '/* animation removed */');

// 9. Modals styling to light theme
css = css.replace(/\.modal-content\s*\{[\s\S]*?\}/g, `.modal-content {
    background: #ffffff;
    color: #111827;
    padding: 30px;
    border-radius: 6px;
    width: 320px;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 15px;
}`);
css = css.replace(/\.modal-content\s+h3\s*\{[\s\S]*?\}/g, `.modal-content h3 {
    margin: 0;
    color: #111827;
    font-size: 1.25rem;
    font-weight: 600;
}`);
css = css.replace(/\.modal-content\s+input\s*\{[\s\S]*?\}/g, `.modal-content input {
    background: #ffffff;
    border: 1px solid #d1d5db;
    color: #111827;
    padding: 12px;
    font-size: 1.1rem;
    border-radius: 4px;
    outline: none;
}`);

// 10. Table header
css = css.replace(/\.table-header\s*\{[\s\S]*?\}/g, `.table-header {
    background: #f9fafb;
    color: #111827;
    padding: 10px 15px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: space-between;
    user-select: none;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
}`);

// 11. Increase padding between canvas and explanation (by giving more padding to sidebar)
css = css.replace(/\.sidebar\s*\{[\s\S]*?\}/g, `.sidebar {
    width: 400px;
    background-color: var(--sidebar-bg);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    padding: 30px;
    z-index: 10;
    overflow-y: auto;
}`);

// 12. Explanation panel background
css = css.replace(/\.explanation-panel\s*\{[\s\S]*?\}/g, `.explanation-panel {
    flex: 1;
    background-color: #ffffff;
    border-radius: 4px;
    padding: 20px;
    border: 1px solid var(--border-color);
    overflow-y: auto;
    font-size: 0.95rem;
    line-height: 1.6;
    transition: all 0.2s ease;
}`);

// 13. Remove border radius from controls
css = css.replace(/border-radius:\s*(?:6px|8px|12px|20px);/g, 'border-radius: 4px;');

// 14. Quiz lives background
css = css.replace(/\.quiz-lives\s*\{[\s\S]*?\}/, `.quiz-lives {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 8px;
    font-size: 1.5rem;
    z-index: 50;
    background: #ffffff;
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
}`);

// 15. Home Card styling tweaks (minimalist)
css = css.replace(/\.home-card\s*\{[\s\S]*?\}/, `.home-card {
    background: #ffffff;
    border-radius: 4px;
    padding: 30px 20px;
    text-align: center;
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}`);
css = css.replace(/\.home-card:hover\s*\{[\s\S]*?\}/, `.home-card:hover {
    transform: none;
    background-color: #f9fafb;
    border-color: var(--primary);
}`);
css = css.replace(/\.home-hero\s+h1\s*\{[\s\S]*?\}/, `.home-hero h1 {
    font-size: 2.2rem;
    color: #111827;
    margin-bottom: 15px;
    font-weight: 600;
}`);

// 16. Quiz error / gameover modal fixes
css = css.replace(/\.quiz-error-content\s*\{[\s\S]*?\}/, `.quiz-error-content {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    color: #111827;
    padding: 30px;
    border-radius: 4px;
    max-width: 430px;
    width: 90%;
    text-align: center;
}`);

// 17. Button basic styles
css = css.replace(/button\s*\{[\s\S]*?\}/, `button {
    background-color: var(--primary);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    border: none;
    padding: 10px;
    border-radius: 4px;
}`);

// Add some action button group styling for HTML structural changes later
css += `
/* Academic Button Group */
.button-group-academic {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #f9fafb;
    padding: 15px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
}
`;

fs.writeFileSync('style.css', css);
