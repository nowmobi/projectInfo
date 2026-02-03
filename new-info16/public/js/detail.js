import {
  Category_URL,
  getDataBaseUrl,
  getArticleDetailUrl,
} from "./BaseURL.js";

const REMOTE_DATA_BASE_URL = getDataBaseUrl();
const REMOTE_DB_URL = Category_URL;

const CONFIG = {
  recommendedArticlesLimit: 6,
};

const SELECTORS = {
  articleTitle: "#articleTitle",
  articleContent: "#articleContent",
  recommendedArticles: ".recommended-list",
  table: "table",
  image: "img",
  tableResponsive: ".table-responsive",
};

const URL_PARAMS = {
  id: "id",
};

class UnicodeDecoder {
  static decode(str) {
    if (!str) return "";

    const textarea = document.createElement("textarea");
    textarea.innerHTML = str;
    let decoded = textarea.value;

    decoded = this.replaceUnicodeEscapes(decoded);
    decoded = this.replaceQuestionMarkEntities(decoded);
    decoded = this.replaceHtmlEntities(decoded);
    decoded = decoded.replace(/[\uFFFD\uFFFE\uFEFF]/g, "");
    return decoded;
  }

  static replaceUnicodeEscapes(str) {
    const replacements = [
      [/\\u0026/g, "&"],
      [/\\u0020/g, " "],
      [/\\u00A0/g, " "],
      [/\\u003c/g, "<"],
      [/\\u003e/g, ">"],
      [/\\u003d/g, "="],
      [/\\u0022/g, '"'],
      [/\\u0027/g, "'"],
      [/\\u002f/g, "/"],
      [/\\u005c/g, "\\"],
      [/\\u002d/g, "-"],
      [/\\u005f/g, "_"],
      [/\\u0028/g, "("],
      [/\\u0029/g, ")"],
      [/\\u005b/g, "["],
      [/\\u005d/g, "]"],
      [/\\u007b/g, "{"],
      [/\\u007d/g, "}"],
      [/\\u003a/g, ":"],
      [/\\u003b/g, ";"],
      [/\\u002c/g, ","],
      [/\\u002e/g, "."],
      [/\\u0021/g, "!"],
      [/\\u003f/g, "?"],
      [/\\u0040/g, "@"],
      [/\\u0023/g, "#"],
      [/\\u0024/g, "$"],
      [/\\u0025/g, "%"],
      [/\\u005e/g, "^"],
      [/\\u002a/g, "*"],
      [/\\u002b/g, "+"],
      [/\\u007c/g, "|"],
      [/\\u007e/g, "~"],
      [/\\u0060/g, "`"],
    ];

    replacements.forEach(([pattern, replacement]) => {
      str = str.replace(pattern, replacement);
    });

    return str;
  }

  static replaceQuestionMarkEntities(str) {
    
    
    const urlPlaceholders = [];
    let placeholderIndex = 0;
    
    
    
    const htmlAttrUrlPattern = /(src|href|data-src|data-href)=(["']?)(https?:\/\/[^\s<>"']+?)\2([\s>])/gi;
    str = str.replace(htmlAttrUrlPattern, (match, attr, quote, url, endChar) => {
      const placeholder = `__URL_PLACEHOLDER_${placeholderIndex}__`;
      urlPlaceholders[placeholderIndex] = { attr, quote, url };
      placeholderIndex++;
      
      const quoteStr = quote || '';
      return `${attr}=${quoteStr}${placeholder}${quoteStr}${endChar}`;
    });
    
    
    const standaloneUrlPattern = /https?:\/\/[^\s<>"']+/g;
    str = str.replace(standaloneUrlPattern, (url) => {
      
      if (url.includes('?lt;') || url.includes('?gt;') || url.includes('?amp;') || url.startsWith('__URL_PLACEHOLDER_')) {
        return url;
      }
      const placeholder = `__URL_PLACEHOLDER_${placeholderIndex}__`;
      urlPlaceholders[placeholderIndex] = { url };
      placeholderIndex++;
      return placeholder;
    });

    const replacements = [
      [/\?nbsp;/g, " "],
      [/\?lt;/g, "<"],
      [/\?gt;/g, ">"],
      [/\?amp;/g, "&"],
      [/\?quot;/g, '"'],
      [/\?39;/g, "'"],
      [/\?\/span>/g, "</span>"],
      [/\?\/div>/g, "</div>"],
      [/\?\/p>/g, "</p>"],
      [/\?\/h[1-6]>/g, "</h$1>"],
      [/\?\/strong>/g, "</strong>"],
      [/\?\/em>/g, "</em>"],
      [/\?\/b>/g, "</b>"],
      [/\?\/i>/g, "</i>"],
      [/\?\/u>/g, "</u>"],
      [/\?span/g, "<span"],
      [/\?div/g, "<div"],
      [/\?p/g, "<p"],
      [/\?h([1-6])/g, "<h$1"],
      [/\?strong/g, "<strong"],
      [/\?em/g, "<em>"],
      [/\?b/g, "<b"],
      [/\?i/g, "<i"],
      [/\?u/g, "<u"],
      [/\?=/g, "="],
      [/\?>/g, ">"],
      [/\?[a-zA-Z0-9#\/]+/g, " "],
    ];

    replacements.forEach(([pattern, replacement]) => {
      str = str.replace(pattern, replacement);
    });

    
    urlPlaceholders.forEach((urlData, index) => {
      const placeholder = `__URL_PLACEHOLDER_${index}__`;
      if (urlData.attr && urlData.quote) {
        
        str = str.replace(placeholder, urlData.url);
      } else if (urlData.url) {
        
        str = str.replace(placeholder, urlData.url);
      }
    });

    return str;
  }

  static replaceHtmlEntities(str) {
    const replacements = [
      [/&nbsp;/g, " "],
      [/&lt;/g, "<"],
      [/&gt;/g, ">"],
      [/&amp;/g, "&"],
      [/&quot;/g, '"'],
      [/&#39;/g, "'"],
      [/&#160;/g, " "],
      [/&#xa0;/g, " "],
    ];

    replacements.forEach(([pattern, replacement]) => {
      str = str.replace(pattern, replacement);
    });

    return str;
  }
}

class ArticleDetailPage {
  constructor() {
    this.articleId = window.Utils.getUrlParam(URL_PARAMS.id);
    
    this.allArticles = [];
    this.init();
  }

  async init() {
    this.setupBackButton();
    await this.prepareAllowedArticles();

    let isRandomlySelected = false;

    
    if (
      !this.articleId ||
      this.articleId === "undefined" ||
      this.articleId === "null"
    ) {
      isRandomlySelected = true;
      if (this.allArticles && this.allArticles.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.allArticles.length);
        this.articleId = String(this.allArticles[randomIndex].id);
      } else {
        this.articleId = "1";
      }
    }
    
    

    if (!this.articleId) {
      this.showError("Article Not Found");
      return;
    }

    if (isRandomlySelected) {
      this.clearIdFromUrl();
    }

    await this.loadArticleDetail();
  }

  async prepareAllowedArticles() {
    if (Array.isArray(this.allArticles) && this.allArticles.length > 0) {
      return;
    }

    try {
      const response = await fetch(REMOTE_DB_URL);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const [meta, ...articles] = data;
          this.allArticles = Array.isArray(articles) ? articles : [];
        } else {
          this.allArticles = [];
        }
      } else {
        this.allArticles = [];
      }
    } catch (error) {
      this.allArticles = [];
    }
  }

  async loadArticleDetail() {
    try {
      
      const articleUrl = getArticleDetailUrl(this.articleId);
      const response = await fetch(articleUrl);

      const data = await response.json();
      
      
      if (!response.ok || data.error) {
        throw new Error(data.error || "Article not found in remote dataset");
      }

      const article = data;
      this.renderArticle(article);
      await this.renderRecommendedArticles();
    } catch (error) {
    
      if (!Array.isArray(this.articles)) {
        this.articles = [];
      }
      
      const article = this.articles.find(article => String(article.id) === this.articleId);
      
      if (article) {
        this.renderArticle(article);
        await this.renderRecommendedArticles();
      } else {
        
        const urlId = window.Utils.getUrlParam(URL_PARAMS.id);
        if (urlId && urlId !== "undefined" && urlId !== "null" && String(urlId) === String(this.articleId)) {
          
          this.showError(`Failed to Load Article: ${error.message}`);
        } else {
          
          if (Array.isArray(this.allArticles) && this.allArticles.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.allArticles.length);
            this.articleId = String(this.allArticles[randomIndex].id);
            await this.loadArticleDetail();
          } else {
            this.showError(`Failed to Load Article: ${error.message}`);
          }
        }
      }
    }
  }

  renderArticle(article) {
    this.updateElementText(SELECTORS.articleTitle, article.title);
    this.renderArticleMeta(article);
    this.renderArticleContent(article);
    this.renderMainImageFromContent();
  }

  renderArticleMeta(article) {
    
    const dateElement = document.getElementById("articleDate");
    if (dateElement && article.create_time) {
      const timeStr = window.Utils.formatTimestamp(article.create_time) || '';
      dateElement.textContent = timeStr;
    }

    
    const categoryElement = document.getElementById("articleCategory");
    if (categoryElement) {
      if (article.author) {
        const author = UnicodeDecoder.decode(article.author) || article.author || '';
        categoryElement.textContent = author;
      } else {
        categoryElement.textContent = "unknown";
      }
    }

    const articleSource = document.getElementById("articleSource");
    if (articleSource) {
      if (article.source) {
        articleSource.textContent = UnicodeDecoder.decode(article.source);
      } else {
        articleSource.textContent = "-";
      }
    }

  }

  updateElementText(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = text;
    }
  }

  renderArticleContent(article) {
    const contentContainer = document.getElementById("articleContent");
    if (!contentContainer) return;
    
    
    if (article.content && Array.isArray(article.content)) {
      const htmlContent = article.content
        .map((contentItem) => UnicodeDecoder.decode(contentItem))
        .join("");

      this.processAndRenderContent(contentContainer, htmlContent);

      this.normalizeContentImages(contentContainer, article.id);
      this.wrapTablesResponsive(contentContainer);
    } else {
      
      contentContainer.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h3>Article Details</h3>
          <p><strong>Title:</strong> ${article.title || 'N/A'}</p>
          <p><strong>Category:</strong> ${article.type || 'N/A'}</p>
          <p><strong>Source:</strong> ${article.source || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date(article.create_time).toLocaleString() || 'N/A'}</p>
          <p><em>Full content is not available in the current API response.</em></p>
        </div>
      `;
    }
  }

  processAndRenderContent(container, htmlContent) {
    
    const articleItemElements = Array.from(container.querySelectorAll(".article-item"));
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    
    const targetTotalLength = 2500;

    let accumulatedText = "";
    const headDiv = document.createElement("div");

    
    while (tempDiv.firstChild) {
      const node = tempDiv.firstChild;
      const text = node.textContent || "";

      
      if (accumulatedText.length >= targetTotalLength) {
        break;
      }

      accumulatedText += text;
      headDiv.appendChild(node);
    }

    
    const images = this.extractImages(headDiv);

    
    const fullText = this.extractFullText(headDiv);

    
    let sentences = fullText.match(/[^.!?。！？]+[.!?。！？]+/g) || [];

    const matchedText = sentences.join("");
    if (matchedText.length < fullText.length) {
      const remaining = fullText.substring(matchedText.length).trim();
      if (remaining) sentences.push(remaining);
    }
    if (sentences.length === 0 && fullText.trim()) sentences = [fullText];

    
    const processedParagraphs = [];
    let sentenceIndex = 0;

    for (let i = 0; i < 5 && sentenceIndex < sentences.length; i++) {
      const targetLength = i === 0 ? 300 : 500;
      let currentLength = 0;
      let paragraphSentences = [];

      while (sentenceIndex < sentences.length) {
        const sentence = sentences[sentenceIndex];

        if (
          paragraphSentences.length === 0 ||
          currentLength + sentence.length <= targetLength * 1.2
        ) {
          paragraphSentences.push(sentence);
          currentLength += sentence.length;
          sentenceIndex++;
          if (currentLength >= targetLength) break;
        } else {
          break;
        }
      }

      if (paragraphSentences.length > 0) {
        const p = document.createElement("p");
        p.textContent = paragraphSentences.join(" ");
        processedParagraphs.push(p);
      }
    }

    
    const finalChunks = this.combineImagesWithParagraphs(
      processedParagraphs,
      images
    );

    
    
    finalChunks.forEach((chunk, index) => {
      if (index < articleItemElements.length) {
        
        const targetElement = articleItemElements[index];
        targetElement.innerHTML = "";
        chunk.elements.forEach((el) => targetElement.appendChild(el));
      } else {
        
        const div = document.createElement("div");
        div.className = "article-item";
        chunk.elements.forEach((el) => div.appendChild(el));
        container.appendChild(div);
      }
    });

    
    if (sentenceIndex < sentences.length) {
      const leftoverText = sentences.slice(sentenceIndex).join(" ");
      if (leftoverText.trim()) {
        const p = document.createElement("p");
        p.textContent = leftoverText;
        
        const lastArticleItem = container.querySelector(".article-item:last-of-type");
        if (lastArticleItem) {
          lastArticleItem.appendChild(p);
        } else {
          container.appendChild(p);
        }
      }
    }

    
    while (tempDiv.firstChild) {
      const lastArticleItem = container.querySelector(".article-item:last-of-type");
      if (lastArticleItem) {
        lastArticleItem.appendChild(tempDiv.firstChild);
      } else {
        container.appendChild(tempDiv.firstChild);
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

  extractImages(htmlElement) {
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
        if (this.articleId) {
          const imgFileName = imgSrc.split("/").pop();
          const remoteImgUrl = `${REMOTE_DATA_BASE_URL}/${this.articleId}/${imgFileName}`;
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

  renderMainImageFromContent() {
    setTimeout(() => {
      const mainImage = document.getElementById("articleMainImage");
      const contentContainer = document.getElementById("articleContent");

      if (!mainImage) {
        return;
      }

      if (!contentContainer) {
        return;
      }

      const firstImg = contentContainer.querySelector("img");

      if (firstImg) {
        let imageSrc = firstImg.src || firstImg.getAttribute("src") || "";

        if (imageSrc) {
          mainImage.src = imageSrc;
          mainImage.alt = firstImg.alt || "";
          mainImage.style.display = "block";
          this.setDetailBackgroundImage(imageSrc);
          mainImage.onload = () => {
            mainImage.style.display = "block";
            };

          mainImage.onerror = () => {
            mainImage.style.display = "none";
            const imageContainer = document.getElementById("articleImageContainer");
            if (imageContainer) {
              imageContainer.style.display = "none";
            }
          };

          if (mainImage.complete && mainImage.naturalHeight !== 0) {
            mainImage.style.display = "block";
            }

          
          firstImg.style.display = "none";
          } else {
          }
      } else {
        }
    }, 50);
  }

  setDetailBackgroundImage(imageSrc) {
    if (!imageSrc) return;
    const detailPage = document.querySelector(".detail-page");
    if (!detailPage) return;
    detailPage.style.setProperty("--detail-hero-img", `url("${imageSrc}")`);
    detailPage.classList.add("has-hero-image");
  }

  normalizeContentImages(container, articleId) {
    if (!container) return;

    const normalizedId = articleId ? String(articleId) : "";
    const images = container.querySelectorAll(SELECTORS.image);

    images.forEach((img) => {
      const originalSrc = img.getAttribute("src") || "";
      if (!originalSrc) return;

      if (this.isAbsoluteOrRelativeUrl(originalSrc)) {
        return;
      }

      const fullImageUrl = normalizedId
        ? `${REMOTE_DATA_BASE_URL}/${normalizedId}/${originalSrc}`
        : `${REMOTE_DATA_BASE_URL}/${originalSrc}`;

      img.setAttribute("src", fullImageUrl);
    });
  }

  isAbsoluteOrRelativeUrl(url) {
    return (
      /^(https?:)?\/\//i.test(url) ||
      url.startsWith("./") ||
      url.startsWith("../") ||
      url.startsWith("/")
    );
  }

  wrapTablesResponsive(container) {
    const tables = container.querySelectorAll(SELECTORS.table);

    tables.forEach((table) => {
      if (
        table.parentElement.classList.contains(
          SELECTORS.tableResponsive.replace(".", "")
        )
      ) {
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.classList.add("table-responsive");
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  async renderRecommendedArticles() {
    await this.prepareAllowedArticles();
    this.renderDetailPageRecommendedArticles(this.articleId);
  }

  renderDetailPageRecommendedArticles(currentId) {
    const recommendedContainer = document.querySelector(
      SELECTORS.recommendedArticles
    );
    if (!recommendedContainer) return;

    const recommended = this.getRecommendedArticles(
      currentId,
      CONFIG.recommendedArticlesLimit
    );

    recommendedContainer.innerHTML = recommended
      .map((article) =>
        window.Utils.createDetailRecommendedArticleCard(
          article,
          UnicodeDecoder.decode.bind(UnicodeDecoder)
        )
      )
      .join("");
    this.bindDetailPageRecommendedEvents();
  }

  getRecommendedArticles(currentId, limit = CONFIG.recommendedArticlesLimit) {
    if (!Array.isArray(this.allArticles) || this.allArticles.length === 0) {
      return [];
    }

    const normalizedId = currentId ? String(currentId) : "";
    return this.allArticles
      .filter((article) => String(article.id) !== normalizedId)
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

  bindDetailPageRecommendedEvents() {
    window.Utils.bindArticleCardEvents("detail.html");
  }

  clearIdFromUrl() {
    if (typeof window === "undefined" || !window.history || !window.location) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete(URL_PARAMS.id);
    const newUrl = url.search ? url.toString() : url.pathname;
    window.history.replaceState({}, "", newUrl);
  }

  showError(message) {
    const contentContainer = document.getElementById("articleContent");
    if (!contentContainer) return;
    contentContainer.innerHTML = this.createErrorStateHTML(message);
  }

  createErrorStateHTML(message) {
    const escapedMessage = window.Utils.escapeHtml(message);
    const isInPagesDir = window.Utils?.isInPagesDir?.() || false;
    const backLink = isInPagesDir ? "../index.html" : "index.html";
    return `
      <div class="empty-state">
        <div class="empty-text">${escapedMessage}</div>
        <div class="empty-subtext">
          <a href="${backLink}">Back</a>
        </div>
      </div>
    `;
  }

  setupBackButton() {
    const imageBackButton = document.getElementById("imageBackButton");
    if (imageBackButton) {
      imageBackButton.addEventListener("click", (e) => {
        e.preventDefault();
        const isInPagesDir = window.Utils?.isInPagesDir?.() || false;
        const homePath = isInPagesDir ? "../index.html" : "index.html";
        window.location.href = homePath;
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ArticleDetailPage();
});
