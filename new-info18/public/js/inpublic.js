
import { getImgUrl } from './BaseURL.js';


const SELECTORS = {
  articleCard: '.article-item',
  articleListItem: '.article-item'
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 170" preserveAspectRatio="xMidYMid slice" class="article-image-main">
            <image href="${this.escapeHtml(imageUrl)}" x="0" y="0" width="220" height="170" preserveAspectRatio="xMidYMid slice" onerror="this.setAttribute('href', 'data:image/svg+xml,%3Csvg xmlns=%5C%27http://www.w3.org/2000/svg%5C%27 width=%5C%27220%5C%27 height=%5C%27170%5C%27%3E%3Crect width=%5C%27100%25%5C%27 height=%5C%27100%25%5C%27 fill=%5C%27%23f5f5f5%5C%27/%3E%3Ctext x=%5C%2750%25%5C%27 y=%5C%2750%25%5C%27 text-anchor=%5C%27middle%5C%27 dy=%5C%27.3em%5C%27 fill=%5C%27%23999%5C%27 font-size=%5C%2712%5C%27%3ENo Image%3C/text%3E%3C/svg%3E')"></image>
          </svg>
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
      <div class="article-item" data-id="${articleId}">
        <div class="article-info">
          <p class="article-title">${title}</p>
          <span class="article-date">${timeStr}</span>
          <button class="article-cta" type="button" data-id="${articleId}">${categoryTag || 'Read more'}</button>
        </div>
        <div class="article-img">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 170" preserveAspectRatio="xMidYMid slice" class="article-image-main">
            <image href="${this.escapeHtml(imageUrl)}" x="0" y="0" width="220" height="170" preserveAspectRatio="xMidYMid slice" onerror="this.style.display='none';"></image>
          </svg>
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


document.addEventListener('DOMContentLoaded', () => {
});
