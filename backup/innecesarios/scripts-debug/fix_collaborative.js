// Read the original file
const fs = require('fs');
const content = fs.readFileSync('js/collaborative-system.js', 'utf8');

// Fix 1: Check for existing modal before creating
let fixed = content.replace(
    'showCreateMatchModal() {\n        console.log(\'🎯 Opening create match modal...\');',
    `showCreateMatchModal() {
        console.log('🎯 Opening create match modal...');
        
        // Remove any existing modal first
        const existingModal = document.getElementById('create-match-modal');
        if (existingModal) {
            console.log('⚠️ Removing existing modal...');
            existingModal.remove();
        }`
);

// Fix 2: Make the form more robust
fixed = fixed.replace(
    '<form id="create-match-form" onsubmit="return false;">',
    '<form id="create-match-form">'
);

// Fix 3: Better event handling
fixed = fixed.replace(
    `form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📝 Form submitted!');
                this.handleCreateMatch(e);
            });`,
    `form.onsubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📝 Form submitted with onsubmit handler!');
                this.handleCreateMatch(e);
                return false;
            };`
);

// Write the fixed content
fs.writeFileSync('js/collaborative-system.js', fixed);
console.log('Fixed collaborative-system.js');
