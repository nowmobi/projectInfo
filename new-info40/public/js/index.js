
import { getImgUrl, fetchAndCacheApiData } from './BaseURL.js';


const CONFIG = {
  debounceDelay: 300
};


const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

class Website {
  constructor() {
    this.currentCategory = null;
    this.articles = [];
    this.categories = [];
    this.categoryOrder = [];
    this.init();
  }

  
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderCategories();
    this.renderFeaturedArticles();
    this.renderArticles();
    this.renderRandomRecommendations();
  }


  renderFeaturedArticles() {
    const featuredSlider = document.getElementById('featuredArticlesSlider');
    if (!featuredSlider) return;
    
    
    featuredSlider.innerHTML = '';
    
    // 确保有文章数据
    if (!this.articles || this.articles.length === 0) return;
    
    // 随机选择6篇文章
    const shuffled = [...this.articles].sort(() => 0.5 - Math.random());
    const featuredArticles = shuffled.slice(0, 6);
    
    // 渲染特色文章卡片
    featuredArticles.forEach(article => {
      if (!article || !article.id) return;
      
      const card = document.createElement('div');
      card.className = 'featured-article-card';
      card.dataset.id = article.id;
      
      // 文章图片
      const imageUrl = getImgUrl(article);
      const imgContainer = document.createElement('div');
      imgContainer.className = 'featured-article-img';
      
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = article.title || 'Article Image';
      image.onerror = function() {
        this.onerror = null;
        this.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'120\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23f5f5f5\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'12\'%3ENo Image%3C/text%3E%3C/svg%3E';
      };
      
      imgContainer.appendChild(image);
      
      // 文章内容
      const contentContainer = document.createElement('div');
      contentContainer.className = 'featured-article-content';
      
      // 文章标题
      const title = document.createElement('h3');
      title.className = 'featured-article-title';
      title.textContent = article.title || 'Untitled Article';
      
      // 文章元信息
      const meta = document.createElement('p');
      meta.className = 'featured-article-meta';
      const timeStr = this.formatTimestamp(article.create_time) || '';
      const author = article.author || 'unknown';
      meta.textContent = `${timeStr} • ${author}`;
      
      contentContainer.appendChild(title);
      contentContainer.appendChild(meta);
      
      // 组装卡片
      card.appendChild(imgContainer);
      card.appendChild(contentContainer);
      
      // 添加点击事件
      card.addEventListener('click', () => {
        window.location.href = `detail.html?id=${article.id}`;
      });
      
      featuredSlider.appendChild(card);
    });
  }

  formatTimestamp(timestamp, locale = 'en-US') {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  }

  renderRandomRecommendations() {
    const randomContainer = document.getElementById('randomArticlesList');
    if (!randomContainer) return;
    
    randomContainer.innerHTML = '';
    
    if (!this.articles || this.articles.length === 0) return;
    
    const shuffled = [...this.articles].sort(() => 0.5 - Math.random());
    const randomArticles = shuffled.slice(0, 3);
    
    randomArticles.forEach(article => {
      if (!article || !article.id) return;
      
      const item = document.createElement('div');
      item.className = 'random-article-item';
      
      const hotIcon = document.createElement('img');
      hotIcon.src = 'public/images/hot.png';
      hotIcon.alt = 'Hot';
      hotIcon.className = 'hot-icon';
      
      const titleText = document.createElement('span');
      titleText.textContent = article.title || 'Untitled Article';
      titleText.className = 'random-article-title';
      
      item.appendChild(hotIcon);
      item.appendChild(titleText);
      
      item.addEventListener('click', () => {
        window.location.href = `detail.html?id=${article.id}`;
      });
      
      randomContainer.appendChild(item);
    });
  }

 
  
  async loadData() {
    try {
      
      
      const data = await fetchAndCacheApiData();

      
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
        name: 'Home'
        
      },
      ...orderedCategories.map(type => {
        const normalizedId = this.normalizeCategoryId(type);
        return {
          id: normalizedId,
          name: type
          
        };
      })
    ];

   
    if (!this.currentCategory || !this.isCategoryIdValid(this.currentCategory)) {
      this.currentCategory = 'all';
    }
  }

  
  normalizeCategoryId(type) {
    if (!type) {
      return '';
    }
    return type.toLowerCase()
      .replace(/\s*&\s*/g, '-')
      .replace(/\s+/g, '-')
      .replace(/_/g, '-');
  }

  


  
  isCategoryIdValid(categoryId) {
    if (!categoryId) {
      return false;
    }
    return this.categories.some(cat => cat.id === categoryId);
  }

 
  
  setupEventListeners() {
    const headerSearchToggle = document.getElementById('headerSearchToggle');
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchButton = document.getElementById('searchButton');
    
    if (headerSearchToggle && searchContainer) {
      headerSearchToggle.addEventListener('click', () => {
        const isActive = headerSearchToggle.classList.contains('active');
        if (isActive) {
          headerSearchToggle.classList.remove('active');
          searchContainer.style.display = 'none';
          if (searchInput) {
            searchInput.value = '';
            this.clearSearch();
          }
        } else {
          headerSearchToggle.classList.add('active');
          searchContainer.style.display = 'flex';
          if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
          }
        }
      });
    }
    const resultsClear = document.getElementById('resultsClear');
    
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
    
   
    if (resultsClear) {
      resultsClear.addEventListener('click', () => {
        this.clearSearch();
      });
    }
  }

  
  handleSearch(query) {
    if (!query.trim()) {
      
      this.hideSearchResults();
      this.resetToDefaultCategory();
      return;
    }

    const filteredArticles = this.filterArticles(query);

    // 隐藏特色文章滑块和推荐内容
    const featuredSlider = document.querySelector('.featured-articles-slider');
    if (featuredSlider) {
      featuredSlider.style.display = 'none';
    }
    
    const randomRecommendations = document.querySelector('.random-recommendations');
    if (randomRecommendations) {
      randomRecommendations.style.display = 'none';
    }

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
    const headerSearchToggle = document.getElementById('headerSearchToggle');
    const searchContainer = document.getElementById('searchContainer');
    if (searchInput) {
      searchInput.value = '';
      this.updateSearchUI('');
      this.hideSearchResults();
      const articlesGrid = document.getElementById('articlesGrid');
      if (articlesGrid) {
        const results = articlesGrid.querySelector('.results');
        if (results) {
          results.style.display = 'none';
        }
      }
     
      this.resetToDefaultCategory();
    }
    
    if (headerSearchToggle && searchContainer) {
      headerSearchToggle.classList.remove('active');
      searchContainer.style.display = 'none';
    }
    
    // 显示特色文章滑块和推荐内容
    const featuredSlider = document.querySelector('.featured-articles-slider');
    if (featuredSlider) {
      featuredSlider.style.display = '';
    }
    
    const randomRecommendations = document.querySelector('.random-recommendations');
    if (randomRecommendations) {
      randomRecommendations.style.display = '';
    }
  }

  
  showSearchResults(count, query) {
    const resultsBar = document.getElementById('resultsBar');
    const resultsCount = document.getElementById('resultsCount');
    const resultsQuery = document.getElementById('resultsQuery');
    if (resultsBar && resultsCount && resultsQuery) {
      resultsCount.textContent = count;
      resultsQuery.textContent = window.Utils.escapeHtml(query);
      resultsBar.style.display = 'flex';
    }
  }

  
  hideSearchResults() {
    const resultsBar = document.getElementById('resultsBar');
    if (resultsBar) {
      resultsBar.style.display = 'none';
    }
  }

  


  


 
  
  switchCategory(category) {
    if (!category) {
      return;
    }

    this.currentCategory = category;
    this.updateSidebarActiveState(category);
  }

  
  updateSidebarActiveState(category) {
    
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
      item.classList.remove('active');
      
      const itemPage = item.dataset.page;
      if (itemPage === category || (category === 'all' && itemPage === 'home')) {
        item.classList.add('active');
      }
    });
  }

  
  renderCategories() {
    this.bindSidebarCategoryEvents();
    this.updateSidebarActiveState(this.currentCategory);
  }

  


  


  
  bindSidebarCategoryEvents() {
    
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
      
      if (item.hasAttribute('data-category-bound')) {
        return;
      }
      item.setAttribute('data-category-bound', 'true');
      
      item.addEventListener('click', (e) => {
        const itemPage = item.dataset.page;
        
        if (itemPage) {
          
          const categoryId = itemPage === 'home' ? 'all' : itemPage;
          this.switchCategory(categoryId);
        }
      });
    });
  }

  
  resetToDefaultCategory() {
    this.currentCategory = 'all';
    this.renderArticles();
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
    
   
    let results = articlesGrid.querySelector('.results');
    if (!results) {
      results = document.createElement('div');
      results.className = 'results';
      articlesGrid.insertAdjacentElement('afterbegin', results);
    } else {
      results.innerHTML = '';
      results.style.display = '';
    }
    
   
    // 搜索结果使用网格布局
    articles.forEach(article => {
      const cardHTML = window.Utils.createHomeArticleCard(article, 'grid');
      results.insertAdjacentHTML('beforeend', cardHTML);
    });
  }

  
  renderCategoryArticles(articlesGrid) {
   
    const results = articlesGrid.querySelector('.results');
    if (results) {
      results.style.display = 'none';
    }
    
   
    const categorySections = articlesGrid.querySelectorAll('.category-section');
    
    categorySections.forEach(section => {
      section.style.display = '';
    });
    
    const availableArticles = this.articles;

   
    if (!this.currentCategory || this.currentCategory === 'all') {
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
      return;
    }

   
    const categoryArticles = availableArticles.filter(article => {
      const articleTypeId = article.type 
        ? this.normalizeCategoryId(article.type)
        : '';
      return articleTypeId === this.currentCategory;
    });
    
   
    if (categoryArticles.length === 0) {
      if (this.articles.length === 0) {
        articlesGrid.innerHTML = this.createEmptyStateHTML(
          '📰',
          'No articles available',
          'Please check your data source or try again later'
        );
      } else {
        articlesGrid.innerHTML = this.createEmptyStateHTML(
          '📋',
          'No articles in this category',
          'Try selecting a different category'
        );
      }
    } else {
     
      this.appendArticlesWithAds(articlesGrid, categoryArticles);
    }
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
    
    // Add list-style class to specific category sections: 1st, 3rd, 5th, 7th (0-based indices 0, 2, 4, 6)
    const listStyleIndices = [0, 2, 4, 6];
    categorySections.forEach((section, index) => {
      // Remove list-style class first to avoid duplication
      section.classList.remove('list-style');
      if (listStyleIndices.includes(index)) {
        section.classList.add('list-style');
      }
    });

    if (uniqueCategories.length === 1 && this.currentCategory && this.currentCategory !== 'all') {
      
      const allArticles = articlesByCategory[uniqueCategories[0]];
      const shuffled = shuffleArray(allArticles);
      let articleIndex = 0;
      categorySections.forEach((section, index) => {
        section.innerHTML = '';
        
        if (articleIndex < shuffled.length) {
          // 检查当前section是否有list-style类，以确定显示数量和布局类型
          const isListStyle = section.classList.contains('list-style');
          const displayCount = isListStyle ? 3 : 4;
          const layoutType = isListStyle ? 'list' : 'grid';
          
          const articlesToShow = shuffled.slice(articleIndex, articleIndex + displayCount);
          
          articlesToShow.forEach(article => {
            const cardHTML = window.Utils.createHomeArticleCard(article, layoutType);
            section.insertAdjacentHTML('beforeend', cardHTML);
          });
          
          articleIndex += displayCount;
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
      
      // 添加分类标题
      const categoryTitle = document.createElement('h2');
      categoryTitle.className = 'category-title';
      categoryTitle.textContent = categoryName;
      section.appendChild(categoryTitle);
      
      if (categoryArticles.length > 0) {
        
        const shuffled = shuffleArray(categoryArticles);
        // 检查当前section是否有list-style类，以确定显示数量和布局类型
        const isListStyle = section.classList.contains('list-style');
        const displayCount = isListStyle ? 3 : 4;
        const layoutType = isListStyle ? 'list' : 'grid';
        
        const articlesToShow = shuffled.slice(0, displayCount);
        
        articlesToShow.forEach(article => {
          const cardHTML = window.Utils.createHomeArticleCard(article, layoutType);
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
         
          const shuffled = shuffleArray(categoryArticles);
          // 检查当前section是否有list-style类，以确定显示数量和布局类型
          const isListStyle = section.classList.contains('list-style');
          const displayCount = isListStyle ? 3 : 4;
          const layoutType = isListStyle ? 'list' : 'grid';
          const articlesToShow = shuffled.slice(0, displayCount);
          articlesToShow.forEach(article => {
            const cardHTML = window.Utils.createHomeArticleCard(article, layoutType);
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
    window.Utils.bindArticleCardEvents('detail.html');
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
        <div class="empty-icon" style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <div class="empty-text">Failed to load data</div>
        <div class="empty-subtext">Unable to connect to data source</div>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #ba7ac7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 20px;">Retry</button>
      </div>
    `;
  }

  
  createEmptyStateHTML(icon, text, subtext) {
    return `
      <div class="empty-state">
        <div class="empty-icon" style="font-size: 48px; margin-bottom: 20px;">${icon}</div>
        <div class="empty-text">${window.Utils.escapeHtml(text)}</div>
        <div class="empty-subtext">${window.Utils.escapeHtml(subtext)}</div>
      </div>
    `;
  }

}



document.addEventListener('DOMContentLoaded', () => {
  window.website = new Website();
});
