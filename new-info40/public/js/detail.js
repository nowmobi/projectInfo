
import { remoteDataConfig, Category_URL } from "./BaseURL.js";

class ArticleDetailPage {
  constructor() {
    this.articleId = this.getUrlParam("id");
    this.articlesCache = null;
    this.articlesRequest = null;
    this.init();
  }

  async init() {
    
    if (!this.articleId) {
      await this.selectRandomArticle();
    }
    
    await Promise.all([
      this.loadArticleDetail(),
      this.loadSidebarCategories() 
    ]);
    this.setupEventListeners();
  }
  
  async getArticlesData() {
    if (this.articlesCache) {
      return this.articlesCache;
    }
    
    if (this.articlesRequest) {
      return this.articlesRequest;
    }
    
    this.articlesRequest = this.fetchArticlesData();
    return this.articlesRequest;
  }
  
  async fetchArticlesData() {
    try {
      const articlesUrl = Category_URL;
      const response = await fetch(articlesUrl, {
        cache: "no-cache",
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load articles: ${response.status}`);
      }
      
      const data = await response.json();
      
      let articles = [];
      
      if (Array.isArray(data)) {
        articles = data;
      } else if (data && typeof data === 'object') {
        articles = data.articles || data.data || data.Data || data.news || data.content || [];
      }
      
      this.articlesCache = articles;
      return articles;
    } catch (error) {
      console.error("Error loading articles data:", error);
      return [];
    } finally {
      this.articlesRequest = null;
    }
  }

  async selectRandomArticle() {
    try {
      const articles = await this.getArticlesData();

      if (articles.length === 0) {
        
        this.articleId = this.generateRandomArticleId();
        return;
      }

      const randomIndex = Math.floor(Math.random() * articles.length);
      const randomArticle = articles[randomIndex];
      
      this.articleId = randomArticle.id || randomArticle.articleId || randomArticle.newsId;
      
    } catch (error) {
      
      
      this.articleId = this.generateRandomArticleId();
    }
  }

  async loadArticleDetail(maxRetries = 3, currentRetry = 0) {
    try {
      
      const articleFromApi = await this.fetchArticleFromApi();
      if (articleFromApi) {
        
        this.renderArticle(articleFromApi);
        this.renderRecommendedArticles();
        return;
      }
      
      if (!this.getUrlParam("id") && currentRetry < maxRetries - 1) {
        await this.selectRandomArticle();
        await this.loadArticleDetail(maxRetries, currentRetry + 1);
        return;
      }
      
      this.showError("Article Not Found in any data source");
    } catch (error) {
      
      if (!this.getUrlParam("id") && currentRetry < maxRetries - 1) {
        await this.selectRandomArticle();
        await this.loadArticleDetail(maxRetries, currentRetry + 1);
        return;
      }
      this.showError("Failed to Load Article: " + error.message);
    }
  }
  

  async fetchArticleFromApi() {
    try {
      
      const apiUrl = remoteDataConfig.buildArticleDetailUrl(this.articleId);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(apiUrl, { 
        cache: "no-cache",
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'omit'
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      
      if (data.error) {
        return null;
      }

      if (data && typeof data === 'object') {
        if (!data.id && !data.articleId && !data.newsId) {
          data.id = this.articleId;
        }
        return data;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  renderArticle(article, isDbArticle = false) {
    
    const articleTitle = article.title || article.headline || article.subject || "Untitled";
    let articleType = article.type || article.category || article.thirdCategoryName || article.typeName;
    articleType = Utils.truncateString(articleType, 18);
    const articleTime = article.create_time || article.publish_time || article.post_time || article.date;
    const articleSource = article.source || article.from || article.origin || article.sourceName;
    
    document.title = `${articleTitle} - Health News`;

    document.getElementById("articleTitle").textContent = articleTitle;

    const articleAuthorElement = document.getElementById("articleAuthor");
    if (articleAuthorElement) {
      const author = article.author || "-";
      articleAuthorElement.textContent = Utils.decodeUnicode(author);
    }

    const articleTimeElement = document.getElementById("articleTime");
    if (articleTimeElement) {
      articleTimeElement.textContent = articleTime ? Utils.formatTime(articleTime) : "-";
    }

    const articleSourceElement = document.getElementById("articleSource");
    if (articleSourceElement) {
      articleSourceElement.textContent = articleSource ? Utils.decodeUnicode(articleSource) : "-";
    }

    this.renderArticleContent(article);
  }

  renderArticleContent(article) {
    const contentContainer = document.getElementById("articleContent");
    if (!contentContainer) return;

    
    const articleId = article.id || article.articleId || article.newsId;
    const articleContent = article.content || article.body || article.description || article.text;
    const articleSection = article.section || article.summary;
    const articleTitle = article.title || article.headline || article.subject || "Untitled";
    
    
    const loading = contentContainer.querySelector(".loading");
    if (loading) {
      loading.style.display = "none";
    }
    

    if (articleContent) {
      if (Array.isArray(articleContent)) {
        let htmlContent = articleContent
          .map((contentItem) => {
            const decodedContent = Utils.decodeUnicode(contentItem);
            return decodedContent;
          })
          .join("");

        
        htmlContent = this.replaceImageUrls(htmlContent, articleId);

        this.distributeContentToArticleItems(contentContainer, htmlContent);
        this.wrapTablesResponsive(contentContainer);
      } else if (typeof articleContent === 'string') {
        
        let htmlContent = Utils.decodeUnicode(articleContent);
        
        htmlContent = this.replaceImageUrls(htmlContent, articleId);

        this.distributeContentToArticleItems(contentContainer, htmlContent);
        this.wrapTablesResponsive(contentContainer);
      } else {
        contentContainer.innerHTML = "<p>Content format not supported</p>";
      }
    } else if (articleSection) {
      contentContainer.innerHTML = `
                        <p>${Utils.decodeUnicode(articleSection)}</p>
                    `;
    } else {
      
      contentContainer.innerHTML = `
                        <div class="article-meta">
                            <h3>Article Details</h3>
                            <p>This article is from our news feed</p>
                            ${article.title ? `<h4>${Utils.decodeUnicode(article.title)}</h4>` : ''}
                            ${article.type ? `<p><strong>Category:</strong> ${Utils.decodeUnicode(article.type)}</p>` : ''}
                            ${article.source ? `<p><strong>Source:</strong> ${Utils.decodeUnicode(article.source)}</p>` : ''}
                            ${article.author ? `<p><strong>Author:</strong> ${Utils.decodeUnicode(article.author)}</p>` : ''}
                            ${article.create_time ? `<p><strong>Published:</strong> ${Utils.formatTime(article.create_time)}</p>` : ''}
                        </div>
                        <div class="article-actions">
                            <button onclick="window.history.back()" class="back-button">Back to News List</button>
                        </div>
                    `;
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

        
        const newSrc = remoteDataConfig.buildImageUrl(articleId, src);

        return `<img${before}src="${newSrc}"${after}>`;
      }
    );
  }

  distributeContentToArticleItems(contentContainer, htmlContent) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const images = this.extractImages(tempDiv);
    const allPElements = Array.from(tempDiv.querySelectorAll("p"));

    const allBlockElements = allPElements.length > 0 ? allPElements : Array.from(tempDiv.children).filter((el) => {
      const tagName = el.tagName.toLowerCase();
      return ["div", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "strong", "blockquote", "pre", "table"].includes(tagName);
    });

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

    const finalChunks = this.combineImagesWithParagraphs(processedParagraphs, images);
    const articleItems = Array.from(contentContainer.querySelectorAll(".article-item"));
    const maxContainers = Math.min(5, articleItems.length);

    for (let i = 0; i < maxContainers && i < finalChunks.length; i++) {
      articleItems[i].innerHTML = "";
      finalChunks[i].elements.forEach((element) => {
        articleItems[i].appendChild(element);
      });
    }

    if (remainingElements.length > 0) {
      if (articleItems.length > 0) {
        const lastItem = articleItems[articleItems.length - 1];
        remainingElements.forEach((element) => {
          lastItem.appendChild(element);
        });
      } else {
        remainingElements.forEach((element) => {
          const newItem = document.createElement("div");
          newItem.className = "article-item";
          newItem.appendChild(element);
          contentContainer.appendChild(newItem);
        });
      }
    }
  }

  extractFullText(htmlElement) {
    let text = "";

    function extractText(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "IMG") {
        if (["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(node.tagName)) {
          if (text && !text.endsWith(" ")) {
            text += " ";
          }
        }

        for (let child of node.childNodes) {
          extractText(child);
        }

        if (["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(node.tagName)) {
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
    const abbreviations = ["e.g.", "i.e.", "etc.", "Dr.", "Mr.", "Mrs.", "Ms.", "vs.", "Inc.", "Ltd.", "Co."];

    let bestPosition = -1;
    let minDistance = Infinity;

    for (let i = searchStart; i < searchEnd; i++) {
      if ((text[i] === "." || text[i] === "!" || text[i] === "?") && (i + 1 >= text.length || text[i + 1] === " ")) {
        const isAbbreviation = abbreviations.some((abbr) => {
          const start = i - abbr.length + 1;
          return start >= 0 && text.substring(start, i + 1) === abbr;
        });

        if (!isAbbreviation) {
          const distance = Math.abs(i - targetLength);
          if (distance < minDistance) {
            minDistance = distance;
            bestPosition = i + 1;
          }
        }
      }
    }

    return bestPosition > 0 ? bestPosition : targetLength;
  }

  combineImagesWithParagraphs(paragraphs, images) {
    if (images.length === 0) {
      return paragraphs.map(p => ({ elements: [p] }));
    }

    const chunks = [];
    
    if (images[0] && paragraphs.length > 0) {
      const firstChunkElements = [images[0].element, paragraphs[0]];
      chunks.push({ elements: firstChunkElements });
      
      const remainingParagraphs = paragraphs.slice(1);
      
      if (images.length > 1 && remainingParagraphs.length > 0) {
        const remainingImages = images.slice(1);
        const paragraphsPerImage = Math.ceil(remainingParagraphs.length / remainingImages.length);
        
        let currentParagraphIndex = 0;
        
        for (let i = 0; i < remainingImages.length; i++) {
          const chunkParagraphs = remainingParagraphs.slice(currentParagraphIndex, currentParagraphIndex + paragraphsPerImage);
          currentParagraphIndex += paragraphsPerImage;

          const chunkElements = [...chunkParagraphs];
          if (remainingImages[i]) {
            chunkElements.push(remainingImages[i].element);
          }

          chunks.push({ elements: chunkElements });
        }

        if (currentParagraphIndex < remainingParagraphs.length) {
          const finalRemainingParagraphs = remainingParagraphs.slice(currentParagraphIndex);
          chunks.push({ elements: finalRemainingParagraphs });
        }
      } else if (remainingParagraphs.length > 0) {
        
        remainingParagraphs.forEach(p => chunks.push({ elements: [p] }));
      }
    } else if (paragraphs.length > 0) {
      
      paragraphs.forEach(p => chunks.push({ elements: [p] }));
    } else if (images.length > 0) {
      
      images.forEach(img => chunks.push({ elements: [img.element] }));
    }

    return chunks;
  }

  wrapTablesResponsive(contentContainer) {
    const tables = contentContainer.querySelectorAll("table");
    tables.forEach((table) => {
      const wrapper = document.createElement("div");
      wrapper.className = "table-responsive";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }


  async getRecommendedArticles(currentId, limit = 3) {
    try {
      const articles = await this.getArticlesData();
      
      return articles
        .filter((article) => {
          const hasValidId = article.id != null && article.id !== "" && String(article.id).trim() !== "";
          const isNotCurrent = String(article.id) !== String(currentId);
          return hasValidId && isNotCurrent;
        })
        .sort(() => Math.random() - 0.5) 
        .slice(0, limit);
    } catch (error) {
      
      return [];
    }
  }
  

  async renderRecommendedArticles() {
    const recommendedContainer = document.querySelector(".recommended-articles");
    if (!recommendedContainer) return;
    recommendedContainer.innerHTML = "<p>Loading recommended articles...</p>";
    try {
      const recommended = await this.getRecommendedArticles(this.articleId, 3);
      if (recommended.length === 0) {
        recommendedContainer.innerHTML = "<p>No recommended articles available.</p>";
        return;
      }
      
      recommendedContainer.innerHTML = recommended
        .map((article) => {
          const articleTitle = article.title || article.headline || article.subject || "Untitled";
          const articleId = article.id || article.articleId || article.newsId;
          const articleImage = article.img || article.image || article.picture || "";
          let articleType = article.type || article.category || article.thirdCategoryName || article.typeName || "";
          articleType = Utils.truncateString(articleType, 18);
          const articleTime = article.create_time || article.publish_time || article.post_time || article.date || "";
          const detailHref = `detail.html?id=${articleId}` + (window.channel ? `&channel=${window.channel}` : "");
          return `
            <a class="recommended-card" href="${detailHref}">
              <div class="recommended-image">
                <img src="${articleImage}" alt="${articleTitle}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #ba7ac7 0%, #9b6aa8 100%); color: white; align-items: center; justify-content: center; font-size: 12px; text-align: center; padding: 5px;">
                  <div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 4px;">
                      <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                    </svg>
                    <div style="font-size: 10px;">Image</div>
                  </div>
                </div>
              </div>
              <div class="recommended-content">
                <h4 class="recommended-title" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; margin: 0 0 5px 0; font-size: 14px; line-height: 1.4; font-weight: 600;">${Utils.decodeUnicode(articleTitle)}</h4>
                ${article.summary ? `<p>${article.summary.substring(0, 60)}...</p>` : ""}
                ${!article.summary ? `<span class="recommended-type-tag">${Utils.decodeUnicode(articleType) || "Unknown Type"}</span>` : ""}
              </div>
            </a>
          `;
        })
        .join("");
      
    } catch (error) {
      recommendedContainer.innerHTML = "<p>Failed to load recommended articles.</p>";
    }
  }

  async loadSidebarCategories() {
    try {
      const articles = await this.getArticlesData();

      
      const categoryMap = new Map();
      articles.forEach((article) => {
        if (article.type && !categoryMap.has(article.type)) {
          categoryMap.set(article.type, {
            name: article.type
          });
        }
      });

      const categories = Array.from(categoryMap.values());
      this.renderSidebarCategories(categories);
    } catch (error) {
      console.error("Error loading sidebar categories:", error);
    }
  }

  renderSidebarCategories(categories) {
    const sidebarCategories = document.querySelectorAll(".sidebar-category");
    if (sidebarCategories.length === 0) {
      return;
    }
    
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const categoryUrlPrefix = isInPagesFolder
      ? "category.html"
      : "pages/category.html";
    
    const categoriesHTML = categories
      .map((category) => {
        const encodedType = encodeURIComponent(category.name);
        return `
            <a
              href="${categoryUrlPrefix}?type=${encodedType}"
              class="sidebar-item"
              data-page="${category.name}"
            >
              <span>${category.name}</span>
            </a>`;
      })
      .join("");
    
    sidebarCategories.forEach((container) => {
      container.innerHTML = categoriesHTML;
    });
  }

  setupEventListeners() {
    const smartBackButton = document.getElementById("smartBackButton");
    if (smartBackButton) {
      smartBackButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.back();
      });
    }

    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebarMenu = document.getElementById("sidebarMenu");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        sidebarMenu.classList.add("active");
        if (sidebarOverlay) {
          sidebarOverlay.classList.add("active");
        }
        document.body.style.overflow = "hidden";

        this.bindEscToClose();
      });
    }

    if (sidebarClose) {
      sidebarClose.addEventListener("click", () => {
        sidebarMenu.classList.remove("active");
        if (sidebarOverlay) {
          sidebarOverlay.classList.remove("active");
        }
        document.body.style.overflow = "";

        this.unbindEscToClose();
      });
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => {
        sidebarMenu.classList.remove("active");
        sidebarOverlay.classList.remove("active");
        document.body.style.overflow = "";

        this.unbindEscToClose();
      });
    }
  }

  bindEscToClose() {
    this._escHandler = (e) => {
      if (e.key === "Escape") {
        const sidebarMenu = document.getElementById("sidebarMenu");
        const sidebarOverlay = document.getElementById("sidebarOverlay");
        
        sidebarMenu.classList.remove("active");
        if (sidebarOverlay) {
          sidebarOverlay.classList.remove("active");
        }
        document.body.style.overflow = "";
        this.unbindEscToClose();
      }
    };

    document.addEventListener("keydown", this._escHandler);
  }

  unbindEscToClose() {
    if (this._escHandler) {
      document.removeEventListener("keydown", this._escHandler);
      this._escHandler = null;
    }
  }

  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  generateRandomArticleId() {
    return Math.floor(Math.random() * 1000) + 1;
  }

  showError(message) {
    const contentContainer = document.getElementById("articleContent");
    if (contentContainer) {
      contentContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }
  }
}


window.addEventListener("DOMContentLoaded", () => {
  new ArticleDetailPage();
});
