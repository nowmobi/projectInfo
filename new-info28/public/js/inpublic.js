import { getCategoryOrder, getImgUrl } from "./BaseURL.js";

const Utils = {
  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  formatTimestamp(timestamp, locale = "en-US") {
    if (timestamp === undefined || timestamp === null) {
      return "";
    }

    let value = Number(timestamp);
    if (!Number.isFinite(value)) {
      return "";
    }

    if (Math.abs(value) > 1e12) {
      value = value / 1000;
    }

    const date = new Date(value * 1000);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  },

  isInPagesDir() {
    return window.location.pathname.includes("/pages/");
  },

  createArticleCard(article, decodeUnicode = null, reverse = false) {
    const imageUrl = getImgUrl(article);
    const categoryTag = decodeUnicode
      ? decodeUnicode(article.type) || "unknown category"
      : article.type || "unknown type";
    const timeStr = window.Utils?.formatTimestamp?.(article.create_time) || "";
    const reverseClass = reverse ? " article-card-reverse" : "";

    return `
      <div class="article-card${reverseClass}" data-id="${article.id}">
        <div class="article-category-tag">
          <span>${categoryTag}</span>
        </div>
        <div class="article-image">
          <img src="${imageUrl}" alt="${article.title}" onerror="this.style.display='none';">
        </div>
        <div class="article-content">
          <div>
            <h3 class="article-title">${article.title}</h3>
            <div class="article-time">${timeStr}</div>
          </div>
        </div>
      </div>
    `;
  },

  bindArticleCardEvents(detailPagePath = null) {
    const articleCards = document.querySelectorAll(".article-card");
    const isInPagesDir = Utils.isInPagesDir();
    const path =
      detailPagePath || (isInPagesDir ? "../depth.html" : "depth.html");

    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        if (articleId && !articleId.startsWith("placeholder-")) {
          window.location.href = `${path}?id=${articleId}`;
        }
      });
    });
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
};

window.Utils = Utils;

class SidebarManager {
  constructor() {
    this.categories = [];
    this.isInPagesDir = Utils.isInPagesDir();
    this.init();
  }

  async init() {
    await this.loadCategories();
    this.renderSidebar();
    this.bindEvents();
  }

  async loadCategories() {
    const normaliseCategories = (list) => {
      if (!Array.isArray(list)) return [];
      const trimmed = list
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
      return Array.from(new Set(trimmed));
    };

    try {
      const categoryOrder = await getCategoryOrder();
      const categories = normaliseCategories(categoryOrder);

      if (categories.length > 0) {
        this.categories = categories;
        return;
      }
    } catch (error) {}

    if (!this.categories || this.categories.length === 0) {
      this.categories = [];
    }
  }

  getPath(path) {
    if (this.isInPagesDir) {
      if (path.startsWith("pages/")) {
        return path.replace("pages/", "");
      } else if (path === "index.html") {
        return "../index.html";
      }
    }
    return path;
  }

  renderSidebar() {
    let sidebarContainer = document.getElementById("sidebarContainer");
    if (!sidebarContainer) {
      sidebarContainer = document.createElement("div");
      sidebarContainer.id = "sidebarContainer";
      document.body.appendChild(sidebarContainer);
    }

    const homeLink = this.getPath("index.html");
    const categoryBasePath = this.getPath("pages/category.html");

    const categoriesHTML = this.categories
      .map((categoryName) => {
        const encodedName = encodeURIComponent(categoryName);
        const dataPage = categoryName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/&/g, "");
        return `
        <a href="${categoryBasePath}?type=${encodedName}" class="sidebar-item" data-page="${dataPage}">
          <span>${categoryName}</span>
        </a>
      `;
      })
      .join("");

    const sidebarHTML = `
      <div class="sidebar-menu" id="sidebarMenu">
        <div class="sidebar-content">
          <div class="sidebar-header">
            <h3>Menu</h3>
            <button class="sidebar-close" id="sidebarClose">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="sidebar-items">
            <a href="${homeLink}" class="sidebar-item" data-page="home">
              <span>Home</span>
            </a>
            <div class="sidebar-category">
              ${categoriesHTML}
            </div>
          </div>
        </div>
      </div>
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;

    sidebarContainer.innerHTML = sidebarHTML;
  }

  bindEvents() {
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarMenu = document.getElementById("sidebarMenu");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => this.openSidebar());
    }

    if (sidebarClose) {
      sidebarClose.addEventListener("click", () => this.closeSidebar());
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => this.closeSidebar());
    }

    this.bindSidebarNavigation();

    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        sidebarMenu &&
        sidebarMenu.classList.contains("active")
      ) {
        this.closeSidebar();
      }
    });
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


function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTopBtn');
  
  if (!backToTopBtn) return;

  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });

  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("sidebarContainer")) {
    window.sidebarManager = new SidebarManager();
  }
  initBackToTop();
});

function initBackButton() {
  const backButton = document.getElementById("smartBackButton");
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();

      const homePath = Utils.isInPagesDir() ? "../index.html" : "index.html";
      window.location.href = homePath;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initBackButton();
});