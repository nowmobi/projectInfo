import { getImgUrl, getCategoryOrder, fetchDbData } from "./BaseURL.js";

class Website {
  constructor() {
    this.currentCategory = "hot";
    this.articles = [];
    this.categories = [];
    this.categoryOrder = [];
    this.initialGridStructure = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderCategories();
    this.renderFeaturedBanner();

    
    const articlesGrid = document.getElementById("articlesGrid");
    if (articlesGrid) {
      this.initialGridStructure = Array.from(articlesGrid.children).map((child) => ({
        type: child.className,
        html: child.outerHTML
      }));
    }

    this.initHotViewStructure();

    if (this.currentCategory === "hot") {
      this.renderHotView();
    } else {
      this.renderArticles();
    }
  }

  async loadData() {
    try {
      this.categoryOrder = await getCategoryOrder();

      const data = await fetchDbData();

      if (Array.isArray(data) && data.length > 0) {
        const [meta, ...rest] = data;
        this.articles = rest;
      } else {
        this.articles = [];
      }

      this.generateCategoriesFromArticles();
    } catch (error) {
      this.categoryOrder = [];
      this.articles = [];
      this.categories = [];

      const articlesGrid = document.getElementById("articlesGrid");
      if (articlesGrid) {
        articlesGrid.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 10px;">Failed to load data</div>
            <div style="font-size: 14px; color: #999; margin-bottom: 20px;">Unable to connect to data source</div>
            <button onclick="location.reload()" style="padding: 10px 20px; background: var(--color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Retry</button>
          </div>
        `;
      }
    }
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
  }

  setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    const searchClear = document.getElementById("searchClear");
    const clearSearchBtn = document.getElementById("clearSearchBtn");

    if (searchInput) {
      const debouncedSearch = window.Utils.debounce((query) => {
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

  bindCategoryEvents() {
    const categoryButtons = document.querySelectorAll(
      ".category-bar .category-btn"
    );

    categoryButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const category = e.currentTarget.dataset.category;

        categoryButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.switchCategory(category);
      });
    });
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.currentCategory = "hot";
      this.renderHotView();
      this.hideSearchResults();
      this.showHomeElements();
      return;
    }

    this.hideHomeElements();

    const filteredArticles = this.articles.filter((article) => {
      const searchTerm = query.toLowerCase();
      const title = (article.title || "").toLowerCase();
      const type = (article.type || "").toLowerCase();

      return title.includes(searchTerm) || type.includes(searchTerm);
    });

    if (filteredArticles.length === 0) {
      const articlesGrid = document.getElementById("articlesGrid");
      if (articlesGrid) {
        articlesGrid.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
            <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 10px;">No results found</div>
            <div style="font-size: 14px; color: #999;">Try searching with different keywords</div>
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

  hideHomeElements() {
    const featuredBanner = document.getElementById("featuredBanner");
    const categoryBar = document.querySelector(".category-bar");

    if (featuredBanner) {
      featuredBanner.style.display = "none";
    }
    if (categoryBar) {
      categoryBar.style.display = "none";
    }
  }

  showHomeElements() {
    const featuredBanner = document.getElementById("featuredBanner");
    const categoryBar = document.querySelector(".category-bar");

    if (featuredBanner) {
      featuredBanner.style.display = "";
    }
    if (categoryBar) {
      categoryBar.style.display = "";
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

      this.switchCategory("hot");
      this.hideSearchResults();
      this.showHomeElements();
    }
  }

  switchCategory(category) {
    this.currentCategory = category;

    document.querySelectorAll(".category-bar .category-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.category === category) {
        btn.classList.add("active");
      }
    });

    if (category === "hot") {
      this.renderHotView();
    } else {
      this.renderArticles();
    }
  }

  renderCategories() {
    const categoryContainer = document.querySelector(".category-container");
    if (categoryContainer) {
      const actualCategories = this.categories.filter(
        (category) => category.id !== "all"
      );

      if (actualCategories.length === 0) {
        categoryContainer.innerHTML = "";
      } else {
        const categoryButtonsHtml = `
          <a href="#" class="category-btn active" data-category="hot">
            Hot
          </a>
          ${actualCategories
            .map(
              (category, index) => `
            <a href="#" class="category-btn" data-category="${category.id}">
              ${category.name}
            </a>
          `
            )
            .join("")}
        `;

        categoryContainer.innerHTML = categoryButtonsHtml;

        this.bindCategoryEvents();
      }
    }

    this.renderSidebarCategories();
  }

  renderSidebarCategories() {
    
  }

  renderFeaturedBanner() {
    const carouselWrapper = document.getElementById("carouselWrapper");
    const carouselIndicators = document.getElementById("carouselIndicators");
    if (!carouselWrapper || !carouselIndicators) return;

    if (this.articles.length === 0) {
      carouselWrapper.innerHTML =
        '<div style="text-align: center; padding: 40px; color: #999;">Loading featured articles...</div>';
      carouselIndicators.innerHTML = "";
      return;
    }

    const shuffled = [...this.articles].sort(() => Math.random() - 0.5);
    const featuredArticles = shuffled.slice(
      0,
      Math.min(5, this.articles.length)
    );

    carouselWrapper.innerHTML = featuredArticles
      .map((article, index) => {
        const imageUrl = getImgUrl(article);
        return `
        <div class="carousel-item ${index === 0 ? "active" : ""}" data-id="${
          article.id
        }" data-index="${index}">
          <img src="${imageUrl}" alt="${
          article.title
        }" onerror="this.style.display='none';">
          <div class="carousel-overlay">
            <h3 class="carousel-title">${article.title}</h3>
          </div>
        </div>
      `;
      })
      .join("");

    carouselIndicators.innerHTML = featuredArticles
      .map((article, index) => {
        return `<button class="carousel-indicator ${
          index === 0 ? "active" : ""
        }" data-index="${index}"></button>`;
      })
      .join("");

    carouselWrapper.querySelectorAll(".carousel-item").forEach((item) => {
      item.addEventListener("click", () => {
        const articleId = item.dataset.id;
        if (articleId) {
          window.location.href = `depth.html?id=${articleId}`;
        }
      });
    });

    this.initCarousel(featuredArticles.length);
  }

  initCarousel(totalItems) {
    if (totalItems <= 1) return;

    let currentIndex = 0;
    let autoPlayInterval = null;

    const carouselItems = document.querySelectorAll(".carousel-item");
    const indicators = document.querySelectorAll(".carousel-indicator");

    const showSlide = (index) => {
      carouselItems.forEach((item, i) => {
        item.classList.remove("active");
        if (i === index) {
          item.classList.add("active");
        }
      });

      indicators.forEach((indicator, i) => {
        indicator.classList.remove("active");
        if (i === index) {
          indicator.classList.add("active");
        }
      });

      currentIndex = index;
    };

    const nextSlide = () => {
      const nextIndex = (currentIndex + 1) % totalItems;
      showSlide(nextIndex);
    };

    indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", (e) => {
        e.stopPropagation();
        showSlide(index);
        resetAutoPlay();
      });
    });

    const startAutoPlay = () => {
      autoPlayInterval = setInterval(() => {
        nextSlide();
      }, 5000);
    };

    const resetAutoPlay = () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
      startAutoPlay();
    };

    const carouselContainer = document.querySelector(".carousel-container");
    if (carouselContainer) {
      carouselContainer.addEventListener("mouseenter", () => {
        if (autoPlayInterval) {
          clearInterval(autoPlayInterval);
        }
      });

      carouselContainer.addEventListener("mouseleave", () => {
        startAutoPlay();
      });
    }

    startAutoPlay();
  }

  initHotViewStructure() {
    const articlesGrid = document.getElementById("articlesGrid");
    if (!articlesGrid) return;

    const hotCategories = this.categoryOrder;

    if (hotCategories.length === 0) {
      return;
    }

    const adsElements = articlesGrid.querySelectorAll(".ads");
    adsElements.forEach((ads) => {
      ads.style.display = "";
    });

    const existingSections = articlesGrid.querySelectorAll(
      ".hot-category-section"
    );

    hotCategories.forEach((categoryName, index) => {
      if (index < existingSections.length) {
        const section = existingSections[index];
        let titleEl = section.querySelector(".hot-category-title");
        let articlesContainer = section.querySelector(".hot-category-articles");

        if (!titleEl) {
          titleEl = document.createElement("h3");
          titleEl.className = "hot-category-title";
          section.appendChild(titleEl);
        }

        if (!articlesContainer) {
          articlesContainer = document.createElement("div");
          articlesContainer.className = "hot-category-articles";
          section.appendChild(articlesContainer);
        }

        titleEl.textContent = categoryName;

        articlesContainer.innerHTML = `
          <div class="article-card" data-id="placeholder-${index}-1">
            <div class="article-category-tag">
              <span>${categoryName}</span>
            </div>
            <div class="article-image">
              <img src="" alt="title" onerror="this.style.display='none';">
            </div>
            <div class="article-content">
              <div>
                <h3 class="article-title">title</h3>
                <div class="article-time">2026-01-01</div>
              </div>
            </div>
          </div>
          <div class="article-card" data-id="placeholder-${index}-2">
            <div class="article-category-tag">
              <span>${categoryName}</span>
            </div>
            <div class="article-image">
              <img src="" alt="title" onerror="this.style.display='none';">
            </div>
            <div class="article-content">
              <div>
                <h3 class="article-title">title</h3>
                <div class="article-time">2026-01-01</div>
              </div>
            </div>
          </div>
        `;
      }
    });

    existingSections.forEach((section, index) => {
      if (index >= hotCategories.length) {
        section.style.display = "none";
      } else {
        section.style.display = "";
      }
    });
  }

  renderHotView() {
    const articlesGrid = document.getElementById("articlesGrid");
    if (!articlesGrid) return;

    const categoriesWithArticles = this.getHotArticlesByCategory(2);
    const hotCategories = categoriesWithArticles;

    if (hotCategories.length === 0) {
      
      articlesGrid.innerHTML = this.initialGridStructure.map(item => item.html).join("");
      
      
      const messageDiv = document.createElement("div");
      messageDiv.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
          <div style="font-size: 48px; margin-bottom: 20px;">🔥</div>
          <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 10px;">No hot articles available</div>
          <div style="font-size: 14px; color: #999;">Please check back later</div>
        </div>
      `;
      articlesGrid.appendChild(messageDiv);
      return;
    }

    
    articlesGrid.innerHTML = this.initialGridStructure.map(item => item.html).join("");

    
    const hotSections = articlesGrid.querySelectorAll(".hot-category-section");
    hotCategories.forEach((categoryData, index) => {
      if (index < hotSections.length) {
        const section = hotSections[index];
        let titleEl = section.querySelector(".hot-category-title");
        let articlesContainer = section.querySelector(".hot-category-articles");

        if (!titleEl) {
          titleEl = document.createElement("h3");
          titleEl.className = "hot-category-title";
          section.appendChild(titleEl);
        }

        if (!articlesContainer) {
          articlesContainer = document.createElement("div");
          articlesContainer.className = "hot-category-articles";
          section.appendChild(articlesContainer);
        }

        const isReverse = index % 2 === 1;
        titleEl.textContent = categoryData.categoryName;
        articlesContainer.innerHTML = categoryData.articles
          .map((article) => this.createBusinessCard(article, isReverse))
          .join("");
      }
    });

    
    hotSections.forEach((section, index) => {
      if (index >= hotCategories.length) {
        section.style.display = "none";
      } else {
        section.style.display = "";
      }
    });

    this.bindArticleEvents();
  }

  getHotArticlesByCategory(limit = 2) {
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

      const shuffled = [...categoryArticles].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, limit);

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

  renderArticles(articlesToRender = null) {
    const articlesGrid = document.getElementById("articlesGrid");
    if (!articlesGrid) return;

    const hotSections = articlesGrid.querySelectorAll(".hot-category-section");
    hotSections.forEach((section) => {
      section.style.display = "none";
    });

    const adsElements = [];
    const existingAds = articlesGrid.querySelectorAll(".ads");
    existingAds.forEach((ads) => {
      adsElements.push(ads.outerHTML);
    });

    if (articlesToRender) {
      articlesGrid.innerHTML = articlesToRender
        .map((article) => this.createBusinessCard(article))
        .join("");
    } else {
      const featuredBanner = document.getElementById("featuredBanner");

      const displayedIds = new Set();
      if (featuredBanner) {
        const carouselItems = featuredBanner.querySelectorAll(".carousel-item");
        carouselItems.forEach((item) => {
          if (item.dataset.id) displayedIds.add(item.dataset.id);
        });
      }

      if (this.currentCategory === "hot") {
        return;
      }

      const categoryArticles = this.articles.filter((article) => {
        const articleTypeId = article.type
          ? article.type
              .toLowerCase()
              .replace(/\s*&\s*/g, "-")
              .replace(/\s+/g, "-")
          : "";
        return articleTypeId === this.currentCategory;
      });

      const remainingArticles = categoryArticles.filter(
        (article) => !displayedIds.has(String(article.id))
      );

      if (remainingArticles.length === 0) {
        if (this.articles.length === 0) {
          articlesGrid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
              <div style="font-size: 48px; margin-bottom: 20px;">📰</div>
              <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 10px;">No articles available</div>
              <div style="font-size: 14px; color: #999;">Please check your data source or try again later</div>
            </div>
          `;
        } else {
          articlesGrid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
              <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
              <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 10px;">No articles in this category</div>
              <div style="font-size: 14px; color: #999;">Try selecting a different category</div>
            </div>
          `;
        }
      } else {
        articlesGrid.innerHTML = remainingArticles
          .map((article) => this.createBusinessCard(article))
          .join("");
      }
    }

    this.bindArticleEvents();
  }

  createBusinessCard(article, reverse = false) {
    if (window.Utils && window.Utils.createArticleCard) {
      return window.Utils.createArticleCard(article, null, reverse);
    }
    
    const imageUrl = article.img || "";
    const categoryTag = article.type || "unknown type";
    const timeStr = article.create_time ? new Date(article.create_time).toLocaleDateString() : "";
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
  }

  bindArticleEvents() {
    if (window.Utils && window.Utils.bindArticleCardEvents) {
      window.Utils.bindArticleCardEvents("depth.html");
    } else {
      
      const articleCards = document.querySelectorAll(".article-card");
      articleCards.forEach((card) => {
        card.addEventListener("click", (e) => {
          const articleId = card.dataset.id;
          if (articleId && !articleId.startsWith("placeholder-")) {
            window.location.href = `depth.html?id=${articleId}`;
          }
        });
      });
    }
  }

  handleScroll() {
    const searchBar = document.querySelector(".search-bar");

    if (!searchBar) return;

    if (window.scrollY > 100) {
      searchBar.classList.add("fixed");
    } else {
      searchBar.classList.remove("fixed");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.website = new Website();
});
