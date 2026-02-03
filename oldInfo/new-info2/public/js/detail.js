
import { BASE_URL, IMG_BASE_URL } from "./BaseURL.js";


const Utils = window.Utils;


async function initDetailPage() {
  try {
    let articleId = Utils.getUrlParam("id");

    if (!articleId) {
      articleId = String(Math.floor(Math.random() * 130) + 1);
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
    const healthsUrl = BASE_URL.replace("/number/", `/${articleId}/`);

    const healthsResponse = await fetch(healthsUrl);

    if (!healthsResponse.ok) {
      throw new Error(`HTTP error! status: ${healthsResponse.status}`);
    }

    const articleData = await healthsResponse.json();

    if (!articleData || !articleData.id) {
      throw new Error(`Article with ID ${articleId} not found`);
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

  if (typeElement) {
    typeElement.textContent = articleData.type || "-";
  }

  if (timeElement && articleData.create_time) {
    const date = new Date(articleData.create_time * 1000);
    timeElement.textContent = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (articleData.section) {
    const sectionElement = document.getElementById("articleSection");
    const sectionTextElement = document.getElementById("sectionText");

    if (sectionElement && sectionTextElement) {
      sectionTextElement.textContent = articleData.section;
      sectionElement.style.display = "block";
    }
  }

  const contentElement = document.getElementById("articleContent");
  if (contentElement) {
    
    if (articleData.content) {
      let content = "";

      
      if (Array.isArray(articleData.content)) {
        content = articleData.content.join("");
      }
      
      else if (typeof articleData.content === "string") {
        content = articleData.content;
      }
      
      else if (typeof articleData.content === "object") {
        content = JSON.stringify(articleData.content);
      }

      if (content) {
        content = fixContentImagePaths(content, articleData.id);
        renderArticleContent(contentElement, content, articleData.id);
      } else {
        
        if (articleData.section) {
          contentElement.innerHTML = `<div class="article-item"><p>${articleData.section}</p></div>`;
        } else {
          contentElement.innerHTML =
            '<div class="article-item"><p>Content not available</p></div>';
        }
      }
    }
    
    else if (articleData.section) {
      contentElement.innerHTML = `<div class="article-item"><p>${articleData.section}</p></div>`;
    }
    
    else {
      contentElement.innerHTML =
        '<div class="article-item"><p>Content not available</p></div>';
    }
  }
}


function renderArticleContent(contentContainer, htmlContent, articleId) {
  if (articleId) {
    htmlContent = replaceImageUrls(htmlContent, articleId);
  }

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  const allPTags = tempDiv.querySelectorAll("p");

  const articleItems = contentContainer.querySelectorAll(".article-item");

  if (articleItems.length === 0) {
    return;
  }

  function splitTextBySentence(text, maxChars) {
    let result = "";
    let currentLength = 0;

    const sentences = text.split(/([。！？.!?])/);

    for (let i = 0; i < sentences.length; i++) {
      const part = sentences[i];

      if (currentLength + part.length <= maxChars) {
        result += part;
        currentLength += part.length;
      } else {
        if (result) break;

        result = part.substring(0, maxChars);
        break;
      }
    }

    return result;
  }

  function extractTextFromP(pElement) {
    return pElement.textContent || pElement.innerText || "";
  }

  
  function extractFullText(htmlElement) {
    let text = "";

    function extractText(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName !== "IMG"
      ) {
        
        if (
          [
            "P",
            "DIV",
            "H1",
            "H2",
            "H3",
            "H4",
            "H5",
            "H6",
            "LI",
            "STRONG",
          ].includes(node.tagName)
        ) {
          if (text && !text.endsWith(" ")) {
            text += " ";
          }
        }

        for (let child of node.childNodes) {
          extractText(child);
        }

        if (
          [
            "P",
            "DIV",
            "H1",
            "H2",
            "H3",
            "H4",
            "H5",
            "H6",
            "LI",
            "STRONG",
          ].includes(node.tagName)
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

  const firstImg = tempDiv.querySelector("img");
  let firstImgElement = null;

  if (firstImg) {
    firstImgElement = firstImg.cloneNode(true);
    
    firstImg.remove();
  }

  const charLimits = [300, 500, 500, 500, 500];
  let processedPCount = 0;

  let allText = "";

  
  if (allPTags.length > 0) {
    for (let i = 0; i < allPTags.length; i++) {
      const pText = extractTextFromP(allPTags[i]);
      if (pText.trim()) {
        allText += pText;
      }
    }
  } else {
    
    allText = extractFullText(tempDiv);
  }

  
  if (!allText || allText.trim().length === 0) {
    const firstArticleItem = articleItems[0];
    firstArticleItem.innerHTML = htmlContent;

    
    if (firstImgElement) {
      firstArticleItem.parentElement.insertBefore(
        firstImgElement,
        firstArticleItem
      );
    }
    return;
  }

  let currentTextPosition = 0;

  while (processedPCount < 5 && currentTextPosition < allText.length) {
    const maxChars = charLimits[processedPCount];
    const itemContainer = articleItems[processedPCount];
    itemContainer.innerHTML = "";

    const remainingText = allText.substring(currentTextPosition);

    const truncatedText = splitTextBySentence(remainingText, maxChars);

    if (truncatedText.trim()) {
      const singleP = document.createElement("p");
      singleP.innerHTML = truncatedText;
      itemContainer.appendChild(singleP);

      currentTextPosition += truncatedText.length;
    }

    processedPCount++;
  }

  if (firstImgElement && articleItems.length > 0) {
    const firstArticleItem = articleItems[0];
    firstArticleItem.parentElement.insertBefore(
      firstImgElement,
      firstArticleItem
    );
  }

  const remainingContent = document.createElement("div");
  remainingContent.className = "article-remaining-content";

  const allElements = Array.from(tempDiv.children);
  let pTagIndex = 0;

  for (const element of allElements) {
    if (element.tagName === "P") {
      pTagIndex++;

      if (pTagIndex <= 5) continue;
    }

    if (pTagIndex > 5 || element.tagName !== "P") {
      remainingContent.appendChild(element.cloneNode(true));
    }
  }

  if (remainingContent.children.length > 0) {
    const parent = contentContainer.parentElement;
    if (parent) {
      if (contentContainer.nextSibling) {
        parent.insertBefore(remainingContent, contentContainer.nextSibling);
      } else {
        parent.appendChild(remainingContent);
      }
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
          if (
            window.healthNewsApp &&
            window.healthNewsApp.articles.length > 0
          ) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    if (
      window.healthNewsApp &&
      typeof window.healthNewsApp.renderRecommendedArticles === "function"
    ) {
      window.healthNewsApp.renderRecommendedArticles(currentArticleId);
    }
  } catch (error) {}
}


function replaceImageUrls(htmlContent, articleId) {
  if (!htmlContent || !articleId) {
    return htmlContent;
  }

  return htmlContent.replace(
    /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
    (match, before, src, after) => {
      if (src.startsWith("http://") || src.startsWith("https://")) {
        return match;
      }

      const fileName = src.split("/").pop();

      const newSrc = IMG_BASE_URL.replace("/number/", `/${articleId}/`).replace(
        "number.png",
        fileName
      );

      return `<img${before}src="${newSrc}"${after}>`;
    }
  );
}






document.addEventListener("DOMContentLoaded", () => {
  
  if (!window.healthNewsApp) {
    
    setTimeout(() => {
      initDetailPage();
    }, 100);
  } else {
    initDetailPage();
  }

  
  setTimeout(() => {
    if (window.BackToTop) {
      new window.BackToTop();
    }
  }, 100);
});

