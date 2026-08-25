
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
  articleListItem: '.homepage-article-card',
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
    
    
    if (!this.articles || this.articles.length === 0) {
      this.showError('No articles available');
      return;
    }
    
    this.renderSidebarCategories();
    
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    const categoryGrid = this.getCategoryGrid();
    const articlesSection = document.getElementById('currentCategoryArticles');
    
    if (categoryGrid) {
      categoryGrid.style.display = 'none';
      categoryGrid.innerHTML = '';
    }
    
    if (articlesSection) {
      articlesSection.style.display = 'block';
    }
    
    if (type) {
      const decodedType = decodeURIComponent(type);
      this.showArticlesByType(decodedType);
    } else {
      
      let categoriesToUse = this.categories;
      
      if (!categoriesToUse || categoriesToUse.length === 0) {
        categoriesToUse = this.extractCategoriesFromArticles(this.articles);
        this.categories = categoriesToUse;
      }
      
      if (categoriesToUse && categoriesToUse.length > 0 && this.articles.length > 0) {
        const firstCategory = categoriesToUse[0];
        
        if (firstCategory && firstCategory.name) {
          console.log('Displaying first category:', firstCategory.name);
          this.showArticlesByType(firstCategory.name);
        } else {
          if (categoryGrid) {
            categoryGrid.style.display = 'flex';
          }
          if (articlesSection) {
            articlesSection.style.display = 'none';
          }
          this.renderCategories();
        }
      } else {
        console.warn('No categories or articles available', {
          categoriesCount: categoriesToUse?.length || 0,
          articlesCount: this.articles?.length || 0
        });
        if (categoryGrid) {
          categoryGrid.style.display = 'flex';
        }
        if (articlesSection) {
          articlesSection.style.display = 'none';
        }
        this.renderCategories();
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
        <div class="empty-icon">📭</div>
        <div class="empty-text">${window.Utils.escapeHtml(text)}</div>
        <div class="empty-subtext">${window.Utils.escapeHtml(subtext)}</div>
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
    if (!type) {
      console.warn('showArticlesByType called without type');
      return;
    }
    
    const decodedType = type.includes('%') 
      ? decodeURIComponent(type) 
      : type;
    
    if (!this.articles || this.articles.length === 0) {
      console.warn('No articles available');
      return;
    }
    
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
      categoryGrid.innerHTML = '';
    }

   
    const articlesSection = document.getElementById('currentCategoryArticles');
    const articlesGrid = document.getElementById('categoryArticlesGrid');
    const pageTitle = document.getElementById('categoryPageTitle');
    
    if (!articlesSection || !articlesGrid) {
      return;
    }

   
    articlesSection.style.display = 'block';

   
    if (pageTitle && categoryName) {
      pageTitle.textContent = categoryName;
    }

   
    if (articles.length === 0) {
      articlesGrid.innerHTML = this.createEmptyStateHTML(
        'No articles in this category',
        'Please select another category or check back later'
      );
      return;
    }

   
    const sortedArticles = articles.sort((a, b) => b.id - a.id);

    // 生成文章HTML数组
    const articleHTMLs = sortedArticles.map(article => this.createArticleItemHTML(article));

    // 在第4个元素后插入 ads2（第2排和第3排之间）
    if (articleHTMLs.length > 4) {
      articleHTMLs.splice(4, 0, `
        <div class="ads">
          <div id="div-gpt-ad-category2"></div>
        </div>
      `);
    }
    
    articlesGrid.innerHTML = articleHTMLs.join('');
    this.bindArticleEvents();
    this.updateSidebarActiveState(categoryName);
  }

  
  updateSidebarActiveState(categoryName) {
    const sidebarItems = document.querySelectorAll('.sidebar__item');
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
    const articleId = window.Utils.escapeHtml(String(article.id || ''));
    
    return `
      <a href="../detail.html?id=${articleId}" class="homepage-article-card" data-id="${articleId}">
        <div class="top-desc">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 57 67" fill="none">
            <circle cx="25.4212" cy="54.5" r="10" fill="white" stroke="black" stroke-width="5"></circle>
            <path d="M23.3467 55.442C24.4192 56.3116 25.9935 56.1471 26.8631 55.0746C27.7327 54.0021 27.5682 52.4278 26.4957 51.5582L23.3467 55.442ZM26.4957 51.5582C8.75064 37.1702 9.22752 20.4111 16.7641 12.1893L13.0784 8.81073C3.01497 19.789 4.09186 39.8298 23.3467 55.442L26.4957 51.5582ZM16.7641 12.1893C20.0902 8.56091 26.4602 8.17602 32.6545 11.0985C38.7455 13.9723 43.4212 19.524 43.4212 26.0001H48.4212C48.4212 16.9761 41.9969 9.97775 34.788 6.57655C27.6823 3.22403 18.5523 2.83916 13.0784 8.81073L16.7641 12.1893Z" fill="black"></path>
          </svg>
        </div>
        <div class="card-inner">
          <div class="img-manage">
            <img loading="lazy" decoding="async" src="${imageUrl}" alt="${title}" class="inner-img" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23f5f5f5\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'12\'%3ENo Image%3C/text%3E%3C/svg%3E';">
          </div>
          <div class="homepage-article-card-content">
            <p class="homepage-article-title">${title}</p>
            <span class="homepage-article-date">${timeStr}</span>
          </div>
        </div>
      </a>
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
    const sidebarList = document.getElementById('sidebarList');
    const sidebar = document.getElementById('sidebar');
    
    if (!sidebarList) {
      console.warn('sidebarList element not found');
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
          
          return itemHTML;
        })
        .join('');
    }

    sidebarList.innerHTML = categoriesHTML;

    this.bindSidebarCategoryEvents();
  }

  
  createSidebarCategoryItemHTML(category, isAll = false) {
    const categoryName = window.Utils.escapeHtml(category.name);
    
    return `
      <div class="sidebar__item" data-category="${categoryName}" data-is-all="${isAll}">
        ${categoryName}
      </div>
    `;
  }

  
  bindSidebarCategoryEvents() {
    const sidebarItems = document.querySelectorAll('.sidebar__item');
    
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        const categoryName = item.dataset.category;
        const isAll = item.dataset.isAll === 'true';
        this.handleCategoryClick(categoryName, isAll, sidebarItems);
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
      categoryGrid.style.display = 'flex';
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
        <div class="top-desc">${count} articles</div>
        <div class="card-inner">
          <h3 class="category-card-title">${categoryName}</h3>
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
    // 文章列表项已改为 <a href="../detail.html?id=...">，浏览器原生跳转即可
    // 保留函数以兼容既有调用链
    const articleItems = document.querySelectorAll(SELECTORS.articleListItem);
    articleItems.forEach(item => {
      // 仅作为 fallback：若将来出现非 <a> 的列表项，再走 JS 跳转
      if (item.tagName.toLowerCase() === 'a') return;
      const articleId = item.dataset.id;
      if (articleId && !articleId.startsWith('placeholder-')) {
        item.addEventListener('click', () => {
          window.location.href = `../detail.html?id=${articleId}`;
        });
      }
    });
  }
}



document.addEventListener('DOMContentLoaded', () => {
  new CategoryPage();
});
