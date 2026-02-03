
import { Category_URL, getImgUrl } from './BaseURL.js';




const REMOTE_DB_URL = Category_URL;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;
const MAX_CATEGORY_ORDER_FIELDS = 10;


const SELECTORS = {
  categoryGrid: '.category-grid',
  currentCategoryArticles: '#currentCategoryArticles',
  categoryArticlesGrid: '#categoryArticlesGrid',
  categoryPageTitle: '#categoryPageTitle',
  categoryCard: '.category-card',
  articleListItem: '.article-list-item',
  retryBtn: '.retry-btn',
  refreshBtn: '.refresh-btn'
};


const STORAGE_KEYS = {
  cachedArticles: 'cachedArticles',
  cachedArticlesTimestamp: 'cachedArticlesTimestamp'
};




class CategoryPage {
  constructor() {
    this.articles = [];
    this.categories = [];
    this.init();
  }

  
  async init() {
    this.showLoadingState();
    await this.loadData();
    
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type) {
      const decodedType = decodeURIComponent(type);
      this.showArticlesByType(decodedType);
    } else {
      this.renderCategories();
    }
  }

 
 
 

  
  async loadData() {
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES) {
      try {
        const response = await fetch(REMOTE_DB_URL);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid or empty data received');
        }
        
        const categoryOrder = this.extractCategoryOrder(data);
        const processed = this.processData(data, categoryOrder);

        if (processed.articles.length === 0) {
          throw new Error('No articles found in dataset');
        }

        this.articles = processed.articles;
        this.categories = processed.categories;
        
       
        this.cacheData(data);
        
       
        break;
        
      } catch (error) {
        retryCount++;
        
        if (retryCount >= MAX_RETRIES) {
          this.showError(
            `Failed to load articles after ${MAX_RETRIES} attempts. ` +
            `Please check your connection and refresh the page.`
          );
          this.loadFallbackData();
        } else {
         
          await this.delay(retryCount * RETRY_DELAY_BASE);
        }
      }
    }
  }

  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  
  cacheData(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.cachedArticles, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.cachedArticlesTimestamp, Date.now().toString());
    } catch (e) {
     
      }
  }

  
  async loadFallbackData() {
    const cachedData = localStorage.getItem(STORAGE_KEYS.cachedArticles);
    
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        const categoryOrder = this.extractCategoryOrder(parsedData);
        const processed = this.processData(parsedData, categoryOrder);
        
        if (processed.articles.length > 0) {
          this.articles = processed.articles;
          this.categories = processed.categories;
          this.showCacheNotice();
          return;
        }
      } catch (e) {
        }
    }
    
    this.showDefaultCategories();
  }

  
  async refreshData() {
    this.showLoadingState();
    await this.loadData();
    
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type) {
      this.showArticlesByType(decodeURIComponent(type));
    } else {
      this.renderCategories();
    }
  }

 
 
 

  
  extractCategoryOrder(data) {
    if (!Array.isArray(data) || data.length === 0 || !data[0]) {
      return [];
    }
    
    const meta = data[0];
    
    for (let i = 1; i <= MAX_CATEGORY_ORDER_FIELDS; i++) {
      const fieldName = `info${i}`;
      if (meta[fieldName] && Array.isArray(meta[fieldName])) {
        return meta[fieldName];
      }
    }
    
    return [];
  }

  
  extractCategoriesFromArticles(articles = this.articles) {
    const categoryMap = new Map();
    
    articles.forEach(article => {
      if (article.type) {
        if (!categoryMap.has(article.type)) {
          categoryMap.set(article.type, {
            id: article.type,
            name: article.type,
            count: 0
          });
        }
        categoryMap.get(article.type).count++;
      }
    });
    
    return Array.from(categoryMap.values());
  }

  
  processData(data, categoryOrder = []) {
    if (!Array.isArray(data) || data.length === 0) {
      return { articles: [], categories: [] };
    }

    const [meta, ...rest] = data;
    const articles = Array.isArray(rest) 
      ? rest.filter(item => item && item.id) 
      : [];

    const extractedCategories = this.extractCategoriesFromArticles(articles);

   
    if (Array.isArray(categoryOrder) && categoryOrder.length > 0) {
      const extractedMap = new Map(
        extractedCategories.map(item => [item.name, item])
      );
      const ordered = categoryOrder
        .map(name => extractedMap.get(name))
        .filter(item => item && item.count > 0);

      if (ordered.length > 0) {
        return { articles, categories: ordered };
      }
    }

    return { articles, categories: extractedCategories };
  }

 
 
 

  
  showError(message) {
    const categoryGrid = this.getCategoryGrid();
    if (!categoryGrid) return;

    categoryGrid.innerHTML = this.createErrorStateHTML(message);
    this.bindRetryButton(categoryGrid);
  }

  
  showLoadingState() {
    const categoryGrid = this.getCategoryGrid();
    if (!categoryGrid) return;

    categoryGrid.innerHTML = this.createLoadingStateHTML();
  }

  
  showCacheNotice() {
    const categoryGrid = this.getCategoryGrid();
    if (!categoryGrid) return;

    categoryGrid.innerHTML = this.createCacheNoticeHTML();
    this.bindRefreshButton(categoryGrid);
    this.renderCategories();
  }

  
  showDefaultCategories() {
    const categoryGrid = this.getCategoryGrid();
    if (!categoryGrid) return;

    categoryGrid.innerHTML = this.createDefaultCategoriesHTML();
    this.bindRefreshButton(categoryGrid);
  }

 
 
 

  
  createErrorStateHTML(message) {
    return `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-text">${this.escapeHtml(message)}</div>
        <button class="retry-btn">Retry</button>
      </div>
    `;
  }

  
  createLoadingStateHTML() {
    return `
      <div class="loading-state">
        <div class="loading-text">Loading articles...</div>
      </div>
    `;
  }

  
  createCacheNoticeHTML() {
    return `
      <div class="cache-notice">
        <div class="notice-icon">📋</div>
        <div class="notice-text">Showing cached data</div>
        <div class="notice-subtext">Some content may be outdated</div>
        <button class="refresh-btn">Refresh Now</button>
      </div>
    `;
  }

  
  createDefaultCategoriesHTML() {
    return `
      <div class="default-categories">
        <div class="default-icon">📚</div>
        <div class="default-text">Default Categories</div>
        <div class="default-subtext">Please check your connection and try again</div>
        <button class="refresh-btn">Refresh Now</button>
      </div>
    `;
  }

  
  createEmptyStateHTML(text, subtext) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">${this.escapeHtml(text)}</div>
        <div class="empty-state-subtext">${this.escapeHtml(subtext)}</div>
      </div>
    `;
  }

  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

 
 
 

  
  getCategoryGrid() {
    return document.querySelector(SELECTORS.categoryGrid);
  }

  
  bindRetryButton(container) {
    const retryBtn = container.querySelector(SELECTORS.retryBtn);
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.refreshData());
    }
  }

  
  bindRefreshButton(container) {
    const refreshBtn = container.querySelector(SELECTORS.refreshBtn);
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }
  }

 
 
 

  
  showArticlesByType(type) {
    const decodedType = type.includes('%') 
      ? decodeURIComponent(type) 
      : type;
    
    const filteredArticles = this.articles.filter(article => {
      if (!article.type) return false;
      return article.type === decodedType || 
             article.type.toLowerCase() === decodedType.toLowerCase();
    });
    
    this.renderArticles(filteredArticles, decodedType);
  }

  
  renderArticles(articles, categoryName) {
   
    const categoryGrid = this.getCategoryGrid();
    if (categoryGrid) {
      categoryGrid.style.display = 'none';
    }

   
    const articlesSection = document.getElementById('currentCategoryArticles');
    const articlesGrid = document.getElementById('categoryArticlesGrid');
    const pageTitle = document.getElementById('categoryPageTitle');
    
    if (!articlesSection || !articlesGrid) {
      return;
    }

   
    if (pageTitle && categoryName) {
      pageTitle.textContent = categoryName;
    }

   
    articlesSection.style.display = 'block';

   
    if (articles.length === 0) {
      articlesGrid.innerHTML = this.createEmptyStateHTML(
        'No articles in this category',
        'Please select another category or check back later'
      );
      return;
    }

   
    const sortedArticles = articles.sort((a, b) => b.id - a.id);

   
    articlesGrid.innerHTML = sortedArticles
      .map((article, index) => this.createArticleItemHTML(article, index + 1))
      .join('');

   
    this.bindArticleEvents();
  }

  
  createArticleItemHTML(article, index) {
    const imageUrl = getImgUrl(article);
    const timeStr = window.Utils?.formatTimestamp?.(article.create_time) || '';
    const title = this.escapeHtml(article.title || '');
    
    return `
      <div class="article-list-item" data-id="${article.id}">
        <div class="article-number">${index}</div>
        <div class="article-thumbnail">
          <img src="${imageUrl}" alt="${title}" onerror="this.style.display='none';">
        </div>
        <div class="article-info">
          <p class="article-title">${title}</p>
          <p class="article-description">${this.escapeHtml(timeStr)}</p>
        </div>
      </div>
    `;
  }

  
  renderCategories() {
    const categoryGrid = this.getCategoryGrid();
    if (!categoryGrid) return;

    const orderedCategories = this.categories;

    if (!orderedCategories || orderedCategories.length === 0) {
      categoryGrid.innerHTML = this.createEmptyStateHTML(
        'No categories available',
        'Please check back later'
      );
      return;
    }

    categoryGrid.innerHTML = orderedCategories
      .map(category => this.createCategoryCardHTML(category))
      .join('');

    this.bindCategoryEvents();
  }

  
  createCategoryCardHTML(category) {
    const categoryName = this.escapeHtml(category.name);
    const count = category.count || 0;
    
    return `
      <div class="category-card" data-category="${categoryName}">
        <div class="category-card-content">
          <h3 class="category-card-title">${categoryName}</h3>
          <p class="category-card-count">${count} articles</p>
        </div>
        <div class="category-card-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    `;
  }

 
 
 

  
  bindCategoryEvents() {
    const categoryCards = document.querySelectorAll(SELECTORS.categoryCard);
    categoryCards.forEach(card => {
      card.addEventListener('click', () => {
        const categoryName = card.dataset.category;
        if (categoryName) {
          this.showArticlesByType(categoryName);
        }
      });
    });
  }

  
  bindArticleEvents() {
    const articleItems = document.querySelectorAll(SELECTORS.articleListItem);
    articleItems.forEach(item => {
      item.addEventListener('click', () => {
        const articleId = item.dataset.id;
        if (articleId && !articleId.startsWith('placeholder-')) {
          window.location.href = `../detail.html?id=${articleId}`;
        }
      });
    });
  }
}




document.addEventListener('DOMContentLoaded', () => {
  new CategoryPage();
});
