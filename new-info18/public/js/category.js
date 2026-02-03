
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
  articleListItem: '.article-item',
  retryBtn: '.retry-btn',
  refreshBtn: '.refresh-btn'
};

const STORAGE_KEYS = {
  cachedArticles: 'cachedArticles',
  cachedArticlesTimestamp: 'cachedArticlesTimestamp'
};


const DEFAULT_CATEGORY_ICON = '·';


const CATEGORY_ICON_MAP = {
  'finance': '<svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M45.78 45H2.22a1 1 0 0 1-1-1V23.65a1 1 0 0 1 1-1h43.56a1 1 0 0 1 1 1V44a1 1 0 0 1-1 1zM3.22 43h41.56V24.65H3.22z"/><path d="M42.75 32.17a1.09 1.09 0 0 1-.26 0c-2.94-.81-4.8-2.68-5.25-5.27a1 1 0 0 1 1-1.17h4.53a1 1 0 0 1 1 1v4.47a1 1 0 0 1-1 1zm-3.17-4.47a4.59 4.59 0 0 0 2.17 2v-2zM42.75 42h-4.53a1 1 0 0 1-1-1.17c.45-2.6 2.31-4.47 5.25-5.27a1 1 0 0 1 .87.17 1 1 0 0 1 .39.8V41a1 1 0 0 1-.98 1zm-3.17-2h2.17v-2a4.59 4.59 0 0 0-2.17 2zM29.41 24l-1.83-.79a12.7 12.7 0 1 0-23.32 0L2.42 24a14.7 14.7 0 1 1 28.2-5.84A14.58 14.58 0 0 1 29.41 24z"/><path d="M14.92 4h2v19.65h-2z"/><path d="M2.22 17.2h27.4v2H2.22z"/><path d="m22.77 24.05-1.83-.81c2.76-6.28.9-12.16-5.68-18l1.32-1.5c7.22 6.4 9.31 13.26 6.19 20.31z"/><path d="M9.06 24.05C6 17 8 10.14 15.26 3.75l1.32 1.5C10 11.08 8.13 17 10.9 23.24z"/><path d="M15.89 12.52a19.85 19.85 0 0 1-10.27-3l1-1.72c6.22 3.72 12.27 3.72 18.49 0l1 1.72a19.85 19.85 0 0 1-10.22 3zM9.78 42H5.25a1 1 0 0 1-1-1v-4.52a1 1 0 0 1 1.26-1c2.94.8 4.8 2.67 5.25 5.27a1 1 0 0 1-1 1.17zm-3.53-2h2.16a4.53 4.53 0 0 0-2.16-2zM5.25 32.17a1 1 0 0 1-.61-.2 1 1 0 0 1-.39-.8V26.7a1 1 0 0 1 1-1h4.53a1 1 0 0 1 1 1.17c-.45 2.59-2.31 4.46-5.25 5.27zm1-4.47v2a4.53 4.53 0 0 0 2.16-2zM24 42a8.22 8.22 0 1 1 8.22-8.22A8.23 8.23 0 0 1 24 42zm0-14.4a6.22 6.22 0 1 0 6.22 6.22A6.23 6.23 0 0 0 24 27.6z"/><path d="M24 34.82c-2.1 0-3.68-1.09-3.68-2.55s1.58-2.54 3.68-2.54c1.92 0 3.42.91 3.65 2.21a1 1 0 0 1-.81 1.16 1 1 0 0 1-1.16-.81 2.1 2.1 0 0 0-1.68-.56 2.1 2.1 0 0 0-1.68.56 2.26 2.26 0 0 0 1.68.53 1 1 0 0 1 0 2z"/><path d="M24 37.92c-1.92 0-3.42-.91-3.65-2.22a1 1 0 1 1 2-.35 2.05 2.05 0 0 0 1.68.57 2.1 2.1 0 0 0 1.69-.57 2.37 2.37 0 0 0-1.72-.53 1 1 0 0 1 0-2c2.1 0 3.68 1.1 3.68 2.55S26.1 37.92 24 37.92z"/><path d="M24 39.73a1 1 0 0 1-1-1v-9.81a1 1 0 0 1 2 0v9.81a1 1 0 0 1-1 1z"/></svg>'
};


class CategoryPage {
  constructor() {
    this.articles = [];
    this.categories = [];
    this.categoryIcons = {};
    this.init();
  }
  
 
  normalizeCategoryId(type) {
    return type.toLowerCase()
      .replace(/\s*&\s*/g, '-')
      .replace(/\s+/g, '-');
  }
  
 
  getCategoryIcon(categoryName) {
    if (!categoryName) return DEFAULT_CATEGORY_ICON;
    
    
    return CATEGORY_ICON_MAP['finance'] || DEFAULT_CATEGORY_ICON;
  }
  
  async init() {
    this.showLoadingState();
    await this.loadData();
    
    
    this.renderSidebarCategories();
    
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type) {
      const decodedType = decodeURIComponent(type);
      this.showArticlesByType(decodedType);
    } else {
      
      if (this.categories && this.categories.length > 0) {
        const firstCategory = this.categories[0];
        this.showArticlesByType(firstCategory.name);
      } else {
        
        this.renderCategories();
        
        if (this.categories && this.categories.length > 0) {
          const firstCategory = this.categories[0];
          const firstItem = document.querySelector(`.sidebar-item[data-category="${firstCategory.name}"]`);
          if (firstItem) {
            firstItem.classList.add('active');
            this.showArticlesByType(firstCategory.name);
          }
        }
      }
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
    
    
    this.updateSidebarActiveState(categoryName);
  }

  
  updateSidebarActiveState(categoryName) {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
      if (item.dataset.category === categoryName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  
  createArticleItemHTML(article) {
    const imageUrl = getImgUrl(article);
    const timeStr = window.Utils?.formatTimestamp?.(article.create_time) || '';
    const title = window.Utils.escapeHtml(article.title || '');
    const categoryType = window.Utils.escapeHtml(article.type || '');
    
    
    const starsHTML = Array(5).fill(0).map(() => 
      '<svg class="star" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#ffd700"/></svg>'
    ).join('');
    
    
    const downloadCount = this.formatDownloadCount(article.id || Math.floor(Math.random() * 20000) + 5000);
    
    return `
      <div class="article-item" data-id="${article.id}">
        <div class="article-img">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice">
            <image href="${imageUrl}" x="0" y="0" width="100" height="80" preserveAspectRatio="xMidYMid slice" onerror="this.setAttribute('href', 'data:image/svg+xml,%3Csvg xmlns=%5C%27http://www.w3.org/2000/svg%5C%27 width=%5C%27100%5C%27 height=%5C%2780%5C%27%3E%3Crect width=%5C%27100%5C%27 height=%5C%2780%5C%27 fill=%5C%27%23f5f5f5%5C%27/%3E%3Ctext x=%5C%2750%25%5C%27 y=%5C%2750%25%5C%27 text-anchor=%5C%27middle%5C%27 dominant-baseline=%5C%27middle%5C%27 font-size=%5C%2712%5C%27 fill=%5C%27%23999%5C%27%3ENo Image%3C/text%3E%3C/svg%3E')"></image>
          </svg>
        </div>
        <div class="article-info">
          <p class="article-title">${title}</p>
          <span class="article-date">${timeStr}</span>
        </div>
      </div>
    `;
  }

  
  formatDownloadCount(count) {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  
  renderCategories() {
    
    this.renderSidebarCategories();
    
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

  
  renderSidebarCategories() {
    const sidebarList = document.getElementById('sidebarCategoryList');
    const sidebar = document.getElementById('categorySidebar');
    
    if (!sidebarList) {
      
      return;
    }
    
    
    if (sidebar) {
      sidebar.style.display = 'block';
      sidebar.style.visibility = 'visible';
    }

    const orderedCategories = this.categories || [];

    let categoriesHTML = '';
    if (orderedCategories.length > 0) {
      categoriesHTML = orderedCategories
        .map((category, index) => {
          const isLast = index === orderedCategories.length - 1;
          const itemHTML = this.createSidebarCategoryItemHTML(category, false);
          
          if (isLast) {
            return itemHTML.replace('<hr class="sidebar-divider">', '');
          }
          return itemHTML;
        })
        .join('');
    }

    sidebarList.innerHTML = categoriesHTML;

    this.bindSidebarCategoryEvents();
  }

  
  createSidebarCategoryItemHTML(category, isAll = false) {
    const categoryName = window.Utils.escapeHtml(category.name);
   
    const iconChar = this.getCategoryIcon(category.name);
    
    return `
      <div class="sidebar-item" data-category="${categoryName}" data-is-all="${isAll}">
        <span class="category-icon iconfont">${iconChar}</span>
        <span class="category-name">${categoryName}</span>
        <hr class="sidebar-divider">
      </div>
    `;
  }

  
  bindSidebarCategoryEvents() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const categoryIcons = document.querySelectorAll('.category-icon');
    
    
    sidebarItems.forEach(item => {
      item.addEventListener('click', (e) => {
        
        if (e.target.closest('.category-icon')) {
          return;
        }
        
        const categoryName = item.dataset.category;
        const isAll = item.dataset.isAll === 'true';
        this.handleCategoryClick(categoryName, isAll, sidebarItems);
      });
    });
    
    
    categoryIcons.forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.stopPropagation(); 
        const categoryName = icon.dataset.category;
        const isAll = icon.dataset.isAll === 'true';
        this.handleCategoryClick(categoryName, isAll, sidebarItems);
      });
      
      
      const svgElements = icon.querySelectorAll('svg');
      svgElements.forEach(svg => {
        svg.style.pointerEvents = 'auto';
        svg.style.cursor = 'pointer';
      });
    });
  }

  
  handleCategoryClick(categoryName, isAll, sidebarItems) {
    
    sidebarItems.forEach(i => i.classList.remove('active'));
    const targetItem = Array.from(sidebarItems).find(item => 
      item.dataset.category === categoryName && 
      (item.dataset.isAll === 'true') === isAll
    );
    if (targetItem) {
      targetItem.classList.add('active');
    }
    
    if (isAll) {
      
      this.showAllCategories();
    } else {
      
      this.showArticlesByType(categoryName);
    }
  }

  
  showAllCategories() {
    const categoryGrid = this.getCategoryGrid();
    const articlesSection = document.getElementById('currentCategoryArticles');
    
    if (categoryGrid) {
      
      this.renderCategories();
      categoryGrid.style.display = 'grid';
    }
    
    if (articlesSection) {
      articlesSection.style.display = 'none';
    }
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
          window.location.href = `../dd.html?id=${articleId}`;
        }
      });
    });
  }
}



document.addEventListener('DOMContentLoaded', () => {
  new CategoryPage();
});
