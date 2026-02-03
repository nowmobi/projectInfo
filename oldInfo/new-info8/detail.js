// 导入 BaseURL 配置
import {
  BASE_URL,
  Category_URL,
  IMG_BASE_URL,
  getCategoryOrder,
} from "./BaseURL.js";
// 通用侧边栏初始化函数
function initCommonSidebar() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const dropdownClose = document.getElementById("dropdownClose");

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", (e) => {
      e.preventDefault();
      openDropdown();
    });
  }

  if (dropdownClose) {
    dropdownClose.addEventListener("click", () => {
      closeDropdown();
    });
  }

  // 绑定下拉抽屉导航事件
  if (window.healthNewsApp) {
    window.healthNewsApp.bindDropdownNavigation();
  }
}

function openDropdown() {
  const dropdownMenu = document.getElementById("dropdownMenu");
  if (dropdownMenu) {
    dropdownMenu.classList.add("active");
    // 强制设置样式确保可见
    dropdownMenu.style.top = "60px";
    dropdownMenu.style.display = "block";
    dropdownMenu.style.visibility = "visible";
    document.body.style.overflow = "hidden";
  } else {
  }
  if (window.healthNewsApp) {
    window.healthNewsApp.bindEscToClose();
  }
}

function closeDropdown() {
  const dropdownMenu = document.getElementById("dropdownMenu");
  if (dropdownMenu) {
    dropdownMenu.classList.remove("active");
    // 重置内联样式
    dropdownMenu.style.top = "";
    dropdownMenu.style.display = "";
    dropdownMenu.style.visibility = "";
    document.body.style.overflow = "";
  }
  if (window.healthNewsApp) {
    window.healthNewsApp.unbindEscToClose();
  }
}

// 详情页特定脚本
class ArticleDetailPage {
  constructor() {
    this.articleId = this.getUrlParam("id");

    // 如果没有指定ID，生成一个有效的随机ID
    if (!this.articleId) {
      this.articleId = this.generateRandomArticleId();
    }

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
      // 先从 db.json 获取文章基本信息
      const dbResponse = await fetch(Category_URL);
      if (!dbResponse.ok) {
        throw new Error(`Failed to load db.json: ${dbResponse.status}`);
      }

      const dbData = await dbResponse.json();

      // === 详细调试信息 ===

      const dbArticle = dbData.find((a) => a.id == this.articleId);

      // 然后从单独的 data.json 文件获取详细内容
      try {
        const detailUrl = BASE_URL.replace("/number/", `/${this.articleId}/`);
        const detailResponse = await fetch(detailUrl);

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();

          // 合并基本信息和详细内容
          const fullArticle = { ...dbArticle, ...detailData };

          this.renderArticle(fullArticle);
        } else {
          // 如果详细内容加载失败，使用基本信息
          this.renderArticle(dbArticle);
        }
      } catch (detailError) {
        // 如果详细内容加载出错，使用基本信息
        this.renderArticle(dbArticle);
      }

      this.renderRecommendedArticles();
    } catch (error) {
      this.showError("Failed to Load Article: " + error.message);
    }
  }

  renderArticle(article) {
    if (!article) {
      console.error("article 对象为空！");
      return;
    }
    // 设置页面标题
    document.title = `${article.title} - Health News`;

    // 渲染文章标题
    document.getElementById("articleTitle").textContent = article.title;

    // 渲染文章元信息
    const articleType = document.getElementById("articleType");
    if (article.type) {
      articleType.textContent = article.type;
    } else {
      articleType.textContent = "-";
    }

    const articleTime = document.getElementById("articleTime");
    if (article.create_time) {
      articleTime.textContent = this.formatTime(article.create_time);
    } else {
      articleTime.textContent = "-";
    }

    // 渲染文章摘要section
    const articleSection = document.getElementById("articleSection");
    // const sectionText = document.getElementById("sectionText");
    // if (article.section) {
    //   sectionText.textContent = article.section;
    //   articleSection.style.display = "block";
    // } else {
    //   articleSection.style.display = "none";
    // }

    // 渲染文章内容
    this.renderArticleContent(article);
  }

  renderArticleContent(article) {
    const contentContainer = document.getElementById("articleContent");

    // 隐藏文章头部图片，只保留内容中的图片
    const articleImageContainer = document.getElementById("articleImage");
    if (articleImageContainer) {
      articleImageContainer.style.display = "none";
    }

    // 渲染db.json的完整内容
    if (article.content && Array.isArray(article.content)) {
      // 处理HTML内容
      const htmlContent = article.content
        .map((contentItem) => {
          return contentItem;
        })
        .join("");

      // 隐藏加载状态
      const loading = contentContainer.querySelector(".loading");
      if (loading) {
        loading.style.display = "none";
      }

      // 解析HTML内容并分配到article-item中
      this.distributeContentToArticleItems(contentContainer, htmlContent);

      // 为表格添加响应式包装器
      this.wrapTablesResponsive(contentContainer);
    } else if (article.section) {
      // 如果有section字段，使用section作为内容
      contentContainer.innerHTML = `
                        <p>${article.section}</p>
                    `;
    } else {
      contentContainer.innerHTML = "<p>Content not available</p>";
    }
  }

  // 将内容分配到article-item容器中
  distributeContentToArticleItems(contentContainer, htmlContent) {
    // 创建临时容器来解析HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // 提取所有图片元素及其位置
    const images = this.extractImages(tempDiv);

    // 直接从tempDiv提取完整的纯文本内容，不区分单个还是多个元素
    let fullText = this.extractFullText(tempDiv);

    if (!fullText || fullText.trim().length === 0) {
      contentContainer.innerHTML = htmlContent;
      return;
    }

    // 按句号分割文本成句子数组
    // 匹配句号（包括 . ! ? 。！？等），同时捕获末尾没有标点的文本
    let sentences = fullText.match(/[^.!?。！？]+[.!?。！？]+/g) || [];

    // 检查是否有末尾未被匹配的文本（没有句号结尾的部分）
    const matchedText = sentences.join("");
    if (matchedText.length < fullText.length) {
      const remainingText = fullText.substring(matchedText.length).trim();
      if (remainingText.length > 0) {
        sentences.push(remainingText);
      }
    }

    // 如果没有匹配到任何句子，使用整个文本
    if (sentences.length === 0) {
      sentences = [fullText];
    }

    // 将句子按照字符数分配到5个段落：第一个300字符，后面每个500字符
    // 但是在目标字符数附近按句号分割
    const maxChunks = 5;
    const processedParagraphs = [];
    let sentenceIndex = 0;
    let usedTextLength = 0;

    for (let i = 0; i < maxChunks && sentenceIndex < sentences.length; i++) {
      // 第一个段落目标300字符，后面的段落目标500字符
      const targetLength = i === 0 ? 300 : 500;

      let currentLength = 0;
      let paragraphSentences = [];

      // 累加句子直到接近或超过目标长度
      while (sentenceIndex < sentences.length) {
        const sentence = sentences[sentenceIndex];
        const sentenceLength = sentence.length;

        // 如果是第一句，或者加上这句不会超过目标太多，就加进来
        if (
          paragraphSentences.length === 0 ||
          currentLength + sentenceLength <= targetLength * 1.2
        ) {
          paragraphSentences.push(sentence);
          currentLength += sentenceLength;
          sentenceIndex++;

          // 如果已经达到或超过目标长度，就停止
          if (currentLength >= targetLength) {
            break;
          }
        } else {
          // 加上这句会超过太多，停止
          break;
        }
      }

      // 如果没有句子了，退出
      if (paragraphSentences.length === 0) break;

      const paragraphText = paragraphSentences.join(" ").trim();
      if (paragraphText.length > 0) {
        const p = document.createElement("p");
        p.textContent = paragraphText;
        processedParagraphs.push(p);
        usedTextLength += currentLength;
      }
    }

    // 打印每个段落的内容预览
    processedParagraphs.forEach((p, index) => {});

    // 处理剩余句子：如果还有剩余句子，创建新的P标签元素

    const remainingElements = [];
    if (sentenceIndex < sentences.length) {
      // 将剩余句子每3-5句组成一个段落
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

    // 将图片与相邻的P标签组合
    const finalChunks = this.combineImagesWithParagraphs(
      processedParagraphs,
      images
    );

    finalChunks.forEach((chunk, index) => {
      chunk.elements.forEach((el, elIndex) => {});
    });

    // 获取现有的article-item容器
    const articleItems = Array.from(
      contentContainer.querySelectorAll(".article-item")
    );

    // 使用所有可用的容器
    const maxContainers = articleItems.length;

    // 将最终的内容块插入到article-item中
    for (let i = 0; i < maxContainers && i < finalChunks.length; i++) {
      articleItems[i].innerHTML = ""; // 清空原有内容

      finalChunks[i].elements.forEach((element, elIndex) => {
        articleItems[i].appendChild(element);
      });
    }

    // 将剩余元素放入后续的article-item容器中
    if (remainingElements.length > 0) {
      let containerIndex = finalChunks.length; // 从 finalChunks 之后的容器开始
      let elementIndex = 0;

      while (
        elementIndex < remainingElements.length &&
        containerIndex < articleItems.length
      ) {
        // 清空容器
        articleItems[containerIndex].innerHTML = "";

        // 将一个或多个剩余元素放入当前容器
        // 每个容器放1个段落
        if (elementIndex < remainingElements.length) {
          articleItems[containerIndex].appendChild(
            remainingElements[elementIndex]
          );

          elementIndex++;
        }

        containerIndex++;
      }

      // 如果还有剩余元素但容器不够，将它们追加到最后一个容器
      if (elementIndex < remainingElements.length) {
        const lastContainer = articleItems[articleItems.length - 1];
        while (elementIndex < remainingElements.length) {
          lastContainer.appendChild(remainingElements[elementIndex]);
          elementIndex++;
        }
      }
    }

    // 最终统计
    let totalContentLength = 0;
    articleItems.forEach((item, idx) => {
      const content = item.textContent || "";
      if (content.trim().length > 0) {
        totalContentLength += content.length;
      }
    });
  }

  // 提取整篇文章的纯文本内容
  extractFullText(htmlElement) {
    let text = "";

    function extractText(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName !== "IMG"
      ) {
        // 在块级元素前后添加空格，但跳过图片
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

  // 按句号分割文本
  splitTextBySentence(text, maxLength) {
    if (text.length <= maxLength) {
      return { chunk: text, remaining: "" };
    }

    // 查找句号位置（支持中英文句号和其他标点）
    const sentenceEndRegex = /[。\.!?！？]/g;
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

  // 提取所有图片元素（只返回第一张）
  extractImages(htmlElement) {
    const images = [];
    const imgElements = htmlElement.querySelectorAll("img");

    // 只处理第一张图片，其余过滤掉
    if (imgElements.length > 0) {
      const img = imgElements[0];
      const clonedImg = img.cloneNode(true);

      // 将图片路径转换为远程地址
      const imgSrc = clonedImg.getAttribute("src");
      if (
        imgSrc &&
        !imgSrc.startsWith("http://") &&
        !imgSrc.startsWith("https://")
      ) {
        // 如果是相对路径，使用 IMG_BASE_URL 构建完整路径
        if (this.articleId && IMG_BASE_URL) {
          // 提取图片文件名
          const imgFileName = imgSrc.split("/").pop();
          // 使用 IMG_BASE_URL 替换
          const remoteImgUrl = IMG_BASE_URL.replace(
            "/number/",
            `/${this.articleId}/`
          ).replace("number.png", imgFileName);
          clonedImg.setAttribute("src", remoteImgUrl);
        }
      }

      images.push({
        element: clonedImg,
        originalIndex: 0,
      });
    }

    return images;
  }

  // 将文本分割成指定长度的P标签
  splitTextIntoParagraphs(text, minLength = 270, maxLength = 300) {
    const paragraphs = [];
    let currentText = text;

    while (currentText.length > 0) {
      if (currentText.length <= maxLength) {
        // 剩余文本不超过最大长度，直接作为最后一段
        if (currentText.trim()) {
          const p = document.createElement("p");
          p.textContent = currentText.trim();
          paragraphs.push(p);
        }
        break;
      }

      // 寻找合适的分割点
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

  // 寻找最佳分割点（在标点符号后）
  findBestSplitPoint(text, minLength, maxLength) {
    const punctuationRegex = /[。！？；，、：\.\!\?\;\,]/;

    if (text.length <= maxLength) {
      return { beforeSplit: text, afterSplit: "" };
    }

    // 在minLength到maxLength范围内寻找最后一个标点符号
    let bestSplitIndex = -1;
    for (
      let i = Math.min(maxLength - 1, text.length - 1);
      i >= minLength;
      i--
    ) {
      if (punctuationRegex.test(text[i])) {
        bestSplitIndex = i + 1; // 在标点符号之后分割
        break;
      }
    }

    if (bestSplitIndex > 0) {
      return {
        beforeSplit: text.substring(0, bestSplitIndex),
        afterSplit: text.substring(bestSplitIndex),
      };
    } else {
      // 如果没有找到合适的标点符号，在maxLength处强制分割
      return {
        beforeSplit: text.substring(0, maxLength),
        afterSplit: text.substring(maxLength),
      };
    }
  }

  // 寻找最佳句子结束位置（按句号分割）
  findBestSentenceEnd(text, targetLength) {
    // 如果文本本身就小于等于目标长度，直接返回全部
    if (text.length <= targetLength) {
      return text.length;
    }

    // 在目标长度附近寻找句号（在target前后100字符范围内）
    const searchStart = Math.max(0, targetLength - 100);
    const searchEnd = Math.min(text.length, targetLength + 100);

    // 常见缩写列表（不应在此处分割）
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

    // 优先寻找最接近targetLength的句号
    let bestPosition = -1;
    let minDistance = Infinity;

    for (let i = searchStart; i < searchEnd; i++) {
      if (text[i] === "。" || text[i] === ".") {
        // 检查是否是缩写
        let isAbbreviation = false;
        for (const abbr of abbreviations) {
          const startPos = i - abbr.length + 1;
          if (startPos >= 0 && text.substring(startPos, i + 1) === abbr) {
            isAbbreviation = true;
            break;
          }
        }

        if (isAbbreviation) {
          continue; // 跳过缩写
        }

        // 检查句号是否在括号内部
        let parenthesisDepth = 0;
        for (let j = 0; j < i; j++) {
          if (text[j] === "(") parenthesisDepth++;
          if (text[j] === ")") parenthesisDepth--;
        }

        if (parenthesisDepth > 0) {
          continue; // 句号在括号内部，跳过
        }

        const distance = Math.abs(i + 1 - targetLength);
        if (distance < minDistance) {
          minDistance = distance;
          bestPosition = i + 1;
        }
      }
    }

    // 如果找到了句号，使用它
    if (bestPosition > 0) {
      return bestPosition;
    }

    // 如果没找到句号，在targetLength处强制分割
    return targetLength;
  }

  // 将图片与第一个P标签组合，其他P标签单独成块
  combineImagesWithParagraphs(paragraphs, images) {
    const chunks = [];

    paragraphs.forEach((paragraph, index) => {
      if (index === 0) {
        // 第一个P标签与第一张图片放在第一个容器中，图片在前
        const firstChunk = { elements: [] };

        // 只添加第一张图片到第一个块
        if (images.length > 0) {
          firstChunk.elements.push(images[0].element);
        }

        // 然后添加第一个P标签
        firstChunk.elements.push(paragraph);

        chunks.push(firstChunk);
      } else {
        // 其他P标签各自单独成块
        chunks.push({
          elements: [paragraph],
        });
      }
    });

    return chunks;
  }

  // 提取混合内容（文本和图片）
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
          // 保留图片元素
          mixedContent.push({
            type: "img",
            element: node,
            content: "", // 图片不计入字符数
          });
        } else {
          // 在某些标签前后添加分隔符
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

          // 递归处理子节点
          for (let child of node.childNodes) {
            extractContent(child);
          }

          // 在块级元素后添加分隔符
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

    // 合并相邻的文本节点并规范化空白字符
    const consolidated = [];
    for (let i = 0; i < mixedContent.length; i++) {
      const current = mixedContent[i];
      if (current.type === "text") {
        // 如果上一个也是文本，合并
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

  // 智能分割混合内容，优先在标点符号处截断
  smartSplitMixedContent(mixedContent, minLength = 270, maxLength = 300) {
    const chunks = [];
    let currentChunk = [];
    let currentTextLength = 0;

    for (let i = 0; i < mixedContent.length; i++) {
      const item = mixedContent[i];

      if (item.type === "img") {
        // 图片直接添加到当前块
        currentChunk.push(item);
      } else if (item.type === "text") {
        const text = item.content;

        // 如果当前文本加上新文本超过最大长度，需要分割
        if (
          currentTextLength + text.length > maxLength &&
          currentTextLength >= minLength
        ) {
          // 尝试在标点符号处分割当前文本
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

          // 保存当前块
          if (currentChunk.length > 0) {
            chunks.push({ content: currentChunk });
          }

          // 开始新块
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
          // 直接添加到当前块
          currentChunk.push(item);
          currentTextLength += text.length;
        }
      }
    }

    // 添加最后一个块
    if (currentChunk.length > 0) {
      chunks.push({ content: currentChunk });
    }

    return chunks;
  }

  // 在标点符号处分割文本
  splitTextAtPunctuation(text, maxLength) {
    const punctuationRegex = /[。！？；，、：\.\!\?\;\,]/;

    if (text.length <= maxLength) {
      return { beforeSplit: text, afterSplit: "" };
    }

    // 在maxLength范围内查找最后一个标点符号
    let bestSplitIndex = -1;
    for (let i = Math.min(maxLength - 1, text.length - 1); i >= 0; i--) {
      if (punctuationRegex.test(text[i])) {
        bestSplitIndex = i + 1; // 在标点符号之后截断
        break;
      }
    }

    if (bestSplitIndex > 0) {
      return {
        beforeSplit: text.substring(0, bestSplitIndex),
        afterSplit: text.substring(bestSplitIndex),
      };
    } else {
      // 如果没有找到标点符号，在maxLength处强制分割
      return {
        beforeSplit: text.substring(0, maxLength),
        afterSplit: text.substring(maxLength),
      };
    }
  }

  // 为表格添加响应式包装器
  wrapTablesResponsive(container) {
    const tables = container.querySelectorAll("table");
    tables.forEach((table) => {
      // 检查表格是否已经被包装
      if (!table.parentElement.classList.contains("table-responsive")) {
        // 创建包装器
        const wrapper = document.createElement("div");
        wrapper.classList.add("table-responsive");

        // 将表格包装在响应式容器中
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
  }

  renderRecommendedArticles() {
    try {
      // 等待healthNewsApp初始化完成
      if (
        window.healthNewsApp &&
        window.healthNewsApp.articles &&
        window.healthNewsApp.articles.length > 0
      ) {
        this.renderDetailPageRecommendedArticles(this.articleId);
      } else {
        // 延迟重试，最多重试10次
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = 500; // 500ms

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

  // 详情页专用的推荐文章渲染（显示图片）
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

    // 绑定推荐文章点击事件
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

  // 生成有效的随机文章ID
  generateRandomArticleId() {
    // 生成1-130的随机ID
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
    // 绑定智能返回按钮
    this.bindSmartBackButton();
  }

  // 绑定智能返回按钮
  bindSmartBackButton() {
    const backButton = document.getElementById("smartBackButton");
    if (backButton) {
      backButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSmartBack();
      });
    }
  }

  // 智能返回逻辑
  handleSmartBack() {
    const referrer = document.referrer;
    const currentUrl = window.location.href;

    // 检查是否从分类页面来的
    if (referrer.includes("category.html")) {
      // 从分类页面来的，返回到分类页面
      window.location.href = referrer;
      return;
    }

    // 检查是否从首页来的
    if (
      referrer.includes("index.html") ||
      referrer.includes("localhost") ||
      referrer.includes("127.0.0.1")
    ) {
      // 从首页来的，返回到首页
      window.location.href =
        "index.html?fromDetail=true" +
        (window.channel ? `&channel=${window.channel}` : "");
      return;
    }

    // 检查URL参数，看是否有来源信息
    const urlParams = new URLSearchParams(currentUrl);
    const fromPage = urlParams.get("from");

    if (fromPage === "category") {
      // 从分类页面来的，返回到分类页面
      window.location.href =
        "pages/category.html" +
        (window.channel ? `?channel=${window.channel}` : "");
      return;
    }

    // 默认返回首页
    window.location.href =
      "index.html?fromDetail=true" +
      (window.channel ? `&channel=${window.channel}` : "");
  }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  // 初始化侧边栏功能
  initCommonSidebar();

  // 初始化详情页功能
  new ArticleDetailPage();
});
