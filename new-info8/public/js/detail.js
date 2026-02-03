class ArticleDetailPage {
  constructor() {
    this.articleId = this.getUrlParam("id");

    this.articleTypeParam = this.getUrlParam("type");

    this.allArticles = [];

    this.infoKey = "info1";
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
        const data = await window.fetchDbData();
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
      
      if (Array.isArray(this.allArticles) && this.allArticles.length > 0) {
        
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
          }
        }
        
        
        const randomIndex = Math.floor(Math.random() * availableArticles.length);
        const selectedArticle = availableArticles[randomIndex];
        
        if (selectedArticle && selectedArticle.id) {
          this.articleId = String(selectedArticle.id);
          
          
          if (originalId && this.articleId !== originalId) {
            this.updateUrlWithId(this.articleId);
          }
        }
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
      const finaceUrl = `${window.DataConfig.baseUrl}/${this.articleId}/${window.DataConfig.detailDataPath}/data.json`;
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
    const articleAuthor = document.getElementById("articleAuthor");
    if (article.author) {
      articleAuthor.textContent = this.decodeUnicode(article.author);
    } else {
      articleAuthor.textContent = "-";
    }

    const articleTime = document.getElementById("articleTime");
    articleTime.textContent = Utils.formatTimestamp(article.create_time) || "-";

    
    const articleHeader = document.querySelector(".article-header");
    let sourceElement = articleHeader.querySelector("#articleSource");
    if (!sourceElement) {
      sourceElement = document.createElement("div");
      sourceElement.id = "articleSource";
      sourceElement.className = "article-detail-source";
      
      const articleDetailMeta = articleHeader.querySelector(".article-detail-meta");
      articleHeader.insertBefore(sourceElement, articleDetailMeta.nextSibling);
    }
    sourceElement.textContent = article.source || "-";

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

      
      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }

      
      this.distributeContentToArticleItems(contentContainer, htmlContent);

      
      this.wrapTablesResponsive(contentContainer);
      this.normalizeContentImages(contentContainer, article.id);
    } else {
      contentContainer.innerHTML = "<p>Content not available</p>";
    }
  }

  
  distributeContentToArticleItems(contentContainer, htmlContent) {
    
    const articleItems = Array.from(
      contentContainer.querySelectorAll(".article-item")
    );

    
    if (articleItems.length === 0) {
      contentContainer.innerHTML = htmlContent;
      return;
    }

    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    
    const firstImg = tempDiv.querySelector("img");
    if (firstImg && articleItems.length > 0) {
      const imgClone = firstImg.cloneNode(true);
      articleItems[0].parentNode.insertBefore(imgClone, articleItems[0]);
    }

    
    let fullText = this.extractFullText(tempDiv);

    if (!fullText || fullText.trim().length === 0) {
      contentContainer.innerHTML = htmlContent;
      return;
    }

    
    let sentences = fullText.match(/[^.!?。！？]+[.!?。！？]+/g) || [];

    
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

    
    const remainingElements = [];
    if (sentenceIndex < sentences.length) {
      
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

    
    for (
      let i = 0;
      i < articleItems.length && i < processedParagraphs.length;
      i++
    ) {
      articleItems[i].innerHTML = ""; 
      articleItems[i].appendChild(processedParagraphs[i]);
    }

    
    if (remainingElements.length > 0) {
      let containerIndex = processedParagraphs.length; 
      let elementIndex = 0;

      while (
        elementIndex < remainingElements.length &&
        containerIndex < articleItems.length
      ) {
        
        articleItems[containerIndex].innerHTML = "";

        
        if (elementIndex < remainingElements.length) {
          articleItems[containerIndex].appendChild(
            remainingElements[elementIndex]
          );
          elementIndex++;
        }

        containerIndex++;
      }

      
      if (elementIndex < remainingElements.length) {
        const lastContainer = articleItems[articleItems.length - 1];
        while (elementIndex < remainingElements.length) {
          lastContainer.appendChild(remainingElements[elementIndex]);
          elementIndex++;
        }
      }
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

      
      if (/^https?:\/\//i.test(originalSrc)) {
        return;
      }

      
      
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
                            this.truncateString(this.decodeUnicode(article.type) || "Unknown Type", 12)
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
      return `${window.DataConfig.baseUrl}/${imgPath.replace(/^finace\//, "")}`;
    }

    if (imgPath.startsWith("public/")) {
      return imgPath;
    }

    const articleId = article.id ? String(article.id) : "";
    if (articleId) {
      return `${window.DataConfig.baseUrl}/${articleId}/${imgPath}`;
    }

    return imgPath;
  }

  truncateString(str, maxLength) {
    if (!str || str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + "...";
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
