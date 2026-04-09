import { Category_URL } from "./BaseURL.js";

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
    this.renderSidebarCategories(); 

    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");

    if (type) {
      const decodedType = decodeURIComponent(type);
      this.showArticlesByType(decodedType);
    } else {
      this.renderCategories();
    }
  }

  async loadData() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(Category_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        let articlesData = [];
        if (Array.isArray(data)) {
          articlesData = data;
        } else if (data && typeof data === 'object') {
          articlesData = data.articles || data.data || data.Data || data.news || data.content || [];
        }

        if (!Array.isArray(articlesData) || articlesData.length === 0) {
          throw new Error("Invalid or empty data received");
        }

        this.articles = articlesData;

        this.categories = this.extractCategoriesFromArticles();

        try {
          localStorage.setItem("cachedArticles", JSON.stringify(data));
          localStorage.setItem("cachedArticlesTimestamp", Date.now());
        } catch (e) {}

        break;
      } catch (error) {
        retryCount++;

        if (retryCount >= maxRetries) {
          this.showError(
            `Failed to load articles after ${maxRetries} attempts. Please check your connection and refresh the page.`
          );

          this.loadFallbackData();
        } else {
          await new Promise((resolve) =>
            setTimeout(resolve, retryCount * 1000)
          );
        }
      }
    }
  }

  setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      const debouncedSearch = Utils.debounce((query) => {
        this.handleSearch(query);
      }, 300);

      searchInput.addEventListener("input", (e) => {
        debouncedSearch(e.target.value);
      });
    }

    this.initSidebar();

    this.bindSmartBackButton();
  }

  initSidebar() {
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarMenu = document.getElementById("sidebarMenu");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        this.openSidebar();
      });
    }

    if (sidebarClose) {
      sidebarClose.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    this.bindSidebarNavigation();
  }

  bindSidebarNavigation() {
    const sidebarItems = document.querySelectorAll(".sidebar-item");

    sidebarItems.forEach((item) => {
      const href = item.getAttribute("href");

      item.addEventListener("click", (e) => {
        e.preventDefault();

        if (href && href.includes("category.html?type=")) {
          const urlParams = new URLSearchParams(href.split("?")[1]);
          const type = urlParams.get("type");

          if (type) {
            this.showArticlesByType(type);
            this.closeSidebar();
            return;
          }
        }

        if (href) {
          window.location.href = href;
        }

        setTimeout(() => {
          this.closeSidebar();
        }, 100);
      });
    });
  }

  openSidebar() {
    const sidebarMenu = document.getElementById("sidebarMenu");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    if (sidebarMenu) {
      sidebarMenu.classList.add("active");
      document.body.style.overflow = "hidden";
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.add("active");
    }

    this.bindEscToClose();
  }

  closeSidebar() {
    const sidebarMenu = document.getElementById("sidebarMenu");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    if (sidebarMenu) {
      sidebarMenu.classList.remove("active");
      document.body.style.overflow = "";
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove("active");
    }

    this.unbindEscToClose();
  }

  bindEscToClose() {
    if (this._escHandler) return;
    this._escHandler = (e) => {
      if (e.key === "Escape") {
        this.closeSidebar();
      }
    };
    document.addEventListener("keydown", this._escHandler);
  }

  unbindEscToClose() {
    if (!this._escHandler) return;
    document.removeEventListener("keydown", this._escHandler);
    this._escHandler = null;
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

  loadFallbackData() {
    const cachedData = localStorage.getItem("cachedArticles");
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          this.articles = parsedData;
          this.categories = this.extractCategoriesFromArticles();

          this.showCacheNotice();
          return;
        }
      } catch (e) {}
    }
    this.showDefaultCategories();
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
    this.renderCategories();
  }

  showDefaultCategories() {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
      categoryGrid.innerHTML = `
                <div class="default-categories">
                    <div class="default-icon">📚</div>
                    <div class="default-text">Default Categories</div>
                    <div class="default-subtext">Please check your connection and try again</div>
                    <button class="refresh-btn">Refresh Now</button>
                </div>
            `;

      const refreshBtn = categoryGrid.querySelector(".refresh-btn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => this.refreshData());
      }
    }
  }

  async refreshData() {
    this.showLoadingState();
    await this.loadData();
  }

  extractCategoriesFromArticles() {
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
    return Array.from(categoryMap.values());
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
      .map((article) => {
        const href = `../sec.html?id=${article.id}`;
        return `
            <a class="article-card" href="${href}">
                <div class="article-image">
                    <img src="${this.getArticleImagePath(
                      article
                    )}" alt="${
          article.title
        }" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                </div>
                <div class="article-content">
                    <h3 class="article-title">${article.title}</h3>
                    <div class="article-meta">
                        <span class="article-type">${
                          Utils.truncateString(article.type, 18)
                        }</span>
                        <span class="article-time">${Utils.formatTime(
                          article.create_time
                        )}</span>
                    </div>
                </div>
            </a>
        `;
      })
      .join("");

    articlesContainer.innerHTML = articlesHTML;
  }

  getArticleImagePath(article) {
    const imgPath = article.img;

    if (!imgPath) return "";
  
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    } 
    return "";
  }
  renderCategories() {
    const categoryGrid = document.querySelector(".category-grid");
    if (!categoryGrid) return;

    categoryGrid.innerHTML = this.categories
      .map(
        (category) => `
            <div class="category-card" data-category="${category.name}">
                <div class="category-card-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </div>
                <div class="category-card-content">
                    <h3 class="category-card-title">${
                      category.name
                    }</h3>
                    <p class="category-card-count">
                        ${category.count} articles
                    </p>
                </div>
                <div class="category-card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                     </svg>
                 </div>
             </div>
         `
      )
      .join("");
    this.bindCategoryEvents();
  }

  bindCategoryEvents() {
    const categoryCards = document.querySelectorAll(".category-card");
    categoryCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const categoryName = card.dataset.category;
        this.showArticlesByType(categoryName);
      });
    });
  }

  getArticleCountByCategory(categoryId) {
    if (categoryId === "all") {
      return this.articles.length;
    }
    return this.articles.filter(
      (article) => article.category === categoryId
    ).length;
  }

  showCategoryArticles(categoryName) {
    this.currentCategory = categoryName;
    const category = this.categories.find((c) => c.name === categoryName);

    document.querySelector(".category-grid").style.display = "none";

    const articlesSection = document.getElementById(
      "currentCategoryArticles"
    );
    articlesSection.style.display = "block";

    this.renderCategoryArticles(categoryName);
  }

  showCategories() {
    document.querySelector(".category-grid").style.display = "grid";

    document.getElementById("currentCategoryArticles").style.display =
      "none";

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.value = "";
    }
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
      .map((article) => {
        const href = `../sec.html?id=${article.id}`;
        return `
             <a class="article-card" href="${href}">
                 <div class="article-image">
                     <img src="${this.getArticleImagePath(
                       article
                     )}" alt="${
          article.title
        }" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                 </div>
                 <div class="article-content">
                     <h3 class="article-title">${article.title}</h3>
                     <div class="article-meta">
                         <span class="article-type">${
                           Utils.truncateString(article.type, 18)
                         }</span>
                         <span class="article-time">${Utils.formatTime(
                           article.create_time
                         )}</span>
                     </div>
                 </div>
             </a>
         `;
      })
      .join(""); 
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(".article-card");
    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        window.location.href = `../sec.html?id=${articleId}`;
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
      .map((article) => {
        const href = `../sec.html?id=${article.id}`;
        return `
            <a class="article-card" href="${href}">
                <div class="article-image">
                    <img src="${this.getArticleImagePath(
                      article
                    )}" alt="${
          article.title
        }" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                </div>
                <div class="article-content">
                    <h3 class="article-title">${article.title}</h3>
                    <div class="article-meta">
                        <span class="article-type">${
                          Utils.truncateString(article.type, 18)
                        }</span>
                        <span class="article-time">${Utils.formatTime(
                          article.create_time
                        )}</span>
                    </div>
                </div>
            </a>
        `;
      })
      .join("");

   
  }

  formatTime(timestamp) {
    const date = new Date(typeof timestamp === 'number' && timestamp.toString().length === 13 ? timestamp : timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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

  renderSidebarCategories() {
    const sidebarCategories = document.querySelectorAll(".sidebar-category");
    if (sidebarCategories.length === 0) {
      return;
    }
    
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const categoryUrlPrefix = isInPagesFolder
      ? "category.html"
      : "pages/category.html";
    
    const actualCategories = this.categories;
    
    const categoriesHTML = actualCategories
      .map((category) => {
        const encodedType = encodeURIComponent(category.name);
        return `
            <a
              href="${categoryUrlPrefix}?type=${encodedType}"
              class="sidebar-item"
              data-page="${category.name}"
            >
              <span>${category.name}</span>
            </a>`;
      })
      .join("");
    sidebarCategories.forEach((container) => {
      container.innerHTML = categoriesHTML;
    });
  }

  handleSmartBack() {
    window.location.href =
      "../index.html" + (window.channel ? "?channel=" + window.channel : "");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CategoryPage();
  if (window.themeApplier) {
    window.themeApplier.init();
    setTimeout(() => {
      window.themeApplier.applyTheme();
    }, 100);
  }
});

