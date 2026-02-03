
import { getCategoryOrder, getImgUrl } from './BaseURL.js';


const SELECTORS = {
  articleCard: '.article-card',
  articleListItem: '.article-item',
  smartBackButton: '#smartBackButton',
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

  
  createHomeArticleCard(article) {
    const imageUrl = getImgUrl(article);
    const timeStr = this.formatTimestamp(article.create_time) || '';
    const title = this.escapeHtml(article.title || '');
    const categoryType = this.escapeHtml(article.type || '');
    const articleId = this.escapeHtml(String(article.id || ''));
    
    
    return `
      <div class="article-item" data-id="${articleId}">
        <div class="article-img">
          <img src="${this.escapeHtml(imageUrl)}" alt="${title}" class="article-image-main" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'140\\' height=\\'110\\'%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%23f5f5f5\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\' font-size=\\'12\\'%3ENo Image%3C/text%3E%3C/svg%3E';">
        </div>
        <div class="article-info">
          ${categoryType ? `<span class="category-tag">${categoryType}</span>` : ''}
          <p class="article-title">${title}</p>
          <span class="article-date">${timeStr}</span>
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
    const articleCards = document.querySelectorAll(`${SELECTORS.articleCard}, ${SELECTORS.articleListItem}`);
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


function initBackButton() {
  const backButton = document.getElementById(SELECTORS.smartBackButton);
  if (backButton) {
    backButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      
      let homePath = backButton.getAttribute('href');
      if (!homePath) {
        homePath = Utils.isInPagesDir() 
          ? PATHS.indexPageFromPages 
          : PATHS.indexPage;
      }
      
      
      if (homePath && homePath.trim() !== '') {
        window.location.href = homePath;
      }
    });
  }
}


function initScrollToTop() {
  
  if (document.getElementById('scrollToTopBtn')) {
    return;
  }

  const scrollToTopBtn = document.createElement('button');
  scrollToTopBtn.id = 'scrollToTopBtn';
  scrollToTopBtn.title = 'back to top';
  scrollToTopBtn.innerHTML = '<span>↑</span>';
  
  
  scrollToTopBtn.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  document.body.appendChild(scrollToTopBtn);
  
  
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.style.display = 'block';
    } else {
      scrollToTopBtn.style.display = 'none';
    }
  });
}


document.addEventListener('DOMContentLoaded', function() {
  initScrollToTop();
});


function adjustTextColorBasedOnBg() {
  
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  
  function getBrightness(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    
    return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  }

  
  function applyTextColor(brightness) {
    const isLight = brightness > 0.6; 
    const textColor = isLight ? '#333' : '#fff'; 
    
    
    document.documentElement.style.setProperty('--text-color', textColor);
    document.documentElement.style.setProperty('--text-secondary-color', isLight ? '#666' : 'rgba(255,255,255,0.8)');
    
    
    const elements = document.querySelectorAll(`
      .header, .footer, .category-btn.active, .category-tag, 
      .recommended::before, .about-header, .privacy-header,
      .recommended-list .article-card .article-title, .recommended-list .article-card .article-tag,
      .about-section p, .privacy-section p, .about-section h2, .privacy-section h2,
      .values-item h3, .values-item p, .article-title
    `);
    
    elements.forEach(el => {
      el.style.color = textColor;
    });
    
    
    document.querySelectorAll('.category-btn').forEach(btn => {
      if (!btn.classList.contains('active')) {
        btn.style.color = isLight ? '#6b7280' : '#e5e7eb'; 
      }
    });
  }

  
  const rootStyles = getComputedStyle(document.documentElement);
  let color1 = rootStyles.getPropertyValue('--color1').trim();
  let color2 = rootStyles.getPropertyValue('--color2').trim();
  
  
  if(color1.startsWith('rgb')) {
    const rgbMatch = color1.match(/\d+/g);
    if(rgbMatch) {
      color1 = '#' + rgbMatch.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }
  }
  
  if(color2.startsWith('rgb')) {
    const rgbMatch = color2.match(/\d+/g);
    if(rgbMatch) {
      color2 = '#' + rgbMatch.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }
  }
  
  
  const brightness1 = getBrightness(color1);
  const brightness2 = getBrightness(color2);
  const avgBrightness = (brightness1 + brightness2) / 2;
  
  applyTextColor(avgBrightness);
}


document.addEventListener('DOMContentLoaded', () => {
  initSidebarManager();
  initBackButton();
  
  
  adjustTextColorBasedOnBg();
  
  
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target;
        if (target === document.documentElement) {
          
          const styles = getComputedStyle(target);
          const newColor1 = styles.getPropertyValue('--color1');
          const newColor2 = styles.getPropertyValue('--color2');
          
          if (
            newColor1 !== document.documentElement.style.getPropertyValue('--prev-color1') ||
            newColor2 !== document.documentElement.style.getPropertyValue('--prev-color2')
          ) {
            
            document.documentElement.style.setProperty('--prev-color1', newColor1);
            document.documentElement.style.setProperty('--prev-color2', newColor2);
            
            
            adjustTextColorBasedOnBg();
          }
        }
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style']
  });
});
