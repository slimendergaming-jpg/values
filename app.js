let petData = [];
let currentTab = 'all';
let modalTab = 'all'; 
let currentVariant = 'normal';
let valueMode = 'points';
let activeView = 'database';

// Global database screen filter state parameters
let dbFly = true; 
let dbRide = true;

let yourOfferList = [];
let theirOfferList = [];
let activeTargetSide = 'your';

let selectedVariant = 'normal'; 
let selectedFly = true;  
let selectedRide = true;

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
    
    if (item.type !== 'pet') {
        return value;
    }
    
    if (item.isOld) {
        let potionCount = 0;
        if (fly) potionCount++;
        if (ride) potionCount++;

        if (potionCount === 1) {
            value = value * 1.10; 
        } else if (potionCount === 0) {
            value = value * 1.20; 
        }
    } else {
        if (fly) value += 8;
        if (ride) value += 5;
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
        const baseValue = calculateItemValue(item, currentVariant, dbFly, dbRide);
        const card = document.createElement('div');
        const rarityClass = item.rarity.toLowerCase().replace(' ', '-');
        card.className = `pet-card ${rarityClass}`;

        const imagePath = `images/${item.name}.png`;

        card.innerHTML = `
            <span class="rarity-tag">${item.rarity}</span>
            <div style="height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                <img src="${imagePath}" alt="${item.name}" style="max-height: 100%; max-width: 120px; object-fit: contain;" onerror="this.src='https://placehold.co/100x100/1a1d24/ffffff?text=?';">
            </div>
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
    
    balanceDiv.className = 'trade-total';
    if (yourTotal === 0 && theirTotal === 0) {
        balanceDiv.innerText = "0";
        balanceDiv.className = "trade-total even";
    } else if (diff > 0) {
        balanceDiv.innerText = `+${formatDisplayValue(diff)}`;
        balanceDiv.className = "trade-total gain";
    } else if (diff < 0) {
        balanceDiv.innerText = `-${formatDisplayValue(Math.abs(diff))}`;
        balanceDiv.className = "trade-total loss";
    } else {
        balanceDiv.innerText = "0";
        balanceDiv.className = "trade-total even";
    }
    
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
    
    if (listArray.length > 18) {
        warningEl.innerText = `Limit reached ${listArray.length}/18 - MAX TRADE`;
    } else {
        warningEl.innerText = '';
    }

    listArray.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'grid-slot occupied';
        slot.style.borderTop = `4px solid ${getBorderColorByRarity(item.data.rarity)}`;
        
        let itemVal = calculateItemValue(item.data, item.variant, item.fly, item.ride);
        const imagePath = `images/${item.data.name}.png`;
        
        let badgesHtml = '';
        if (item.data.type === 'pet') {
            if (item.variant === 'neon') badgesHtml += '<span class="mini-pot" style="background:#d69e2e; color:white;">N</span>';
            if (item.variant === 'mega') badgesHtml += '<span class="mini-pot" style="background:#805ad5; color:white;">M</span>';
            if (item.fly) badgesHtml += '<span class="mini-pot" style="background:#3182ce; color:white;">F</span>';
            if (item.ride) badgesHtml += '<span class="mini-pot" style="background:#e53e3e; color:white;">R</span>';
        }
        
        slot.innerHTML = `
            <div class="slotted-item">
                <img src="${imagePath}" alt="${item.data.name}" style="width: 55px; height: 55px; object-fit: contain; margin-bottom: 2px;" onerror="this.src='https://placehold.co/55x55/1a1d24/ffffff?text=?';">
                <h4>${item.data.name}</h4>
                <p>${formatDisplayValue(itemVal)}</p>
            </div>
            <div class="slot-potions">${badgesHtml}</div>
        `;
        
        slot.addEventListener('click', () => {
            listArray.splice(index, 1);
            renderTradeEngine();
        });
        container.appendChild(slot);
    });

    const plusSlot = document.createElement('div');
    plusSlot.className = 'grid-slot';
    plusSlot.innerHTML = '<span class="slot-plus">+</span>';
    plusSlot.addEventListener('click', () => openModalSelector(sideName));
    container.appendChild(plusSlot);

    let totalItemsDisplayed = listArray.length + 1; 
    let trailingPlaceholdersRequired = Math.max(9, Math.ceil(totalItemsDisplayed / 3) * 3) - totalItemsDisplayed;

    for (let i = 0; i < trailingPlaceholdersRequired; i++) {
        const blankSlot = document.createElement('div');
        blankSlot.className = 'grid-slot placeholder';
        blankSlot.innerHTML = '<span style="color:#222630; font-weight:bold;">-</span>';
        container.appendChild(blankSlot);
    }
}

function getBorderColorByRarity(rarity) {
    switch(rarity.toLowerCase()) {
        case 'common': return '#3182ce';       // Blue
        case 'uncommon': return '#805ad5';     // Purple
        case 'rare': return '#48bb78';         // Green
        case 'ultra-rare': return '#e53e3e';   // Red
        case 'legendary': return '#111111';    // Black
        default: return '#2d3139';
    }
}

function openModalSelector(side) {
    activeTargetSide = side;
    updateModalUIPots('pet');
    document.getElementById('modalOverlay').classList.add('active');
    renderModalItemList();
}

function updateModalUIPots(itemType) {
    const isPet = (itemType === 'pet');
    
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
    
    const filtered = petData.filter(i => {
        const matchSearch = i.name.toLowerCase().includes(query);
        const matchTab = (modalTab === 'all') || (i.type === modalTab);
        return matchSearch && matchTab;
    });
    
    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'modal-item-card';
        
        let localVariant = item.type === 'pet' ? selectedVariant : 'normal';
        let localFly = item.type === 'pet' ? selectedFly : false;
        let localRide = item.type === 'pet' ? selectedRide : false;
        
        let val = calculateItemValue(item, localVariant, localFly, localRide);
        const imagePath = `images/${item.name}.png`;
        
        card.innerHTML = `
            <img src="${imagePath}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: contain; margin-bottom: 4px;" onerror="this.src='https://placehold.co/40x40/1a1d24/ffffff?text=?';">
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
    
    document.querySelectorAll('#dbSection .tab-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            document.querySelectorAll('#dbSection .tab-btn').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.dataset.tab;
            renderDatabaseView();
        });
    });

    document.querySelectorAll('.modal-tabs .tab-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            document.querySelectorAll('.modal-tabs .tab-btn').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            modalTab = e.target.dataset.tab;
            renderModalItemList();
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

    document.getElementById('dbFlyBtn').addEventListener('click', (e) => {
        dbFly = !dbFly;
        e.target.classList.toggle('active', dbFly);
        renderDatabaseView();
    });
    document.getElementById('dbRideBtn').addEventListener('click', (e) => {
        dbRide = !dbRide;
        e.target.classList.toggle('active', dbRide);
        renderDatabaseView();
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

    document.getElementById('potD').addEventListener('click', () => { selectedVariant = 'normal'; updateModalUIPots('pet'); renderModalItemList(); });
    document.getElementById('potN').addEventListener('click', () => { selectedVariant = 'neon'; updateModalUIPots('pet'); renderModalItemList(); });
    document.getElementById('potM').addEventListener('click', () => { selectedVariant = 'mega'; updateModalUIPots('pet'); renderModalItemList(); });
    document.getElementById('potF').addEventListener('click', () => { selectedFly = !selectedFly; updateModalUIPots('pet'); renderModalItemList(); });
    document.getElementById('potR').addEventListener('click', () => { selectedRide = !selectedRide; updateModalUIPots('pet'); renderModalItemList(); });
}

loadPetData();
