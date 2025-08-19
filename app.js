class PokedexApp {
 constructor() {
 this.pokemonList = [];
 this.filteredPokemon = [];
 this.currentPokemon = null;
 this.init();
 }

 async init() {
 this.setupEventListeners();
 this.setupRouting();
 await this.loadPokemon();
 }

 setupEventListeners() {
 document.getElementById('searchInput').addEventListener('input', (e) => {
 this.filterPokemon(e.target.value.toLowerCase());
 });
 }

 setupRouting() {
 window.addEventListener('hashchange', () => this.handleRoute());
 this.handleRoute();
 }

 handleRoute() {
 const hash = window.location.hash.substring(1);
 
 if (hash.startsWith('pokemon/')) {
 const id = hash.split('/')[1];
 this.showPokemonDetail(id);
 } else {
 this.showPokemonGrid();
 }
 }

 async loadPokemon() {
 this.showLoading(true);
 
 // Check cache first
 const cached = localStorage.getItem('pokemonList');
 if (cached) {
 try {
 this.pokemonList = JSON.parse(cached);
 this.filteredPokemon = [...this.pokemonList];
 this.renderPokemonGrid();
 this.showLoading(false);
 return;
 } catch (e) {
 // If cache is corrupted, continue to fetch
 }
 }
 
 try {
 // Fetch first 250 Pokemon
 const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=250');
 const data = await response.json();
 
 // Get detailed info for each Pokemon
 const pokemonDetails = await Promise.all(
 data.results.map(async (pokemon, index) => {
 const res = await fetch(pokemon.url);
 const details = await res.json();
 return {
 id: details.id,
 name: details.name,
 sprite: details.sprites.front_default,
 types: details.types.map(type => type.type.name),
 height: details.height,
 weight: details.weight,
 abilities: details.abilities.map(ability => ability.ability.name),
 stats: details.stats
 };
 })
 );
 
 this.pokemonList = pokemonDetails;
 this.filteredPokemon = [...this.pokemonList];
 
 // Cache results
 localStorage.setItem('pokemonList', JSON.stringify(this.pokemonList));
 
 this.renderPokemonGrid();
 } catch (error) {
 this.showError('Failed to load Pokemon data. Please try again later.');
 console.error('Error loading Pokemon:', error);
 } finally {
 this.showLoading(false);
 }
 }

 filterPokemon(query) {
 this.filteredPokemon = this.pokemonList.filter(pokemon => 
 pokemon.name.includes(query) || 
 pokemon.id.toString().includes(query)
 );
 this.renderPokemonGrid();
 }

 renderPokemonGrid() {
 const grid = document.getElementById('pokemonGrid');
 grid.innerHTML = '';
 
 this.filteredPokemon.forEach(pokemon => {
 const card = document.createElement('div');
 card.className = 'pokemon-card';
 card.innerHTML = `
 <img src="${pokemon.sprite}" alt="${pokemon.name}" loading="lazy">
 <h2>${pokemon.name}</h2>
 <div class="id">#${pokemon.id.toString().padStart(3, '0')}</div>
 <div class="type-badges">
 ${pokemon.types.map(type => 
 `<span class="type-badge ${type}" data-type="${type}">${type}</span>`
 ).join('')}
 </div>
 `;
 
 card.addEventListener('click', () => {
 window.location.hash = `pokemon/${pokemon.id}`;
 });
 
 grid.appendChild(card);
 });
 }

 async showPokemonDetail(id) {
 // Show loading spinner
 this.showLoading(true);
 this.hideError();
 
 try {
 // Check if we already have this Pokemon's data
 const pokemon = this.pokemonList.find(p => p.id == id);
 
 if (!pokemon) {
 // If not in our list, fetch it
 const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
 if (!response.ok) throw new Error('Pokemon not found');
 const data = await response.json();
 
 this.currentPokemon = {
 id: data.id,
 name: data.name,
 sprite: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
 types: data.types.map(type => type.type.name),
 height: data.height,
 weight: data.weight,
 abilities: data.abilities.map(ability => ability.ability.name),
 stats: data.stats
 };
 } else {
 this.currentPokemon = pokemon;
 }
 
 this.renderPokemonDetail();
 } catch (error) {
 this.showError('Failed to load Pokemon details. Please try again.');
 console.error('Error loading Pokemon detail:', error);
 } finally {
 this.showLoading(false);
 }
 }

 renderPokemonDetail() {
 const detail = document.getElementById('pokemonDetail');
 detail.classList.remove('hidden');
 document.getElementById('pokemonGrid').classList.add('hidden');
 
 detail.innerHTML = `
 <button class="back-button" onclick="window.location.hash = ''">← Back</button>
 <img src="${this.currentPokemon.sprite}" alt="${this.currentPokemon.name}">
 <h1>${this.currentPokemon.name}</h1>
 <div class="id">#${this.currentPokemon.id.toString().padStart(3, '0')}</div>
 <div class="type-badges">
 ${this.currentPokemon.types.map(type => 
 `<span class="type-badge ${type}" data-type="${type}">${type}</span>`
 ).join('')}
 </div>
 
 <div class="pokemon-stats">
 <div class="stat-card">
 <h3>Height</h3>
 <div class="stat-value">${this.currentPokemon.height/10} m</div>
 </div>
 <div class="stat-card">
 <h3>Weight</h3>
 <div class="stat-value">${this.currentPokemon.weight/10} kg</div>
 </div>
 <div class="stat-card">
 <h3>Abilities</h3>
 <div class="stat-value">${this.currentPokemon.abilities.map(a => a).join(', ')}</div>
 </div>
 </div>
 
 <h2>Stats</h2>
 <div class="pokemon-stats">
 ${this.currentPokemon.stats.map(stat => `
 <div class="stat-card">
 <h3>${stat.stat.name.replace('-', ' ')}</h3>
 <div class="stat-value">${stat.base_stat}</div>
 </div>
 `).join('')}
 </div>
 `;
 }

 showPokemonGrid() {
 document.getElementById('pokemonGrid').classList.remove('hidden');
 document.getElementById('pokemonDetail').classList.add('hidden');
 this.hideError();
 }

 showLoading(show) {
 const spinner = document.getElementById('loadingSpinner');
 if (show) {
 spinner.classList.remove('hidden');
 } else {
 spinner.classList.add('hidden');
 }
 }

 showError(message) {
 const error = document.getElementById('errorMessage');
 error.textContent = message;
 error.classList.remove('hidden');
 document.getElementById('pokemonGrid').classList.add('hidden');
 document.getElementById('pokemonDetail').classList.add('hidden');
 }

 hideError() {
 document.getElementById('errorMessage').classList.add('hidden');
 }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
 new PokedexApp();
});