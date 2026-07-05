let petData = [];
let currentTab = 'all';
let currentVariant = 'normal';
let valueMode = 'points';
let activeView = 'database';

// Trade State Management Tracking
let yourOfferSlots = Array(9).fill(null);
let theirOfferSlots = Array(9).fill(null);
let activeTargetSide = 'your';
let activeTargetIndex = 0;

// Chosen Modal Custom Potions State Configuration
let selectedVariant = 'normal'; // normal, neon, mega
let selectedFly = false;
let selectedRide = false;

async function loadPetData() {
    try {
        const response = await fetch('values.json');
        petData = await response.json();
        setupFrameworkEvents();
        renderDatabaseView();
        renderTradeEngine();
    } catch (e) {
        console.error("Initialization error:", e);
    }
}

// Calculate precise pricing value dynamically with custom potion mod rules
function calculateItemValue(item, variant, fly, ride) {
    if (!item || !item.values) return 0;
    
    let value = item.values[variant] || item.values['normal'] || 0;
    
    // Custom logic add-ons (+8 for fly, +5 for ride)
    if (fly) value += 8;
    if (ride) value += 5;
    
    // Rule: Old tag check (Frost/Shadow). Decreases value by 10% if fly or ride is applied
    if (item.isOld && (fly || ride)) {
        value = value * 0.90;
    }
    
    return value;
}

function formatDisplayValue(val) {
    if (valueMode === 'frost') {
        return `${(val / 100).toFixed(2)} Frosts`;
    }
    return val.toFixed(0);
}

function renderDatabaseView() {
    const grid = document.getElementById('petGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const searchInput = document.getElementById('searchBar').value.toLowerCase();

    const filtered = petData.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchInput);
        const matchesTab = (currentTab === 'all') || (item.type === currentTab);
        return matchesSearch && matchesTab;
    });

    filtered.forEach(item => {
        const baseValue = calculateItemValue(item, currentVariant, false, false);
        const card = document.createElement('div');
        const rarityClass = item.rarity.toLowerCase().replace(' ', '-');
        card.className = `pet-card ${rarityClass}`;

        card.innerHTML = `
            <span class="rarity-tag">${item.rarity}</span>
            <h3>${currentVariant !== 'normal' && item.type === 'pet' ? currentVariant.toUpperCase() + ' ' : ''}${item.name}</h3>
            <p>Value: <strong style="color: #48bb78;">${formatDisplayValue(baseValue)}</strong></p>
            <span style="font-size: 0.8rem; color: #a0aec0;">${item.demand} Demand</span>
        `;
        grid.appendChild(card);
    });
}

function renderTradeEngine() {
    renderSideSlots('yourSlots', yourOfferSlots, 'your');
    renderSideSlots('theirSlots', theirOfferSlots, 'their');
    
    let yourTotal = yourOfferSlots.reduce((sum, item) => sum + (item ? calculateItemValue(item.data, item.variant, item.fly, item.ride) : 0), 0);
    let theirTotal = theirOfferSlots.reduce((sum, item) => sum + (item ? calculateItemValue(item.data, item.variant, item.fly, item.ride) : 0), 0);
    
    document.getElementById('yourTotal').innerText = formatDisplayValue(yourTotal);
    document.getElementById('theirTotal').innerText = formatDisplayValue(theirTotal);
    
    const balanceDiv = document.getElementById('tradeBalance');
    const badge = document.getElementById('statusBadge');
    
    let diff = yourTotal - theirTotal;
    balanceDiv.innerText = formatDisplayValue(Math.abs(diff));
    
    // Status metrics criteria
    badge.className = 'trade-status-badge';
    if (yourTotal === 0 && theirTotal === 0) {
        badge.innerText = 'FAIR';
        badge.classList.add('fair');
    } else if (Math.abs(diff) <= (yourTotal * 0.07)) {
        badge.innerText = 'FAIR';
        badge.classList.add('fair');
    } else if (yourTotal > theirTotal) {
        badge.innerText = 'LOSE'; // Giving more than getting
        badge.classList.add('lose');
    } else {
        badge.innerText = 'WIN';
        badge.classList.add('win');
    }
}

function renderSideSlots(containerId, slotsArray, sideName) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    slotsArray.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'grid-slot';
        
        if (item) {
            slot.classList.add('occupied');
            let itemVal = calculateItemValue(item.data, item.variant, item.fly, item.ride);
            let prefix = item.variant !== 'normal' ? item.variant.toUpperCase()[0] + ' ' : '';
            
            slot.innerHTML = `
                <div class="slotted-item">
                    <h4>${prefix}${item.data.name}</h4>
                    <p>${formatDisplayValue(itemVal)}</p>
                </div>
                <div class="slot-potions">
                    ${item.fly ? '<span class="mini-pot" style="background:#3182ce">F</span>' : ''}
                    ${item.ride ? '<span class="mini-pot" style="background:#e53e3e">R</span>' : ''}
                </div>
            `;
            // Click occupied slot to remove item
            slot.addEventListener('click', () => {
                slotsArray[index] = null;
                renderTradeEngine();
            });
        } else {
            slot.innerHTML = '<span class="slot-plus">+</span>';
            slot.addEventListener('click', () => openModalSelector(sideName, index));
        }
        container.appendChild(slot);
    });
}

function openModalSelector(side, index) {
    activeTargetSide = side;
    activeTargetIndex = index;
    
    // Reset selected conditions values
    selectedVariant = 'normal';
    selectedFly = false;
    selectedRide = false;
    updateModalUIPots();
    
    document.getElementById('modalOverlay').classList.add('active');
    renderModalItemList();
}

function updateModalUIPots() {
    document.querySelectorAll('.pot-circle[data-var]').forEach(b => {
        b.classList.toggle('active', b.dataset.var === selectedVariant);
    });
    document.getElementById('potF').classList.toggle('active', selectedFly);
    document.getElementById('potR').classList.toggle('active', selectedRide);
}

function renderModalItemList() {
    const listContainer = document.getElementById('modalItemList');
    listContainer.innerHTML = '';
    const query = document.getElementById('modalSearch').value.toLowerCase();
    
    const filtered = petData.filter(i => i.name.toLowerCase().includes(query));
    
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'modal-item-card';
        let val = calculateItemValue(item, selectedVariant, selectedFly, selectedRide);
        
        card.innerHTML = `
            <h5>${item.name}</h5>
            <p>${formatDisplayValue(val)}</p>
        `;
        
        card.addEventListener('click', () => {
            const configuredPackage = {
                data: item,
                variant: selectedVariant,
                fly: selectedFly,
                ride: selectedRide
            };
            
            if (activeTargetSide === 'your') {
                yourOfferSlots[activeTargetIndex] = configuredPackage;
            } else {
                theirOfferSlots[activeTargetIndex] = configuredPackage;
            }
            
            document.getElementById('modalOverlay').classList.remove('active');
            renderTradeEngine();
        });
        
        listContainer.appendChild(card);
    });
}

function setupFrameworkEvents() {
    // Top-Level Navigation View Switchers
    document.getElementById('btnViewDb').addEventListener('click', () => {
        activeView = 'database';
        document.getElementById('btnViewDb').classList.add('active');
        document.getElementById('btnViewCalc').classList.remove('active');
        document.getElementById('dbSection').classList.add('active');
        document.getElementById('calcSection').classList.remove('active');
        renderDatabaseView();
    });

    document.getElementById('btnViewCalc').addEventListener('click', () => {
        activeView = 'calculator';
        document.getElementById('btnViewCalc').classList.add('active');
        document.getElementById('btnViewDb').classList.remove('active');
        document.getElementById('calcSection').classList.add('active');
        document.getElementById('dbSection').classList.remove('active');
        renderTradeEngine();
    });

    // Database Filters configuration
    document.getElementById('searchBar').addEventListener('input', renderDatabaseView);
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.dataset.tab;
            renderDatabaseView();
        });
    });
    document.querySelectorAll('.variant-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            document.querySelectorAll('.variant-btn').forEach(v => v.classList.remove('active'));
            e.target.classList.add('active');
            currentVariant = e.target.dataset.variant;
            renderDatabaseView();
        });
    });

    // Universal Global Math Mode Configuration Toggles
    document.querySelectorAll('.mode-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            document.querySelectorAll('.mode-btn').forEach(m => m.classList.remove('active'));
            e.target.classList.add('active');
            valueMode = e.target.dataset.mode;
            if (activeView === 'database') renderDatabaseView();
            else renderTradeEngine();
        });
    });

    // Modal Events listeners
    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('modalOverlay').classList.remove('active');
    });
    document.getElementById('modalSearch').addEventListener('input', renderModalItemList);

    // Modal Potion Switch Controls
    document.getElementById('potD').addEventListener('click', () => { selectedVariant = 'normal'; updateModalUIPots(); renderModalItemList(); });
    document.getElementById('potN').addEventListener('click', () => { selectedVariant = 'neon'; updateModalUIPots(); renderModalItemList(); });
    document.getElementById('potM').addEventListener('click', () => { selectedVariant = 'mega'; updateModalUIPots(); renderModalItemList(); });
    document.getElementById('potF').addEventListener('click', () => { selectedFly = !selectedFly; updateModalUIPots(); renderModalItemList(); });
    document.getElementById('potR').addEventListener('click', () => { selectedRide = !selectedRide; updateModalUIPots(); renderModalItemList(); });
}

loadPetData();
