let petData = [];

async function loadPetData() {
    try {
        const response = await fetch('values.json');
        petData = await response.json();
        displayPets(petData);
    } catch (error) {
        console.error("Error loading values:", error);
    }
}

function displayPets(pets) {
    const grid = document.getElementById('petGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    pets.forEach(pet => {
        const card = document.createElement('div');
        card.className = 'pet-card';
        card.innerHTML = `
            <h3>${pet.name}</h3>
            <p>Value: <strong style="color: #48bb78;">${pet.value}</strong></p>
            <span style="font-size: 0.8rem; color: #a0aec0;">${pet.demand} Demand</span>
        `;
        grid.appendChild(card);
    });
}

document.getElementById('searchBar').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = petData.filter(pet => 
        pet.name.toLowerCase().includes(searchTerm)
    );
    displayPets(filtered);
});

loadPetData();
