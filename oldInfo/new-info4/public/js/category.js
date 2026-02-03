import { getImgUrl, Category_URL, getCategoryOrder } from "./BaseURL.js";

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
    await this.renderSidebarMenuCategories();
    this.bindArticleEvents();

    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");

    if (type) {
      const decodedType = decodeURIComponent(type);

      this.showArticlesByType(decodedType);
    } else {
      this.renderCategories();
    }
    
    // 为所有链接添加 channel 参数
    if (typeof window.addChannelToLinks === 'function') {
      window.addChannelToLinks();
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

        this.categories = await this.extractCategoriesFromArticles();

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
      const debouncedSearch = window.Utils?.debounce((query) => {
        this.handleSearch(query);
      }, 300);

      if (debouncedSearch) {
        searchInput.addEventListener("input", (e) => {
          debouncedSearch(e.target.value);
        });
      }
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
   
  }

  bindSidebarNavigation() {
    const sidebarItems = document.querySelectorAll(".sidebar-item");

    sidebarItems.forEach((item) => {
      const href = item.getAttribute("href");

      item.addEventListener("click", (e) => {
        e.preventDefault();

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

  async extractCategoriesFromArticles() {
   
    const categoryOrder = await getCategoryOrder();

   
    const categoryMap = new Map();

    categoryOrder.forEach((categoryName) => {
      const count = this.articles.filter(
        (article) => article.type === categoryName
      ).length;
      if (count > 0) {
        categoryMap.set(categoryName, {
          id: categoryName,
          name: categoryName,
          count: count,
        });
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
      return;
    }

    articlesSection.style.display = "block";

    const sortedArticles = articles.sort(
      (a, b) => parseInt(b.id) - parseInt(a.id)
    );

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
      .map(
        (article) => `
            <div class="article-card-new" data-id="${article.id}">
                <div class="article-category-tag">${
                  this.decodeUnicode(article.type) || "Health"
                }</div>
                <div class="article-image-new">
                    <img src="${getImgUrl(article)}" alt="${
          article.title
        }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #746097 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
                        <div>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                            </svg>
                            <div>Image</div>
                            <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
                        </div>
                    </div>
                </div>
                <h3 class="article-title-new">${article.title}</h3>
                <div class="article-time-new">${this.formatTime(
                  article.create_time
                )}</div>
            </div>
        `
      )
      .join("");

    articlesContainer.innerHTML = articlesHTML;
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
        e.preventDefault();
        e.stopPropagation();
        const categoryName = card.dataset.category;

        this.showArticlesByType(categoryName);
      });
    });
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
             <div class="article-card-new" data-id="${article.id}">
                 <div class="article-category-tag">${
                   this.decodeUnicode(article.type) || "Health"
                 }</div>
                 <div class="article-image-new">
                     <img src="${getImgUrl(article)}" alt="${
          article.title
        }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #746097 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
                         <div>
                             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                                 <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                             </svg>
                             <div>Image</div>
                             <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
                         </div>
                     </div>
                 </div>
                 <h3 class="article-title-new">${article.title}</h3>
                 <div class="article-time-new">${this.formatTime(
                   article.create_time
                 )}</div>
             </div>
         `
      )
      .join("");
  }

  bindArticleEvents() {
    document.addEventListener(
      "click",
      this.handleGlobalArticleClick.bind(this)
    );
  }

  handleGlobalArticleClick(e) {
    const articleCard = e.target.closest(".article-card-new");
    if (articleCard) {
      const articleId = articleCard.dataset.id;
      if (articleId) {
        e.preventDefault();
        e.stopPropagation();

        const detailUrl =
          `../detail.html?id=${articleId}` +
          (window.channel ? "&channel=" + window.channel : "");

        window.location.href = detailUrl;
      }
    }
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
            <div class="article-card-new" data-id="${article.id}">
                <div class="article-category-tag">${
                  this.decodeUnicode(article.type) || "Health"
                }</div>
                <div class="article-image-new">
                    <img src="${getImgUrl(article)}" alt="${
          article.title
        }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #746097 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
                        <div>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                            </svg>
                            <div>Image</div>
                            <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
                        </div>
                    </div>
                </div>
                <h3 class="article-title-new">${article.title}</h3>
                <div class="article-time-new">${this.formatTime(
                  article.create_time
                )}</div>
            </div>
         `
      )
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

  decodeUnicode(str) {
    if (!str) return "";
    return str.replace(/\\u[\dA-F]{4}/gi, function (match) {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ""), 16));
    });
  }

  async renderSidebarMenuCategories() {
    const sidebarCategory = document.querySelector(
      ".sidebar-menu .sidebar-category"
    );
    if (!sidebarCategory) {
      return;
    }

    try {
     
      const infoTypeList = await getCategoryOrder();
      
      if (!infoTypeList || infoTypeList.length === 0) {
       
        if (!this.categories || this.categories.length === 0) {
          return;
        }
        const categoryList = this.categories.filter((cat) => cat.id !== "all");
        this.renderSidebarFromCategories(categoryList, sidebarCategory);
        return;
      }

     
      const currentPath = window.location.pathname;
      const isInSubFolder = currentPath.includes("/pages/");
      const categoryPath = isInSubFolder
        ? "category.html"
        : "pages/category.html";

     
      const sidebarHtml = infoTypeList
        .map(
          (type) => {
            const categoryId = type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "");
            return `
      <a href="${categoryPath}?type=${encodeURIComponent(
              type
            )}" class="sidebar-item" data-page="${categoryId}">
        <span>${type}</span>
      </a>
    `;
          }
        )
        .join("");
      sidebarCategory.innerHTML = sidebarHtml;
      this.bindSidebarNavigation();
    } catch (error) {
      if (this.categories && this.categories.length > 0) {
        const categoryList = this.categories.filter((cat) => cat.id !== "all");
        this.renderSidebarFromCategories(categoryList, sidebarCategory);
      }
    }
  }

  renderSidebarFromCategories(categoryList, sidebarCategory) {
   
    const currentPath = window.location.pathname;
    const isInSubFolder = currentPath.includes("/pages/");
    const categoryPath = isInSubFolder
      ? "category.html"
      : "pages/category.html";

   
    const sidebarHtml = categoryList
      .map(
        (category) => `
      <a href="${categoryPath}?type=${encodeURIComponent(
          category.name
        )}" class="sidebar-item" data-page="${category.id}">
        <span>${category.name}</span>
      </a>
    `
      )
      .join("");
    sidebarCategory.innerHTML = sidebarHtml;
    this.bindSidebarNavigation();
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
   
    const homeUrl = "../index.html" + (window.channel ? "?channel=" + window.channel : "");
    window.location.href = homeUrl;
  }
}


export { CategoryPage };

