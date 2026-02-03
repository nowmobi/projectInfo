
import { getCategoryOrder, getArticlesData, Category_URL, decodeUnicode, formatTime } from "./BaseURL.js";

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("channel")) {
  window.channel = urlParams.get("channel");
}

class HealthNewsApp {
  constructor() {
    this.currentCategory = "all";
    this.articles = [];
    this.categories = [];
    this.allowedCategories = [];
    this.themeManager = null;
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.initSidebar();
    this.renderCategories();
    this.renderArticles();
    this.initThemeManager();
  }

 
  initThemeManager() {
   
    setTimeout(() => {
     
      if (typeof ThemeApplier !== "undefined") {
        this.themeManager = window.themeApplier || new ThemeApplier();
        if (!window.themeApplier) {
          window.themeApplier = this.themeManager;
          this.themeManager.init();
        }
      }
    }, 100);
  }

  async loadData() {
    try {
      
      const data = await getArticlesData();
      
      
      let articles = Array.isArray(data) ? data : [];
      
      
      articles = articles.filter(item => {
        
        if (item && typeof item === 'object' && 'info1' in item) {
          return false;
        }
        
        return item && item.id && item.title;
      });
      
      
      articles = articles.map(article => {
        if (article.create_time && article.create_time > 1000000000000) {
          article.create_time = Math.floor(article.create_time / 1000);
        }
        return article;
      });
      
      this.articles = articles || [];

      
      await this.generateCategoriesFromArticles();

      
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

  async generateCategoriesFromArticles() {
   
    const typeSet = new Set();
    this.articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });

   
    const categoryOrder = await getCategoryOrder();

   
    this.allowedCategories = categoryOrder;

   
    const orderedCategories = categoryOrder.filter((type) => typeSet.has(type));

   
    this.categories = [
      {
        id: "all",
        name: "Suggest",
        icon: "",
      },
      ...orderedCategories.map((type) => ({
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

   
    window.addEventListener(
      "scroll",
      Utils.throttle(() => this.handleScroll(), 100)
    );
  }

 
  bindCategoryEvents() {
    const categoryButtons = document.querySelectorAll(".category-btn");

    categoryButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const category = e.currentTarget.dataset.category;
        this.switchCategory(category);
      });
    });
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.renderArticles();
      this.hideSearchResults();
      return;
    }

    const filteredArticles = this.articles.filter((article) => {
     
      if (
        this.allowedCategories.length > 0 &&
        !this.allowedCategories.includes(article.type)
      ) {
        return false;
      }

      const searchTerm = query.toLowerCase();
      const title = (article.title || "").toLowerCase();
      const type = (article.type || "").toLowerCase();
      const section = (article.section || "").toLowerCase();

      return (
        title.includes(searchTerm) ||
        type.includes(searchTerm) ||
        section.includes(searchTerm)
      );
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
    
    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
      emptyState.classList.add("dsn");
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
    this.currentCategory = category;

   
    const categoryButtons = document.querySelectorAll(".category-btn");

   
    categoryButtons.forEach((btn) => {
      btn.classList.remove("active");
     
      btn.style.removeProperty("background-color");
      btn.style.removeProperty("color");
    });

   
    categoryButtons.forEach((btn) => {
      if (btn.dataset.category === category) {
        btn.classList.add("active");
      }
    });

   
    setTimeout(() => {
      if (window.themeApplier) {
        window.themeApplier.reapplyTheme();
      } else if (this.themeManager) {
        this.themeManager.reapplyTheme();
      }
    }, 10);

   
    this.renderArticles();
  }

  renderCategories() {
   
    const categoryContainer = document.querySelector(".category-container");
    if (categoryContainer) {
      const categoryButtonsHtml = this.categories
        .map(
          (category) => `
        <button class="category-btn ${
          category.id === "all" ? "active" : ""
        }" data-category="${category.id}">
           <span class="category-name">${category.name}</span>
         </button>
      `
        )
        .join("");

      categoryContainer.innerHTML = categoryButtonsHtml;

     
      this.bindCategoryEvents();
    }
  }



  renderArticles(articlesToRender = null) {
    const articlesContainer = document.querySelector(".articles-container");
    if (!articlesContainer) return;

    let articles;

    if (articlesToRender) {
     
      articles = articlesToRender;
    } else if (this.currentCategory === "all") {
     
      articles = this.getTopArticlesByCategory(2);
    } else {
     
      articles = this.articles.filter((article) => {
       
        const articleTypeId = article.type
          ? article.type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "")
          : "";
        return articleTypeId === this.currentCategory;
      });
    }

   
    let homeArticleItems = document.querySelectorAll(".home_article-item");
    const articlesGrid = document.querySelector(".articles-grid");

   
    if (!articlesGrid) {
      return;
    }

   
    homeArticleItems.forEach((item) => {
      item.innerHTML = "";
    });

   
    articles.forEach((article, index) => {
     
      if (index >= homeArticleItems.length) {
        const newContainer = document.createElement("div");
        newContainer.className = "home_article-item";
        articlesGrid.appendChild(newContainer);
       
        homeArticleItems = document.querySelectorAll(".home_article-item");
      }

     
      const articleHTML = `
        <div class="article-card" data-id="${article.id}">
          <div class="article-image">
            <img src="${this.getArticleImage(article)}" alt="${
        article.title
      }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, var(--primary-background, #e90a60) 0%, var(--theme-primary-dark, #ba084d) 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
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
              <span class="article-type">${
                (() => {
                  const typeText = decodeUnicode(article.type);
                  return typeText.length > 18 ? typeText.substring(0, 18) + "..." : typeText;
                })()
              }</span>
              <span class="article-time">${formatTime(
                article.create_time
              )}</span>
            </div>
          </div>
        </div>
      `;

     
      homeArticleItems[index].innerHTML = articleHTML;
    });

   
    this.bindArticleEvents();

   
    this.applyThemeToNewElements();
  }

 
  applyThemeToNewElements() {
    if (this.themeManager) {
     
      setTimeout(() => {
        this.themeManager.reapplyTheme();
      }, 50);
    }
  }

 
  getTopArticlesByCategory(limit = 2) {
    const topArticles = [];
   
    const orderedCategories = this.categories.filter((cat) => cat.id !== "all");

    orderedCategories.forEach((category) => {
      const categoryArticles = this.articles
        .filter((article) => {
          const articleTypeId = article.type
            ? article.type
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[&]/g, "")
            : "";
          return articleTypeId === category.id;
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);

      topArticles.push(...categoryArticles);
    });

   
    if (topArticles.length === 0 && this.articles.length > 0) {
      return this.articles.sort(() => Math.random() - 0.5).slice(0, limit * orderedCategories.length || 10);
    }
   
    return topArticles.sort(() => Math.random() - 0.5);
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(".article-card");

    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;

       
        if (articleId) {
          const detailUrl =
            `detail.html?id=${articleId}` +
            (window.channel ? "&channel=" + window.channel : "");
          window.location.href = detailUrl;
        }
      });
    });
  }


  handleScroll() {
   
    if (!this._headerElement) {
      this._headerElement = document.querySelector(".header");
      this._searchBarElement = document.querySelector(".search-bar");
    }

    if (!this._headerElement || !this._searchBarElement) return;

    const scrollY = window.scrollY;
    if (scrollY > 100) {
      this._headerElement.classList.add("hidden");
      this._searchBarElement.classList.add("fixed");
    } else {
      this._headerElement.classList.remove("hidden");
      this._searchBarElement.classList.remove("fixed");
    }
  }

 
  getRecommendedArticles(currentId, limit = 3) {
   
    const validArticles = this.articles.filter((article) => {
     
      const articleId = article.id;
      return (
        articleId !== undefined &&
        articleId !== null &&
        articleId !== "" &&
        String(articleId).trim() !== "" &&
        articleId !== currentId
      );
    });

   
    return validArticles
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

 

 
  getArticleImage(article) {
    if (article.img) {
     
     
      return article.img;
    }
   
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
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
}




document.addEventListener("DOMContentLoaded", () => {
  window.healthNewsApp = new HealthNewsApp();
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


class BackToTop {
  constructor() {
    this.backToTopBtn = document.getElementById("backToTopBtn");
    this.init();
  }

  init() {
    if (!this.backToTopBtn) return;

    this.bindEvents();
    this.handleScroll();
  }

  bindEvents() {
   
    this.backToTopBtn.addEventListener("click", () => {
      this.scrollToTop();
    });

   
    window.addEventListener(
      "scroll",
      Utils.throttle(() => {
        this.handleScroll();
      }, 100)
    );
  }

  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const showThreshold = 300;

    if (scrollTop > showThreshold) {
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


async function loadSidebarCategories() {
  const sidebarCategories = document.querySelector(".sidebar-category");
  if (!sidebarCategories) {
    return;
  }

  try {
   
    const categoryOrder = await getCategoryOrder();

   
    const currentPath = window.location.pathname;
    const isInPagesFolder = currentPath.includes("/pages/");
    const categoryPath = isInPagesFolder
      ? "category.html"
      : "pages/category.html";

   
    const categoriesHtml = categoryOrder
      .map((categoryName) => {
        const encodedName = encodeURIComponent(categoryName);
        return `
          <a
            href="${categoryPath}?type=${encodedName}"
            class="sidebar-item"
            data-page="${categoryName
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[&]/g, "")}"
          >
            <span>${categoryName}</span>
          </a>
        `;
      })
      .join("");

   
    sidebarCategories.innerHTML = categoriesHtml;
  } catch (error) {
   
  }
}



class BasePage {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
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
   
    window.location.href =
      "../index.html" +
      (window.channel ? "?channel=" + window.channel : "");
  }
}


class PrivacyPage extends BasePage {}


class AboutPage extends BasePage {}


async function initPage() {
  const currentPath = window.location.pathname;
  const isPrivacyPage = currentPath.includes("privacy.html");
  const isAboutPage = currentPath.includes("about.html");

 
  if (
    typeof ThemeApplier !== "undefined" &&
    typeof ThemeColors !== "undefined"
  ) {
    if (!window.themeApplier) {
      window.themeApplier = new ThemeApplier();
      window.themeApplier.init();
    }
  }

 
  if (typeof loadSidebarCategories !== "undefined") {
    await loadSidebarCategories();
  }

 
  if (isPrivacyPage) {
    new PrivacyPage();
  } else if (isAboutPage) {
    new AboutPage();
  }

 
  if (typeof BackToTop !== "undefined") {
    new BackToTop();
  }
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initPage();
  });
} else {
  initPage();
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

window.Utils = Utils;
window.BackToTop = BackToTop;
window.HealthNewsApp = HealthNewsApp;
window.loadSidebarCategories = loadSidebarCategories;
window.PrivacyPage = PrivacyPage;
window.AboutPage = AboutPage;
