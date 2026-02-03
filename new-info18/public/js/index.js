
import { Category_URL, getImgUrl } from './BaseURL.js';


const CONFIG = {
  debounceDelay: 300
};





class Website {
  constructor() {
    this.articles = [];
    this.categories = [];
    this.categoryOrder = [];
    this.init();
  }

  
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderArticles();
    this.renderHeroFromArticles();
    this.renderRandomImages();
  }

 
  
  async loadData() {
    try {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      
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
        name: 'Suggest',
        icon: ''
      },
      ...orderedCategories.map(type => ({
        id: this.normalizeCategoryId(type),
        name: type,
        icon: ''
      }))
    ];
  }

  
  normalizeCategoryId(type) {
    return type.toLowerCase()
      .replace(/\s*&\s*/g, '-')
      .replace(/\s+/g, '-');
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
      this.renderArticles();
      return;
    }

   
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
      this.renderArticles();
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
    
   
    const categorySections = articlesGrid.querySelectorAll('.category-section');
    
    categorySections.forEach(section => {
      section.style.display = '';
    });
    
    const availableArticles = this.articles;

   
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

  renderRandomImages() {
    const container = document.getElementById('randomImagesContainer');
    if (!container || !this.articles || this.articles.length === 0) return;
    
    const shuffled = [...this.articles].sort(() => 0.5 - Math.random());
    const randomArticles = shuffled.slice(0, 8);
    
    container.innerHTML = '';
    
    randomArticles.forEach(article => {
      const imageUrl = getImgUrl(article);
      const articleId = window.Utils.escapeHtml(String(article.id || ''));
      
      const imageItem = document.createElement('div');
      imageItem.className = 'random-image-item';
      imageItem.dataset.id = articleId;
      
      imageItem.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 170" preserveAspectRatio="xMidYMid slice">
          <image href="${imageUrl}" x="0" y="0" width="220" height="170" preserveAspectRatio="xMidYMid slice" onerror="this.setAttribute('href', 'data:image/svg+xml,%3Csvg xmlns=%5C%27http://www.w3.org/2000/svg%5C%27 width=%5C%27220%5C%27 height=%5C%27170%5C%27%3E%3Crect width=%5C%27100%25%5C%27 height=%5C%27100%25%5C%27 fill=%5C%27%23f5f5f5%5C%27/%3E%3Ctext x=%5C%2750%25%5C%27 y=%5C%2750%25%5C%27 text-anchor=%5C%27middle%5C%27 dy=%5C%27.3em%5C%27 fill=%5C%27%23999%5C%27 font-size=%5C%2712%5C%27%3ENo Image%3C/text%3E%3C/svg%3E')"></image>
        </svg>
      `;
      
      imageItem.addEventListener('click', () => {
        window.location.href = `dd.html?id=${articleId}`;
      });
      
      container.appendChild(imageItem);
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
          const isGridLayout = section.classList.contains('grid-layout');
          const itemsToShow = isGridLayout ? 4 : 3;
          const articlesToShow = shuffled.slice(articleIndex, articleIndex + itemsToShow);
          
          articlesToShow.forEach(article => {
            const cardHTML = window.Utils.createHomeArticleCard(article);
            section.insertAdjacentHTML('beforeend', cardHTML);
          });
          
          articleIndex += itemsToShow;
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
        const isGridLayout = section.classList.contains('grid-layout');
        const itemsToShow = isGridLayout ? 4 : 3;
        const articlesToShow = shuffled.slice(0, itemsToShow);
        
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
          const articlesToShow = shuffled.slice(0, 4);
          
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
