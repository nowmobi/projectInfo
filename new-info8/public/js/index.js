class FinanceNewsApp {
  constructor() {
    this.currentCategory = "all";
    this.articles = [];
    this.categories = [];
    this.categoryOrder = [];
    this.infoKey = "info2";
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderCategories();
    this.renderArticles();
  }

  async loadData() {
    try {
      const categoryOrder = await getCategoryOrder();
      this.categoryOrder = categoryOrder || [];

      const data = await window.fetchDbData();

      if (Array.isArray(data) && data.length > 0) {
        const [meta, ...rest] = data;
        this.articles = rest;
      } else {
        this.articles = [];
      }

      this.generateCategoriesFromArticles();
      this.renderArticles();
    } catch (error) {
      this.categoryOrder = [];
      this.articles = [];
      this.categories = [];
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

  generateCategoriesFromArticles() {
    const typeSet = new Set();
    this.articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });

    const orderedCategories = this.categoryOrder.filter((type) =>
      typeSet.has(type)
    );

    this.categories = [
      {
        id: "all",
        name: "Suggest",
        icon: "",
      },
      ...orderedCategories.map((type) => ({
        id: type
          .toLowerCase()
          .replace(/\s*&\s*/g, "-")
          .replace(/\s+/g, "-"),
        name: type,
        icon: "",
      })),
    ];

    
    this.createCategorySections();
  }

  createCategorySections() {
    const articlesGrid = document.getElementById("articlesGrid");
    if (!articlesGrid) return;

    const categorySections = articlesGrid.querySelectorAll(".category-section");
    const categories = this.categories.filter(
      (category) => category.id !== "all"
    );

    
    categorySections.forEach((section, index) => {
      const category = categories[index];
      if (category) {
        section.dataset.category = category.id;
        section.innerHTML = `
          <h4 class="category-section-title">${category.name}</h4>
          <div class="category-articles-grid" data-category-grid="${category.id}"></div>
        `;
        section.style.display = "";
      } else {
        
        section.style.display = "none";
      }
    });
  }

  truncateString(str, maxLength) {
    if (!str || str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + "...";
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

  bindCategoryEvents() {
    const categoryButtons = document.querySelectorAll(".category-btn");

    categoryButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const category = e.currentTarget.dataset.category;

        this.switchCategory(category);

        
        document.querySelectorAll(".category-btn").forEach((b) => {
          b.classList.remove("active");
        });

        
        e.currentTarget.classList.add("active");

        
        document.querySelectorAll(".sidebar-category").forEach((cat) => {
          cat.classList.remove("active");
          if (cat.dataset.category === category) {
            cat.classList.add("active");
          }
        });
      });
    });
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.currentCategory = "all";
      this.renderArticles();
      this.hideSearchResults();
      return;
    }

    
    const allowedTypes = this.categoryOrder || [];

    
    const filteredArticles = this.articles.filter((article) => {
      
      if (!allowedTypes.includes(article.type)) {
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

    if (filteredArticles.length === 0) {
      const articlesGrid = document.getElementById("articlesGrid");
      if (articlesGrid) {
        articlesGrid.innerHTML = `
          <div class="category-section">
            <div style="text-align: center; padding: 60px 20px; color: #666;">
              <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
              <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 10px;">No results found</div>
              <div style="font-size: 14px; color: #999;">Try searching with different keywords</div>
            </div>
          </div>
        `;
      }
    } else {
      this.renderArticles(filteredArticles);
    }

    this.showSearchResults(filteredArticles.length, query);
  }

  showSearchResults(count, query) {
    const searchResultsBar = document.getElementById("searchResultsBar");
    const searchResultsCount = document.getElementById("searchResultsCount");
    const searchQuery = document.getElementById("searchQuery");

    if (searchResultsBar && searchResultsCount && searchQuery) {
      searchResultsCount.textContent = count;
      searchQuery.textContent = query;
      searchResultsBar.style.display = "flex";
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
      this.hideSearchResults();

      
      this.currentCategory = "all";

      
      document.querySelectorAll(".category-btn").forEach((btn) => {
        btn.classList.remove("active");
        if (btn.dataset.category === "all") {
          btn.classList.add("active");
        }
      });

      
      document.querySelectorAll(".sidebar-category").forEach((cat) => {
        cat.classList.remove("active");
      });

      
      this.renderArticles();
    }
  }

  switchCategory(category) {
    this.currentCategory = category;

    if (category === "all") {
      const searchInput = document.getElementById("searchInput");
      if (searchInput && searchInput.value.trim()) {
        searchInput.value = "";
        this.updateSearchUI("");
        this.hideSearchResults();
      }
    }

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

        document.querySelectorAll(".category-btn").forEach((btn) => {
          btn.classList.remove("active");
          if (btn.dataset.category === categoryId) {
            btn.classList.add("active");
          }
        });
      });
    });
  }

  renderArticles(articlesToRender = null) {
    const articlesGrid = document.getElementById("articlesGrid");
    if (!articlesGrid) return;

    if (articlesToRender) {
      const groupedByCategory = this.groupArticlesByCategory(articlesToRender);

      articlesGrid.innerHTML = groupedByCategory
        .map(
          (categoryData) => `
        <div class="category-section" data-category="${
          categoryData.categoryId
        }">
          <h4 class="category-section-title">${categoryData.categoryName}</h4>
          <div class="category-articles-grid" data-category-grid="${
            categoryData.categoryId
          }">
            ${categoryData.articles
              .map((article) => this.createArticleCard(article))
              .join("")}
          </div>
        </div>
      `
        )
        .join("");
    } else if (this.currentCategory === "all") {
      
      const categoriesData = this.getArticlesByCategory(4);

      
      const existingSections =
        articlesGrid.querySelectorAll(".category-section");
      const hasValidStructure =
        existingSections.length > 0 &&
        existingSections.length >= categoriesData.length;

      if (!hasValidStructure) {
        
        articlesGrid.innerHTML = categoriesData
          .map(
            (categoryData) => `
          <div class="category-section" data-category="${
            categoryData.categoryId
          }">
            <h4 class="category-section-title">${categoryData.categoryName}</h4>
            <div class="category-articles-grid" data-category-grid="${
              categoryData.categoryId
            }">
              ${categoryData.articles
                .map((article) => this.createArticleCard(article))
                .join("")}
            </div>
          </div>
        `
          )
          .join("");
      } else {
        
        this.rebuildCategoryStructure();

        categoriesData.forEach((categoryData) => {
          const categoryGrid = document.querySelector(
            `[data-category-grid="${categoryData.categoryId}"]`
          );
          if (categoryGrid) {
            categoryGrid.innerHTML = categoryData.articles
              .map((article) => this.createArticleCard(article))
              .join("");
          }
        });
      }
    } else {
      const articles = this.articles.filter((article) => {
        const articleTypeId = article.type
          ? article.type
              .toLowerCase()
              .replace(/\s*&\s*/g, "-")
              .replace(/\s+/g, "-")
          : "";
        return articleTypeId === this.currentCategory;
      });

      const currentCategoryObj = this.categories.find(
        (cat) => cat.id === this.currentCategory
      );
      const categoryName = currentCategoryObj
        ? currentCategoryObj.name
        : "Articles";

      articlesGrid.innerHTML = `
        <div class="category-section" data-category="${this.currentCategory}">
          <h4 class="category-section-title">${categoryName}</h4>
          <div class="category-articles-grid" data-category-grid="${
            this.currentCategory
          }">
            ${articles
              .map((article) => this.createArticleCard(article))
              .join("")}
          </div>
        </div>
      `;
    }

    this.bindArticleEvents();
  }

  rebuildCategoryStructure() {
    const articlesGrid = document.getElementById("articlesGrid");
    if (!articlesGrid) return;

    const sections = articlesGrid.querySelectorAll(".category-section");
    sections.forEach((section) => {
      const grid = section.querySelector(".category-articles-grid");
      if (grid) {
        grid.innerHTML = "";
      }
    });
  }

  createArticleCard(article) {
    return `
      <div class="article-card" data-id="${article.id}">
        <div class="article-image">
          <img src="${this.getArticleImage(article)}" alt="${
      article.title
    }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #ba7ac7 0%, #9b6aa8 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
            <div>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
              </svg>
              <div>Image</div>
              <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
            </div>
          </div>
        </div>
        <div class="article-content">
          <h3 class="article-title">${article.title}</h3>
          <div class="article-meta">
            <span class="article-type">${this.truncateString(article.type || "", 12)}</span>
            <span class="article-time">${
              Utils.formatTimestamp(article.create_time) || ""
            }</span>
          </div>
        </div>
      </div>
    `;
  }

  groupArticlesByCategory(articles) {
    const categoriesWithArticles = [];
    const orderedCategories = this.categories.filter((cat) => cat.id !== "all");

    orderedCategories.forEach((category) => {
      const categoryArticles = articles.filter((article) => {
        const articleTypeId = article.type
          ? article.type
              .toLowerCase()
              .replace(/\s*&\s*/g, "-")
              .replace(/\s+/g, "-")
          : "";
        return articleTypeId === category.id;
      });

      if (categoryArticles.length > 0) {
        categoriesWithArticles.push({
          categoryName: category.name,
          categoryId: category.id,
          articles: categoryArticles,
        });
      }
    });

    return categoriesWithArticles;
  }

  getArticlesByCategory(limit = null) {
    const categoriesWithArticles = [];

    const orderedCategories = this.categories.filter((cat) => cat.id !== "all");

    orderedCategories.forEach((category) => {
      const categoryArticles = this.articles.filter((article) => {
        const articleTypeId = article.type
          ? article.type
              .toLowerCase()
              .replace(/\s*&\s*/g, "-")
              .replace(/\s+/g, "-")
          : "";
        return articleTypeId === category.id;
      });

      let selected;
      if (limit === null) {
        selected = categoryArticles;
      } else {
        const shuffled = categoryArticles.sort(() => Math.random() - 0.5);
        selected = shuffled.slice(0, limit);
      }

      if (selected.length > 0) {
        categoriesWithArticles.push({
          categoryName: category.name,
          categoryId: category.id,
          articles: selected,
        });
      }
    });

    return categoriesWithArticles;
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(".article-card");

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

  getArticleImage(article) {
    if (!article || !article.img) {
      return "";
    }

    const imgPath = article.img;

    if (/^(https?:)?\/\//.test(imgPath)) {
      return imgPath;
    }

    if (imgPath.startsWith("finace/")) {
      return `${window.DataConfig.baseUrl}/${imgPath.replace(/^finace\//, "")}`;
    }

    if (imgPath.startsWith("public/")) {
      return imgPath;
    }

    const articleId = article.id ? String(article.id) : "";
    if (!articleId) {
      return imgPath;
    }

    return `${window.DataConfig.baseUrl}/${articleId}/${imgPath}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.financeNewsApp = new FinanceNewsApp();
});
