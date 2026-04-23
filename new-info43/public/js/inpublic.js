
import { getImgUrl } from './BaseURL.js';


const SELECTORS = {
  articleCard: '.article-card',
  articleListItem: '.article-item',
  smartBackButton: 'smartBackButton'
};

const PATHS = {
  pagesDir: '/pages/',
  detailPage: 'dd.html',
  detailPageFromPages: '../dd.html',
  indexPage: 'index.html',
  indexPageFromPages: '../index.html'
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
    const summary = this.escapeHtml(
      (article.description || article.summary || article.intro || '').slice(0, 120)
    );
    return `
      <div class="article-item" data-id="${articleId}">
        <div class="article-info">
          <p class="article-title">${title}</p>
          ${summary ? `<p class="article-summary">${summary}</p>` : ''}
          <span class="article-date">${timeStr}</span>
          <button class="article-cta" type="button" data-id="${articleId}">${categoryType || 'Read more'}</button>
        </div>
        <div class="article-img">
          <img src="${this.escapeHtml(imageUrl)}" alt="${title}" class="article-image-main" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'220\\' height=\\'170\\'%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%23f5f5f5\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\' font-size=\\'12\\'%3ENo Image%3C/text%3E%3C/svg%3E';">
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

    const ctas = document.querySelectorAll('.article-cta');
    ctas.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const targetId = id && !id.startsWith('placeholder-')
          ? id
          : btn.closest('.article-item')?.dataset.id;
        if (targetId) {
          window.location.href = `${path}?id=${this.escapeHtml(targetId)}`;
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
  }
};


window.Utils = Utils;


function initBackButton() {
  const backButton = document.getElementById(SELECTORS.smartBackButton);
  if (backButton) {
    backButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      const homePath = Utils.isInPagesDir() 
        ? PATHS.indexPageFromPages 
        : PATHS.indexPage;
      window.location.href = homePath;
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initBackButton();
});
