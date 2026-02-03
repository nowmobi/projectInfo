
import { Detail_BASE_URL, DETAIL_PATH, getArticlesData, decodeUnicode, formatTime, getUrlParam } from "./BaseURL.js";

class ArticleDetailPage {
  constructor() {
    this.articleId = getUrlParam("id");
    this.needRandomArticle = !this.articleId;
    
   
    
    if (window.healthNewsApp) {
      if (window.healthNewsApp.articles && window.healthNewsApp.articles.length > 0) { 
      }
    }
    this.init();
  }

  async init() {
    this.showPageLoading();
   
    this.ensureScrollable();

    try {
      await this.loadArticleDetail();
      this.setupEventListeners();
    } catch (error) {
    } finally {
      this.hidePageLoading();
    }
  }

 
  showPageLoading() {
   
    const mainContent = document.querySelector("main");
    if (mainContent) {
      mainContent.style.visibility = "hidden";
      mainContent.style.opacity = "0";
    }

   
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "pageLoadingOverlay";
    loadingOverlay.innerHTML = `
      <div class="page-loading-spinner"></div>
    `;
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;

    const style = document.createElement("style");
    style.textContent = `
      .page-loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--primary-background);
        border-radius: 50%;
        animation: page-spin 1s linear infinite;
      }
      @keyframes page-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(loadingOverlay);
  }

 
  hidePageLoading() {
    const loadingOverlay = document.getElementById("pageLoadingOverlay");
    if (loadingOverlay) {
     
      loadingOverlay.style.transition = "opacity 0.3s ease";
      loadingOverlay.style.opacity = "0";

      setTimeout(() => {
        loadingOverlay.remove();

       
        const mainContent = document.querySelector("main");
        if (mainContent) {
          mainContent.style.transition = "opacity 0.3s ease";
          mainContent.style.visibility = "visible";
          mainContent.style.opacity = "1";
          mainContent.style.height = "";
          mainContent.style.maxHeight = "";
          mainContent.style.overflow = "";
        }
        document.body.style.overflow = "";
        document.body.style.height = "";
        document.documentElement.style.overflow = "";
        document.documentElement.style.height = "";
      }, 300);
    }
  }

 
  ensureScrollable() {
   
    document.body.style.overflow = "";
    document.body.style.overflowY = "";
    document.body.style.height = "";
    document.body.style.maxHeight = "";
    document.documentElement.style.overflow = "";
    document.documentElement.style.overflowY = "";
    document.documentElement.style.height = "";
    document.documentElement.style.maxHeight = "";
    document.body.style.webkitOverflowScrolling = "touch";
  }

  async loadArticleDetail() {
    try {
     
      let dbData;
      if (window.healthNewsApp && window.healthNewsApp.articles && window.healthNewsApp.articles.length > 0) {
        const categoryNames = window.healthNewsApp.categories
          ? window.healthNewsApp.categories.map(cat => cat.name)
          : [];
        dbData = [{ info1: categoryNames }, ...window.healthNewsApp.articles];
      } else {
        dbData = await getArticlesData();
      }
      

     
      let articles = Array.isArray(dbData) ? dbData : [];
      articles = articles.filter(item => {
        if (item && typeof item === 'object' && 'info1' in item) {
          return false;
        }
       
        const isArticle = item && item.id && item.title;
        if (!isArticle) {
        }
        return isArticle;
      });

      let dbArticle = null;
      let fetchedArticleData = null;
      
      
      if (window.healthNewsApp && window.healthNewsApp.selectedArticle) {
        dbArticle = window.healthNewsApp.selectedArticle;
        this.articleId = dbArticle.id;
      } else if (this.needRandomArticle) {
        const randomIndex = Math.floor(Math.random() * articles.length);
        dbArticle = articles[randomIndex];
        this.articleId = dbArticle.id;
      } else {
        
        dbArticle = articles.find((a) => String(a.id) === String(this.articleId));
        
        if (!dbArticle) {
          
          const cachedArticles = localStorage.getItem('cachedArticles');
          if (cachedArticles) {
            try {
              const parsedArticles = JSON.parse(cachedArticles);
              const cachedArticle = parsedArticles.find(a => String(a.id) === String(this.articleId));
              if (cachedArticle) {
                dbArticle = cachedArticle;
              }
            } catch (e) {
              
            }
          } 
          
          
          if (!dbArticle && Detail_BASE_URL) {
            
            try {
              const articleUrl = `${Detail_BASE_URL}/${this.articleId}/${DETAIL_PATH}`;
              const articleResponse = await fetch(articleUrl, { cache: "no-cache" });
              if (articleResponse.ok) {
                fetchedArticleData = await articleResponse.json();
                
                dbArticle = fetchedArticleData;
              } 
            } catch (error) { 
            }
          }
          
          if (!dbArticle) {
            this.showError(`Article Not Found (ID: ${this.articleId})`);
            return;
          }
        }
      }
      
      if (dbArticle.create_time && dbArticle.create_time > 1000000000000) {
        dbArticle.create_time = Math.floor(dbArticle.create_time / 1000);
      }

      
      let detailData = fetchedArticleData;
      if (!detailData) {
        try {
          const detailUrl = `${Detail_BASE_URL}/${this.articleId}/${DETAIL_PATH}`;
          const detailResponse = await fetch(detailUrl, { cache: "no-cache" });
          if (detailResponse.ok) {
            detailData = await detailResponse.json();
          } 
        } catch (error) {
        }
      }

     
      const fullArticle = dbArticle ? { ...dbArticle, ...detailData } : detailData;
      if (fullArticle.create_time && fullArticle.create_time > 1000000000000) {
        fullArticle.create_time = Math.floor(fullArticle.create_time / 1000);
      }
      this.renderArticle(fullArticle, detailData);
      this.renderRecommendedArticles();
    } catch (error) {
      this.showError("Failed to Load Article: " + error.message);
    }
  }

  renderArticle(article, detailData) {
    document.title = `${article.title} - Health News`;
    document.getElementById("articleTitle").textContent = article.title;

    const articleType = document.getElementById("articleType");
    if (article.type) {
      let typeText = decodeUnicode(article.type);
      if (typeText.length > 18) {
        typeText = typeText.substring(0, 18) + "...";
      }
      articleType.textContent = typeText;
    } else {
      articleType.textContent = "-";
    }

    const articleTime = document.getElementById("articleTime");
    if (article.create_time) {
      articleTime.textContent = formatTime(article.create_time);
    } else {
      articleTime.textContent = "-";
    }

   
    const articleSource = document.getElementById("articleSource");
    const articleSourceText = document.getElementById("articleSourceText");
    if (articleSource && articleSourceText) {
      const source = article.source || article.author || '';
      if (source) {
        articleSourceText.textContent = decodeUnicode(source);
        articleSource.style.display = "block";
      } else {
        articleSource.style.display = "none";
      }
    }
    this.renderArticleContent(article, detailData);
  }

  renderArticleContent(article, detailData) {
    const contentContainer = document.getElementById("articleContent");
   
    const loading = contentContainer.querySelector(".loading");
    if (loading) {
      loading.style.display = "none";
    }

   
    if (article.content) {
      let htmlContent = '';
      if (Array.isArray(article.content)) {
        
       
        htmlContent = article.content
          .map((contentItem) => {
            const decodedContent = decodeUnicode(contentItem);
            return decodedContent;
          })
          .join("");

        const processedHtmlContent = this.replaceImageUrls(
          htmlContent,
          article.id,
          article
        );

        this.distributeContentToArticleItems(
          contentContainer,
          processedHtmlContent
        );

        this.wrapTablesResponsive(contentContainer);
        return;
      } else if (typeof article.content === 'string') {
        const decodedContent = decodeUnicode(article.content);
        const processedHtmlContent = this.replaceImageUrls(
          decodedContent,
          article.id,
          article
        );
        
        
        const firstArticleItem = contentContainer.querySelector(".article-item");
        if (firstArticleItem) {
          firstArticleItem.innerHTML = `<p>${processedHtmlContent}</p>`;
        }
        this.wrapTablesResponsive(contentContainer);
        return;
      } 
    } 

   
    if (article.section) {
      const firstArticleItem = contentContainer.querySelector(".article-item");
      if (firstArticleItem) {
        firstArticleItem.innerHTML = `<p>${article.section}</p>`;
      }
      return;
    } 
   
    const articleItems = contentContainer.querySelectorAll(".article-item");
    
   
    if (articleItems.length > 0) {
     
      let htmlContent = `
        <div style="text-align: center; color: #666; font-size: 14px; margin-bottom: 30px;">
          <p><strong>${decodeUnicode(article.type) || "Unknown Type"}</strong></p>
          <p>Published: ${article.create_time ? formatTime(article.create_time) : "Unknown"}</p>
        </div>
        <div style="line-height: 1.8; color: #333;">
          <p style="font-size: 18px; color: #555; margin-bottom: 20px;">
            ${article.title || "No title available"}
          </p>
      `;
      
     
      const contentFields = [
        { name: 'desc', displayName: 'Description' },
        { name: 'description', displayName: 'Description' },
        { name: 'summary', displayName: 'Summary' },
        { name: 'text', displayName: 'Text' },
        { name: 'body', displayName: 'Body' },
      ];
      
      let foundContent = false;
      for (const field of contentFields) {
        if (article[field.name]) {
          htmlContent += `<p style="color: #333; font-size: 16px;">
            <strong>${field.displayName}:</strong><br>
            ${decodeUnicode(article[field.name])}
          </p>`;
          foundContent = true;
        }
      }
      
     
      if (article.img) {
        const imgUrl = article.img;
        
        htmlContent += `<div style="text-align: center; margin: 20px 0;">
          <img src="${imgUrl}" alt="${article.title || ''}" 
               style="width: 100%; height: 30vh; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px; "
               onerror="this.style.display='none';">
        </div>`;
      }
      
     
      if (!article.content && !article.section && !foundContent) {
        htmlContent += `<p style="color: #999; font-size: 14px; margin-top: 30px;">
          <strong>Debug Info:</strong><br>
          Article ID: ${article.id}<br>
          Available fields: ${Object.keys(article).join(', ')}<br>
          Detail API called: ${detailData ? 'Yes' : 'No'}<br>
          Detail API data: ${detailData ? JSON.stringify(detailData).substring(0, 200) + '...' : 'None'}
        </p>`;
      }
      htmlContent += `</div>`;
      articleItems[0].innerHTML = htmlContent;
    }
  }

 
  replaceImageUrls(htmlContent, articleId, article = null) {
    if (!htmlContent || !articleId) {
      return htmlContent;
    }

    return htmlContent.replace(
      /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
      (match, before, src, after) => {
        let finalSrc = src;
        return `<div style="text-align: center; margin: 20px 0;"><img${before}src="${finalSrc}"${after} style="width: 100%; height: 30vh; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px;"></div>`;
      }
    );
  }

 
  distributeContentToArticleItems(contentContainer, htmlContent) {
   
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
   
    const images = this.extractImages(tempDiv);
   
    const allPElements = Array.from(tempDiv.querySelectorAll("p"));
   
    const allBlockElements =
      allPElements.length > 0 ? allPElements : Array.from(tempDiv.children);

   
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

   
    if (remainingElements.length > 0 && articleItems.length >= 5) {
     
      const fifthItem = articleItems[4];
     
      let lastInsertedElement = fifthItem;
      remainingElements.forEach((element, index) => {
        lastInsertedElement.insertAdjacentElement("afterend", element);
        lastInsertedElement = element;
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
    } catch (error) {
     
    }
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
      const articleId = article.id;
      return (
        articleId !== undefined &&
        articleId !== null &&
        articleId !== "" &&
        String(articleId).trim() !== ""
      );
    });

   
    if (validRecommended.length === 0) {
      recommendedContainer.innerHTML = "";
      return;
    }

    recommendedContainer.innerHTML = validRecommended
      .map(
        (article) => `
                    <div class="article-card" data-id="${article.id}">
                        <div class="article-image">
                            <img src="${window.healthNewsApp.getArticleImage(
                              article
                            )}" alt="${
          article.title || ""
        }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
                                <div>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                                        <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                                    </svg>
                                    <div>Image</div>
                                    <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
                                </div>
                            </div>
                        </div>
                        <div class="article-content">
                            <h3 class="article-title">${article.title || ""}</h3>
                            <div class="article-meta">
                                <span class="article-type">${
                                  (() => {
                                    const typeText = decodeUnicode(article.type) || "Unknown Type";
                                    return typeText.length > 18 ? typeText.substring(0, 18) + "..." : typeText;
                                  })()
                                }</span>
                                <span class="article-time">${formatTime(
                                  article.create_time
                                )}</span>
                            </div>
                        </div>
                    </div>
                `
      )
      .join("");
    this.bindDetailPageRecommendedEvents();
  }

  bindDetailPageRecommendedEvents() {
    const articleCards = document.querySelectorAll(
      ".recommended-articles .article-card"
    );
    articleCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        if (
          !articleId ||
          articleId === "" ||
          articleId === "undefined" ||
          articleId === "null"
        ) {
          return;
        }
        window.location.href =
          `detail.html?id=${articleId}` +
          (window.channel ? "&channel=" + window.channel : "");
      });
    });
  }


  showError(message) {
    const contentContainer = document.getElementById("articleContent");
    contentContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-text">${message}</div>
                        <div class="empty-state-subtext">
                            <a href="index.html${
                              window.channel ? "?channel=" + window.channel : ""
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
      document.documentElement.style.overflow = "";
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
      "index.html" +
      (window.channel ? "?channel=" + window.channel : "");
  }
}


window.ArticleDetailPage = ArticleDetailPage;


document.addEventListener("DOMContentLoaded", () => {
  try {
    new ArticleDetailPage();
    new BackToTop();
  } catch (error) {}
});
