
import { getImgUrl, fetchAndCacheApiData } from './BaseURL.js';


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
    this.renderCategoryBar();
    this.renderArticles();
  }

 
  
  async loadData() {
    try {
      
      
      const data = await fetchAndCacheApiData();

      
      if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
        this.categoryOrder = data[0].info1;
      } else {
        this.categoryOrder = [];
      }

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
        name: 'Home'
        
      },
      ...orderedCategories.map(type => {
        const normalizedId = this.normalizeCategoryId(type);
        return {
          id: normalizedId,
          name: type
          
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
      .replace(/\s+/g, '-')
      .replace(/_/g, '-');
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
    const categoryBarContainer = document.querySelector('.bar-container');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchButton = document.getElementById('searchButton');
    
    if (headerSearchToggle && searchContainer && categoryBarContainer) {
      headerSearchToggle.addEventListener('click', () => {
        const isActive = headerSearchToggle.classList.contains('active');
        if (isActive) {
          headerSearchToggle.classList.remove('active');
          searchContainer.style.display = 'none';
          categoryBarContainer.style.display = '';
          if (searchInput) {
            searchInput.value = '';
            this.clearSearch();
          }
        } else {
          headerSearchToggle.classList.add('active');
          searchContainer.style.display = 'flex';
          categoryBarContainer.style.display = 'none';
          if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
          }
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
    const categoryBarContainer = document.querySelector('.bar-container');
    
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
     
      this.showHomeElements();
      this.resetToDefaultCategory();
    }
    
    if (headerSearchToggle && searchContainer && categoryBarContainer) {
      headerSearchToggle.classList.remove('active');
      searchContainer.style.display = 'none';
      categoryBarContainer.style.display = '';
    }
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

  
  hideHomeElements() {
    const categoryBarContainer = document.querySelector('.bar-container');
    if (categoryBarContainer) {
      categoryBarContainer.style.display = 'none';
    }
  }

  
  showHomeElements() {
    const categoryBarContainer = document.querySelector('.bar-container');
    if (categoryBarContainer) {
      categoryBarContainer.style.display = '';
    }
  }

 
  
  switchCategory(category) {
    if (!category) {
      return;
    }

    this.currentCategory = category;
    this.updateSidebarActiveState(category);
    this.updateCategoryBarActiveState(category);
    this.renderArticles();
  }

  
  updateCategoryBarActiveState(category) {
    const categoryButtons = document.querySelectorAll('#categoryBar .category-btn');
    
    categoryButtons.forEach(button => {
      button.classList.remove('active');
      if (button.dataset.category === category) {
        button.classList.add('active');
      }
    });
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

  
  renderCategoryBar() {
    const categoryBar = document.getElementById('categoryBar');
    if (!categoryBar) return;

    if (!this.categories || this.categories.length === 0) {
      categoryBar.innerHTML = '';
      return;
    }

    
    const availableIcons = [
      'public/images/home.png',
      'public/images/finance.png',
      'public/images/loans_mortgages.png',
      'public/images/law.png',
      'public/images/lawyer.png',
      'public/images/car.png',
      'public/images/real_eatate.png',
      'public/images/search.png'
    ];

    
    categoryBar.innerHTML = this.categories
      .map((category, index) => {
        const isActive = category.id === this.currentCategory ? 'active' : '';
        const displayName = category.id === 'all'
          ? 'Home'
          : window.Utils.escapeHtml(category.name);
        
        
        const iconIndex = index % availableIcons.length;
        const iconSrc = window.Utils.escapeHtml(availableIcons[iconIndex]);
        
        return `
          <button class="category-btn ${isActive}" data-category="${category.id}" aria-label="${displayName}">
            <span class="category-icon-wrapper">
              <img
                class="category-icon-img"
                src="${iconSrc}"
                alt="${displayName}"
                onerror="this.onerror=null;this.src='public/images/category.png';"
              />
            </span>
            <span class="category-label">${displayName}</span>
          </button>
        `;
      })
      .join('');
    this.bindCategoryBarEvents();
  }

  
  bindCategoryBarEvents() {
    const categoryButtons = document.querySelectorAll('#categoryBar .category-btn');
    
    categoryButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const categoryId = e.currentTarget.dataset.category;
        
        if (categoryId) {
          this.switchCategory(categoryId);
        }
      });
    });
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
      section.innerHTML = '';
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
    
   
    const uniqueCategories = Object.keys(articlesByCategory);
    
   
    if (uniqueCategories.length === 1 && this.currentCategory && this.currentCategory !== 'all') {
      
      const allArticles = articlesByCategory[uniqueCategories[0]];
      const shuffled = shuffleArray(allArticles);
      let articleIndex = 0;
      categorySections.forEach((section, index) => {
        section.innerHTML = '';
        
        if (articleIndex < shuffled.length) {
          const articlesToShow = shuffled.slice(articleIndex, articleIndex + 4);
          
          articlesToShow.forEach(article => {
            const cardHTML = window.Utils.createHomeArticleCard(article);
            section.insertAdjacentHTML('beforeend', cardHTML);
          });
          
          articleIndex += 4;
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
     
      section.innerHTML = '';
      
      if (categoryArticles.length > 0) {
       
        const shuffled = shuffleArray(categoryArticles);
        const articlesToShow = shuffled.slice(0, 4);
        
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
         
          const shuffled = shuffleArray(categoryArticles);
          const articlesToShow = shuffled.slice(0, 3);
          
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

}



document.addEventListener('DOMContentLoaded', () => {
  window.website = new Website();
});
