export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=6637,6638,6640,2087,2090,2091,2087";

let dataCache = null;
let dataCachePromise = null;

export async function fetchData() {
  if (dataCache) {
    return dataCache;
  }
  if (dataCachePromise) {
    return dataCachePromise;
  }
  dataCachePromise = (async () => {
    try {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      const data = await response.json();
      dataCache = data;
      return data;
    } catch (error) {
      dataCachePromise = null;
      throw error;
    }
  })();
  return dataCachePromise;
}

export async function getCategoryOrder() {
  try {
    const data = await fetchData();
    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
      return data[0].info1;
    }
    if (Array.isArray(data) && data.length > 1) {
      const categories = new Set();
      for (let i = 1; i < data.length; i++) {
        if (data[i] && data[i].type) {
          categories.add(data[i].type);
        }
      }
      return Array.from(categories);
    }
    return [];
  } catch (error) {
    return [];
  }
}

export function getDataBaseUrl() {
  return "https://news-api.szwyi.com/api/compatible";
}

export function getFinanceInfoUrl(articleId) {
  return `${getDataBaseUrl()}/${articleId}/finance_info/data.json`;
}

export function getFinanceInfoImageUrl(articleId, imageName) {
  return `${getDataBaseUrl()}/${articleId}/finance_info/${imageName}`;
}

export function getImgUrl(article) {
  if (article.img && (article.img.startsWith('http://') || article.img.startsWith('https://'))) {
    return article.img;
  }
  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
    imgFileName = imgFileName.split("/").pop();
  }
  return getFinanceInfoImageUrl(article.id, imgFileName);
}
