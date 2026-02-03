
import { getImgUrl, fetchData } from './BaseURL.js';
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
    this.categoryClickHandler = null;
    this.articleClickHandler = null;
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
        
        const data = await fetchData();
        
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
    
    
    if (meta.info1 && Array.isArray(meta.info1)) {
      return meta.info1;
    }
    
    
    for (let i = 2; i <= MAX_CATEGORY_ORDER_FIELDS; i++) {
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

    const cacheNotice = this.createCacheNoticeHTML();
    this.renderCategories();
    
    setTimeout(() => {
      const noticeElement = document.createElement('div');
      noticeElement.innerHTML = cacheNotice;
      const noticeHTML = noticeElement.firstElementChild;
      if (categoryGrid && noticeHTML) {
        categoryGrid.insertBefore(noticeHTML, categoryGrid.firstChild);
        this.bindRefreshButton(noticeHTML);
      }
    }, 100);
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
        <div class="error-text">${window.Utils.escapeHtml(message)}</div>
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
        <div class="empty-state-text">${window.Utils.escapeHtml(text)}</div>
        <div class="empty-state-subtext">${window.Utils.escapeHtml(subtext)}</div>
      </div>
    `;
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
      .map(article => this.createArticleItemHTML(article))
      .join('');

   
    this.bindArticleEvents();
  }

  
  createArticleItemHTML(article) {
    const imageUrl = getImgUrl(article);
    const timeStr = window.Utils?.formatTimestamp?.(article.create_time) || '';
    const title = window.Utils.escapeHtml(article.title || '');
    const categoryType = window.Utils.escapeHtml(article.type || '');
    
    return `
      <div class="article-list-item" data-id="${article.id}">
        <div class="article-thumbnail">
          <img src="${imageUrl}" alt="${title}" onerror="this.style.display='none';">
        </div>
        <div class="article-info">
          <p class="article-title">${title}</p>
          <div class="article-meta">
           <span class="article-date">${timeStr}</span>
            ${categoryType ? `<span class="article-category-tag">${categoryType}</span>` : ''}
           </div>
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

    requestAnimationFrame(() => {
      this.bindCategoryEvents();
    });
  }

  
  createCategoryCardHTML(category) {
    const categoryName = window.Utils.escapeHtml(category.name);
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
    const categoryGrid = this.getCategoryGrid();
    if (!categoryGrid) return;
    
    if (this.categoryClickHandler) {
      categoryGrid.removeEventListener('click', this.categoryClickHandler);
    }
    
    this.categoryClickHandler = (e) => {
      let target = e.target;
      let categoryCard = null;
      
      while (target && target !== categoryGrid) {
        if (target.classList && target.classList.contains('category-card')) {
          categoryCard = target;
          break;
        }
        target = target.parentElement;
      }
      
      if (categoryCard) {
        e.preventDefault();
        e.stopPropagation();
        const categoryName = categoryCard.dataset.category;
        if (categoryName) {
          this.showArticlesByType(categoryName);
        }
      }
    };
    
    categoryGrid.addEventListener('click', this.categoryClickHandler);
    
    const categoryCards = categoryGrid.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      card.style.cursor = 'pointer';
    });
  }

  
  bindArticleEvents() {
    const articlesGrid = document.getElementById('categoryArticlesGrid');
    if (!articlesGrid) return;
    
    if (this.articleClickHandler) {
      articlesGrid.removeEventListener('click', this.articleClickHandler);
    }
    
    this.articleClickHandler = (e) => {
      let target = e.target;
      let articleItem = null;
      
      while (target && target !== articlesGrid) {
        if (target.classList && target.classList.contains('article-list-item')) {
          articleItem = target;
          break;
        }
        target = target.parentElement;
      }
      
      if (articleItem) {
        e.preventDefault();
        e.stopPropagation();
        const articleId = articleItem.dataset.id;
        if (articleId && !articleId.startsWith('placeholder-')) {
          window.location.href = `../detail.html?id=${articleId}`;
        }
      }
    };
    
    articlesGrid.addEventListener('click', this.articleClickHandler);
    
    const articleItems = articlesGrid.querySelectorAll('.article-list-item');
    articleItems.forEach(item => {
      item.style.cursor = 'pointer';
    });
    
    
  }
}



document.addEventListener('DOMContentLoaded', () => {
  new CategoryPage();
});
