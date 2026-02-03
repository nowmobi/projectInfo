
import { Category_URL, getImgUrl, getCategoryOrder, getArticlesData } from './BaseURL.js';



const CONFIG = {
  debounceDelay: 300,
  carouselInterval: 5000,
  maxFeaturedArticles: 5
};


const SELECTORS = {
  carouselContainer: '.carousel-container',
  carouselItem: '.carousel-item',
  carouselIndicator: '.carousel-indicator',
  sidebarCategory: '.sidebar-category'
};




class Website {
  constructor() {
    this.currentCategory = null;
    this.articles = [];
    this.categories = [];
    this.categoryOrder = [];
    this.carouselAutoPlayInterval = null;
    this.init();
  }

  
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderCategories();
    this.renderFeaturedBanner();
    this.renderArticles();
  }

 
 
 
  
  async loadData() {
    try {
      
      this.categoryOrder = await getCategoryOrder();
      
      
      const articlesData = await getArticlesData();
      
      if (Array.isArray(articlesData) && articlesData.length > 0) {
        const [meta, ...rest] = articlesData;
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
        name: 'Suggest',
        icon: ''
      },
      ...orderedCategories.map(type => ({
        id: this.normalizeCategoryId(type),
        name: type,
        icon: ''
      }))
    ];

   
    if (!this.currentCategory || !this.isCategoryIdValid(this.currentCategory)) {
      this.currentCategory = 'all';
    }
  }

  
  normalizeCategoryId(type) {
    return type.toLowerCase()
      .replace(/\s*&\s*/g, '-')
      .replace(/\s+/g, '-');
  }

  
  isCategoryIdValid(categoryId) {
    if (!categoryId) {
      return false;
    }
    return this.categories.some(cat => cat.id === categoryId);
  }

 
 
 

  
  setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
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
    
   
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        this.clearSearch();
      });
    }
    
   
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
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
    const searchIcon = document.querySelector('.search-icon');
    const hasQuery = query.trim().length > 0;
    
    if (searchClear) {
      searchClear.style.display = hasQuery ? 'block' : 'none';
    }
    
    if (searchIcon) {
      searchIcon.style.opacity = hasQuery ? '0' : '1';
    }
  }

  
  clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
      this.updateSearchUI('');
     
      this.hideSearchResults();
     
      const articlesGrid = document.getElementById('articlesGrid');
      if (articlesGrid) {
        const searchResultsContainer = articlesGrid.querySelector('.search-results-container');
        if (searchResultsContainer) {
          searchResultsContainer.style.display = 'none';
        }
      }
     
      this.showHomeElements();
     
      this.resetToDefaultCategory();
    }
  }

  
  showSearchResults(count, query) {
    const searchResultsBar = document.getElementById('searchResultsBar');
    const searchResultsCount = document.getElementById('searchResultsCount');
    const searchQuery = document.getElementById('searchQuery');
    
    if (searchResultsBar && searchResultsCount && searchQuery) {
      searchResultsCount.textContent = count;
      searchQuery.textContent = this.escapeHtml(query);
      searchResultsBar.style.display = 'flex';
    }
  }

  
  hideSearchResults() {
    const searchResultsBar = document.getElementById('searchResultsBar');
    if (searchResultsBar) {
      searchResultsBar.style.display = 'none';
    }
  }

  
  hideHomeElements() {
    const featuredBanner = document.getElementById('featuredBanner');
    if (featuredBanner) {
      featuredBanner.style.display = 'none';
    }
  }

  
  showHomeElements() {
    const featuredBanner = document.getElementById('featuredBanner');
    if (featuredBanner) {
      featuredBanner.style.display = '';
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
    const sidebarCategories = document.querySelectorAll(SELECTORS.sidebarCategory);
    
    sidebarCategories.forEach(cat => {
      cat.classList.remove('active');
      if (cat.dataset.category === category) {
        cat.classList.add('active');
      }
    });
  }

  
  renderCategories() {
    this.bindSidebarCategoryEvents();
    this.updateSidebarActiveState(this.currentCategory);
  }

  
  bindSidebarCategoryEvents() {
    const sidebarCategories = document.querySelectorAll(SELECTORS.sidebarCategory);
    
    sidebarCategories.forEach(category => {
      category.addEventListener('click', (e) => {
        const categoryId = e.currentTarget.dataset.category;
        
        if (categoryId) {
          this.switchCategory(categoryId);
        }
      });
    });
  }

  
  resetToDefaultCategory() {
    this.currentCategory = 'all';
    this.renderArticles();
  }

 
 
 

  
  renderFeaturedBanner() {
    const carouselWrapper = document.getElementById('carouselWrapper');
    const carouselIndicators = document.getElementById('carouselIndicators');
    
    if (!carouselWrapper || !carouselIndicators) return;
    
    if (this.articles.length === 0) {
      carouselWrapper.innerHTML = this.createLoadingStateHTML('Loading featured articles...');
      carouselIndicators.innerHTML = '';
      return;
    }

   
    const shuffled = [...this.articles].sort(() => Math.random() - 0.5);
    const featuredArticles = shuffled.slice(0, Math.min(CONFIG.maxFeaturedArticles, this.articles.length));

   
    carouselWrapper.innerHTML = featuredArticles
      .map((article, index) => this.createCarouselItemHTML(article, index))
      .join('');

   
    carouselIndicators.innerHTML = featuredArticles
      .map((article, index) => this.createCarouselIndicatorHTML(index))
      .join('');

   
    this.initCarousel(featuredArticles.length);
  }

  
  createCarouselItemHTML(article, index) {
    const imageUrl = getImgUrl(article);
    const title = this.escapeHtml(article.title || '');
    const type = this.escapeHtml(article.type || 'Editor');
    const isActive = index === 0 ? 'active' : '';
    
    return `
      <div class="carousel-item ${isActive}" data-id="${article.id}" data-index="${index}">
        <div class="carousel-content">
          <div class="carousel-text">
            <p class="carousel-title">${title}</p>
            <span class="carousel-byline">${type}</span>
          </div>
          <div class="carousel-image">
            <img src="${imageUrl}" alt="${title}" onerror="this.style.display='none';">
          </div>
        </div>
      </div>
    `;
  }

  
  createCarouselIndicatorHTML(index) {
    const isActive = index === 0 ? 'active' : '';
    return `<button class="carousel-indicator ${isActive}" data-index="${index}"></button>`;
  }

  
  initCarousel(totalItems) {
    if (totalItems <= 1) return;

    let currentIndex = 0;
    const carouselItems = document.querySelectorAll(SELECTORS.carouselItem);
    const indicators = document.querySelectorAll(SELECTORS.carouselIndicator);

   
    const showSlide = (index) => {
      carouselItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
      });

      indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
      });

      currentIndex = index;
    };

   
    const nextSlide = () => {
      const nextIndex = (currentIndex + 1) % totalItems;
      showSlide(nextIndex);
    };

   
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        showSlide(index);
        resetAutoPlay();
      });
    });

   
    const startAutoPlay = () => {
      this.carouselAutoPlayInterval = setInterval(nextSlide, CONFIG.carouselInterval);
    };

   
    const resetAutoPlay = () => {
      if (this.carouselAutoPlayInterval) {
        clearInterval(this.carouselAutoPlayInterval);
      }
      startAutoPlay();
    };

   
    const carouselContainer = document.querySelector(SELECTORS.carouselContainer);
    if (carouselContainer) {
      carouselContainer.addEventListener('mouseenter', () => {
        if (this.carouselAutoPlayInterval) {
          clearInterval(this.carouselAutoPlayInterval);
        }
      });

      carouselContainer.addEventListener('mouseleave', () => {
        startAutoPlay();
      });
    }

   
    startAutoPlay();
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
      section.innerHTML = '';
    });
    
   
    const emptyState = articlesGrid.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }
    
   
    let searchResultsContainer = articlesGrid.querySelector('.search-results-container');
    if (!searchResultsContainer) {
      searchResultsContainer = document.createElement('div');
      searchResultsContainer.className = 'search-results-container';
      articlesGrid.insertAdjacentElement('afterbegin', searchResultsContainer);
    } else {
      searchResultsContainer.innerHTML = '';
      searchResultsContainer.style.display = '';
    }
    
   
    articles.forEach(article => {
      const cardHTML = window.Utils.createHomeArticleCard(article);
      searchResultsContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
  }


  
  renderCategoryArticles(articlesGrid) {
   
    const searchResultsContainer = articlesGrid.querySelector('.search-results-container');
    if (searchResultsContainer) {
      searchResultsContainer.style.display = 'none';
    }
    
   
    const adsElements = articlesGrid.querySelectorAll('.ads');
    const categorySections = articlesGrid.querySelectorAll('.category-section');
    
    adsElements.forEach(ads => {
      ads.style.display = '';
    });
    
    categorySections.forEach(section => {
      section.style.display = '';
    });
    
    const featuredBanner = document.getElementById('featuredBanner');
    
   
    const displayedIds = new Set();
    if (featuredBanner) {
      const carouselItems = featuredBanner.querySelectorAll(SELECTORS.carouselItem);
      carouselItems.forEach(item => {
        if (item.dataset.id) {
          displayedIds.add(item.dataset.id);
        }
      });
    }

   
    const availableArticles = this.articles.filter(
      article => !displayedIds.has(String(article.id))
    );

   
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
      
     
      section.innerHTML = '';
      
      if (categoryArticles.length > 0) {
       
        const shuffled = [...categoryArticles].sort(() => Math.random() - 0.5);
        const articlesToShow = shuffled.slice(0, 2);
        
       
        articlesToShow.forEach(article => {
          const cardHTML = window.Utils.createHomeArticleCard(article);
          section.insertAdjacentHTML('beforeend', cardHTML);
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
        section.innerHTML = '';
        
        if (categoryArticles.length > 0) {
         
          const shuffled = [...categoryArticles].sort(() => Math.random() - 0.5);
          const articlesToShow = shuffled.slice(0, 2);
          
          articlesToShow.forEach(article => {
            const cardHTML = window.Utils.createHomeArticleCard(article);
            section.insertAdjacentHTML('beforeend', cardHTML);
          });
        }
       
        
        sectionIndex++;
      }
    });
    
   
    while (sectionIndex < categorySections.length) {
      categorySections[sectionIndex].innerHTML = '';
      sectionIndex++;
    }
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
      section.innerHTML = '';
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
        <div class="empty-state-icon" style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <div class="empty-state-text">Failed to load data</div>
        <div class="empty-state-subtext">Unable to connect to data source</div>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #ba7ac7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 20px;">Retry</button>
      </div>
    `;
  }

  
  createEmptyStateHTML(icon, text, subtext) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon" style="font-size: 48px; margin-bottom: 20px;">${icon}</div>
        <div class="empty-state-text">${this.escapeHtml(text)}</div>
        <div class="empty-state-subtext">${this.escapeHtml(subtext)}</div>
      </div>
    `;
  }

  
  createLoadingStateHTML(message) {
    return `
      <div style="text-align: center; padding: 40px; color: #999;">
        ${this.escapeHtml(message)}
      </div>
    `;
  }

  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}




document.addEventListener('DOMContentLoaded', () => {
  window.website = new Website();
});
