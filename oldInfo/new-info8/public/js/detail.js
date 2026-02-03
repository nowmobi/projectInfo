class ArticleDetailPage {
  constructor() {
    this.articleId = this.getUrlParam("id");

    this.articleTypeParam = this.getUrlParam("type");

    this.allArticles = [];

    this.infoKey = "info2";
    this.allowedTypes = new Set();
    this.init();
  }

  async prepareAllowedArticles() {
    if (
      this.allowedTypes.size > 0 &&
      Array.isArray(this.allArticles) &&
      this.allArticles.length > 0
    ) {
      return;
    }

    const populateFromAppInstance = () => {
      if (!window.financeNewsApp) {
        return;
      }

      if (
        this.allowedTypes.size === 0 &&
        Array.isArray(window.financeNewsApp.categoryOrder)
      ) {
        this.allowedTypes = new Set(
          window.financeNewsApp.categoryOrder
            .map((item) =>
              typeof item === "string" ? item.trim().toLowerCase() : ""
            )
            .filter(Boolean)
        );
      }

      if (
        Array.isArray(window.financeNewsApp.articles) &&
        window.financeNewsApp.articles.length > 0
      ) {
        const filtered = this.filterArticlesByAllowedTypes(
          window.financeNewsApp.articles
        );
        if (filtered.length > 0) {
          this.allArticles = filtered;
        }
      }
    };

    populateFromAppInstance();

    if (
      this.allowedTypes.size > 0 &&
      Array.isArray(this.allArticles) &&
      this.allArticles.length > 0
    ) {
      return;
    }

    if (
      this.allowedTypes.size === 0 ||
      !Array.isArray(this.allArticles) ||
      this.allArticles.length === 0
    ) {
      try {
        const response = await fetch(REMOTE_DB_URL);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const [meta, ...articles] = data;

            if (
              this.allowedTypes.size === 0 &&
              meta &&
              Array.isArray(meta[this.infoKey])
            ) {
              this.allowedTypes = new Set(
                meta[this.infoKey]
                  .map((item) =>
                    typeof item === "string" ? item.trim().toLowerCase() : ""
                  )
                  .filter(Boolean)
              );
            }

            if (
              !Array.isArray(this.allArticles) ||
              this.allArticles.length === 0
            ) {
              const filtered = this.filterArticlesByAllowedTypes(
                Array.isArray(articles) ? articles : []
              );
              if (filtered.length > 0) {
                this.allArticles = filtered;
              }
            }
          }
        } else {
        }
      } catch (error) {}
    }

    if (!Array.isArray(this.allArticles)) {
      this.allArticles = [];
    }
  }

  async init() {
    await this.prepareAllowedArticles();

    const originalId = this.articleId;

    if (!this.articleId || !this.isArticleIdAllowed(this.articleId)) {
      this.articleId = this.generateRandomArticleId();
      if (this.articleId && this.articleId !== originalId) {
        this.updateUrlWithId(this.articleId);
      }
    }

    if (!this.articleId) {
      this.showError("Article Not Found");
      return;
    }

    await this.loadArticleDetail();
    this.setupEventListeners();
  }

  async loadArticleDetail() {
    try {
      const finaceUrl = `${REMOTE_DATA_BASE_URL}/${this.articleId}/data.json`;
      const finaceResponse = await fetch(finaceUrl);

      if (!finaceResponse.ok) {
        throw new Error("Article not found in remote dataset");
      }

      const finaceArticle = await finaceResponse.json();
      this.renderArticle(finaceArticle);
      await this.renderRecommendedArticles();
    } catch (error) {
      this.showError("Failed to Load Article: " + error.message);
    }
  }

  renderArticle(article) {
    document.title = `${article.title} - Finance News`;
    document.getElementById("articleTitle").textContent = article.title;
    const articleType = document.getElementById("articleType");
    if (article.type) {
      articleType.textContent = this.decodeUnicode(article.type);
    } else {
      articleType.textContent = "-";
    }

    const articleTime = document.getElementById("articleTime");
    articleTime.textContent = Utils.formatTimestamp(article.create_time) || "-";

    this.renderArticleContent(article);
  }

  renderArticleContent(article) {
    const contentContainer = document.getElementById("articleContent");

    if (article.content && Array.isArray(article.content)) {
      const htmlContent = article.content
        .map((contentItem) => {
          const decodedContent = this.decodeUnicode(contentItem);
          return decodedContent;
        })
        .join("");

      // 隐藏加载状态
      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }

      // 解析HTML内容并分配到article-item中
      this.distributeContentToArticleItems(contentContainer, htmlContent);

      // 为表格添加响应式包装器
      this.wrapTablesResponsive(contentContainer);
      this.normalizeContentImages(contentContainer, article.id);
    } else {
      contentContainer.innerHTML = "<p>Content not available</p>";
    }
  }

  // 将内容分配到article-item容器中
  distributeContentToArticleItems(contentContainer, htmlContent) {
    // 首先获取现有的article-item容器
    const articleItems = Array.from(
      contentContainer.querySelectorAll(".article-item")
    );

    // 如果没有容器，直接显示HTML内容
    if (articleItems.length === 0) {
      contentContainer.innerHTML = htmlContent;
      return;
    }

    // 创建临时容器来解析HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // 提取第一张图片并插入到第一个容器前面
    const firstImg = tempDiv.querySelector("img");
    if (firstImg && articleItems.length > 0) {
      const imgClone = firstImg.cloneNode(true);
      articleItems[0].parentNode.insertBefore(imgClone, articleItems[0]);
    }

    // 直接从tempDiv提取完整的纯文本内容
    let fullText = this.extractFullText(tempDiv);

    if (!fullText || fullText.trim().length === 0) {
      contentContainer.innerHTML = htmlContent;
      return;
    }

    // 按句号分割文本成句子数组
    let sentences = fullText.match(/[^.!?。！？]+[.!?。！？]+/g) || [];

    // 检查是否有末尾未被匹配的文本（没有句号结尾的部分）
    const matchedText = sentences.join("");
    if (matchedText.length < fullText.length) {
      const remainingText = fullText.substring(matchedText.length).trim();
      if (remainingText.length > 0) {
        sentences.push(remainingText);
      }
    }

    // 如果没有匹配到任何句子，使用整个文本
    if (sentences.length === 0) {
      sentences = [fullText];
    }

    // 将句子按照字符数分配到5个段落：第一个300字符，后面每个500字符
    const maxChunks = 5;
    const processedParagraphs = [];
    let sentenceIndex = 0;

    for (let i = 0; i < maxChunks && sentenceIndex < sentences.length; i++) {
      // 第一个段落目标300字符，后面的段落目标500字符
      const targetLength = i === 0 ? 300 : 500;

      let currentLength = 0;
      let paragraphSentences = [];

      // 累加句子直到接近或超过目标长度
      while (sentenceIndex < sentences.length) {
        const sentence = sentences[sentenceIndex];
        const sentenceLength = sentence.length;

        // 如果是第一句，或者加上这句不会超过目标太多，就加进来
        if (
          paragraphSentences.length === 0 ||
          currentLength + sentenceLength <= targetLength * 1.2
        ) {
          paragraphSentences.push(sentence);
          currentLength += sentenceLength;
          sentenceIndex++;

          // 如果已经达到或超过目标长度，就停止
          if (currentLength >= targetLength) {
            break;
          }
        } else {
          // 加上这句会超过太多，停止
          break;
        }
      }

      // 如果没有句子了，退出
      if (paragraphSentences.length === 0) break;

      const paragraphText = paragraphSentences.join(" ").trim();
      if (paragraphText.length > 0) {
        const p = document.createElement("p");
        p.textContent = paragraphText;
        processedParagraphs.push(p);
      }
    }

    // 处理剩余句子
    const remainingElements = [];
    if (sentenceIndex < sentences.length) {
      // 将剩余句子每3-5句组成一个段落
      let currentSentenceIndex = sentenceIndex;
      while (currentSentenceIndex < sentences.length) {
        const chunkSentences = sentences.slice(
          currentSentenceIndex,
          currentSentenceIndex + 5
        );
        const chunkText = chunkSentences.join(" ").trim();

        if (chunkText.length > 0) {
          const p = document.createElement("p");
          p.textContent = chunkText;
          remainingElements.push(p);
        }

        currentSentenceIndex += chunkSentences.length;
      }
    }

    // 将前5个段落插入到article-item中
    for (
      let i = 0;
      i < articleItems.length && i < processedParagraphs.length;
      i++
    ) {
      articleItems[i].innerHTML = ""; // 清空原有内容
      articleItems[i].appendChild(processedParagraphs[i]);
    }

    // 将剩余元素放入后续的article-item容器中
    if (remainingElements.length > 0) {
      let containerIndex = processedParagraphs.length; // 从 processedParagraphs 之后的容器开始
      let elementIndex = 0;

      while (
        elementIndex < remainingElements.length &&
        containerIndex < articleItems.length
      ) {
        // 清空容器
        articleItems[containerIndex].innerHTML = "";

        // 将一个剩余元素放入当前容器
        if (elementIndex < remainingElements.length) {
          articleItems[containerIndex].appendChild(
            remainingElements[elementIndex]
          );
          elementIndex++;
        }

        containerIndex++;
      }

      // 如果还有剩余元素但容器不够，将它们追加到最后一个容器
      if (elementIndex < remainingElements.length) {
        const lastContainer = articleItems[articleItems.length - 1];
        while (elementIndex < remainingElements.length) {
          lastContainer.appendChild(remainingElements[elementIndex]);
          elementIndex++;
        }
      }
    }
  }

  // 提取整篇文章的纯文本内容
  extractFullText(htmlElement) {
    let text = "";

    function extractText(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName !== "IMG"
      ) {
        // 在块级元素前后添加空格，但跳过图片
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

  normalizeContentImages(container, articleId) {
    if (!container) return;

    const normalisedId = articleId ? String(articleId) : "";
    const images = container.querySelectorAll("img");
    const imgBaseUrl = window.IMG_BASE_URL;

    images.forEach((img) => {
      const originalSrc = img.getAttribute("src") || "";
      if (!originalSrc) return;

      // 跳过已经是完整URL的图片
      if (/^(https?:)?:\/\//i.test(originalSrc)) {
        return;
      }

      // 使用文章ID和原始src构建远程图片URL
      // 格式: https://alldata-75c.pages.dev/finace/{articleId}/{imageName}
      if (normalisedId && imgBaseUrl) {
        const newSrc = `${imgBaseUrl}/${normalisedId}/${originalSrc}`;
        img.setAttribute("src", newSrc);
      }
    });
  }

  async renderRecommendedArticles() {
    try {
      await this.prepareAllowedArticles();
      this.renderDetailPageRecommendedArticles(this.articleId);
    } catch (error) {}
  }

  setupEventListeners() {}

  renderDetailPageRecommendedArticles(currentId) {
    const recommendedContainer = document.querySelector(
      ".recommended-articles"
    );
    if (!recommendedContainer) return;

    const recommended = this.getRecommendedArticles(currentId, 6);

    recommendedContainer.innerHTML = recommended
      .map(
        (article) => `
            <div class="recommended-card" data-id="${article.id}">
                <div class="recommended-image">
                    <img src="${this.getRecommendedArticleImage(
                      article
                    )}" alt="${
          article.title
        }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #92cff4 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 12px; text-align: center; padding: 5px;">
                        <div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 4px;">
                                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                            </svg>
                            <div style="font-size: 10px;">Image</div>
                        </div>
                    </div>
                </div>
                <div class="recommended-content">
                    <h4 class="recommended-card-title">${article.title}</h4>
                    <p class="recommended-summary">${
                      article.summary
                        ? article.summary.substring(0, 60) + "..."
                        : ""
                    }</p>
                    ${
                      !article.summary
                        ? `<span class="recommended-type-tag">${
                            this.decodeUnicode(article.type) || "Unknown Type"
                          }</span>`
                        : ""
                    }
                </div>
            </div>
        `
      )
      .join("");

    this.bindDetailPageRecommendedEvents();
  }

  getRecommendedArticles(currentId, limit = 3) {
    const sourceArticles = Array.isArray(this.allArticles)
      ? this.allArticles
      : [];

    if (!Array.isArray(sourceArticles) || sourceArticles.length === 0) {
      return [];
    }

    const normalisedId = currentId ? String(currentId) : "";

    return sourceArticles
      .filter((article) => String(article.id) !== normalisedId)
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

  getRecommendedArticleImage(article) {
    if (
      window.financeNewsApp &&
      typeof window.financeNewsApp.getArticleImage === "function"
    ) {
      return window.financeNewsApp.getArticleImage(article);
    }

    if (!article || !article.img) {
      return "";
    }

    const imgPath = article.img;

    if (/^(https?:)?\/\//.test(imgPath)) {
      return imgPath;
    }

    if (imgPath.startsWith("finace/")) {
      return `${REMOTE_DATA_BASE_URL}/${imgPath.replace(/^finace\//, "")}`;
    }

    if (imgPath.startsWith("public/")) {
      return imgPath;
    }

    const articleId = article.id ? String(article.id) : "";
    if (articleId) {
      return `${REMOTE_DATA_BASE_URL}/${articleId}/${imgPath}`;
    }

    return imgPath;
  }

  bindDetailPageRecommendedEvents() {
    const recommendedCards = document.querySelectorAll(".recommended-card");
    recommendedCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        window.location.href = `detail.html?id=${articleId}`;
      });
    });
  }

  filterArticlesByAllowedTypes(articles) {
    if (!Array.isArray(articles) || articles.length === 0) {
      return [];
    }

    return articles.filter((article) => {
      if (!article || !article.id) {
        return false;
      }
      return this.isTypeAllowed(article.type);
    });
  }

  isArticleIdAllowed(id) {
    if (!id) {
      return false;
    }

    const targetId = String(id);
    return (
      Array.isArray(this.allArticles) &&
      this.allArticles.some((article) => String(article.id) === targetId)
    );
  }

  updateUrlWithId(id) {
    if (
      !id ||
      typeof window === "undefined" ||
      !window.history ||
      !window.location
    ) {
      return;
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("id", id);
      window.history.replaceState({}, "", url.toString());
    } catch (error) {}
  }

  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  generateRandomArticleId() {
    if (!Array.isArray(this.allArticles) || this.allArticles.length === 0) {
      return null;
    }

    let availableArticles = this.allArticles;

    if (this.articleTypeParam) {
      const decodedType = decodeURIComponent(this.articleTypeParam);
      const filtered = this.allArticles.filter((article) => {
        if (!article || !article.type) return false;
        return (
          article.type === decodedType ||
          article.type.toLowerCase() === decodedType.toLowerCase()
        );
      });

      if (filtered.length > 0) {
        availableArticles = filtered;
      } else {
      }
    }

    const randomIndex = Math.floor(Math.random() * availableArticles.length);
    const selectedArticle = availableArticles[randomIndex];

    if (!selectedArticle || !selectedArticle.id) {
      return null;
    }

    return String(selectedArticle.id);
  }

  isTypeAllowed(type) {
    if (this.allowedTypes.size === 0) {
      return true;
    }

    if (!type) {
      return false;
    }

    const normalised = String(type).trim().toLowerCase();
    return this.allowedTypes.has(normalised);
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
}

document.addEventListener("DOMContentLoaded", () => {
  new ArticleDetailPage();
});
