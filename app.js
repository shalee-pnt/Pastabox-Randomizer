// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initState();
    setupNavigation();
    renderCurrentTab();
    
    // Vérifier si le tirage du jour est toujours valide
    checkAndResetTodayDraw();
});

// Détection hors ligne
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
  const offlineNotice = document.getElementById('offline-notice');
  if (!offlineNotice) {
    const notice = document.createElement('div');
    notice.id = 'offline-notice';
    notice.className = 'offline-notice';
    document.body.appendChild(notice);
  }
  
  if (!navigator.onLine) {
    document.getElementById('offline-notice').classList.add('show');
  } else {
    document.getElementById('offline-notice').classList.remove('show');
  }
}

// Initialiser l'état de connexion
updateOnlineStatus();

// Fonction pour vérifier et réinitialiser le tirage du jour si nécessaire
function checkAndResetTodayDraw() {
    if (state.todayDraw) {
        const today = new Date().toDateString();
        if (state.todayDraw.date !== today) {
            // Le tirage est périmé, on le supprime
            state.todayDraw = null;
            storage.remove('pastabox-today-draw');
            renderCurrentTab();
        }
    }
}

// Vérifier périodiquement si on a changé de jour
setInterval(checkAndResetTodayDraw, 60000); // Vérifier toutes les minutes

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            setCurrentTab(tab);
        });
    });
}

function setCurrentTab(tab) {
    state.currentTab = tab;
    
    // Update active state in nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderCurrentTab();
}

// Rendering
function renderCurrentTab() {
    const content = document.getElementById('content');
    
    switch(state.currentTab) {
        case 'draw':
            content.innerHTML = renderDrawTab();
            break;
        case 'stats':
            content.innerHTML = renderStatsTab();
            break;
        case 'settings':
            content.innerHTML = renderSettingsTab();
            break;
    }
    
    // Re-attach event listeners
    if (state.currentTab === 'draw') {
        attachDrawTabListeners();
    } else if (state.currentTab === 'settings') {
        attachSettingsTabListeners();
    }
}

// Fonction pour formater la date
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            // Si la date n'est pas valide, utiliser la date du jour
            const today = new Date();
            return today.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return "Date inconnue";
    }
}

// Fonction pour obtenir l'URL de l'image avec fallback
function getFlavorImage(flavorId) {
    const flavor = ALL_FLAVORS.find(f => f.id === flavorId);
    if (!flavor) return getFallbackImage('classic');
    
    return flavor.image || getFallbackImage(flavor.type);
}

function getFallbackImage(type) {
    const fallbacks = {
        classic: 'img/default-classic.png',
        xtrembox: 'img/default-xtrembox.png',
        cremiobox: 'img/default-cremiobox.png',
        asianbox: 'img/default-asianbox.png'
    };
    return fallbacks[type] || 'img/default.png';
}

// Draw Tab
function renderDrawTab() {
    if (state.stores.length === 0) {
        return `
            <div class="card empty-state">
                <i class="fas fa-store"></i>
                <h2>Aucun magasin</h2>
                <p>Commence par créer un magasin dans les paramètres !</p>
            </div>
        `;
    }
    
    const selectedStore = state.stores.find(s => s.id === state.selectedStoreId) || state.stores[0];
    const canDraw = selectedStore && selectedStore.availableFlavors.length > 0 && !state.todayDraw;
    
    let drawContent = '';
    
    if (state.todayDraw) {
        const drawnFlavor = ALL_FLAVORS.find(f => f.id === state.todayDraw.flavorId) || { name: 'Inconnue', type: 'classic' };
        const imageUrl = getFlavorImage(state.todayDraw.flavorId);
        
        drawContent = `
            <div class="draw-result">
                <div class="flavor-icon">${TYPE_ICONS[drawnFlavor.type] || '🍝'}</div>
                <h2 class="card-title">Pastabox du jour</h2>
                <div class="flavor-name">${drawnFlavor.name}</div>
                
                <div class="flavor-image-container">
                    <img src="${imageUrl}" 
                         alt="${drawnFlavor.name}" 
                         class="flavor-image"
                         onload="this.classList.remove('loading'); this.nextElementSibling.style.display='none'"
                         onerror="this.onerror=null; this.src='${getFallbackImage(drawnFlavor.type)}'; this.classList.add('error'); this.nextElementSibling.style.display='none'"
                         loading="lazy">
                    <div class="image-loading">
                        <div class="loading-spinner"></div>
                        <span>Chargement de l'image...</span>
                    </div>
                </div>
                
                <div style="margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--gray-600);">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(state.todayDraw.date)}</span>
                </div>
                
                <p class="card-subtitle" style="margin-top: 0.5rem;">
                    Reviens demain pour un nouveau tirage !
                </p>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--gray-100); border-radius: 0.5rem; text-align: center;">
                    <i class="fas fa-clock" style="color: var(--gray-600);"></i>
                    <span style="color: var(--gray-600); font-size: 0.875rem;">
                        Le tirage se réinitialisera automatiquement à minuit
                    </span>
                </div>
            </div>
        `;
    } else {
        let buttonText = 'Tirer la Pastabox du jour';
        if (!selectedStore) {
            buttonText = 'Sélectionne un magasin';
        } else if (selectedStore.availableFlavors.length === 0) {
            buttonText = 'Aucune saveur disponible';
        }
        
        drawContent = `
            <div class="draw-result">
                <div class="flavor-icon">🎲</div>
                <div class="image-placeholder">
                    <span>Quel met délicieux sera tiré aujourd'hui ?</span>
                </div>
                <button id="draw-btn" class="btn btn-primary" ${!canDraw ? 'disabled' : ''} style="margin-top: 1.5rem;">
                    <i class="fas fa-random"></i> ${buttonText}
                </button>
                ${selectedStore && selectedStore.availableFlavors.length === 0 ? 
                    `<p class="card-subtitle" style="margin-top: 1rem;">
                        <i class="fas fa-cog"></i> Configure les saveurs disponibles dans les paramètres
                    </p>` : ''
                }
            </div>
        `;
    }
    
    // Options pour le select
    const storeOptions = state.stores.map(store => `
        <option value="${store.id}" ${store.id === (state.selectedStoreId || state.stores[0]?.id) ? 'selected' : ''}>
            ${store.name} (${store.availableFlavors.length} saveurs)
        </option>
    `).join('');
    
    return `
        <div class="space-y-6">
            <div class="card">
                <div class="card-body">
                    <div class="select-wrapper">
                        <label for="store-select">
                            <i class="fas fa-store"></i> Magasin
                        </label>
                        <select id="store-select" class="store-select">
                            ${storeOptions}
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="card">
                ${drawContent}
            </div>
        </div>
    `;
}

function attachDrawTabListeners() {
    const storeSelect = document.getElementById('store-select');
    if (storeSelect) {
        storeSelect.addEventListener('change', (e) => {
            state.selectedStoreId = e.target.value;
            storage.set('pastabox-selected-store', state.selectedStoreId);
            renderCurrentTab();
        });
    }
    
    const drawBtn = document.getElementById('draw-btn');
    if (drawBtn) {
        drawBtn.addEventListener('click', drawPastabox);
    }
}

function drawPastabox() {
    const store = state.stores.find(s => s.id === state.selectedStoreId);
    if (!store || store.availableFlavors.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * store.availableFlavors.length);
    const flavorId = store.availableFlavors[randomIndex];
    
    const draw = {
        date: new Date().toDateString(),
        storeId: state.selectedStoreId,
        flavorId: flavorId,
        timestamp: Date.now()
    };
    
    state.todayDraw = draw;
    storage.set('pastabox-today-draw', draw);
    
    const newHistory = [...state.history, draw];
    state.history = newHistory;
    storage.set('pastabox-history', newHistory);
    
    renderCurrentTab();
}

// Stats Tab
function renderStatsTab() {
    if (state.history.length === 0) {
        return `
            <div class="card empty-state">
                <i class="fas fa-chart-bar"></i>
                <h2>Aucune statistique</h2>
                <p>Tire ta première pastabox pour voir des stats !</p>
            </div>
        `;
    }
    
    // Calcul des stats
    const flavorCounts = {};
    state.history.forEach(draw => {
        flavorCounts[draw.flavorId] = (flavorCounts[draw.flavorId] || 0) + 1;
    });
    
    const sortedFlavors = Object.entries(flavorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const topFlavorsHTML = sortedFlavors.map(([flavorId, count], index) => {
        const flavor = ALL_FLAVORS.find(f => f.id === flavorId) || { name: 'Inconnue', type: 'classic' };
        const imageUrl = getFlavorImage(flavorId);
        
        return `
            <div class="top-flavor">
                <div class="rank-number">#${index + 1}</div>
                <div class="flavor-type-icon">${TYPE_ICONS[flavor.type] || '🍝'}</div>
                <img src="${imageUrl}" 
                     alt="${flavor.name}"
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.5rem;"
                     onerror="this.src='${getFallbackImage(flavor.type)}'">
                <div class="flavor-details">
                    <div>${flavor.name}</div>
                    <div>${count} fois</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Calcul des statistiques supplémentaires
    const uniqueFlavors = new Set(state.history.map(d => d.flavorId)).size;
    const mostRecentDraw = state.history[state.history.length - 1];
    const mostRecentFlavor = ALL_FLAVORS.find(f => f.id === mostRecentDraw?.flavorId);
    
    return `
        <div class="space-y-6">
            <div class="card">
                <div class="card-body">
                    <h2 class="card-title"><i class="fas fa-chart-line"></i> Statistiques générales</h2>
                    <div class="space-y-3">
                        <div class="stat-item">
                            <span><i class="fas fa-history"></i> Total de tirages</span>
                            <span class="stat-value">${state.history.length}</span>
                        </div>
                        <div class="stat-item">
                            <span><i class="fas fa-utensils"></i> Saveurs différentes</span>
                            <span class="stat-value">${uniqueFlavors}</span>
                        </div>
                        <div class="stat-item">
                            <span><i class="fas fa-calendar-check"></i> Dernier tirage</span>
                            <span>${mostRecentFlavor ? mostRecentFlavor.name : 'Aucun'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <h2 class="card-title"><i class="fas fa-trophy"></i> Top 5 des saveurs</h2>
                    <div class="space-y-3">
                        ${topFlavorsHTML}
                    </div>
                </div>
            </div>
            
            ${state.history.length > 0 ? `
            <div class="card">
                <div class="card-body">
                    <h2 class="card-title"><i class="fas fa-history"></i> Historique récent</h2>
                    <div style="max-height: 300px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--gray-200);">
                                    <th style="text-align: left; padding: 0.5rem; color: var(--gray-600);">Date</th>
                                    <th style="text-align: left; padding: 0.5rem; color: var(--gray-600);">Saveur</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${state.history.slice(-10).reverse().map(draw => {
                                    const flavor = ALL_FLAVORS.find(f => f.id === draw.flavorId) || { name: 'Inconnue', type: 'classic' };
                                    const date = new Date(draw.date);
                                    return `
                                        <tr style="border-bottom: 1px solid var(--gray-100);">
                                            <td style="padding: 0.75rem; color: var(--gray-700);">
                                                ${date.toLocaleDateString('fr-FR')}
                                            </td>
                                            <td style="padding: 0.75rem; color: var(--gray-700);">
                                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                    <span>${TYPE_ICONS[flavor.type] || '🍝'}</span>
                                                    ${flavor.name}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// Settings Tab
function renderSettingsTab() {
    const storesHTML = state.stores.map(store => `
        <div class="card store-item" id="store-${store.id}">
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 class="card-title">
                            <i class="fas fa-store"></i> ${store.name}
                        </h3>
                        <p class="card-subtitle">
                            <i class="fas fa-utensils"></i> ${store.availableFlavors.length} saveur${store.availableFlavors.length !== 1 ? 's' : ''} disponible${store.availableFlavors.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div class="store-actions">
                        <button class="btn btn-secondary btn-sm configure-btn" data-store-id="${store.id}">
                            <i class="fas fa-cog"></i> Configurer
                        </button>
                        <button class="btn btn-danger btn-sm delete-btn" data-store-id="${store.id}">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
                <div id="flavors-${store.id}" class="flavors-list" style="display: none;">
                    <h4 style="font-weight: 500; color: var(--gray-700); margin-bottom: 1rem;">
                        <i class="fas fa-list"></i> Saveurs disponibles :
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.5rem;">
                        ${ALL_FLAVORS.map(flavor => {
                            const isChecked = store.availableFlavors.includes(flavor.id);
                            const imageUrl = getFlavorImage(flavor.id);
                            return `
                                <label class="flavor-checkbox">
                                    <input type="checkbox" 
                                           data-store-id="${store.id}" 
                                           data-flavor-id="${flavor.id}"
                                           ${isChecked ? 'checked' : ''}>
                                    <img src="${imageUrl}" 
                                         alt="${flavor.name}"
                                         style="width: 40px; height: 40px; object-fit: cover; border-radius: 0.25rem;"
                                         onerror="this.src='${getFallbackImage(flavor.type)}'">
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 500; color: var(--gray-800);">${flavor.name}</div>
                                        <div style="font-size: 0.875rem; color: var(--gray-600); display: flex; align-items: center; gap: 0.25rem;">
                                            ${TYPE_ICONS[flavor.type]} ${flavor.type}
                                        </div>
                                    </div>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="space-y-6">
            <div class="card">
                <div class="card-body">
                    <h2 class="card-title"><i class="fas fa-store-plus"></i> Ajouter un magasin</h2>
                    <div class="input-wrapper">
                        <input type="text" 
                               id="new-store-name" 
                               placeholder="Nom du magasin"
                               onkeypress="if(event.key === 'Enter') addStore()">
                        <button class="btn btn-primary" onclick="addStore()">
                            <i class="fas fa-plus"></i> Ajouter
                        </button>
                    </div>
                </div>
            </div>
            
            <div>
                ${storesHTML.length > 0 ? `
                    <div class="card">
                        <div class="card-body">
                            <h2 class="card-title"><i class="fas fa-store-alt"></i> Mes magasins</h2>
                            <p class="card-subtitle" style="margin-bottom: 1rem;">
                                ${state.stores.length} magasin${state.stores.length !== 1 ? 's' : ''} configuré${state.stores.length !== 1 ? 's' : ''}
                            </p>
                            ${storesHTML}
                        </div>
                    </div>
                ` : `
                    <div class="card empty-state">
                        <i class="fas fa-store"></i>
                        <p>Aucun magasin pour le moment</p>
                    </div>
                `}
            </div>
            
            ${state.stores.length > 0 ? `
            <div class="card">
                <div class="card-body">
                    <h2 class="card-title"><i class="fas fa-database"></i> Gestion des données</h2>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="exportData()">
                            <i class="fas fa-download"></i> Exporter les données
                        </button>
                        <button class="btn btn-secondary" onclick="importData()">
                            <i class="fas fa-upload"></i> Importer des données
                        </button>
                        <button class="btn btn-danger" onclick="clearAllData()">
                            <i class="fas fa-trash-alt"></i> Supprimer toutes les données
                        </button>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

function attachSettingsTabListeners() {
    // Boutons de configuration
    document.querySelectorAll('.configure-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const storeId = e.target.dataset.storeId;
            const flavorsDiv = document.getElementById(`flavors-${storeId}`);
            if (flavorsDiv) {
                flavorsDiv.style.display = flavorsDiv.style.display === 'none' ? 'block' : 'none';
                const icon = flavorsDiv.style.display === 'none' ? 'cog' : 'times';
                e.target.innerHTML = `<i class="fas fa-${icon}"></i> ${flavorsDiv.style.display === 'none' ? 'Configurer' : 'Fermer'}`;
            }
        });
    });
    
    // Boutons de suppression
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const storeId = e.target.dataset.storeId;
            if (confirm(`Voulez-vous vraiment supprimer le magasin "${state.stores.find(s => s.id === storeId)?.name}" ?`)) {
                deleteStore(storeId);
            }
        });
    });
    
    // Cases à cocher pour les saveurs
    document.querySelectorAll('.flavor-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const storeId = e.target.dataset.storeId;
            const flavorId = e.target.dataset.flavorId;
            toggleFlavor(storeId, flavorId, e.target.checked);
        });
    });
}

// Store management
function addStore() {
    const input = document.getElementById('new-store-name');
    const name = input.value.trim();
    
    if (!name) {
        alert('Veuillez entrer un nom pour le magasin');
        return;
    }
    
    const newStore = {
        id: 'store-' + Date.now(),
        name: name,
        availableFlavors: []
    };
    
    state.stores.push(newStore);
    storage.set('pastabox-stores', state.stores);
    
    if (!state.selectedStoreId) {
        state.selectedStoreId = newStore.id;
        storage.set('pastabox-selected-store', newStore.id);
    }
    
    input.value = '';
    renderCurrentTab();
    
    // Scroll vers le nouveau magasin
    setTimeout(() => {
        const newStoreElement = document.getElementById(`store-${newStore.id}`);
        if (newStoreElement) {
            newStoreElement.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100);
}

function deleteStore(storeId) {
    state.stores = state.stores.filter(s => s.id !== storeId);
    storage.set('pastabox-stores', state.stores);
    
    if (state.selectedStoreId === storeId) {
        state.selectedStoreId = state.stores.length > 0 ? state.stores[0].id : null;
        storage.set('pastabox-selected-store', state.selectedStoreId);
    }
    
    renderCurrentTab();
}

function toggleFlavor(storeId, flavorId, isChecked) {
    const storeIndex = state.stores.findIndex(s => s.id === storeId);
    if (storeIndex === -1) return;
    
    if (isChecked) {
        if (!state.stores[storeIndex].availableFlavors.includes(flavorId)) {
            state.stores[storeIndex].availableFlavors.push(flavorId);
        }
    } else {
        state.stores[storeIndex].availableFlavors = 
            state.stores[storeIndex].availableFlavors.filter(f => f !== flavorId);
    }
    
    storage.set('pastabox-stores', state.stores);
}

// Fonctions de gestion des données
function exportData() {
    const data = {
        stores: state.stores,
        selectedStoreId: state.selectedStoreId,
        todayDraw: state.todayDraw,
        history: state.history,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pastabox-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                // Validation basique des données
                if (!importedData.stores || !Array.isArray(importedData.stores)) {
                    throw new Error("Format de fichier invalide");
                }
                
                if (confirm("Voulez-vous remplacer toutes vos données actuelles par celles du fichier ?")) {
                    state.stores = importedData.stores;
                    state.selectedStoreId = importedData.selectedStoreId || null;
                    
                    // Si le tirage du jour importé est périmé, on le supprime
                    if (importedData.todayDraw) {
                        const today = new Date().toDateString();
                        if (importedData.todayDraw.date === today) {
                            state.todayDraw = importedData.todayDraw;
                            storage.set('pastabox-today-draw', state.todayDraw);
                        } else {
                            state.todayDraw = null;
                            storage.remove('pastabox-today-draw');
                        }
                    } else {
                        state.todayDraw = null;
                        storage.remove('pastabox-today-draw');
                    }
                    
                    state.history = importedData.history || [];
                    
                    storage.set('pastabox-stores', state.stores);
                    storage.set('pastabox-selected-store', state.selectedStoreId);
                    storage.set('pastabox-history', state.history);
                    
                    alert(`Données importées avec succès !\n- ${state.stores.length} magasin(s)\n- ${state.history.length} tirage(s) historique(s)`);
                    renderCurrentTab();
                }
            } catch (error) {
                alert("Erreur lors de l'importation : " + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllData() {
    if (confirm("⚠️ ATTENTION : Cette action supprimera TOUTES vos données (magasins, historique, paramètres).\n\nVoulez-vous vraiment continuer ?")) {
        localStorage.clear();
        state.stores = [];
        state.selectedStoreId = null;
        state.todayDraw = null;
        state.history = [];
        
        alert("Toutes les données ont été supprimées.");
        renderCurrentTab();
    }
}

// Exposer les fonctions globales
window.addStore = addStore;
window.exportData = exportData;
window.importData = importData;
window.clearAllData = clearAllData;