/**
 * Fixed UI Card Rendering based on ejemplo estilos.html
 */

// Function to render player card exactly like the working example
function renderPlayerCardFixed(player, container) {
    // Rating color based on OVR
    let ratingColor = 'var(--primary)';
    if (player.ovr < 40) ratingColor = '#c0392b';
    else if (player.ovr < 60) ratingColor = '#f39c12';
    else if (player.ovr < 80) ratingColor = '#2ecc71';
    else ratingColor = '#00ffea';
    
    const cardHtml = `
        <div class="player-card fade-in">
            <div class="card-header">
                <div class="player-img">
                    ${player.photo ? 
                        `<img src="${player.photo}" alt="${player.name}">` : 
                        `<i class="bx bx-user" style="font-size: 2.5rem; color: rgba(255,255,255,0.5);"></i>`
                    }
                </div>
                <div class="player-rating" style="color: ${ratingColor}">${player.ovr}</div>
            </div>
            <div class="player-name">${player.name}</div>
            <div class="player-position">${player.position}</div>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">PAC</span>
                    <span class="stat-value">${player.attributes?.pac || player.stats?.pac || 50}</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${player.attributes?.pac || player.stats?.pac || 50}%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-label">SHO</span>
                    <span class="stat-value">${player.attributes?.sho || player.stats?.sho || 50}</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${player.attributes?.sho || player.stats?.sho || 50}%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-label">PAS</span>
                    <span class="stat-value">${player.attributes?.pas || player.stats?.pas || 50}</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${player.attributes?.pas || player.stats?.pas || 50}%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-label">DRI</span>
                    <span class="stat-value">${player.attributes?.dri || player.stats?.dri || 50}</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${player.attributes?.dri || player.stats?.dri || 50}%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-label">DEF</span>
                    <span class="stat-value">${player.attributes?.def || player.stats?.def || 50}</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${player.attributes?.def || player.stats?.def || 50}%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-label">PHY</span>
                    <span class="stat-value">${player.attributes?.phy || player.stats?.phy || 50}</span>
                    <div class="stat-bar">
                        <div class="stat-fill" style="width: ${player.attributes?.phy || player.stats?.phy || 50}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = cardHtml;
    
    // Animate stat bars
    setTimeout(() => {
        const statFills = container.querySelectorAll('.stat-fill');
        statFills.forEach(fill => {
            fill.style.width = fill.style.width;
        });
    }, 100);
}

// Override UI method if it exists
if (typeof UI !== 'undefined') {
    // Store original method for fallback
    UI._originalCreatePlayerCard = UI.createPlayerCard;
    
    // Override with fixed version
    UI.createPlayerCard = function(player, index = 0, editMode = false) {
        const card = document.createElement('div');
        card.classList.add('player-card');
        card.dataset.playerId = player.id;
        
        // Use our fixed rendering
        renderPlayerCardFixed(player, card);
        
        return card;
    };
    
    console.log('UI card rendering fixed with ejemplo estilos.html structure');
}