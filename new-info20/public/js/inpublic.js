const Utils = {
  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  },

  formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  },

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
  },

  getArticleImage(article) {
   
    const extractRealImageUrl = (url) => {
      if (!url) return url;

     
      try {
        const urlObj = new URL(url);
        const srcParam = urlObj.searchParams.get("src");
        if (srcParam) {
          return srcParam;
        }
      } catch (e) {
       
      }

      return url;
    };

   
    const encodeImageUrl = (url) => {
      if (!url) return url;
     
      return url.replace(/[^\x00-\x7F]/g, (char) => encodeURIComponent(char));
    };

    if (article && article.img) {
      let imgUrl = article.img;

      if (/^https?:\/\//i.test(imgUrl)) {
       
        const realUrl = extractRealImageUrl(imgUrl);
        return encodeImageUrl(realUrl);
      }
      if (imgUrl.startsWith("/")) {
        const base = RemoteDataConfig.baseUrl.replace(new RegExp(RemoteDataConfig.removePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$"), "");
        return `${base}${imgUrl}`;
      }
      if (article.id) {
        const base = RemoteDataConfig.baseUrl.replace(new RegExp(RemoteDataConfig.removePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$"), "");
        return `${base}/${article.id}/${imgUrl}`;
      }
      const base = RemoteDataConfig.baseUrl.replace(new RegExp(RemoteDataConfig.removePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$"), "");
      return `${base}/${imgUrl}`;
    }

    if (article && article.id) {
      return RemoteDataConfig.articleImageUrl(article.id, 1);
    }

    return "";
  },

  getCategoryIconByType(type) {
    
    if (type === "real estate") {
      
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M41 18.94H7.05a1 1 0 0 1-.68-1.74l17-15.42a1 1 0 0 1 1.35 0l17 15.42a1 1 0 0 1 .26 1.1 1 1 0 0 1-.98.64zm-31.33-2h28.71L24 3.87zM36.56 37a1 1 0 0 1-1-1V20.79a1 1 0 0 1 2 0V36a1 1 0 0 1-1 1zM11.45 37a1 1 0 0 1-1-1V20.79a1 1 0 0 1 2 0V36a1 1 0 0 1-1 1z"/><path fill="var(--color1)" d="M41.16 42.29H6.84a1 1 0 0 1-1-1 6.31 6.31 0 0 1 6.3-6.3h23.72a6.31 6.31 0 0 1 6.3 6.3 1 1 0 0 1-1 1zM8 40.29h32A4.31 4.31 0 0 0 35.86 37H12.14A4.31 4.31 0 0 0 8 40.29zM45.5 46.48h-43a1 1 0 0 1 0-2h43a1 1 0 0 1 0 2zM24 28c-2.69 0-4.8-1.49-4.8-3.41s2.11-3.41 4.8-3.41c2.49 0 4.5 1.27 4.78 3a1 1 0 0 1-2 .31c-.1-.62-1.27-1.32-2.8-1.32s-2.8.76-2.8 1.41S22.42 26 24 26a1 1 0 0 1 0 2z"/><path fill="var(--color1)" d="M24 32.79c-2.48 0-4.49-1.27-4.77-3a1 1 0 0 1 2-.32c.1.63 1.27 1.33 2.79 1.33s2.81-.76 2.81-1.42S25.58 28 24 28a1 1 0 0 1 0-2c2.7 0 4.81 1.5 4.81 3.41S26.7 32.79 24 32.79z"/><path fill="var(--color1)" d="M24 34.67a1 1 0 0 1-1-1V20.26a1 1 0 0 1 2 0v13.41a1 1 0 0 1-1 1z"/></svg>';
    }
    if (type === "law") {
      
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M41.09 46.5H6.91a1 1 0 0 1-1-1v-43a1 1 0 0 1 1-1h26.6a1 1 0 0 1 0 2H7.91v41h32.18V10.08a1 1 0 1 1 2 0V45.5a1 1 0 0 1-1 1z"/><path fill="var(--color1)" d="M41.09 11.08a1 1 0 0 1-.71-.29L32.8 3.21a1 1 0 0 1 1.42-1.42l7.58 7.58a1 1 0 0 1 0 1.42 1 1 0 0 1-.71.29z"/><path fill="var(--color1)" d="M41.09 11.08h-7.58a1 1 0 0 1-1-1V2.5a1 1 0 0 1 1.71-.71l7.58 7.58a1 1 0 0 1-.71 1.71zm-6.58-2h4.17l-4.17-4.17zM16.44 14.88c-2.64 0-4.71-1.55-4.71-3.53s2.07-3.54 4.71-3.54c2.4 0 4.41 1.35 4.67 3.13a1 1 0 0 1-.84 1.14 1 1 0 0 1-1.13-.84c-.11-.69-1.21-1.43-2.7-1.43s-2.71.82-2.71 1.54 1.11 1.53 2.71 1.53a1 1 0 0 1 0 2z"/><path fill="var(--color1)" d="M16.44 20C14 20 12 18.62 11.76 16.83a1 1 0 0 1 2-.29c.1.69 1.21 1.43 2.7 1.43s2.7-.82 2.7-1.55-1.11-1.54-2.7-1.54a1 1 0 0 1 0-2c2.64 0 4.7 1.56 4.7 3.54S19.08 20 16.44 20z"/><path fill="var(--color1)" d="M16.44 21.94a1 1 0 0 1-1-1V6.84a1 1 0 0 1 2 0v14.1a1 1 0 0 1-1 1zM30.75 8.59H23.1a1 1 0 0 1 0-2h7.65a1 1 0 0 1 0 2zM30.75 11.93H23.1a1 1 0 0 1 0-2h7.65a1 1 0 0 1 0 2zM38.27 15.27H23.1a1 1 0 0 1 0-2h15.17a1 1 0 0 1 0 2zM38.27 18.6H23.1a1 1 0 0 1 0-2h15.17a1 1 0 0 1 0 2zM38.27 21.94H23.1a1 1 0 0 1 0-2h15.17a1 1 0 0 1 0 2zM38.27 25.27H10.36a1 1 0 1 1 0-2h27.91a1 1 0 0 1 0 2zM38.27 28.61H10.36a1 1 0 0 1 0-2h27.91a1 1 0 0 1 0 2zM38.27 32H10.36a1 1 0 0 1 0-2h27.91a1 1 0 0 1 0 2zM38.27 35.28H10.36a1 1 0 0 1 0-2h27.91a1 1 0 1 1 0 2zM38.27 38.62H10.36a1 1 0 0 1 0-2h27.91a1 1 0 0 1 0 2zM38.27 42H10.36a1 1 0 0 1 0-2h27.91a1 1 0 0 1 0 2z"/></svg>';
    }
    if (type === "finance") {
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M21.66 32.67a1 1 0 0 1-1-1V20.19a4.87 4.87 0 1 1 9.74 0 1 1 0 1 1-2 0 2.87 2.87 0 1 0-5.74 0v11.48a1 1 0 0 1-1 1z"/><path fill="var(--color1)" d="M26.74 26.21H18.6a1 1 0 0 1 0-2h8.14a1 1 0 1 1 0 2zM29.4 32.67H18.6a1 1 0 0 1 0-2h10.8a1 1 0 0 1 0 2z"/><path fill="var(--color1)" d="M24 38.22A14.23 14.23 0 1 1 38.23 24 14.24 14.24 0 0 1 24 38.22zm0-26.45A12.23 12.23 0 1 0 36.23 24 12.24 12.24 0 0 0 24 11.77z"/><path fill="var(--color1)" d="M24 44.05a20.18 20.18 0 0 1-5.5-.77 1 1 0 1 1 .55-1.92A18.05 18.05 0 0 0 35.23 9.87a1 1 0 0 1 1.24-1.57A20 20 0 0 1 24 44.05z"/><path fill="var(--color1)" d="M21.11 46.37a1 1 0 0 1-.8-.4l-2.33-3a1 1 0 0 1-.2-.74 1 1 0 0 1 .39-.66l3.09-2.37a1 1 0 1 1 1.21 1.58l-2.29 1.72 1.72 2.26a1 1 0 0 1-.18 1.4 1 1 0 0 1-.61.21zM12.15 39.92a1 1 0 0 1-.62-.22A20 20 0 0 1 24 4a20.34 20.34 0 0 1 5.5.76 1 1 0 0 1-.5 1.88 18.06 18.06 0 0 0-16.18 31.5 1 1 0 0 1-.62 1.78z"/><path fill="var(--color1)" d="M26.14 9a1 1 0 0 1-.61-1.79l2.29-1.76-1.72-2.2A1 1 0 1 1 27.69 2l2.33 3a1 1 0 0 1 .2.74 1 1 0 0 1-.39.66l-3.09 2.44a1 1 0 0 1-.6.16z"/></svg>';
    }
    if (type === "loans & mortgages") {
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M32.08 45h-.28a9.13 9.13 0 0 1 .55-18.25A9.13 9.13 0 0 1 32.08 45zm0-16.25a7.13 7.13 0 1 0 7.12 7.34 7.12 7.12 0 0 0-6.9-7.34h-.22zM16 42.89a14.44 14.44 0 0 1-13.7-10 14.42 14.42 0 0 1 3.16-14.23 1 1 0 0 1 1.42 0 1 1 0 0 1 0 1.41 12.41 12.41 0 0 0-2 2.8 12.39 12.39 0 0 0 16.12 17 1 1 0 0 1 1 .83 1.82 14.37 14.37 0 0 1-5.83 1.2zM41.81 29.85a1 1 0 0 1-.73-1.69 12.65 12.65 0 0 0 2-2.8A12.39 12.39 0 0 0 26.92 8.42a1 1 0 0 1-.82-1.83 14.39 14.39 0 0 1 18.73 19.68 14.17 14.17 0 0 1-2.29 3.26 1 1 0 0 1-.73.32z"/><path fill="var(--color1)" d="M41.81 29.85a1 1 0 0 1-.57-.18 1 1 0 0 1-.41-.64l-.49-2.7a1 1 0 0 1 2-.35l.31 1.7 1.66-.3a1 1 0 0 1 .36 2l-2.67.45zM15 13.37a4.19 4.19 0 0 1-2.91-1.19 2.52 2.52 0 0 1-.72-1.79c.05-1.6 1.74-2.79 3.81-2.75 1.92.06 3.44 1.17 3.61 2.65a1 1 0 0 1-2 .23c0-.35-.7-.85-1.69-.88s-1.74.47-1.75.81a.53.53 0 0 0 .17.35 2.25 2.25 0 0 0 1.52.57 1 1 0 0 1 1 1 1 0 0 1-1.04 1z"/><path fill="var(--color1)" d="M15 17.09h-.16c-1.84-.09-3.4-1.17-3.58-2.63a1 1 0 0 1 2-.24c0 .34.7.84 1.69.87a2.16 2.16 0 0 0 1.55-.47.54.54 0 0 0 .2-.34c0-.34-.67-.88-1.7-.92a1 1 0 0 1 .07-2c2.08.06 3.67 1.37 3.63 3a2.5 2.5 0 0 1-.83 1.73 4.1 4.1 0 0 1-2.87 1z"/><path fill="var(--color1)" d="M14.86 18.54a1 1 0 0 1-1-1l.33-10.35a1 1 0 0 1 1-1 1 1 0 0 1 1 1l-.32 10.35a1 1 0 0 1-1.01 1z"/><path fill="var(--color1)" d="M15 21.76a9.39 9.39 0 1 1 9.4-9.39 9.4 9.4 0 0 1-9.4 9.39zM15 5a7.39 7.39 0 1 0 7.4 7.39A7.39 7.39 0 0 0 15 5z"/><path fill="var(--color1)" d="M6.68 23a1 1 0 0 1-1-.83l-.3-1.7-1.67.31a1 1 0 0 1-.36-2L6 18.36a1 1 0 0 1 .75.16 1 1 0 0 1 .42.65l.48 2.69A1 1 0 0 1 6.86 23zM30.85 40.91a1 1 0 0 1-1-1v-6a3 3 0 1 1 6 0 1 1 0 0 1-2 0 1 1 0 0 1 0-2 0v6a1 1 0 0 1-1 1z"/><path fill="var(--color1)" d="M33.51 37.53h-4.26a1 1 0 0 1 0-2h4.26a1 1 0 0 1 0 2zM34.9 40.91h-5.65a1 1 0 0 1 0-2h5.65a1 1 0 1 1 0 2z"/></svg>';
    }
    return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M22.09 46.76A20.82 20.82 0 1 1 28.07 6a1 1 0 1 1-.57 1.92 18.78 18.78 0 1 0 12.6 12.53 1 1 0 0 1 1.9-.58 20.83 20.83 0 0 1-19.91 26.89z"/><path fill="var(--color1)" d="M36.08 22.54a10.65 10.65 0 1 1 10.65-10.65 10.66 10.66 0 0 1-10.65 10.65zm0-19.3a8.65 8.65 0 1 0 8.65 8.65 8.66 8.66 0 0 0-8.65-8.65z"/><path fill="var(--color1)" d="M36.08 12.89c-2.41 0-4.23-1.24-4.23-2.89s1.82-2.9 4.23-2.9c2.18 0 3.94 1.07 4.19 2.53a1 1 0 0 1-.81 1.16A1 1 0 0 1 38.3 10c0-.29-.88-.87-2.22-.87s-2.23.64-2.23.9.78.89 2.23.89a1 1 0 0 1 0 2z"/><path fill="var(--color1)" d="M36.08 16.68c-2.18 0-3.95-1.06-4.2-2.52a1 1 0 1 1 2-.34c0 .29.88.86 2.23.86s2.23-.63 2.23-.89-.78-.9-2.23-.9a1 1 0 0 1 0-2c2.41 0 4.23 1.25 4.23 2.9s-1.85 2.89-4.26 2.89z"/><path fill="var(--color1)" d="M36.08 19.32a1 1 0 0 1-1-1V5.46a1 1 0 0 1 2 0v12.86a1 1 0 0 1-1 1zM23.09 26.94h-9.17a1 1 0 1 1 0-2h7.17V10.47a1 1 0 0 1 2 0z"/></svg>';
  },

  setupArticlesContainer(container, clearContent = true) {
    if (!container) return;

    container.className = "section-articles";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "14px";
    container.style.padding = "0";

    if (clearContent) {
      container.innerHTML = "";
    }
  },

  generateArticleListCardHTML(article, titleLines = 2, layout = "left") {
    if (!article) return "";

    const formattedDate = article.create_time
      ? Utils.formatTime(article.create_time)
      : "";
    const title = Utils.truncateTextToLines(article.title || "", titleLines);
    const imageUrl = Utils.getArticleImage(article);
    const articleId = article.id || "";
    const layoutClass = layout === "left" ? "left-img" : "right-img";

    return `
      <div class="card-list ${layoutClass}" data-id="${articleId}">
        <div class="list-content">
          <h3 class="list-title">${title}</h3>
          <div class="list-meta">
            ${
              formattedDate
                ? `<span class="list-date">${formattedDate}</span>`
                : ""
            }
          </div>
        </div>
        <div class="list-img">
          <img src="${imageUrl}" alt="${
      article.title || ""
    }" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.parentElement.classList.add('no-image');">
        </div>
      </div>
    `;
  },

  generateArticleListHTML(
    articles,
    titleLines = 2,
    useAlternatingLayout = false
  ) {
    if (!Array.isArray(articles) || articles.length === 0) {
      return "";
    }

    return articles
      .map((article, index) => {
        const layout = useAlternatingLayout
          ? index % 2 === 0
            ? "left"
            : "right"
          : "left";
        return Utils.generateArticleListCardHTML(article, titleLines, layout);
      })
      .join("");
  },

  generateArticleGridCardHTML(article, titleLines = 3) {
    if (!article) return "";

    const title = Utils.truncateTextToLines(article.title || "", titleLines);
    const imageUrl = Utils.getArticleImage(article);
    const articleId = article.id || "";

    return `
      <div class="card-simple" data-id="${articleId}">
        <div class="img-simple">
          <img src="${imageUrl}" alt="${
      article.title || ""
    }" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #746097 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
            <div>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
              </svg>
              <div>Image</div>
              <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
            </div>
          </div>
        </div>
        <h3 class="title-simple">${title}</h3>
      </div>
    `;
  },

  generateArticleGridHTML(articles, titleLines = 3) {
    if (!Array.isArray(articles) || articles.length === 0) {
      return "";
    }

    return articles
      .map((article) => Utils.generateArticleGridCardHTML(article, titleLines))
      .join("");
  },

  setupArticlesContainerForGrid(container, clearContent = true) {
    if (!container) return;

    container.className = "section-articles";
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(2, 1fr)";
    container.style.gap = "15px";
    container.style.padding = "0 20px";
    container.style.maxWidth = "1200px";
    container.style.margin = "0 auto";

    if (clearContent) {
      container.innerHTML = "";
    }
  },
};

const RemoteDataConfig = {
  get baseUrl() {
    return window.DataConfig.baseUrl;
  },
  get dbUrl() {
    return window.DataConfig.dbUrl;
  },
  get removePath() {
    return window.DataConfig.removePath || "";
  },
  datasetKey: "info1",

  articleDataUrl(id) {
    return this.baseUrl.replace("{id}", id) + "/data.json";
  },

  articleImageUrl(id, imageIndex = 1) {
    const base = this.baseUrl.replace(new RegExp(this.removePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$"), "");
    return `${base}/${id}/${imageIndex}.jpg`;
  },

  extractArticles(rawData) {
    if (Array.isArray(rawData)) {
      return rawData;
    }
    if (rawData && this.datasetKey && Array.isArray(rawData[this.datasetKey])) {
      return rawData[this.datasetKey];
    }
    return [];
  },
};

window.Utils = Utils;
window.RemoteDataConfig = RemoteDataConfig;

class BackToTop {
  constructor() {
    this.backToTopBtn = document.getElementById("backToTopBtn");
    this.init();
  }

  init() {
    if (this.backToTopBtn) {
      this.bindEvents();
      this.checkScrollPosition();
    }
  }

  bindEvents() {
    this.backToTopBtn.addEventListener("click", () => {
      this.scrollToTop();
    });

    window.addEventListener(
      "scroll",
      Utils.throttle(() => {
        this.checkScrollPosition();
      }, 100)
    );
  }

  checkScrollPosition() {
    if (window.pageYOffset > 300) {
      this.backToTopBtn.classList.add("show");
    } else {
      this.backToTopBtn.classList.remove("show");
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new BackToTop();
});

class SidebarMenu {
  constructor(options = {}) {
    this.menuId = options.menuId || "sidebarMenu";
    this.overlayId = options.overlayId || "sidebarOverlay";
    this.toggleId = options.toggleId || "sidebarToggle";
    this.closeButtonId = options.closeButtonId || "sidebarClose";

    this.isInPagesDirectory = window.location.pathname.includes("/pages/");

    this.homeUrl =
      options.homeUrl ||
      (this.isInPagesDirectory ? "../index.html" : "index.html");

    this.categoryUrlPrefix =
      options.categoryUrlPrefix ||
      (this.isInPagesDirectory
        ? "category.html?type="
        : "pages/category.html?type=");

    this.categories = this.normalizeCategories(options.categories || []);
    this.fetchCategories =
      options.fetchCategories !== false && this.categories.length === 0;

    this.sidebarMenuEl = null;
    this.sidebarOverlayEl = null;
    this.sidebarToggleEl = null;
    this.sidebarCloseEl = null;

    if (options.autoInit !== false) {
      this.init();
    }
  }

  normalizeCategories(categories) {
    return categories
      .filter((category) => category && category.name && category.id !== "all")
      .map((category) => ({
        id: category.id || this.generateIdFromName(category.name),
        name: category.name,
      }));
  }

  generateIdFromName(name) {
    return name.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-");
  }

  async init() {
    this.sidebarMenuEl = document.getElementById(this.menuId);
    this.sidebarOverlayEl = document.getElementById(this.overlayId);
    this.sidebarToggleEl = document.getElementById(this.toggleId);

    if (!this.sidebarMenuEl) {
      return;
    }

    if (this.fetchCategories) {
      try {
        this.categories = await this.loadCategoriesFromData();
      } catch (error) {
        this.categories = [];
      }
    }

    this.renderMenu();
    this.bindCoreEvents();
  }

  async loadCategoriesFromData() {
    if (!RemoteDataConfig || !RemoteDataConfig.dbUrl) {
      throw new Error("RemoteDataConfig.dbUrl is not configured");
    }

    const response = await fetch(RemoteDataConfig.dbUrl, {
      cache: "no-store",
    }).catch((error) => {
      return null;
    });

    if (!response || !response.ok) {
      throw new Error(
        `Failed to fetch sidebar data: ${
          response ? response.status : "network error"
        }`
      );
    }

    const rawData = await response.json();
    const articles = RemoteDataConfig.extractArticles(rawData);
    if (!Array.isArray(articles)) {
      return [];
    }

    const typeSet = new Set();
    articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });

    return Array.from(typeSet).map((type) => ({
      id: this.generateIdFromName(type),
      name: type,
    }));
  }

  renderMenu() {
    if (!this.sidebarMenuEl) return;

    const categoryLinks = this.categories
      .map((category) => {
        const encodedName = encodeURIComponent(category.name);
        return `
          <a href="${this.categoryUrlPrefix}${encodedName}" class="sidebar-item">
            <span>${category.name}</span>
          </a>
        `;
      })
      .join("");

    this.sidebarMenuEl.innerHTML = `
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h3>Menu</h3>
          <button class="sidebar-close" id="${this.closeButtonId}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="sidebar-items">
          <a href="${this.homeUrl}" class="sidebar-item">
            <span>Home</span>
          </a>
          <div class="sidebar-category">
            ${categoryLinks}
          </div>
        </div>
      </div>
    `;

    this.sidebarCloseEl = document.getElementById(this.closeButtonId);
    this.bindSidebarNavigation();
    if (this.sidebarCloseEl) {
      this.sidebarCloseEl.addEventListener("click", () => {
        this.closeSidebar();
      });
    }
  }

  bindCoreEvents() {
    if (this.sidebarToggleEl) {
      this.sidebarToggleEl.addEventListener("click", () => {
        this.openSidebar();
      });
    }

    if (this.sidebarOverlayEl) {
      this.sidebarOverlayEl.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    document.addEventListener("keydown", this.handleEscapeKey);
  }

  handleEscapeKey = (e) => {
    if (e.key === "Escape") {
      this.closeSidebar();
    }
  };

  bindSidebarNavigation() {
    const sidebarItems = this.sidebarMenuEl.querySelectorAll(".sidebar-item");
    sidebarItems.forEach((item) => {
      const href = item.getAttribute("href");
      item.addEventListener("click", (event) => {
        event.preventDefault();
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
    if (this.sidebarMenuEl) {
      this.sidebarMenuEl.classList.add("active");
      document.body.style.overflow = "hidden";
    }
    if (this.sidebarOverlayEl) {
      this.sidebarOverlayEl.classList.add("active");
    }
  }

  closeSidebar() {
    if (this.sidebarMenuEl) {
      this.sidebarMenuEl.classList.remove("active");
      document.body.style.overflow = "";
    }
    if (this.sidebarOverlayEl) {
      this.sidebarOverlayEl.classList.remove("active");
    }
  }

  updateCategories(categories = []) {
    this.categories = this.normalizeCategories(categories);
    this.renderMenu();
  }
}

window.SidebarMenu = SidebarMenu;

class StaticPage {
  constructor(options = {}) {
    this.homeUrl = options.homeUrl || "index.html";
    this.sidebarMenu = null;
    this.init();
  }

  init() {
    this.sidebarMenu = new SidebarMenu({
      homeUrl: this.homeUrl,
      fetchCategories: true,
    });

    initSmartBackButton(this.homeUrl);
  }
}

window.StaticPage = StaticPage;

function initSmartBackButton(homeUrl = null) {
  const backButton = document.getElementById("smartBackButton");
  if (!backButton) return;

  if (!homeUrl) {
    const pathname = window.location.pathname;
    const isInPagesDirectory = pathname.includes("/pages/");
    homeUrl = isInPagesDirectory ? "../index.html" : "index.html";
  }

  backButton.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = homeUrl;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const pathname = window.location.pathname;
  const isAboutPage = pathname.includes("about.html");
  const isPrivacyPage = pathname.includes("privacy.html");

  const hasBackButton = document.getElementById("smartBackButton");

  if ((isAboutPage || isPrivacyPage) && hasBackButton) {
    const homeUrl = pathname.includes("/pages/")
      ? "../index.html"
      : "index.html";
    new StaticPage({ homeUrl });
  } else if (hasBackButton) {
    initSmartBackButton();
  }
});
