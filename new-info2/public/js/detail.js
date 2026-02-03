
import { BASE_URL, Category_URL, ARTICLE_PATH } from "./BaseURL.js";


const Utils = window.Utils;


async function initDetailPage() {
  try {
   
    bindDetailPageSidebarNavigation();
    let articleId = Utils.getUrlParam("id");

    
    if (!articleId) {
      try {
        let articles = [];
        
        if (window.healthNewsApp && window.healthNewsApp.articles.length > 0) {
          // Use articles from healthNewsApp if available
          articles = window.healthNewsApp.articles;
        } else {
          // Fallback to fetch if healthNewsApp is not ready or has no articles
          const response = await fetch(Category_URL);
          if (!response.ok) {
            throw new Error(`Failed to fetch articles: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (Array.isArray(data)) {
            if (data.length > 0 && data[0].info1) {
              articles = data.slice(1); 
            } else {
              articles = data;
            }
          } else if (data && Array.isArray(data.data)) {
            articles = data.data;
          } else if (data && Array.isArray(data.list)) {
            articles = data.list;
          } else if (data && Array.isArray(data.result)) {
            articles = data.result;
          }
        }
        
        const validArticleIds = articles
          .map(article => article.id || article.articleId || article.artId)
          .filter(id => id && id !== '');
        
        if (validArticleIds.length > 0) {
          const randomIndex = Math.floor(Math.random() * validArticleIds.length);
          articleId = String(validArticleIds[randomIndex]);
        } else {
          articleId = String(Math.floor(Math.random() * 1000) + 1);
        }
      } catch (error) {
        articleId = String(Math.floor(Math.random() * 1000) + 1);
      }
    }

    if (!articleId) {
      showError("No available articles found");
      return;
    }

    const loadPromises = [loadArticleDetail(articleId), initSmartBackButton()];

    try {
      await loadPromises[0];
      loadRecommendedArticles(articleId).catch(console.error);
    } catch (error) {
      
      showError("Article loading failed");
    }
  } catch (error) {
    
    showError("Page loading failed, please try again later");
  }
}


function initSmartBackButton() {
  const smartBackButton = document.getElementById("smartBackButton");

  if (!smartBackButton) {
    return;
  }

  const newButton = smartBackButton.cloneNode(true);
  smartBackButton.parentNode.replaceChild(newButton, smartBackButton);

  newButton.addEventListener("click", (e) => {
    e.preventDefault();

    try {
      if (window.history.length > 1) {
        const referrer = document.referrer;
        const currentDomain = window.location.hostname;

        if (referrer && referrer.includes(currentDomain)) {
          window.history.back();
        } else {
          window.location.href =
            "../index.html" +
            (window.channel ? "?channel=" + window.channel : "");
        }
      } else {
        window.location.href =
          "../index.html" +
          (window.channel ? "?channel=" + window.channel : "");
      }
    } catch (error) {
      window.location.href =
        "../index.html" + (window.channel ? "?channel=" + window.channel : "");
    }
  });
}


async function loadArticleDetail(articleId) {
  try {
    
    const articleUrl = `${BASE_URL}/${articleId}/${ARTICLE_PATH}/data.json`;
    

    const response = await fetch(articleUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Article with ID ${articleId} not found`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const articleData = await response.json();
    
    
    if (articleData.error) {
      throw new Error(articleData.error);
    }

    
    updateArticleContent(articleData);
  } catch (error) {
    
    showError("article loading failed");
  }
}


function fixContentImagePaths(content, articleId) {
  const currentPath = window.location.pathname;

  content = content.replace(
    /src="public\/images\/\d+_content_\d+\.(jpg|jpeg|png|gif|webp)"/gi,
    (match, ext) => {
      const basePath = currentPath.includes("/pages/")
        ? "../public/images/"
        : "public/images/";
      const contentImgMatch = match.match(/(\d+_content_\d+)/);
      if (contentImgMatch) {
        return `src="${basePath}${contentImgMatch[1]}.${ext}"`;
      }
      return match;
    }
  );

  content = content.replace(
    /src="\.?\/?([^"]*\.(jpg|jpeg|png|gif|webp))"/gi,
    (match, imagePath) => {
      if (
        !imagePath.startsWith("http") &&
        !imagePath.startsWith("/") &&
        !imagePath.startsWith("public/")
      ) {
        const basePath = currentPath.includes("/pages/")
          ? "../public/images/"
          : "public/images/";
        return `src="${basePath}${imagePath}"`;
      }
      return match;
    }
  );

  return content;
}


function updateArticleContent(articleData) {
  const titleElement = document.getElementById("articleTitle");
  if (titleElement) {
    titleElement.textContent = articleData.title || "";
    document.title = articleData.title || "Article Detail";
  }

  const typeElement = document.getElementById("articleType");
  const timeElement = document.getElementById("articleTime");
  const authorElement = document.getElementById("articleAuthor");
  const sourceElement = document.getElementById("articleSource");

  if (typeElement) {
    typeElement.textContent = articleData.author || articleData.anthor || "-";
  }

  if (timeElement && articleData.create_time) {
    
    const timestamp = articleData.create_time;
    const date = new Date(typeof timestamp === 'number' && timestamp > 1e12 ? timestamp : timestamp * 1000);
    timeElement.textContent = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (authorElement) {
    authorElement.textContent = articleData.author || "Unknown";
  }

  if (sourceElement) {
    sourceElement.textContent = articleData.source || "Unknown";
  }

  const contentElement = document.getElementById("articleContent");
  if (contentElement) {
    let contentHTML = '<div class="article-item">';
    
    
    if (articleData.img) {
      contentHTML += `<div style="text-align: center; margin: 20px 0;"><img src="${articleData.img}" alt="Article image" style="max-width: 100%; height: auto;"/></div>`;
    }
    
    
    if (articleData.content) {
      if (Array.isArray(articleData.content)) {
        
        const content = articleData.content.join("");
        if (content) {
          
          const fixedContent = fixContentImagePaths(content, articleData.id);
          renderArticleContent(contentElement, fixedContent, articleData.id);
        } else {
          contentElement.innerHTML = '<div class="article-item"><p>Content not available</p></div>';
        }
      } else if (typeof articleData.content === "string") {
        
        const fixedContent = fixContentImagePaths(articleData.content, articleData.id);
        renderArticleContent(contentElement, fixedContent, articleData.id);
      } else {
        contentElement.innerHTML = '<div class="article-item"><p>Content format not supported</p></div>';
      }
    } else if (articleData.section) {
      contentElement.innerHTML = `<div class="article-item"><p>${articleData.section}</p></div>`;
    } else {
      contentElement.innerHTML = '<div class="article-item"><p>Full article content not available</p></div>';
    }
  }
}

function renderArticleContent(contentContainer, htmlContent, articleId) {
  if (articleId) {
    htmlContent = replaceImageUrls(htmlContent, articleId);
  }

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  const articleItems = contentContainer.querySelectorAll(".article-item");

  if (articleItems.length === 0) {
    return;
  }

  
  const firstImg = tempDiv.querySelector("img");
  let firstImgElement = null;

  if (firstImg) {
    firstImgElement = firstImg.cloneNode(true);
    firstImg.remove();
  }

  
  const allPTags = Array.from(tempDiv.querySelectorAll("p"));
  const totalParagraphs = allPTags.length;

  
  if (totalParagraphs <= 5) {
    const firstArticleItem = articleItems[0];
    firstArticleItem.innerHTML = tempDiv.innerHTML;
    
    if (firstImgElement) {
      firstArticleItem.parentElement.insertBefore(
        firstImgElement,
        firstArticleItem
      );
    }
    return;
  }

  
  const charLimits = [300, 500, 500, 500, 500];
  
  for (let i = 0; i < 5 && i < allPTags.length && i < articleItems.length; i++) {
    const pTag = allPTags[i];
    const articleItem = articleItems[i];
    const maxChars = charLimits[i];
    
    articleItem.innerHTML = "";
    
    
    const pText = pTag.textContent || pTag.innerText || "";
    
    
    let displayText = pText;
    if (pText.length > maxChars) {
      const sentences = pText.split(/([。！？.!?])/);
      let truncated = "";
      let currentLength = 0;
      
      for (let j = 0; j < sentences.length; j++) {
        const part = sentences[j];
        if (currentLength + part.length <= maxChars) {
          truncated += part;
          currentLength += part.length;
        } else {
          if (truncated) break;
          truncated = part.substring(0, maxChars);
          break;
        }
      }
      displayText = truncated;
    }
    
    if (displayText.trim()) {
      const newPTag = document.createElement("p");
      newPTag.textContent = displayText;
      articleItem.appendChild(newPTag);
    }
  }

  
  const remainingContent = document.createElement("div");
  remainingContent.className = "article-remaining-content";
  
  
  const fullContentCopy = document.createElement("div");
  fullContentCopy.innerHTML = tempDiv.innerHTML;
  
  
  const paragraphsToRemove = Array.from(fullContentCopy.querySelectorAll("p")).slice(0, 5);
  paragraphsToRemove.forEach(p => p.remove());
  
  
  remainingContent.innerHTML = fullContentCopy.innerHTML;
  
  
  if (remainingContent.innerHTML.trim() === "") {
    return;
  }

  
  if (firstImgElement && articleItems.length > 0) {
    const firstArticleItem = articleItems[0];
    firstArticleItem.parentElement.insertBefore(
      firstImgElement,
      firstArticleItem
    );
  }

  
  const parent = contentContainer.parentElement;
  if (parent) {
    if (contentContainer.nextSibling) {
      parent.insertBefore(remainingContent, contentContainer.nextSibling);
    } else {
      parent.appendChild(remainingContent);
    }
  }
}


function showError(message) {
  const contentElement = document.getElementById("articleContent");
  if (contentElement) {
    contentElement.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 40px;">
        <h3>failed load</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background-color: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">重新加载</button>
      </div>
    `;
  }
}


async function loadRecommendedArticles(currentArticleId) {
  try {
    if (!window.healthNewsApp) {
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.healthNewsApp) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    
    if (window.healthNewsApp.articles.length === 0) {
      await window.healthNewsApp.loadData();
    }

    if (
      window.healthNewsApp &&
      typeof window.healthNewsApp.renderRecommendedArticles === "function"
    ) {
      window.healthNewsApp.renderRecommendedArticles(currentArticleId);
    }
  } catch (error) {
    
  }
}


function replaceImageUrls(htmlContent, articleId) {
  if (!htmlContent) {
    return htmlContent;
  }

  return htmlContent.replace(
    /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
    (match, before, src, after) => {
      // Don't modify external URLs
      if (src.startsWith("http://") || src.startsWith("https://")) {
        return match;
      }

      return `<img${before}src="${src}"${after}>`;
    }
  );
}

// Bind sidebar navigation events for detail page
function bindDetailPageSidebarNavigation() {
  // Handle sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarMenu = document.getElementById('sidebarMenu');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarClose = document.getElementById('sidebarClose');
  
  // Toggle sidebar
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebarMenu.classList.add('active');
      sidebarOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      bindEscToCloseSidebar();
    });
  }
  
  // Close sidebar
  function closeSidebar() {
    if (sidebarMenu) sidebarMenu.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Close on overlay click
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }
  
  // Close on close button click
  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
  }
  
  // Close on ESC key
  function bindEscToCloseSidebar() {
    function handleEscKey(e) {
      if (e.key === 'Escape') {
        closeSidebar();
        document.removeEventListener('keydown', handleEscKey);
      }
    }
    document.addEventListener('keydown', handleEscKey);
  }
  
  // Handle sidebar item clicks
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const href = item.getAttribute('href');
      if (href) {
        e.preventDefault();
        window.location.href = href;
        setTimeout(() => {
          closeSidebar();
        }, 100);
      }
    });
  });
}


document.addEventListener("DOMContentLoaded", () => {
  
  // Wait for healthNewsApp to be ready
  if (!window.healthNewsApp) {
    // If healthNewsApp doesn't exist, wait a bit and try again
    setTimeout(() => {
      initDetailPage();
    }, 100);
  } else {
    // If healthNewsApp exists, just initialize detail page
    // Don't call loadData() again to avoid duplicate requests
    initDetailPage();
  }

  
  setTimeout(() => {
    if (window.BackToTop) {
      new window.BackToTop();
    }
  }, 100);
});

