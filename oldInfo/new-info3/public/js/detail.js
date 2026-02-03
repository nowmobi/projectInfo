import { getImgUrl, IMG_BASE_URL, BASE_URL } from "./BaseURL.js";

class ArticleDetailPage {
  constructor() {
    this.articleId = this.getUrlParam("id");

    if (!this.articleId) {
      this.articleId = this.generateRandomArticleId();
    }

    this.init();
  }

  convertImageSrcToRemote(container, articleId) {
    // 转换容器内所有图片的 src 为远程地址，复用 getImgUrl 函数
    const images = container.querySelectorAll("img");
    images.forEach((img) => {
      const originalSrc = img.getAttribute("src");
      // 处理所有非完整URL的图片路径（包括相对路径和文件名）
      if (originalSrc && !originalSrc.startsWith("http") && !originalSrc.startsWith("data:")) {
        // 提取文件名（如果包含路径，只取文件名部分）
        let imgFileName = originalSrc;
        if (imgFileName.includes("/")) {
          imgFileName = imgFileName.split("/").pop();
        }
        
        // 使用 getImgUrl 函数构建远程 URL
        const remoteSrc = getImgUrl({
          id: articleId,
          img: imgFileName,
        });
        img.setAttribute("src", remoteSrc);
      }
    });
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
        
        // 等待 healthNewsApp 数据加载完成后再渲染推荐文章
        this.waitForHealthNewsAppAndRender();
        return;
      } else {
        this.showError(
          `Failed to Load Article: HTTP ${healthsResponse.status}`
        );
      }
    } catch (error) {
      this.showError("Failed to Load Article: " + error.message);
    }
  }

  waitForHealthNewsAppAndRender() {
    // 如果 healthNewsApp 已经准备好，直接渲染
    if (
      window.healthNewsApp &&
      window.healthNewsApp.articles &&
      window.healthNewsApp.articles.length > 0
    ) {
      this.renderRecommendedArticles();
      return;
    }

    // 否则监听 ready 事件
    const handleReady = () => {
      this.renderRecommendedArticles();
      window.removeEventListener('healthNewsAppReady', handleReady);
    };

    window.addEventListener('healthNewsAppReady', handleReady);

    // 如果事件已经触发（在监听之前），直接渲染
    setTimeout(() => {
      if (
        window.healthNewsApp &&
        window.healthNewsApp.articles &&
        window.healthNewsApp.articles.length > 0
      ) {
        this.renderRecommendedArticles();
        window.removeEventListener('healthNewsAppReady', handleReady);
      }
    }, 100);
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


    this.renderArticleContent(article, isDbArticle);
  }

  renderArticleContent(article, isDbArticle = false) {
    const contentContainer = document.getElementById("articleContent");

    if (isDbArticle) {
      contentContainer.innerHTML = `
                        <p>This article is available in the healths folder. Please check the corresponding data.json file for full content.</p>
                        <p>Article Type: ${
                          this.decodeUnicode(article.type) || "Unknown"
                        }</p>
                        <p>Created: ${
                          article.create_time
                            ? this.formatTime(article.create_time)
                            : "Unknown"
                        }</p>
                    `;
      return;
    }

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

      // 在设置HTML之前，先创建一个临时容器来转换图片路径
      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = htmlContent;
      
      // 转换所有图片为远程URL（在插入DOM之前）
      this.convertImageSrcToRemote(tempContainer, this.articleId);
      
      // 将转换后的HTML内容传递给 distributeContentToArticleItems
      const convertedHtmlContent = tempContainer.innerHTML;

      this.distributeContentToArticleItems(contentContainer, convertedHtmlContent);

      this.wrapTablesResponsive(contentContainer);
      
      // 确保所有图片路径都被转换（包括 distributeContentToArticleItems 中重新插入的图片）
      this.convertImageSrcToRemote(contentContainer, this.articleId);
    } else if (article.section) {
      const sectionContent = `
                        <p>${this.decodeUnicode(article.section)}</p>
                        <p>Full content is being loaded...</p>
                    `;
      contentContainer.innerHTML = sectionContent;
    } else {
      contentContainer.innerHTML = "<p>Content not available</p>";
    }
  }

  distributeContentToArticleItems(contentContainer, htmlContent) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // 提取所有图片，只保留第一个
    const allImages = tempDiv.querySelectorAll("img");
    const firstImage =
      allImages.length > 0 ? allImages[0].cloneNode(true) : null;

    // 保存原始HTML元素结构（在移除图片之前）
    const originalElements = Array.from(tempDiv.children).map((el) =>
      el.cloneNode(true)
    );

    // 移除临时容器中的所有图片
    tempDiv.querySelectorAll("img").forEach((img) => img.remove());

    // 提取纯文本内容
    const fullText = this.extractFullText(tempDiv);

    if (!fullText || fullText.length === 0) {
      return;
    }

    // 获取现有的 article-item 容器
    const articleItems = Array.from(
      contentContainer.querySelectorAll(".article-item")
    );

    // 确保至少有5个容器
    while (articleItems.length < 5) {
      const newArticleItem = document.createElement("div");
      newArticleItem.className = "article-item";
      contentContainer.appendChild(newArticleItem);
      articleItems.push(newArticleItem);
    }

    // 分割文本到前5个容器
    let remainingText = fullText;
    const processedChunks = [];
    let totalUsedChars = 0;

    // 第一个容器：300字符
    if (remainingText.length > 0) {
      const splitResult = this.splitTextBySentence(remainingText, 300);
      processedChunks.push(splitResult.chunk);
      totalUsedChars += splitResult.chunk.length;
      remainingText = splitResult.remaining;
    }

    // 接下来4个容器：每个500字符
    for (let i = 1; i < 5; i++) {
      if (remainingText.length > 0) {
        const splitResult = this.splitTextBySentence(remainingText, 500);
        processedChunks.push(splitResult.chunk);
        totalUsedChars += splitResult.chunk.length;
        remainingText = splitResult.remaining;
      } else {
        processedChunks.push("");
      }
    }

    // 填充前5个容器
    processedChunks.forEach((text, index) => {
      articleItems[index].innerHTML = "";

      // 只在第一个容器添加第一张图片
      if (index === 0 && firstImage) {
        articleItems[index].appendChild(firstImage);
      }

      if (text.trim()) {
        const p = document.createElement("p");
        p.textContent = text.trim();
        articleItems[index].appendChild(p);
      }
    });

    // 处理剩余内容：保留原有HTML元素标签，直接追加到最后一个article-item后面
    if (remainingText.trim().length > 0) {
      const fifthItem = articleItems[4];

      // 提取原始元素中对应剩余文本的部分
      let currentCharCount = 0;
      let insertedElements = []; // 记录需要插入的元素

      originalElements.forEach((element) => {
        // 移除此元素中的所有图片
        const cleanElement = element.cloneNode(true);
        cleanElement.querySelectorAll("img").forEach((img) => img.remove());

        const elementText = cleanElement.textContent.trim();
        const elementLength = elementText.length;

        // 如果这个元素的内容在剩余文本范围内
        if (currentCharCount >= totalUsedChars && elementText.length > 0) {
          insertedElements.push(cleanElement);
        }

        currentCharCount += elementLength;
      });

      // 按顺序插入所有剩余元素
      insertedElements.forEach((element) => {
        contentContainer.appendChild(element);
      });
    }
  }

  // 按句号分割文本
  splitTextBySentence(text, maxLength) {
    if (text.length <= maxLength) {
      return { chunk: text, remaining: "" };
    }

    // 查找句号位置（支持中英文句号）
    const sentenceEndRegex = /[。\.]/g;
    let bestSplitIndex = -1;
    let match;

    while ((match = sentenceEndRegex.exec(text)) !== null) {
      const index = match.index + 1; // 包含句号
      if (index <= maxLength) {
        bestSplitIndex = index;
      } else {
        break;
      }
    }

    // 如果找到合适的句号位置
    if (bestSplitIndex > 0) {
      return {
        chunk: text.substring(0, bestSplitIndex),
        remaining: text.substring(bestSplitIndex).trim(),
      };
    }

    // 如果没找到句号，在最大长度处截断
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

  renderRecommendedArticles(retryCount = 0) {
    const maxRetries = 10; // 最多重试10次（5秒）
    
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
          // 如果重试多次后仍然没有数据，尝试直接加载数据
          console.warn("推荐文章数据加载超时，尝试直接获取数据");
          if (window.healthNewsApp && typeof window.healthNewsApp.loadData === "function") {
            window.healthNewsApp.loadData().then(() => {
              if (window.healthNewsApp.articles && window.healthNewsApp.articles.length > 0) {
                this.renderDetailPageRecommendedArticles(this.articleId);
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("渲染推荐文章时出错:", error);
    }
  }

  renderDetailPageRecommendedArticles(currentId) {
    const recommendedContainer = document.querySelector("#recommendedArticles");
    if (!recommendedContainer) {
      return;
    }

    // 确保当前ID是有效的
    if (!currentId || currentId === null || currentId === undefined || String(currentId).trim() === '') {
      console.warn("当前文章ID无效，无法获取推荐文章");
      recommendedContainer.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无推荐文章</div></div>';
      return;
    }

    const recommended = window.healthNewsApp.getRecommendedArticles(
      currentId,
      6
    );

    // 如果没有有效的推荐文章，显示提示
    if (!recommended || recommended.length === 0) {
      recommendedContainer.innerHTML = '<div class="empty-state"><div class="empty-state-text">暂无推荐文章</div></div>';
      return;
    }

    // 再次过滤，确保所有推荐的文章都有有效的ID
    const validRecommended = recommended.filter((article) => {
      const articleId = article.id;
      return articleId !== null && 
             articleId !== undefined && 
             articleId !== '' && 
             String(articleId).trim() !== '' &&
             !isNaN(Number(articleId)); // 确保ID是数字或可以转换为数字
    });

    // 如果过滤后没有有效的推荐文章，显示提示
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
        
        // 验证ID有效性（确保ID存在且是有效的数字）
        if (!articleId || 
            articleId === null || 
            articleId === undefined || 
            String(articleId).trim() === '' ||
            isNaN(Number(articleId))) {
          console.warn("无效的文章ID，无法跳转:", articleId);
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
    const date = new Date(timestamp * 1000);
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

  generateRandomArticleId() {
    const randomId = Math.floor(Math.random() * 130) + 1;
    return randomId.toString();
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
    // 同时绑定 back-home-btn
    const backHomeButtons = document.querySelectorAll(".back-home-btn");
    backHomeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSmartBack();
      });
    });
  }

  handleSmartBack() {
    // 一键回到首页
    window.location.href =
      "index.html" +
      (window.channel ? "?channel=" + window.channel : "");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ArticleDetailPage();
});
