
import { Category_URL, getImgUrl, getCategoryOrder } from './BaseURL.js';


const CONFIG = {
  debounceDelay: 300
};


const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};


const SELECTORS = {
  sidebarCategory: '.sidebar-category'
};



const CATEGORY_ICON_MAP = {
  all: 'public/images/home.png',
  home: 'public/images/home.png',
  finance: 'public/images/finance.svg',
  investing: 'public/images/investing.svg',
  invest: 'public/images/investing.svg',
  loans: 'public/images/loans_mortgages.svg',
  'loans-mortgages': 'public/images/loans_mortgages.svg',
  mortgage: 'public/images/loans_mortgages.svg',
  law: 'public/images/law.svg',
  lawyer: 'public/images/lawyer.svg',
  car: 'public/images/car.svg',
  auto: 'public/images/car.svg',
  'real-eatate': 'public/images/real_eatate.svg',
  house: 'public/images/real_eatate.svg',
  movies: 'public/images/movies.svg',
  travel: 'public/images/travel.svg',
  service: 'public/images/service.svg',
  humor: 'public/images/humor.svg',
  diversion: 'public/images/diversion.svg', 
  'pet-life': 'public/images/Pet life.svg',
  Pet_Life: 'public/images/Pet life.svg'
};

const CATEGORY_ICON_FALLBACK = 'public/images/category.png';

class Website {
  constructor() {
    this.currentCategory = null;
    this.articles = [];
    this.categories = [];
    this.categoryOrder = [];
    this.init();
  }

  
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderCategories();
    this.renderArticles();
  }

 
  
  async loadData() {
    try {
      
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.categoryOrder = await getCategoryOrder(data);

      if (Array.isArray(data) && data.length > 0) {
        const [meta, ...rest] = data;
        this.articles = rest;
      } else {
        this.articles = [];
      }
      
      this.generateCategoriesFromArticles();
      
    } catch (error) {
      this.categoryOrder = [];
      this.articles = [];
      this.categories = [];
      this.showErrorState();
    }
  }

  
  generateCategoriesFromArticles() {
   
    const typeSet = new Set();
    this.articles.forEach(article => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });
    
   
    const orderedCategories = this.categoryOrder.filter(type => typeSet.has(type));
    
   
    this.categories = [
      {
        id: 'all',
        name: 'Home',
        icon: this.getCategoryIcon('all', 'Home')
      },
      ...orderedCategories.map(type => {
        const normalizedId = this.normalizeCategoryId(type);
        const iconUrl = this.getCategoryIcon(normalizedId, type);
        return {
          id: normalizedId,
          name: type,
          icon: iconUrl
        };
      })
    ];

   
    if (!this.currentCategory || !this.isCategoryIdValid(this.currentCategory)) {
      this.currentCategory = 'all';
    }
  }

  
  normalizeCategoryId(type) {
    if (!type) {
      return '';
    }
    return type.toLowerCase()
      .replace(/\s*&\s*/g, '-')
      .replace(/\s+/g, '-');
  }

  
  getCategoryIcon(categoryId, categoryName = '') {
    const normalized = this.normalizeCategoryId(categoryId || categoryName || '');
    if (CATEGORY_ICON_MAP[normalized]) {
      return CATEGORY_ICON_MAP[normalized];
    }

    const keywords = `${categoryId || ''} ${categoryName || ''}`.toLowerCase();

    if (keywords.includes('invest')) {
      return CATEGORY_ICON_MAP.investing || CATEGORY_ICON_FALLBACK;
    }

    if (keywords.includes('loan') || keywords.includes('mortgage')) {
      return CATEGORY_ICON_MAP.loans || CATEGORY_ICON_MAP['loans-mortgages'] || CATEGORY_ICON_FALLBACK;
    }

    if (keywords.includes('law')) {
      return CATEGORY_ICON_MAP.law || CATEGORY_ICON_FALLBACK;
    }

    if (keywords.includes('car') || keywords.includes('auto')) {
      return CATEGORY_ICON_MAP.car || CATEGORY_ICON_FALLBACK;
    }

    if (keywords.includes('home') || keywords.includes('real')) {
      return CATEGORY_ICON_MAP['real-eatate'] || CATEGORY_ICON_FALLBACK;
    }

    return CATEGORY_ICON_FALLBACK;
  }

  
  isCategoryIdValid(categoryId) {
    if (!categoryId) {
      return false;
    }
    return this.categories.some(cat => cat.id === categoryId);
  }

 
  
  setupEventListeners() {
    const headerSearchToggle = document.getElementById('headerSearchToggle');
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchButton = document.getElementById('searchButton');
    
    if (headerSearchToggle && searchContainer) {
      headerSearchToggle.addEventListener('click', () => {
        const isActive = headerSearchToggle.classList.contains('active');
        if (isActive) {
          headerSearchToggle.classList.remove('active');
          searchContainer.style.display = 'none';
          if (searchInput) {
            searchInput.value = '';
            this.clearSearch();
          }
          // Show home elements when search box is closed
          this.showHomeElements();
        } else {
          headerSearchToggle.classList.add('active');
          searchContainer.style.display = 'flex';
          if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
          }
          // Hide home elements when search box appears
          this.hideHomeElements();
        }
      });
    }
    const resultsClear = document.getElementById('resultsClear');
    
    if (searchInput) {
     
      const debouncedSearch = window.Utils.debounce(
        (query) => this.handleSearch(query),
        CONFIG.debounceDelay
      );
      
     
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        this.updateSearchUI(query);
        debouncedSearch(query);
      });
      
     
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch(e.target.value);
        }
      });
    }
    
   
    if (searchButton) {
      searchButton.addEventListener('click', () => {
        const query = searchInput ? searchInput.value : '';
        this.handleSearch(query);
      });
    }
    
   
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        this.clearSearch();
      });
    }
    
   
    if (resultsClear) {
      resultsClear.addEventListener('click', () => {
        this.clearSearch();
      });
    }
  }

  
  handleSearch(query) {
    if (!query.trim()) {
     
      this.hideSearchResults();
      this.showHomeElements();
      this.resetToDefaultCategory();
      return;
    }

   
    this.hideHomeElements();

    const filteredArticles = this.filterArticles(query);

    if (filteredArticles.length === 0) {
      this.showNoResultsState();
    } else {
      this.renderArticles(filteredArticles);
    }
   
    this.showSearchResults(filteredArticles.length, query);
  }

  
  hideHomeElements() {
    const homePageContent = document.querySelector('.home-page-content');
    const articlesGrid = document.getElementById('articlesGrid');
    
    // Hide elements outside articlesGrid
    if (homePageContent) {
      const carouselContainer = homePageContent.querySelector('.carousel-container');
      const horizontalScrollContainer = homePageContent.querySelector('.horizontal-scroll-container');
      
      if (carouselContainer) {
        carouselContainer.style.display = 'none';
      }
      
      if (horizontalScrollContainer) {
        horizontalScrollContainer.style.display = 'none';
      }
    }
    
    // Hide elements inside articlesGrid
    if (articlesGrid) {
      const categorySections = articlesGrid.querySelectorAll('.category-section');
      const adsElements = articlesGrid.querySelectorAll('.ads');
      
      categorySections.forEach(section => {
        section.style.display = 'none';
      });
      
      adsElements.forEach(ads => {
        ads.style.display = 'none';
      });
    }
  }

  
  showHomeElements() {
    const homePageContent = document.querySelector('.home-page-content');
    const articlesGrid = document.getElementById('articlesGrid');
    
    // Show elements outside articlesGrid
    if (homePageContent) {
      const carouselContainer = homePageContent.querySelector('.carousel-container');
      const horizontalScrollContainer = homePageContent.querySelector('.horizontal-scroll-container');
      
      if (carouselContainer) {
        carouselContainer.style.display = '';
      }
      
      if (horizontalScrollContainer) {
        horizontalScrollContainer.style.display = '';
      }
    }
    
    // Show elements inside articlesGrid and clean up search results
    if (articlesGrid) {
      const categorySections = articlesGrid.querySelectorAll('.category-section');
      
      categorySections.forEach(section => {
        section.style.display = '';
      });
      
      const results = articlesGrid.querySelector('.results');
      if (results) {
        results.remove();
      }
      
      const emptyState = articlesGrid.querySelector('.empty-state');
      if (emptyState) {
        emptyState.remove();
      }
    }
  }

  
  filterArticles(query) {
    const searchTerm = query.toLowerCase();
    
    return this.articles.filter(article => {
      const title = (article.title || '').toLowerCase();
      const type = (article.type || '').toLowerCase();
      return title.includes(searchTerm) || type.includes(searchTerm);
    });
  }

  
  updateSearchUI(query) {
    const searchClear = document.getElementById('searchClear');
    const searchButton = document.getElementById('searchButton');
    const hasQuery = query.trim().length > 0;
    
    if (searchClear) {
      searchClear.style.display = hasQuery ? 'flex' : 'none';
    }
    
    if (searchButton) {
      searchButton.style.display = hasQuery ? 'none' : 'flex';
    }
  }

  
  clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const headerSearchToggle = document.getElementById('headerSearchToggle');
    const searchContainer = document.getElementById('searchContainer');
    
    if (searchInput) {
      searchInput.value = '';
      this.updateSearchUI('');
      this.hideSearchResults();
      const articlesGrid = document.getElementById('articlesGrid');
      if (articlesGrid) {
        const results = articlesGrid.querySelector('.results');
        if (results) {
          results.style.display = 'none';
        }
      }
     
      this.resetToDefaultCategory();
    }
    
    if (headerSearchToggle && searchContainer) {
      headerSearchToggle.classList.remove('active');
      searchContainer.style.display = 'none';
    }
    
    // Show all home elements when search is cleared
    this.showHomeElements();
  }

  
  showSearchResults(count, query) {
    const resultsBar = document.getElementById('resultsBar');
    const resultsCount = document.getElementById('resultsCount');
    const resultsQuery = document.getElementById('resultsQuery');
    if (resultsBar && resultsCount && resultsQuery) {
      resultsCount.textContent = count;
      resultsQuery.textContent = window.Utils.escapeHtml(query);
      resultsBar.style.display = 'flex';
    }
  }

  
  hideSearchResults() {
    const resultsBar = document.getElementById('resultsBar');
    if (resultsBar) {
      resultsBar.style.display = 'none';
    }
  }

  
  

 
  
  switchCategory(category) {
    if (!category) {
      return;
    }

    this.currentCategory = category;
    this.updateSidebarActiveState(category);
    this.renderArticles();
  }

  


  
  updateSidebarActiveState(category) {
    
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
      item.classList.remove('active');
      
      const itemPage = item.dataset.page;
      if (itemPage === category || (category === 'all' && itemPage === 'home')) {
        item.classList.add('active');
      }
    });
  }

  
  renderCategories() {
    this.bindSidebarCategoryEvents();
    this.updateSidebarActiveState(this.currentCategory);
  }

  


  


  
  bindSidebarCategoryEvents() {
    
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
      
      if (item.hasAttribute('data-category-bound')) {
        return;
      }
      item.setAttribute('data-category-bound', 'true');
      
      item.addEventListener('click', (e) => {
        const itemPage = item.dataset.page;
        
        if (itemPage) {
          
          const categoryId = itemPage === 'home' ? 'all' : itemPage;
          this.switchCategory(categoryId);
        }
      });
    });
  }

  
  resetToDefaultCategory() {
    this.currentCategory = 'all';
    this.renderArticles();
  }
 
 

  
  renderArticles(articlesToRender = null) {
    const articlesGrid = document.getElementById('articlesGrid');
    if (!articlesGrid) return;
    if (articlesToRender) {
     
      this.renderSearchResults(articlesGrid, articlesToRender);
    } else {
     
      this.renderCategoryArticles(articlesGrid);
    }
    this.bindArticleEvents();
  }

  
  renderSearchResults(articlesGrid, articles) {
   
    const adsElements = articlesGrid.querySelectorAll('.ads');
    const categorySections = articlesGrid.querySelectorAll('.category-section');
    
    adsElements.forEach(ads => {
      ads.style.display = 'none';
    });
    
    categorySections.forEach(section => {
      section.style.display = 'none';
     
    });
    
   
    const emptyState = articlesGrid.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }
    
   
    let results = articlesGrid.querySelector('.results');
    if (!results) {
      results = document.createElement('div');
      results.className = 'results';
      articlesGrid.insertAdjacentElement('afterbegin', results);
    } else {
      results.innerHTML = '';
      results.style.display = '';
    }
    
   
    articles.forEach(article => {
      const cardHTML = window.Utils.createHomeArticleCard(article);
      results.insertAdjacentHTML('beforeend', cardHTML);
    });
  }

  
  renderCategoryArticles(articlesGrid) {
   
    const results = articlesGrid.querySelector('.results');
    if (results) {
      results.style.display = 'none';
    }
    
   
    const categorySections = articlesGrid.querySelectorAll('.category-section');
    
    categorySections.forEach(section => {
      section.style.display = '';
    });
    
    const availableArticles = this.articles;

   
    if (!this.currentCategory || this.currentCategory === 'all') {
      if (this.articles.length === 0) {
       
        articlesGrid.innerHTML = this.createEmptyStateHTML(
          '📰',
          'No articles available',
          'Please check your data source or try again later'
        );
      } else if (availableArticles.length === 0) {
        this.appendArticlesWithAds(articlesGrid, []);
      } else {
        this.appendArticlesWithAds(articlesGrid, availableArticles);
      }
      
      const carouselArticles = this.getRandomArticlesForCarousel(this.articles, this.categories);
      this.initCarousel(carouselArticles);
      this.renderHorizontalArticleImages();
      
      return;
    }

   
    const categoryArticles = availableArticles.filter(article => {
      const articleTypeId = article.type 
        ? this.normalizeCategoryId(article.type)
        : '';
      return articleTypeId === this.currentCategory;
    });
    
   
    if (categoryArticles.length === 0) {
      if (this.articles.length === 0) {
        articlesGrid.innerHTML = this.createEmptyStateHTML(
          '📰',
          'No articles available',
          'Please check your data source or try again later'
        );
      } else {
        articlesGrid.innerHTML = this.createEmptyStateHTML(
          '📋',
          'No articles in this category',
          'Try selecting a different category'
        );
      }
    } else {
     
      this.appendArticlesWithAds(articlesGrid, categoryArticles);
    }
    
    const carouselArticles = this.getRandomArticlesForCarousel(this.articles, this.categories);
    this.initCarousel(carouselArticles);
    this.renderHorizontalArticleImages();
  }

  
  appendArticlesWithAds(articlesGrid, articles) {
   
    const emptyState = articlesGrid.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }
    
   
    const adsElements = articlesGrid.querySelectorAll('.ads');
    const categorySections = Array.from(articlesGrid.querySelectorAll('.category-section'));
    
    adsElements.forEach(ads => {
      ads.style.display = '';
    });
    
    categorySections.forEach(section => {
      section.style.display = '';
    });
    
    if (!articles || articles.length === 0) {
     
      categorySections.forEach(section => {
        section.innerHTML = '';
      });
      return;
    }

   
    const articlesByCategory = {};
    articles.forEach(article => {
      const categoryId = article.type 
        ? this.normalizeCategoryId(article.type)
        : 'other';
      
      if (!articlesByCategory[categoryId]) {
        articlesByCategory[categoryId] = [];
      }
      articlesByCategory[categoryId].push(article);
    });
    
   
    const uniqueCategories = Object.keys(articlesByCategory);
    
   
    if (uniqueCategories.length === 1 && this.currentCategory && this.currentCategory !== 'all') {
      
      const allArticles = articlesByCategory[uniqueCategories[0]];
      const shuffled = shuffleArray(allArticles);
      let articleIndex = 0;
      categorySections.forEach((section, index) => {
        if (articleIndex < shuffled.length) {
          const articleItems = section.querySelectorAll('.article-item');
          
         
          for (let i = 0; i < articleItems.length && articleIndex < shuffled.length; i++, articleIndex++) {
            const article = shuffled[articleIndex];
            const cardHTML = window.Utils.createHomeArticleCard(article);
            articleItems[i].outerHTML = cardHTML;
          }
        }
      });
      
      categorySections.forEach((section, index) => {
        section.classList.remove('list-style');
        if (index === 0 || index === 2 || index === 4 || index === 6) {
          section.classList.add('list-style');
        }
      });
      
      return;
    }
    
   
    if (!Array.isArray(this.categoryOrder) || this.categoryOrder.length === 0) {
      const allCategoryNames = Array.from(new Set(
        articles.map(article => article.type).filter(Boolean)
      ));
      this.categoryOrder = allCategoryNames;
    }
    
    let sectionIndex = 0;
    
    this.categoryOrder.forEach(categoryName => {
     
      if (sectionIndex >= categorySections.length) {
        return;
      }
      
      const categoryId = this.normalizeCategoryId(categoryName);
      const categoryArticles = articlesByCategory[categoryId] || [];
      const section = categorySections[sectionIndex];
     
      if (categoryArticles.length > 0) {
       
        const shuffled = shuffleArray(categoryArticles);
        const articleItems = section.querySelectorAll('.article-item');
        
       
        shuffled.forEach((article, idx) => {
          if (articleItems[idx]) {
            const cardHTML = window.Utils.createHomeArticleCard(article);
            articleItems[idx].outerHTML = cardHTML;
          }
        });
      }
     
      
      sectionIndex++;
    });
    
   
    Object.keys(articlesByCategory).forEach(categoryId => {
     
      if (sectionIndex >= categorySections.length) {
        return;
      }
      
      const categoryName = this.categoryOrder.find(cat => 
        this.normalizeCategoryId(cat) === categoryId
      );
      
     
      if (!categoryName) {
        const categoryArticles = articlesByCategory[categoryId] || [];
        const section = categorySections[sectionIndex];
        
        if (categoryArticles.length > 0) {
         
          const shuffled = shuffleArray(categoryArticles);
          const articleItems = section.querySelectorAll('.article-item');
          
         
          shuffled.forEach((article, idx) => {
            if (articleItems[idx]) {
              const cardHTML = window.Utils.createHomeArticleCard(article);
              articleItems[idx].outerHTML = cardHTML;
            }
          });
        }
       
        sectionIndex++;
      }
    });
    
   
   
   
    
    categorySections.forEach((section, index) => {
      section.classList.remove('list-style');
      if (index === 0 || index === 2 || index === 4 || index === 6) {
        section.classList.add('list-style');
      }
    });
  }

  
  bindArticleEvents() {
    window.Utils.bindArticleCardEvents('detail.html');
  }

 
  showErrorState() {
    const articlesGrid = document.getElementById('articlesGrid');
    if (articlesGrid) {
      articlesGrid.innerHTML = this.createErrorStateHTML();
    }
  }

  
  showNoResultsState() {
    const articlesGrid = document.getElementById('articlesGrid');
    if (!articlesGrid) return;
    
    const adsElements = articlesGrid.querySelectorAll('.ads');
    const categorySections = articlesGrid.querySelectorAll('.category-section');
    
    adsElements.forEach(ads => {
      ads.style.display = 'none';
    });
    
    categorySections.forEach(section => {
      section.style.display = 'none';
     
    });
    
    const existingEmptyState = articlesGrid.querySelector('.empty-state');
    if (existingEmptyState) {
      existingEmptyState.remove();
    }
    
   
    const emptyStateHTML = this.createEmptyStateHTML(
      '🔍',
      'No results found',
      'Try searching with different keywords'
    );
    articlesGrid.insertAdjacentHTML('afterbegin', emptyStateHTML);
  }

 
  
  createErrorStateHTML() {
    return `
      <div class="empty-state">
        <div class="empty-icon" style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <div class="empty-text">Failed to load data</div>
        <div class="empty-subtext">Unable to connect to data source</div>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #ba7ac7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 20px;">Retry</button>
      </div>
    `;
  }

  
  createEmptyStateHTML(icon, text, subtext) {
    return `
      <div class="empty-state">
        <div class="empty-icon" style="font-size: 48px; margin-bottom: 20px;">${icon}</div>
        <div class="empty-text">${window.Utils.escapeHtml(text)}</div>
        <div class="empty-subtext">${window.Utils.escapeHtml(subtext)}</div>
      </div>
    `;
  }

  
  createCarouselHTML(articles) {
    if (!articles || articles.length === 0) return '';
    
    const slidesHTML = articles.map((article, index) => {
      const imageUrl = getImgUrl(article);
      const title = window.Utils.escapeHtml(article.title || '');
      const articleId = window.Utils.escapeHtml(String(article.id || ''));
      
      return `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-id="${articleId}" data-index="${index}">
          <img src="${imageUrl}" alt="${title}" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'800\\' height=\\'350\\'%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%23f5f5f5\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\' font-size=\\'16\\'%3ENo Image%3C/text%3E%3C/svg%3E';">
          <div class="carousel-slide-title">${title}</div>
        </div>
      `;
    }).join('');
    
    const dotsHTML = articles.map((_, index) => {
      return `<div class="carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`;
    }).join('');
    
    return `
      <div class="carousel-track" id="carouselTrack">
        ${slidesHTML}
      </div>
      <div class="carousel-controls">
        <button class="carousel-arrow prev" id="carouselPrev">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div class="carousel-dots" id="carouselDots">
          ${dotsHTML}
        </div>
        <button class="carousel-arrow next" id="carouselNext">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    `;
  }

  
  initCarousel(articles) {
    const carouselWrapper = document.getElementById('carouselWrapper');
    const carouselContainer = document.getElementById('carouselContainer');
    
    if (!carouselWrapper || !carouselContainer) return;
    
    if (!articles || articles.length === 0) {
      carouselContainer.classList.add('hidden');
      return;
    }
    
    carouselContainer.classList.remove('hidden');
    carouselWrapper.innerHTML = this.createCarouselHTML(articles);
    
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const dots = document.querySelectorAll('.carousel-dot');
    const slides = document.querySelectorAll('.carousel-slide');
    
    if (slides.length === 0) return;
    
    let currentIndex = 0;
    let autoplayInterval;
    
    const updateCarousel = (index) => {
      currentIndex = index;
      
      slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev-slide', 'next-slide', 'prev-2-slide', 'next-2-slide');
        
        if (i === index) {
          slide.classList.add('active');
        } else if (i === index - 1 || (index === 0 && i === slides.length - 1)) {
          slide.classList.add('prev-slide');
        } else if (i === index + 1 || (index === slides.length - 1 && i === 0)) {
          slide.classList.add('next-slide');
        } else if (i === index - 2 || (index === 0 && i === slides.length - 2) || (index === 1 && i === slides.length - 1)) {
          slide.classList.add('prev-2-slide');
        } else if (i === index + 2 || (index === slides.length - 1 && i === 1) || (index === slides.length - 2 && i === 0)) {
          slide.classList.add('next-2-slide');
        }
      });
      
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
      
      track.style.transform = 'translateX(0)';
    };
    
    const nextSlide = () => {
      const nextIndex = (currentIndex + 1) % slides.length;
      updateCarousel(nextIndex);
    };
    
    const prevSlide = () => {
      const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateCarousel(prevIndex);
    };
    
    const startAutoplay = () => {
      autoplayInterval = setInterval(nextSlide, 4000);
    };
    
    const stopAutoplay = () => {
      clearInterval(autoplayInterval);
    };
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        stopAutoplay();
        prevSlide();
        startAutoplay();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        stopAutoplay();
        nextSlide();
        startAutoplay();
      });
    }
    
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        stopAutoplay();
        updateCarousel(index);
        startAutoplay();
      });
    });
    
    slides.forEach(slide => {
      slide.addEventListener('click', () => {
        const articleId = slide.dataset.id;
        if (articleId) {
          window.location.href = `detail.html?id=${articleId}`;
        }
      });
    });
    
    carouselWrapper.addEventListener('mouseenter', stopAutoplay);
    carouselWrapper.addEventListener('mouseleave', startAutoplay);
    
    setTimeout(() => updateCarousel(0), 100);
    
    startAutoplay();
  }

  
  getRandomArticlesForCarousel(articles, categories, count = 5) {
    const selectedArticles = [];
    const usedCategories = new Set();
    
    const shuffledArticles = shuffleArray(articles);
    
    for (const article of shuffledArticles) {
      if (selectedArticles.length >= count) break;
      
      const category = article.type || 'unknown';
      
      if (!usedCategories.has(category)) {
        selectedArticles.push(article);
        usedCategories.add(category);
      }
    }
    
    if (selectedArticles.length < count) {
      const remainingArticles = shuffledArticles.filter(
        article => !selectedArticles.includes(article)
      );
      selectedArticles.push(...remainingArticles.slice(0, count - selectedArticles.length));
    }
    
    return selectedArticles.slice(0, count);
  }

  renderHorizontalArticleImages() {
    const container = document.getElementById('horizontalArticleImages');
    if (!container) return;
    
    const articles = this.getRandomArticlesForCarousel(this.articles, this.categories, 10);
    
    container.innerHTML = '';
    
    articles.forEach(article => {
      const imageUrl = getImgUrl(article);
      const title = window.Utils.escapeHtml(article.title || '');
      const articleId = window.Utils.escapeHtml(String(article.id || ''));
      
      const imageItem = document.createElement('div');
      imageItem.className = 'article-image-item';
      imageItem.dataset.id = articleId;
      
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = title;
      img.onerror = function() {
        this.onerror = null;
        this.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'48\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23f5f5f5\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'10\'%3ENo Image%3C/text%3E%3C/svg%3E';
      };
      
      imageItem.appendChild(img);
      container.appendChild(imageItem);
    });
    
   
    const imageItems = container.querySelectorAll('.article-image-item');
    imageItems.forEach(item => {
      item.addEventListener('click', () => {
        const articleId = item.dataset.id;
        if (articleId) {
          window.location.href = `detail.html?id=${articleId}`;
        }
      });
    });
  }

}



document.addEventListener('DOMContentLoaded', () => {
  window.website = new Website();
});
