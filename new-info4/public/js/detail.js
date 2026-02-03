import { getImgUrl, getDetailUrl, fetchCategoryData } from "./BaseURL.js";

class ArticleDetailPage {
  constructor() {
    this.articleId = this.getUrlParam("id");

    this.init();
  }

  async init() {
    await this.loadArticleDetail();
    this.setupEventListeners();
  }

  async loadArticleDetail() {
    if (!this.articleId) {
      await this.loadRandomArticle();
      return;
    }

    try {
      const articleUrl = getDetailUrl(this.articleId);

      const response = await fetch(articleUrl);

      if (response.ok) {
        const article = await response.json();

        this.renderArticle(article);
        this.renderRecommendedArticles();
        return;
      }
    } catch (error) {
    }

    await this.loadRandomArticle();
  }

  async loadRandomArticle() {
    try {
      const articles = await fetchCategoryData();

      if (Array.isArray(articles) && articles.length > 0) {
        const validArticles = articles.filter(article => article.id && article.title);
        
        if (validArticles.length > 0) {
          const randomArticle = validArticles[Math.floor(Math.random() * validArticles.length)];
          const articleUrl = getDetailUrl(randomArticle.id);

          const articleResponse = await fetch(articleUrl);

          if (articleResponse.ok) {
            const article = await articleResponse.json();

            this.renderArticle(article);
            this.renderRecommendedArticles();
            return;
          }
        }
      }
    } catch (error) {
    }

    this.showError("Failed to Load Article");
  }

  renderArticle(article, isDbArticle = false) {
    document.title = `${article.title} - Health News`;

    document.getElementById("articleTitle").textContent = article.title;

    const articleType = document.getElementById("articleType");
    if (article.author) {
      articleType.textContent = article.author;
    } else {
      articleType.textContent = "-";
    }

    const articleTime = document.getElementById("articleTime");
    if (article.create_time) {
      articleTime.textContent = this.formatTime(article.create_time);
    } else {
      articleTime.textContent = "-";
    }

    const articleSource = document.getElementById("articleSource");
    if (article.source) {
      articleSource.textContent = article.source;
    } else {
      articleSource.textContent = "-";
    }

    const articleSection = document.getElementById("articleSection");

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

    const loading = contentContainer.querySelector(".loading");
    if (loading) {
      loading.style.display = "none";
    }

    const articleItems = Array.from(
      contentContainer.querySelectorAll(".article-item")
    );

    if (article.img && articleItems.length > 0) {
      const imgUrl = getImgUrl(article);
      
      
      const img = document.createElement("img");
      img.src = imgUrl;
      img.alt = article.title;
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.borderRadius = "8px";
      img.style.marginBottom = "20px";
      img.style.display = "block";
      
      img.onload = function() {
      };
      
      img.onerror = function() {
        this.style.display = "none";
      };
      
      articleItems[0].appendChild(img);
    }

    if (article.content && Array.isArray(article.content)) {
      const htmlContent = article.content
        .map((contentItem) => {
          const decodedContent = this.decodeUnicode(contentItem);
          return decodedContent;
        })
        .join("");

      this.distributeContentToArticleItems(
        contentContainer,
        htmlContent,
        article
      );

      this.wrapTablesResponsive(contentContainer);
    } else if (article.section && articleItems.length > 0) {
      const p = document.createElement("p");
      p.textContent = this.decodeUnicode(article.section);
      articleItems[0].appendChild(p);
    } else if (articleItems.length > 0) {
      articleItems[0].innerHTML = "<p>Content not available</p>";
    }
  }

  distributeContentToArticleItems(contentContainer, htmlContent, article) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const allImages = tempDiv.querySelectorAll("img");
    const firstImage =
      allImages.length > 0 ? allImages[0].cloneNode(true) : null;

    if (firstImage && firstImage.src) {
      const imgUrl = firstImage.src;
      if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
        firstImage.src = imgUrl;
      } else {
        const imgFileName = imgUrl.split("/").pop();
        firstImage.src = getImgUrl({ id: article.id, img: imgFileName });
      }
    }

    const originalElements = Array.from(tempDiv.children).map((el) =>
      el.cloneNode(true)
    );

    tempDiv.querySelectorAll("img").forEach((img) => img.remove());

    const fullText = this.extractFullText(tempDiv);

    if (!fullText || fullText.length === 0) {
      return;
    }

    const articleItems = Array.from(
      contentContainer.querySelectorAll(".article-item")
    );

    while (articleItems.length < 5) {
      const newArticleItem = document.createElement("div");
      newArticleItem.className = "article-item";
      contentContainer.appendChild(newArticleItem);
      articleItems.push(newArticleItem);
    }

    let remainingText = fullText;
    const processedChunks = [];
    let totalUsedChars = 0;

    if (remainingText.length > 0) {
      const splitResult = this.splitTextBySentence(remainingText, 300);
      processedChunks.push(splitResult.chunk);
      totalUsedChars += splitResult.chunk.length;
      remainingText = splitResult.remaining;
    }

    for (let i = 1; i < 5; i++) {
      if (remainingText.length > 0) {
        const splitResult = this.splitTextBySentence(remainingText, 500);
        processedChunks.push(splitResult.chunk);
        totalUsedChars += splitResult.chunk.length;
        remainingText = splitResult.remaining;
      } else {
        processedChunks.push("");
      }
    }

    processedChunks.forEach((text, index) => {
      articleItems[index].innerHTML = "";

      if (index === 0 && firstImage) {
        articleItems[index].appendChild(firstImage);
      }

      if (text.trim()) {
        const p = document.createElement("p");
        p.textContent = text.trim();
        articleItems[index].appendChild(p);
      }
    });

    if (remainingText.trim().length > 0) {
      const fifthItem = articleItems[4];

      let currentCharCount = 0;
      let insertedElements = [];

      originalElements.forEach((element) => {
        const cleanElement = element.cloneNode(true);
        cleanElement.querySelectorAll("img").forEach((img) => img.remove());

        const elementText = cleanElement.textContent.trim();
        const elementLength = elementText.length;

        if (currentCharCount >= totalUsedChars && elementText.length > 0) {
          insertedElements.push(cleanElement);
        }

        currentCharCount += elementLength;
      });

      insertedElements.forEach((element) => {
        contentContainer.appendChild(element);
      });
    }
  }

 
  splitTextBySentence(text, maxLength) {
    if (text.length <= maxLength) {
      return { chunk: text, remaining: "" };
    }

   
    const sentenceEndRegex = /[。\.]/g;
    let bestSplitIndex = -1;
    let match;

    while ((match = sentenceEndRegex.exec(text)) !== null) {
      const index = match.index + 1;
      if (index <= maxLength) {
        bestSplitIndex = index;
      } else {
        break;
      }
    }

   
    if (bestSplitIndex > 0) {
      return {
        chunk: text.substring(0, bestSplitIndex),
        remaining: text.substring(bestSplitIndex).trim(),
      };
    }

   
    return {
      chunk: text.substring(0, maxLength),
      remaining: text.substring(maxLength).trim(),
    };
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
    const recommendedContainer = document.querySelector("#recommendedArticles");
    if (!recommendedContainer) return;

    const recommended = window.healthNewsApp.getRecommendedArticles(
      currentId,
      4
    );

    recommendedContainer.innerHTML = recommended
      .map(
        (article) => `
                    <div class="article-card-new" data-id="${article.id}">
                        <div class="article-category-tag">${
                          this.decodeUnicode(article.type) || "Health"
                        }</div>
                        <div class="article-image-new">
                            <img src="${getImgUrl(article)}" alt="${
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
                        <h3 class="article-title-new">${article.title}</h3>
                        <div class="article-time-new">${this.formatTime(
                          article.create_time
                        )}</div>
                    </div>
                `
      )
      .join("");

    this.bindDetailPageRecommendedEvents();
  }

  bindDetailPageRecommendedEvents() {
    const recommendedCards = document.querySelectorAll(".article-card-new");
    recommendedCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        window.location.href =
          `detail.html?id=${articleId}` +
          (window.channel ? "?channel=" + window.channel : "");
      });
    });
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
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
                            <a href="index.html">Back</a>
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
   
    const homeUrl = "index.html" + (window.channel ? "?channel=" + window.channel : "");
    window.location.href = homeUrl;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ArticleDetailPage();

  if (window.themeApplier) {
    window.themeApplier.init();
  }
});
