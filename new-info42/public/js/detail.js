
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

  
  const images = extractImages(tempDiv);
  const allPElements = Array.from(tempDiv.querySelectorAll("p"));

  const allBlockElements = allPElements.length > 0 ? allPElements : Array.from(tempDiv.children).filter((el) => {
    const tagName = el.tagName.toLowerCase();
    return ["div", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "strong", "blockquote", "pre", "table"].includes(tagName);
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
    fullText = extractFullText(tempDiv);
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

    let splitPoint = findBestSentenceEnd(remainingText, targetLength);
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

  const finalChunks = combineImagesWithParagraphs(processedParagraphs, images);
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


function extractFullText(htmlElement) {
  let text = "";

  function extractText(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "IMG") {
      if (["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(node.tagName)) {
        if (text && !text.endsWith(" ")) {
          text += " ";
        }
      }

      for (let child of node.childNodes) {
        extractText(child);
      }

      if (["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(node.tagName)) {
        if (text && !text.endsWith(" ")) {
          text += " ";
        }
      }
    }
  }

  extractText(htmlElement);
  return text.replace(/\s+/g, " ").trim();
}


function extractImages(htmlElement) {
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


function findBestSentenceEnd(text, targetLength) {
  if (text.length <= targetLength) {
    return text.length;
  }

  const searchStart = Math.max(0, targetLength - 100);
  const searchEnd = Math.min(text.length, targetLength + 100);
  const abbreviations = ["e.g.", "i.e.", "etc.", "Dr.", "Mr.", "Mrs.", "Ms.", "vs.", "Inc.", "Ltd.", "Co."];

  let bestPosition = -1;
  let minDistance = Infinity;

  for (let i = searchStart; i < searchEnd; i++) {
    if ((text[i] === "." || text[i] === "!" || text[i] === "?") && (i + 1 >= text.length || text[i + 1] === " ")) {
      const isAbbreviation = abbreviations.some((abbr) => {
        const start = i - abbr.length + 1;
        return start >= 0 && text.substring(start, i + 1) === abbr;
      });

      if (!isAbbreviation) {
        const distance = Math.abs(i - targetLength);
        if (distance < minDistance) {
          minDistance = distance;
          bestPosition = i + 1;
        }
      }
    }
  }

  return bestPosition > 0 ? bestPosition : targetLength;
}


function combineImagesWithParagraphs(paragraphs, images) {
  if (images.length === 0) {
    return paragraphs.map(p => ({ elements: [p] }));
  }

  const chunks = [];
  
  if (images[0] && paragraphs.length > 0) {
    const firstChunkElements = [images[0].element, paragraphs[0]];
    chunks.push({ elements: firstChunkElements });
    
    const remainingParagraphs = paragraphs.slice(1);
    
    if (images.length > 1 && remainingParagraphs.length > 0) {
      const remainingImages = images.slice(1);
      const paragraphsPerImage = Math.ceil(remainingParagraphs.length / remainingImages.length);
      
      let currentParagraphIndex = 0;
      
      for (let i = 0; i < remainingImages.length; i++) {
        const chunkParagraphs = remainingParagraphs.slice(currentParagraphIndex, currentParagraphIndex + paragraphsPerImage);
        currentParagraphIndex += paragraphsPerImage;

        const chunkElements = [...chunkParagraphs];
        if (remainingImages[i]) {
          chunkElements.push(remainingImages[i].element);
        }

        chunks.push({ elements: chunkElements });
      }

      if (currentParagraphIndex < remainingParagraphs.length) {
        const finalRemainingParagraphs = remainingParagraphs.slice(currentParagraphIndex);
        chunks.push({ elements: finalRemainingParagraphs });
      }
    } else if (remainingParagraphs.length > 0) {
      
      remainingParagraphs.forEach(p => chunks.push({ elements: [p] }));
    }
  } else if (paragraphs.length > 0) {
    
    paragraphs.forEach(p => chunks.push({ elements: [p] }));
  } else if (images.length > 0) {
    
    images.forEach(img => chunks.push({ elements: [img.element] }));
  }

  return chunks;
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

