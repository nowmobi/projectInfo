
import { getCategoryOrder, getImgUrl } from './BaseURL.js';


const SELECTORS = {
  articleCard: '.article-card',
  articleListItem: '.article-item',
  smartBackButton: 'smartBackButton',
  sidebarContainer: 'sidebarContainer',
  sidebarToggle: 'sidebarToggle',
  sidebarMenu: 'sidebarMenu',
  sidebarClose: 'sidebarClose',
  sidebarOverlay: 'sidebarOverlay',
  sidebarItem: '.sidebar-item'
};

const CONFIG = {
  escapeKey: 'Escape',
  sidebarCloseDelay: 100
};

const PATHS = {
  pagesDir: '/pages/',
  detailPage: 'detail.html',
  detailPageFromPages: '../detail.html',
  indexPage: 'index.html',
  indexPageFromPages: '../index.html',
  categoryPage: 'pages/category.html'
};


const AUTHOR_IMAGES = [
  'public/images/author_0.png',
  'public/images/author_1.png',
  'public/images/author_2.png'
];


let authorImageIndex = 0;



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
    return window.location.pathname.includes(PATHS.pagesDir);
  },

  
  createHomeArticleCard(article, layoutType = 'grid') {
    const imageUrl = getImgUrl(article);
    const timeStr = this.formatTimestamp(article.create_time) || '';
    const title = this.escapeHtml(article.title || '');
    const categoryType = this.escapeHtml(article.type || '');
    const articleId = this.escapeHtml(String(article.id || ''));
    const author = this.escapeHtml(article.author || 'unknown');
    
    
    if (layoutType === 'grid') {
      const rating = (Math.random() * 2 + 3).toFixed(1);
      const downloads = (Math.random() * 50 + 1).toFixed(1) + 'K';
      
      return `
        <a href="detail.html?id=${articleId}" class="homepage-article-card">
          <div class="top-desc">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 57 67" fill="none">
              <circle cx="25.4212" cy="54.5" r="10" fill="white" stroke="black" stroke-width="5"></circle>
              <path d="M23.3467 55.442C24.4192 56.3116 25.9935 56.1471 26.8631 55.0746C27.7327 54.0021 27.5682 52.4278 26.4957 51.5582L23.3467 55.442ZM26.4957 51.5582C8.75064 37.1702 9.22752 20.4111 16.7641 12.1893L13.0784 8.81073C3.01497 19.789 4.09186 39.8298 23.3467 55.442L26.4957 51.5582ZM16.7641 12.1893C20.0902 8.56091 26.4602 8.17602 32.6545 11.0985C38.7455 13.9723 43.4212 19.524 43.4212 26.0001H48.4212C48.4212 16.9761 41.9969 9.97775 34.788 6.57655C27.6823 3.22403 18.5523 2.83916 13.0784 8.81073L16.7641 12.1893Z" fill="black"></path>
            </svg>
          </div>
          <div class="card-inner">
            <div class="img-manage">
              <img decoding="async" src="${imageUrl}" alt="${title}" class="inner-img">
            </div>
            <div class="homepage-article-card-content">
              <p class="homepage-article-title">${title}</p>
              <span class="homepage-article-date">${timeStr}</span>
            </div>
          </div>
        </a>
      `;
    }
    
    else if (layoutType === 'list') {
      const source = this.escapeHtml(article.source || 'unknown');
      return `
        <a href="detail.html?id=${articleId}" class="article-item list-layout" data-id="${articleId}">
          <div class="article-info">
            <div class="article-img-meta-row">
              <div class="article-meta">
                <div class="article-title-row">
                  <p class="article-title">${title}</p>
                </div>
                <div class="meta-line meta-type-date">
                  <span class="article-date">${timeStr}</span>
                  <span class="meta-author"><span class="author-label">✍️</span><span class="article-author">${author}</span></span>
                </div>
                ${source && source !== 'unknown' ? `<div class="meta-line meta-source"><span class="source-label">📰</span><span class="article-source">${source}</span></div>` : ''}
              </div>
              <div class="article-img">
                <img loading="lazy" decoding="async" src="${imageUrl}" alt="${title}" class="article-image-main" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'110\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23f5f5f5\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'12\'%3ENo Image%3C/text%3E%3C/svg%3E'">
              </div>
            </div>
          </div>
        </a>
      `;
    }
  },

  
  createDetailRecommendedArticleCard(article, decodeUnicode = null) {
    const imageUrl = getImgUrl(article);
    const categoryTag = decodeUnicode 
      ? decodeUnicode(article.type)
      : (article.type || '');
    const timeStr = this.formatTimestamp(article.create_time) || '';
    const title = this.escapeHtml(article.title || '');
    const articleId = this.escapeHtml(String(article.id || ''));
    
    return `
      <a href="detail.html?id=${articleId}" class="homepage-article-card" data-id="${articleId}">
        <div class="top-desc">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 57 67" fill="none">
            <circle cx="25.4212" cy="54.5" r="10" fill="white" stroke="black" stroke-width="5"></circle>
            <path d="M23.3467 55.442C24.4192 56.3116 25.9935 56.1471 26.8631 55.0746C27.7327 54.0021 27.5682 52.4278 26.4957 51.5582L23.3467 55.442ZM26.4957 51.5582C8.75064 37.1702 9.22752 20.4111 16.7641 12.1893L13.0784 8.81073C3.01497 19.789 4.09186 39.8298 23.3467 55.442L26.4957 51.5582ZM16.7641 12.1893C20.0902 8.56091 26.4602 8.17602 32.6545 11.0985C38.7455 13.9723 43.4212 19.524 43.4212 26.0001H48.4212C48.4212 16.9761 41.9969 9.97775 34.788 6.57655C27.6823 3.22403 18.5523 2.83916 13.0784 8.81073L16.7641 12.1893Z" fill="black"></path>
          </svg>
        </div>
        <div class="card-inner">
          <div class="img-manage">
            <img loading="lazy" decoding="async" src="${imageUrl}" alt="${title}" class="inner-img" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23f5f5f5\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'12\'%3ENo Image%3C/text%3E%3C/svg%3E';\n">
          </div>
          <div class="homepage-article-card-content">
            <p class="homepage-article-title">${title}</p>
            <span class="homepage-article-date">${timeStr}</span>
          </div>
        </div>
      </a>
    `;
  },

  
  bindArticleCardEvents(detailPagePath = null) {
    // 卡片已统一改为 <a href> 跳转，无需 JS 绑定 click 事件
    // 保留函数签名以兼容既有调用链（index.js / detail.js / category.js）
    const articleCards = document.querySelectorAll(`${SELECTORS.articleCard}, ${SELECTORS.articleListItem}`);
    articleCards.forEach(card => {
      // 仅作为 fallback：若将来出现非 <a> 的卡片元素，再走 JS 跳转
      if (card.tagName.toLowerCase() !== 'a') {
        const articleId = card.dataset.id;
        const isInPagesDir = this.isInPagesDir();
        const path = detailPagePath || (isInPagesDir ? PATHS.detailPageFromPages : PATHS.detailPage);
        if (articleId && !articleId.startsWith('placeholder-')) {
          card.addEventListener('click', () => {
            window.location.href = `${path}?id=${this.escapeHtml(articleId)}`;
          });
        }
      }
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

 
  
  escapeHtml(text) {
    if (text === null || text === undefined) {
      return '';
    }
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
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
      
      if (sidebarToggle.tagName === 'A') {
        
        return;
      }
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
    // 侧边栏项已改为 <a href>，浏览器原生跳转即可
    // 保留函数以兼容既有调用链
    const sidebarItems = document.querySelectorAll(SELECTORS.sidebarItem);

    sidebarItems.forEach((item) => {
      // <a> 元素直接由浏览器处理，无需 JS 拦截
      if (item.tagName.toLowerCase() === 'a') return;
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


function initBackButton() {
  // #smartBackButton 已统一改为 <a href="../index.html">，浏览器原生跳转即可
  // 保留函数以兼容 DOMContentLoaded 调用链
  const backButton = document.getElementById(SELECTORS.smartBackButton);
  if (!backButton) return;
  // 仅作为 fallback：若将来出现非 <a> 的返回按钮，再走 JS 跳转
  if (backButton.tagName.toLowerCase() === 'a') return;
  backButton.addEventListener('click', (e) => {
    e.preventDefault();
    const homePath = Utils.isInPagesDir()
      ? PATHS.indexPageFromPages
      : PATHS.indexPage;
    window.location.href = homePath;
  });
}

function initBottomNav() {
  // .bottom-nav-item 已统一改为 <a href>，浏览器原生跳转即可
  // 保留函数以兼容 DOMContentLoaded 调用链
  const navItems = document.querySelectorAll('.bottom-nav-item');
  const isInPagesDir = window.location.pathname.includes('/pages/');

  navItems.forEach(item => {
    // <a> 元素直接由浏览器处理，无需 JS 拦截
    if (item.tagName.toLowerCase() === 'a') return;
    item.addEventListener('click', (e) => {
      e.preventDefault();

      const page = item.dataset.page;
      let url = '';

      switch(page) {
        case 'index':
          url = isInPagesDir ? '../index.html' : 'index.html';
          break;
        case 'category':
          url = isInPagesDir ? 'category.html' : 'pages/category.html';
          break;
        case 'content':
          url = isInPagesDir ? 'contact.html' : 'pages/contact.html';
          break;
        case 'about':
          url = isInPagesDir ? 'about.html' : 'pages/about.html';
          break;
        case 'privacy':
          url = isInPagesDir ? 'privacy.html' : 'pages/privacy.html';
          break;
      }

      window.location.href = url;
    });
  });
}

// 在 header 右上角动态注入分类按钮（全站通用，除首页和分类页外）
function initHeaderCategory() {
  // 首页已静态写入分类按钮，跳过
  if (document.body.classList.contains('home-page')) return;
  // 分类页本身不需要分类入口，跳过
  if (document.body.classList.contains('category-page')) return;
  // 已经存在则跳过
  if (document.getElementById('headerCategoryBtn')) return;

  const headerContent = document.querySelector('.header-content');
  if (!headerContent) return;

  const isInPagesDir = window.location.pathname.includes('/pages/');
  const categoryUrl = isInPagesDir ? 'category.html' : 'pages/category.html';

  const wrap = document.createElement('div');
  wrap.className = 'header-actions';
  wrap.innerHTML = `
    <a href="${categoryUrl}" class="bottom-nav-item header-category-btn" id="headerCategoryBtn" data-page="category" aria-label="Category" title="Category">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="6" x2="20" y2="6"></line>
        <line x1="4" y1="12" x2="20" y2="12"></line>
        <line x1="4" y1="18" x2="20" y2="18"></line>
      </svg>
    </a>
  `;
  headerContent.appendChild(wrap);
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebarManager();
  initBackButton();
  initBottomNav();
  initHeaderCategory();
});
