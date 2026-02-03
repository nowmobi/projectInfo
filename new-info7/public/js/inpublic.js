
import { getCategoryOrder, getArticlesData } from "./BaseURL.js";
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
    await this.loadData();
    this.setupEventListeners();
    this.initSidebar();
    this.renderSidebarCategories();
    await this.renderArticles();
  }

  async loadData() {
    try {
      const data = await getArticlesData();
      
      if (!data) {
        throw new Error("Failed to load articles data");
      }

      
      if (Array.isArray(data) && data.length > 0) {
        
        this.articles = data.filter(item => item && item.id && item.title) || [];
        
        
        this.articles = this.articles.map(article => {
          if (article.create_time && article.create_time > 1000000000000) {
            
            article.create_time = Math.floor(article.create_time / 1000);
          }
          return article;
        });
      } else {
        this.articles = [];
      }
      
      await this.generateCategoriesFromArticles();

      this.hideLoading();
    } catch (error) {
      this.articles = [];
      this.categories = [];

      this.hideLoading();
      this.showEmptyState();
    }
  }

  showEmptyState() {
    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
      emptyState.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-text">No related articles found</div>
          <div class="empty-state-subtext">Try other search keywords or categories</div>
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

  hideEmptyState() {
    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
      emptyState.classList.add("dsn");
    }
  }

  /**
   * 随机选择数组中的指定数量的元素
   * @param {Array} array - 源数组
   * @param {number} count - 要选择的数量
   * @returns {Array} 随机选择的元素数组
   */
  getRandomElements(array, count) {
    if (!array || array.length === 0) return [];
    if (count >= array.length) return array;

   
    const shuffled = [...array];

   
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }

  /**
   *
   *
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
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

  async generateCategoriesFromArticles() {
    const typeSet = new Set();
    this.articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });

   
    const categoryOrder = await getCategoryOrder();

   
    this.categories = categoryOrder.map((type) => ({
      id: type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, ""),
      name: type,
      icon: "",
    }));
  }

  setupEventListeners() {
    this.setupHeaderSearch();

    window.addEventListener("scroll", () => this.handleScroll());

    const sidebarToggle = document.getElementById("sidebarToggle");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const dropdownClose = document.getElementById("dropdownClose");

    if (sidebarToggle && dropdownMenu && dropdownClose) {
      sidebarToggle.addEventListener("click", () => {
        dropdownMenu.classList.add("active");
        document.body.style.overflow = "hidden";
        this.bindEscToClose();
      });

      dropdownClose.addEventListener("click", () => {
        dropdownMenu.classList.remove("active");
        document.body.style.overflow = "";
        this.unbindEscToClose();
      });

      document.addEventListener("click", (e) => {
        const sidebarToggle = document.getElementById("sidebarToggle");
        if (
          !dropdownMenu.contains(e.target) &&
          (!sidebarToggle || !sidebarToggle.contains(e.target))
        ) {
          dropdownMenu.classList.remove("active");
          document.body.style.overflow = "";
          this.unbindEscToClose();
        }
      });
    }

   
  }

  /**
   *
   *
   * @param {string} query
   */
  async handleSearch(query) {
    if (!query.trim()) {
      await this.renderArticles();
      this.hideSearchResults();
      return;
    }

   
    const categoryOrder = await getCategoryOrder();
    const validCategories = new Set(categoryOrder);

    const filteredArticles = this.articles.filter((article) => {
      const searchTerm = query.toLowerCase();
      const title = (article.title || "").toLowerCase();
      const type = (article.type || "").toLowerCase();
      const section = (article.section || "").toLowerCase();

     
      const isValidCategory = validCategories.has(article.type);

     
      return (
        isValidCategory &&
        (title.includes(searchTerm) ||
          type.includes(searchTerm) ||
          section.includes(searchTerm))
      );
    });

    await this.renderArticles(filteredArticles);
    this.showSearchResults(filteredArticles.length, query);
  }

  /**
   *
   *
   * @param {number} count
   * @param {string} query
   */
  showSearchResults(count, query) {
    const categorySections = document.querySelectorAll(".category-section");

    if (count === 0) {
     
      categorySections.forEach((section) => {
        section.style.display = "none";
      });
    }
  }

  hideSearchResults() {
    
  }

  restoreHomePageLayout() {
    const categorySections = document.querySelectorAll(".category-section");
    categorySections.forEach((section) => {
      section.style.display = "block";
    });

    const searchContainer = document.getElementById("searchResultsContainer");
    if (searchContainer) {
      searchContainer.style.display = "none";
    }
  }

  /**
   *
   *
   * @param {string} category
   */
  switchCategory(category) {
    this.currentCategory = category;

    document
      .querySelectorAll(".dropdown-item[data-category]")
      .forEach((cat) => {
        cat.classList.remove("active");
        if (cat.dataset.category === category) {
          cat.classList.add("active");
        }
      });

    this.renderArticles();
  }

  renderSidebarCategories() {
    const dropdownCategories = document.querySelector(".dropdown-categories");
    if (!dropdownCategories) {
      return;
    }

   
    if (!this.categories || this.categories.length === 0) {
      dropdownCategories.innerHTML =
        '<div class="dropdown-item">Loading categories...</div>';
      return;
    }

   
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const categoryPagePath = isInPagesFolder
      ? "./category.html"
      : "./pages/category.html";

   
    const dropdownCategoriesHtml = this.categories
      .map(
        (category) => `
        <a href="${categoryPagePath}?type=${encodeURIComponent(
          category.name
        )}" class="dropdown-item" data-category="${category.id}">
          <span>${category.name}</span>
        </a>
      `
      )
      .join("");

    dropdownCategories.innerHTML = dropdownCategoriesHtml;

    this.bindDropdownCategoryEvents();
  }

  bindDropdownCategoryEvents() {
    const dropdownCategories = document.querySelectorAll(
      ".dropdown-item[data-category]"
    );

    dropdownCategories.forEach((category) => {
      category.addEventListener("click", (e) => {
        const categoryId = e.currentTarget.dataset.category;

        this.switchCategory(categoryId);

        dropdownCategories.forEach((cat) => cat.classList.remove("active"));
        e.currentTarget.classList.add("active");
      });
    });
  }

  /**
   *
   *
   * @param {Array} articlesToRender
   */
  async renderArticles(articlesToRender = null) {
    const isHomePage =
      window.location.pathname.includes("index.html") ||
      window.location.pathname.endsWith("/");

    if (isHomePage && this.currentCategory === "all") {
      await this.renderHomePageLayout(articlesToRender);
    } else {
      this.renderTraditionalLayout(articlesToRender);
    }
  }

  /**
   *
   *
   * @param {Array} articlesToRender
   */
  async renderHomePageLayout(articlesToRender = null) {
    let articles;

    if (articlesToRender) {
      articles = articlesToRender;
    } else {
      articles = this.articles;
    }

    
    if (articlesToRender && articlesToRender.length < this.articles.length) {
      this.renderSearchResults(articles);
      this.bindArticleEvents();
      return;
    }

    
    if (articles.length === 0) {
      this.showEmptyState();
      return;
    }

   
    this.hideEmptyState();

    await this.renderAllCategories(articles);

    this.bindArticleEvents();
  }

  /**
   *
   *
   * @param {Array} articles
   */
  renderSearchResults(articles) {
   
    this.hideEmptyState();

    const categorySections = document.querySelectorAll(".category-section");
    categorySections.forEach((section) => {
      section.style.display = "none";
    });

    let searchContainer = document.getElementById("searchResultsContainer");
    if (!searchContainer) {
      searchContainer = document.createElement("div");
      searchContainer.id = "searchResultsContainer";
      searchContainer.className = "search-results-container";

      const homePageContent = document.querySelector(".home-page-content");
      if (homePageContent) {
        homePageContent.appendChild(searchContainer);
      }
    }

    
    if (!articles || articles.length === 0) {
      searchContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-content">
            <div class="empty-state-text">No search results found</div>
            <div class="empty-state-subtext">Please try other search keywords or categories</div>
          </div>
        </div>
      `;
      searchContainer.style.display = "block";
      return;
    }

    searchContainer.innerHTML = `
      <div class="search-results-list">
        ${articles
          .map(
            (article) => `
          <div class="search-result-item" data-id="${article.id}">
            <div class="search-result-image">
              <img src="${this.getArticleImage(article)}" alt="${
              article.title
            }" onerror="this.style.display='none';">
            </div>
            <div class="search-result-content">
              <h3 class="search-result-title">${article.title}</h3>
              <p class="search-result-type">${article.type}</p>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    searchContainer.style.display = "block";
  }

  /**
   *
   *
   * @param {Array} articlesToRender
   */
  renderTraditionalLayout(articlesToRender = null) {
    const articlesContainer = document.querySelector(".articles-container");
    if (!articlesContainer) return;

    let articles;

    if (articlesToRender) {
      articles = articlesToRender;
    } else {
      articles = this.articles.filter((article) => {
        const articleTypeId = article.type
          ? article.type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "")
          : "";
        return articleTypeId === this.currentCategory;
      });
    }

    articlesContainer.innerHTML = articles
      .map(
        (article) => `
      <div class="article-card" data-id="${article.id}">
        <div class="article-image">
          <img src="${this.getArticleImage(article)}" alt="${
          article.title
        }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #ba7ac7 0%, #9b6aa8 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
            <div>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
              </svg>
              <div>Image</div>
              <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
            </div>
          </div>
        </div>
        <div class="article-content">
          <h3 class="article-title">${article.title}</h3>
          <div class="article-meta">
            <span class="article-type">${article.type}</span>
            <span class="article-time">${this.formatTime(
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

  getArticleImage(article) {
    if (article.img) {
      
      if (article.img.startsWith("http://") || article.img.startsWith("https://")) {
        return article.img;
      }
    }
    
    return "";
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(
      ".article-card, .ai-card, .grid-card, .search-result-item"
    );

    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;

        if (articleId) {
          const detailUrl = `detail.html?id=${articleId}`;
          window.location.href = detailUrl;
        }
      });
    });
  }


  async renderAllCategories(articles) {
    const homePageContent = document.querySelector(".home-page-content");
    if (!homePageContent) return;

   
    const categoryOrder = await getCategoryOrder();

   
    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
      emptyState.classList.add("dsn");
    }

   
    const existingSections = Array.from(
      homePageContent.querySelectorAll(".category-section")
    );

   
    categoryOrder.forEach((categoryName, index) => {
      const categoryArticles = articles.filter(
        (article) => article.type === categoryName
      );

     
      if (categoryArticles.length === 0) {
       
        if (existingSections[index]) {
          existingSections[index].style.display = "none";
        }
        return;
      }

     
      const categoryId = categoryName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[&]/g, "");
      const listId = `${categoryId}List`;

     
      let targetSection = existingSections[index];
      if (!targetSection) {
       
        targetSection = document.createElement("section");
        targetSection.className = "category-section";
        const emptyState = document.getElementById("emptyState");
        if (emptyState) {
          emptyState.insertAdjacentElement("beforebegin", targetSection);
        } else {
          homePageContent.appendChild(targetSection);
        }
      } else {
       
        targetSection.style.display = "";
      }

     
      targetSection.innerHTML = `
        <h2 class="section-title">
          <span>${categoryName.toUpperCase()}</span>
          <a
            href="pages/category.html?type=${encodeURIComponent(
              categoryName
            )}"
            class="section-arrow"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
        </h2>
        <div class="category-news-list" id="${listId}">
          ${this.getRandomElements(categoryArticles, 3)
            .map(
              (article) => `
            <div class="article-card" data-id="${article.id}">
              <img class="article-image" src="${this.getArticleImage(
                article
              )}" alt="${article.title}" />
              <div class="article-content">
                <div class="article-type">${article.type}</div>
                <h3 class="article-title">${article.title}</h3>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    });

   
    for (let i = categoryOrder.length; i < existingSections.length; i++) {
      if (existingSections[i]) {
        existingSections[i].style.display = "none";
      }
    }

   
    const finalEmptyState = document.getElementById("emptyState");
    if (finalEmptyState) {
      finalEmptyState.classList.add("dsn");
    }
  }

  /**
   *
   *
   * @param {number} timestamp
   * @returns {string}
   */
  formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  handleScroll() {
    const header = document.querySelector(".header");
    if (!header) return;

    if (window.scrollY > 100) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  /**
   *
   *
   * @param {string} currentId
   * @param {number} limit
   * @returns {Array}
   */
  getRecommendedArticles(currentId, limit = 3) {
   
    const currentIdStr = String(currentId);

    return this.articles
      .filter((article) => {
       
        if (!article || !article.id) return false;
       
        return String(article.id) !== currentIdStr;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

  /**
   *
   *
   * @param {string} currentId
   */
  renderRecommendedArticles(currentId) {
    const recommendedContainer = document.querySelector(
      ".recommended-articles"
    );
    if (!recommendedContainer) return;

    const recommended = this.getRecommendedArticles(currentId, 3);

   
    const validRecommended = recommended.filter(
      (article) => article && article.id && article.title
    );

    if (validRecommended.length === 0) {
      recommendedContainer.innerHTML =
        '<p style="text-align: center; color: #999;">No recommendations available</p>';
      return;
    }

    recommendedContainer.innerHTML = validRecommended
      .map(
        (article) => `
      <div class="recommended-card" data-id="${article.id}">
        <div class="recommended-image">
          <img src="${this.getArticleImage(article)}" alt="${
          article.title
        }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #ba7ac7 0%, #9b6aa8 100%); color: white; align-items: center; justify-content: center; font-size: 12px; text-align: center; padding: 5px;">
             <div>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 4px;">
                 <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
               </svg>
               <div style="font-size: 10px;">Image</div>
             </div>
           </div>
        </div>
        <div class="recommended-content">
          <span class="recommended-type-tag">${
            article.type || "Unknown Type"
          }</span>
          <h4 class="recommended-card-title">${article.title}</h4>
        </div>
      </div>
    `
      )
      .join("");

    this.bindRecommendedEvents();
  }

  bindRecommendedEvents() {
    const recommendedCards = document.querySelectorAll(".recommended-card");
    recommendedCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        if (articleId) {
          window.location.href =
            `detail.html?id=${articleId}` +
            (window.channel ? `&channel=${window.channel}` : "");
        }
      });
    });
  }

  initSidebar() {
    setTimeout(() => {
      const sidebarToggle = document.getElementById("sidebarToggle");
      const dropdownMenu = document.getElementById("dropdownMenu");
      const dropdownClose = document.getElementById("dropdownClose");

      if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
          this.openDropdown();
        });
      }

      if (dropdownClose) {
        dropdownClose.addEventListener("click", () => {
          this.closeDropdown();
        });
      }

      this.bindDropdownNavigation();
    }, 100);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeDropdown();
      }
    });
  }

  bindDropdownNavigation() {
    const dropdownItems = document.querySelectorAll(".dropdown-item");

    dropdownItems.forEach((item, index) => {
      const href = item.getAttribute("href");
      const dataPage = item.getAttribute("data-page");

      item.addEventListener("click", (e) => {
        e.preventDefault();

        if (href) {
          window.location.href = href;
        }

        setTimeout(() => {
          this.closeDropdown();
        }, 100);
      });
    });
  }

  openDropdown() {
    const dropdownMenu = document.getElementById("dropdownMenu");
    if (dropdownMenu) {
      dropdownMenu.classList.add("active");

      dropdownMenu.style.top = "60px";
      dropdownMenu.style.display = "block";
      dropdownMenu.style.visibility = "visible";
      document.body.style.overflow = "hidden";
    } else {
    }
  }

  closeDropdown() {
    const dropdownMenu = document.getElementById("dropdownMenu");
    if (dropdownMenu) {
      dropdownMenu.classList.remove("active");

      dropdownMenu.style.top = "";
      dropdownMenu.style.display = "";
      dropdownMenu.style.visibility = "";
      document.body.style.overflow = "";
    }
  }

  bindEscToClose() {
    if (this._escHandler) return;
    this._escHandler = (e) => {
      if (e.key === "Escape") {
        this.closeDropdown();
      }
    };
    document.addEventListener("keydown", this._escHandler);
  }

  unbindEscToClose() {
    if (!this._escHandler) return;
    document.removeEventListener("keydown", this._escHandler);
    this._escHandler = null;
  }

  setupHeaderSearch() {
    const headerSearchToggle = document.getElementById("headerSearchToggle");
    const headerSearchContainer = document.getElementById(
      "headerSearchContainer"
    );
    const headerSearchInput = document.getElementById("headerSearchInput");
    const headerSearchClose = document.getElementById("headerSearchClose");

    if (
      !headerSearchToggle ||
      !headerSearchContainer ||
      !headerSearchInput ||
      !headerSearchClose
    ) {
      return;
    }

    headerSearchToggle.addEventListener("click", () => {
      this.showHeaderSearch();
    });

    headerSearchClose.addEventListener("click", () => {
      this.hideHeaderSearch();
    });

    const debouncedHeaderSearch = this.debounce((query) => {
      this.handleSearch(query);
    }, 300);

    headerSearchInput.addEventListener("input", (e) => {
      const query = e.target.value;
      debouncedHeaderSearch(query);
    });

    headerSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleSearch(e.target.value);
      }
    });

    document.addEventListener("click", (e) => {
      const headerSearchToggle = document.getElementById("headerSearchToggle");
      if (
        !headerSearchContainer.contains(e.target) &&
        (!headerSearchToggle || !headerSearchToggle.contains(e.target)) &&
        headerSearchContainer.style.display !== "none"
      ) {
        this.hideHeaderSearch();
      }
    });
  }

  showHeaderSearch() {
    const headerSearchContainer = document.getElementById(
      "headerSearchContainer"
    );
    const headerSearchInput = document.getElementById("headerSearchInput");

    if (headerSearchContainer && headerSearchInput) {
      headerSearchContainer.style.display = "block";
      headerSearchInput.focus();

      setTimeout(() => {
        headerSearchContainer.style.opacity = "1";
        headerSearchContainer.style.transform = "translateY(0)";
      }, 10);
    }
  }

  hideHeaderSearch() {
    const headerSearchContainer = document.getElementById(
      "headerSearchContainer"
    );
    const headerSearchInput = document.getElementById("headerSearchInput");

    if (headerSearchContainer && headerSearchInput) {
      headerSearchInput.value = "";
      this.handleSearch("");

     
      this.restoreHomePageLayout();

      headerSearchContainer.style.display = "none";
    }
  }
}


const Utils = {
  /**
   * 防抖函数
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
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
};





/**
 * 初始化公共侧边栏功能
 */
function initCommonSidebar() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const dropdownClose = document.getElementById("dropdownClose");

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.healthNewsApp) {
        window.healthNewsApp.openDropdown();
      }
    });
  }

  if (dropdownClose) {
    dropdownClose.addEventListener("click", () => {
      if (window.healthNewsApp) {
        window.healthNewsApp.closeDropdown();
      }
    });
  }

  if (window.healthNewsApp) {
    window.healthNewsApp.bindDropdownNavigation();
  }
}

/**
 * 智能返回按钮处理逻辑
 */
function handleSmartBack() {
  const referrer = document.referrer;

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

  if (referrer.includes("category.html")) {
    window.location.href = referrer;
    return;
  }

  window.location.href =
    "../index.html" +
    (window.channel ? `?channel=${window.channel}` : "");
}

/**
 * 处理 Channel 参数，为所有链接添加 channel 参数
 */
function handleChannelParameter() {
 
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("channel")) {
    window.channel = urlParams.get("channel");
  }

 
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

/**
 * 初始化 ThemeApplier
 */
function initThemeApplier() {
  if (typeof ThemeApplier !== "undefined") {
    const themeApplier = new ThemeApplier();
    themeApplier.startObserving();

    window.syncAndApplyTheme = () => {
      themeApplier.syncThemeFromJS();
      themeApplier.applyTheme();
    };

    window.syncAndApplyTheme();
  }
}





/**
 * About 页面类
 */
class AboutPage {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
   
    if (window.initCommonSidebar) {
      window.initCommonSidebar();
    }

   
    this.bindSmartBackButton();
  }

  bindSmartBackButton() {
    const backButton = document.getElementById("smartBackButton");
    if (backButton && window.handleSmartBack) {
      backButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.handleSmartBack();
      });
    }
  }
}

/**
 * Privacy 页面类
 */
class PrivacyPage {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
   
    if (window.initCommonSidebar) {
      window.initCommonSidebar();
    }

   
    this.bindSmartBackButton();
  }

  bindSmartBackButton() {
    const backButton = document.getElementById("smartBackButton");
    if (backButton && window.handleSmartBack) {
      backButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.handleSmartBack();
      });
    }
  }
}





document.addEventListener("DOMContentLoaded", () => {
  const pathname = window.location.pathname;
  const isHomePage =
    pathname.includes("index.html") ||
    pathname.endsWith("/") ||
    pathname === "/";
  const isDetailPage = pathname.includes("detail.html");
  const isAboutPage = pathname.includes("about.html");
  const isPrivacyPage = pathname.includes("privacy.html");

 
  if (isHomePage || isDetailPage || isAboutPage || isPrivacyPage) {
    if (!window.healthNewsApp) {
      window.healthNewsApp = new HealthNewsApp();
    }
  }

 
  if (window.initThemeApplier) {
    window.initThemeApplier();
  }

 
  if (window.handleChannelParameter) {
    window.handleChannelParameter();
  }

 
  if (isAboutPage) {
    new AboutPage();
  } else if (isPrivacyPage) {
    new PrivacyPage();
  }
});


window.Utils = Utils;
window.HealthNewsApp = HealthNewsApp;
window.initCommonSidebar = initCommonSidebar;
window.handleSmartBack = handleSmartBack;
window.handleChannelParameter = handleChannelParameter;
window.initThemeApplier = initThemeApplier;
window.AboutPage = AboutPage;
window.PrivacyPage = PrivacyPage;
