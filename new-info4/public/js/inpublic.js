import { getCategoryOrder, fetchCategoryData, getImgUrl } from "./BaseURL.js";

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("channel")) {
  window.channel = urlParams.get("channel");
}

class HealthNewsApp {
  constructor() {
    this.currentCategory = "all";
    this.articles = [];
    this.categories = [];
    this.init();
  }

  async init() {
    this.fixDOMStructure();

    await this.loadData();
    this.setupEventListeners();
    this.initSidebar();
    await this.renderSidebarMenuCategories();
    this.bindArticleEvents();
    this.renderCategories();
    this.renderArticles();
  }

  fixDOMStructure() {
    const categoriesContainer = document.getElementById("categoriesContainer");

    if (!categoriesContainer) {
      return;
    }

    const expectedCategories = [
      "beauty-wellness-articles",
      "health-management-articles",
      "mental-health-articles",
      "medical-care-articles",
      "lifestyle-articles",
      "emergency-safety-articles",
    ];

    let missingCategories = [];
    expectedCategories.forEach((categoryId) => {
      const container = document.getElementById(categoryId);
      if (!container) {
        missingCategories.push(categoryId);
      } else if (!categoriesContainer.contains(container)) {
        try {
          const categorySection = container.closest(".category-section");
          if (
            categorySection &&
            !categoriesContainer.contains(categorySection)
          ) {
            categoriesContainer.appendChild(categorySection);
          }
        } catch (error) {}
      }
    });

    if (missingCategories.length === 0) {
    } else {
    }
  }

  async loadData() {
    try {
      const data = await fetchCategoryData();
      this.articles = data || [];
      
      await this.generateCategoriesFromArticles(data);
      
      this.hideLoading();
      this.renderArticles();
    } catch (error) {
      this.articles = [];
      this.categories = [];

      this.hideLoading();
      this.showEmptyState();
    }
  }

  showEmptyState() {
    const emptyState = document.getElementById("emptyState");
    const categoriesContainer = document.getElementById("categoriesContainer");
    const articlesContainer = document.getElementById("articlesContainer");
    
   
    if (categoriesContainer) {
      categoriesContainer.style.display = "block";
      categoriesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-content">
            <div class="empty-state-icon">⚠️</div>
            <h3 class="empty-state-text">Failed to load content</h3>
            <p class="empty-state-subtext">Please check your connection and refresh the page</p>
          </div>
        </div>
      `;
    }
    
   
    if (articlesContainer) {
      articlesContainer.style.display = "none";
    }
    
   
    if (emptyState) {
      emptyState.innerHTML = `
        <div class="empty-state-content">
          <div class="empty-state-icon">⚠️</div>
          <h3 class="empty-state-text">Failed to load content</h3>
          <p class="empty-state-subtext">Please check your connection and refresh the page</p>
        </div>
      `;
      emptyState.classList.remove("dsn");
    }
  }

  hideLoading() {
    const loading = document.getElementById("loading");
    if (loading) {
      loading.classList.add("dsn");
    }
  }

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
  }

  async generateCategoriesFromArticles(data) {
    let categoryOrder;

    if (data && Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
      categoryOrder = data[0].info1;
    } else {
      categoryOrder = await getCategoryOrder();
    }

    this.categoryOrder = categoryOrder;

    this.categories = [
      {
        id: "all",
        name: "Suggest",
        icon: "",
      },
      ...categoryOrder.map((type) => ({
        id: type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, ""),
        name: type,
        icon: "",
      })),
    ];
  }

  setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    const searchClear = document.getElementById("searchClear");
    const clearSearchBtn = document.getElementById("clearSearchBtn");

    if (searchInput) {
      const debouncedSearch = this.debounce((query) => {
        this.handleSearch(query);
      }, 300);

      searchInput.addEventListener("input", (e) => {
        const query = e.target.value;
        this.updateSearchUI(query);
        debouncedSearch(query);
      });

      searchInput.addEventListener("search", () => {
        this.handleSearch("");
      });

      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.handleSearch(e.target.value);
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        this.clearSearch();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        this.clearSearch();
      });
    }

    window.addEventListener("scroll", () => this.handleScroll());

    const menuToggle = document.getElementById("menuToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const menuClose = document.getElementById("menuClose");

    if (menuToggle && mobileMenu && menuClose) {
      menuToggle.addEventListener("click", () => {
        mobileMenu.classList.remove("dsn");
        mobileMenu.classList.add("active");
      });

      menuClose.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        mobileMenu.classList.add("dsn");
      });

      mobileMenu.addEventListener("click", (e) => {
        if (e.target === mobileMenu) {
          mobileMenu.classList.remove("active");
          mobileMenu.classList.add("dsn");
        }
      });
    }
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

  handleSearch(query) {
    if (!query.trim()) {
      this.renderArticles();
      this.hideSearchResults();
      return;
    }

    const filteredArticles = this.articles.filter((article) => {
      const searchTerm = query.toLowerCase();
      const title = (article.title || "").toLowerCase();
      const type = (article.type || "").toLowerCase();
      const section = (article.section || "").toLowerCase();

     
      const matchesSearch =
        title.includes(searchTerm) ||
        type.includes(searchTerm) ||
        section.includes(searchTerm);

     
      const articleType = article.type || "";
      const isInAllowedCategory =
        this.categoryOrder && this.categoryOrder.length > 0
          ? this.categoryOrder.includes(articleType)
          : true;

     
      if (matchesSearch && !isInAllowedCategory) {
        }

      return matchesSearch && isInAllowedCategory;
    });

    this.renderArticles(filteredArticles);
    this.showSearchResults(filteredArticles.length, query);
  }

  showSearchResults(count, query) {
    const searchResultsBar = document.getElementById("searchResultsBar");
    const searchResultsCount = document.getElementById("searchResultsCount");
    const searchQuery = document.getElementById("searchQuery");
    const emptyState = document.getElementById("emptyState");

    if (searchResultsBar && searchResultsCount && searchQuery) {
      searchResultsCount.textContent = count;
      searchQuery.textContent = query;
      searchResultsBar.style.display = "flex";
    }

    if (count === 0) {
      if (emptyState) {
        emptyState.classList.remove("dsn");
        emptyState.querySelector(
          ".empty-state-text"
        ).textContent = `No articles found for "${query}"`;
      }
    } else {
      if (emptyState) emptyState.classList.add("dsn");
    }
  }

  hideSearchResults() {
    const searchResultsBar = document.getElementById("searchResultsBar");
    if (searchResultsBar) {
      searchResultsBar.style.display = "none";
    }
  }

  updateSearchUI(query) {
    const searchClear = document.getElementById("searchClear");
    const searchIcon = document.querySelector(".search-icon");

    if (searchClear) {
      searchClear.style.display = query.trim() ? "block" : "none";
    }

    if (searchIcon) {
      searchIcon.style.opacity = query.trim() ? "0" : "1";
    }
  }

  clearSearch() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.value = "";
      this.updateSearchUI("");
      this.handleSearch("");
    }

    this.currentCategory = "all";
    this.renderArticles();
  }

  switchCategory(category) {
    this.currentCategory = category;

    document.querySelectorAll(".sidebar-category").forEach((cat) => {
      cat.classList.remove("active");
      if (cat.dataset.category === category) {
        cat.classList.add("active");
      }
    });

    this.renderArticles();
  }

  renderCategories() {
    this.renderSidebarCategories();
  }

  renderSidebarCategories() {
    const sidebarCategories = document.querySelector(".sidebar-categories");
    if (!sidebarCategories) {
      return;
    }

    if (!this.categories || this.categories.length === 0) {
      sidebarCategories.innerHTML =
        '<div class="sidebar-category">Loading categories...</div>';
      return;
    }

    const sidebarCategoriesHtml = this.categories
      .filter((category) => category.id !== "all")
      .map(
        (category) => `
        <div class="sidebar-category" data-category="${category.id}">
          <span class="category-name">${category.name}</span>
        </div>
      `
      )
      .join("");

    sidebarCategories.innerHTML = sidebarCategoriesHtml;

    this.bindSidebarCategoryEvents();
  }

  bindSidebarCategoryEvents() {
    const sidebarCategories = document.querySelectorAll(".sidebar-category");

    sidebarCategories.forEach((category) => {
      category.addEventListener("click", (e) => {
        const categoryId = e.currentTarget.dataset.category;

        this.switchCategory(categoryId);

        sidebarCategories.forEach((cat) => cat.classList.remove("active"));
        e.currentTarget.classList.add("active");
      });
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
      let infoTypeList = this.categoryOrder;

      if (!infoTypeList || infoTypeList.length === 0) {
        infoTypeList = await getCategoryOrder();
      }

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
  }

  truncateTextToLines(text, maxLines = 3) {
    if (!text) return "";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";

    const avgCharsPerLine = 25;
    const maxChars = avgCharsPerLine * maxLines;

    if (plainText.length <= maxChars) {
      return text;
    }

    const truncated = plainText.substring(0, maxChars - 3);
    return truncated + "...";
  }

  decodeUnicode(str) {
    if (!str) return "";

    const textarea = document.createElement("textarea");
    textarea.innerHTML = str;
    let decoded = textarea.value;

    decoded = decoded.replace(/\\u0026/g, "&");
    decoded = decoded.replace(/\\u0020/g, " ");
    decoded = decoded.replace(/\\u00A0/g, " ");

    decoded = decoded.replace(/\\u003c/g, "<");
    decoded = decoded.replace(/\\u003e/g, ">");
    decoded = decoded.replace(/\\u003d/g, "=");
    decoded = decoded.replace(/\\u0022/g, '"');
    decoded = decoded.replace(/\\u0027/g, "'");
    decoded = decoded.replace(/\\u002f/g, "/");
    decoded = decoded.replace(/\\u005c/g, "\\");
    decoded = decoded.replace(/\\u002d/g, "-");
    decoded = decoded.replace(/\\u005f/g, "_");
    decoded = decoded.replace(/\\u0028/g, "(");
    decoded = decoded.replace(/\\u0029/g, ")");
    decoded = decoded.replace(/\\u005b/g, "[");
    decoded = decoded.replace(/\\u005d/g, "]");
    decoded = decoded.replace(/\\u007b/g, "{");
    decoded = decoded.replace(/\\u007d/g, "}");
    decoded = decoded.replace(/\\u003a/g, ":");
    decoded = decoded.replace(/\\u003b/g, ";");
    decoded = decoded.replace(/\\u002c/g, ",");
    decoded = decoded.replace(/\\u002e/g, ".");
    decoded = decoded.replace(/\\u0021/g, "!");
    decoded = decoded.replace(/\\u003f/g, "?");
    decoded = decoded.replace(/\\u0040/g, "@");
    decoded = decoded.replace(/\\u0023/g, "#");
    decoded = decoded.replace(/\\u0024/g, "$");
    decoded = decoded.replace(/\\u0025/g, "%");
    decoded = decoded.replace(/\\u005e/g, "^");
    decoded = decoded.replace(/\\u0026/g, "&");
    decoded = decoded.replace(/\\u002a/g, "*");
    decoded = decoded.replace(/\\u002b/g, "+");
    decoded = decoded.replace(/\\u007c/g, "|");
    decoded = decoded.replace(/\\u007e/g, "~");
    decoded = decoded.replace(/\\u0060/g, "`");

    decoded = decoded.replace(/\?nbsp;/g, " ");
    decoded = decoded.replace(/\?lt;/g, "<");
    decoded = decoded.replace(/\?gt;/g, ">");
    decoded = decoded.replace(/\?amp;/g, "&");
    decoded = decoded.replace(/\?quot;/g, '"');
    decoded = decoded.replace(/\?39;/g, "'");

    decoded = decoded.replace(/\uFFFD/g, "");
    decoded = decoded.replace(/\uFFFE/g, "");
    decoded = decoded.replace(/\uFEFF/g, "");

    decoded = decoded.replace(/&nbsp;/g, " ");
    decoded = decoded.replace(/&lt;/g, "<");
    decoded = decoded.replace(/&gt;/g, ">");
    decoded = decoded.replace(/&amp;/g, "&");
    decoded = decoded.replace(/&quot;/g, '"');
    decoded = decoded.replace(/&#39;/g, "'");
    decoded = decoded.replace(/&#160;/g, " ");
    decoded = decoded.replace(/&#xa0;/g, " ");

    decoded = decoded.replace(/\?\/span>/g, "</span>");
    decoded = decoded.replace(/\?\/div>/g, "</div>");
    decoded = decoded.replace(/\?\/p>/g, "</p>");
    decoded = decoded.replace(/\?\/h[1-6]>/g, "</h$1>");
    decoded = decoded.replace(/\?\/strong>/g, "</strong>");
    decoded = decoded.replace(/\?\/em>/g, "</em>");
    decoded = decoded.replace(/\?\/b>/g, "</b>");
    decoded = decoded.replace(/\?\/i>/g, "</i>");
    decoded = decoded.replace(/\?\/u>/g, "</u>");

    decoded = decoded.replace(/\?span/g, "<span");
    decoded = decoded.replace(/\?div/g, "<div");
    decoded = decoded.replace(/\?p/g, "<p");
    decoded = decoded.replace(/\?h([1-6])/g, "<h$1");
    decoded = decoded.replace(/\?strong/g, "<strong");
    decoded = decoded.replace(/\?em/g, "<em");
    decoded = decoded.replace(/\?b/g, "<b");
    decoded = decoded.replace(/\?i/g, "<i");
    decoded = decoded.replace(/\?u/g, "<u");

    decoded = decoded.replace(/\?=/g, "=");
    decoded = decoded.replace(/\?>/g, ">");

    decoded = decoded.replace(/\?[a-zA-Z0-9#\/]+/g, " ");

    decoded = decoded.replace(/[\uFFFD\uFFFE\uFEFF]/g, "");

    return decoded;
  }

  getCategoryIcon(categoryId) {
    const iconMap = {
      all: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/></svg>',
      health:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 14C19 16.7614 16.7614 19 14 19H10C7.23858 19 5 16.7614 5 14V10C5 7.23858 7.23858 5 10 5H14C16.7614 5 19 7.23858 19 10V14Z" stroke="currentColor" stroke-width="2"/><path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2"/></svg>',
      beauty:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/></svg>',
      environment:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/></svg>',
      lifestyle:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/><path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/></svg>',
      medical:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 14C19 16.7614 16.7614 19 14 19H10C7.23858 19 5 16.7614 5 14V10C5 7.23858 7.23858 5 10 5H14C16.7614 5 19 7.23858 19 10V14Z" stroke="currentColor" stroke-width="2"/><path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2"/></svg>',
      technology:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/></svg>',
      mental:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="2"/></svg>',
      nutrition:
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/></svg>',
    };
    return iconMap[categoryId] || iconMap["all"];
  }

  renderArticles(articlesToRender = null) {
    const articlesContainer = document.getElementById("articlesContainer");
    const categoriesContainer = document.getElementById("categoriesContainer");

    if (articlesToRender) {
      if (articlesContainer) {
        articlesContainer.style.display = "block";
      }
      if (categoriesContainer) {
        categoriesContainer.style.display = "none";
      }

      this.renderSearchResults(articlesToRender);
    } else if (this.currentCategory === "all") {
      if (articlesContainer) {
        articlesContainer.style.display = "none";
      }
      if (categoriesContainer) {
        categoriesContainer.style.display = "block";
      }

      this.renderCategoriesSections();
    } else {
      if (articlesContainer) {
        articlesContainer.style.display = "block";
      }
      if (categoriesContainer) {
        categoriesContainer.style.display = "none";
      }

      const articles = this.articles.filter((article) => {
        const articleTypeId = article.type
          ? article.type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "")
          : "";
        return articleTypeId === this.currentCategory;
      });

      this.renderSearchResults(articles);
    }
  }

  renderSearchResults(articles) {
    const articlesGrid = document.getElementById("articlesGrid");
    if (!articlesGrid) return;

    articlesGrid.innerHTML = "";

   
    articles.forEach((article) => {
      const articleHTML = `
      <div class="article-card-new" data-id="${
        article.id
      }" style="cursor: pointer;">
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
      `;

      articlesGrid.insertAdjacentHTML("beforeend", articleHTML);
    });

    this.bindArticleEvents();
  }

  renderCategoriesSections() {
    const categoriesContainer = document.getElementById("categoriesContainer");
    if (!categoriesContainer) {
      return;
    }

   
    const homeArticleItems =
      categoriesContainer.querySelectorAll(".home_article-item");

   
    homeArticleItems.forEach((item) => {
      item.innerHTML = "";
    });

    const categoryList = this.categories.filter((cat) => cat.id !== "all");
    
    if (categoryList.length === 0) {
      return;
    }
    
    if (this.articles.length === 0) {
      return;
    }

    categoryList.forEach((category, index) => {
      const categoryId = category.id;
      const categoryName = category.name;

     
      const categoryArticles = this.getRandomArticlesByCategory(
        categoryName,
        1
      );

     
      const sectionHtml = `
        <div class="category-section" data-category="${categoryId}">
          <div class="category-section-header">
            <h2>${categoryName}</h2>
            <a href="pages/category.html?type=${encodeURIComponent(
              categoryName
            )}" class="view-all-link">More</a>
          </div>
          <div class="category-section-articles" id="${categoryId}-articles">
            ${
              categoryArticles.length === 0
                ? '<div class="no-articles">No articles available</div>'
                : categoryArticles
                    .map(
                      (article) => `
                <div class="article-card-new" data-id="${
                  article.id
                }" style="cursor: pointer;">
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
                    .join("")
            }
          </div>
        </div>
      `;

     
      if (index < homeArticleItems.length) {
        homeArticleItems[index].innerHTML = sectionHtml;
      } else {
       
        const newContainer = document.createElement("div");
        newContainer.className = "home_article-item";
        newContainer.innerHTML = sectionHtml;
        categoriesContainer.appendChild(newContainer);
      }
    });

    if (!this._articlesEventsbound) {
      this.bindArticleEvents();
      this._articlesEventsbound = true;
    }
  }


  getArticlesByCategory(categoryId, limit = 4) {
    return this.articles
      .filter((article) => {
        const articleTypeId = article.type
          ? article.type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "")
          : "";
        return articleTypeId === categoryId;
      })
      .sort((a, b) => b.create_time - a.create_time)
      .slice(0, limit);
  }

  getRandomArticlesByCategory(categoryType, limit = 2) {
    const categoryArticles = this.articles.filter((article) => {
      return article.type === categoryType;
    });

    if (categoryArticles.length === 0) return [];

    const shuffled = [...categoryArticles].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  bindArticleEvents() {
    if (this._articlesEventsbound) {
      return;
    }

    document.addEventListener(
      "click",
      this.handleGlobalArticleClick.bind(this)
    );

    const categoriesContainer = document.getElementById("categoriesContainer");
    const articlesContainer = document.getElementById("articlesContainer");

    if (categoriesContainer) {
      categoriesContainer.addEventListener("click", (e) => {
        const articleCard = e.target.closest(".article-card-new");

        if (articleCard) {
          const articleId = articleCard.dataset.id;

          if (articleId) {
            const detailUrl =
              `detail.html?id=${articleId}` +
              (window.channel ? "&channel=" + window.channel : "");

            window.location.href = detailUrl;
          } else {
          }
        } else {
        }
      });
    }

    if (articlesContainer) {
      articlesContainer.addEventListener("click", (e) => {
        const articleCard = e.target.closest(
          ".article-card-new, .article-card-simple"
        );

        if (articleCard) {
          const articleId = articleCard.dataset.id;

          if (articleId) {
            const detailUrl =
              `detail.html?id=${articleId}` +
              (window.channel ? "&channel=" + window.channel : "");

            window.location.href = detailUrl;
          } else {
          }
        } else {
        }
      });
    }

    this._articlesEventsbound = true;
  }

  handleGlobalArticleClick(e) {
    const articleCard = e.target.closest(".article-card-new");
    if (articleCard) {
      const articleId = articleCard.dataset.id;
      if (articleId) {
        const detailUrl =
          `detail.html?id=${articleId}` +
          (window.channel ? "&channel=" + window.channel : "");

        window.location.href = detailUrl;

        e.preventDefault();
        e.stopPropagation();
      } else {
      }
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  handleScroll() {
    const header = document.querySelector(".header");
    const searchBar = document.querySelector(".search-bar");

    if (!header || !searchBar) return;

    if (window.scrollY > 100) {
      header.classList.add("scrolled");
      searchBar.classList.add("fixed");
    } else {
      header.classList.remove("scrolled");
      searchBar.classList.remove("fixed");
    }
  }

  getRecommendedArticles(currentId, limit = 3) {
    return this.articles
      .filter((article) => {
        return article.id !== currentId && 
               article.id && 
               article.title && 
               article.img &&
               article.create_time;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }
}


const Utils = {
  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
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

  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

window.Utils = Utils;

class BackToTop {
  constructor() {
    this.backToTopBtn = document.getElementById("backToTopBtn");
    this.init();
  }

  init() {
    if (this.backToTopBtn) {
      this.bindEvents();
      this.checkScrollPosition();
    }
  }

  bindEvents() {
    this.backToTopBtn.addEventListener("click", () => {
      this.scrollToTop();
    });

    window.addEventListener(
      "scroll",
      Utils.throttle(() => {
        this.checkScrollPosition();
      }, 100)
    );
  }

  checkScrollPosition() {
    if (window.pageYOffset > 300) {
      this.backToTopBtn.classList.add("show");
    } else {
      this.backToTopBtn.classList.remove("show");
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.healthNewsApp) {
    new BackToTop();
  } else {
    setTimeout(() => {
      new BackToTop();
    }, 100);
  }

  initSearchFunctionality();
  
 
  addChannelToLinks();
});

function initSearchFunctionality() {
  const searchToggleBtn = document.getElementById("searchToggleBtn");
  const searchBar = document.getElementById("searchBar");
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");
  const searchBackBtn = document.getElementById("searchBackBtn");

  if (!searchToggleBtn || !searchBar || !searchInput) return;

  searchToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    searchBar.style.display = "block";
    searchInput.focus();
  });

  if (searchBackBtn) {
    searchBackBtn.addEventListener("click", () => {
      searchBar.style.display = "none";
      searchInput.value = "";
      if (searchClear) {
        searchClear.style.display = "none";
      }

      if (window.healthNewsApp) {
        window.healthNewsApp.clearSearch();
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (!searchBar.contains(e.target) && !searchToggleBtn.contains(e.target)) {
      searchBar.style.display = "none";
    }
  });

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      searchClear.style.display = "block";

      if (window.healthNewsApp) {
        window.healthNewsApp.handleSearch(query);
      }
    } else {
      searchClear.style.display = "none";

      if (window.healthNewsApp) {
        window.healthNewsApp.clearSearch();
      }
    }
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.style.display = "none";
    searchInput.focus();

    if (window.healthNewsApp) {
      window.healthNewsApp.clearSearch();
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchBar.style.display = "none";
      searchToggleBtn.focus();
    }
  });
}


class PrivacyPage {
  constructor() {
    this.init();
  }

  async init() {
    await this.renderSidebarMenuCategories();
    this.setupEventListeners();
    addChannelToLinks();
  }

  setupEventListeners() {
    this.initSidebar();
    this.bindSmartBackButton();
  }

  async renderSidebarMenuCategories() {
    const sidebarCategory = document.querySelector(
      ".sidebar-menu .sidebar-category"
    );
    if (!sidebarCategory) return;

    try {
     
      const infoTypeList = await getCategoryOrder();
      
      if (!infoTypeList || infoTypeList.length === 0) {
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
    } catch (error) {
      }
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


class AboutPage {
  constructor() {
    this.init();
  }

  async init() {
    await this.renderSidebarMenuCategories();
    this.setupEventListeners();
    addChannelToLinks();
  }

  setupEventListeners() {
    this.initSidebar();
    this.bindSmartBackButton();
  }

  async renderSidebarMenuCategories() {
    const sidebarCategory = document.querySelector(
      ".sidebar-menu .sidebar-category"
    );
    if (!sidebarCategory) return;

    try {
     
      const infoTypeList = await getCategoryOrder();
      
      if (!infoTypeList || infoTypeList.length === 0) {
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
    } catch (error) {
      }
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


function addChannelToLinks() {
  if (window.channel) {
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      if (link.href && !link.href.includes("channel=")) {
        try {
          const url = new URL(link.href);
          url.searchParams.set("channel", window.channel);
          link.href = url.toString();
        } catch (e) {
         
        }
      }
    });
  }
}


window.addChannelToLinks = addChannelToLinks;

export { HealthNewsApp, PrivacyPage, AboutPage };
