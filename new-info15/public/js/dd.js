import {
  Category_URL,
  getImgUrl,
  getDataBaseUrl,
  getResourcePath,
} from "./BaseURL.js";

const REMOTE_DATA_BASE_URL = getDataBaseUrl();

const CONFIG = {
  recommendedArticlesLimit: 6,
};

const SELECTORS = {
  articleTitle: "#articleTitle",
  articleTime: "#articleTime",
  articleAuthor: "#articleAuthor",
  articleSource: "#articleSource",
  articleContent: "#articleContent",
  recommendedArticles: ".recommended-articles",
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
    this.articles = [];
    this.hasInitialValidId =
      this.articleId &&
      this.articleId !== "undefined" &&
      this.articleId !== "null";
    this.init();
  }

  async init() {
    this.setupBackButton();
    await this.prepareAllowedArticles();

    let isRandomlySelected = false;

    if (
      this.articleId &&
      this.articleId !== "undefined" &&
      this.articleId !== "null"
    ) {
     
      try {
        await this.loadArticleDetail();
        return; 
      } catch (error) {
        this.showError(`Failed to Load Article: ${error.message}`);
        return;
      }
    }

    isRandomlySelected = true;
    if (this.articles && this.articles.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.articles.length);
      this.articleId = String(this.articles[randomIndex].id);
    } else {
      this.articleId = "1";
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
      this.articles = this.allArticles;
      return;
    }

    try {
      const response = await fetch(Category_URL);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const [meta, ...articles] = data;
          this.allArticles = Array.isArray(articles) ? articles : [];
          this.articles = this.allArticles;
        } else {
          this.allArticles = [];
          this.articles = [];
        }
      } else {
        this.allArticles = [];
        this.articles = [];
      }
    } catch (error) {
      this.allArticles = [];
      this.articles = [];
    }
  }

  async loadArticleDetail() {
    const resourcePath = getResourcePath();
    const articleUrl = `${REMOTE_DATA_BASE_URL}/${this.articleId}/${resourcePath}/data.json`;
    const response = await fetch(articleUrl);

    if (!response.ok) {
      throw new Error(`Article not found: ${response.status} ${response.statusText}`);
    }

    const article = await response.json();
    this.renderArticle(article);
    await this.renderRecommendedArticles();
  }

  renderArticle(article) {
    this.updateElementText(SELECTORS.articleTitle, article.title);
    this.renderArticleMeta(article);
    this.renderArticleSource(article);
    this.renderArticleContent(article);
    this.renderMainImageFromContent();
  }

  renderArticleMeta(article) {
    const timeElement = document.querySelector(SELECTORS.articleTime);
    if (timeElement) {
      if (article.create_time) {
        const timeStr = window.Utils?.formatTimestamp?.(article.create_time) || '';
        if (timeStr) {
          timeElement.textContent = timeStr;
          timeElement.style.display = '';
        } else {
          timeElement.style.display = 'none';
        }
      } else {
        timeElement.style.display = 'none';
      }
    }


    const authorElement = document.querySelector(SELECTORS.articleAuthor);
    if (authorElement) {
      if (article.author) {
        authorElement.textContent = article.author;
        authorElement.style.display = '';
      } else {
        authorElement.style.display = 'none';
      }
    }
  }

  renderArticleSource(article) {
    const sourceElement = document.querySelector(SELECTORS.articleSource);
    if (sourceElement && article.source) {
      sourceElement.textContent = article.source;
    } else if (sourceElement) {
      sourceElement.style.display = 'none';
    }
  }

  updateElementText(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = text;
    }
  }

  renderArticleContent(article) {
    const contentContainer = document.querySelector(SELECTORS.articleContent);
    if (!contentContainer) return;
    if (article.content && Array.isArray(article.content)) {

      const protectedUrls = new Map();
      let urlCounter = 0;
      
      const protectUrls = (text) => {
        return text.replace(/(https?:\/\/[^\s<>"'`]+)/gi, (url) => {
          const placeholder = `__PROTECTED_URL_${urlCounter}__`;
          protectedUrls.set(placeholder, url);
          urlCounter++;
          return placeholder;
        });
      };
      
      const restoreUrls = (text) => {
        protectedUrls.forEach((url, placeholder) => {
          text = text.replace(placeholder, url);
        });
        return text;
      };
      
      const htmlContent = article.content
        .map((contentItem) => protectUrls(contentItem))
        .map((contentItem) => UnicodeDecoder.decode(contentItem))
        .join("");
      
      const restoredHtmlContent = restoreUrls(htmlContent);

      this.processAndRenderContent(contentContainer, restoredHtmlContent);

      this.normalizeContentImages(contentContainer, article.id);
      this.wrapTablesResponsive(contentContainer);
    } else {
      contentContainer.innerHTML = "<p>Content not available</p>";
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
          const baseUrl = getDataBaseUrl();
          const resourcePath = getResourcePath();
          const remoteImgUrl = `${baseUrl}/${this.articleId}/${resourcePath}/${imgFileName}`;
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
      const contentContainer = document.querySelector(SELECTORS.articleContent);

      if (!mainImage) {
        console.warn("Main image element not found");
        return;
      }

      if (!contentContainer) {
        console.warn("Content container not found");
        return;
      }

      const firstImg = contentContainer.querySelector("img");

      if (firstImg) {
        let imageSrc = firstImg.src || firstImg.getAttribute("src") || "";

        if (imageSrc) {
          mainImage.src = imageSrc;
          mainImage.alt = firstImg.alt || "";
          mainImage.style.display = "block";
          mainImage.onload = () => {
            mainImage.style.display = "block";
            };

          mainImage.onerror = () => {
            console.warn("Failed to load main image:", imageSrc);
          };

          if (mainImage.complete && mainImage.naturalHeight !== 0) {
            mainImage.style.display = "block";
            console.log("Main image already cached");
          }

          firstImg.remove();
          console.log("First image removed from content");
        } else {
          console.warn("Image src is empty");
        }
      } else {
        console.warn("No image found in content");
      }
    }, 50);
  }

  normalizeContentImages(container, articleId) {
    if (!container) return;

    const normalizedId = articleId ? String(articleId) : "";
    const resourcePath = getResourcePath();
    const images = container.querySelectorAll(SELECTORS.image);

    images.forEach((img) => {
      const originalSrc = img.getAttribute("src") || "";
      if (!originalSrc) return;

      if (this.isAbsoluteOrRelativeUrl(originalSrc)) {
        return;
      }

      const fullImageUrl = normalizedId
        ? `${REMOTE_DATA_BASE_URL}/${normalizedId}/${resourcePath}/${originalSrc}`
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
    window.Utils.bindArticleCardEvents("dd.html");
  }

  isArticleIdAllowed(id) {
    if (
      !id ||
      !Array.isArray(this.allArticles) ||
      this.allArticles.length === 0
    ) {
      return false;
    }

    const targetId = String(id);
    return this.allArticles.some(
      (article) => article && article.id && String(article.id) === targetId
    );
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
    const contentContainer = document.querySelector(SELECTORS.articleContent);
    if (!contentContainer) return;
    contentContainer.innerHTML = this.createErrorStateHTML(message);
  }

  createErrorStateHTML(message) {
    const escapedMessage = window.Utils.escapeHtml(message);
    const isInPagesDir = window.Utils?.isInPagesDir?.() || false;
    const backLink = isInPagesDir ? "../index.html" : "index.html";
    return `
      <div class="empty-state">
        <div class="empty-state-text">${escapedMessage}</div>
        <div class="empty-state-subtext">
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
