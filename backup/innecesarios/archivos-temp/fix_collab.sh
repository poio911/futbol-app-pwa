#!/bin/bash

# Fix 1: Add check for existing modal
sed -i '/showCreateMatchModal() {/a\
        \
        // Remove any existing modal first\
        const existingModal = document.getElementById('\''create-match-modal'\'');\
        if (existingModal) {\
            console.log('\''⚠️ Removing existing modal...'\'');\
            existingModal.remove();\
        }' js/collaborative-system.js

# Fix 2: Replace form with div and remove form tags
sed -i 's/<form id="create-match-form">/<div id="create-match-form">/' js/collaborative-system.js
sed -i 's/<\/form>/<\/div>/' js/collaborative-system.js

# Fix 3: Change submit button to regular button
sed -i 's/<button type="submit"/<button type="button" id="create-match-submit-btn"/' js/collaborative-system.js

# Fix 4: Replace the event listener
sed -i "/form.addEventListener('submit'/,/});/c\
        const submitBtn = document.getElementById('create-match-submit-btn');\
        if (submitBtn) {\
            console.log('🔗 Attaching button click listener...');\
            submitBtn.onclick = (e) => {\
                e.preventDefault();\
                e.stopPropagation();\
                console.log('📝 Submit button clicked!');\
                this.handleCreateMatchDirectly();\
                return false;\
            };\
        }" js/collaborative-system.js

echo "Fixes applied"
