
import { gameDetails, loadGameData, getCategoryOrder } from './BaseURL.js';


export const categoryMap = {
    'action': 'Action',
    'adventure': 'Adventure',
    'racing': 'Racing',
    'puzzle': 'Puzzle',
    'sports': 'Sports',
    'kids': 'Kids',
    'girl': 'Girls'
};


const PATHS = {
    HOME: 'index.html',
    HOME_FROM_PAGES: '../index.html',
    CATEGORY: 'pages/category.html',
    CATEGORY_FROM_PAGES: 'category.html',
    DETAIL: 'detail.html',
    DETAIL_FROM_PAGES: '../detail.html'
};


const SELECTORS = {
    MENU_TOGGLE: '#menuToggle',
    CATEGORIES_MENU: '#categoriesMenu',
    CLOSE_CATEGORIES: '#closeCategories',
    CATEGORY_ITEMS: '#categoryItems',
    GAMES_GRID: '#gamesGrid',
    CATEGORY_ITEM: '.category-item'
};

const menuToggle = document.getElementById('menuToggle');
const categoriesMenu = document.getElementById('categoriesMenu');
const closeCategories = document.getElementById('closeCategories');
const categoryItemsContainer = document.getElementById('categoryItems');



function getElementIdFromSelector(selector) {
    return selector.startsWith('#') ? selector.slice(1) : selector;
}


export function getCategoryDisplayName(category) {
    return categoryMap[category] || 
           category?.charAt(0).toUpperCase() + category?.slice(1) || 
           'Unknown';
}


function isInPagesDirectory() {
    return window.location.pathname.includes('/pages/');
}


export function getDetailPagePath(defaultPath = PATHS.DETAIL) {
    return isInPagesDirectory() ? PATHS.DETAIL_FROM_PAGES : defaultPath;
}


export function getCategoryPagePath(category) {
    const path = isInPagesDirectory() 
        ? PATHS.CATEGORY_FROM_PAGES 
        : PATHS.CATEGORY;
    return `${path}?category=${category}`;
}


export function getHomePagePath() {
    return isInPagesDirectory() ? PATHS.HOME_FROM_PAGES : PATHS.HOME;
}




export function createGameCardHTML(game, detailPagePath) {
    if (!game || !game.id) {
        console.warn('Invalid game object:', game);
        return '';
    }
    
    const finalDetailPath = detailPagePath || getDetailPagePath();
    const gameName = game.name || 'Unknown Game';
    const gameImage = game.image || '';
    
    return `
        <div class="game-card" onclick="window.location.href='${finalDetailPath}?id=${game.id}'">
            <div class="game-card-image-wrapper">
                <img src="${gameImage}" alt="${gameName}" loading="lazy">
            </div>
            <div class="game-card-info">
                <h3 class="game-card-title">${gameName}</h3>
            </div>
        </div>
    `;
}

export function createGameListItemHTML(game, detailPagePath) {
    if (!game || !game.id) {
        console.warn('Invalid game object:', game);
        return '';
    }
    
    const finalDetailPath = detailPagePath || getDetailPagePath();
    const gameName = game.name || 'Unknown Game';
    const gameImage = game.image || '';
    const gameDescription = game.description || '';
    
    return `
        <div class="game-list-item" onclick="window.location.href='${finalDetailPath}?id=${game.id}'">
            <div class="game-list-thumbnail">
                <img src="${gameImage}" alt="${gameName}" loading="lazy">
            </div>
            <div class="game-list-content">
                <h3 class="game-list-title">${gameName}</h3>
                <div class="game-list-description">${gameDescription}</div>
            </div>
        </div>
    `;
}


export function parseDownloads(downloadsStr) {
    if (typeof downloadsStr === 'number') {
        return downloadsStr;
    }
    
    if (typeof downloadsStr !== 'string') {
        return 0;
    }
    
    const upperStr = downloadsStr.toUpperCase();
    
    if (upperStr.includes('K')) {
        return parseFloat(upperStr.replace('K', '')) * 1000;
    } else if (upperStr.includes('M')) {
        return parseFloat(upperStr.replace('M', '')) * 1000000;
    } else {
        return parseFloat(downloadsStr) || 0;
    }
}


export function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}


export function displayEmptyResults(container, title, message) {
    if (!container) return;
    container.innerHTML = `
        <div class="no-results">
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
}



function toggleMenu(isOpen) {
    if (!categoriesMenu) return;
    
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (isOpen) {
        categoriesMenu.classList.add('active');
        if (menuOverlay) {
            menuOverlay.classList.add('active');
        }
    } else {
        categoriesMenu.classList.remove('active');
        if (menuOverlay) {
            menuOverlay.classList.remove('active');
        }
    }
}


function openMenu() {
    toggleMenu(true);
}


function closeMenu() {
    toggleMenu(false);
}


async function generateCategoryItems() {
    if (!categoryItemsContainer) return;
    
    try {
        const categories = await getCategoryOrder();
        if (!Array.isArray(categories) || categories.length === 0) {
            return;
        }
        
       
        categoryItemsContainer.innerHTML = '';
        categories.forEach(category => {
            const categoryName = getCategoryDisplayName(category);
            const categoryItem = createCategoryMenuItem(category, categoryName);
            categoryItemsContainer.appendChild(categoryItem);
        });
    } catch (error) {
        console.error('Failed to generate category items:', error);
    }
}


function createCategoryMenuItem(category, categoryName) {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';
    categoryItem.dataset.category = category;
    
    const categoryNameSpan = document.createElement('span');
    categoryNameSpan.className = 'category-name';
    categoryNameSpan.textContent = categoryName;
    
    categoryItem.appendChild(categoryNameSpan);
    return categoryItem;
}


function handleCategoryClick(e) {
    const categoryItem = e.target.closest(SELECTORS.CATEGORY_ITEM);
    if (!categoryItem) return;
    
    const category = categoryItem.dataset.category;
    
   
    if (category === 'home') {
        window.location.href = getHomePagePath();
    } else {
        window.location.href = getCategoryPagePath(category);
    }
    
   
    closeMenu();
}


let categoryClickHandlerBound = false;
function setupCategoryClickHandlers() {
    if (!categoriesMenu || categoryClickHandlerBound) return;
    categoriesMenu.addEventListener('click', handleCategoryClick);
    categoryClickHandlerBound = true;
}


function initMenuEventListeners() {
   
    if (menuToggle) {
        menuToggle.addEventListener('click', openMenu);
    }
    
   
    if (closeCategories) {
        closeCategories.addEventListener('click', closeMenu);
    }
    
   
    document.addEventListener('click', (e) => {
        if (!categoriesMenu || !menuToggle) return;
        
        const menuOverlay = document.getElementById('menuOverlay');
        const isClickInsideMenu = categoriesMenu.contains(e.target);
        const isClickOnToggle = menuToggle.contains(e.target);
        const isClickOnOverlay = menuOverlay && menuOverlay === e.target;
        
        if ((!isClickInsideMenu && !isClickOnToggle) || isClickOnOverlay) {
            closeMenu();
        }
    });
}




function highlightActiveCategory(category) {
    const categoryItems = document.querySelectorAll(SELECTORS.CATEGORY_ITEM);
    categoryItems.forEach(item => {
        item.classList.toggle('active', item.dataset.category === category);
    });
}


function isValidCategory(category, validCategories) {
    return category && Array.isArray(validCategories) && validCategories.includes(category);
}


async function loadCategoryPage() {
    const gamesGrid = document.getElementById(getElementIdFromSelector(SELECTORS.GAMES_GRID));
    if (!gamesGrid) return;
    
    const category = getUrlParameter('category');
    if (!category) {
        window.location.href = getHomePagePath();
        return;
    }

    try {
       
        const categories = await getCategoryOrder();
        if (!isValidCategory(category, categories)) {
            window.location.href = getHomePagePath();
            return;
        }

       
        highlightActiveCategory(category);
        generateGamesList(category, gamesGrid);
    } catch (error) {
        console.error('Failed to load category page:', error);
        window.location.href = getHomePagePath();
    }
}


function generateGamesList(category, gamesGrid) {
    if (!gamesGrid) return;
    
   
    const games = gameDetails
        .filter(game => game.category === category)
        .sort((a, b) => parseDownloads(b.downloads) - parseDownloads(a.downloads));
    
   
    if (games.length === 0) {
        displayEmptyResults(gamesGrid, 'No games found', 'No games available in this category');
        return;
    }

    const detailPath = getDetailPagePath();
    gamesGrid.innerHTML = games
        .map(game => createGameCardHTML(game, detailPath))
        .join('');
}


async function initPublicFeatures() {
   
    initMenuEventListeners();
    setupCategoryClickHandlers();
    await generateCategoryItems();
}


async function initCategoryPage() {
    const gamesGrid = document.getElementById(getElementIdFromSelector(SELECTORS.GAMES_GRID));
    if (!gamesGrid) return;
    
    try {
        await loadGameData();
        await loadCategoryPage();
    } catch (error) {
        console.error('Failed to initialize category page:', error);
    }
}
document.addEventListener('DOMContentLoaded', async () => {
   
    await initPublicFeatures();
    
   
    await initCategoryPage();
});
