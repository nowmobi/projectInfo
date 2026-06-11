
import { getCategoryOrder, Category_URL, getDbData } from "./BaseURL.js";
import { handleChannelParameter, formatTime } from "./common.js";


const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("channel")) {
  window.channel = urlParams.get("channel");
}

class HealthNewsApp {
  constructor(options = {}) {
    this.currentCategory = "all";
    this.articles = [];
    this.categories = [];
    this.useHomePageLayout = options.useHomePageLayout || false;
    this.init();
  }

  async init() {
   
    const loadDataPromise = this.loadData();
    this.setupEventListeners();
    this.initSidebar();
    
   
    await loadDataPromise;
    await this.renderSidebarCategories();
  }

  
  async initHomePage() {
    await this.renderSidebarCategories();
    this.renderArticles();
  }

  async loadData() {
    try {
      
      const data = await getDbData();
      
     
      if (Array.isArray(data)) {
        this.articles = data.filter(item => {
         
          if (!item || typeof item !== 'object') return false;
          if (item.info1) return false;
         
          return item.id !== undefined && item.id !== null && item.title;
        });
      } else if (data && typeof data === "object") {
       
        if (data.articles && Array.isArray(data.articles)) {
          this.articles = data.articles.filter(item => item && item.id && item.title);
        } else if (data.data && Array.isArray(data.data)) {
          this.articles = data.data.filter(item => item && item.id && item.title);
        } else {
         
          if (data.id && data.title && !data.info1) {
            this.articles = [data];
          } else {
            this.articles = [];
          }
        }
      } else {
        this.articles = [];
      }

      
      if (this.articles && this.articles.length > 0) {
        const firstArticle = this.articles[0];
  
      } else {
        console.warn("No articles loaded! Articles array is empty.");
      }

      this.generateCategoriesFromArticles();

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
    if (emptyState) {
      emptyState.innerHTML = ``;
      emptyState.classList.remove("dsn");
    }
  }

  hideLoading() {
    const loading = document.getElementById("loading");
    if (loading) {
      loading.classList.add("dsn");
    }
  }

  formatTime(timestamp) {
    
    return formatTime(timestamp);
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

  async generateCategoriesFromArticles() {
    const typeSet = new Set();
    this.articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });

    
    const categoryOrder = await getCategoryOrder();

    
    
    const orderedCategories = categoryOrder.filter((categoryConfig) => {
      const categoryName =
        typeof categoryConfig === "string"
          ? categoryConfig
          : categoryConfig.name;
      return typeSet.has(categoryName);
    });

    this.categories = [
      {
        id: "all",
        name: "Suggest",
        icon: "",
      },
      ...orderedCategories.map((categoryConfig) => {
        const categoryName =
          typeof categoryConfig === "string"
            ? categoryConfig
            : categoryConfig.name;
        return {
          id: categoryName
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[&]/g, ""),
          name: categoryName,
          icon: "",
        };
      }),
    ];
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
        const headerRightButtons = document.querySelector(
          ".header-right-buttons"
        );
        if (
          !dropdownMenu.contains(e.target) &&
          (!headerRightButtons || !headerRightButtons.contains(e.target))
        ) {
          dropdownMenu.classList.remove("active");
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

  handleSearch(query) {
    if (!query.trim()) {
      this.renderArticles();
      this.hideSearchResults();
      return;
    }

    
    const allowedCategories = this.categories
      .filter((cat) => cat.id !== "all") 
      .map((cat) => cat.name); 

    const filteredArticles = this.articles.filter((article) => {
      const searchTerm = query.toLowerCase();
      const title = (article.title || "").toLowerCase();
      const type = (article.type || "").toLowerCase();
      const section = (article.section || "").toLowerCase();

      
      const matchesSearch =
        title.includes(searchTerm) ||
        type.includes(searchTerm) ||
        section.includes(searchTerm);

      
      const isInAllowedCategory = allowedCategories.includes(article.type);

      
      if (this.currentCategory !== "all") {
        
        const articleTypeId = article.type
          ? article.type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "")
          : "";
        return (
          matchesSearch &&
          isInAllowedCategory &&
          articleTypeId === this.currentCategory
        );
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
        emptyState.classList.add("dsn");
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

  updateSearchUI(query) {}

  clearSearch() {
    this.handleSearch("");

    this.restoreHomePageLayout();
  }

  restoreHomePageLayout() {
    const categorySections = document.querySelectorAll(".category-section");
    categorySections.forEach((section) => {
      section.style.display = "block";
    });

    const latestNewsSection = document.querySelector(".latest-news-section");
    if (latestNewsSection) {
      latestNewsSection.style.display = "block";
    }

    const searchContainer = document.getElementById("searchResultsContainer");
    if (searchContainer) {
      searchContainer.style.display = "none";
    }
  }

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

  /**
   * 渲染侧边栏分类导航
   * 使用远程获取的分类顺序
   */
  async renderSidebarCategories() {
    const dropdownCategories = document.querySelector(".dropdown-categories");
    if (!dropdownCategories) {
      return;
    }

    
    dropdownCategories.innerHTML =
      '<div class="dropdown-item">Loading categories...</div>';

    try {
      
      const categoryOrder = await getCategoryOrder();

      
      const dropdownCategoriesHtml = categoryOrder
        .map((categoryConfig) => {
          
          const categoryName =
            typeof categoryConfig === "string"
              ? categoryConfig
              : categoryConfig.name;
          const categoryId = categoryName
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[&]/g, "");

          return `
            <a href="pages/category.html?type=${encodeURIComponent(
              categoryName
            )}" class="dropdown-item" data-category="${categoryId}">
              <span>${categoryName}</span>
            </a>
          `;
        })
        .join("");

      dropdownCategories.innerHTML = dropdownCategoriesHtml;

      this.bindDropdownCategoryEvents();
    } catch (error) {
      dropdownCategories.innerHTML =
        '<div class="dropdown-item">Failed to load categories</div>';
    }
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

  getCategoryIconByType(type) {
    const iconMap = {
      "Health Management":
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 14C19 16.7614 16.7614 19 14 19H10C7.23858 19 5 16.7614 5 14V10C5 7.23858 7.23858 5 10 5H14C16.7614 5 19 7.23858 19 10V14Z" stroke="currentColor" stroke-width="2"/><path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2"/></svg>',
      "Beauty & Wellness":
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/></svg>',
      "Emergency & Safety":
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.82 20H20.18A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z" stroke="currentColor" stroke-width="2"/></svg>',
      Lifestyle:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/><path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/></svg>',
      "Medical Care":
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 14C19 16.7614 16.7614 19 14 19H10C7.23858 19 5 16.7614 5 14V10C5 7.23858 7.23858 5 10 5H14C16.7614 5 19 7.23858 19 10V14Z" stroke="currentColor" stroke-width="2"/><path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2"/></svg>',
      Technology:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/></svg>',
      "Mental Health":
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="2"/></svg>',
      Nutrition:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/></svg>',
      Environment:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/></svg>',
    };

    return (
      iconMap[type] ||
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/></svg>'
    );
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
    
    
    if (this.currentCategory === "all" && this.useHomePageLayout) {
      this.renderHomePageLayout(articlesToRender);
    } else {
      this.renderTraditionalLayout(articlesToRender);
    }
  }

  async renderHomePageLayout(articlesToRender = null) {
    let articles;

    if (articlesToRender) {
      articles = articlesToRender;
    } else {
      articles = this.articles;
    }

    if (articles.length === 0) {
      this.showEmptyState();
      return;
    }

    if (articlesToRender && articlesToRender.length < this.articles.length) {
      this.renderSearchResults(articles);
    } else {
      
     
      const validArticles = articles.filter(
        (article) =>
          article &&
          article.id !== undefined &&
          article.title
      );
      
     
      const shuffledArticles = [...validArticles].sort(() => Math.random() - 0.5);
      
     
      this.renderCarouselContent(shuffledArticles.slice(0, 6));

     
      this.renderRandomArticles(validArticles);

     
      await this.renderAllCategories(validArticles);
    }

    this.bindArticleEvents();

    this.bindAllSeeMoreButtons();
  }

  renderSearchResults(articles) {
    const categorySections = document.querySelectorAll(".category-section");
    categorySections.forEach((section) => {
      section.style.display = "none";
    });

    const latestNewsSection = document.querySelector(".latest-news-section");
    if (latestNewsSection) {
      latestNewsSection.style.display = "none";
    }

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

    
    const validArticles = articles.filter(
      (article) =>
        article &&
        article.id !== undefined &&
        article.title
    );

    
    searchContainer.innerHTML = `
      <div class="category-news-list">
        ${validArticles
          .map((article) => this.createListCard(article))
          .join("")}
      </div>
    `;

    searchContainer.style.display = "block";
    
    
    this.bindArticleEvents();
  }

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

  createCarouselCard(article) {
    let description = this.getArticleDescription(article);
    const descriptionHTML = description 
      ? `<p class="article-description">${description}</p>`
      : "";

    return `
      <div class="carousel-item" data-id="${article.id}">
        <div class="article-image">
          <img src="${this.getArticleImage(
            article
          )}" alt="${
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
          ${article.source ? `<p class="article-source" style="margin: 5px 0; font-size: 12px; color: #666; font-style: italic;">Source: ${article.source}</p>` : ''}
          ${descriptionHTML}
          <div class="article-meta">
            <span class="article-type">${article.type}</span>
            <span class="article-time">${this.formatTime(
              article.create_time
            )}</span>
          </div>
        </div>
      </div>
    `;
  }

  createListCard(article) {
    let description = this.getArticleDescription(article);
    
    
    if (!description && article) {
 
    }
    
    
    if (!description && article.content) {
      if (typeof article.content === "string" && article.content.trim().length > 0) {
        description = article.content.replace(/<[^>]*>/g, "").trim().substring(0, 150);
        if (description.length === 150) description += "...";
        
      }
    }
    
    
    const descriptionHTML = description 
      ? `<p class="article-description">${description}</p>`
      : "";

    return `
      <div class="article-card" data-id="${article.id}">
        <div class="article-image">
          <img src="${this.getArticleImage(
            article
          )}" alt="${
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
          ${article.source ? `<p class="article-source" style="margin: 5px 0; font-size: 12px; color: #666; font-style: italic;">Source: ${article.source}</p>` : ''}
          ${descriptionHTML}
          <div class="article-meta">
            <span class="article-type">${article.type}</span>
            <span class="article-time">${this.formatTime(
              article.create_time
            )}</span>
          </div>
        </div>
      </div>
    `;
  }

  createGridCard(article) {
    let description = this.getArticleDescription(article);
    const descriptionHTML = description 
      ? `<p class="article-description">${description}</p>`
      : "";

    return `
      <div class="article-card" data-id="${article.id}">
        <div class="article-image">
          <img src="${this.getArticleImage(
            article
          )}" alt="${
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
          ${article.source ? `<p class="article-source" style="margin: 5px 0; font-size: 12px; color: #666; font-style: italic;">Source: ${article.source}</p>` : ''}
          ${descriptionHTML}
          <div class="article-meta">
            <span class="article-type">${article.type}</span>
            <span class="article-time">${this.formatTime(
              article.create_time
            )}</span>
          </div>
        </div>
      </div>
    `;
  }


  

  createListCardTemplate(article) {
 
    
    let description = this.getArticleDescription(article);
    
    
    const descriptionHTML = description 
      ? `<p class="article-description">${description}</p>`
      : "";

    return `
      <div class="article-card" data-id="${article.id}">
        <div class="article-image">
          <img src="${this.getArticleImage(
          article
        )}" alt="${article.title}">
        </div>
        <div class="article-content">
          <h3 class="article-title">${article.title}</h3>
          ${article.source ? `<p class="article-source" style="margin: 5px 0; font-size: 12px; color: #666; font-style: italic;">Source: ${article.source}</p>` : ''}
          ${descriptionHTML}
        </div>
      </div>
    `;
  }

  /**
   * 生成网格卡片的HTML模板
   * @param {Object} article - 文章对象
   * @returns {string} HTML模板字符串
   */
  createGridCardTemplate(article) {
    let description = this.getArticleDescription(article);
    const descriptionHTML = description 
      ? `<p class="article-description">${description}</p>`
      : "";

    return `
      <div class="grid-card" data-id="${article.id}">
        <div class="article-image">
          <img src="${this.getArticleImage(
            article
          )}" alt="${article.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
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
          ${descriptionHTML}
        </div>
      </div>
    `;
  }

  /**
   * 渲染分类列表（列表布局）
   * @param {string} containerId - 容器ID
   * @param {Array} articles - 文章数组
   * @param {number} count - 显示的文章数量
   */
  renderCategoryList(containerId, articles, count) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!articles || articles.length === 0) {
      return;
    }

    
    const validArticles = articles.filter(
      (article) =>
        article &&
        article.id !== undefined &&
        article.title
    );

    if (validArticles.length === 0) {
      return;
    }

    const articlesToRender = validArticles.slice(0, count);

    
    const cardsHTML = articlesToRender
      .map((article) => this.createListCardTemplate(article))
      .join("");

    container.innerHTML = cardsHTML;
  }

  /**
   * 渲染分类网格（网格布局）
   * @param {string} containerId - 容器ID
   * @param {Array} articles - 文章数组
   * @param {number} count - 显示的文章数量
   */
  renderCategoryGrid(containerId, articles, count) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!articles || articles.length === 0) {
      return;
    }

    
    const validArticles = articles.filter(
      (article) =>
        article &&
        article.id !== undefined &&
        article.title
    );

    if (validArticles.length === 0) {
      return;
    }

    const articlesToRender = validArticles.slice(0, count);

    
    const cardsHTML = articlesToRender
      .map((article) => this.createGridCardTemplate(article))
      .join("");

    container.innerHTML = cardsHTML;
  }

  renderCarouselContent(articles) {
    const container = document.getElementById("latestNewsCarousel");
    if (!container) return;

    container.innerHTML = ""; 

    
    const validArticles = articles.filter(
      (article) =>
        article &&
        article.id !== undefined &&
        article.title
    );

    if (validArticles.length === 0) {
      
      return;
    }

    validArticles.forEach((article) => {
      const item = document.createElement("div");
      item.className = "carousel-item";
      item.setAttribute("data-id", article.id);

      let description = this.getArticleDescription(article);
      const descriptionHTML = description 
        ? `<p class="article-description">${description}</p>`
        : "";

      item.innerHTML = `
        <img src="${this.getArticleImage(
          article
        )}" alt="${article.title}">
        <div class="article-content">
          <h3 class="article-title">${article.title}</h3>
          ${descriptionHTML}
        </div>
      `;
      container.appendChild(item);
    });
  }

  renderRandomArticles(articles) {
    const container = document.getElementById("randomArticlesContainer");
    if (!container) return;

    if (!articles || articles.length === 0) {
      return;
    }

    
    const validArticles = articles.filter(
      (article) =>
        article &&
        article.id !== undefined &&
        article.title
    );

    if (validArticles.length === 0) {
      return;
    }

    
    const shuffledArticles = [...validArticles].sort(() => Math.random() - 0.5);
    
    
    const selectedArticles = shuffledArticles.slice(0, 3);

    
    container.innerHTML = `
      <div class="random-articles-section">
        <ul class="random-articles-list">
          ${selectedArticles.map(article => `
            <li class="random-article-item" data-id="${article.id}" style="margin-top: 20px; display: flex; align-items: flex-start; gap: 8px;">
              <svg t="1781089047685" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1508" width="16" height="16" style="flex-shrink: 0; margin-top: 2px;">
                <path d="M775.601591 676.781609a413.180077 413.180077 0 0 1-67.43295 227.065134 406.314176 406.314176 0 0 1-107.402299 112.061303 501.455939 501.455939 0 0 1-88.521073 7.846743A512.245211 512.245211 0 0 1 0.245269 512c0-17.655172 0-35.065134 2.697318-52.229885a416.858238 416.858238 0 0 1 566.681993-142.222222 413.915709 413.915709 0 0 1 93.425287 74.789272 407.295019 407.295019 0 0 1 45.854406 58.360153 414.896552 414.896552 0 0 1 66.697318 226.084291z" fill="var(--color-primary)" p-id="1509"></path>
                <path d="M512.000059 1024a512 512 0 1 1 512-512 512.490421 512.490421 0 0 1-512 512z m0-950.191571a438.436782 438.436782 0 1 0 438.436781 438.191571A438.681992 438.681992 0 0 0 512.000059 73.808429z" fill="#000000" p-id="1510"></path>
                <path d="M229.026879 677.02682a36.045977 36.045977 0 0 1-25.992338-10.789272 36.536398 36.536398 0 0 1 0-51.984674l204.505748-204.505748a36.781609 36.781609 0 0 1 52.229885 0l92.444444 92.444445 177.777778-178.022989a37.02682 37.02682 0 0 1 51.984674 0 36.536398 36.536398 0 0 1 0 51.984675l-203.770115 204.015325a38.252874 38.252874 0 0 1-52.229885 0l-92.444444-92.444444-178.51341 178.51341a36.045977 36.045977 0 0 1-25.992337 10.789272z" fill="#000000" p-id="1511"></path>
                <path d="M779.770174 537.501916a36.781609 36.781609 0 0 1-35.800767-36.291188V363.157088h-137.808429a36.781609 36.781609 0 0 1 0-73.563218h174.590039a36.781609 36.781609 0 0 1 36.781609 36.781609v174.835249a36.781609 36.781609 0 0 1-37.762452 36.291188z" fill="#000000" p-id="1512"></path>
              </svg>
              <span style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; flex: 1;">${article.title}</span>
            </li>
          `).join("")}
        </ul>
      </div>
    `;
  }

  renderAiAnalyticsContent(articles) {
    const aiAnalyticsContainer = document.getElementById(
      "aiAnalyticsContainer"
    );
    if (!aiAnalyticsContainer) return;

    aiAnalyticsContainer.innerHTML = "";

    articles.forEach((article) => {
      const aiCard = document.createElement("div");
      aiCard.className = "ai-card";
      aiCard.setAttribute("data-id", article.id);

      aiCard.innerHTML = `
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
        <div class="article-content">
          <h3 class="article-title">${article.title}</h3>
          <div class="article-meta">
            <span class="article-type">${article.type}</span>
            <span class="article-time">${this.formatTime(
              article.create_time
            )}</span>
          </div>
        </div>
      `;

      aiAnalyticsContainer.appendChild(aiCard);
    });
  }

  /**
   * 生成分类内容的HTML模板（不包括section标签）
   * @param {string} category - 分类名称
   * @param {string} containerClass - 容器的CSS类名
   * @param {string} containerId - 容器的ID
   * @returns {string} HTML模板字符串
   */
  createCategoryContentTemplate(category, containerClass, containerId) {
    return `
      <h2 class="section-title"><svg t="1780651232174" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4028" width="20" height="20"><path d="M622.509305 768.887348a374.461005 374.461005 0 0 1-50.578856 188.561525 360.263432 360.263432 0 0 1-49.025996 66.551127H165.74674a88.734835 88.734835 0 0 1-88.734835-88.734835V431.916811a345.17851 345.17851 0 0 1 66.551127-25.954939 372.464471 372.464471 0 0 1 102.488734-14.197574 377.12305 377.12305 0 0 1 376.457539 377.12305z" fill="var(--color-primary)" p-id="4029"></path><path d="M796.429583 1024H165.74674a88.734835 88.734835 0 0 1-88.734835-88.734835V137.317158a88.734835 88.734835 0 0 1 88.734835-88.734836h384.887349a33.275563 33.275563 0 1 1 0 66.551127H165.74674a22.183709 22.183709 0 0 0-22.183708 22.183709v797.282495a22.183709 22.183709 0 0 0 22.183708 22.183709h630.682843a22.183709 22.183709 0 0 0 22.183709-22.183709V410.842288a33.275563 33.275563 0 0 1 66.551126 0v523.757365a88.734835 88.734835 0 0 1-88.734835 89.400347z" fill="#000000" p-id="4030"></path><path d="M835.916584 791.071057h-709.878682a33.275563 33.275563 0 0 1 0-66.551126h709.878682a33.275563 33.275563 0 1 1 0 66.551126zM374.717278 608.720971a33.053726 33.053726 0 0 1-33.275564-35.272098l6.433276-103.154246a33.941075 33.941075 0 0 1 9.760832-22.183708L795.985908 9.760832a33.275563 33.275563 0 0 1 23.514732-9.760832 33.275563 33.275563 0 0 1 23.514731 9.760832l94.058926 94.058925a33.053726 33.053726 0 0 1 0 47.029463L498.72421 589.199307a32.610052 32.610052 0 0 1-20.630849 9.538995l-100.492201 9.09532z m38.82149-121.566725l-3.327556 51.909879 50.135182-4.658579L866.530103 128.221837 819.50064 81.192374z" fill="#000000" p-id="4031"></path></svg> ${category.toUpperCase()}</h2>
      <div class="${containerClass}" id="${containerId}"></div>
      <div class="see-more-container">
        <button class="see-more-btn" data-category="${category}">
          See More
        </button>
      </div>
    `;
  }

  /**
   * 渲染所有分类部分
   * @param {Array} articles - 文章数组
   */
  async renderAllCategories(articles) {
    
    const categorySections = document.querySelectorAll(".category-section");
    if (!categorySections || categorySections.length === 0) return;

    
    const categoryOrder = await getCategoryOrder();

    
    let sectionIndex = 0;
    categoryOrder.forEach((categoryConfig) => {
      
      if (sectionIndex >= categorySections.length) return;

      
      const category =
        typeof categoryConfig === "string"
          ? categoryConfig
          : categoryConfig.name;
      const layout =
        typeof categoryConfig === "object" && categoryConfig.layout
          ? categoryConfig.layout
          : "list";

      
      const categoryArticles = articles.filter(
        (article) =>
          article &&
          article.type === category &&
          article.id !== undefined &&
          article.title
      );

      
      if (categoryArticles.length === 0) return;

      
      const shuffledArticles = [...categoryArticles].sort(() => Math.random() - 0.5);

      
      const useGridLayout = layout === "grid";
      const containerId =
        category.toLowerCase().replace(/\s+/g, "").replace(/[&]/g, "") +
        (useGridLayout ? "Grid" : "List");
      const containerClass = useGridLayout
        ? "category-grid"
        : "category-news-list";

      
      const currentSection = categorySections[sectionIndex];
      const contentHTML = this.createCategoryContentTemplate(
        category,
        containerClass,
        containerId
      );

      
      currentSection.innerHTML = contentHTML;

      
      let articleCount = 3;
      if (useGridLayout) {
        articleCount = 4;
      }
      
      
      if (sectionIndex === 3) {
        articleCount = 6;
      } else if (sectionIndex === 4) {
        articleCount = 8;
      } else if (sectionIndex === 5) {
        articleCount = 6;
      } else if (sectionIndex === 6) {
        articleCount = 8;
      }

      
      if (useGridLayout) {
        this.renderCategoryGrid(containerId, shuffledArticles, articleCount);
      } else {
        this.renderCategoryList(containerId, shuffledArticles, articleCount);
      }

      sectionIndex++;
    });

    
    for (let i = sectionIndex; i < categorySections.length; i++) {
      categorySections[i].style.display = "none";
    }
  }

  bindAllSeeMoreButtons() {
    const seeMoreButtons = document.querySelectorAll(".see-more-btn");

    seeMoreButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const category = e.currentTarget.dataset.category;

        if (category) {
          const categoryUrl =
            `pages/category.html?type=${encodeURIComponent(category)}` +
            (window.channel ? `&channel=${window.channel}` : "");
          window.location.href = categoryUrl;
        }
      });
    });
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(
      ".article-card, .carousel-item, .ai-card, .grid-card, .search-result-item, .random-article-item"
    );

    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;

        if (articleId) {
          const detailUrl =
          `/detail.html?id=${articleId}` +
          (window.channel ? `&channel=${window.channel}` : "");
        window.location.href = detailUrl;
        }
      });
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

  getArticleImage(article) {
    if (article.img) {
     
      if (
        article.img.startsWith("http://") ||
        article.img.startsWith("https://")
      ) {
        return article.img;
      }
     
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23ddd' width='300' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23ddd' width='300' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
  }

  getArticleDescription(article) {
    if (!article) {
      return "";
    }

    
    if (article.section) {
      return article.section.length > 150
        ? article.section.substring(0, 150) + "..."
        : article.section;
    }

    
    if (article.content && Array.isArray(article.content)) {
      const firstContent = article.content[0];
      if (typeof firstContent === "string") {
        const textContent = firstContent.replace(/<[^>]*>/g, "").trim();
        if (textContent.length > 0) {
          return textContent.length > 150
            ? textContent.substring(0, 150) + "..."
            : textContent;
        }
      }
      
      else if (firstContent && typeof firstContent === "object") {
        const textFields = ["text", "content", "value", "body", "paragraph"];
        for (const field of textFields) {
          if (firstContent[field] && typeof firstContent[field] === "string") {
            const textContent = firstContent[field].replace(/<[^>]*>/g, "").trim();
            if (textContent.length > 0) {
              return textContent.length > 150
                ? textContent.substring(0, 150) + "..."
                : textContent;
            }
          }
        }
      }
    }
    
    else if (article.content && typeof article.content === "string") {
      const textContent = article.content.replace(/<[^>]*>/g, "").trim();
      if (textContent.length > 0) {
        return textContent.length > 150
          ? textContent.substring(0, 150) + "..."
          : textContent;
      }
    }

    
    return "";
  }

  /**
   * 获取推荐文章
   * @param {number|string} currentId - 当前文章ID
   * @param {number} count - 推荐文章数量
   * @returns {Array} 推荐文章数组
   */
  getRecommendedArticles(currentId, count = 3) {
    if (!this.articles || this.articles.length === 0) {
      return [];
    }

    
    const currentArticle = this.articles.find(
      (article) => article.id == currentId
    );

    let recommendedArticles = [];

    if (currentArticle && currentArticle.type) {
      
      recommendedArticles = this.articles.filter(
        (article) =>
          article.id != currentId && article.type === currentArticle.type
      );

      
      if (recommendedArticles.length < count) {
        const otherArticles = this.articles.filter(
          (article) =>
            article.id != currentId && article.type !== currentArticle.type
        );
        recommendedArticles = [...recommendedArticles, ...otherArticles];
      }
    } else {
      
      recommendedArticles = this.articles.filter(
        (article) => article.id != currentId
      );
    }

    
    const shuffled = recommendedArticles.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  bindRecommendedEvents() {
    const recommendedCards = document.querySelectorAll(".recommended-card");
    recommendedCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        window.location.href =
          `/detail.html?id=${articleId}` +
          (window.channel ? `&channel=${window.channel}` : "");
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
      const headerRightButtons = document.querySelector(
        ".header-right-buttons"
      );
      if (
        !headerSearchContainer.contains(e.target) &&
        (!headerRightButtons || !headerRightButtons.contains(e.target)) &&
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
    const main = document.querySelector("main");

    if (headerSearchContainer && headerSearchInput) {
      headerSearchContainer.style.display = "block";
      headerSearchInput.focus();

      
      if (main) {
        const searchContainerHeight = headerSearchContainer.offsetHeight || 60;
        main.style.paddingTop = `${searchContainerHeight}px`;
      }

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
    const main = document.querySelector("main");

    if (headerSearchContainer && headerSearchInput) {
      headerSearchInput.value = "";
      this.handleSearch("");

      headerSearchContainer.style.display = "none";
      
      
      if (main) {
        main.style.paddingTop = "";
      }
    }
  }
}


window.HealthNewsApp = HealthNewsApp;
export { HealthNewsApp };

// 实例化HealthNewsApp用于首页
document.addEventListener("DOMContentLoaded", async () => {
 
  handleChannelParameter();
  
 
  window.healthNewsApp = new HealthNewsApp({ useHomePageLayout: true });
  
 
  await new Promise(resolve => {
    const checkData = () => {
      if (window.healthNewsApp.articles?.length > 0) {
        resolve();
      } else {
        setTimeout(checkData, 50);
      }
    };
    checkData();
  });
  
 
  await window.healthNewsApp.initHomePage();
  
 
  if (window.themeApplier) {
    window.themeApplier.init();
  }
});
