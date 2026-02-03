
export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=6700,6701,2225,6703,6704,6705,6706";
export const Detail_BASE_URL = "https://news-api.szwyi.com/api/compatible/";
export const DETAIL_PATH = "finance_info/data.json";


let cachedArticles = null;
let cacheTimestamp = null;
let fetchPromise = null;
const CACHE_DURATION = 5 * 60 * 1000;


export async function getArticlesData() {
  const now = Date.now();
  if (cachedArticles && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) return cachedArticles;

  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await fetch(Category_URL, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Failed to fetch articles: ${response.status}`);
      const data = await response.json();
      cachedArticles = data;
      cacheTimestamp = now;
      return data;
    } catch (error) {
      if (cachedArticles) return cachedArticles;
      throw error;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export async function getCategoryOrder() {
  try {
    const data = await getArticlesData();
    if (Array.isArray(data) && data[0]?.info1) return data[0].info1;
    if (Array.isArray(data) && data.length > 0) {
      const articles = data.filter(item => item?.id && item?.title && !('info1' in item));
      if (articles.length > 0) {
        const categories = [...new Set(articles.filter(article => article.type).map(article => article.type))];
        if (categories.length > 0) return categories;
      }
    }
    return [];
  } catch (error) {
    return [];
  }
}


export function decodeUnicode(str) {
  if (!str) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = str;
  let decoded = textarea.value;
  decoded = decoded.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return decoded
    .replace(/\?nbsp;/g, " ")
    .replace(/\?lt;/g, "<")
    .replace(/\?gt;/g, ">")
    .replace(/\?amp;/g, "&")
    .replace(/\?quot;/g, '"')
    .replace(/\?39;/g, "'")
    .replace(/\?\/([a-z]+)>/gi, "</$1>")
    .replace(/\?([a-z])/gi, "<$1")
    .replace(/\?=/g, "=")
    .replace(/\?>/g, ">")
    .replace(/\?[#\/]+/g, " ")
    .replace(/[\uFFFD\uFFFE\uFEFF]/g, "");
}

export const formatTime = timestamp => new Date(timestamp * 1000).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });

export const getUrlParam = name => new URLSearchParams(window.location.search).get(name);