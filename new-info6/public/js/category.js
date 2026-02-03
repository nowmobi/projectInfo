
import {
  Category_URL,
  getCategoryOrder,
  getDbData,
} from "./BaseURL.js";


import {
  handleChannelParameter,
  formatTime,
  formatDate,
  SmartBackButton,
  openDropdown,
  closeDropdown,
  initCommonSidebar,
} from "./common.js";


import { HealthNewsApp } from "./index.js";


window.Category_URL = Category_URL;
window.getCategoryOrder = getCategoryOrder;

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
      await this.renderCategories();
    }
  }

  async loadData() {
   
    if (window.healthNewsApp?.articles?.length > 0) {
      this.articles = window.healthNewsApp.articles;
      this.categories = await this.extractCategoriesFromArticles();
      return;
    }

   
    try {
      const data = await getDbData(false);
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid or empty data received");
      }

      this.articles = data;
      this.categories = await this.extractCategoriesFromArticles();

      try {
        localStorage.setItem("cachedArticles", JSON.stringify(data));
        localStorage.setItem("cachedArticlesTimestamp", Date.now());
      } catch (e) {}
    } catch (error) {
      this.showError(`Failed to load articles. Please check your connection and refresh the page.`);
      await this.loadFallbackData();
    }
  }

  setupEventListeners() {
    initCategorySidebar();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      const debouncedSearch = Utils.debounce((query) => {
        this.handleSearch(query);
      }, 300);

      searchInput.addEventListener("input", (e) => {
        debouncedSearch(e.target.value);
      });
    }
    this.smartBack = new SmartBackButton({ basePath: "../" });
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

    
    try {
      const categoryOrder = await window.getCategoryOrder();
      const orderedCategories = [];
      categoryOrder.forEach((categoryConfig) => {
        const categoryName =
          typeof categoryConfig === "string"
            ? categoryConfig
            : categoryConfig.name;
        if (categoryMap.has(categoryName)) {
          orderedCategories.push(categoryMap.get(categoryName));
        }
      });
      return orderedCategories;
    } catch (error) {
      return Array.from(categoryMap.values());
    }
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
    const categoryGrid = document.getElementById("categoryGrid");
    const articlesContainer = document.getElementById("categoryArticlesContainer");

    if (!categoryGrid || !articlesContainer) {
      console.error("Required elements not found:", {
        categoryGrid: !!categoryGrid,
        articlesContainer: !!articlesContainer,
      });
      return;
    }

    
    categoryGrid.style.display = "none";
    articlesContainer.style.display = "block";
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
                        <img class="article-image" src="${this.getArticleImagePath(
                          article
                        )}" alt="${
          article.title
        }" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3QgZmlsbD0iI2RkZCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiLz48dGV4dCBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+'">
                        <div class="article-content">
                            <h3 class="article-title">${article.title}</h3>
                            <div class="article-meta">
                                <span class="article-type">${
                                  article.type
                                }</span>
                                <span class="article-time">${formatDate(
                                  article.create_time
                                )}</span>
                            </div>
                        </div>
                    </div>
                `
      )
      .join("");

    articlesContainer.innerHTML = articlesHTML;
    this.bindArticleEvents();
  }

  getArticleImagePath(article) {
    if (!article || typeof article !== "object") {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23ddd' width='300' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
    }
    
   
    if (article.img) {
      if (article.img.startsWith("http://") || article.img.startsWith("https://")) {
        return article.img;
      }
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23ddd' width='300' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
    }
    
   
    const imgPath = article.img || article.imgPath;
    if (imgPath) {
      if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
        return imgPath;
      }
      if (imgPath.startsWith("public/")) {
        return "../" + imgPath;
      }
      return imgPath;
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23ddd' width='300' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
  }


  async renderCategories() {
    const categoryGrid = document.getElementById("categoryGrid");
    const articlesContainer = document.getElementById("categoryArticlesContainer");
    if (!categoryGrid) return;
    
    
    categoryGrid.style.display = "grid";
    if (articlesContainer) {
      articlesContainer.style.display = "none";
    }

    try {
      const categoryOrder = await getCategoryOrder();
      const orderedCategories = categoryOrder
        .filter((categoryConfig) => {
          const categoryName =
            typeof categoryConfig === "string"
              ? categoryConfig
              : categoryConfig.name;
          return this.categories.some((cat) => cat.name === categoryName);
        })
        .map((categoryConfig) => {
          const categoryName =
            typeof categoryConfig === "string"
              ? categoryConfig
              : categoryConfig.name;
          return this.categories.find((cat) => cat.name === categoryName);
        })
        .filter((cat) => cat !== undefined); 

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
    } catch (error) {
      
      const orderedCategories = this.categories;
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

  renderCategoryArticles(categoryName) {
    const categoryGrid = document.getElementById("categoryGrid");
    const articlesContainer = document.getElementById("categoryArticlesContainer");
    if (!articlesContainer) return;
    if (categoryGrid) {
      categoryGrid.style.display = "none";
    }
    articlesContainer.style.display = "block";

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
                         <img class="article-image" src="${this.getArticleImagePath(
                               article
                             )}" alt="${
          article.title
        }" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3QgZmlsbD0iI2RkZCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiLz48dGV4dCBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+'">
                         <div class="article-content">
                             <h3 class="article-title">${article.title}</h3>
                             <div class="article-meta">
                                 <span class="article-type">${
                                   article.type
                                 }</span>
                                 <span class="article-time">${formatDate(
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
    const articleCards = document.querySelectorAll(".article-card");
    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        window.location.href =
          `/detail.html?id=${articleId}` +
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
        }" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3QgZmlsbD0iI2RkZCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiLz48dGV4dCBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+'">
                        </div>
                        <div class="article-content">
                            <h3 class="article-title">${article.title}</h3>
                            <div class="article-meta">
                                <span class="article-type">${
                                  article.type
                                }</span>
                                <span class="article-time">${formatDate(
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

}


function bindCategoryDropdownNavigation() {
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
          closeDropdown();
          return;
        }
      }

      if (href) {
        window.location.href = href;
      }

      setTimeout(() => {
        closeDropdown();
      }, 100);
    });
  });
}


function initCategorySidebar() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const dropdownClose = document.getElementById("dropdownClose");

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", (e) => {
      e.preventDefault();
      openDropdown();
    });
  }

  if (dropdownClose) {
    dropdownClose.addEventListener("click", () => {
      closeDropdown();
    });
  }
  bindCategoryDropdownNavigation();
}


handleChannelParameter();
document.addEventListener("DOMContentLoaded", async () => {
  initCommonSidebar();
  if (!window.healthNewsApp) {
    window.healthNewsApp = new HealthNewsApp({ useHomePageLayout: false });
    let retries = 0;
    while (
      (!window.healthNewsApp.articles?.length || !window.healthNewsApp.categories?.length) &&
      retries < 50
    ) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
  }

 
  window.categoryPage = new CategoryPage();
  if (window.themeApplier) {
    window.themeApplier.init();
  }
});

