

import { loadGameData, getCategoryOrder } from './BaseURL.js';
import { createGameCardHTML, createGameListItemHTML, getCategoryDisplayName, getCategoryPagePath, getDetailPagePath, displayEmptyResults } from './inpublic.js';

const DOM_SELECTORS = {
    SEARCH_INPUT: '#searchInput',
    SEARCH_BTN: '.search-btn',
    SEARCH_ICON_BTN: '#searchIconBtn',
    SEARCH_OVERLAY: '#searchOverlay',
    CATEGORY_SECTION: '.category-section',
    POPULAR_GAMES_WRAPPER: '#popularGamesWrapper'
};


const CONFIG = {
    CATEGORY_GAMES_COUNT: 4,
    SEARCH_DEBOUNCE_DELAY: 300,
    CAROUSEL_GAMES_COUNT: 6
};


const TEXT = {
    NO_GAMES_FOUND: 'No games found',
    SEARCH_PLACEHOLDER: 'Try searching with different keywords',
    NO_GAMES_AVAILABLE: 'No games available in this category'
};


function shuffleArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
        return [];
    }
    
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}


function isValidGameData(gameDetails) {
    return Array.isArray(gameDetails) && gameDetails.length > 0;
}


function getElement(selector, elementName) {
    const element = selector.startsWith('#') 
        ? document.getElementById(selector.slice(1))
        : document.querySelector(selector);
    
    if (!element) {
        console.warn(`${elementName || 'Element'} not found: ${selector}`);
    }
    
    return element;
}




function renderGamesToContainer(container, games, isListStyle = false) {
    if (!container) return;
    
    if (games.length === 0) {
        displayEmptyResults(container, TEXT.NO_GAMES_FOUND, TEXT.SEARCH_PLACEHOLDER);
        return;
    }
    
    if (isListStyle) {
        container.innerHTML = games
            .map(game => createGameListItemHTML(game))
            .join('');
    } else {
        container.innerHTML = games
            .map(game => createGameCardHTML(game))
            .join('');
    }
}




function createCategorySectionHTML(category, isListStyle = false) {
    const categoryName = getCategoryDisplayName(category);
    const categoryPagePath = getCategoryPagePath(category);
    const gridId = `${category}GamesGrid`;
    const containerClass = isListStyle ? 'game-list' : 'game-grid';
    
    return `
        <div class="section-header">
            <h2 class="section-title">${categoryName} Games</h2>
            <div class="section-right">
                <a href="${categoryPagePath}" class="section-more">
                    <svg width="40" height="18" viewBox="0 0 40 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0 L10 9 L0 18" fill="none" stroke="#808080" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 0 L20 9 L10 18" fill="none" stroke="#808080" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            </div>
        </div>
        <div class="${containerClass}" id="${gridId}">
            <!-- 游戏卡片将通过JavaScript动态生成 -->
        </div>
    `;
}


function createPopularGameItemHTML(game, detailPagePath) {
    if (!game || !game.id) {
        return '';
    }
    
    const finalDetailPath = detailPagePath || getDetailPagePath();
    const gameName = game.name || 'Unknown Game';
    const gameImage = game.image || '';
    
    return `
        <div class="popular-game-item" onclick="window.location.href='${finalDetailPath}?id=${game.id}'">
            <div class="popular-game-image">
                <img src="${gameImage}" alt="${gameName}" loading="lazy">
            </div>
        </div>
    `;
}


function getEmptyCategorySections() {
    const allSections = document.querySelectorAll(DOM_SELECTORS.CATEGORY_SECTION);
    return Array.from(allSections).filter(section => {
        return section.children.length === 0;
    });
}


function createCategorySection(referenceElement) {
    if (!referenceElement || !referenceElement.parentNode) {
        return null;
    }
    
    const newSection = document.createElement('section');
    newSection.className = 'category-section';
    referenceElement.parentNode.insertBefore(newSection, referenceElement.nextSibling);
    
    return newSection;
}


function ensureCategorySections(neededCount) {
    const emptySections = getEmptyCategorySections();
    const sectionsToCreate = neededCount - emptySections.length;
    
    if (sectionsToCreate > 0) {
        const allSections = document.querySelectorAll(DOM_SELECTORS.CATEGORY_SECTION);
        const lastSection = Array.from(allSections).pop();
        
        if (lastSection) {
            let currentReference = lastSection;
            for (let i = 0; i < sectionsToCreate; i++) {
                const newSection = createCategorySection(currentReference);
                if (newSection) {
                    currentReference = newSection;
                } else {
                    break;
                }
            }
        }
    }
    
    return getEmptyCategorySections();
}


function populateCategorySection(section, category, loadedGameDetails, sectionIndex) {
    const isListStyle = (sectionIndex + 1) % 2 === 0;
    const isOddSection = (sectionIndex + 1) % 2 === 1;
    const gamesCount = isOddSection ? 6 : 3;
    
    section.innerHTML = createCategorySectionHTML(category, isListStyle);
    section.setAttribute('data-category', category);
   
    const gridId = `${category}GamesGrid`;
    const grid = section.querySelector(`#${gridId}`);
    
    if (!grid) return;
    
    if (isOddSection) {
        grid.classList.add('game-grid-three-columns');
    }
    
   
    const categoryGames = loadedGameDetails.filter(game => game.category === category);
    const shuffledCategoryGames = shuffleArray(categoryGames).slice(0, gamesCount);
    
    if (shuffledCategoryGames.length > 0) {
        renderGamesToContainer(grid, shuffledCategoryGames, isListStyle);
    } else {
        displayEmptyResults(grid, TEXT.NO_GAMES_FOUND, TEXT.NO_GAMES_AVAILABLE);
    }
}


async function generatePopularGames(loadedGameDetails) {
    if (!isValidGameData(loadedGameDetails)) {
        return;
    }
    
    const popularGamesWrapper = document.querySelector(DOM_SELECTORS.POPULAR_GAMES_WRAPPER);
    if (!popularGamesWrapper) {
        return;
    }
    
    try {
        const shuffledGames = shuffleArray(loadedGameDetails);
        const popularGames = shuffledGames.slice(0, 6);
        
        if (popularGames.length > 0) {
            popularGamesWrapper.innerHTML = popularGames
                .map(game => createPopularGameItemHTML(game))
                .join('');
        }
    } catch (error) {
        console.error('Failed to generate popular games:', error);
    }
}

async function generateCategorySections(loadedGameDetails) {
    if (!isValidGameData(loadedGameDetails)) {
        return;
    }
    
    try {
        // 生成热门游戏
        await generatePopularGames(loadedGameDetails);
        
        const categories = await getCategoryOrder();
        
        if (!Array.isArray(categories) || categories.length === 0) {
            return;
        }
        
        
        const availableSections = ensureCategorySections(categories.length);
        
        
        categories.forEach((category, index) => {
            if (index >= availableSections.length) return;
            
            const section = availableSections[index];
            populateCategorySection(section, category, loadedGameDetails, index);
        });
        
        
        for (let i = categories.length; i < availableSections.length; i++) {
            availableSections[i].style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to generate category sections:', error);
    }
}


function filterGames(games, searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return games.filter(game => {
        const name = (game?.name || '').toLowerCase();
        const description = (game?.description || '').toLowerCase();
        return name.includes(lowerSearchTerm) || description.includes(lowerSearchTerm);
    });
}


function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}


function normalizeSearchTerm(searchTerm) {
    return (searchTerm || '').toLowerCase().trim();
}


function displaySearchResults(games, searchTerm) {
    const allSections = document.querySelectorAll(DOM_SELECTORS.CATEGORY_SECTION);
    const allAds = document.querySelectorAll('.ads');
    const carouselContainer = document.querySelector('.carousel-container');
    
    if (carouselContainer) {
        carouselContainer.style.display = 'none';
    }
    
    allAds.forEach(ad => {
        ad.style.display = 'none';
    });
    
    if (games.length === 0) {
        allSections.forEach(section => {
            section.style.display = 'none';
        });
        
        const firstSection = allSections[0];
        if (firstSection) {
            firstSection.style.display = 'block';
            firstSection.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">Search Results</h2>
                </div>
                <div class="game-grid game-grid-three-columns"></div>
            `;
            const gridContainer = firstSection.querySelector('.game-grid');
            if (gridContainer) {
                displayEmptyResults(gridContainer, TEXT.NO_GAMES_FOUND, `No games found for "${searchTerm}". ${TEXT.SEARCH_PLACEHOLDER}`);
            }
        }
        return;
    }
    
    allSections.forEach((section, index) => {
        if (index === 0) {
            section.style.display = 'block';
            section.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">Search Results (${games.length})</h2>
                </div>
                <div class="game-grid game-grid-three-columns">
                    ${games.map(game => createGameCardHTML(game)).join('')}
                </div>
            `;
        } else {
            section.style.display = 'none';
        }
    });
}

function clearSearchResults() {
    const allSections = document.querySelectorAll(DOM_SELECTORS.CATEGORY_SECTION);
    const allAds = document.querySelectorAll('.ads');
    const carouselContainer = document.querySelector('.carousel-container');
    
    if (carouselContainer) {
        carouselContainer.style.display = '';
    }
    
    allAds.forEach(ad => {
        ad.style.display = '';
    });
    
    allSections.forEach(section => {
        section.style.display = '';
    });
}

function initSearchFunctionality(searchInput, searchBtn, loadedGameDetails) {
    if (!searchInput) return;
    
    const performSearch = (rawSearchTerm) => {
        const searchTerm = normalizeSearchTerm(
            rawSearchTerm !== undefined ? rawSearchTerm : searchInput.value
        );
        
        if (searchTerm === '') {
            clearSearchResults();
            return;
        }
        
        const filteredGames = filterGames(loadedGameDetails, searchTerm);
        displaySearchResults(filteredGames, searchTerm);
    };
    
    const debouncedSearch = debounce((rawSearchTerm) => {
        performSearch(rawSearchTerm);
    }, CONFIG.SEARCH_DEBOUNCE_DELAY);
    
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            searchInput.focus();
            performSearch();
        });
    }
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = normalizeSearchTerm(e.target.value);
        
        if (searchTerm === '') {
            clearSearchResults();
        } else {
            debouncedSearch(e.target.value);
        }
    });
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
}


function getSearchIconSVG() {
    return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="var(--text-primary)" stroke-width="2"/>
            <path d="m21 21-4.35-4.35" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;
}

function getCloseIconSVG() {
    return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="6" y1="6" x2="18" y2="18" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round"/>
            <line x1="18" y1="6" x2="6" y2="18" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;
}

function toggleSearchIcon(isOpen) {
    const searchIconBtn = getElement(DOM_SELECTORS.SEARCH_ICON_BTN, 'Search icon button');
    if (searchIconBtn) {
        searchIconBtn.innerHTML = isOpen ? getCloseIconSVG() : getSearchIconSVG();
    }
}

function openSearchOverlay() {
    const searchOverlay = getElement(DOM_SELECTORS.SEARCH_OVERLAY, 'Search overlay');
    if (searchOverlay) {
        searchOverlay.classList.add('active');
        toggleSearchIcon(true);
        const searchInput = getElement(DOM_SELECTORS.SEARCH_INPUT, 'Search input');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    }
}

function closeSearchOverlay() {
    const searchOverlay = getElement(DOM_SELECTORS.SEARCH_OVERLAY, 'Search overlay');
    if (searchOverlay) {
        searchOverlay.classList.remove('active');
        toggleSearchIcon(false);
        const searchInput = getElement(DOM_SELECTORS.SEARCH_INPUT, 'Search input');
        if (searchInput) {
            searchInput.value = '';
        }
        clearSearchResults();
    }
}

function initSearchOverlay() {
    const searchIconBtn = getElement(DOM_SELECTORS.SEARCH_ICON_BTN, 'Search icon button');
    const searchOverlay = getElement(DOM_SELECTORS.SEARCH_OVERLAY, 'Search overlay');
    
    if (searchIconBtn) {
        searchIconBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = searchOverlay?.classList.contains('active');
            if (isOpen) {
                closeSearchOverlay();
            } else {
                openSearchOverlay();
            }
        });
    }
    
    if (searchOverlay) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                closeSearchOverlay();
            }
        });
    }
}

async function initHomePage() {
   
    const searchInput = getElement(DOM_SELECTORS.SEARCH_INPUT, 'Search input');
    const searchBtn = getElement(DOM_SELECTORS.SEARCH_BTN, 'Search button');
    
   
    if (!searchInput) {
        console.error('Required DOM elements not found');
        return;
    }
    
    try {
       
        const loadedGameDetails = await loadGameData();
        
       
        if (!isValidGameData(loadedGameDetails)) {
            console.error('Game data not loaded or invalid');
            return;
        }
        
       
        initSearchOverlay();
        initSearchFunctionality(searchInput, searchBtn, loadedGameDetails);
        generateCarousel(loadedGameDetails);
        initCarousel();
       
        await generateCategorySections(loadedGameDetails);
    } catch (error) {
        console.error('Failed to initialize home page:', error);
    }
}


function createCarouselSlideHTML(game, index) {
    const gameName = game?.name || 'Unknown Game';
    const gameImage = game?.image || 'https://via.placeholder.com/400x300';
    const gameCategory = getCategoryDisplayName(game?.category || '');
    const gameDescription = game?.description || '';
    const detailPath = getDetailPagePath();
    const gameUrl = `${detailPath}?id=${game?.id}`;
    
    return `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}">
            <div class="carousel-background">
                <img src="${gameImage}" alt="${gameName}" class="carousel-background-img" loading="lazy">
            </div>
            <div class="carousel-content" onclick="window.location.href='${gameUrl}'" style="cursor: pointer;">
                <div class="carousel-text">
                    <h3 class="carousel-title">${gameName}</h3>
                    <div class="carousel-description">${gameDescription}</div>
                    <div class="carousel-category">${gameCategory}</div>
                </div>
                <div class="carousel-image">
                    <img src="${gameImage}" alt="${gameName}" loading="lazy">
                </div>
            </div>
        </div>
    `;
}

function createCarouselIndicatorHTML(index) {
    return `<span class="carousel-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>`;
}

function generateCarousel(games) {
    const carouselWrapper = document.getElementById('carouselWrapper');
    const carouselIndicators = document.getElementById('carouselIndicators');
    
    if (!carouselWrapper || !carouselIndicators) return;
    
    if (!Array.isArray(games) || games.length === 0) {
        carouselWrapper.innerHTML = '';
        carouselIndicators.innerHTML = '';
        return;
    }
    
    const validGames = games.filter(game => {
        return game && game.id !== null && game.id !== undefined && game.id !== '';
    });
    
    if (validGames.length === 0) {
        carouselWrapper.innerHTML = '';
        carouselIndicators.innerHTML = '';
        return;
    }
    
    const shuffledGames = shuffleArray(validGames);
    const selectedGames = shuffledGames.slice(0, CONFIG.CAROUSEL_GAMES_COUNT);
    
    carouselWrapper.innerHTML = selectedGames
        .map((game, index) => createCarouselSlideHTML(game, index))
        .join('');
    
    carouselIndicators.innerHTML = selectedGames
        .map((_, index) => createCarouselIndicatorHTML(index))
        .join('');
}


function initCarousel() {
    const carouselWrapper = document.getElementById('carouselWrapper');
    const slides = carouselWrapper?.querySelectorAll('.carousel-slide');
    const carouselIndicators = document.getElementById('carouselIndicators');
    const dots = carouselIndicators?.querySelectorAll('.carousel-dot');
    
    if (!carouselWrapper || !slides || slides.length === 0) return;
    
    let currentSlide = 0;
    let carouselInterval;
    
    function showSlide(index) {
        if (index < 0) {
            currentSlide = slides.length - 1;
        } else if (index >= slides.length) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }
        
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentSlide);
        });
        
        if (dots) {
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }
    }
    
    function nextSlide() {
        showSlide(currentSlide + 1);
    }
    
    function startCarousel() {
        carouselInterval = setInterval(nextSlide, 5000);
    }
    
    function stopCarousel() {
        if (carouselInterval) {
            clearInterval(carouselInterval);
        }
    }
    
    if (dots) {
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                stopCarousel();
                showSlide(index);
                startCarousel();
            });
        });
    }
    
    carouselWrapper.addEventListener('mouseenter', stopCarousel);
    carouselWrapper.addEventListener('mouseleave', startCarousel);
    
    startCarousel();
}

document.addEventListener('DOMContentLoaded', initHomePage);


