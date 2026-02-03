
import { getCategoryOrder, getImgUrl } from './BaseURL.js';




const SELECTORS = {
  articleCard: '.article-card',
  sidebarMenu: 'sidebarMenu',
  sidebarOverlay: 'sidebarOverlay',
  sidebarToggle: 'sidebarToggle',
  sidebarClose: 'sidebarClose',
  sidebarContainer: 'sidebarContainer',
  sidebarItem: '.sidebar-item',
  smartBackButton: 'smartBackButton'
};

const PATHS = {
  pagesDir: '/pages/',
  detailPage: 'detail.html',
  detailPageFromPages: '../detail.html',
  indexPage: 'index.html',
  indexPageFromPages: '../index.html',
  categoryPage: 'pages/category.html'
};

const CONFIG = {
  sidebarCloseDelay: 100,
  escapeKey: 'Escape'
};




const Utils = {
  
  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  
  formatTimestamp(timestamp, locale = 'en-US') {
    if (timestamp === undefined || timestamp === null) {
      return '';
    }

    let value = Number(timestamp);
    if (!Number.isFinite(value)) {
      return '';
    }

   
    if (Math.abs(value) > 1e12) {
      value = value / 1000;
    }

    const date = new Date(value * 1000);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  },

  
  isInPagesDir() {
    const pathname = window.location.pathname;
    // 检查路径是否包含 /pages/ 或 pages/
    return pathname.includes('/pages/') || pathname.includes('pages/');
  },

  
  createArticleCard(article, decodeUnicode = null) {
    const imageUrl = getImgUrl(article);
    const categoryTag = decodeUnicode 
      ? decodeUnicode(article.type) || 'unknown category'
      : (article.type || 'unknown type');
    const timeStr = this.formatTimestamp(article.create_time) || '';
    const title = this.escapeHtml(article.title || '');
    const articleId = this.escapeHtml(String(article.id || ''));
    
    return `
      <div class="article-card" data-id="${articleId}">
        <div class="article-image">
          <img src="${this.escapeHtml(imageUrl)}" alt="${title}" onerror="this.style.display='none';">
        </div>
        <div class="article-content">
          <p class="article-title">${title}</p>
          <div class="article-tag">
           <p>${this.escapeHtml(timeStr)}</p>
           <p class="article-type">${this.escapeHtml(categoryTag)}</p>
          </div>
        </div>
      </div>
    `;
  },

  
  createHomeArticleCard(article) {
    const imageUrl = getImgUrl(article);
    const categoryTag = article.type || 'unknown type';
    const timeStr = this.formatTimestamp(article.create_time) || '';
    const title = this.escapeHtml(article.title || '');
    const articleId = this.escapeHtml(String(article.id || ''));
    
    return `
      <div class="article-card" data-id="${articleId}">
        <div class="article-image">
          <img src="${this.escapeHtml(imageUrl)}" alt="${title}" onerror="this.style.display='none';">
        </div>
        <div class="article-content">
          <p class="article-title">${title}</p>
          <div class="article-tag">
           <p>${this.escapeHtml(timeStr)}</p>
           <p class="article-type">${this.escapeHtml(categoryTag)}</p>
          </div>
        </div>
      </div>
    `;
  },

  
  createDetailRecommendedArticleCard(article, decodeUnicode = null) {
    const imageUrl = getImgUrl(article);
    const categoryTag = decodeUnicode 
      ? decodeUnicode(article.type) || 'unknown category'
      : (article.type || 'unknown type');
    const timeStr = this.formatTimestamp(article.create_time) || '';
    const title = this.escapeHtml(article.title || '');
    const articleId = this.escapeHtml(String(article.id || ''));
    
    return `
      <div class="article-card" data-id="${articleId}">
        <div class="article-image">
          <img src="${this.escapeHtml(imageUrl)}" alt="${title}" onerror="this.style.display='none';">
        </div>
        <div class="article-content">
          <p class="article-title">${title}</p>
          <div class="article-tag">
           <p>${this.escapeHtml(timeStr)}</p>
           <p class="article-type">${this.escapeHtml(categoryTag)}</p>
          </div>
        </div>
      </div>
    `;
  },

  
  bindArticleCardEvents(detailPagePath = null) {
    const articleCards = document.querySelectorAll(SELECTORS.articleCard);
    const isInPagesDir = this.isInPagesDir();
    const path = detailPagePath || (isInPagesDir ? PATHS.detailPageFromPages : PATHS.detailPage);
    
    articleCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const articleId = card.dataset.id;
        if (articleId && !articleId.startsWith('placeholder-')) {
          window.location.href = `${path}?id=${this.escapeHtml(articleId)}`;
        }
      });
    });
  },

  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

 
 
 

  
  openSidebar() {
    const sidebarMenu = document.getElementById(SELECTORS.sidebarMenu);
    const sidebarOverlay = document.getElementById(SELECTORS.sidebarOverlay);
    
    if (sidebarMenu) {
      sidebarMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    
    if (sidebarOverlay) {
      sidebarOverlay.classList.add('active');
    }
  },

  
  closeSidebar() {
    const sidebarMenu = document.getElementById(SELECTORS.sidebarMenu);
    const sidebarOverlay = document.getElementById(SELECTORS.sidebarOverlay);
    
    if (sidebarMenu) {
      sidebarMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove('active');
    }
  },

  
  toggleSidebar() {
    const sidebarMenu = document.getElementById(SELECTORS.sidebarMenu);
    if (sidebarMenu && sidebarMenu.classList.contains('active')) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  },

  
  escapeHtml(text) {
    if (text === null || text === undefined) {
      return '';
    }
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }
};


window.Utils = Utils;


class SidebarManager {
  constructor() {
    this.categories = [];
    this.isInPagesDir = Utils.isInPagesDir();
    this.init();
  }

  
  async init() {
    await this.loadCategories();
    this.renderSidebar();
    this.bindEvents();
  }

 
 
 

  
  async loadCategories() {
    const normaliseCategories = (list) => {
      if (!Array.isArray(list)) return [];
      const trimmed = list
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
      return Array.from(new Set(trimmed));
    };

    try {
      const categoryOrder = await getCategoryOrder();
      const categories = normaliseCategories(categoryOrder);
      
      if (categories.length > 0) {
        this.categories = categories;
        return;
      }
    } catch (error) {
     
    }

    if (!this.categories || this.categories.length === 0) {
      this.categories = [];
    }
  }

 
 
 

  
  getPath(path) {
    if (this.isInPagesDir) {
     
      if (path.startsWith('pages/')) {
        return path.replace('pages/', '');
      } else if (path === PATHS.indexPage) {
        return PATHS.indexPageFromPages;
      }
      return path;
    } else {
     
      return path;
    }
  }

 
 
 

  
  renderSidebar() {
    let sidebarContainer = document.getElementById(SELECTORS.sidebarContainer);
    if (!sidebarContainer) {
      sidebarContainer = document.createElement('div');
      sidebarContainer.id = SELECTORS.sidebarContainer;
      document.body.appendChild(sidebarContainer);
    }

    const homeLink = this.getPath(PATHS.indexPage);
    const categoryBasePath = this.getPath(PATHS.categoryPage);

   
    const categoriesHTML = this.categories
      .map(categoryName => this.createCategoryItemHTML(categoryName, categoryBasePath))
      .join('');

   
    const sidebarHTML = this.createSidebarHTML(homeLink, categoriesHTML);

    sidebarContainer.innerHTML = sidebarHTML;
  }

  
  createCategoryItemHTML(categoryName, categoryBasePath) {
    const encodedName = encodeURIComponent(categoryName);
    const dataPage = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
    const escapedName = Utils.escapeHtml(categoryName);
    
    return `
      <a href="${categoryBasePath}?type=${encodedName}" class="sidebar-item" data-page="${dataPage}">
        <span>${escapedName}</span>
      </a>
    `;
  }

  
  createSidebarHTML(homeLink, categoriesHTML) {
    return `
      <div class="sidebar-menu" id="sidebarMenu">
        <div class="sidebar-content">
          <div class="sidebar-header">
            <h3>Menu</h3>
            <button class="sidebar-close" id="sidebarClose">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="sidebar-items">
            <a href="${homeLink}" class="sidebar-item" data-page="home">
              <span>Home</span>
            </a>
            <div class="sidebar-category">
              ${categoriesHTML}
            </div>
          </div>
        </div>
      </div>
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;
  }

 
 
 

  
  bindEvents() {
    const sidebarToggle = document.getElementById(SELECTORS.sidebarToggle);
    const sidebarMenu = document.getElementById(SELECTORS.sidebarMenu);
    const sidebarClose = document.getElementById(SELECTORS.sidebarClose);
    const sidebarOverlay = document.getElementById(SELECTORS.sidebarOverlay);

   
    if (sidebarToggle && !sidebarToggle.hasAttribute('data-bound')) {
      sidebarToggle.setAttribute('data-bound', 'true');
      sidebarToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        Utils.toggleSidebar();
      });
    }

   
    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => Utils.closeSidebar());
    }

   
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => Utils.closeSidebar());
    }

   
    this.bindSidebarNavigation();

   
    this.bindKeyboardEvents(sidebarMenu);
  }

  
  bindKeyboardEvents(sidebarMenu) {
    document.addEventListener('keydown', (e) => {
      if (e.key === CONFIG.escapeKey && sidebarMenu && sidebarMenu.classList.contains('active')) {
        Utils.closeSidebar();
      }
    });
  }

  
  bindSidebarNavigation() {
    const sidebarItems = document.querySelectorAll(SELECTORS.sidebarItem);
    
    sidebarItems.forEach((item) => {
      const href = item.getAttribute('href');
      
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
       
        if (href) {
          window.location.href = href;
        }
        
       
        setTimeout(() => {
          this.closeSidebar();
        }, CONFIG.sidebarCloseDelay);
      });
    });
  }

  
  openSidebar() {
    Utils.openSidebar();
  }

  
  closeSidebar() {
    Utils.closeSidebar();
  }
}






function initSidebarManager() {
  if (document.getElementById(SELECTORS.sidebarContainer)) {
    window.sidebarManager = new SidebarManager();
  }
}


// 定义返回按钮点击处理函数
function handleBackButtonClick(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // 确定正确的首页路径
  const pathname = window.location.pathname;
  const isInPages = pathname.includes('/pages/') || pathname.includes('pages/');
  const homePath = isInPages ? '../index.html' : 'index.html';
  
  // 跳转到首页
  window.location.href = homePath;
  return false;
}

function initBackButton() {
  // 设置返回按钮的函数
  function setupBackButton() {
    const backButton = document.getElementById(SELECTORS.smartBackButton);
    if (backButton) {
      // 先移除所有可能的事件监听器
      const newButton = backButton.cloneNode(true);
      backButton.parentNode.replaceChild(newButton, backButton);
      
      // 确定正确的首页路径
      const pathname = window.location.pathname;
      const isInPages = pathname.includes('/pages/') || pathname.includes('pages/');
      const homePath = isInPages ? '../index.html' : 'index.html';
      
      // 设置 href 属性（作为备用方案）
      newButton.href = homePath;
      
      // 绑定事件监听器（使用捕获阶段，确保优先执行）
      newButton.addEventListener('click', handleBackButtonClick, true);
      
      // 同时设置 onclick 作为备用方案
      newButton.onclick = handleBackButtonClick;
    }
  }
  
  // 立即执行（如果 DOM 已加载）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupBackButton);
  } else {
    setupBackButton();
  }
  
  // 延迟执行作为备用方案，确保按钮能正常工作
  setTimeout(setupBackButton, 200);
}




document.addEventListener('DOMContentLoaded', () => {
  initSidebarManager();
  initBackButton();
});
