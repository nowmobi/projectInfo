class CategoryPage {
  constructor() {
    this.articles = [];
    this.categories = [];
    this.init();
  }

  async init() {
    this.showLoadingState();

    await this.loadData();

    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");

    if (type) {
      const decodedType = decodeURIComponent(type);

      this.showArticlesByType(decodedType);
    } else {
      this.renderCategories();
    }
  }

  async loadData() {
    const maxRetries = 3;
    let retryCount = 0;
    const infoKey = "info1";

    while (retryCount < maxRetries) {
      try {
        const data = await window.fetchDbData();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Invalid or empty data received");
        }

        const processed = this.processData(data, infoKey);

        if (processed.articles.length === 0) {
          throw new Error("No articles found in dataset");
        }

        this.articles = processed.articles;
        this.categories = processed.categories;
        try {
          localStorage.setItem("cachedArticles", JSON.stringify(data));
          localStorage.setItem("cachedArticlesTimestamp", Date.now());
        } catch (e) {}
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          this.showError(
            `Failed to load articles after ${maxRetries} attempts. Please check your connection and refresh the page.`
          );
          this.loadFallbackData();
        } else {
          await new Promise((resolve) =>
            setTimeout(resolve, retryCount * 1000)
          );
        }
      }
    }
  }

  showError(message) {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
      categoryGrid.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">${message}</div>
                    <button class="retry-btn">Retry</button>
                </div>
            `;

      const retryBtn = categoryGrid.querySelector(".retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => this.retryLoadData());
      }
    }
  }

  async retryLoadData() {
    this.showLoadingState();
    await this.loadData();
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");
    if (type) {
      this.showArticlesByType(decodeURIComponent(type));
    } else {
      this.renderCategories();
    }
  }

  showLoadingState() {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
      categoryGrid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-icon">⏳</div>
                    <div class="loading-text">Loading articles...</div>
                </div>
            `;
    }
  }

  loadFallbackData() {
    const cachedData = localStorage.getItem("cachedArticles");
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        const processed = this.processData(parsedData);
        if (processed.articles.length > 0) {
          this.articles = processed.articles;
          this.categories = processed.categories;
          this.showCacheNotice();
          return;
        }
      } catch (e) {}
    }
    this.showDefaultCategories();
  }

  showCacheNotice() {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
      categoryGrid.innerHTML = `
                <div class="cache-notice">
                    <div class="notice-icon">📋</div>
                    <div class="notice-text">Showing cached data</div>
                    <div class="notice-subtext">Some content may be outdated</div>
                    <button class="refresh-btn">Refresh Now</button>
                </div>
            `;
      const refreshBtn = categoryGrid.querySelector(".refresh-btn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => this.refreshData());
      }
    }
    this.renderCategories();
  }

  showDefaultCategories() {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
      categoryGrid.innerHTML = `
                <div class="default-categories">
                    <div class="default-icon">📚</div>
                    <div class="default-text">Default Categories</div>
                    <div class="default-subtext">Please check your connection and try again</div>
                    <button class="refresh-btn">Refresh Now</button>
                </div>
            `;

      const refreshBtn = categoryGrid.querySelector(".refresh-btn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => this.refreshData());
      }
    }
  }

  async refreshData() {
    this.showLoadingState();
    await this.loadData();

    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");
    if (type) {
      this.showArticlesByType(decodeURIComponent(type));
    } else {
      this.renderCategories();
    }
  }

  extractCategoriesFromArticles(articles = this.articles) {
    const categoryMap = new Map();

    articles.forEach((article) => {
      if (article.type && !categoryMap.has(article.type)) {
        categoryMap.set(article.type, {
          id: article.type,
          name: article.type,
          count: 1,
        });
      } else if (article.type) {
        categoryMap.get(article.type).count++;
      }
    });

    return Array.from(categoryMap.values());
  }

  processData(data, infoKey = "info1") {
    if (!Array.isArray(data) || data.length === 0) {
      return { articles: [], categories: [] };
    }

    const [meta, ...rest] = data;
    const articles = Array.isArray(rest)
      ? rest.filter((item) => item && item.id)
      : [];

    const extractedCategories = this.extractCategoriesFromArticles(articles);

    if (meta && Array.isArray(meta[infoKey])) {
      const extractedMap = new Map(
        extractedCategories.map((item) => [item.name, item])
      );
      const ordered = meta[infoKey]
        .map((name) => extractedMap.get(name))
        .filter((item) => item && item.count > 0);

      if (ordered.length > 0) {
        return { articles, categories: ordered };
      }
    }

    return { articles, categories: extractedCategories };
  }

  showArticlesByType(type) {
    const decodedType = decodeURIComponent(type);
    const filteredArticles = this.articles.filter(
      (article) => article.type === decodedType
    );

    if (filteredArticles.length === 0) {
      const caseInsensitiveFiltered = this.articles.filter(
        (article) =>
          article.type &&
          article.type.toLowerCase() === decodedType.toLowerCase()
      );

      if (caseInsensitiveFiltered.length > 0) {
        this.renderArticles(caseInsensitiveFiltered, decodedType);
        return;
      }
    }
    this.renderArticles(filteredArticles, decodedType);
  }

  renderArticles(articles, categoryName) {
    document.querySelector(".category-grid").style.display = "none";
    const articlesSection = document.getElementById("currentCategoryArticles");
    const articlesContainer = document.getElementById(
      "categoryArticlesContainer"
    );

    if (!articlesSection || !articlesContainer) {
      console.error("Required elements not found:", {
        articlesSection: !!articlesSection,
        articlesContainer: !!articlesContainer,
      });
      return;
    }

    articlesSection.style.display = "block";

    if (articles.length === 0) {
      articlesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No articles in this category</div>
                    <div class="empty-state-subtext">Please select another category or check back later</div>
                </div>
            `;
      return;
    }

    const sortedArticles = articles.sort((a, b) => b.id - a.id);
    const articlesHTML = `
            <div class="category-section">
                <h4 class="category-section-title">${categoryName}</h4>
                <div class="category-articles-grid">
                    ${sortedArticles
                      .map(
                        (article) => `
                        <div class="article-card" data-id="${article.id}">
                            <div class="article-image">
                                <img src="${this.getArticleImagePath(
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
                                <div class="article-meta">
                                    <span class="article-type">${
                                      this.truncateString(article.type || "", 10)
                                    }</span>
                                    <span class="article-time">${
                                      Utils.formatTimestamp(
                                        article.create_time
                                      ) || ""
                                    }</span>
                                </div>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;

    articlesContainer.innerHTML = articlesHTML;
    this.bindArticleEvents();
  }

  getArticleImagePath(article) {
    if (!article || !article.img) return "";

    const imgPath = article.img;

    if (/^(https?:)?\/\//.test(imgPath)) {
      return imgPath;
    }

    const articleId = article.id ? String(article.id) : "";

    if (imgPath.startsWith("finace/")) {
      return `${window.DataConfig.baseUrl}/${imgPath.replace(/^finace\//, "")}`;
    }

    if (articleId) {
      return `${window.DataConfig.baseUrl}/${articleId}/${imgPath}`;
    }

    return `${window.DataConfig.baseUrl}/${imgPath}`;
  }

  truncateString(str, maxLength) {
    if (!str || str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + "...";
  }

  renderCategories() {
    const categoryGrid = document.querySelector(".category-grid");
    if (!categoryGrid) return;

    const orderedCategories = this.categories;

    if (!orderedCategories || orderedCategories.length === 0) {
      categoryGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No categories available</div>
                    <div class="empty-state-subtext">Please check back later</div>
                </div>
            `;
      return;
    }

    categoryGrid.innerHTML = orderedCategories
      .map(
        (category) => `
            <div class="category-card" data-category="${category.name}">
                <div class="category-card-content">
                    <h3 class="category-card-title">${category.name}</h3>
                    <p class="category-card-count">
                        ${category.count} articles
                    </p>
                </div>
                <div class="category-card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                     </svg>
                 </div>
             </div>
         `
      )
      .join("");

    this.bindCategoryEvents();
  }

  bindCategoryEvents() {
    const categoryCards = document.querySelectorAll(".category-card");
    categoryCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const categoryName = card.dataset.category;

        this.showArticlesByType(categoryName);
      });
    });
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(".article-card");
    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        window.location.href = `../detail.html?id=${articleId}`;
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CategoryPage();
});
