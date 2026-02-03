
import {
  getCategoryOrder,
  Category_URL,
  BASE_URL,
} from "./BaseURL.js";

class HealthNewsApp {
  constructor() {
    this.currentCategory = "all";
    this.articles = [];
    this.categories = [];
    this.allowedCategories = []; 
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.initSidebar();
    this.initializeCategoryState();
    this.setCurrentPageActive();
    this.renderCategories();
    this.renderArticles();
  }

  initializeCategoryState() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get("category");
    const savedCategory = localStorage.getItem("currentCategory");

    let initialCategory = "all";

    if (
      categoryFromUrl &&
      this.categories.some((cat) => cat.id === categoryFromUrl)
    ) {
      initialCategory = categoryFromUrl;
    } else if (
      savedCategory &&
      this.categories.some((cat) => cat.id === savedCategory)
    ) {
      initialCategory = savedCategory;
    }

    this.currentCategory = initialCategory;
  }

  setCurrentPageActive() {
    setTimeout(() => {
      const currentPath = window.location.pathname;
      const currentPage = currentPath.split("/").pop() || "index.html";

      const allSidebarItems = document.querySelectorAll(".sidebar-item");
      allSidebarItems.forEach((item) => {
        item.classList.remove("active");
      });

      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get("category");

      if (currentPage === "index.html" || currentPage === "") {
        if (categoryParam) {
          const categoryItem = document.querySelector(
            `.sidebar-item[data-page="${categoryParam}"]`
          );
          if (categoryItem) {
            categoryItem.classList.add("active");
          } else {
            const homeItem = document.querySelector(
              '.sidebar-item[data-page="home"]'
            );
            if (homeItem) {
              homeItem.classList.add("active");
            }
          }
        } else {
          const homeItem = document.querySelector(
            '.sidebar-item[data-page="home"]'
          );
          if (homeItem) {
            homeItem.classList.add("active");
          }
        }
      } else if (currentPage === "about.html") {
        const aboutItem = document.querySelector(
          '.sidebar-item[data-page="about"]'
        );
        if (aboutItem) {
          aboutItem.classList.add("active");
        }
      } else if (currentPage === "category.html") {
        const categoryType = urlParams.get("type");
        if (categoryType) {
          const categoryItem = document.querySelector(
            `.sidebar-item[data-page="${categoryType
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[&]/g, "-")}"]`
          );
          if (categoryItem) {
            categoryItem.classList.add("active");
          }
        }
      }
    }, 200);
  }

  async loadData() {
    
    if (this.articles.length > 0 && this.categories.length > 0) {
      
      return;
    }
    
    try {
      let response;
      let data;
      
        response = await fetch(Category_URL, { cache: "default" });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();
        
      if (Array.isArray(data)) {
        
        if (data.length > 0 && data[0].info1) {
          this.articles = data.slice(1);
        } else {
          this.articles = data;
        }
      } else if (data && Array.isArray(data.data)) {
        this.articles = data.data;
      } else if (data && Array.isArray(data.list)) {
        this.articles = data.list;
      } else if (data && Array.isArray(data.result)) {
        this.articles = data.result;
      } else {
        this.articles = [];
      }
      await this.generateCategoriesFromArticles();
    } catch (error) {
      
      this.articles = [];
      this.categories = [];
      this.showEmptyState();
    }
  }

  showEmptyState() {
    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
      emptyState.classList.remove("dsn");
    }
  }

  async generateCategoriesFromArticles() {
    const categoriesFromArticles = new Set();
    this.articles.forEach(article => {
      const categoryField = article.type || article.category || article.typeName || article.categoryName;
      if (categoryField) {
        categoriesFromArticles.add(categoryField);
      }
    });
    let typeSet;
    
    
    if (categoriesFromArticles.size > 0) {
      typeSet = Array.from(categoriesFromArticles);
    } else {
      // Use empty array instead of calling getCategoryOrder() to avoid duplicate request
      typeSet = [];
    }

    this.allowedCategories = typeSet;
    this.categories = [
      {
        id: "all",
        name: "Suggest",
        icon: "",
      },
      ...typeSet.map((type) => ({
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
      const debouncedSearch = Utils.debounce((query) => {
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
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarMenu = document.getElementById("sidebarMenu");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (sidebarToggle && sidebarMenu && sidebarClose) {
      sidebarToggle.addEventListener("click", () => {
        sidebarMenu.classList.add("active");
        if (sidebarOverlay) {
          sidebarOverlay.classList.add("active");
        }
        document.body.style.overflow = "hidden";

        this.bindEscToClose();
      });

      sidebarClose.addEventListener("click", () => {
        sidebarMenu.classList.remove("active");
        if (sidebarOverlay) {
          sidebarOverlay.classList.remove("active");
        }
        document.body.style.overflow = "";
        this.unbindEscToClose();
      });

      if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", () => {
          sidebarMenu.classList.remove("active");
          sidebarOverlay.classList.remove("active");
          document.body.style.overflow = "";
          this.unbindEscToClose();
        });
      }

      document.addEventListener("click", (e) => {
        if (
          !sidebarMenu.contains(e.target) &&
          !sidebarToggle.contains(e.target)
        ) {
          sidebarMenu.classList.remove("active");
          if (sidebarOverlay) {
            sidebarOverlay.classList.remove("active");
          }
          document.body.style.overflow = "";
          this.unbindEscToClose();
        }
      });
    }

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

  bindCategoryEvents() {
    const categoryButtons = document.querySelectorAll(".category-btn");

    categoryButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const category = e.currentTarget.dataset.category;
        this.switchCategory(category);
      });
    });
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.renderArticles();
      this.hideSearchResults();
      const emptyState = document.getElementById("emptyState");
      if (emptyState) {
        emptyState.classList.add("dsn");
      }
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
      const isInAllowedCategory = this.allowedCategories.some(
        (category) =>
          category.toLowerCase() === (article.type || "").toLowerCase()
      );
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
  }

  switchCategory(category) {
    if (this.currentCategory === category) {
      return;
    }

    this.currentCategory = category;
    localStorage.setItem("currentCategory", category);
    const url = new URL(window.location);
    if (category === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", category);
    }
    window.history.replaceState({}, "", url);
    this.updateCategoryUIState(category);
    this.renderArticles();
  }

  updateCategoryUIState(activeCategory) {
    const categoryButtons = document.querySelectorAll(".category-btn");
    categoryButtons.forEach((btn) => {
      btn.classList.remove("active");
      btn.removeAttribute("aria-selected");
      btn.style.backgroundColor = "#f8f9fa";
      btn.style.color = "#333";

      const isActive = btn.dataset.category === activeCategory;
      if (isActive) {
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        btn.style.backgroundColor = "var(--primary-color)";
        btn.style.color = "#ffffff";
      } else {
      }
    });

    const sidebarCategories = document.querySelectorAll(".sidebar-category");

    sidebarCategories.forEach((cat) => {
      cat.classList.remove("active");
      cat.removeAttribute("aria-selected");
      const isActive = cat.dataset.category === activeCategory;
      if (isActive) {
        cat.classList.add("active");
        cat.setAttribute("aria-selected", "true");
      } else {
      }
    });

    categoryButtons.forEach((btn) => {
      btn.offsetHeight;
    });

    sidebarCategories.forEach((cat) => {
      cat.offsetHeight;
    });
    this.updatePageTitle(activeCategory);
  }

  updatePageTitle(category) {
    const categoryObj = this.categories.find((cat) => cat.id === category);
    if (categoryObj && categoryObj.name && category !== "all") {
      document.title = `${categoryObj.name} - Health News`;
    } else {
      document.title = "Health News - Professional Health Information Platform";
    }
  }

  renderCategories() {
    const categoryContainer = document.querySelector(".category-container");
    if (categoryContainer) {
      const categoryButtonsHtml = this.categories
        .map(
          (category) => `
        <button class="category-btn ${
          category.id === this.currentCategory ? "active" : ""
        }" 
                data-category="${category.id}"
                aria-selected="${category.id === this.currentCategory}">
           <span class="category-name">${category.name}</span>
         </button>
      `
        )
        .join("");

      categoryContainer.innerHTML = categoryButtonsHtml;
      this.bindCategoryEvents();
    }

    this.renderSidebarCategories();
    this.updateCategoryUIState(this.currentCategory);
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
        e.preventDefault();
        const categoryId = e.currentTarget.dataset.category;
        if (categoryId) {
          const isDetailPage = window.location.pathname.includes("detail.html");

          if (isDetailPage) {
            const homeUrl =
              categoryId === "all"
                ? "../index.html" +
                  (window.channel ? "?channel=" + window.channel : "")
                : `../index.html?category=${categoryId}` +
                  (window.channel ? "&channel=" + window.channel : "");
            window.location.href = homeUrl;
          } else {
            this.switchCategory(categoryId);
          }
          this.closeSidebar();
        }
      });
    });
  }

  closeSidebar() {
    const sidebarMenu = document.getElementById("sidebarMenu");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const mobileMenu = document.getElementById("mobileMenu");
    if (sidebarMenu) {
      sidebarMenu.classList.remove("active");
      document.body.style.overflow = "";
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove("active");
    }

    if (mobileMenu) {
      mobileMenu.classList.remove("active");
      mobileMenu.classList.add("dsn");
    }
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
    decoded = decoded.replace(/\?\?nbsp;/g, "&nbsp;");
    decoded = decoded.replace(/\?\?lt;/g, "&lt;");
    decoded = decoded.replace(/\?\?gt;/g, "&gt;");
    decoded = decoded.replace(/\?\?amp;/g, "&amp;");
    decoded = decoded.replace(/\?\?quot;/g, "&quot;");
    decoded = decoded.replace(/\?\?#39;/g, "&#39;");
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
    decoded = decoded.replace(/<\/\/span>/g, "</span>");
    decoded = decoded.replace(/<\/\/div>/g, "</div>");
    decoded = decoded.replace(/<\/\/p>/g, "</p>");
    decoded = decoded.replace(/<\/\/h([1-6])>/g, "</h$1>");
    decoded = decoded.replace(/<\/\/strong>/g, "</strong>");
    decoded = decoded.replace(/<\/\/em>/g, "</em>");
    decoded = decoded.replace(/<\/\/b>/g, "</b>");
    decoded = decoded.replace(/<\/\/i>/g, "</i>");
    decoded = decoded.replace(/<\/\/u>/g, "</u>");
    decoded = decoded.replace(/\s+/g, " ").trim();
    decoded = decoded.replace(/[\uFFFD\uFFFE\uFEFF]/g, "");

    return decoded;
  }



  renderArticles(articlesToRender = null) {
    const articlesGrid = document.querySelector(".articles-grid");
    if (!articlesGrid) {
      
      return;
    }

    let articles;

    if (articlesToRender) {
      articles = articlesToRender;
    } else if (this.currentCategory === "all") {
      articles = this.getTopArticlesByCategory(2);
    } else {
      articles = this.articles.filter((article) => {
        
        const categoryField = article.type || article.category || article.typeName || article.categoryName;
        const articleTypeId = categoryField
          ? categoryField
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[&]/g, "")
          : "";
        return articleTypeId === this.currentCategory;
      });
    }

    if (articles.length === 0) {
      const emptyState = document.getElementById("emptyState");
      if (emptyState) {
        emptyState.classList.remove("dsn");
      }
      return;
    }

    let htmlContent = [];
    articles.forEach((article, index) => {
      const imgUrl = this.getArticleImage(article);
      const articleId = article.id || article.articleId || article.artId || index;
      const title = article.title || article.titleName || article.subject || "Untitled";
      const category = article.type || article.category || article.typeName || article.categoryName || "";
      const timeField = article.create_time || article.publishTime || article.createTime || article.time || Date.now() / 1000;
      const articleHTML = `
        <div class="article-card-overlay" data-id="${articleId}">
          <div class="article-image-overlay">
            <img src="${imgUrl}" alt="${title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
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
          <div class="article-overlay-content">
            <div class="article-overlay-type">${this.decodeUnicode(category)}</div>
            <h3 class="article-overlay-title">${title}</h3>
            <div class="article-overlay-meta">
              <span class="article-overlay-time">${this.formatTime(timeField)}</span>
            </div>
          </div>
        </div>
      `;

      htmlContent.push(articleHTML);
    });

    this.insertArticlesIntoContainers(htmlContent, articlesGrid);
    this.bindArticleEvents();
  }

  insertArticlesIntoContainers(articlesHtmlArray, articlesGrid) {
    let currentIndex = 0;
    const existingContainers =
      articlesGrid.querySelectorAll(".home_article-item");
    articlesHtmlArray.forEach((articleHtml) => {
      if (currentIndex >= existingContainers.length) {
        const newContainer = document.createElement("div");
        newContainer.className = "home_article-item";
        articlesGrid.appendChild(newContainer);

        newContainer.innerHTML = articleHtml;
      } else {
        existingContainers[currentIndex].innerHTML = articleHtml;
        existingContainers[currentIndex].style.display = "block";
      }
      currentIndex++;
    });
    
    // Hide or remove extra containers if there are more containers than articles
    while (currentIndex < existingContainers.length) {
      existingContainers[currentIndex].style.display = "none";
      currentIndex++;
    }
  }

  getTopArticlesByCategory(limit = 2) {
    
    
    const topArticles = [];
    const categoryIds = this.categories
      .filter((cat) => cat.id !== "all")
      .map((cat) => cat.id);
    if (categoryIds.length === 0) {
      const shuffled = [...this.articles].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(10, this.articles.length));
    }

    categoryIds.forEach((categoryId) => {
      
      const categoryArticles = this.articles.filter((article) => {
        const categoryField = article.type || article.category || article.typeName || article.categoryName;
        if (!categoryField) return false;
        const articleTypeId = categoryField
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[&]/g, "");
        const isMatch = articleTypeId === categoryId;
        if (isMatch) {
          
        }
        return isMatch;
      });
      
      const shuffled = [...categoryArticles].sort(() => Math.random() - 0.5);
      const randomArticles = shuffled.slice(0, limit);
      topArticles.push(...randomArticles);
    });

    
    if (topArticles.length === 0) {
      const shuffled = [...this.articles].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(10, this.articles.length));
    }

    const finalResult = topArticles.sort(() => Math.random() - 0.5);
    return finalResult;
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(".article-card-overlay");
    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        if (articleId) {
          const isInPagesFolder = window.location.pathname.includes("/pages/");
          const detailUrl = isInPagesFolder
            ? `../detail.html?id=${articleId}` +
              (window.channel ? `&channel=${window.channel}` : "")
            : `detail.html?id=${articleId}` +
              (window.channel ? `&channel=${window.channel}` : "");
          window.location.href = detailUrl;
        }
      });
    });
  }

  formatTime(timeField) {
    let timestamp;
    
    if (typeof timeField === 'number') {
      timestamp = timeField > 1e12 ? timeField : timeField * 1000;
    } else if (typeof timeField === 'string') {
      timestamp = new Date(timeField).getTime();
    } else {
      timestamp = Date.now();
    }
    
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

  getArticleById(id) {
    const idStr = String(id);
    return this.articles.find((article) => {
      const articleId = article.id || article.articleId || article.artId;
      return String(articleId) === idStr;
    });
  }

  getRecommendedArticles(currentId, limit = 3) {
    const isValidId = (id) => {
      if (!id) return false;
      if (typeof id === 'string') {
        return id.trim() !== '';
      }
      if (typeof id === 'number') {
        return !isNaN(id);
      }
      return false;
    };

    return this.articles
      .filter((article) => {
        
        const articleId = article.id || article.articleId || article.artId;
        const currentIdStr = String(currentId);
        const articleIdStr = String(articleId);
        return (
          isValidId(articleId) &&
          articleIdStr !== currentIdStr && 
          article.title && article.title.trim() !== '' 
        );
      })
      .sort(() => Math.random() - 0.5) 
      .slice(0, limit);
  }

  renderRecommendedArticles(currentId) {
    const recommendedContainer = document.querySelector(
      ".recommended-articles"
    );
    if (!recommendedContainer) return;
    
    const recommended = this.getRecommendedArticles(currentId, 3);
    if (recommended.length === 0) {
      recommendedContainer.innerHTML = "";
      return;
    }

    const isInPagesFolder = window.location.pathname.includes("/pages/");
    recommendedContainer.innerHTML = recommended
      .map((article) => {
        const articleId = article.id || article.articleId || article.artId;
        const href = (
          isInPagesFolder
            ? `../detail.html?id=${articleId}`
            : `detail.html?id=${articleId}`
        ) + (window.channel ? `&channel=${window.channel}` : "");
        return `
      <a class="recommended-card" data-id="${articleId}" href="${href}">
        <div class="recommended-image-overlay">
          <img src="${this.getArticleImage(article)}" alt="${article.title || 'Recommended article'}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #746097 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 12px; text-align: center; padding: 5px;">
             <div>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 4px;">
                 <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
               </svg>
               <div style="font-size: 10px;">Image</div>
             </div>
           </div>
        </div>
        <div class="recommended-overlay-content">
          <h4 class="recommended-overlay-title">${article.title || 'Untitled Article'}</h4>
        </div>
      </a>
    `;
      })
      .join("");

    this.bindRecommendedEvents();
  }

  getArticleImage(article) {
    const imgField = article.img || article.image || article.pic || article.coverImg;
    if (!imgField) {
      return "";
    }
    
    if (imgField.startsWith('http://') || imgField.startsWith('https://')) {
      return imgField;
    }
    
    return imgField;
  }

  bindRecommendedEvents() {
    const recommendedCards = document.querySelectorAll(".recommended-card");
    recommendedCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault(); 
        const articleId = card.dataset.id;
        if (!articleId) {
          return;
        }
        const numId = Number(articleId);
        if (isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
          return;
        }
        const isInPagesFolder = window.location.pathname.includes("/pages/");
        const detailUrl = isInPagesFolder
          ? `../detail.html?id=${articleId}` +
            (window.channel ? `&channel=${window.channel}` : "")
          : `detail.html?id=${articleId}` +
            (window.channel ? `&channel=${window.channel}` : "");
        
        const isCurrentlyOnDetailPage =
          window.location.pathname.includes("detail.html");
        if (isCurrentlyOnDetailPage) {
          window.location.replace(detailUrl);
        } else {
          window.location.href = detailUrl;
        }
      });
    });
  }

  initSidebar() {
    setTimeout(() => {
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
    }, 100);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeSidebar();
      }
    });
  }

  bindSidebarNavigation() {
    const sidebarItems = document.querySelectorAll(".sidebar-item");

    sidebarItems.forEach((item, index) => {
      const href = item.getAttribute("href");
      const dataPage = item.getAttribute("data-page");

      item.addEventListener("click", (e) => {
        e.preventDefault();
        sidebarItems.forEach((sidebarItem) => {
          sidebarItem.classList.remove("active");
        });
        item.classList.add("active");

        if (dataPage === "home") {
          if (this.categories && this.categories.length > 0) {
            const firstCategory = this.categories[0];
            this.switchCategory(firstCategory.id);
          }
        } else if (href) {
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
}


document.addEventListener("DOMContentLoaded", () => {
  const isDetailPage = window.location.pathname.includes("detail.html");
  // Check if healthNewsApp is not yet created and not in the process of being created
  if (!window.healthNewsApp && !window.healthNewsAppInitializing) {
    window.healthNewsAppInitializing = true;
    window.healthNewsApp = new HealthNewsApp();
    // Set timeout to reset the flag in case of errors
    setTimeout(() => {
      window.healthNewsAppInitializing = false;
    }, 1000);
  }
  
});

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

window.BackToTop = BackToTop;

document.addEventListener("DOMContentLoaded", () => {
  const isDetailPage = window.location.pathname.includes("detail.html");

  if (!isDetailPage) {
    if (window.healthNewsApp) {
      new BackToTop();
    } else {
      setTimeout(() => {
        new BackToTop();
      }, 100);
    }

    initSearchFunctionality();
  }
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

class BaseInfoPage {
  constructor() {
    this.init();
  }
  init() {
    this.setupEventListeners();
    this.initHealthNewsApp();
  }

  async initHealthNewsApp() {
    if (window.healthNewsApp) {
      // Only load data if articles array is empty
      if (window.healthNewsApp.articles.length === 0) {
        await window.healthNewsApp.loadData();
      }
      window.healthNewsApp.renderSidebarCategories();
      this.bindCategoryClickEvents();
    } else {
      setTimeout(() => {
        if (window.healthNewsApp) {
          window.healthNewsApp.renderSidebarCategories();
          this.bindCategoryClickEvents();
        }
      }, 500);
    }
  }

  bindCategoryClickEvents() {
    const sidebarCategories = document.querySelectorAll(".sidebar-category");
    sidebarCategories.forEach((category) => {
      const newCategory = category.cloneNode(true);
      category.parentNode.replaceChild(newCategory, category);
      newCategory.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const categoryId = newCategory.dataset.category;
        if (categoryId) {
          const categoryObj = window.healthNewsApp?.categories?.find(
            (cat) => cat.id === categoryId
          );
          if (categoryObj) {
            const categoryName = encodeURIComponent(categoryObj.name);
            window.location.href =
              `category.html?type=${categoryName}` +
              (window.channel ? `&channel=${window.channel}` : "");
          }
        }
      });
    });
  }

  setupEventListeners() {
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
    const homeItem = document.querySelector('.sidebar-item[data-page="home"]');
    if (homeItem) {
      homeItem.addEventListener("click", (e) => {
        const href = homeItem.getAttribute("href");
        if (href) {
          e.preventDefault();
          window.location.href = href;
          setTimeout(() => {
            this.closeSidebar();
          }, 100);
        }
      });
    }
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
    const referrer = document.referrer;

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
      window.location.href =
        referrer + (window.channel ? "?channel=" + window.channel : "");
      return;
    }

    if (referrer.includes("category.html")) {
      window.location.href =
        referrer + (window.channel ? "?channel=" + window.channel : "");
      return;
    }

    window.location.href =
      "../index.html" +
      (window.channel ? "?channel=" + window.channel : "");
  }
}


class AboutPage extends BaseInfoPage {}
class PrivacyPage extends BaseInfoPage {
  handleSmartBack() {
    const referrer = document.referrer;

    if (
      referrer.includes("index.html") ||
      referrer.includes("localhost") ||
      referrer.includes("127.0.0.1")
    ) {
      window.location.href =
        "../index.html?" +
        (window.channel ? `&channel=${window.channel}` : "");
      return;
    }

    if (referrer.includes("detail.html")) {
      window.location.href = referrer;
      return;
    }

    if (referrer.includes("category.html")) {
      window.location.href = referrer;
      return;
    }

    window.location.href =
      "../index.html?" +
      (window.channel ? `&channel=${window.channel}` : "");
  }
}


export { AboutPage, PrivacyPage };
export function initAboutPage() {
  const init = () => {
    new AboutPage();
    handleChannelLinks();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}


export function initPrivacyPage() {
  const init = () => {
    new PrivacyPage();
    handleChannelLinks();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}


export function handleChannelLinks() {
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


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", handleChannelLinks);
} else {
  handleChannelLinks();
}
