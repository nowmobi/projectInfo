class FinanceNewsApp {
  constructor() {
    this.currentCategory = "all";
    this.articles = [];
    this.categories = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderArticles();
  }

  async loadData() {
    try {
      const response = await fetch(RemoteDataConfig.dbUrl, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();
      const articles = RemoteDataConfig.extractArticles(rawData);
      this.articles = Array.isArray(articles) ? articles : [];

      this.generateCategoriesFromArticles();
      this.renderCategoryBar();
      this.initializeSidebarMenu();

      this.hideLoading();
    } catch (error) {
      this.articles = [];
      this.categories = [];

      this.hideLoading();
    }
  }

  hideLoading() {
    const loading = document.getElementById("loading");
    if (loading) {
      loading.classList.add("dsn");
    }
  }

  generateCategoriesFromArticles() {
    const typeSet = new Set();
    this.articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });

    this.categories = [
      {
        id: "all",
        name: "Suggest",
        icon: "",
      },
      ...Array.from(typeSet).map((type) => ({
        id: type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, ""),
        name: type,
        icon: "",
      })),
    ];
  }

  renderCategoryBar() {
    const track = document.getElementById("categoryBarTrack");
    if (!track) return;

    const categories = this.categories.filter(
      (category) => category.id !== "all"
    );

    const hotCategory = `
      <div class="cat-pill active" data-category="hot">
        <div class="cat-pill-icon">
          ${Utils.getCategoryIconByType("Finance")}
        </div>
        <div class="cat-pill-label">Hot</div>
      </div>
    `;

    const otherCategories = categories
      .map(
        (category) => `
        <div class="cat-pill" data-category="${category.id}">
          <div class="cat-pill-icon">
            ${Utils.getCategoryIconByType(category.name)}
          </div>
          <div class="cat-pill-label">${category.name}</div>
        </div>
      `
      )
      .join("");

    track.innerHTML = hotCategory + otherCategories;

    const pills = track.querySelectorAll(".cat-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        const categoryId = pill.dataset.category;
        if (!categoryId) return;

        pills.forEach((item) => item.classList.remove("active"));
        pill.classList.add("active");

        if (categoryId === "hot") {
          this.currentCategory = "all";
        } else {
          this.currentCategory = categoryId;
        }
        this.renderArticles();

        if (categoryId !== "hot") {
          const cards = document.querySelectorAll(".section-header");
          cards.forEach((card) => {
            const categoryName = card.dataset.category;
            if (!categoryName) return;
            const normalized = categoryName
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[&]/g, "");
            if (normalized === categoryId) {
              card.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  initializeSidebarMenu() {
    if (typeof SidebarMenu === "undefined") return;

    const categoriesForSidebar = this.categories.filter(
      (category) => category.id !== "all"
    );

    this.sidebarMenu = new SidebarMenu({
      categories: categoriesForSidebar,
      fetchCategories: false,
      homeUrl: "index.html",
    });
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
      this.handleSearch("");
    }

    this.currentCategory = "all";
    this.renderArticles();
  }

  bindSidebarCategoryEvents() {
    const sidebarCategories = document.querySelectorAll(".sidebar-category");

    sidebarCategories.forEach((category) => {
      category.addEventListener("click", (e) => {
        const categoryId = e.currentTarget.dataset.category;

        this.currentCategory = categoryId;
        sidebarCategories.forEach((cat) => cat.classList.remove("active"));
        e.currentTarget.classList.add("active");
        this.renderArticles();
      });
    });
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

    const articlesByCategory = {};
    articles.forEach((article) => {
      const categoryName = article.type || "Other";
      if (!articlesByCategory[categoryName]) {
        articlesByCategory[categoryName] = [];
      }
      articlesByCategory[categoryName].push(article);
    });

    const categoriesHtml = Object.keys(articlesByCategory)
      .map((categoryName) => {
        const categoryArticles = articlesByCategory[categoryName];

        return `
        <div class="category-section section--list">
          <div class="section-header">
            <h2 class="section-title">${categoryName}</h2>
          </div>
          <div class="section-articles">
            ${Utils.generateArticleListHTML(categoryArticles, 2)}
          </div>
        </div>
      `;
      })
      .join("");

    articlesGrid.innerHTML = categoriesHtml;

    this.bindArticleEvents();
  }

  renderCategoriesSections() {
    const categoriesContainer = document.getElementById("categoriesContainer");
    if (!categoriesContainer) return;

    const sections = Array.from(
      categoriesContainer.querySelectorAll("[data-category-id]")
    );
    const sectionMap = new Map();

    sections.forEach((section) => {
      const sectionId = section.dataset.categoryId;
      if (sectionId) {
        sectionMap.set(sectionId, section);
      }
    });

    const categories = this.categories.filter((cat) => cat.id !== "all");
    const activeCategoryIds = new Set();

    categories.forEach((category, index) => {
      const section = this.getOrCreateCategorySection(
        categoriesContainer,
        sectionMap,
        category
      );
      section.classList.remove(
        "section--featured",
        "section--list"
      );
      if (index === 0 || index === 2 || index === 4 || index === 6) {
        section.classList.add("section--featured");
      } else if (index === 1 || index === 3 || index === 5) {
        section.classList.add("section--list");
      }
      this.populateCategorySection(section, category);
      activeCategoryIds.add(category.id);
    });

    sectionMap.forEach((section, sectionId) => {
      if (!activeCategoryIds.has(sectionId)) {
        section.style.display = "none";
        const articlesWrapper = section.querySelector(
          ".section-articles"
        );
        if (articlesWrapper) {
          articlesWrapper.innerHTML = "";
        }
      }
    });

    this.bindArticleEvents();
    this.bindCategoryTitleEvents();
  }

  getOrCreateCategorySection(container, sectionMap, category) {
    let section = sectionMap.get(category.id);
    if (!section) {
      section = document.createElement("div");
      section.className = "category-section";
      section.dataset.categoryId = category.id;
      section.dataset.categoryName = category.name;
      section.innerHTML = `
        <div class="section-header" data-category="${category.name}">
          <h2 class="section-title">${category.name}</h2>
        </div>
        <div class="section-articles"></div>
      `;
      container.appendChild(section);
      sectionMap.set(category.id, section);
    } else {
      section.dataset.categoryName = category.name;
      let header = section.querySelector(".section-header");
      if (!header) {
        header = document.createElement("div");
        header.className = "section-header";
        const articlesContainer = section.querySelector(
          ".section-articles"
        );
        if (articlesContainer) {
          section.insertBefore(header, articlesContainer);
        } else {
          section.appendChild(header);
        }
      }
      header.dataset.category = category.name;
      let title = header.querySelector(".section-title");
      if (!title) {
        title = document.createElement("h2");
        title.className = "section-title";
        header.appendChild(title);
      }
      title.textContent = category.name;
    }
    return section;
  }

  populateCategorySection(section, category) {
    if (!section) return;

    section.dataset.categoryId = category.id;
    section.dataset.categoryName = category.name;

    const header = section.querySelector(".section-header");
    if (header) {
      header.dataset.category = category.name;
      const title = header.querySelector(".section-title");
      if (title) {
        title.textContent = category.name;
      }

      const icon = header.querySelector(".category-section-icon");
      if (icon) {
        icon.remove();
      }
    }

    const articlesWrapper = section.querySelector(".section-articles");
    if (!articlesWrapper) return;

    const categoryArticles = this.getArticlesByCategory(category.id, 4);

    if (!categoryArticles.length) {
      section.style.display = "none";
      articlesWrapper.innerHTML = "";
      return;
    }

    section.style.display = "";

    const isListStyle = section.classList.contains("section--list");

    articlesWrapper.innerHTML = categoryArticles
      .map((article) => {
        if (isListStyle) {
          return Utils.generateArticleListCardHTML(article, 2);
        }

        return `
        <div class="card-simple" data-id="${article.id}">
          <div class="img-simple">
            <img src="${Utils.getArticleImage(article)}" alt="${
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
          <h3 class="title-simple">${Utils.truncateTextToLines(
            article.title,
            3
          )}</h3>
        </div>
      `;
      })
      .join("");
  }

  getArticlesByCategory(categoryId, limit = 4) {
    return this.articles
      .filter((article) => {
        if (!article || !article.id) return false;
        const articleId = String(article.id).trim();
        if (articleId === "" || articleId === "undefined" || articleId === "null") return false;
        
        const articleTypeId = article.type
          ? article.type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "")
          : "";
        return articleTypeId === categoryId;
      })
      .slice(0, limit);
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(
      ".card-simple, .card-list"
    );

    articleCards.forEach((card) => {
      card.addEventListener("click", () => {
        const articleId = card.dataset.id;

        if (articleId) {
          const detailUrl = `detail.html?id=${articleId}`;
          window.location.href = detailUrl;
        }
      });
    });
  }

  bindCategoryTitleEvents() {
    const categoryHeaders = document.querySelectorAll(
      ".section-header"
    );
    categoryHeaders.forEach((header) => {
      if (header.dataset.bound === "true") {
        return;
      }
      header.dataset.bound = "true";
      header.addEventListener("click", () => {
        const categoryName = header.dataset.category;
        if (categoryName) {
          const encodedCategoryName = encodeURIComponent(categoryName);
          const categoryUrl = `pages/category.html?type=${encodedCategoryName}`;
          window.location.href = categoryUrl;
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
}

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

      if (window.financeNewsApp) {
        window.financeNewsApp.clearSearch();
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (!searchBar.contains(e.target) && !searchToggleBtn.contains(e.target)) {
      searchBar.style.display = "none";
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchBar.style.display = "none";
      searchToggleBtn.focus();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new FinanceNewsApp();
  window.financeNewsApp = app;
  initSearchFunctionality();
});
