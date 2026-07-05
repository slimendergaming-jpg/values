let petData = [];
let currentTab = 'all';
let currentVariant = 'normal';
let valueMode = 'points';
let activeView = 'database';

// Dynamic Trades Lists Setup
let yourOfferList = [];
let theirOfferList = [];
let activeTargetSide = 'your';

// Modal Modifications Selection Configuration
let selectedVariant = 'normal'; 
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

function calculateItemValue(item, variant, fly, ride) {
    if (!item || !item.values) return 0;
    
    let value = item.values[variant] || item.values['normal'] || 0;
    
    // Non-pet asset control filter safeguards
    if (item.type !== 'pet') {
        fly = false;
        ride = false;
    }
    
    if (fly) value += 8;
    if (ride) value += 5;
    
    // Tag Rule: Old pet check (decrease total item value by 10% if potioned)
    if (item.type === 'pet' && item.isOld && (fly || ride)) {
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
        card.className = `pet-card legendary`;

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
    renderSideList('yourSlots', yourOfferList, 'your', 'yourWarning');
    renderSideList('theirSlots', theirOfferList, 'their', 'theirWarning');
    
    let yourTotal = yourOfferList.reduce((sum, item) => sum + calculateItemValue(item.data, item.variant, item.fly, item.ride), 0);
    let theirTotal = theirOfferList.reduce((sum, item) => sum + calculateItemValue(item.data, item.variant, item.fly, item.ride), 0);
    
    document.getElementById('yourTotal').innerText = formatDisplayValue(yourTotal);
    document.getElementById('theirTotal').innerText = formatDisplayValue(theirTotal);
    
    const balanceDiv = document.getElementById('tradeBalance');
    const badge = document.getElementById('statusBadge');
    
    let diff = yourTotal - theirTotal;
    balanceDiv.innerText = formatDisplayValue(Math.abs(diff));
    
    badge.className = 'trade-status-badge';
    if (yourTotal === 0 && theirTotal === 0) {
        badge.innerText = 'FAIR';
        badge.classList.add('fair');
    } else if (Math.abs(diff) <= (yourTotal * 0.07)) {
        badge.innerText = 'FAIR';
        badge.classList.add('fair');
    } else if (yourTotal > theirTotal) {
        badge.innerText = 'LOSE';
        badge.classList.add('lose');
    } else {
        badge.innerText = 'WIN';
        badge.classList.add('win');
    }
}

function renderSideList(containerId, listArray, sideName, warningId) {
    const container = document.getElementById(containerId);
    const warningEl = document.getElementById(warningId);
    container.innerHTML = '';
    
    // Display limits message tags if 18 item boundaries are breached
    if (listArray.length > 18) {
        warningEl.innerText = `Limit reached ${listArray.length}/18 - MAX TRADE`;
    } else {
        warningEl.innerText = '';
    }

    // Render items currently inside the list
    listArray.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'grid-slot occupied';
        
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
        
        slot.addEventListener('click', () => {
            listArray.splice(index, 1);
            renderTradeEngine();
        });
        container.appendChild(slot);
    });

    // Singular interactive trailing append button
    const plusSlot = document.createElement('div');
    plusSlot.className = 'grid-slot';
    plusSlot.innerHTML = '<span class="slot-plus">+</span>';
    plusSlot.addEventListener('click', () => openModalSelector(sideName));
    container.appendChild(plusSlot);
}

function openModalSelector(side) {
    activeTargetSide = side;
    
    selectedVariant = 'normal';
    selectedFly = false;
    selectedRide = false;
    
    updateModalUIPots('pet'); // Default setup configuration
    document.getElementById('modalOverlay').classList.add('active');
    renderModalItemList();
}

function updateModalUIPots(itemType) {
    const isPet = (itemType === 'pet');
    
    // Toggle variation switches visibility/interactivity criteria rules
    document.querySelectorAll('.pot-circle[data-var]').forEach(b => {
        b.disabled = !isPet;
        b.classList.toggle('active', isPet && b.dataset.var === selectedVariant);
    });
    
    const fBtn = document.getElementById('potF');
    const rBtn = document.getElementById('potR');
    
    fBtn.disabled = !isPet;
    rBtn.disabled = !isPet;
    
    fBtn.classList.toggle('active', isPet && selectedFly);
    rBtn.classList.toggle('active', isPet && selectedRide);
}

function renderModalItemList() {
    const listContainer = document.getElementById('modalItemList');
    listContainer.innerHTML = '';
    const query = document.getElementById('modalSearch').value.toLowerCase();
    
    const filtered = petData.filter(i => i.name.toLowerCase().includes(query));
    
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'modal-item-card';
        
        let localVariant = item.type === 'pet' ? selectedVariant : 'normal';
        let localFly = item.type === 'pet' ? selectedFly : false;
        let localRide = item.type === 'pet' ? selectedRide : false;
        
        let val = calculateItemValue(item, localVariant, localFly, localRide);
        
        card.innerHTML = `
            <h5>${item.name}</h5>
            <p>${formatDisplayValue(val)}</p>
            <span class="tag-indicator">${item.type.toUpperCase()}</span>
        `;
        
        card.addEventListener('click', () => {
            const targetList = (activeTargetSide === 'your') ? yourOfferList : theirOfferList;
            
            targetList.push({
                data: item,
                variant: localVariant,
                fly: localFly,
                ride: localRide
            });
            
            document.getElementById('modalOverlay').classList.remove('active');
            renderTradeEngine();
        });
        
        listContainer.appendChild(card);
    });
}

function setupFrameworkEvents() {
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

    document.querySelectorAll('.mode-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            document.querySelectorAll('.mode-btn').forEach(m => m.classList.remove('active'));
            e.target.classList.add('active');
            valueMode = e.target.dataset.mode;
            if (activeView === 'database') renderDatabaseView();
            else renderTradeEngine();
        });
    });

    document.getElementById('modalClose').addEventListener('click', () => {
        document.getElementById('modalOverlay').classList.remove('active');
    });
    document.getElementById('modalSearch').addEventListener('input', renderModalItemList);

    // Modal Modifiers Buttons Event Wireframe Hooks
    document.getElementById('potD').addEventListener('click', () => { selectedVariant = 'normal'; updateModalUIPots('pet'); renderModalItemList(); });
    document.getElementById('potN').addEventListener('click', () => { selectedVariant = 'neon'; updateModalUIPots('pet'); renderModalItemList(); });
    document.getElementById('potM').addEventListener('click', () => { selectedVariant = 'mega'; updateModalUIPots('pet'); renderModalItemList(); });
    document.getElementById('potF').addEventListener('click', () => { selectedFly = !selectedFly; updateModalUIPots('pet'); renderModalItemList(); });
    document.getElementById('potR').addEventListener('click', () => { selectedRide = !selectedRide; updateModalUIPots('pet'); renderModalItemList(); });
}

loadPetData();
