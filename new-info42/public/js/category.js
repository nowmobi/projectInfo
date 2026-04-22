
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

    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");

    if (type) {
      const decodedType = decodeURIComponent(type);

      this.showArticlesByType(decodedType);
    } else {
      this.renderCategories();
    }

    setTimeout(() => {
      this.processAllImages();
    }, 50);
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

    this.protectSidebarStyles();

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

  protectSidebarStyles() {
    const sidebarCategory = document.querySelector(".sidebar-category");
    if (sidebarCategory) {
      sidebarCategory.style.setProperty("display", "block", "important");
      sidebarCategory.style.setProperty("padding", "0", "important");
      sidebarCategory.style.setProperty("height", "auto", "important");
      sidebarCategory.style.setProperty("border", "none", "important");
      sidebarCategory.style.setProperty(
        "background",
        "none",
        "important"
      );
      sidebarCategory.style.setProperty(
        "flex-direction",
        "initial",
        "important"
      );
    }
  }

  bindSidebarNavigation() {
    const sidebarItems = document.querySelectorAll(".sidebar-item");

    sidebarItems.forEach((item) => {
      const href = item.getAttribute("href");

      item.addEventListener("click", (e) => {
        this.closeSidebar();

        if (href && href.includes("#")) {
          e.preventDefault();

          window.location.href = href;
        }
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
      console.error("Required elements not found:", {
        articlesSection: !!articlesSection,
        articlesContainer: !!articlesContainer,
      });
      return;
    }

    articlesSection.style.display = "block";

    const sortedArticles = articles.sort(
      (a, b) => parseInt(b.id) - parseInt(a.id)
    );

    function traImg(article) {
      if (!article || !article.img) {
        return "https://wkktime.top/public/images/image-not-found.png";
      }

      return article.img;
    }

    if (sortedArticles.length === 0) {
      articlesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No articles in this category</div>
                    <div class="empty-state-subtext">Please select another category or check back later</div>
                </div>
            `;
      return;
    }

    const articlesHTML = sortedArticles
      .map((article) => {
        const imgSrc = traImg(article);
        return `
            <div class="article-card-overlay" data-id="${article.id}">
                <div class="article-image-overlay">
                    <img data-article-id="${article.id}" 
                          src="${imgSrc}"
                         alt="${article.title}" 
                         style="display: none;"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="placeholder-image" style="display: flex; width: 100%; height: 100%; background: linear-gradient(135deg, #746097 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 12px; text-align: center; padding: 10px;">
                        <div>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                            </svg>
                            <div style="font-size: 10px;">Image Not Found</div>
                        </div>
                    </div>
                </div>
                <div class="article-overlay-content">
                    <div class="article-overlay-type">${
                      article.type
                    }</div>
                    <h3 class="article-overlay-title">${
                      article.title
                    }</h3>
                    <div class="article-overlay-meta">
                        <span class="article-overlay-time">${this.formatDate(
                          article.create_time
                        )}</span>
                    </div>
                </div>
            </div>
        `;
      })
      .join("");

    articlesContainer.innerHTML = articlesHTML;

    this.bindArticleEvents();
  }

  formatDate(timestamp) {
    
    
    const date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  renderCategories() {
    const categoryGrid = document.querySelector(".category-grid");
    if (!categoryGrid) return;

    categoryGrid.innerHTML = this.categories
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

    articlesToShow.sort((a, b) => parseInt(b.id) - parseInt(a.id));

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

    articlesContainer.innerHTML = articlesToShow
      .map(
        (article) => `
             <div class="article-card-overlay" data-id="${article.id}">
                 <div class="article-image-overlay">
                     <img data-article-id="${article.id}" 
                          alt="${article.title}" 
                          style="display: none;"
                          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="placeholder-image" style="display: flex; width: 100%; height: 100%; background: linear-gradient(135deg, #746097 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 12px; text-align: center; padding: 10px;">
                         <div>
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                                 <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                             </svg>
                             <div style="font-size: 10px;">Loading...</div>
                         </div>
                     </div>
                 </div>
                 <div class="article-overlay-content">
                     <div class="article-overlay-type">${
                       article.type
                     }</div>
                     <h3 class="article-overlay-title">${
                       article.title
                     }</h3>
                     <div class="article-overlay-meta">
                         <span class="article-overlay-time">${this.formatDate(
                           article.create_time
                         )}</span>
                     </div>
                 </div>
             </div>
         `
      )
      .join("");

    this.bindArticleEvents();
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(
      ".article-card-overlay"
    );
    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        window.location.href =
          `../detail.html?id=${articleId}` +
          (window.channel ? `&channel=${window.channel}` : "");
      });
    });

    this.processAllImages();
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

    articlesContainer.innerHTML = filteredArticles
      .map(
        (article) => `
            <div class="article-card-overlay" data-id="${article.id}">
                <div class="article-image-overlay">
                    <img data-article-id="${article.id}" 
                         alt="${article.title}" 
                         style="display: none;"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="placeholder-image" style="display: flex; width: 100%; height: 100%; background: linear-gradient(135deg, #746097 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 12px; text-align: center; padding: 10px;">
                        <div>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                            </svg>
                            <div style="font-size: 10px;">Loading...</div>
                        </div>
                    </div>
                 </div>
                 <div class="article-overlay-content">
                     <div class="article-overlay-type">${
                       article.type
                     }</div>
                     <h3 class="article-overlay-title">${
                       article.title
                     }</h3>
                     <div class="article-overlay-meta">
                         <span class="article-overlay-time">${this.formatDate(
                           article.create_time
                         )}</span>
                     </div>
                 </div>
             </div>
         `
      )
      .join("");

    this.bindArticleEvents();
  }

  formatTime(timestamp) {
    
    
    const date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
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
    const referrer = document.referrer;
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(currentUrl);
    const type = urlParams.get("type");

    if (type) {
      window.location.href =
        "../index.html" +
        (window.channel ? "?channel=" + window.channel : "");
      return;
    }

    if (
      referrer.includes("index.html") ||
      referrer.includes("localhost") ||
      referrer.includes("127.0.0.1")
    ) {
      window.location.href =
        "../index.html" +
        (window.channel ? "?channel=" + window.channel : "");
      return;
    }

    if (referrer.includes("detail.html")) {
      window.location.href = referrer;
      return;
    }

    window.location.href =
      "../index.html" +
      (window.channel ? "?channel=" + window.channel : "");
  }

  async findAvailableImage(
    basePath,
    formats = ["jpg", "png", "jpeg", "webp"]
  ) {
    for (const format of formats) {
      const imagePath = `${basePath}.${format}`;
      try {
        const isAvailable = await this.checkImageExists(imagePath);
        if (isAvailable) {
          return imagePath;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  checkImageExists(imagePath) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);

      setTimeout(() => resolve(false), 1000);

      img.src = imagePath;
    });
  }

  async getSmartArticleImage(article) {
    if (!article) return "";

    
    let imgPath = article.imgLocalSrc || article.imgSrc || article.img;
    if (!imgPath) return "";

    const currentPath = window.location.pathname;

    
    if (imgPath.startsWith("./")) {
      imgPath = imgPath.slice(2);
    }
    if (
      currentPath.includes("/pages/") &&
      (imgPath.startsWith("public/") || imgPath.startsWith("/public/"))
    ) {
      const normalized = imgPath.replace(/^\/+/, "");
      imgPath = "../" + normalized;
    }

    
    if (imgPath.includes(".")) {
      const basePath = imgPath.replace(/\.(jpg|jpeg|png|webp)$/i, "");
      const availablePath = await this.findAvailableImage(basePath);
      if (availablePath) {
        return availablePath;
      }
      
      return imgPath;
    } else {
      return imgPath;
    }
  }

  async setupSmartImageLoading(imgElement, article) {
    try {
      
      let imageSrc = "";
      if (article && article.img) {
        imageSrc = article.img;
      }

      if (imageSrc) {
        
        imgElement.onload = () => {
          imgElement.style.display = "block";
          const placeholder = imgElement.nextElementSibling;
          if (
            placeholder &&
            placeholder.classList.contains("placeholder-image")
          ) {
            placeholder.style.display = "none";
          }
        };

        
        imgElement.src = imageSrc;
      } else {
        this.showImagePlaceholder(imgElement);
      }
    } catch (error) {
      
      this.showImagePlaceholder(imgElement);
    }
  }

  showImagePlaceholder(imgElement) {
    imgElement.style.display = "none";

    const placeholder = imgElement.nextElementSibling;
    if (placeholder && placeholder.style) {
      placeholder.style.display = "flex";
    }
  }

  async processAllImages() {
    const images = document.querySelectorAll("img[data-article-id]");

    for (const img of images) {
      const articleId = img.getAttribute("data-article-id");
      const article = this.articles.find((a) => a.id === articleId);
      if (article) {
        await this.setupSmartImageLoading(img, article);
      }
    }
  }
}


document.addEventListener("DOMContentLoaded", () => {
  new CategoryPage();
});

