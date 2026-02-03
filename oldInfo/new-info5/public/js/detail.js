// 导入 BaseURL、Category_URL 和 IMG_BASE_URL
import { BASE_URL, Category_URL, IMG_BASE_URL } from "./BaseURL.js";

class ArticleDetailPage {
  constructor() {
    this.articleId = this.getUrlParam("id");

   
    if (!this.articleId) {
      this.articleId = this.generateRandomArticleId();
    }

    this.init();
  }

  async init() {
   
    this.showPageLoading();

   
    this.ensureScrollable();

    try {
      await this.loadArticleDetail();
      this.setupEventListeners();
    } catch (error) {
    } finally {
     
      this.hidePageLoading();
    }
  }

 
  showPageLoading() {
   
    const mainContent = document.querySelector("main");
    if (mainContent) {
      mainContent.style.visibility = "hidden";
      mainContent.style.opacity = "0";
    }

   
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "pageLoadingOverlay";
    loadingOverlay.innerHTML = `
      <div class="page-loading-spinner"></div>
    `;
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;

    const style = document.createElement("style");
    style.textContent = `
      .page-loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--primary-background);
        border-radius: 50%;
        animation: page-spin 1s linear infinite;
      }
      @keyframes page-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(loadingOverlay);
  }

 
  hidePageLoading() {
    const loadingOverlay = document.getElementById("pageLoadingOverlay");
    if (loadingOverlay) {
     
      loadingOverlay.style.transition = "opacity 0.3s ease";
      loadingOverlay.style.opacity = "0";

      setTimeout(() => {
        loadingOverlay.remove();

       
        const mainContent = document.querySelector("main");
        if (mainContent) {
          mainContent.style.transition = "opacity 0.3s ease";
          mainContent.style.visibility = "visible";
          mainContent.style.opacity = "1";
          mainContent.style.height = "";
          mainContent.style.maxHeight = "";
          mainContent.style.overflow = "";
        }

       
        document.body.style.overflow = "";
        document.body.style.height = "";
        document.documentElement.style.overflow = "";
        document.documentElement.style.height = "";
      }, 300);
    }
  }

 
  ensureScrollable() {
   
    document.body.style.overflow = "";
    document.body.style.overflowY = "";
    document.body.style.height = "";
    document.body.style.maxHeight = "";
    document.documentElement.style.overflow = "";
    document.documentElement.style.overflowY = "";
    document.documentElement.style.height = "";
    document.documentElement.style.maxHeight = "";

   
    document.body.style.webkitOverflowScrolling = "touch";
  }

  async loadArticleDetail() {
    try {
     
      const healthsUrl = BASE_URL.replace("/number/", `/${this.articleId}/`);

      const healthsResponse = await fetch(healthsUrl);

      if (healthsResponse.ok) {
        const healthsData = await healthsResponse.json();

       
        if (!Array.isArray(healthsData)) {
          this.renderArticle(healthsData);
          this.renderRecommendedArticles();
          return;
        }

       
        const healthsArticle = healthsData.find(
          (article) => article.id === this.articleId
        );

        if (healthsArticle) {
          this.renderArticle(healthsArticle);
          this.renderRecommendedArticles();
          return;
        }
      }

     
      const dbResponse = await fetch(Category_URL);

      if (!dbResponse.ok) {
        throw new Error(`Failed to load db.json: ${dbResponse.status}`);
      }

      const dbData = await dbResponse.json();

      const dbArticle = dbData.find((a) => a.id === this.articleId);

      if (!dbArticle) {
        this.showError("Article Not Found");
        return;
      }

     
      this.renderArticle(dbArticle, true);
      this.renderRecommendedArticles();
    } catch (error) {
      this.showError("Failed to Load Article: " + error.message);
    }
  }

  renderArticle(article, isDbArticle = false) {
   
    document.title = `${article.title} - Health News`;

   
    document.getElementById("articleTitle").textContent = article.title;

   
    const articleType = document.getElementById("articleType");
    if (article.type) {
      articleType.textContent = this.decodeUnicode(article.type);
    } else {
      articleType.textContent = "-";
    }

    const articleTime = document.getElementById("articleTime");
    if (article.create_time) {
      articleTime.textContent = this.formatTime(article.create_time);
    } else {
      articleTime.textContent = "-";
    }


    this.renderArticleContent(article, isDbArticle);
  }

  renderArticleContent(article, isDbArticle = false) {
    const contentContainer = document.getElementById("articleContent");

    if (isDbArticle) {
     
      contentContainer.innerHTML = `
                        <p>This article is available in the healths folder. Please check the corresponding data.json file for full content.</p>
                        <p>Article Type: ${
                          this.decodeUnicode(article.type) || "Unknown"
                        }</p>
                        <p>Created: ${
                          article.create_time
                            ? this.formatTime(article.create_time)
                            : "Unknown"
                        }</p>
                    `;
      return;
    }

   
    if (article.content && Array.isArray(article.content)) {
     
      const htmlContent = article.content
        .map((contentItem) => {
         
          const decodedContent = this.decodeUnicode(contentItem);
          return decodedContent;
        })
        .join("");

     
      const processedHtmlContent = this.replaceImageUrls(
        htmlContent,
        article.id
      );

     
      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }

     
      this.distributeContentToArticleItems(
        contentContainer,
        processedHtmlContent
      );

     
      this.wrapTablesResponsive(contentContainer);
    } else if (article.section) {
     
      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }

     
      const firstArticleItem = contentContainer.querySelector(".article-item");
      if (firstArticleItem) {
        firstArticleItem.innerHTML = `<p>${article.section}</p>`;
      }
    } else {
      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }

      const firstArticleItem = contentContainer.querySelector(".article-item");
      if (firstArticleItem) {
        firstArticleItem.innerHTML = "<p>Content not available</p>";
      }
    }
  }

 
  replaceImageUrls(htmlContent, articleId) {
    if (!htmlContent || !articleId) {
      return htmlContent;
    }

   
    return htmlContent.replace(
      /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
      (match, before, src, after) => {
       
        if (src.startsWith("http://") || src.startsWith("https://")) {
          return match;
        }

       
        const newSrc = IMG_BASE_URL.replace(
          "/number/",
          `/${articleId}/`
        ).replace("number.png", src);

        return `<img${before}src="${newSrc}"${after}>`;
      }
    );
  }

 
  distributeContentToArticleItems(contentContainer, htmlContent) {
   
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

   
    const images = this.extractImages(tempDiv);

   
    const allPElements = Array.from(tempDiv.querySelectorAll("p"));

   
   
    const allBlockElements =
      allPElements.length > 0 ? allPElements : Array.from(tempDiv.children);

   
    const blockTexts = [];
    allBlockElements.forEach((el) => {
      const text = el.textContent.trim();
      if (text && text.length > 0) {
        blockTexts.push(text);
      }
    });

   
    let fullText = "";
    if (blockTexts.length === 0) {
     
      fullText = this.extractFullText(tempDiv);

      if (!fullText || fullText.trim().length === 0) {
       
        contentContainer.innerHTML = htmlContent;
        return;
      }
    } else {
     
      fullText = blockTexts.join(" ");
    }

   
    const maxChunks = 5;
    const processedParagraphs = [];
    let currentPosition = 0;
    let usedTextLength = 0;

    for (let i = 0; i < maxChunks && currentPosition < fullText.length; i++) {
     
      const targetLength = i === 0 ? 300 : 500;

     
      const remainingText = fullText.substring(currentPosition);

      if (remainingText.length <= targetLength) {
       
        const p = document.createElement("p");
        p.textContent = remainingText;
        processedParagraphs.push(p);
        currentPosition = fullText.length;
        break;
      }

     
      let splitPoint = this.findBestSentenceEnd(remainingText, targetLength);

      const chunk = remainingText.substring(0, splitPoint).trim();
      const p = document.createElement("p");
      p.textContent = chunk;
      processedParagraphs.push(p);

      currentPosition += splitPoint;
      usedTextLength = currentPosition;
    }

   
    const remainingElements = [];
    let accumulatedLength = 0;

   
    if (blockTexts.length > 0 && allBlockElements.length > 0) {
      for (let i = 0; i < blockTexts.length; i++) {
        const textLength = blockTexts[i].length;
        const textStart = accumulatedLength;

       
       
        if (textStart >= usedTextLength) {
          remainingElements.push(allBlockElements[i].cloneNode(true));
        }

        accumulatedLength = textStart + textLength + 1;
      }
    }

   
    const finalChunks = this.combineImagesWithParagraphs(
      processedParagraphs,
      images
    );

   
    const articleItems = Array.from(
      contentContainer.querySelectorAll(".article-item")
    );

   
    const maxContainers = Math.min(5, articleItems.length);

   
    for (let i = 0; i < maxContainers && i < finalChunks.length; i++) {
      articleItems[i].innerHTML = "";

      finalChunks[i].elements.forEach((element) => {
        articleItems[i].appendChild(element);
      });
    }

   
    if (remainingElements.length > 0 && articleItems.length >= 5) {
     
      const fifthItem = articleItems[4];

     
      let lastInsertedElement = fifthItem;
      remainingElements.forEach((element, index) => {
        lastInsertedElement.insertAdjacentElement("afterend", element);
        lastInsertedElement = element;
      });
    }
  }

 
  extractFullText(htmlElement) {
    let text = "";

    function extractText(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName !== "IMG"
      ) {
       
        if (
          ["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(
            node.tagName
          )
        ) {
          if (text && !text.endsWith(" ")) {
            text += " ";
          }
        }

        for (let child of node.childNodes) {
          extractText(child);
        }

        if (
          ["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(
            node.tagName
          )
        ) {
          if (text && !text.endsWith(" ")) {
            text += " ";
          }
        }
      }
    }

    extractText(htmlElement);
    return text.replace(/\s+/g, " ").trim();
  }

 
  extractImages(htmlElement) {
    const images = [];
    const imgElements = htmlElement.querySelectorAll("img");

    imgElements.forEach((img, index) => {
      images.push({
        element: img.cloneNode(true),
        originalIndex: index,
      });
    });

    return images;
  }

 

 
  findBestSentenceEnd(text, targetLength) {
   
    if (text.length <= targetLength) {
      return text.length;
    }

   
    const searchStart = Math.max(0, targetLength - 100);
    const searchEnd = Math.min(text.length, targetLength + 100);

   
    const abbreviations = [
      "e.g.",
      "i.e.",
      "etc.",
      "Dr.",
      "Mr.",
      "Mrs.",
      "Ms.",
      "vs.",
      "Inc.",
      "Ltd.",
      "Co.",
    ];

   
    let bestPosition = -1;
    let minDistance = Infinity;

    for (let i = searchStart; i < searchEnd; i++) {
      if (text[i] === "。" || text[i] === ".") {
       
        let isAbbreviation = false;
        for (const abbr of abbreviations) {
          const startPos = i - abbr.length + 1;
          if (startPos >= 0 && text.substring(startPos, i + 1) === abbr) {
            isAbbreviation = true;
            break;
          }
        }

        if (isAbbreviation) {
          continue;
        }

       
        let parenthesisDepth = 0;
        for (let j = 0; j < i; j++) {
          if (text[j] === "(") parenthesisDepth++;
          if (text[j] === ")") parenthesisDepth--;
        }

        if (parenthesisDepth > 0) {
          continue;
        }

        const distance = Math.abs(i + 1 - targetLength);
        if (distance < minDistance) {
          minDistance = distance;
          bestPosition = i + 1;
        }
      }
    }

   
    if (bestPosition > 0) {
      return bestPosition;
    }

   
    return targetLength;
  }

 
  combineImagesWithParagraphs(paragraphs, images) {
    const chunks = [];

    paragraphs.forEach((paragraph, index) => {
      if (index === 0) {
       
        const firstChunk = { elements: [] };

       
        images.forEach((image) => {
          firstChunk.elements.push(image.element);
        });

       
        firstChunk.elements.push(paragraph);

        chunks.push(firstChunk);
      } else {
       
        chunks.push({
          elements: [paragraph],
        });
      }
    });

    return chunks;
  }

 

 

 
  wrapTablesResponsive(container) {
    const tables = container.querySelectorAll("table");
    tables.forEach((table) => {
     
      if (!table.parentElement.classList.contains("table-responsive")) {
       
        const wrapper = document.createElement("div");
        wrapper.classList.add("table-responsive");

       
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
  }

  renderRecommendedArticles() {
    try {
     
      if (
        window.healthNewsApp &&
        window.healthNewsApp.articles &&
        window.healthNewsApp.articles.length > 0
      ) {
        this.renderDetailPageRecommendedArticles(this.articleId);
      } else {
       
        setTimeout(() => {
          this.renderRecommendedArticles();
        }, 1000);
      }
    } catch (error) {
     
    }
  }

 
  renderDetailPageRecommendedArticles(currentId) {
    const recommendedContainer = document.querySelector(
      ".recommended-articles"
    );
    if (!recommendedContainer) return;

    const recommended = window.healthNewsApp.getRecommendedArticles(
      currentId,
      3
    );

   
    const validRecommended = recommended.filter((article) => {
      const articleId = article.id;
      return (
        articleId !== undefined &&
        articleId !== null &&
        articleId !== "" &&
        String(articleId).trim() !== ""
      );
    });

   
    if (validRecommended.length === 0) {
      recommendedContainer.innerHTML = "";
      return;
    }

    recommendedContainer.innerHTML = validRecommended
      .map(
        (article) => `
                    <div class="article-card" data-id="${article.id}">
                        <div class="article-image">
                            <img src="${window.healthNewsApp.getArticleImage(
                              article
                            )}" alt="${
          article.title || ""
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
                            <h3 class="article-title">${article.title || ""}</h3>
                            <div class="article-meta">
                                <span class="article-type">${
                                  window.healthNewsApp.decodeUnicode(
                                    article.type
                                  ) || "Unknown Type"
                                }</span>
                                <span class="article-time">${this.formatTime(
                                  article.create_time
                                )}</span>
                            </div>
                        </div>
                    </div>
                `
      )
      .join("");

   
    this.bindDetailPageRecommendedEvents();
  }

  bindDetailPageRecommendedEvents() {
    const articleCards = document.querySelectorAll(
      ".recommended-articles .article-card"
    );
    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
       
        if (
          !articleId ||
          articleId === "" ||
          articleId === "undefined" ||
          articleId === "null"
        ) {
          console.warn("Invalid article ID, skipping navigation");
          return;
        }
        window.location.href =
          `detail.html?id=${articleId}` +
          (window.channel ? "&channel=" + window.channel : "");
      });
    });
  }

  formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

 
  generateRandomArticleId() {
   
    const randomId = Math.floor(Math.random() * 130) + 1;
    return randomId.toString();
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
    decoded = decoded.replace(/\?em/g, "<em>");
    decoded = decoded.replace(/\?b/g, "<b");
    decoded = decoded.replace(/\?i/g, "<i");
    decoded = decoded.replace(/\?u/g, "<u");

   
    decoded = decoded.replace(/\?=/g, "=");
    decoded = decoded.replace(/\?>/g, ">");

   
    decoded = decoded.replace(/\?[a-zA-Z0-9#\/]+/g, " ");

   
    decoded = decoded.replace(/[\uFFFD\uFFFE\uFEFF]/g, "");

    return decoded;
  }

  showError(message) {
    const contentContainer = document.getElementById("articleContent");
    contentContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-text">${message}</div>
                        <div class="empty-state-subtext">
                            <a href="index.html${
                              window.channel ? "?channel=" + window.channel : ""
                            }">Back</a>
                        </div>
                    </div>
                `;
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
      document.documentElement.style.overflow = "";
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
    // 统一返回首页
    window.location.href =
      "index.html" +
      (window.channel ? "?channel=" + window.channel : "");
  }
}

// 导出到全局
window.ArticleDetailPage = ArticleDetailPage;

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  try {
    new ArticleDetailPage();
    new BackToTop();
  } catch (error) {}
});
