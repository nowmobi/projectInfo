import { IMG_BASE_URL, Category_URL } from "./BaseURL.js";

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

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Invalid or empty data received");
        }

        this.articles = data;

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
        const href = `../detail.html?id=${article.id}`;
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
                          article.type
                        }</span>
                        <span class="article-time">${this.formatDate(
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

    // 使用图片的原始格式，因为远程服务器现在使用jpg格式
    const baseUrl = IMG_BASE_URL.replace("/number/number.png", "");
    return `${baseUrl}/${article.id}/${imgPath}`;
  }
  formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  renderCategories() {
    const categoryGrid = document.querySelector(".category-grid");
    if (!categoryGrid) return;

    const categoryOrder = [
      "Mental Health",
      "Medical Care",
      "Lifestyle",
      "Emergency & Safety",
      "Beauty & Wellness",
      "Health Management",
    ];

    const orderedCategories = categoryOrder
      .filter((type) => this.categories.some((cat) => cat.name === type))
      .map((type) => this.categories.find((cat) => cat.name === type));

    categoryGrid.innerHTML = orderedCategories
      .map(
        (category) => `
            <div class="category-card" data-category="${category.name}">
                <div class="category-card-icon">${this.getCategoryIcon(
                  category.name
                )}</div>
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

  getCategoryIcon(categoryName) {
    const iconMap = {
      "All Categories":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" stroke-width="2"/></svg>',
      "Health Management":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 14C19 16.7614 16.7614 19 14 19H10C7.23858 19 5 16.7614 5 14V10C5 7.23858 7.23858 5 10 5H14C16.7614 5 19 7.23858 19 10V14Z" stroke="currentColor" stroke-width="2"/><path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2"/></svg>',
      "Beauty & Wellness":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/></svg>',
      "Emergency & Safety":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" stroke-width="2"/></svg>',
      Lifestyle:
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/><path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/></svg>',
      "Medical Care":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 14C19 16.7614 16.7614 19 14 19H10C7.23858 19 5 16.7614 5 14V10C5 7.23858 7.23858 5 10 5H14C16.7614 5 19 7.23858 19 10V14Z" stroke="currentColor" stroke-width="2"/><path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2"/></svg>',
      "Mental Health":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="2"/></svg>',
    };
    return iconMap[categoryName] || iconMap["All Categories"];
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
        const href = `../detail.html?id=${article.id}`;
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
                           article.type
                         }</span>
                         <span class="article-time">${this.formatDate(
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
        window.location.href = `../detail.html?id=${articleId}`;
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
        const href = `../detail.html?id=${article.id}`;
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
                          article.type
                        }</span>
                        <span class="article-time">${this.formatDate(
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
    const date = new Date(timestamp * 1000);
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

