
import {
  getCategoryOrder,
  getArticlesData,
} from "./BaseURL.js";


window.getCategoryOrder = getCategoryOrder;





function bindDropdownNavigation() {
  const dropdownItems = document.querySelectorAll(".dropdown-item");

  dropdownItems.forEach((item) => {
    const href = item.getAttribute("href");

    item.addEventListener("click", (e) => {
      e.preventDefault();

      if (href && href.includes("category.html?type=")) {
        const urlParams = new URLSearchParams(href.split("?")[1]);
        const type = urlParams.get("type");

        if (type && window.categoryPage) {
          window.categoryPage.showArticlesByType(type);
         
          if (window.healthNewsApp) {
            window.healthNewsApp.closeDropdown();
          }
          return;
        }
      }

      if (href) {
        window.location.href = href;
      }

      setTimeout(() => {
       
        if (window.healthNewsApp) {
          window.healthNewsApp.closeDropdown();
        }
      }, 100);
    });
  });
}

class CategoryPage {
  constructor() {
    this.currentCategory = null;
    this.articles = [];
    this.categories = [];
    this.init();
  }

  async init() {
    this.showLoadingState();

    await this.loadData();
    this.setupEventListeners();

    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");

    if (type) {
      const decodedType = decodeURIComponent(type);
      this.showArticlesByType(decodedType);
    } else {
      this.showAllArticles();
    }
  }

  async loadData() {
    try {
      const data = await getArticlesData();

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid or empty data received");
      }

      
      
      this.articles = data.filter(item => item && item.id && item.title) || [];
      
      
      this.articles = this.articles.map(article => {
        if (article.create_time && article.create_time > 1000000000000) {
          
          article.create_time = Math.floor(article.create_time / 1000);
          article.timestamp = article.create_time; 
        } else if (article.create_time) {
          article.timestamp = article.create_time;
        }
        return article;
      });

      this.categories = await this.extractCategoriesFromArticles();

      try {
        localStorage.setItem("cachedArticles", JSON.stringify(this.articles));
        localStorage.setItem("cachedArticlesTimestamp", Date.now());
      } catch (e) {
        console.warn("Failed to cache data:", e);
      }
    } catch (error) {
      this.showError(
        `Failed to load articles. Please check your connection and refresh the page.`
      );
      this.loadFallbackData();
    }
  }

  setupEventListeners() {
   
    if (window.initCommonSidebar) {
      window.initCommonSidebar();
    }
   
    bindDropdownNavigation();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      const debouncedSearch = Utils.debounce((query) => {
        this.handleSearch(query);
      }, 300);

      searchInput.addEventListener("input", (e) => {
        debouncedSearch(e.target.value);
      });
    }

    this.bindSmartBackButton();
  }

  showError(message) {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
      categoryGrid.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">${message}</div>
                    <button class="retry-btn">Retry</button>
                </div>
            `;

      const retryBtn = categoryGrid.querySelector(".retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => this.retryLoadData());
      }
    }
  }

  async retryLoadData() {
    this.showLoadingState();
    await this.loadData();
  }

  showLoadingState() {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
      categoryGrid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading articles...</div>
                </div>
            `;
    }
  }

  async loadFallbackData() {
    const cachedData = localStorage.getItem("cachedArticles");
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          this.articles = parsedData;
          this.categories = await this.extractCategoriesFromArticles();

          this.showCacheNotice();
          return;
        }
      } catch (e) {
        console.error("Failed to parse cached data:", e);
      }
    }

    this.showEmptyState();
  }

  showCacheNotice() {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
      categoryGrid.innerHTML = `
                <div class="cache-notice">
                    <div class="notice-icon">📋</div>
                    <div class="notice-text">Showing cached data</div>
                    <div class="notice-subtext">Some content may be outdated</div>
                    <button class="refresh-btn">Refresh Now</button>
                </div>
            `;

      const refreshBtn = categoryGrid.querySelector(".refresh-btn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => this.refreshData());
      }
    }

    this.showAllArticles();
  }

  async refreshData() {
    this.showLoadingState();
    await this.loadData();
  }

  async extractCategoriesFromArticles() {
   
    const categoryOrder = await getCategoryOrder();

    const categoryMap = new Map();

    this.articles.forEach((article) => {
      if (article.type && !categoryMap.has(article.type)) {
        categoryMap.set(article.type, {
          id: article.type,
          name: article.type,
          count: 1,
        });
      } else if (article.type) {
        categoryMap.get(article.type).count++;
      }
    });

   
    const orderedCategories = categoryOrder
      .filter((type) => categoryMap.has(type))
      .map((type) => categoryMap.get(type));

    return orderedCategories;
  }

  showAllArticles() {
    const categoryGrid = document.querySelector(".category-grid");
    const articlesContainer = document.querySelector(
      ".current-category-articles"
    );

    if (categoryGrid) {
      categoryGrid.style.display = "none";
    }

    if (articlesContainer) {
      articlesContainer.style.display = "block";

      this.renderAllArticles();
    }
  }

  renderAllArticles() {
    const articlesContainer = document.querySelector(
      ".current-category-articles .articles-list"
    );
    if (!articlesContainer) return;

    const sortedArticles = [...this.articles].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    const articlesHtml = sortedArticles
      .map(
        (article) => `
            <div class="article-card" data-article-id="${article.id}">
                <div class="article-image">
                    <img src="${this.getArticleImagePath(
                      article
                    )}" alt="${
          article.title
        }" loading="lazy" onerror="this.style.display='none'">
                </div>
                <div class="article-content">
                    <div class="article-meta">
                        <span class="article-type">${article.type.toUpperCase()}</span>
                        <span class="article-date">${this.formatTime(
                          article.timestamp
                        )}</span>
                    </div>
                    <h3 class="article-title">${article.title}</h3>
                </div>
            </div>
        `
      )
      .join("");

    articlesContainer.innerHTML = articlesHtml;
    this.bindArticleEvents();
  }

  formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  showArticlesByType(type) {
    const decodedType = decodeURIComponent(type);

    const filteredArticles = this.articles.filter(
      (article) => article.type === decodedType
    );

    if (filteredArticles.length === 0) {
      const caseInsensitiveFiltered = this.articles.filter(
        (article) =>
          article.type &&
          article.type.toLowerCase() === decodedType.toLowerCase()
      );

      if (caseInsensitiveFiltered.length > 0) {
        this.renderArticles(caseInsensitiveFiltered, decodedType);
        return;
      }
    }

    this.renderArticles(filteredArticles, decodedType);
  }

  renderArticles(articles, categoryName) {
    document.querySelector(".category-grid").style.display = "none";

    const articlesSection = document.getElementById(
      "currentCategoryArticles"
    );
    const articlesContainer = document.getElementById(
      "categoryArticlesContainer"
    );

    if (!articlesSection || !articlesContainer) {
      return;
    }

    articlesSection.style.display = "block";

    if (articles.length === 0) {
      articlesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No articles in this category</div>
                    <div class="empty-state-subtext">Please select another category or check back later</div>
                </div>
            `;
      return;
    }

    const sortedArticles = articles.sort((a, b) => b.id - a.id);

    const articlesHTML = sortedArticles
      .map(
        (article) => `
            <div class="article-card" data-id="${article.id}">
                <div class="article-image">
                    <img src="${this.getArticleImagePath(
                      article
                    )}" alt="${
          article.title
        }" onerror="this.style.display='none'">
                </div>
                <div class="article-content">
                    <span class="article-type">${article.type}</span>
                    <h3 class="article-title">${article.title}</h3>
                </div>
            </div>
        `
      )
      .join("");

    articlesContainer.innerHTML = articlesHTML;

    this.bindArticleEvents();
  }

  getArticleImagePath(article) {
    if (article && typeof article === "object" && article.img) {
      
      if (article.img.startsWith("http://") || article.img.startsWith("https://")) {
        return article.img;
      }
    }
    
    return "";
  }

  formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  renderCategoryArticles(categoryName) {
    const articlesContainer = document.getElementById(
      "categoryArticlesContainer"
    );
    if (!articlesContainer) return;

    let articlesToShow;
    if (categoryName === "All Categories") {
      articlesToShow = this.articles;
    } else {
      articlesToShow = this.articles.filter(
        (article) => article.type === categoryName
      );
    }

    if (articlesToShow.length === 0) {
      articlesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No articles in this category</div>
                    <div class="empty-state-subtext">Please select another category or check back later</div>
                </div>
            `;
      return;
    }

    const sortedArticles = articlesToShow.sort((a, b) => b.id - a.id);

    articlesContainer.innerHTML = sortedArticles
      .map(
        (article) => `
             <div class="article-card" data-id="${article.id}">
                 <div class="article-image">
                     <img src="${this.getArticleImagePath(
                       article
                     )}" alt="${
          article.title
        }" onerror="this.style.display='none'">
                 </div>
                 <div class="article-content">
                     <span class="article-type">${article.type}</span>
                     <h3 class="article-title">${article.title}</h3>
                 </div>
             </div>
         `
      )
      .join("");

    this.bindArticleEvents();
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(".article-card");
    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        window.location.href =
          `../detail.html?id=${articleId}` +
          (window.channel ? `&channel=${window.channel}` : "");
      });
    });
  }

  handleSearch(query) {
    if (!query.trim()) {
      if (this.currentCategory) {
        this.renderCategoryArticles(this.currentCategory);
      }
      return;
    }

    const filteredArticles = this.articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        (article.summary &&
          article.summary.toLowerCase().includes(query.toLowerCase())) ||
        article.type.toLowerCase().includes(query.toLowerCase())
    );

    if (this.currentCategory) {
      this.renderSearchResults(filteredArticles);
    }
  }

  renderSearchResults(filteredArticles) {
    const articlesContainer = document.getElementById(
      "categoryArticlesContainer"
    );
    if (!articlesContainer) return;

    if (filteredArticles.length === 0) {
      articlesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">No related articles found</div>
                    <div class="empty-state-subtext">Please try other search keywords</div>
                </div>
            `;
      return;
    }

    const sortedFilteredArticles = filteredArticles.sort(
      (a, b) => b.id - a.id
    );

    articlesContainer.innerHTML = sortedFilteredArticles
      .map(
        (article) => `
            <div class="article-card" data-id="${article.id}">
                <div class="article-image">
                    <img src="${this.getArticleImagePath(
                      article
                    )}" alt="${
          article.title
        }" onerror="this.style.display='none'">
                </div>
                <div class="article-content">
                    <span class="article-type">${article.type}</span>
                    <h3 class="article-title">${article.title}</h3>
                </div>
            </div>
        `
      )
      .join("");

    this.bindArticleEvents();
  }

  bindSmartBackButton() {
    const backButton = document.getElementById("smartBackButton");
    if (backButton) {
      backButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSmartBack();
      });
    }
  }

  handleSmartBack() {
    const referrer = document.referrer;
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(currentUrl);
    const type = urlParams.get("type");

    if (type) {
      window.location.href = "../index.html";
      return;
    }

    if (
      referrer.includes("index.html") ||
      referrer.includes("localhost") ||
      referrer.includes("127.0.0.1")
    ) {
      window.location.href =
        "../index.html" +
        (window.channel ? `?channel=${window.channel}` : "");
      return;
    }

    if (referrer.includes("detail.html")) {
      window.location.href = referrer;
      return;
    }

    window.location.href =
      "../index.html" +
      (window.channel ? `?channel=${window.channel}` : "");
  }
}



document.addEventListener("DOMContentLoaded", () => {
 
  if (!window.healthNewsApp) {
    window.healthNewsApp = new HealthNewsApp();
  }

 
  window.categoryPage = new CategoryPage();
});



