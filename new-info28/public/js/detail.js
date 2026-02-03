import { getImgUrl, getDataBaseUrl, DETAIL_PATH, fetchDbData } from "./BaseURL.js";

const REMOTE_DATA_BASE_URL = getDataBaseUrl();
class ArticleDetailPage {
  constructor() {
    this.articleId = window.Utils.getUrlParam("id");

    this.articleTypeParam = window.Utils.getUrlParam("type");

    this.allArticles = [];
    this.init();
  }

  async prepareAllowedArticles() {
    if (Array.isArray(this.allArticles) && this.allArticles.length > 0) {
      return;
    }

    if (this._articlesPromise) {
      await this._articlesPromise;
      return;
    }

    this._articlesPromise = (async () => {
      try {
        const data = await fetchDbData();
        if (Array.isArray(data) && data.length > 0) {
          const [meta, ...articles] = data;
          this.allArticles = Array.isArray(articles) ? articles : [];
        } else {
          this.allArticles = [];
        }
      } catch (error) {
        this.allArticles = [];
      }
    })();

    await this._articlesPromise;
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
  }

  async loadArticleDetail() {
    try {
      const articleUrl = `${REMOTE_DATA_BASE_URL}${this.articleId}/${DETAIL_PATH}/data.json`;
      const response = await fetch(articleUrl);

      if (!response.ok) {
        throw new Error("Article not found in remote dataset");
      }

      const article = await response.json();
      this.renderArticle(article);
      await this.renderRecommendedArticles();
    } catch (error) {
      this.showError("Failed to Load Article: " + error.message);
    }
  }

  renderArticle(article) {
    document.getElementById("articleTitle").textContent = article.title;

    const articleType = document.getElementById("articleType");
    if (article.type) {
      articleType.textContent = this.decodeUnicode(article.type);
    } else {
      articleType.textContent = "-";
    }

    const articleTime = document.getElementById("articleTime");
    articleTime.textContent =
      window.Utils?.formatTimestamp?.(article.create_time) || "-";

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

      this.distributeContentToArticleItems(
        contentContainer,
        htmlContent,
        article
      );
      this.wrapTablesResponsive(contentContainer);
    } else {
      contentContainer.innerHTML = "<p>Content not available</p>";
    }
  }

  distributeContentToArticleItems(contentContainer, htmlContent, article) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const images = this.extractImages(tempDiv, article);
    let fullText = this.extractFullText(tempDiv);

    if (!fullText || fullText.trim().length === 0) {
      contentContainer.innerHTML = htmlContent;
      this.normalizeContentImages(contentContainer, article.id);
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

    const usedText = sentences.slice(0, sentenceIndex).join("");
    const remainingElements = this.extractRemainingHTMLElements(
      tempDiv,
      usedText.length
    );
    const finalChunks = this.combineImagesWithParagraphs(
      processedParagraphs,
      images
    );

    const articleItems = Array.from(
      contentContainer.querySelectorAll(".article-item")
    );
    const maxContainers = Math.min(5, articleItems.length);

    for (let i = 0; i < maxContainers; i++) {
      articleItems[i].innerHTML = "";

      if (i < finalChunks.length) {
        finalChunks[i].elements.forEach((element) => {
          articleItems[i].appendChild(element);
        });
      }
    }

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

    this.normalizeContentImages(contentContainer, article.id);
  }

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
          const remoteImgUrl = `${REMOTE_DATA_BASE_URL}${article.id}/${DETAIL_PATH}/${imgFileName}`;
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

  normalizeContentImages(container, articleId) {
    if (!container) return;

    const normalisedId = articleId ? String(articleId) : "";
    const images = container.querySelectorAll("img");

    images.forEach((img) => {
      const originalSrc = img.getAttribute("src") || "";
      if (!originalSrc) return;

      if (
        /^(https?:)?\/\//i.test(originalSrc) ||
        originalSrc.startsWith("./") ||
        originalSrc.startsWith("../") ||
        originalSrc.startsWith("/")
      ) {
        return;
      }

      if (normalisedId) {
        img.setAttribute(
          "src",
          `${REMOTE_DATA_BASE_URL}${normalisedId}/${DETAIL_PATH}/${originalSrc}`
        );
      } else {
        img.setAttribute("src", `${REMOTE_DATA_BASE_URL}${originalSrc}`);
      }
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
      ".recommended-articles"
    );
    if (!recommendedContainer) return;

    const recommended = this.getRecommendedArticles(currentId, 6);

    recommendedContainer.innerHTML = recommended
      .map((article) =>
        window.Utils.createArticleCard(article, this.decodeUnicode.bind(this))
      )
      .join("");

    this.bindDetailPageRecommendedEvents();
  }

  getRecommendedArticles(currentId, limit = 3) {
    if (!Array.isArray(this.allArticles) || this.allArticles.length === 0) {
      return [];
    }

    const normalisedId = currentId ? String(currentId) : "";

    return this.allArticles
      .filter((article) => String(article.id) !== normalisedId)
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

  bindDetailPageRecommendedEvents() {
    window.Utils.bindArticleCardEvents("depth.html");
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
      }
    }

    const randomIndex = Math.floor(Math.random() * availableArticles.length);
    const selectedArticle = availableArticles[randomIndex];

    if (!selectedArticle || !selectedArticle.id) {
      return null;
    }

    return String(selectedArticle.id);
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
