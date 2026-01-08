// Données des saveurs
const ALL_FLAVORS = [
    { 
        id: 'pancetta', 
        name: 'Pancetta', 
        type: 'classic',
        image: 'img/pastabox-pancetta.png'
    },
    { 
        id: 'xtrem-poulet-creme', 
        name: 'XtremBox Poulet crème', 
        type: 'xtrembox',
        image: 'img/pastabox-xtrem-poulet-creme.png'
    },
    { 
        id: 'jambon-cru', 
        name: 'Jambon cru', 
        type: 'classic',
        image: 'img/pastabox-jambon-cru.png'
    },
    { 
        id: 'xtrem-boeuf-bolognaise', 
        name: 'XtremBox Bœuf bolognaise', 
        type: 'xtrembox',
        image: 'img/pastabox-xtrem-boeuf-bolognaise.png'
    },
    { 
        id: 'saumon', 
        name: 'Saumon', 
        type: 'classic',
        image: 'img/pastabox-saumon.png'
    },
    { 
        id: 'cremio-thon', 
        name: 'CremioBox Thon', 
        type: 'cremiobox',
        image: 'img/pastabox-cremio-thon.png'
    },
    { 
        id: 'lardons-raclette', 
        name: 'Lardons raclette', 
        type: 'classic',
        image: 'img/pastabox-lardons-raclette.png'
    },
    { 
        id: 'ricotta-epinard', 
        name: 'Ricotta épinard', 
        type: 'classic',
        image: 'img/pastabox-ricotta-epinard.png'
    },
    { 
        id: 'cremio-jambon-champignons', 
        name: 'CremioBox Jambon champignons', 
        type: 'cremiobox',
        image: 'img/pastabox-cremio-jambon-champignons.png'
    },
    { 
        id: 'xtrem-boeuf-poivre', 
        name: 'XtremBox Bœuf au poivre', 
        type: 'xtrembox',
        image: 'img/pastabox-xtrem-boeuf-poivre.png'
    },
    { 
        id: 'fromages-italiens', 
        name: 'Fromages italiens', 
        type: 'classic',
        image: 'img/pastabox-fromages-italiens.png'
    },
    { 
        id: 'cremio-jambon-emmental', 
        name: 'CremioBox Jambon et emmental rapé', 
        type: 'cremiobox',
        image: 'img/pastabox-cremio-jambon-emmental.png'
    },
    { 
        id: 'xtrem-4-fromages', 
        name: 'XtremBox 4 fromages', 
        type: 'xtrembox',
        image: 'img/pastabox-xtrem-4-fromages.png'
    },
    { 
        id: 'bolognaise', 
        name: 'Bolognaise', 
        type: 'classic',
        image: 'img/pastabox-bolognaise.png'
    },
    { 
        id: 'cremio-poulet-emmental', 
        name: 'CremioBox Poulet et emmental rapé', 
        type: 'cremiobox',
        image: 'img/pastabox-cremio-poulet-emmental.png'
    },
    { 
        id: 'xtrem-carbo', 
        name: 'XtremBox Carbo', 
        type: 'xtrembox',
        image: 'img/pastabox-xtrem-carbo.png'
    },
    { 
        id: 'carbonara', 
        name: 'Carbonara', 
        type: 'classic',
        image: 'img/pastabox-carbonara.png'
    },
    { 
        id: 'asian-poulet-teriyaki', 
        name: 'AsianBox Poulet teriyaki', 
        type: 'asianbox',
        image: 'img/pastabox-asian-poulet-teriyaki.png'
    },
    { 
        id: 'asian-crevettes-thai', 
        name: 'AsianBox Crevettes façon thaï', 
        type: 'asianbox',
        image: 'img/pastabox-asian-crevettes-thai.png'
    },
    { 
        id: 'asian-poulet-aigre-douce', 
        name: 'AsianBox Poulet aigre-douce', 
        type: 'asianbox',
        image: 'img/pastabox-asian-poulet-aigre-douce.png'
    },
    { 
        id: 'pecorino-poivre', 
        name: 'Pecorino poivre noir', 
        type: 'classic',
        image: 'img/pastabox-pecorino-poivre.png'
    },
    { 
        id: 'parmesan-basilic', 
        name: 'Parmesan basilic', 
        type: 'classic',
        image: 'img/pastabox-parmesan-basilic.png'
    },
    { 
        id: 'xtrem-tomate-mozza', 
        name: 'XtremBox Tomate mozza', 
        type: 'xtrembox',
        image: 'img/pastabox-xtrem-tomate-mozza.png'
    },
    { 
        id: 'chevre', 
        name: 'Chèvre', 
        type: 'classic',
        image: 'img/pastabox-chevre.png'
    }
];

const TYPE_ICONS = {
    classic: '🍝',
    xtrembox: '🔥',
    cremiobox: '🧀',
    asianbox: '🥢'
};

// Gestion du localStorage
const storage = {
    get: (key) => {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    },
    
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    remove: (key) => {
        localStorage.removeItem(key);
    }
};

// Application state
let state = {
    stores: [],
    selectedStoreId: null,
    todayDraw: null,
    history: [],
    currentTab: 'draw'
};

// Initialiser l'état depuis le localStorage
function initState() {
    const savedStores = storage.get('pastabox-stores');
    const savedSelectedStore = storage.get('pastabox-selected-store');
    const savedTodayDraw = storage.get('pastabox-today-draw');
    const savedHistory = storage.get('pastabox-history');
    
    if (savedStores) state.stores = savedStores;
    if (savedSelectedStore) state.selectedStoreId = savedSelectedStore;
    if (savedTodayDraw) {
        const today = new Date().toDateString();
        if (savedTodayDraw.date === today) {
            state.todayDraw = savedTodayDraw;
        }
    }
    if (savedHistory) state.history = savedHistory;
}