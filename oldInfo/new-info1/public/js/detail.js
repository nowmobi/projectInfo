
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
    await this.loadArticleDetail();
    this.setupEventListeners();
  }

  async loadArticleDetail() {
    try {
      
      const healthsUrl = BASE_URL.replace("/number/", `/${this.articleId}/`);

      const healthsResponse = await fetch(healthsUrl);

      if (healthsResponse.ok) {
        const healthsArticle = await healthsResponse.json();

        this.renderArticle(healthsArticle);
        this.renderRecommendedArticles();
        return;
      }

      
      const dbResponse = await fetch(Category_URL);

      if (!dbResponse.ok) {
        throw new Error(`Failed to load db.json: ${dbResponse.status}`);
      }

      const dbData = await dbResponse.json();

      const dbArticle = dbData.find((a) => a.id == this.articleId);

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

    const articleCategory = document.getElementById("articleAuthor");
    if (article.type) {
      articleCategory.textContent = Utils.decodeUnicode(article.type);
    } else {
      articleCategory.textContent = "-";
    }

    const articleTime = document.getElementById("articleTime");
    if (article.create_time) {
      articleTime.textContent = Utils.formatTime(article.create_time);
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
                          Utils.decodeUnicode(article.type) || "Unknown"
                        }</p>
                        <p>Created: ${
                          article.create_time
                            ? Utils.formatTime(article.create_time)
                            : "Unknown"
                        }</p>
                    `;
      return;
    }

    if (article.content && Array.isArray(article.content)) {
      let htmlContent = article.content
        .map((contentItem) => {
          const decodedContent = Utils.decodeUnicode(contentItem);
          return decodedContent;
        })
        .join("");

      
      htmlContent = this.replaceImageUrls(htmlContent, article.id);

      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }

      this.distributeContentToArticleItems(contentContainer, htmlContent);

      this.wrapTablesResponsive(contentContainer);
    } else if (article.section) {
      contentContainer.innerHTML = `
                        <p>${Utils.decodeUnicode(article.section)}</p>
                        <p>Full content is being loaded...</p>
                    `;
    } else {
      contentContainer.innerHTML = "<p>Content not available</p>";
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

        // 使用图片的原始格式，因为远程服务器现在使用jpg格式
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
      allPElements.length > 0
        ? allPElements
        : Array.from(tempDiv.children).filter((el) => {
            const tagName = el.tagName.toLowerCase();
            
            return [
              "div",
              "p",
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "ul",
              "ol",
              "li",
              "strong",
              "blockquote",
              "pre",
              "table",
            ].includes(tagName);
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
    } catch (error) {}
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
      return article && article.id != null && article.id !== "" && String(article.id).trim() !== "";
    });

    
    if (validRecommended.length === 0) {
      recommendedContainer.innerHTML = "";
      return;
    }

    recommendedContainer.innerHTML = validRecommended
      .map((article) => {
        const href =
          `detail.html?id=${article.id}` +
          (window.channel ? `&channel=${window.channel}` : "");
        return `
                    <a class="recommended-card" href="${href}">
                        <div class="recommended-image">
                            <img src="${window.healthNewsApp.getArticleImage(
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
                            <h4 class="recommended-card-title">${
                              article.title
                            }</h4>
                            <p class="recommended-summary">${
                              article.summary
                                ? article.summary.substring(0, 60) + "..."
                                : ""
                            }</p>
                            ${
                              !article.summary
                                ? `<span class="recommended-type-tag">${
                                    Utils.decodeUnicode(article.type) ||
                                    "Unknown Type"
                                  }</span>`
                                : ""
                            }
                        </div>
                    </a>
                `;
      })
      .join("");

    // a 标签原生跳转，无需绑定点击事件
  }

  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  generateRandomArticleId() {
    const randomId = Math.floor(Math.random() * 130) + 1;
    return randomId.toString();
  }

  showError(message) {
    const contentContainer = document.getElementById("articleContent");
    contentContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-text">${message}</div>
                        <div class="empty-state-subtext">
                            <a href="${
                              "index.html" +
                              (window.channel
                                ? "&channel=" + window.channel
                                : "")
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
    
    window.location.href =
      "index.html" + (window.channel ? "?channel=" + window.channel : "");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ArticleDetailPage();
});
