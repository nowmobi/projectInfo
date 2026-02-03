import { getImgUrl, BASE_URL, fetchArticlesWithCache, getCategoryOrder } from "./BaseURL.js";
import { HealthNewsApp } from "./inpublic.js";

class ArticleDetailPage {
  constructor() {
    this.articleId = this.getUrlParam("id");

    this.init();
  }

  convertImageSrcToRemote(container, articleId) {
   
    const images = container.querySelectorAll("img");
    images.forEach((img) => {
      const originalSrc = img.getAttribute("src");
     
      if (originalSrc && !originalSrc.startsWith("http") && !originalSrc.startsWith("data:")) {
       
        let imgFileName = originalSrc;
        if (imgFileName.includes("/")) {
          imgFileName = imgFileName.split("/").pop();
        }
        
       
        const remoteSrc = getImgUrl({
          id: articleId,
          img: imgFileName,
        });
        img.setAttribute("src", remoteSrc);
      }
    });
  }

  async init() {
    if (!this.articleId) {
     
      await this.loadRandomArticle();
    } else {
     
      await this.loadArticleDetail();
    }
    this.setupEventListeners();
  }

  async loadRandomArticle() {
    try {
     
      const loadingArticle = {
        title: 'Loading Random Article...',
        type: 'Unknown',
        create_time: Date.now()
      };
      this.renderArticle(loadingArticle);

     
      let articlesList = [];
      if (window.healthNewsApp && window.healthNewsApp.articles && window.healthNewsApp.articles.length > 0) {
        
        articlesList = window.healthNewsApp.articles;
      } else {
       
        
        articlesList = await fetchArticlesWithCache();
      }

      if (articlesList && articlesList.length > 0) {
       
        const randomIndex = Math.floor(Math.random() * articlesList.length);
        const randomArticle = articlesList[randomIndex];
        
       
        this.articleId = randomArticle.id;
        
       
        this.renderArticle({
          ...randomArticle,
          title: randomArticle.title || 'Loading...'
        });
        
       
        const baseUrlWithoutParams = BASE_URL.split('?')[0];
        const apiBaseUrl = baseUrlWithoutParams.replace('/finance_info/db.json', '');
        const detailUrl = `${apiBaseUrl}/${this.articleId}/finance_info/data.json`;
        const detailResponse = await fetch(detailUrl);
        
        if (detailResponse.ok) {
          const articleDetail = await detailResponse.json();
          this.renderArticle(articleDetail);
        } else {
         
          this.showError(`Failed to load full article content`);
        }
      } else {
        this.showError("No articles available");
        const errorArticle = {
          title: 'No Articles',
          type: 'Error',
          create_time: Date.now()
        };
        this.renderArticle(errorArticle);
      }

     
      this.waitForHealthNewsAppAndRender();
    } catch (error) {
      this.showError("Failed to load random article: " + error.message);
      const errorArticle = {
        title: 'Load Error',
        type: 'Error',
        create_time: Date.now()
      };
      this.renderArticle(errorArticle);
    }
  }

  async loadArticleDetail() {
    try {
     
      const baseArticle = {
        id: this.articleId,
        title: 'Loading...',
        type: 'Unknown',
        create_time: Date.now()
      };
      
     
      this.renderArticle(baseArticle);
      
     
     
      const baseUrlWithoutParams = BASE_URL.split('?')[0];
     
      const apiBaseUrl = baseUrlWithoutParams.replace('/finance_info/db.json', '');
      const detailUrl = `${apiBaseUrl}/${this.articleId}/finance_info/data.json`;
      
      const detailResponse = await fetch(detailUrl);
      if (detailResponse.ok) {
        const articleDetail = await detailResponse.json();
        
       
        if (articleDetail.error) {
          this.showError(`Failed to load article details: ${articleDetail.error}`);
         
          const errorArticle = {
            id: this.articleId,
            title: 'Article Not Found',
            type: 'Error',
            create_time: Date.now()
          };
          this.renderArticle(errorArticle);
        } else {
         
          this.renderArticle(articleDetail);
        }
      } else {
       
        this.showError(`Failed to load article details: HTTP ${detailResponse.status}`);
        const errorArticle = {
          id: this.articleId,
          title: 'Loading Failed',
          type: 'Error',
          create_time: Date.now()
        };
        this.renderArticle(errorArticle);
      }
      
     
      this.waitForHealthNewsAppAndRender();
    } catch (error) {
      this.showError("Failed to Load Article: " + error.message);
      const errorArticle = {
        id: this.articleId,
        title: 'Load Error',
        type: 'Error',
        create_time: Date.now()
      };
      this.renderArticle(errorArticle);
    }
  }

  waitForHealthNewsAppAndRender() {
   
    if (
      window.healthNewsApp &&
      window.healthNewsApp.articles &&
      window.healthNewsApp.articles.length > 0
    ) {
      
      this.renderRecommendedArticles();
      return;
    }

   
    
    this.renderRecommendedArticles();
  }

  renderArticle(article, isDbArticle = false) {
    document.title = `${article.title} - Health News`;

    document.getElementById("articleTitle").textContent = article.title;

    const articleType = document.getElementById("articleType");
    if (article.type) {
      articleType.textContent = this.decodeUnicode(article.type);
    } else {
      articleType.textContent = "-";
    }

    const articleTime = document.getElementById("articleTime");
    if (article.create_time) {
      articleTime.textContent = this.formatTime(article.create_time);
    } else {
      articleTime.textContent = "-";
    }

    const articleSource = document.getElementById("articleSource");
    if (article.source) {
      articleSource.textContent = `Source: ${this.decodeUnicode(article.source)}`;
    } else {
      articleSource.textContent = "-";
    }

    this.renderArticleContent(article, isDbArticle);
  }

  renderArticleContent(article, isDbArticle = false) {
    
    
    
    
    const contentContainer = document.getElementById("articleContent");
    
    
    if (!contentContainer) {
      
      return;
    }

    if (isDbArticle) {
      contentContainer.innerHTML = `
                        <p>This article is available in the healths folder. Please check the corresponding data.json file for full content.</p>
                        <p>Article Type: ${this.decodeUnicode(article.type) || "Unknown"}</p>
                        <p>Created: ${article.create_time ? this.formatTime(article.create_time) : "Unknown"}</p>
                    `;
      return;
    }

    if (article.content && Array.isArray(article.content)) {
      
      
     
      const loading = contentContainer.querySelector(".loading");
      
      if (loading) {
        loading.style.display = "none";
      }
      
     
      const existingItems = contentContainer.querySelectorAll(".article-item, .ads");
      
      existingItems.forEach(item => item.remove());
      
     
      const htmlContent = article.content
        .map((contentItem) => {
          const decodedContent = this.decodeUnicode(contentItem);
          return decodedContent;
        })
        .join("");
      
      

     
      contentContainer.innerHTML = htmlContent;
      

     
      this.wrapTablesResponsive(contentContainer);
      
     
      this.convertImageSrcToRemote(contentContainer, this.articleId);
    } else if (article.section) {
      
      
     
      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }
      
     
      const existingItems = contentContainer.querySelectorAll(".article-item, .ads");
      existingItems.forEach(item => item.remove());
      
      const sectionContent = `
                        <p>${this.decodeUnicode(article.section)}</p>
                        <p>Full content is being loaded...</p>
                    `;
      contentContainer.innerHTML = sectionContent;
    } else {
      
      
     
      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }
      
     
      const existingItems = contentContainer.querySelectorAll(".article-item, .ads");
      existingItems.forEach(item => item.remove());
      
      contentContainer.innerHTML = "<p>Content not available</p>";
    }
  }

  distributeContentToArticleItems(contentContainer, htmlContent) {
   
    contentContainer.innerHTML = htmlContent;
    
   
    this.wrapTablesResponsive(contentContainer);
    
   
    this.convertImageSrcToRemote(contentContainer, this.articleId);
  }

 
  splitTextBySentence(text, maxLength) {
    if (text.length <= maxLength) {
      return { chunk: text, remaining: "" };
    }

   
    const sentenceEndRegex = /[。\.]/g;
    let bestSplitIndex = -1;
    let match;

    while ((match = sentenceEndRegex.exec(text)) !== null) {
      const index = match.index + 1;
      if (index <= maxLength) {
        bestSplitIndex = index;
      } else {
        break;
      }
    }

   
    if (bestSplitIndex > 0) {
      return {
        chunk: text.substring(0, bestSplitIndex),
        remaining: text.substring(bestSplitIndex).trim(),
      };
    }

   
    return {
      chunk: text.substring(0, maxLength),
      remaining: text.substring(maxLength).trim(),
    };
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

  async renderRecommendedArticles(retryCount = 0) {
    const maxRetries = 10;
    
    try {
      if (
        window.healthNewsApp &&
        window.healthNewsApp.articles &&
        window.healthNewsApp.articles.length > 0
      ) {
        
        this.renderDetailPageRecommendedArticles(this.articleId);
      } else {
        if (retryCount < maxRetries) {
          setTimeout(() => {
            this.renderRecommendedArticles(retryCount + 1);
          }, 500);
        } else {
         
          
          try {
            const articles = await fetchArticlesWithCache();
            if (articles && articles.length > 0) {
             
              
              this.renderDetailPageRecommendedArticlesFromCache(this.articleId, articles);
            }
          } catch (error) {
            
          }
        }
      }
    } catch (error) {
      
    }
  }
  
  renderDetailPageRecommendedArticlesFromCache(currentId, articles) {
    const recommendedContainer = document.querySelector("#recommendedArticles");
    if (!recommendedContainer) {
      return;
    }

   
    if (!currentId || currentId === null || currentId === undefined || String(currentId).trim() === '') {
      
      recommendedContainer.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无推荐文章</div></div>';
      return;
    }

   
    const recommended = articles
      .filter(article => {
        const articleId = article.id;
        return articleId !== null && 
               articleId !== undefined && 
               articleId !== '' && 
               String(articleId).trim() !== '' &&
               !isNaN(Number(articleId)) &&
               String(articleId) !== String(currentId);
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);

   
    if (!recommended || recommended.length === 0) {
      recommendedContainer.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无推荐文章</div></div>';
      return;
    }

    const recommendedHtml = recommended
      .map(article => `
        <div class="article-card-simple" data-id="${article.id}">
          <div class="article-image-simple">
            <img src="${getImgUrl(article)}" alt="${article.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue("--primary-background-gradient-start").trim() || "#746097"} 0%, ${getComputedStyle(document.documentElement).getPropertyValue("--primary-background-gradient-end").trim() || "#7bb3d4"} 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
              <div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                  <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                </svg>
                <div>Image</div>
                <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
              </div>
            </div>
          </div>
          <h3 class="article-title-simple">${this.truncateTextToLines(article.title, 4)}</h3>
        </div>
      `)
      .join("");

    recommendedContainer.innerHTML = recommendedHtml;
    this.bindDetailPageRecommendedEvents();
  }

  renderDetailPageRecommendedArticles(currentId) {
    const recommendedContainer = document.querySelector("#recommendedArticles");
    if (!recommendedContainer) {
      return;
    }

   
    if (!currentId || currentId === null || currentId === undefined || String(currentId).trim() === '') {
      
      recommendedContainer.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无推荐文章</div></div>';
      return;
    }

    const recommended = window.healthNewsApp.getRecommendedArticles(
      currentId,
      6
    );

   
    if (!recommended || recommended.length === 0) {
      recommendedContainer.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无推荐文章</div></div>';
      return;
    }

   
    const validRecommended = recommended.filter((article) => {
      const articleId = article.id;
      return articleId !== null && 
             articleId !== undefined && 
             articleId !== '' && 
             String(articleId).trim() !== '' &&
             !isNaN(Number(articleId));
    });

   
    if (!validRecommended || validRecommended.length === 0) {
      recommendedContainer.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无推荐文章</div></div>';
      return;
    }

    recommendedContainer.innerHTML = validRecommended
      .map(
        (article) => `
                    <div class="article-card-simple" data-id="${article.id}">
                        <div class="article-image-simple">
                            <img src="${getImgUrl(article)}" alt="${
          article.title
        }" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue("--primary-background-gradient-start").trim() || "#746097"} 0%, ${getComputedStyle(document.documentElement).getPropertyValue("--primary-background-gradient-end").trim() || "#7bb3d4"} 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
                                <div>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                                        <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
                                    </svg>
                                    <div>Image</div>
                                    <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
                                </div>
                            </div>
                        </div>
                        <h3 class="article-title-simple">${this.truncateTextToLines(
                          article.title,
                          3
                        )}</h3>
                    </div>
                `
      )
      .join("");

    this.bindDetailPageRecommendedEvents();
  }

  bindDetailPageRecommendedEvents() {
    const recommendedCards = document.querySelectorAll(".article-card-simple");
    recommendedCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const articleId = card.dataset.id;
        
       
        if (!articleId || 
            articleId === null || 
            articleId === undefined || 
            String(articleId).trim() === '' ||
            isNaN(Number(articleId))) {
          
          e.preventDefault();
          return;
        }
        
        window.location.href =
          `detail.html?id=${articleId}` +
          (window.channel ? "&channel=" + window.channel : "");
      });
    });
  }

  truncateTextToLines(text, maxLines = 3) {
    if (!text) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    const avgCharsPerLine = 25;
    const maxChars = avgCharsPerLine * maxLines;
    if (plainText.length <= maxChars) {
      return text;
    }
    const truncated = plainText.substring(0, maxChars - 3);
    return truncated + "...";
  }

  formatTime(timestamp) {
   
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
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
                            <a href="index.html" >Back</a>
                        </div>
                    </div>
                `;
  }

  setupEventListeners() {
    this.initSidebar();

    this.bindSmartBackButton();
    
   
    this.loadCategoriesForSidebar();
  }
  
  async loadCategoriesForSidebar() {
    try {
     
      if (!window.healthNewsApp) {
        
        window.healthNewsApp = new HealthNewsApp();
       
        await window.healthNewsApp._initPromise;
      } else {
        
       
        if (window.healthNewsApp._initPromise) {
          await window.healthNewsApp._initPromise;
        }
      }
      
     
      if (window.healthNewsApp && typeof window.healthNewsApp.renderSidebarCategories === 'function') {
        
        window.healthNewsApp.renderSidebarCategories();
      }
    } catch (error) {
      
      
     
      const sidebarCategories = document.querySelector(".sidebar-categories");
      if (sidebarCategories) {
        sidebarCategories.innerHTML = '<div class="sidebar-category">Failed to load categories</div>';
      }
    }
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
      item.addEventListener("click", (e) => {
       
        
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
   
    const backHomeButtons = document.querySelectorAll(".back-home-btn");
    backHomeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSmartBack();
      });
    });
  }

  handleSmartBack() {
   
    window.location.href =
      "index.html" +
      (window.channel ? "?channel=" + window.channel : "");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ArticleDetailPage();
});
