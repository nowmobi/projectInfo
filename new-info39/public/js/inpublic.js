// 使用 ES6 模块导入
import {
  getCategoryOrder,
  Category_URL,
  BASE_URL,
  getImgUrl,
  fetchArticlesWithCache,
  apiCache
} from "./BaseURL.js";

class HealthNewsApp {
  constructor() {
    this.currentCategory = "all";
    this.articles = [];
    this.categories = [];
    this._initPromise = this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.initSidebar();
    this.renderCategories();
    this.renderArticles();
    this.initCarousel();
  }

  async loadData() {
    try {
      
      const data = await fetchArticlesWithCache();
      // 确保this.articles是一个数组
      if (Array.isArray(data)) {
        this.articles = data;
      } else if (data && Array.isArray(data.data)) {
        this.articles = data.data;
      } else if (data && Array.isArray(data.articles)) {
        this.articles = data.articles;
      } else {
        this.articles = [];
      }

      await this.generateCategoriesFromArticles();

      this.renderArticles();
    } catch (error) {
      
      this.articles = [];
      this.categories = [];

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

  async generateCategoriesFromArticles() {
   
    const categoryOrder = await getCategoryOrder();
    

   
    const typeSet = new Set();
    this.articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });
    

   
    const filteredTypes = categoryOrder.filter((type) => typeSet.has(type));
    

   
    const finalTypes = filteredTypes.length > 0 ? filteredTypes : Array.from(typeSet);
    

    this.categories = [
      ...finalTypes.map((type) => ({
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
    const emptyState = document.getElementById("emptyState");
    const carouselContainer = document.querySelector(".carousel-container");

    if (searchResultsBar && searchResultsCount && searchQuery) {
      searchResultsCount.textContent = count;
      searchQuery.textContent = query;
      searchResultsBar.style.display = "flex";
    }

    if (carouselContainer) {
      carouselContainer.style.display = "none";
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
    const carouselContainer = document.querySelector(".carousel-container");
    
    if (searchResultsBar) {
      searchResultsBar.style.display = "none";
    }
    
    if (carouselContainer) {
      carouselContainer.style.display = "block";
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

  switchCategory(category) {
    this.currentCategory = category;

    document.querySelectorAll(".sidebar-item").forEach((cat) => {
      cat.classList.remove("active");
      if (cat.dataset.page === category) {
        cat.classList.add("active");
      }
    });

    this.renderArticles();
  }

  renderCategories() {
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

   
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const categoryPath = isInPagesFolder
      ? "category.html"
      : "pages/category.html";

    const sidebarCategoriesHtml = this.categories
      .filter((category) => category.id !== "all")
      .map(
        (category) => `
        <a href="${categoryPath}?type=${encodeURIComponent(category.name)}" 
           class="sidebar-item" 
           data-page="${category.id}">
          <span>${category.name}</span>
        </a>
      `
      )
      .join("");

    sidebarCategories.innerHTML = sidebarCategoriesHtml;

    this.bindSidebarCategoryEvents();
  }

  bindSidebarCategoryEvents() {
    const sidebarCategories = document.querySelectorAll(".sidebar-item");

    sidebarCategories.forEach((category) => {
      category.addEventListener("click", (e) => {
        const categoryId = e.currentTarget.dataset.page;
        
       
        if (categoryId === "home" || categoryId === "all") {
          e.preventDefault();
          this.switchCategory(categoryId);
          
          sidebarCategories.forEach((cat) => cat.classList.remove("active"));
          e.currentTarget.classList.add("active");
        } else {
         
         
        }
      });
    });
  }

  truncateTextToLines(text, maxLines = 4) {
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
  }

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
  }

  getCategoryIconByType(type) {
    const mentalHealthIcon =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="2"/></svg>';

    const iconMap = {
      "Health Management": mentalHealthIcon,
      "Beauty & Wellness": mentalHealthIcon,
      "Beauty \\u0026 Wellness": mentalHealthIcon,
      "Emergency & Safety": mentalHealthIcon,
      "Emergency \\u0026 Safety": mentalHealthIcon,
      Lifestyle: mentalHealthIcon,
      "Medical Care": mentalHealthIcon,
      Technology: mentalHealthIcon,
      "Mental Health": mentalHealthIcon,
      Nutrition: mentalHealthIcon,
      Environment: mentalHealthIcon,
    };

    return iconMap[type] || mentalHealthIcon;
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
        <div class="category-section">
          <div class="category-section-header">
            <h2 class="category-section-title">${categoryName}</h2>
          </div>
          <div class="category-section-articles">
            ${categoryArticles
              .map(
                (article) => `
              <div class="article-card-simple" data-id="${article.id}">
                <div class="article-content-simple">
                  <h3 class="article-title-simple">${this.truncateTextToLines(
                    article.title,
                    2
                  )}</h3>
                  <div class="article-author-simple">${article.author || 'Unknown Author'}</div>
                </div>
                <div class="article-image-simple">
                  <img src="${getImgUrl(article)}" alt="${
                  article.title
                }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                  <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, ${Utils.getCSSVariable("--primary-background-gradient-start", "#746097")} 0%, ${Utils.getCSSVariable("--primary-background-gradient-end", "#7bb3d4")} 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
                    <div>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                        <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                      </svg>
                      <div>Image</div>
                      <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
                    </div>
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
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

    
    
    

    const categories = this.categories.filter((cat) => cat.id !== "all");
    

    const priorityImages = [];
    let imageCount = 0;
    let globalImageIndex = 0;

    categories.forEach((category) => {
      if (imageCount >= 6) return;
      const articles = this.getArticlesByCategory(category.id, 4);
      
      articles.forEach((article) => {
        if (imageCount < 6 && article.img) {
          priorityImages.push(getImgUrl(article));
          imageCount++;
        }
      });
    });

    this.preloadImages(priorityImages);

    const categorySections = [];

    // Exclude 'suggest' category
    categories.filter(category => category.name !== 'suggest').forEach((category) => {
      const articles = this.getArticlesByCategory(category.id, 4);
      if (articles.length === 0) return;

      const categoryHtml = `
        <div class="category-section">
          <div class="category-section-header" data-category="${
            category.name
          }" style="cursor: pointer;">
            <h2 class="category-section-title">${category.name}</h2>
          </div>
          <div class="category-section-articles">
            ${articles
              .map((article) => {
                const isPriority = globalImageIndex < 6;
                globalImageIndex++;

                return `
                <div class="article-card-simple" data-id="${article.id}">
                  <div class="article-content-simple">
                    <h3 class="article-title-simple">${this.truncateTextToLines(
                      article.title,
                      3
                    )}</h3>
                    <div class="article-author-simple">${article.author || 'Unknown Author'}</div>
                  </div>
                  <div class="article-image-simple">
                    ${this.renderImageWithPriority(article, isPriority)}
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
      `;

      categorySections.push(categoryHtml);
    });

    
    this.insertCategoriesIntoContainers(categorySections, categoriesContainer);

    this.bindArticleEvents();

    this.bindCategoryTitleEvents();

    this.initLazyLoading();
  }

  insertCategoriesIntoContainers(categorySections, categoriesContainer) {
    let currentIndex = 0;
    const existingContainers = 
      categoriesContainer.querySelectorAll(".home_article-item");

    // Get categories and their articles, excluding 'suggest' category
    const categories = (this.categories || []).filter(category => category.name !== 'suggest');
    const articlesByCategory = {};
    
    this.articles.forEach(article => {
      const category = article.type || '未分类';
      if (category !== 'suggest' && !articlesByCategory[category]) {
        articlesByCategory[category] = [];
      }
      if (category !== 'suggest') {
        articlesByCategory[category].push(article);
      }
    });

    let categoryIndex = 0;
    existingContainers.forEach((container, index) => {
      if (categoryIndex < categories.length) {
        const category = categories[categoryIndex];
        const categoryName = category.name;
        const categoryArticles = articlesByCategory[categoryName] || [];
        
        if ([0, 2, 4, 6].includes(index)) {
          // For 1st, 3rd, 5th, 7th containers, use horizontal scroll style
          container.innerHTML = this.generateHorizontalScrollCategory(categoryName, categoryArticles);
        } else {
          // For 2nd, 4th, 6th containers, use list style
          // Count existing article-card-simple elements in the container
          const existingCards = container.querySelectorAll(".article-card-simple").length;
          if (existingCards > 0) {
            // Check if the container already has a category-section
            if (!container.querySelector('.category-section')) {
              // Get the original content including text nodes
              const originalContent = container.innerHTML;
              // Generate category section with the same number of articles as existing cards
              const categorySection = this.generateCategorySection(categoryName, categoryArticles, existingCards);
              // Create a temporary element to hold the category section
              const tempElement = document.createElement('div');
              tempElement.innerHTML = categorySection;
              // Get the category-section-articles element
              const articlesContainer = tempElement.querySelector('.category-section-articles');
              if (articlesContainer) {
                // Get all generated article cards
                const generatedCards = Array.from(articlesContainer.children);
                // Replace the article-card-simple placeholders with generated cards
                let newContent = originalContent;
                generatedCards.forEach((card, cardIndex) => {
                  newContent = newContent.replace(/<div class="article-card-simple">\s*<\/div>/, card.outerHTML);
                });
                // Create a new category section with the modified content
                const newCategorySection = `
                  <div class="category-section">
                    <div class="category-section-header">
                      <h2 class="category-section-title">${categoryName}</h2>
                    </div>
                    <div class="category-section-articles">
                      ${newContent}
                    </div>
                  </div>
                `;
                // Update the container
                container.innerHTML = newCategorySection;
              }
            }
          }
        }
        
        categoryIndex++;
      }
    });
  }

  generateCategorySection(categoryName, articles, maxArticles = 4) {
    // Limit the number of articles to maxArticles
    const limitedArticles = articles.slice(0, maxArticles);
    return `
      <div class="category-section">
        <div class="category-section-header">
          <h2 class="category-section-title">${categoryName}</h2>
        </div>
        <div class="category-section-articles">
          ${limitedArticles
            .map(
              (article) => `
            <div class="article-card-simple" data-id="${article.id}">
              <div class="article-content-simple">
                <h3 class="article-title-simple">${this.truncateTextToLines(
                  article.title,
                  2
                )}</h3>
                <div class="article-author-simple">${article.author || 'Unknown Author'}</div>
              </div>
              <div class="article-image-simple">
                <img src="${getImgUrl(article)}" alt="${
                  article.title
                }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, ${Utils.getCSSVariable("--primary-background-gradient-start", "#746097")} 0%, ${Utils.getCSSVariable("--primary-background-gradient-end", "#7bb3d4")} 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
                  <div>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                      <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                    </svg>
                    <div>Image</div>
                    <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
                  </div>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  generateHorizontalScrollCategory(categoryName, articles) {
    // Generate horizontal scroll HTML
    let articlesHtml = '';
    articles.forEach((article) => {
      const articleId = article.id;
      const title = article.title;
      const image = getImgUrl(article);
      
      articlesHtml += `
        <div class="horizontal-article-card" data-id="${articleId}">
          <div class="horizontal-article-image">
            <img src="${image}" alt="${title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #746097 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
              <div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                  <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                </svg>
                <div>Image</div>
                <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
              </div>
            </div>
            <div class="horizontal-article-overlay">
              <h3 class="horizontal-article-title">${title}</h3>
            </div>
          </div>
        </div>
      `;
    });
    
    return `
      <div class="horizontal-scroll-category">
        <div class="horizontal-scroll-header">
          <h2 class="category-section-title">${categoryName}</h2>
        </div>
        <div class="horizontal-scroll-container">
          ${articlesHtml}
        </div>
      </div>
    `;
  }

  preloadImages(imageUrls) {
    imageUrls.forEach((url) => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }

  renderImageWithPriority(article, isPriority) {
    if (isPriority) {
      return `
        <img src="${getImgUrl(article)}" 
             alt="${article.title}" 
             class="priority-image"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, ${Utils.getCSSVariable("--primary-background-gradient-start", "#746097")} 0%, ${Utils.getCSSVariable("--primary-background-gradient-end", "#7bb3d4")} 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
          <div>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
              <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
            </svg>
            <div>Image</div>
            <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
          </div>
        </div>
      `;
    } else {
      return `
        <img data-src="${getImgUrl(article)}" 
             alt="${article.title}" 
             class="lazy-image"
             style="opacity: 0; transition: opacity 0.3s;"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="placeholder-image" style="display: flex; width: 100%; height: 100%; background: linear-gradient(135deg, ${Utils.getCSSVariable("--primary-background-gradient-start", "#746097")} 0%, ${Utils.getCSSVariable("--primary-background-gradient-end", "#7bb3d4")} 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
          <div>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
              <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
            </svg>
            <div>Loading...</div>
          </div>
        </div>
      `;
    }
  }

  initLazyLoading() {
    const lazyImages = document.querySelectorAll(".lazy-image");

    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              const src = img.getAttribute("data-src");

              if (src) {
                img.src = src;
                img.onload = () => {
                  img.style.opacity = "1";
                  img.nextElementSibling.style.display = "none";
                };
                img.removeAttribute("data-src");
                img.classList.remove("lazy-image");
                observer.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: "50px 0px",
          threshold: 0.01,
        }
      );

      lazyImages.forEach((img) => imageObserver.observe(img));
    } else {
      lazyImages.forEach((img) => {
        const src = img.getAttribute("data-src");
        if (src) {
          img.src = src;
          img.style.opacity = "1";
          img.nextElementSibling.style.display = "none";
        }
      });
    }
  }

  getArticlesByCategory(categoryId, limit = 4) {
    return this.articles
      .filter((article) => {
        const articleTypeId = article.type
          ? article.type.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "")
          : "";
        return articleTypeId === categoryId;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }


  bindArticleEvents() {
    const articleCards = document.querySelectorAll(".article-card-simple");

    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;

        if (articleId) {
          const detailUrl =
            `./detail.html?id=${articleId}` +
            (window.channel ? "&channel=" + window.channel : "");
          window.location.href = detailUrl;
        }
      });
    });

    // Add click events for horizontal article cards
    const horizontalArticleCards = document.querySelectorAll(".horizontal-article-card");

    horizontalArticleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;

        if (articleId) {
          const detailUrl =
            `./detail.html?id=${articleId}` +
            (window.channel ? "&channel=" + window.channel : "");
          window.location.href = detailUrl;
        }
      });
    });
  }

  bindCategoryTitleEvents() {
    const categoryHeaders = document.querySelectorAll(
      ".category-section-header"
    );
    categoryHeaders.forEach((header) => {
      header.addEventListener("click", (e) => {
        const categoryName = header.dataset.category;
        if (categoryName) {
          const encodedCategoryName = encodeURIComponent(categoryName);
          const categoryUrl =
            `pages/category.html?type=${encodedCategoryName}` +
            (window.channel ? "&channel=" + window.channel : "");
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

  getRecommendedArticles(currentId, limit = 3) {
   
    if (!currentId || currentId === null || currentId === undefined || String(currentId).trim() === '') {
      
      return [];
    }

    return this.articles
      .filter((article) => {
       
        const articleId = article.id;
        const isValidId = articleId !== null && 
                          articleId !== undefined && 
                          articleId !== '' && 
                          String(articleId).trim() !== '' &&
                          !isNaN(Number(articleId));
        
       
        const isNotCurrent = String(articleId) !== String(currentId);
        
        return isValidId && isNotCurrent;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
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

  showRecommendedArticles() {
    const recommendedContainer = document.querySelector('#recommendedArticles');
    if (!recommendedContainer) return;

    // Get all valid articles
    const validArticles = this.articles.filter((article) => {
      const articleId = article.id;
      const isValidId = articleId !== null && 
                        articleId !== undefined && 
                        articleId !== '' && 
                        String(articleId).trim() !== '' &&
                        !isNaN(Number(articleId));
      return isValidId;
    });

    if (validArticles.length === 0) {
      recommendedContainer.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无推荐文章</div></div>';
      return;
    }

    // Shuffle and get 3 random articles
    const shuffledArticles = validArticles.sort(() => Math.random() - 0.5);
    const recommended = shuffledArticles.slice(0, 3);

    const recommendedHtml = recommended.map((article) => {
      const imageUrl = article.image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=news%20article%20placeholder&image_size=square';
      return `
        <div class="article-card-simple" data-article-id="${article.id}">
          <h3 class="article-title-simple">${this.truncateTextToLines(article.title, 2)}</h3>
          <div class="article-image-simple">
            <img src="${imageUrl}" alt="${article.title}">
          </div>
        </div>
      `;
    }).join('');

    recommendedContainer.innerHTML = recommendedHtml;

    // Add click event listeners
    const recommendedCards = document.querySelectorAll('#recommendedArticles .article-card-simple');
    recommendedCards.forEach((card) => {
      card.addEventListener('click', (e) => {
        const articleId = e.currentTarget.getAttribute('data-article-id');
        if (articleId) {
          window.location.href = `detail.html?id=${articleId}`;
        }
      });
    });
  }

  initCarousel() {
    const carousel = document.querySelector('#articleCarousel');
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    
    if (!carousel || !indicatorsContainer) return;
    
    // Get all valid articles
    const validArticles = this.articles.filter((article) => {
      const articleId = article.id;
      const isValidId = articleId !== null && 
                        articleId !== undefined && 
                        articleId !== '' && 
                        String(articleId).trim() !== '' &&
                        !isNaN(Number(articleId));
      return isValidId;
    });

    if (validArticles.length === 0) {
      carousel.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无推荐文章</div></div>';
      return;
    }

    // Shuffle and get 5 random articles
    const shuffledArticles = validArticles.sort(() => Math.random() - 0.5);
    const carouselArticles = shuffledArticles.slice(0, 5);

    // Generate carousel slides
    const slidesHtml = carouselArticles.map((article) => {
      const imageUrl = article.img || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=news%20article%20placeholder&image_size=landscape_16_9';
      return `
        <div class="carousel-slide" data-article-id="${article.id}">
          <img src="${imageUrl}" alt="${article.title}">
        </div>
      `;
    }).join('');

    // Add a copy of the first slide at the end for seamless transition
    if (carouselArticles.length > 0) {
      const firstArticle = carouselArticles[0];
      const firstSlideHtml = `
        <div class="carousel-slide" data-article-id="${firstArticle.id}">
          <img src="${firstArticle.img || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=news%20article%20placeholder&image_size=landscape_16_9'}" alt="${firstArticle.title}">
        </div>
      `;
      carousel.innerHTML = slidesHtml + firstSlideHtml;
    } else {
      carousel.innerHTML = slidesHtml;
    }
    
    const slides = document.querySelectorAll('.carousel-slide');
    let currentIndex = 0;
    const slideCount = slides.length - 1; // Exclude the duplicate slide
    
    // Clear existing indicators
    indicatorsContainer.innerHTML = '';
    
    // Create indicators (only for the original slides)
    for (let i = 0; i < slideCount; i++) {
      const indicator = document.createElement('div');
      indicator.classList.add('carousel-indicator');
      if (i === 0) indicator.classList.add('active');
      indicator.addEventListener('click', () => {
        currentIndex = i;
        updateCarousel();
      });
      indicatorsContainer.appendChild(indicator);
    }
    
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    function updateCarousel() {
      // Ensure the carousel has the correct width
      carousel.style.width = '100%';
      
      // Calculate the exact position to move the carousel
      const slideWidth = carousel.offsetWidth;
      carousel.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
      carousel.style.transition = 'transform 0.5s ease';
      
      // Update indicators
      indicators.forEach((indicator, index) => {
        if (index === currentIndex % slideCount) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });
    }
    
    function nextSlide() {
      currentIndex++;
      
      if (currentIndex >= slideCount) {
        // When we reach the duplicate slide, reset to the first slide without transition
        setTimeout(() => {
          carousel.style.transition = 'none';
          currentIndex = 0;
          // Calculate the exact position to reset the carousel
          const slideWidth = carousel.offsetWidth;
          carousel.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
        }, 500);
      }
      
      updateCarousel();
    }
    
    // Initialize the carousel
    updateCarousel();
    
    // Auto slide
    setInterval(nextSlide, 5000);

    // Add click event listeners to slides
    slides.forEach((slide) => {
      slide.addEventListener('click', (e) => {
        const articleId = e.currentTarget.getAttribute('data-article-id');
        if (articleId) {
          window.location.href = `detail.html?id=${articleId}`;
        }
      });
    });
  }
}

// 页面初始化逻辑已移至文件末尾

// 工具函数
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

 
  getCSSVariable(variableName, defaultValue = "") {
    if (typeof document === "undefined") return defaultValue;
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
    return value || defaultValue;
  },
};

// 导出到全局
window.Utils = Utils;
window.HealthNewsApp = HealthNewsApp;

// 导出类和函数供其他模块使用
export { HealthNewsApp, Utils };

// 回到顶部功能
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

// 页面初始化逻辑已移至文件末尾

// 搜索功能初始化
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

      if (window.healthNewsApp) {
        window.healthNewsApp.clearSearch();
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (!searchBar.contains(e.target) && !searchToggleBtn.contains(e.target)) {
      searchBar.style.display = "none";
    }
  });

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      searchClear.style.display = "block";

      if (window.healthNewsApp) {
        window.healthNewsApp.handleSearch(query);
      }
    } else {
      searchClear.style.display = "none";

      if (window.healthNewsApp) {
        window.healthNewsApp.clearSearch();
      }
    }
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.style.display = "none";
    searchInput.focus();

    if (window.healthNewsApp) {
      window.healthNewsApp.clearSearch();
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchBar.style.display = "none";
      searchToggleBtn.focus();
    }
  });
}

// 基础页面类 - 用于Privacy和About页面
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
    this.bindBackHomeButton();
  }

  bindBackHomeButton() {
    const backHomeButtons = document.querySelectorAll(".back-home-btn");
    backHomeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSmartBack();
      });
    });
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
   
    const currentPath = window.location.pathname;
    const isInPagesFolder = currentPath.includes("/pages/");
    const isDetailPage = currentPath.includes("detail.html");
    
   
    const homePath = isDetailPage ? "index.html" : (isInPagesFolder ? "../index.html" : "index.html");

    window.location.href =
      homePath +
      (window.channel ? "?channel=" + window.channel : "");
  }
}

// PrivacyPage 类
class PrivacyPage extends BasePage {
  constructor() {
    super();
   
    this.loadCategoriesForSidebar();
  }

  async loadCategoriesForSidebar() {
   
    if (!window.healthNewsApp) {
      window.healthNewsApp = new HealthNewsApp();
     
      await window.healthNewsApp._initPromise;
    }
   
    if (window.healthNewsApp && window.healthNewsApp.categories) {
      window.healthNewsApp.renderSidebarCategories();
    }
  }
}

// AboutPage 类
class AboutPage extends BasePage {
  constructor() {
    super();
   
    this.loadCategoriesForSidebar();
  }

  async loadCategoriesForSidebar() {
   
    if (!window.healthNewsApp) {
      window.healthNewsApp = new HealthNewsApp();
     
      await window.healthNewsApp._initPromise;
    }
   
    if (window.healthNewsApp && window.healthNewsApp.categories) {
      window.healthNewsApp.renderSidebarCategories();
    }
  }
}

// 页面初始化 - 根据当前页面路径初始化相应的页面类
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split("/").pop() || currentPath;

 
  if (typeof ThemeApplier !== "undefined") {
    const themeApplier = new ThemeApplier();
   
   
    if (themeApplier && typeof themeApplier.applyThemeColor === "function") {
      themeApplier.applyThemeColor();
    }
  } else if (typeof ThemeColors !== "undefined" && ThemeColors.primary) {
   
    const themeColor = ThemeColors.primary.background;
    if (themeColor) {
      document.documentElement.style.setProperty("--primary", themeColor);
    }
  }

 
  if (currentPage.includes("privacy.html")) {
    new PrivacyPage();
  } else if (currentPage.includes("about.html")) {
    new AboutPage();
  } else if (currentPage.includes("index.html") || currentPage === "" || currentPage === "/") {
    window.healthNewsApp = new HealthNewsApp();
  }
 

 
  new BackToTop();

 
  if (currentPage.includes("index.html") || currentPage === "" || currentPage === "/") {
    initSearchFunctionality();
  }

 
  addChannelToLinks();
});

// 为所有链接添加 channel 参数的公共函数
function addChannelToLinks() {
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

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (!window.healthNewsApp) {
      window.healthNewsApp = new HealthNewsApp();
    }
  });
} else {
  if (!window.healthNewsApp) {
    window.healthNewsApp = new HealthNewsApp();
  }
}
