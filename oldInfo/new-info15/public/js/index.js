
import { Category_URL, getImgUrl, getCategoryOrder } from './BaseURL.js';


const CONFIG = {
  debounceDelay: 300
};

const CATEGORY_ICON_POOL = [
  '\ue634', '\ue600', '\ue601', '\ue602', '\ue603',
  '\ue604', '\ue605', '\ue606', '\ue607',
  '\ue608', '\ue609', '\ue60a', '\ue60b',
  '\ue60c', '\ue60d', '\ue60e', '\ue60f'
];
const DEFAULT_CATEGORY_ICON = '·';
const HOME_CATEGORY_ICON = '\ue630';


const CATEGORY_ICON_MAP = {
  'investing': '\ue62a',
  'finance': '\ue62e',
  'loans-mortgages': '\ue62f',
  'real-estate': '\ue62d',
  'car': '\ue62c',
  'law': '\ue631',
  'lawyer': '\ue62b'
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
    this.renderCategoryBar();
    this.renderArticles();
    this.renderHeroFromArticles();
  }

 
  
  async loadData() {
    try {
     
      this.categoryOrder = await getCategoryOrder();
      
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

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
    const searchButton = document.getElementById('searchButton');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const headerSearchToggle = document.getElementById('headerSearchToggle');
    const searchContainer = document.querySelector('.home-search-container');
    const heroSection = document.querySelector('.hero');
    
    
    if (headerSearchToggle && searchContainer) {
      headerSearchToggle.addEventListener('click', () => {
        const isShowing = searchContainer.classList.contains('show');
        if (isShowing) {
          
          searchContainer.classList.remove('show');
          if (heroSection) {
            heroSection.style.display = '';
          }
        } else {
          
          searchContainer.classList.add('show');
          if (heroSection) {
            heroSection.style.display = 'none';
          }
          
          if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
          }
        }
      });
    }
    
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
    const searchContainer = document.querySelector('.home-search-container');
    const heroSection = document.querySelector('.hero');
    
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
    
    
    if (searchContainer) {
      searchContainer.classList.remove('show');
    }
    if (heroSection) {
      heroSection.style.display = '';
    }
  }

  
  showSearchResults(count, query) {
    const searchResultsBar = document.getElementById('searchResultsBar');
    const searchResultsCount = document.getElementById('searchResultsCount');
    const searchQuery = document.getElementById('searchQuery');
    if (searchResultsBar && searchResultsCount && searchQuery) {
      searchResultsCount.textContent = count;
      searchQuery.textContent = window.Utils.escapeHtml(query);
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
    const categoryBarContainer = document.querySelector('.category-bar-container');
    if (categoryBarContainer) {
      categoryBarContainer.style.display = 'none';
    }
  }

  
  showHomeElements() {
    const categoryBarContainer = document.querySelector('.category-bar-container');
    if (categoryBarContainer) {
      categoryBarContainer.style.display = '';
    }
  }

 
  
  switchCategory(category) {
    if (!category) {
      return;
    }

    this.currentCategory = category;
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

  
  renderCategoryBar() {
    const categoryBar = document.getElementById('categoryBar');
    if (!categoryBar) return;

    if (!this.categories || this.categories.length === 0) {
      categoryBar.innerHTML = '';
      return;
    }

    this.assignCategoryIcons();

    categoryBar.innerHTML = this.categories
      .map(category => {
        const isActive = category.id === this.currentCategory ? 'active' : '';
        const iconChar = this.categoryIcons?.[category.id] || '';
        let displayName;
        
        if (category.id === 'all') {
          displayName = 'hot';
        } else {
          displayName = window.Utils.escapeHtml(category.name);
        }
        
        return `
          <button class="category-btn ${isActive}" data-category="${category.id}">
            ${category.id === 'all' ? `<span class="category-icon iconfont">${HOME_CATEGORY_ICON}</span>` : ''}
            ${category.id !== 'all' && iconChar ? `<span class="category-icon iconfont">${iconChar}</span>` : ''}
            <span class="category-label">${displayName}</span>
          </button>
        `;
      })
      .join('');
    this.bindCategoryBarEvents();
  }

  assignCategoryIcons() {
    if (!Array.isArray(this.categories)) return;
    if (!this.categoryIcons) this.categoryIcons = {};
    const usableCategories = this.categories.filter(c => c.id && c.id !== 'all');
    usableCategories.forEach((cat, idx) => {
      if (this.categoryIcons[cat.id]) return;
      const mapped = CATEGORY_ICON_MAP[cat.id];
      if (mapped) {
        this.categoryIcons[cat.id] = mapped;
        return;
      }
      const icon = CATEGORY_ICON_POOL[idx % CATEGORY_ICON_POOL.length] || DEFAULT_CATEGORY_ICON;
      this.categoryIcons[cat.id] = icon;
    });
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
    
    const categoryResultsContainer = articlesGrid.querySelector('.category-results-container');
    if (categoryResultsContainer) {
      categoryResultsContainer.style.display = 'none';
    }
    
   
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
    
    const categoryResultsContainer = articlesGrid.querySelector('.category-results-container');
    if (categoryResultsContainer) {
      categoryResultsContainer.style.display = 'none';
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

  renderHeroFromArticles() {
    const heroContainer = document.getElementById('heroCarousel');
    const dotsContainer = document.getElementById('heroCarouselDots');
    if (!heroContainer || !this.articles || this.articles.length === 0) return;

    const categories = (this.categories || []).filter(cat => cat.id && cat.id !== 'all');

    
    const heroArticles = categories
      .map(cat => {
        
        const categoryArticles = this.articles.filter(article => {
          const articleCat = article.type ? this.normalizeCategoryId(article.type) : '';
          return articleCat === cat.id;
        });
        
        
        if (categoryArticles.length > 0) {
          const randomIndex = Math.floor(Math.random() * categoryArticles.length);
          return categoryArticles[randomIndex];
        }
        return null;
      })
      .filter(Boolean);

    if (heroArticles.length === 0) return;

    heroContainer.innerHTML = heroArticles
      .map((article, idx) => this.createHeroSlideHTML(article, idx === 0))
      .join('');

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
    }

    this.bindHeroCTA();
    initHeroCarousel();
  }

  createHeroSlideHTML(article, isActive) {
    const imageUrl = getImgUrl(article);
    const title = window.Utils.escapeHtml(article.title || 'Untitled');
    const category = window.Utils.escapeHtml(article.type || 'Featured');
    const rawDesc = article.description || article.summary || article.intro || '';
    const desc = window.Utils.escapeHtml(rawDesc);
    const articleId = window.Utils.escapeHtml(String(article.id || ''));

    return `
      <div class="hero-item${isActive ? ' active' : ''}" data-id="${articleId}">
        <div class="hero-media">
          <img src="${imageUrl}" alt="${title}" class="hero-img" onerror="this.style.display='none';">
        </div>
        <div class="hero-body">
          <h2 class="hero-title">${title}</h2>
          <p class="hero-text">${desc}</p>
          <button class="hero-btn" type="button" data-id="${articleId}">${category}</button>
        </div>
      </div>
    `;
  }

  bindHeroCTA() {
    
    const heroItems = document.querySelectorAll('.hero-item');
    heroItems.forEach(item => {
      item.addEventListener('click', (e) => {
        
        if (e.target.classList.contains('hero-btn')) {
          return;
        }
        const id = item.dataset.id;
        if (id && !id.startsWith('placeholder-')) {
          window.location.href = `dd.html?id=${window.Utils.escapeHtml(id)}`;
        }
      });
    });
    
    
    const ctas = document.querySelectorAll('.hero-btn');
    ctas.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        const id = btn.dataset.id;
        if (id && !id.startsWith('placeholder-')) {
          window.location.href = `dd.html?id=${window.Utils.escapeHtml(id)}`;
        }
      });
    });
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
      const shuffled = [...allArticles].sort(() => Math.random() - 0.5);
      let articleIndex = 0;
      categorySections.forEach((section, index) => {
        section.innerHTML = '';
        
        if (articleIndex < shuffled.length) {
          const articlesToShow = shuffled.slice(articleIndex, articleIndex + 3);
          
          articlesToShow.forEach(article => {
            const cardHTML = window.Utils.createHomeArticleCard(article);
            section.insertAdjacentHTML('beforeend', cardHTML);
          });
          
          articleIndex += 3;
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
       
        const shuffled = [...categoryArticles].sort(() => Math.random() - 0.5);
        const articlesToShow = shuffled.slice(0, 3);
        
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
    window.Utils.bindArticleCardEvents('dd.html');
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
        <div class="empty-state-text">${window.Utils.escapeHtml(text)}</div>
        <div class="empty-state-subtext">${window.Utils.escapeHtml(subtext)}</div>
      </div>
    `;
  }

}



document.addEventListener('DOMContentLoaded', () => {
  window.website = new Website();
});

function initHeroCarousel() {
  const carousel = document.getElementById('heroCarousel');
  const dotsContainer = document.getElementById('heroCarouselDots');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('.hero-item'));
  if (slides.length === 0) return;

  let current = slides.findIndex(slide => slide.classList.contains('active'));
  if (current < 0) {
    current = 0;
    slides[0].classList.add('active');
  }

  const dots = [];

  const setActive = (index) => {
    slides[current].classList.remove('active');
    if (dots[current]) {
      dots[current].classList.remove('active');
    }

    slides[index].classList.add('active');
    if (dots[index]) {
      dots[index].classList.add('active');
    }

    current = index;
  };

  const goTo = (index) => {
    setActive(index);
    restart();
  };

  if (dotsContainer && slides.length > 1) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `hero-dot${idx === current ? ' active' : ''}`;
      dot.addEventListener('click', () => goTo(idx));
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });
  }

  const next = () => goTo((current + 1) % slides.length);

  let timerId = null;
  const restart = () => {
    if (timerId) {
      clearInterval(timerId);
    }
    if (slides.length > 1) {
      timerId = setInterval(next, 5000);
    }
  };

  restart();

  carousel.addEventListener('mouseenter', () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  });

  carousel.addEventListener('mouseleave', restart);
}
