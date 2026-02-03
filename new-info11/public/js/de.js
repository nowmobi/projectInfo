import {
  getImgUrl,
  getDataBaseUrl,
  fetchCategoryData,
  getArticleDetailUrl,
} from "./BaseURL.js";

const REMOTE_DATA_BASE_URL = getDataBaseUrl();

const CONFIG = {
  recommendedArticlesLimit: 6,
};

const SELECTORS = {
  articleTitle: "#articleTitle",
  articleType: "#articleType",
  articleTime: "#articleTime",
  articleSource: "#articleSource",
  articleContent: "#articleContent",
  recommendedArticles: ".recommended-articles",
  table: "table",
  image: "img",
  tableResponsive: ".table-responsive",
};

const URL_PARAMS = {
  id: "id",
  type: "type",
};

class UnicodeDecoder {
  static decode(str) {
    if (!str) return "";

    const protectedUrls = [];
    let protectedStr = str;

    protectedStr = this.protectUrls(protectedStr, protectedUrls);

    const textarea = document.createElement("textarea");
    textarea.innerHTML = protectedStr;
    let decoded = textarea.value;

    decoded = this.replaceUnicodeEscapes(decoded);

    decoded = this.replaceQuestionMarkEntities(decoded);

    decoded = this.replaceHtmlEntities(decoded);

    decoded = decoded.replace(/[\uFFFD\uFFFE\uFEFF]/g, "");

    decoded = this.restoreUrls(decoded, protectedUrls);

    return decoded;
  }

  static protectUrls(str, protectedUrls) {
    const urlPattern = /(src|href)=["']([^"']+)["']/gi;
    return str.replace(urlPattern, (match, attr, url) => {
      const placeholder = `__PROTECTED_URL_${protectedUrls.length}__`;
      protectedUrls.push({ attr, url });
      return `${attr}="${placeholder}"`;
    });
  }

  static restoreUrls(str, protectedUrls) {
    protectedUrls.forEach((item, index) => {
      const placeholder = `__PROTECTED_URL_${index}__`;
      str = str.replace(placeholder, item.url);
    });
    return str;
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
    this.articleTypeParam = window.Utils.getUrlParam(URL_PARAMS.type);
    this.allArticles = [];
    this.articles = [];

    this.hasInitialValidId =
      this.articleId &&
      this.articleId !== "undefined" &&
      this.articleId !== "null";
    this.init();
  }

  async init() {
    await this.prepareAllowedArticles();

    let isRandomlySelected = false;

    if (
      !this.articleId ||
      this.articleId === "undefined" ||
      this.articleId === "null"
    ) {
      isRandomlySelected = true;
      if (this.articles && this.articles.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.articles.length);
        this.articleId = String(this.articles[randomIndex].id);
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
      this.articles = this.allArticles;
      return;
    }

    try {
      
      const data = await fetchCategoryData();
      if (Array.isArray(data) && data.length > 0) {
        const [meta, ...articles] = data;
        this.allArticles = Array.isArray(articles) ? articles : [];
        this.articles = this.allArticles;
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
    try {
      const articleUrl = getArticleDetailUrl(this.articleId);
      const response = await fetch(articleUrl);

      if (!response.ok) {
        throw new Error("Article not found in remote dataset");
      }

      const article = await response.json();
      this.renderArticle(article);
      await this.renderRecommendedArticles();
    } catch (error) {
      if (this.hasInitialValidId) {
        const originalId = this.articleId;
        if (this.articles && this.articles.length > 0) {
          const randomIndex = Math.floor(Math.random() * this.articles.length);
          this.articleId = String(this.articles[randomIndex].id);
          this.clearIdFromUrl();
          await this.loadArticleDetail();
        } else {
          this.showError(`Failed to Load Article: ${error.message}`);
        }
      } else {
        this.showError(`Failed to Load Article: ${error.message}`);
      }
    }
  }

  renderArticle(article) {
    this.updateElementText(SELECTORS.articleTitle, article.title);

    const articleAuthor = article.author
      ? UnicodeDecoder.decode(article.author)
      : "-";
    this.updateElementText(SELECTORS.articleType, articleAuthor);

    const articleTime =
      window.Utils?.formatTimestamp?.(article.create_time) || "-";
    this.updateElementText(SELECTORS.articleTime, articleTime);

    const articleSource = article.source
      ? UnicodeDecoder.decode(article.source)
      : "";
    if (articleSource) {
      this.updateElementText(SELECTORS.articleSource, articleSource);
    } else {
      const sourceElement = document.querySelector(SELECTORS.articleSource);
      if (sourceElement) {
        sourceElement.style.display = "none";
      }
    }

    this.renderArticleContent(article);
    this.renderMainImageFromContent();
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

      this.distributeContentToArticleItems(
        contentContainer,
        htmlContent,
        article.id
      );
      this.normalizeContentImages(contentContainer, article.id);
      this.wrapTablesResponsive(contentContainer);
    } else {
      contentContainer.innerHTML = "<p>Content not available</p>";
    }
  }

  distributeContentToArticleItems(contentContainer, htmlContent, articleId) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const images = this.extractImages(tempDiv, articleId);
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

    const finalChunks = this.combineImagesWithParagraphs(
      processedParagraphs,
      images
    );

    const articleItems = Array.from(
      contentContainer.querySelectorAll(".article-item")
    );

    for (let i = 0; i < articleItems.length && i < finalChunks.length; i++) {
      articleItems[i].innerHTML = "";
      finalChunks[i].elements.forEach((element) => {
        articleItems[i].appendChild(element);
      });
    }

    if (remainingElements.length > 0) {
      remainingElements.forEach((element) => {
        contentContainer.appendChild(element);
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

  extractImages(htmlElement, articleId) {
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
        if (articleId) {
          const imgFileName = imgSrc.split("/").pop() || "1.png";
          const baseUrl = getDataBaseUrl();
          const remoteImgUrl = `${baseUrl}/${articleId}/${imgFileName}`;
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

  isAbsoluteOrRelativeUrl(url) {
    if (!url) return false;
    
    const trimmedUrl = url.trim();
    
    if (trimmedUrl.startsWith("http://") || 
        trimmedUrl.startsWith("https://") || 
        trimmedUrl.startsWith("//")) {
      return true;
    }
    
    if (trimmedUrl.startsWith("./") || 
        trimmedUrl.startsWith("../") || 
        trimmedUrl.startsWith("/")) {
      return true;
    }
    
    return false;
  }

  normalizeContentImages(container, articleId) {
    const images = container.querySelectorAll("img");

    images.forEach((img) => {
      const originalSrc = img.getAttribute("src") || "";

      if (this.isAbsoluteOrRelativeUrl(originalSrc)) {
        return;
      }

      const normalizedId = articleId ? String(articleId) : "";
      const fullImageUrl = normalizedId
        ? `${REMOTE_DATA_BASE_URL}/${normalizedId}/${originalSrc}`
        : `${REMOTE_DATA_BASE_URL}/${originalSrc}`;

      img.setAttribute("src", fullImageUrl);
    });
  }

  renderMainImageFromContent() {
    setTimeout(() => {
      const mainImage = document.getElementById("articleMainImage");
      const imageContainer = document.getElementById("articleMainImageContainer");
      const contentContainer = document.getElementById("articleContent");

      if (!mainImage || !imageContainer || !contentContainer) {
        return;
      }

      const firstImg = contentContainer.querySelector("img");

      if (firstImg) {
        let imageSrc = firstImg.src || firstImg.getAttribute("src") || "";

        if (imageSrc) {
          mainImage.src = imageSrc;
          mainImage.alt = firstImg.alt || "";
          imageContainer.style.display = "block";

          mainImage.onload = () => {
            mainImage.style.display = "block";
          };

          mainImage.onerror = () => {
            mainImage.style.display = "none";
            imageContainer.style.display = "none";
          };

          firstImg.remove();
        }
      }
    }, 50);
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
    try {
      await this.prepareAllowedArticles();
      this.renderDetailPageRecommendedArticles(this.articleId);
    } catch (error) {}
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
        window.Utils.createArticleCard(
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
    window.Utils.bindArticleCardEvents("de.html");
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

    try {
      const url = new URL(window.location.href);

      url.searchParams.delete(URL_PARAMS.id);

      const newUrl = url.search ? url.toString() : url.pathname;
      window.history.replaceState({}, "", newUrl);
    } catch (error) {}
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
        <div class="empty-state-text">${escapedMessage}</div>
        <div class="empty-state-subtext">
          <a href="${backLink}">Back</a>
        </div>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ArticleDetailPage();
});
