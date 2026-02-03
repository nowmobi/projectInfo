class ArticleDetailPage {
  constructor() {
    let articleId = Utils.getUrlParam("id");

    if (
      !articleId ||
      articleId === "undefined" ||
      articleId === "null" ||
      String(articleId).trim() === ""
    ) {
      this.articleId = null;
    } else {
      this.articleId = String(articleId).trim();
    }

    this.articles = [];
    this.sidebarMenu = null;
    this.init();
  }

  async init() {
    await this.loadArticlesData();
    await this.loadArticleDetail();
    this.setupEventListeners();
  }

  async loadArticlesData() {
    try {
      const response = await fetch(RemoteDataConfig.dbUrl, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Failed to load db.json: ${response.status}`);
      }

      const rawData = await response.json();
      const articles = RemoteDataConfig.extractArticles(rawData);
      this.articles = Array.isArray(articles) ? articles : [];
    } catch (error) {
      this.articles = [];
    }
  }

  async loadArticleDetail() {
    try {
      if (
        !this.articleId ||
        this.articleId === "undefined" ||
        this.articleId === "null"
      ) {
        if (this.articles && this.articles.length > 0) {
          const randomIndex = Math.floor(Math.random() * this.articles.length);
          this.articleId = String(this.articles[randomIndex].id);
        } else {
          this.articleId = "1";
        }
      }

      if (
        !this.articleId ||
        this.articleId === "undefined" ||
        this.articleId === "null"
      ) {
        throw new Error("Invalid article ID");
      }

      const remoteDetailUrl = RemoteDataConfig.articleDataUrl(this.articleId);
      const remoteResponse = await fetch(remoteDetailUrl, {
        cache: "no-store",
      });

      if (!remoteResponse.ok) {
        if (
          remoteResponse.status === 404 &&
          this.articles &&
          this.articles.length > 0
        ) {
          const firstArticleId = String(this.articles[0].id);
          if (firstArticleId !== this.articleId) {
            this.articleId = firstArticleId;
            const retryUrl = RemoteDataConfig.articleDataUrl(this.articleId);
            const retryResponse = await fetch(retryUrl, { cache: "no-store" });
            if (retryResponse.ok) {
              const remoteArticle = await retryResponse.json();
              this.renderArticle(remoteArticle);
              this.renderRecommendedArticles();
              return;
            }
          }
        }
        throw new Error(
          `Failed to load article detail: ${remoteResponse.status}`
        );
      }

      const remoteArticle = await remoteResponse.json();
      this.renderArticle(remoteArticle);
      this.renderRecommendedArticles();
    } catch (error) {
      this.showError("Article Not Found");
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
    if (article.create_time) {
      articleTime.textContent = Utils.formatTime(article.create_time);
    } else {
      articleTime.textContent = "-";
    }

    this.renderArticleContent(article);
  }

  renderArticleContent(article) {
    const contentContainer = document.getElementById("articleContent");
    if (!contentContainer) return;

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

      // 分配内容到detail-item容器中
      this.distributeContentToArticleItems(
        contentContainer,
        htmlContent,
        article
      );
      this.wrapTablesResponsive(contentContainer);
    } else if (article.section) {
      contentContainer.innerHTML = `
                <p>${this.decodeUnicode(article.section)}</p>
                <p>Full content is being loaded...</p>
            `;
    } else {
      contentContainer.innerHTML = "<p>Content not available</p>";
    }
  }

  // 将内容分配到detail-item容器中
  distributeContentToArticleItems(contentContainer, htmlContent, article) {
    // 创建临时容器来解析HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // 提取所有图片元素
    const images = this.extractImages(tempDiv, article);

    // 提取完整的纯文本内容
    let fullText = this.extractFullText(tempDiv);

    if (!fullText || fullText.trim().length === 0) {
      contentContainer.innerHTML = htmlContent;
      this.normalizeContentAssets(contentContainer, article);
      return;
    }

    // 按句号分割文本成句子数组
    let sentences = fullText.match(/[^.!?。！？]+[.!?。！？]+/g) || [];

    // 检查是否有末尾未被匹配的文本
    const matchedText = sentences.join("");
    if (matchedText.length < fullText.length) {
      const remainingText = fullText.substring(matchedText.length).trim();
      if (remainingText.length > 0) {
        sentences.push(remainingText);
      }
    }

    if (sentences.length === 0) {
      sentences = [fullText];
    }

    // 将句子按照字符数分配到5个段落：第一个300字符，后面每个500字符
    const maxChunks = 5;
    const processedParagraphs = [];
    let sentenceIndex = 0;

    for (let i = 0; i < maxChunks && sentenceIndex < sentences.length; i++) {
      const targetLength = i === 0 ? 300 : 500;
      let currentLength = 0;
      let paragraphSentences = [];

      while (sentenceIndex < sentences.length) {
        const sentence = sentences[sentenceIndex];
        const sentenceLength = sentence.length;

        if (
          paragraphSentences.length === 0 ||
          currentLength + sentenceLength <= targetLength * 1.2
        ) {
          paragraphSentences.push(sentence);
          currentLength += sentenceLength;
          sentenceIndex++;

          if (currentLength >= targetLength) {
            break;
          }
        } else {
          break;
        }
      }

      if (paragraphSentences.length === 0) break;

      const paragraphText = paragraphSentences.join(" ").trim();
      if (paragraphText.length > 0) {
        const p = document.createElement("p");
        p.textContent = paragraphText;
        processedParagraphs.push(p);
      }
    }

    // 计算已使用的文本长度
    const usedText = sentences.slice(0, sentenceIndex).join("");

    // 从原始HTML中提取剩余内容（保留元素标签）
    const remainingElements = this.extractRemainingHTMLElements(
      tempDiv,
      usedText.length
    );

    // 将图片与第一个段落组合
    const finalChunks = this.combineImagesWithParagraphs(
      processedParagraphs,
      images
    );

    // 获取现有的detail-item容器
    const articleItems = Array.from(
      contentContainer.querySelectorAll(".detail-item")
    );
    const maxContainers = Math.min(5, articleItems.length);

    // 将内容块插入到前5个detail-item中
    for (let i = 0; i < maxContainers; i++) {
      articleItems[i].innerHTML = "";

      if (i < finalChunks.length) {
        finalChunks[i].elements.forEach((element) => {
          articleItems[i].appendChild(element);
        });
      }
    }

    // 将剩余元素追加到第5个容器的同级后面
    if (remainingElements.length > 0 && articleItems.length > 0) {
      const lastContainer = articleItems[Math.min(4, articleItems.length - 1)];
      let insertAfter = lastContainer;

      remainingElements.forEach((element) => {
        if (insertAfter.nextSibling) {
          lastContainer.parentNode.insertBefore(
            element,
            insertAfter.nextSibling
          );
        } else {
          lastContainer.parentNode.appendChild(element);
        }
        insertAfter = element;
      });
    }

    // 标准化资源路径
    this.normalizeContentAssets(contentContainer, article);
  }

  // 提取整篇文章的纯文本内容
  extractFullText(htmlElement) {
    let text = "";

    const extractText = (node) => {
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
    };

    extractText(htmlElement);
    return text.replace(/\s+/g, " ").trim();
  }

  // 提取图片元素（只返回第一张）
  extractImages(htmlElement, article) {
    const images = [];
    const imgElements = htmlElement.querySelectorAll("img");

    if (imgElements.length > 0) {
      const img = imgElements[0];
      const clonedImg = img.cloneNode(true);

      const imgSrc = clonedImg.getAttribute("src");
      if (
        imgSrc &&
        !imgSrc.startsWith("http://") &&
        !imgSrc.startsWith("https://")
      ) {
        if (article && article.id) {
          const imgFileName = imgSrc.split("/").pop();
          const remoteImgUrl = `${RemoteDataConfig.baseUrl}/${article.id}/${imgFileName}`;
          clonedImg.setAttribute("src", remoteImgUrl);
        }
      }

      images.push({
        element: clonedImg,
        originalIndex: 0,
      });
    }

    return images;
  }

  // 将图片与段落组合
  combineImagesWithParagraphs(paragraphs, images) {
    const chunks = [];

    paragraphs.forEach((paragraph, index) => {
      if (index === 0) {
        const firstChunk = { elements: [] };

        if (images.length > 0) {
          firstChunk.elements.push(images[0].element);
        }

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

  // 提取剩余的HTML元素（保留标签结构）
  extractRemainingHTMLElements(htmlElement, usedCharCount) {
    const remainingElements = [];
    let charCount = 0;
    let startCollecting = false;

    const traverse = (node) => {
      if (startCollecting) {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "IMG") {
          const cloned = node.cloneNode(true);
          remainingElements.push(cloned);
        }
        return true;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent.length;
        if (charCount + textLength > usedCharCount) {
          startCollecting = true;
          const offset = usedCharCount - charCount;

          if (offset < textLength) {
            const remainingText = node.textContent.substring(offset);
            if (remainingText.trim().length > 0) {
              let parent = node.parentElement;
              if (parent && parent !== htmlElement) {
                const clonedParent = parent.cloneNode(false);
                clonedParent.textContent = remainingText;
                remainingElements.push(clonedParent);
              } else {
                const p = document.createElement("p");
                p.textContent = remainingText;
                remainingElements.push(p);
              }
            }
          }
          return true;
        }
        charCount += textLength;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === "IMG") {
          return false;
        }

        for (let child of node.childNodes) {
          if (traverse(child)) {
            return true;
          }
        }
      }
      return false;
    };

    for (let child of htmlElement.childNodes) {
      if (traverse(child)) {
        let sibling = child.nextSibling;
        while (sibling) {
          if (
            sibling.nodeType === Node.ELEMENT_NODE &&
            sibling.tagName !== "IMG"
          ) {
            remainingElements.push(sibling.cloneNode(true));
          }
          sibling = sibling.nextSibling;
        }
        break;
      }
    }

    return remainingElements;
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
    const recommendedContainer = document.querySelector("#recommendedArticles");
    if (!recommendedContainer) return;

    let recommended;
    if (!Array.isArray(this.articles) || this.articles.length === 0) {
      recommended = [];
    } else {
      recommended = this.getRecommendedArticles(this.articleId, 6);
    }

    const categorySection = recommendedContainer.closest(".category-section");
    if (categorySection) {
      categorySection.classList.add("section--list");

      const categoryHeader = categorySection.querySelector(
        ".section-header"
      );
      if (categoryHeader) {
        const categoryIcon = categoryHeader.querySelector(
          ".category-section-icon"
        );
        if (categoryIcon) {
          categoryIcon.remove();
        }
      }
    }

    Utils.setupArticlesContainer(recommendedContainer, false);

    if (!recommended || recommended.length === 0) {
      recommendedContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">No recommended articles</div>
                    <div class="empty-state-subtext">Please explore other categories</div>
                </div>
            `;
      return;
    }

    recommendedContainer.innerHTML = Utils.generateArticleListHTML(
      recommended,
      2
    );

    this.bindDetailPageRecommendedEvents();
  }

  getRecommendedArticles(currentId, limit = 6) {
    return this.articles
      .filter((article) => {
        if (!article || !article.id) return false;
        const articleId = String(article.id).trim();
        if (articleId === "" || articleId === "undefined" || articleId === "null") return false;
        if (articleId === String(currentId).trim()) return false;
        return true;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

  normalizeContentAssets(container, article) {
    if (!container) return;

    const resolvePath = (assetPath) => {
      if (!assetPath) return assetPath;
      if (/^https?:\/\//i.test(assetPath)) {
        return assetPath;
      }
      if (assetPath.startsWith("/")) {
        return `${RemoteDataConfig.baseUrl}${assetPath}`;
      }
      if (article && article.id) {
        return `${RemoteDataConfig.baseUrl}/${article.id}/${assetPath}`;
      }
      return `${RemoteDataConfig.baseUrl}/${assetPath}`;
    };

    const images = container.querySelectorAll("img");
    images.forEach((img) => {
      const src = img.getAttribute("src");
      if (!src) return;
      img.setAttribute("src", resolvePath(src));
    });

    const sources = container.querySelectorAll("source");
    sources.forEach((source) => {
      const srcset = source.getAttribute("srcset");
      if (!srcset) return;
      const normalized = srcset
        .split(",")
        .map((entry) => {
          const trimmed = entry.trim();
          if (!trimmed) return trimmed;
          const [url, descriptor] = trimmed.split(/\s+/);
          const resolvedUrl = resolvePath(url);
          return descriptor ? `${resolvedUrl} ${descriptor}` : resolvedUrl;
        })
        .join(", ");
      source.setAttribute("srcset", normalized);
    });
  }

  bindDetailPageRecommendedEvents() {
    const recommendedCards = document.querySelectorAll(".card-list");
    recommendedCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        if (articleId) {
          window.location.href = `detail.html?id=${articleId}`;
        }
      });
    });
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
    if (!contentContainer) return;

    const pathname = window.location.pathname;
    const isInPagesDirectory = pathname.includes("/pages/");
    const homeUrl = isInPagesDirectory ? "../index.html" : "index.html";

    contentContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-text">${message}</div>
                <div class="empty-state-subtext">
                    <a href="${homeUrl}">Back</a>
                </div>
            </div>
        `;
  }

  setupEventListeners() {
    this.initializeSidebarMenu();
  }

  initializeSidebarMenu() {
    if (typeof SidebarMenu === "undefined") return;

    const categories = this.getSidebarCategories();

    if (!this.sidebarMenu) {
      this.sidebarMenu = new SidebarMenu({
        categories,
        fetchCategories: categories.length === 0,
        homeUrl: "index.html",
      });
    } else {
      this.sidebarMenu.updateCategories(categories);
    }
  }

  getSidebarCategories() {
    const typeSet = new Set();
    this.articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });

    return Array.from(typeSet).map((type) => ({
      id: type,
      name: type,
    }));
  }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  new ArticleDetailPage();
});
