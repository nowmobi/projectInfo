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
    return function executedFunction(...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  },

  formatTime(timestamp) {
    
    const date = new Date(timestamp.toString().length === 13 ? timestamp : timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  },

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
  },

  getArticleImage(article) {
    if (article && article.img) {
      let imgUrl = article.img;
      
      
      if (/^https?:\/\//i.test(imgUrl)) {
        
        return imgUrl;
      }
      
      
      if (imgUrl.startsWith("/")) {
        return `${RemoteDataConfig.baseUrl}${imgUrl}`;
      }
      if (article.id) {
        return `${RemoteDataConfig.baseUrl}/${article.id}/${imgUrl}`;
      }
      return `${RemoteDataConfig.baseUrl}/${imgUrl}`;
    }

    if (article && article.id) {
      return RemoteDataConfig.articleImageUrl(article.id, 1);
    }

    return "";
  },

  getCategoryIconByType(type) {
    
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="2"/></svg>';
  },

  setupArticlesContainer(container, clearContent = true) {
    if (!container) return;

    container.className = "section-articles";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "14px";
    container.style.padding = "0";

    if (clearContent) {
      container.innerHTML = "";
    }
  },

  generateArticleListCardHTML(article, titleLines = 2) {
    if (!article) return "";

    const articleId = article.id ? String(article.id).trim() : "";
    if (!articleId || articleId === "" || articleId === "undefined" || articleId === "null") {
      return "";
    }

    const formattedDate = article.create_time
      ? Utils.formatTime(article.create_time)
      : "";
    const title = Utils.truncateTextToLines(article.title || "", titleLines);
    const imageUrl = Utils.getArticleImage(article);

    return `
      <div class="card-list" data-id="${articleId}">
        <div class="list-content">
          <h3 class="list-title">${title}</h3>
          <div class="list-meta">
            ${
              formattedDate
                ? `<span class="list-date">${formattedDate}</span>`
                : ""
            }
          </div>
        </div>
        <div class="list-img">
          <img src="${imageUrl}" alt="${
      article.title || ""
    }" onerror="this.style.display='none'; this.parentElement.classList.add('no-image');">
        </div>
      </div>
    `;
  },

  generateArticleListHTML(articles, titleLines = 2) {
    if (!Array.isArray(articles) || articles.length === 0) {
      return "";
    }

    return articles
      .map((article) => Utils.generateArticleListCardHTML(article, titleLines))
      .join("");
  },
};

const RemoteDataConfig = {
  get baseUrl() {
    return window.DataConfig.baseUrl;
  },
  get articleDetailPath() {
    return window.DataConfig.articleDetailPath;
  },
  get dbUrl() {
    return window.DataConfig.dbUrl;
  },
  datasetKey: "info1",

  articleDataUrl(id) {
    return `${this.baseUrl}/${id}/${this.articleDetailPath}`;
  },

  articleImageUrl(id, imageIndex = 1) {
    return `${this.baseUrl}/${id}/${imageIndex}.jpg`;
  },

  extractArticles(rawData) {
    if (Array.isArray(rawData)) {
     
      const hasArticles = rawData.some(item => item && typeof item === 'object' && item.id);
      
      if (hasArticles) {
    
        return rawData.filter(item => item && typeof item === 'object' && item.id);
      }
      
 
      if (rawData.length === 1 && rawData[0] && typeof rawData[0] === 'object' && this.datasetKey && Array.isArray(rawData[0][this.datasetKey])) {
        return rawData[0][this.datasetKey];
      }
      
      return [];
    }
    
    if (rawData && this.datasetKey && Array.isArray(rawData[this.datasetKey])) {
      return rawData[this.datasetKey];
    }
    
    return [];
  },
};

window.Utils = Utils;
window.RemoteDataConfig = RemoteDataConfig;

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
  new BackToTop();
});

class SidebarMenu {
  constructor(options = {}) {
    this.menuId = options.menuId || "sidebarMenu";
    this.overlayId = options.overlayId || "sidebarOverlay";
    this.toggleId = options.toggleId || "sidebarToggle";
    this.closeButtonId = options.closeButtonId || "sidebarClose";

    this.isInPagesDirectory = window.location.pathname.includes("/pages/");

    this.homeUrl =
      options.homeUrl ||
      (this.isInPagesDirectory ? "../index.html" : "index.html");

    this.categoryUrlPrefix =
      options.categoryUrlPrefix ||
      (this.isInPagesDirectory
        ? "category.html?type="
        : "pages/category.html?type=");

    this.categories = this.normalizeCategories(options.categories || []);
    this.fetchCategories =
      options.fetchCategories !== false && this.categories.length === 0;

    this.sidebarMenuEl = null;
    this.sidebarOverlayEl = null;
    this.sidebarToggleEl = null;
    this.sidebarCloseEl = null;

    if (options.autoInit !== false) {
      this.init();
    }
  }

  normalizeCategories(categories) {
    return categories
      .filter((category) => category && category.name && category.id !== "all")
      .map((category) => ({
        id: category.id || this.generateIdFromName(category.name),
        name: category.name,
      }));
  }

  generateIdFromName(name) {
    return name.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-");
  }

  async init() {
    this.sidebarMenuEl = document.getElementById(this.menuId);
    this.sidebarOverlayEl = document.getElementById(this.overlayId);
    this.sidebarToggleEl = document.getElementById(this.toggleId);

    if (!this.sidebarMenuEl) {
      return;
    }

    if (this.fetchCategories) {
      try {
        this.categories = await this.loadCategoriesFromData();
      } catch (error) {
        this.categories = [];
      }
    }

    this.renderMenu();
    this.bindCoreEvents();
  }

  async loadCategoriesFromData() {
    if (!RemoteDataConfig || !RemoteDataConfig.dbUrl) {
      throw new Error("RemoteDataConfig.dbUrl is not configured");
    }

    const response = await fetch(RemoteDataConfig.dbUrl, {
      cache: "no-store",
    }).catch((error) => {
      return null;
    });

    if (!response || !response.ok) {
      throw new Error(
        `Failed to fetch sidebar data: ${
          response ? response.status : "network error"
        }`
      );
    }

    const rawData = await response.json();
    const articles = RemoteDataConfig.extractArticles(rawData);
    if (!Array.isArray(articles)) {
      return [];
    }

    const typeSet = new Set();
    articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });

    return Array.from(typeSet).map((type) => ({
      id: this.generateIdFromName(type),
      name: type,
    }));
  }

  renderMenu() {
    if (!this.sidebarMenuEl) return;

    const categoryLinks = this.categories
      .map((category) => {
        const encodedName = encodeURIComponent(category.name);
        return `
          <a href="${this.categoryUrlPrefix}${encodedName}" class="sidebar-item">
            <span>${category.name}</span>
          </a>
        `;
      })
      .join("");

    this.sidebarMenuEl.innerHTML = `
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h3>Menu</h3>
          <button class="sidebar-close" id="${this.closeButtonId}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="sidebar-items">
          <a href="${this.homeUrl}" class="sidebar-item">
            <span>Home</span>
          </a>
          <div class="sidebar-category">
            ${categoryLinks}
          </div>
        </div>
      </div>
    `;

    this.sidebarCloseEl = document.getElementById(this.closeButtonId);
    this.bindSidebarNavigation();
    if (this.sidebarCloseEl) {
      this.sidebarCloseEl.addEventListener("click", () => {
        this.closeSidebar();
      });
    }
  }

  bindCoreEvents() {
    if (this.sidebarToggleEl) {
      this.sidebarToggleEl.addEventListener("click", () => {
        this.openSidebar();
      });
    }

    if (this.sidebarOverlayEl) {
      this.sidebarOverlayEl.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    document.addEventListener("keydown", this.handleEscapeKey);
  }

  handleEscapeKey = (e) => {
    if (e.key === "Escape") {
      this.closeSidebar();
    }
  };

  bindSidebarNavigation() {
    const sidebarItems = this.sidebarMenuEl.querySelectorAll(".sidebar-item");
    sidebarItems.forEach((item) => {
      const href = item.getAttribute("href");
      item.addEventListener("click", (event) => {
        event.preventDefault();
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
    if (this.sidebarMenuEl) {
      this.sidebarMenuEl.classList.add("active");
      document.body.style.overflow = "hidden";
    }
    if (this.sidebarOverlayEl) {
      this.sidebarOverlayEl.classList.add("active");
    }
  }

  closeSidebar() {
    if (this.sidebarMenuEl) {
      this.sidebarMenuEl.classList.remove("active");
      document.body.style.overflow = "";
    }
    if (this.sidebarOverlayEl) {
      this.sidebarOverlayEl.classList.remove("active");
    }
  }

  updateCategories(categories = []) {
    this.categories = this.normalizeCategories(categories);
    this.renderMenu();
  }
}

window.SidebarMenu = SidebarMenu;

class StaticPage {
  constructor(options = {}) {
    this.homeUrl = options.homeUrl || "index.html";
    this.sidebarMenu = null;
    this.init();
  }

  init() {
    this.sidebarMenu = new SidebarMenu({
      homeUrl: this.homeUrl,
      fetchCategories: true,
    });

    initSmartBackButton(this.homeUrl);
  }
}

window.StaticPage = StaticPage;

function initSmartBackButton(homeUrl = null) {
  const backButton = document.getElementById("smartBackButton");
  if (!backButton) return;

  if (!homeUrl) {
    const pathname = window.location.pathname;
    const isInPagesDirectory = pathname.includes("/pages/");
    homeUrl = isInPagesDirectory ? "../index.html" : "index.html";
  }

  backButton.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = homeUrl;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const pathname = window.location.pathname;
  const isAboutPage = pathname.includes("about.html");
  const isPrivacyPage = pathname.includes("privacy.html");

  const hasBackButton = document.getElementById("smartBackButton");

  if ((isAboutPage || isPrivacyPage) && hasBackButton) {
    const homeUrl = pathname.includes("/pages/")
      ? "../index.html"
      : "index.html";
    new StaticPage({ homeUrl });
  } else if (hasBackButton) {
    initSmartBackButton();
  }
});
