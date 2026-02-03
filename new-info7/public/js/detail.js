
import {
  getArticlesData,
  Detail_BASE_URL,
  Detail_API_PATH,
} from "./BaseURL.js";



class ArticleDetailPage {
  constructor() {
    this.articleId = this.getUrlParam("id");
    this.needRandomArticle = !this.articleId; 

    this.init();
  }

  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    const value = urlParams.get(name);
    return value;
  }

  async init() {
    await this.loadArticleDetail();
    this.setupEventListeners();
  }

  async loadArticleDetail() {
    try {
      let dbArticle = null;
      let articles = [];
      
      
      try {
        const dbData = await getArticlesData();
        if (dbData) {
          
          
          articles = Array.isArray(dbData) 
            ? dbData.filter(item => item && item.id && item.title) 
            : [];

          
          if (this.needRandomArticle && articles.length > 0) {
            const randomIndex = Math.floor(Math.random() * articles.length);
            dbArticle = articles[randomIndex];
            this.articleId = String(dbArticle.id);
            
          } else if (this.articleId) {
            
            dbArticle = articles.find((a) => String(a.id) === String(this.articleId));
          }
        }
      } catch (listError) {
        console.warn("Failed to load article list:", listError);
      }

      
      try {
        const detailUrl = `${Detail_BASE_URL}/${this.articleId}/${Detail_API_PATH}`;
        const detailResponse = await fetch(detailUrl);

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          
          const fullArticle = dbArticle ? { ...dbArticle, ...detailData } : detailData;
          this.renderArticle(fullArticle);
          this.renderRecommendedArticles();
          return;
        }
      } catch (detailError) {
        console.warn("Failed to fetch detail content:", detailError);
      }

      
      if (dbArticle) {
        this.renderArticle(dbArticle);
        this.renderRecommendedArticles();
      } else {
        
        this.showError(`Article with ID ${this.articleId} not found`);
      }
    } catch (error) {
      this.showError("Failed to Load Article: " + error.message);
    }
  }

  renderArticle(article) {
    if (!article) {
      console.error("article 对象为空！");
      return;
    }
   
    document.title = `${article.title} - Health News`;

   
    document.getElementById("articleTitle").textContent = article.title;

   
    const articleType = document.getElementById("articleType");
    
    if (article.author) {
      articleType.textContent = article.author;
    } else {
      articleType.textContent = "-";
    }

    
    const articleSource = document.getElementById("articleSource");
    const sourceText = document.getElementById("sourceText");
    if (articleSource && sourceText) {
      
      if (article.source) {
        sourceText.textContent = article.source;
        articleSource.style.display = "block";
      } else {
        articleSource.style.display = "none";
      }
    }

    const articleTime = document.getElementById("articleTime");
    if (article.create_time) {
      
      let timestamp = article.create_time;
      if (timestamp > 1000000000000) {
        timestamp = Math.floor(timestamp / 1000);
      }
      articleTime.textContent = this.formatTime(timestamp);
    } else {
      articleTime.textContent = "-";
    }

   
    const articleSection = document.getElementById("articleSection");
   
   
    this.renderArticleContent(article);
  }

  renderArticleContent(article) {
    const contentContainer = document.getElementById("articleContent");

    
    const loading = contentContainer.querySelector(".loading");
    if (loading) {
      loading.style.display = "none";
    }

    
    let hasMainImage = false;
    const articleImageContainer = document.getElementById("articleImage");
    if (articleImageContainer && article.img) {
      const articleMainImage = document.getElementById("articleMainImage");
      if (articleMainImage) {
        
        if (article.img.startsWith("http://") || article.img.startsWith("https://")) {
          articleMainImage.src = article.img;
        } else {
          
          articleImageContainer.style.display = "none";
          return;
        }
        articleMainImage.alt = article.title || "";
        articleImageContainer.style.display = "block";
        hasMainImage = true; 
      }
    } else if (articleImageContainer) {
      articleImageContainer.style.display = "none";
    }

    
    if (article.content && Array.isArray(article.content)) {
      
      const htmlContent = article.content
        .map((contentItem) => {
          return contentItem;
        })
        .join("");

      
      this.distributeContentToArticleItems(contentContainer, htmlContent, hasMainImage);
      this.wrapTablesResponsive(contentContainer);
    } else if (article.content && typeof article.content === "string") {
      
      const articleItems = contentContainer.querySelectorAll(".article-item");
      if (articleItems.length > 0) {
        articleItems[0].innerHTML = `<p>${article.content}</p>`;
      } else {
        contentContainer.innerHTML = `<div class="article-item"><p>${article.content}</p></div>`;
      }
    }
  }

 
  distributeContentToArticleItems(contentContainer, htmlContent, skipImages = false) {
   
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    
    if (skipImages) {
      const imgElements = tempDiv.querySelectorAll("img");
      imgElements.forEach(img => img.remove());
    }

   
    const images = this.extractImages(tempDiv);

   
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

   
    processedParagraphs.forEach((p, index) => {});

   

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
    } else {
    }

   
    const finalChunks = this.combineImagesWithParagraphs(
      processedParagraphs,
      images
    );

    finalChunks.forEach((chunk, index) => {
      chunk.elements.forEach((el, elIndex) => {});
    });

   
    const articleItems = Array.from(
      contentContainer.querySelectorAll(".article-item")
    );

   
    const maxContainers = articleItems.length;

   
    for (let i = 0; i < maxContainers && i < finalChunks.length; i++) {
      articleItems[i].innerHTML = "";

      finalChunks[i].elements.forEach((element, elIndex) => {
        articleItems[i].appendChild(element);
      });
    }

   
    if (remainingElements.length > 0) {
      let containerIndex = finalChunks.length;
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
        
        return images;
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
       
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = 500;

        const retryRender = () => {
          if (
            window.healthNewsApp &&
            window.healthNewsApp.articles &&
            window.healthNewsApp.articles.length > 0
          ) {
            this.renderDetailPageRecommendedArticles(this.articleId);
          } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(retryRender, retryInterval);
          } else {
          }
        };

        setTimeout(retryRender, retryInterval);
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
                            <span class="recommended-type-tag">${
                              article.type || "Unknown Type"
                            }</span>
                            <h4 class="recommended-card-title">${
                              article.title
                            }</h4>
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
        if (articleId) {
          window.location.href =
            `detail.html?id=${articleId}` +
            (window.channel ? `&channel=${window.channel}` : "");
        }
      });
    });
  }

  formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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
   
    this.bindSmartBackButton();
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
    const referrer = document.referrer;
    const currentUrl = window.location.href;

   
    if (referrer.includes("category.html")) {
     
      window.location.href = referrer;
      return;
    }

   
    if (
      referrer.includes("index.html") ||
      referrer.includes("localhost") ||
      referrer.includes("127.0.0.1")
    ) {
     
      window.location.href =
        "index.html?fromDetail=true" +
        (window.channel ? `&channel=${window.channel}` : "");
      return;
    }

   
    const urlParams = new URLSearchParams(currentUrl);
    const fromPage = urlParams.get("from");

    if (fromPage === "category") {
     
      window.location.href =
        "pages/category.html" +
        (window.channel ? `?channel=${window.channel}` : "");
      return;
    }

   
    window.location.href =
      "index.html?fromDetail=true" +
      (window.channel ? `&channel=${window.channel}` : "");
  }
}



document.addEventListener("DOMContentLoaded", () => {
 
  if (window.initCommonSidebar) {
    window.initCommonSidebar();
  }

 
  new ArticleDetailPage();
});
