
import { getCategoryOrder, Category_URL, IMG_BASE_URL } from "./BaseURL.js";

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("channel")) {
  window.channel = urlParams.get("channel");
}

class HealthNewsApp {
  constructor() {
    this.currentCategory = "all";
    this.articles = [];
    this.categories = [];
    this.categoryOrder = null; 
    this.init();
  }

  async init() {
    
    await this.loadCategoryOrder();
    await this.loadData();
    this.setupEventListeners();
    this.initSidebar();
    this.renderCategories();
    this.renderArticles();
  }

  async loadCategoryOrder() {
    try {
      this.categoryOrder = await getCategoryOrder();
    } catch (error) {
      console.error("Error loading category order:", error);
      
      this.categoryOrder = [
        "Mental Health",
        "Medical Care",
        "Lifestyle",
        "Emergency & Safety",
        "Beauty & Wellness",
        "Health Management",
      ];
    }
  }

  async loadData() {
    try {
      
      const response = await fetch(Category_URL, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.articles = data || [];

      this.generateCategoriesFromArticles();

      this.hideLoading();
      this.renderArticles();
    } catch (error) {
      console.error("Error loading data:", error);

      this.articles = [];
      this.categories = [];

      this.hideLoading();
      this.showEmptyState();
    }
  }

  showEmptyState() {
    const emptyState = document.getElementById("emptyState");
    if (emptyState) {
      emptyState.classList.remove("dsn");
    }
  }

  hideLoading() {
    
  }

  generateCategoriesFromArticles() {
    const typeSet = new Set();
    this.articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });
    
    const categoryOrder = this.categoryOrder || [
      "Mental Health",
      "Medical Care",
      "Lifestyle",
      "Emergency & Safety",
      "Beauty & Wellness",
      "Health Management",
    ];

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

  }

  bindCategoryEvents() {
    const categoryContainer = document.querySelector(".category-container");

    if (!categoryContainer) return;

    
    if (this._categoryClickHandler) {
      categoryContainer.removeEventListener(
        "click",
        this._categoryClickHandler
      );
    }

    
    this._categoryClickHandler = (e) => {
      const btn = e.target.closest(".category-btn");
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const category = btn.dataset.category;
      if (!category) return;

      
      this.switchCategory(category);
    };

    categoryContainer.addEventListener("click", this._categoryClickHandler);
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

      
      const isInAllowedCategory =
        this.categoryOrder && article.type
          ? this.categoryOrder.includes(article.type)
          : false;

      
      return (
        isInAllowedCategory &&
        (title.includes(searchTerm) ||
          type.includes(searchTerm) ||
          section.includes(searchTerm))
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
    const emptyState = document.getElementById("emptyState");

    if (searchInput) {
      searchInput.value = "";
      this.updateSearchUI("");
      this.handleSearch("");
    }

    
    if (emptyState) {
      emptyState.classList.add("dsn");
    }
  }

  switchCategory(category) {
    this.currentCategory = category;

    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.category === category) {
        btn.classList.add("active");
      }
    });

    document.querySelectorAll(".sidebar-category").forEach((cat) => {
      cat.classList.remove("active");
      if (cat.dataset.category === category) {
        cat.classList.add("active");
      }
    });

    if (window.themeApplier) {
      setTimeout(() => {
        window.themeApplier.applyTheme();
      }, 10);
    }

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

    let homeArticleItems = document.querySelectorAll(".home_article-item");
    if (!articlesContainer) return;

    homeArticleItems.forEach((item) => {
      if (item && typeof item.innerHTML !== "undefined") {
        item.innerHTML = "";
      }
    });

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

    const articlesGrid = document.getElementById("articlesGrid");
    const isHomePage = !window.location.pathname.includes("/pages/");
    if (!articlesGrid) {
      if (isHomePage) {
        console.warn("Articles grid container not found on home page");
      }
      return;
    }

    articles.forEach((article, index) => {
      if (index >= homeArticleItems.length) {
        const newContainer = document.createElement("div");
        newContainer.className = "home_article-item";
        articlesGrid.appendChild(newContainer);

        homeArticleItems = document.querySelectorAll(".home_article-item");
      }

      const detailHref =
        `detail.html?id=${article.id}` +
        (window.channel ? `&channel=${window.channel}` : "");
      
      const imgUrl = this.getArticleImage(article);
      const articleHTML = `
        <a class="article-card" href="${detailHref}">
          <div class="article-image">
            <img src="${imgUrl}" alt="${
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
              <span class="article-type">${Utils.decodeUnicode(
                article.type
              )}</span>
              <span class="article-time">${Utils.formatTime(
                article.create_time
              )}</span>
            </div>
          </div>
        </a>
      `;

      if (homeArticleItems[index]) {
        homeArticleItems[index].innerHTML = articleHTML;
      } else {
        console.error(`Container at index ${index} not found`);
      }
    });

    
    const emptyState = document.getElementById("emptyState");
    if (emptyState && articles && articles.length > 0) {
      emptyState.classList.add("dsn");
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

    return topArticles.sort(() => Math.random() - 0.5);
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
        
        const hasValidId = article.id != null && article.id !== "" && String(article.id).trim() !== "";
        
        const isNotCurrent = String(article.id) !== String(currentId);
        return hasValidId && isNotCurrent;
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

    recommendedContainer.innerHTML = recommended
      .map((article) => {
        const detailHref =
          `detail.html?id=${article.id}` +
          (window.channel ? `&channel=${window.channel}` : "");
        return `
      <a class="recommended-card" href="${detailHref}">
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
          <h4 class="recommended-card-title">${article.title}</h4>
          <p class="recommended-summary">${
            article.summary ? article.summary.substring(0, 60) + "..." : ""
          }</p>
          ${
            !article.summary
              ? `<span class="recommended-type-tag">${
                  Utils.decodeUnicode(article.type) || "Unknown Type"
                }</span>`
              : ""
          }
        </div>
      </a>
    `;
      })
      .join("");
  }

  getArticleImage(article) {
    if (!article.img || !article.id) {
      return "";
    }
    
    // 使用图片的原始格式，因为远程服务器现在使用jpg格式
    return IMG_BASE_URL.replace("/number/", `/${article.id}/`).replace(
      "number.png",
      article.img
    );
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


export { HealthNewsApp };


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
  },

  formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  },
};

window.Utils = Utils;


async function initSidebarCategories() {
  try {
    
    
    const { getCategoryOrder } = await import("./BaseURL.js");

    
    let categoryOrder;
    try {
      categoryOrder = await getCategoryOrder();
    } catch (error) {
      console.error("Error loading category order:", error);
      
      categoryOrder = [
        "Mental Health",
        "Medical Care",
        "Lifestyle",
        "Emergency & Safety",
        "Beauty & Wellness",
        "Health Management",
      ];
    }

    
    const sidebarCategories = document.querySelectorAll(".sidebar-category");

    if (sidebarCategories.length === 0) {
      return;
    }

    
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const categoryUrlPrefix = isInPagesFolder
      ? "category.html"
      : "pages/category.html";

    
    const categoriesHTML = categoryOrder
      .map((categoryName) => {
        const categoryId = categoryName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[&]/g, "");
        const encodedType = encodeURIComponent(categoryName);

        return `
            <a
              href="${categoryUrlPrefix}?type=${encodedType}"
              class="sidebar-item"
              data-page="${categoryId}"
            >
              <span>${categoryName}</span>
            </a>`;
      })
      .join("");

    
    sidebarCategories.forEach((container) => {
      container.innerHTML = categoriesHTML;
    });
  } catch (error) {
    console.error("Error initializing sidebar categories:", error);
  }
}


window.initSidebarCategories = initSidebarCategories;


document.addEventListener("DOMContentLoaded", () => {
  initSidebarCategories();
});


class CommonPage {
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
    
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const basePath = isInPagesFolder ? "../index.html" : "index.html";

    
    window.location.href =
      basePath + (window.channel ? "?channel=" + window.channel : "");
  }
}


export { CommonPage };


function handleChannelParameter() {
  if (window.channel) {
    const links = document.querySelectorAll("a");
    links.forEach((link) => {
      if (link.href && !link.href.includes("channel=")) {
        try {
          const url = new URL(link.href);
          url.searchParams.set("channel", window.channel);
          link.href = url.toString();
        } catch (e) {
          
          console.warn("Failed to parse URL:", link.href);
        }
      }
    });
  }
}


document.addEventListener("DOMContentLoaded", () => {
  
  handleChannelParameter();

  
  if (window.themeApplier) {
    window.themeApplier.init();
    setTimeout(() => {
      window.themeApplier.applyTheme();
    }, 100);
  }

  
  
  if (
    document.getElementById("smartBackButton") ||
    document.getElementById("sidebarToggle")
  ) {
    
    if (!window.commonPage && !window.healthNewsApp) {
      window.commonPage = new CommonPage();
    }
  }
});
