
import {
  BASE_URL,
  Category_URL,
  IMG_BASE_URL,
  getCategoryOrder,
} from "./BaseURL.js";



import {
  initCommonSidebar,
  handleChannelParameter,
  formatTime,
  getUrlParam,
  SmartBackButton,
} from "./common.js";


import { HealthNewsApp } from "./index.js";

class ArticleDetailPage {
  constructor() {
    this.articleId = getUrlParam("id");

    if (!this.articleId) {
      this.articleId = this.generateRandomArticleId();
    }

    this.init();
  }

  async handleNoId() {
    await this.redirectToRandomArticle();
  }

  async init() {
    
    
    
    
    await this.loadArticleDetail();
    this.setupEventListeners();
  }

  async loadArticleDetail() {
    try {
      
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

      
      try {
        const detailUrl = BASE_URL.replace("/number/", `/${this.articleId}/`);
        const detailResponse = await fetch(detailUrl);

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          
          const fullArticle = { ...dbArticle, ...detailData };
          this.renderArticle(fullArticle);
        } else {
          
          this.renderArticle(dbArticle);
        }
      } catch (detailError) {
        
        this.renderArticle(dbArticle);
      }

      this.renderRecommendedArticles();
    } catch (error) {
      this.showError("Failed to Load Article: " + error.message);
    }
  }

  renderArticle(article) {
    document.title = `${article.title} - Health News`;

    document.getElementById("articleTitle").textContent = article.title;

    const articleType = document.getElementById("articleType");
    if (article.type) {
      articleType.textContent = article.type;
    } else {
      articleType.textContent = "-";
    }

    const articleTime = document.getElementById("articleTime");
    if (article.create_time) {
      articleTime.textContent = formatTime(article.create_time);
    } else {
      articleTime.textContent = "-";
    }

    const articleSection = document.getElementById("articleSection");


    this.renderArticleContent(article);
  }

  renderArticleContent(article) {
    const contentContainer = document.getElementById("articleContent");

    const articleImageContainer = document.getElementById("articleImage");
    if (articleImageContainer) {
      articleImageContainer.style.display = "none";
    }

    if (article.content && Array.isArray(article.content)) {
      const htmlContent = article.content
        .map((contentItem) => {
          return contentItem;
        })
        .join("");

      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }

      this.distributeContentToArticleItems(contentContainer, htmlContent);

      this.wrapTablesResponsive(contentContainer);
    } else if (article.section) {
      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }

      const firstArticleItem = contentContainer.querySelector(".article-item");
      if (firstArticleItem) {
        firstArticleItem.innerHTML = `<p>${article.section}</p>`;
      }
    } else {
      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }

      const firstArticleItem = contentContainer.querySelector(".article-item");
      if (firstArticleItem) {
        firstArticleItem.innerHTML = "<p>Content not available</p>";
      }
    }
  }

  distributeContentToArticleItems(contentContainer, htmlContent) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    
    const images = this.extractImages(tempDiv);

    
    const allPElements = Array.from(tempDiv.querySelectorAll("p"));
    const allDivElements = Array.from(tempDiv.querySelectorAll("div"));
    const allHeadingElements = Array.from(
      tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    const allListItems = Array.from(tempDiv.querySelectorAll("li"));

    
    let allBlockElements = [];
    if (allPElements.length > 0) {
      allBlockElements = allPElements;
    } else if (
      allDivElements.length > 0 ||
      allHeadingElements.length > 0 ||
      allListItems.length > 0
    ) {
      
      const combinedElements = [
        ...allDivElements,
        ...allHeadingElements,
        ...allListItems,
      ];
      
      allBlockElements = combinedElements.sort((a, b) => {
        const position = a.compareDocumentPosition(b);
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1;
        } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
          return 1;
        }
        return 0;
      });
    } else {
      
      allBlockElements = Array.from(tempDiv.children);
    }

    
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
      remainingElements.forEach((element) => {
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
      const clonedImg = img.cloneNode(true);

      
      const imgSrc = clonedImg.getAttribute("src");
      if (
        imgSrc &&
        !imgSrc.startsWith("http://") &&
        !imgSrc.startsWith("https://")
      ) {
        
        if (this.articleId && IMG_BASE_URL) {
          
          const imgFileName = imgSrc.split("/").pop();
          
          const remoteImgUrl = IMG_BASE_URL.replace(
            "/number/",
            `/${this.articleId}/`
          ).replace("number.png", imgFileName);
          clonedImg.setAttribute("src", remoteImgUrl);
        }
      }

      images.push({
        element: clonedImg,
        originalIndex: index,
      });
    });

    return images;
  }

  splitTextIntoParagraphs(text, minLength = 270, maxLength = 300) {
    const paragraphs = [];
    let currentText = text;

    while (currentText.length > 0) {
      if (currentText.length <= maxLength) {
        if (currentText.trim()) {
          const p = document.createElement("p");
          p.textContent = currentText.trim();
          paragraphs.push(p);
        }
        break;
      }

      const splitResult = this.findBestSplitPoint(
        currentText,
        minLength,
        maxLength
      );

      if (splitResult.beforeSplit.trim()) {
        const p = document.createElement("p");
        p.textContent = splitResult.beforeSplit.trim();
        paragraphs.push(p);
      }

      currentText = splitResult.afterSplit;
    }

    return paragraphs;
  }

  findBestSplitPoint(text, minLength, maxLength) {
    const punctuationRegex = /[。！？；，、：\.\!\?\;\,]/;

    if (text.length <= maxLength) {
      return { beforeSplit: text, afterSplit: "" };
    }

    let bestSplitIndex = -1;
    for (
      let i = Math.min(maxLength - 1, text.length - 1);
      i >= minLength;
      i--
    ) {
      if (punctuationRegex.test(text[i])) {
        bestSplitIndex = i + 1;
        break;
      }
    }

    if (bestSplitIndex > 0) {
      return {
        beforeSplit: text.substring(0, bestSplitIndex),
        afterSplit: text.substring(bestSplitIndex),
      };
    } else {
      return {
        beforeSplit: text.substring(0, maxLength),
        afterSplit: text.substring(maxLength),
      };
    }
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

  extractMixedContent(htmlElement) {
    const mixedContent = [];

    function extractContent(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          mixedContent.push({
            type: "text",
            content: text,
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === "IMG") {
          mixedContent.push({
            type: "img",
            element: node,
            content: "",
          });
        } else {
          if (
            ["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(
              node.tagName
            )
          ) {
            if (
              mixedContent.length > 0 &&
              mixedContent[mixedContent.length - 1].type === "text"
            ) {
              mixedContent[mixedContent.length - 1].content += " ";
            }
          }

          for (let child of node.childNodes) {
            extractContent(child);
          }

          if (
            ["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(
              node.tagName
            )
          ) {
            if (
              mixedContent.length > 0 &&
              mixedContent[mixedContent.length - 1].type === "text"
            ) {
              mixedContent[mixedContent.length - 1].content += " ";
            }
          }
        }
      }
    }

    extractContent(htmlElement);

    const consolidated = [];
    for (let i = 0; i < mixedContent.length; i++) {
      const current = mixedContent[i];
      if (current.type === "text") {
        if (
          consolidated.length > 0 &&
          consolidated[consolidated.length - 1].type === "text"
        ) {
          consolidated[consolidated.length - 1].content +=
            " " + current.content;
        } else {
          consolidated.push({
            type: "text",
            content: current.content.replace(/\s+/g, " ").trim(),
          });
        }
      } else {
        consolidated.push(current);
      }
    }

    return consolidated;
  }

  smartSplitMixedContent(mixedContent, minLength = 270, maxLength = 300) {
    const chunks = [];
    let currentChunk = [];
    let currentTextLength = 0;

    for (let i = 0; i < mixedContent.length; i++) {
      const item = mixedContent[i];

      if (item.type === "img") {
        currentChunk.push(item);
      } else if (item.type === "text") {
        const text = item.content;

        if (
          currentTextLength + text.length > maxLength &&
          currentTextLength >= minLength
        ) {
          const splitResult = this.splitTextAtPunctuation(
            text,
            maxLength - currentTextLength
          );

          if (splitResult.beforeSplit.trim()) {
            currentChunk.push({
              type: "text",
              content: splitResult.beforeSplit.trim(),
            });
          }

          if (currentChunk.length > 0) {
            chunks.push({ content: currentChunk });
          }

          currentChunk = [];
          currentTextLength = 0;

          if (splitResult.afterSplit.trim()) {
            currentChunk.push({
              type: "text",
              content: splitResult.afterSplit.trim(),
            });
            currentTextLength = splitResult.afterSplit.length;
          }
        } else {
          currentChunk.push(item);
          currentTextLength += text.length;
        }
      }
    }

    if (currentChunk.length > 0) {
      chunks.push({ content: currentChunk });
    }

    return chunks;
  }

  splitTextAtPunctuation(text, maxLength) {
    const punctuationRegex = /[。！？；，、：\.\!\?\;\,]/;

    if (text.length <= maxLength) {
      return { beforeSplit: text, afterSplit: "" };
    }

    let bestSplitIndex = -1;
    for (let i = Math.min(maxLength - 1, text.length - 1); i >= 0; i--) {
      if (punctuationRegex.test(text[i])) {
        bestSplitIndex = i + 1;
        break;
      }
    }

    if (bestSplitIndex > 0) {
      return {
        beforeSplit: text.substring(0, bestSplitIndex),
        afterSplit: text.substring(bestSplitIndex),
      };
    } else {
      return {
        beforeSplit: text.substring(0, maxLength),
        afterSplit: text.substring(maxLength),
      };
    }
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

    recommendedContainer.innerHTML = recommended
      .map(
        (article) => `
                    <div class="recommended-card" data-id="${article.id}">
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
                                    article.type || "Unknown Type"
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

  bindDetailPageRecommendedEvents() {
    const recommendedCards = document.querySelectorAll(".recommended-card");
    recommendedCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        window.location.href =
          `detail.html?id=${articleId}` +
          (window.channel ? `&channel=${window.channel}` : "");
      });
    });
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
                            <a href="index.html">Back</a>
                        </div>
                    </div>
                `;
  }

  setupEventListeners() {
    this.smartBack = new SmartBackButton({ basePath: "", isDetailPage: true });
  }
}


handleChannelParameter();

document.addEventListener("DOMContentLoaded", async () => {
  initCommonSidebar();

  
  
  
  
  
  
  
  window.healthNewsApp = new HealthNewsApp({ useHomePageLayout: false });
  
  
  
  let retries = 0;
  while (
    (!window.healthNewsApp.articles || window.healthNewsApp.articles.length === 0 ||
     !window.healthNewsApp.categories || window.healthNewsApp.categories.length === 0) &&
    retries < 50
  ) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }

  
  new ArticleDetailPage();

  if (window.themeApplier) {
    window.themeApplier.init();
  }
});
