// 导入 Category_URL 和 IMG_BASE_URL
import { Category_URL, IMG_BASE_URL } from "./BaseURL.js";

// 分类页特定脚本
class CategoryPage {
  constructor() {
    this.currentCategory = null;
    this.articles = [];
    this.categories = [];
    this.init();
  }

  async init() {
    // 显示加载状态
    this.showLoadingState();

    await this.loadData();
    this.setupEventListeners();

    // 检查URL参数，如果有type参数则直接显示文章，否则显示分类
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type");

    if (type) {
      // 解码URL参数（处理空格和特殊字符）
      const decodedType = decodeURIComponent(type);
      this.showArticlesByType(decodedType);
    } else {
      this.renderCategories();
    }
  }

  async loadData() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // 从远程加载文章数据
        const response = await fetch(Category_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 验证数据完整性
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Invalid or empty data received");
        }

        this.articles = data;

        // 从文章数据中提取分类
        this.categories = this.extractCategoriesFromArticles();

        // 缓存数据到localStorage
        try {
          localStorage.setItem("cachedArticles", JSON.stringify(data));
          localStorage.setItem("cachedArticlesTimestamp", Date.now());
        } catch (e) {}

        // 数据加载成功，跳出重试循环
        break;
      } catch (error) {
        retryCount++;

        if (retryCount >= maxRetries) {
          // 所有重试都失败了
          this.showError(
            `Failed to load articles after ${maxRetries} attempts. Please check your connection and refresh the page.`
          );

          // 尝试从缓存或备用数据源加载
          this.loadFallbackData();
        } else {
          // 等待一段时间后重试
          await new Promise((resolve) =>
            setTimeout(resolve, retryCount * 1000)
          );
        }
      }
    }
  }

  setupEventListeners() {
    // 搜索功能
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      const debouncedSearch = Utils.debounce((query) => {
        this.handleSearch(query);
      }, 300);

      searchInput.addEventListener("input", (e) => {
        debouncedSearch(e.target.value);
      });
    }

    // 初始化侧边栏功能
    this.initSidebar();

    // 绑定智能返回按钮
    this.bindSmartBackButton();
  }

  // 初始化侧边栏
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

    // 绑定侧边栏导航事件
    this.bindSidebarNavigation();
  }

  // 绑定侧边栏导航事件
  bindSidebarNavigation() {
    const sidebarItems = document.querySelectorAll(".sidebar-item");

    sidebarItems.forEach((item) => {
      const href = item.getAttribute("href");

      item.addEventListener("click", (e) => {
        e.preventDefault(); // 阻止默认行为

        // 检查是否是分类链接
        if (href && href.includes("category.html?type=")) {
          const urlParams = new URLSearchParams(href.split("?")[1]);
          const type = urlParams.get("type");

          if (type) {
            // 直接调用显示文章方法，而不是跳转
            this.showArticlesByType(type);
            this.closeSidebar();
            return;
          }
        }

        // 其他链接正常跳转
        if (href) {
          window.location.href = href;
        }

        // 延迟关闭侧边栏，确保跳转优先执行
        setTimeout(() => {
          this.closeSidebar();
        }, 100);
      });
    });
  }

  // 打开侧边菜单
  openSidebar() {
    const sidebarMenu = document.getElementById("sidebarMenu");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    if (sidebarMenu) {
      sidebarMenu.classList.add("active");
      document.body.style.overflow = "hidden"; // 防止背景滚动
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.add("active");
    }
    // 绑定Esc关闭
    this.bindEscToClose();
  }

  // 关闭侧边菜单
  closeSidebar() {
    const sidebarMenu = document.getElementById("sidebarMenu");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    if (sidebarMenu) {
      sidebarMenu.classList.remove("active");
      document.body.style.overflow = ""; // 恢复背景滚动
    }
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove("active");
    }
    // 解绑Esc
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

  // 显示错误信息
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

      // 绑定重试按钮事件
      const retryBtn = categoryGrid.querySelector(".retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => this.retryLoadData());
      }
    }
  }

  // 重试加载数据
  async retryLoadData() {
    this.showLoadingState();
    await this.loadData();
  }

  // 显示加载状态
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

  // 加载备用数据
  loadFallbackData() {
    // 尝试从localStorage加载缓存数据
    const cachedData = localStorage.getItem("cachedArticles");
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          this.articles = parsedData;
          this.categories = this.extractCategoriesFromArticles();

          // 显示缓存数据提示
          this.showCacheNotice();
          return;
        }
      } catch (e) {
        console.error("Failed to parse cached data:", e);
      }
    }

    // 如果没有缓存数据，显示默认分类
    this.showDefaultCategories();
  }

  // 显示缓存数据提示
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

      // 绑定刷新按钮事件
      const refreshBtn = categoryGrid.querySelector(".refresh-btn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => this.refreshData());
      }
    }

    // 渲染分类
    this.renderCategories();
  }

  // 显示默认分类
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

      // 绑定刷新按钮事件
      const refreshBtn = categoryGrid.querySelector(".refresh-btn");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => this.refreshData());
      }
    }
  }

  // 刷新数据
  async refreshData() {
    this.showLoadingState();
    await this.loadData();
  }

  // 从文章数据中提取分类
  extractCategoriesFromArticles() {
    const categoryMap = new Map();

    this.articles.forEach((article) => {
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

  // 显示特定分类的文章
  showArticlesByType(type) {
    // 确保类型名称已正确解码
    const decodedType = decodeURIComponent(type);

    const filteredArticles = this.articles.filter(
      (article) => article.type === decodedType
    );

    // 如果过滤后没有文章，尝试更宽松的匹配
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

  // 渲染文章列表
  renderArticles(articles, categoryName) {
    // 隐藏分类网格
    document.querySelector(".category-grid").style.display = "none";

    // 显示文章列表区域
    const articlesSection = document.getElementById(
      "currentCategoryArticles"
    );
    const articlesContainer = document.getElementById(
      "categoryArticlesContainer"
    );

    if (!articlesSection || !articlesContainer) {
      return;
    }

    // 显示文章列表区域
    articlesSection.style.display = "block";

    // 渲染文章
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

    // 按id从大到小排序
    const sortedArticles = articles.sort((a, b) => b.id - a.id);

    const articlesHTML = sortedArticles
      .map(
        (article) => `
            <div class="article-card" data-id="${article.id}">
                <div class="article-image">
                    <img src="${this.getArticleImagePath(
                      article
                    )}" alt="${
          article.title
        }" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                </div>
                <div class="article-content">
                    <h3 class="article-title">${article.title}</h3>
                    <div class="article-meta">
                        <span class="article-type">${
                          article.type
                        }</span>
                        <span class="article-time">${this.formatDate(
                          article.create_time
                        )}</span>
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    articlesContainer.innerHTML = articlesHTML;

    // 绑定文章点击事件
    this.bindArticleEvents();
  }

  // 获取文章图片路径（使用CDN地址）
  getArticleImagePath(article) {
    // 如果传入的是字符串（旧的用法），则取 article.img
    const imgPath = typeof article === "string" ? article : article.img;
    const articleId = typeof article === "object" ? article.id : null;

    if (!imgPath) {
      return "https://via.placeholder.com/300x200?text=No+Image";
    }

    // 如果图片路径已经是完整URL，直接返回
    if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
      return imgPath;
    }

    // 使用 IMG_BASE_URL 构建远程图片地址
    if (articleId) {
      return IMG_BASE_URL.replace("/number/", `/${articleId}/`).replace(
        "number.png",
        imgPath
      );
    }

    // 其他情况返回占位图片
    return "https://via.placeholder.com/300x200?text=No+Image";
  }

  // 格式化日期
  formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  renderCategories() {
    const categoryGrid = document.querySelector(".category-grid");
    if (!categoryGrid) return;

    // 定义分类的固定顺序（654321）
    const categoryOrder = [
      "Mental Health",
      "Medical Care",
      "Lifestyle",
      "Emergency & Safety",
      "Beauty & Wellness",
      "Health Management",
    ];

    // 按照固定顺序过滤和排序分类
    const orderedCategories = categoryOrder
      .filter((type) => this.categories.some((cat) => cat.name === type))
      .map((type) => this.categories.find((cat) => cat.name === type));

    categoryGrid.innerHTML = orderedCategories
      .map(
        (category) => `
            <div class="category-card" data-category="${category.name}">
                <div class="category-card-icon">${this.getCategoryIcon(
                  category.name
                )}</div>
                <div class="category-card-content">
                    <h3 class="category-card-title">${
                      category.name
                    }</h3>
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

    // 绑定分类点击事件
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


  getCategoryIcon(categoryName) {
    const iconMap = {
      "All Categories":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" stroke-width="2"/></svg>',
      "Health Management":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 14C19 16.7614 16.7614 19 14 19H10C7.23858 19 5 16.7614 5 14V10C5 7.23858 7.23858 5 10 5H14C16.7614 5 19 7.23858 19 10V14Z" stroke="currentColor" stroke-width="2"/><path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2"/></svg>',
      "Beauty & Wellness":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" stroke-width="2"/></svg>',
      "Emergency & Safety":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" stroke-width="2"/></svg>',
      Lifestyle:
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2"/><path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2"/></svg>',
      "Medical Care":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 14C19 16.7614 16.7614 19 14 19H10C7.23858 19 5 16.7614 5 14V10C5 7.23858 7.23858 5 10 5H14C16.7614 5 19 7.23858 19 10V14Z" stroke="currentColor" stroke-width="2"/><path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2"/></svg>',
      "Mental Health":
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" stroke-width="2"/></svg>',
    };
    return iconMap[categoryName] || iconMap["All Categories"];
  }


  renderCategoryArticles(categoryName) {
    const articlesContainer = document.getElementById(
      "categoryArticlesContainer"
    );
    if (!articlesContainer) return;

    let articlesToShow;
    if (categoryName === "All Categories") {
      articlesToShow = this.articles;
    } else {
      articlesToShow = this.articles.filter(
        (article) => article.type === categoryName
      );
    }

    if (articlesToShow.length === 0) {
      articlesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No articles in this category</div>
                    <div class="empty-state-subtext">Please select another category or check back later</div>
                </div>
            `;
      return;
    }

    // 按id从大到小排序
    const sortedArticles = articlesToShow.sort((a, b) => b.id - a.id);

    articlesContainer.innerHTML = sortedArticles
      .map(
        (article) => `
             <div class="article-card" data-id="${article.id}">
                 <div class="article-image">
                     <img src="${this.getArticleImagePath(
                       article
                     )}" alt="${
          article.title
        }" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                 </div>
                 <div class="article-content">
                     <h3 class="article-title">${article.title}</h3>
                     <div class="article-meta">
                         <span class="article-type">${
                           article.type
                         }</span>
                         <span class="article-time">${this.formatDate(
                           article.create_time
                         )}</span>
                     </div>
                 </div>
             </div>
         `
      )
      .join("");

    // 绑定文章点击事件
    this.bindArticleEvents();
  }

  bindArticleEvents() {
    const articleCards = document.querySelectorAll(".article-card");
    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        window.location.href =
          `../detail.html?id=${articleId}` +
          (window.channel ? `&channel=${window.channel}` : "");
      });
    });
  }

  handleSearch(query) {
    if (!query.trim()) {
      if (this.currentCategory) {
        this.renderCategoryArticles(this.currentCategory);
      }
      return;
    }

    const filteredArticles = this.articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        (article.summary &&
          article.summary.toLowerCase().includes(query.toLowerCase())) ||
        article.type.toLowerCase().includes(query.toLowerCase())
    );

    if (this.currentCategory) {
      this.renderSearchResults(filteredArticles);
    }
  }

  renderSearchResults(filteredArticles) {
    const articlesContainer = document.getElementById(
      "categoryArticlesContainer"
    );
    if (!articlesContainer) return;

    if (filteredArticles.length === 0) {
      articlesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">No related articles found</div>
                    <div class="empty-state-subtext">Please try other search keywords</div>
                </div>
            `;
      return;
    }

    // 按id从大到小排序
    const sortedFilteredArticles = filteredArticles.sort(
      (a, b) => b.id - a.id
    );

    articlesContainer.innerHTML = sortedFilteredArticles
      .map(
        (article) => `
            <div class="article-card" data-id="${article.id}">
                <div class="article-image">
                    <img src="${this.getArticleImagePath(
                      article
                    )}" alt="${
          article.title
        }" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
                </div>
                <div class="article-content">
                    <h3 class="article-title">${article.title}</h3>
                    <div class="article-meta">
                        <span class="article-type">${
                          article.type
                        }</span>
                        <span class="article-time">${this.formatDate(
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


  // 绑定智能返回按钮
  bindSmartBackButton() {
    const backButton = document.getElementById("smartBackButton");
    if (backButton) {
      backButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSmartBack();
      });
    }
  }

  // 智能返回逻辑
  handleSmartBack() {
    // 统一返回首页
    window.location.href =
      "../index.html" +
      (window.channel ? `?channel=${window.channel}` : "");
  }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", async () => {
  // 初始化主题管理器
  if (
    typeof ThemeApplier !== "undefined" &&
    typeof ThemeColors !== "undefined"
  ) {
    if (!window.themeApplier) {
      window.themeApplier = new ThemeApplier();
      window.themeApplier.init();
    }
  }

  // 动态加载侧边栏分类
  if (typeof loadSidebarCategories !== "undefined") {
    await loadSidebarCategories();
  }

  new CategoryPage();
  if (typeof BackToTop !== "undefined") {
    new BackToTop();
  }
});

// Channel 处理
if (window.channel) {
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    // 排除已经有channel参数的链接，避免重复添加
    if (link.href && !link.href.includes("channel=")) {
      try {
        const url = new URL(link.href);
        url.searchParams.set("channel", window.channel);
        link.href = url.toString();
      } catch (e) {
        // 忽略无效的 URL
      }
    }
  });
}

// 导出 CategoryPage 类供其他模块使用
export { CategoryPage };

