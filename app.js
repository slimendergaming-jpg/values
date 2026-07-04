let petData = [];

// Fetch your local database file
async function loadPetData() {
    try {
        const response = await fetch('values.json');
        petData = await response.json();
        displayPets(petData);
    } catch (error) {
        console.error("Error loading pet values:", error);
    }
}

// Generate the item elements dynamically
function displayPets(pets) {
    const grid = document.getElementById('petGrid');
    grid.innerHTML = ''; // Reset grid content
    
    if(pets.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #718096;">No items found matching your search.</p>';
        return;
    }

    pets.forEach(pet => {
        const card = document.createElement('div');
        card.className = 'pet-card';
        card.innerHTML = `
            <img src="${pet.image}" alt="${pet.name}">
            <h3>${pet.name}</h3>
            <p>Value: <strong style="color: #48bb78;">${pet.value}</strong></p>
            <span class="demand-tag">${pet.demand} Demand</span>
        `;
        grid.appendChild(card);
    });
}

// Search bar filter logic
document.getElementById('searchBar').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = petData.filter(pet => 
        pet.name.toLowerCase().includes(searchTerm) || 
        pet.rarity.toLowerCase().includes(searchTerm)
    );
    displayPets(filtered);
});

// Fire it off when the script loads
loadPetData();
