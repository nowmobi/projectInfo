
import {
  Category_URL,
  Detail_BASE_URL,
  DETAIL_PATH,
  getDbData,
} from "./BaseURL.js";

import {
  initCommonSidebar,
  handleChannelParameter,
  formatTime,
  getUrlParam,
  SmartBackButton,
} from "./common.js";

import { HealthNewsApp } from "./index.js";

const PLACEHOLDER_IMAGE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23ddd' width='300' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

class ArticleDetailPage {
  constructor() {
    this.articleId = getUrlParam("id");
    if (!this.articleId) {
      this.articleId = this.generateRandomArticleId();
    }
    this.init();
  }

  async init() {
    await this.loadArticleDetail();
    this.setupEventListeners();
  }

 
  normalizeTimestamp(timestamp) {
    return timestamp;
  }

 
  setElementText(id, text, fallback = "-") {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text || fallback;
    }
  }

  async loadArticleDetail() {
    try {
     
      let articles = [];
      if (window.healthNewsApp?.articles?.length > 0) {
        articles = window.healthNewsApp.articles;
      } else {
        const dbData = await getDbData(false);
        articles = Array.isArray(dbData)
          ? dbData.filter(item => item && typeof item === 'object' && !item.info1 && item.id != null && item.title)
          : (dbData?.articles || dbData?.data || []).filter(item => item?.id && item?.title);
      }

     
      let dbArticle = articles.find(a => String(a.id) === String(this.articleId));
      if (!dbArticle) {
        dbArticle = articles.find(a => 
          String(a.id).trim() === String(this.articleId).trim() || 
          Number(a.id) === Number(this.articleId) ||
          a.id == this.articleId
        );
      }
      
     
      if (!dbArticle && !getUrlParam("id")) {
        const validArticles = articles.filter(article => 
          article && typeof article === 'object' && !article.info1 && article.id != null && article.title
        );
        if (validArticles.length > 0) {
          const randomIndex = Math.floor(Math.random() * validArticles.length);
          dbArticle = validArticles[randomIndex];
          this.articleId = dbArticle.id.toString();
        }
      }
      
      let detailData = null;
      try {
        const detailUrl = `${Detail_BASE_URL}/${this.articleId}/${DETAIL_PATH}/data.json`;
        const detailResponse = await fetch(detailUrl);
        if (detailResponse.ok) {
          detailData = await detailResponse.json();
        } else {
          console.log('Detail API response not ok:', detailResponse.statusText);
        }
      } catch (detailError) {
        console.log('Detail API request failed:', detailError);
      }
      
      if (!dbArticle && !detailData) {
        this.showErrorWithBackLink(`Article Not Found (ID: ${this.articleId})`);
        return;
      }
      
      const fullArticle = { ...dbArticle, ...detailData };
      this.renderArticle(fullArticle);
      this.renderRecommendedArticles();
    } catch (error) {
      this.showErrorWithBackLink("Failed to Load Article: " + error.message);
    }
  }

  renderArticle(article) {
    if (!article) {
      this.showErrorWithBackLink("Article data is invalid");
      return;
    }

    document.title = `${article.title || "Article"} - Health News`;

    const titleElement = document.getElementById("articleTitle");
    if (titleElement) {
      titleElement.textContent = article.title || "Untitled Article";
    }

    this.setElementText("author", article.author);
    this.setElementText("articleTime", article.create_time ? formatTime(article.create_time) : null);

   
    const articleSource = document.getElementById("articleSource");
    const sourceText = document.getElementById("sourceText");
    if (articleSource && sourceText) {
      const source = article.source || article.source_name || article.author || article.origin || "";
      if (source?.trim()) {
        sourceText.textContent = source;
        articleSource.style.display = "block";
      } else {
        articleSource.style.display = "none";
      }
    }

    const articleSection = document.getElementById("articleSection");
    if (articleSection && article.section) {
      const sectionText = document.getElementById("sectionText");
      if (sectionText) {
        sectionText.textContent = article.section;
        articleSection.style.display = "block";
      }
    }
    this.renderArticleContent(article);
  }

  renderArticleContent(article) {
    const contentContainer = document.getElementById("articleContent");
    if (!contentContainer) {
      return;
    }

    const loading = contentContainer.querySelector(".loading");
    loading?.remove();
    
    contentContainer.style.cssText = "display: block; visibility: visible; opacity: 1;";
    document.getElementById("articleImage")?.style.setProperty("display", "none");
    
   
    let htmlContent = "";
    if (article.content) {
      if (Array.isArray(article.content)) {
        htmlContent = article.content.join("");
      } else if (typeof article.content === "string") {
       
        htmlContent = article.content;
      }
    }
    
   
    const articleItems = contentContainer.querySelectorAll(".article-item");
   
    let finalContent = htmlContent;
    
    if (htmlContent.trim()) {
      
      if (articleItems.length > 0) {
        articleItems[0].innerHTML = finalContent;
      } else {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = finalContent;
        contentContainer.appendChild(contentDiv);
      }
    } else {
      let noContentHtml = '<p>No content available for this article.</p>';
      if (articleItems.length > 0) {
        articleItems[0].innerHTML = noContentHtml;
      } else {
        contentContainer.innerHTML = noContentHtml;
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

    const blockTexts = allBlockElements
      .map(el => el.textContent.trim())
      .filter(text => text.length > 0);

    let fullText = blockTexts.length > 0
      ? blockTexts.join(" ")
      : this.extractFullText(tempDiv);

    if (!fullText?.trim()) {
      contentContainer.innerHTML = htmlContent;
      return;
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

    if (remainingElements.length > 0 && articleItems.length >= 5) {
      const fifthItem = articleItems[4];
      let lastInsertedElement = fifthItem;
      remainingElements.forEach((element) => {
        lastInsertedElement.insertAdjacentElement("afterend", element);
        lastInsertedElement = element;
      });
    }

    this.removeExtraImages(contentContainer);
  }

 
  removeExtraImages(contentContainer) {
    const allImages = contentContainer.querySelectorAll("img");
    if (allImages.length > 1) {
     
      for (let i = 0; i < allImages.length; i++) {
        if (i !== 1) {
          allImages[i].remove();
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

  extractImages(htmlElement) {
    const images = [];
    const imgElements = htmlElement.querySelectorAll("img");
    if (imgElements.length === 0) return images;
    const imgIndex = imgElements.length > 1 ? 1 : 0;
    const img = imgElements[imgIndex];
    const clonedImg = img.cloneNode(true);
    const imgSrc = clonedImg.getAttribute("src");

    if (imgSrc && !imgSrc.startsWith("http://") && !imgSrc.startsWith("https://")) {
      clonedImg.setAttribute("src", PLACEHOLDER_IMAGE_SVG);
    }

    images.push({ element: clonedImg, originalIndex: imgIndex });
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
   
    if (window.healthNewsApp?.articles?.length > 0) {
      const validArticles = window.healthNewsApp.articles.filter(article => 
        article && typeof article === 'object' && !article.info1 && article.id != null && article.title
      );
      if (validArticles.length > 0) {
        const randomIndex = Math.floor(Math.random() * validArticles.length);
        return validArticles[randomIndex].id.toString();
      }
    }
    return (Math.floor(Math.random() * 130) + 1).toString();
  }

  showErrorWithBackLink(message) {
    const contentContainer = document.getElementById("articleContent");
    contentContainer.querySelector(".loading")?.remove();
    contentContainer.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 40px 20px;">
                        <div class="empty-state-icon" style="font-size: 48px; margin-bottom: 20px;">📄</div>
                        <div class="empty-state-text" style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">${message}</div>
                        <div class="empty-state-subtext" style="font-size: 14px; color: #666; margin-bottom: 20px;">
                            This article may not be available in the current data set.<br>
                            Please try selecting another article from the homepage.
                        </div>
                        <div style="margin-top: 20px;">
                            <a href="index.html" style="display: inline-block; padding: 10px 20px; background: var(--color-primary, #ba7ac7); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Back to Homepage</a>
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
  
 
  if (!window.healthNewsApp) {
    window.healthNewsApp = new HealthNewsApp({ useHomePageLayout: false });
   
    await new Promise(resolve => {
      const checkInit = () => {
        if (window.healthNewsApp.articles?.length && window.healthNewsApp.categories?.length) {
          resolve();
        } else {
          setTimeout(checkInit, 50);
        }
      };
      checkInit();
    });
  }

  new ArticleDetailPage();
  window.themeApplier?.init();
});
