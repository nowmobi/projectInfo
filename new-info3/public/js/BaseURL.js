export const BASE_URL =
  "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=2248,2249,2251,2254,2255,2231,2230";
export const Category_URL = BASE_URL;


export const apiCache = {
  articles: null,
  categories: null,
  lastFetch: 0
};

// 新增：获取文章列表的函数，带缓存
export async function fetchArticlesWithCache() {
 
  const now = Date.now();
  const cacheExpiry = 5 * 60 * 1000;
  
  if (apiCache.articles && (now - apiCache.lastFetch) < cacheExpiry) {
    
    return apiCache.articles;
  }
  
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.status}`);
    }
    const data = await response.json();
    
   
    apiCache.articles = data;
    apiCache.lastFetch = now;
    
    
    return data;
  } catch (error) {
    
   
    if (apiCache.articles) {
      
      return apiCache.articles;
    }
    return [];
  }
}

export async function getCategoryOrder() {
  try {
   
    const data = await fetchArticlesWithCache();

    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
      return data[0].info1;
    }

   
    return [];
  } catch (error) {
    
   
    return [];
  }
}

export function getImgUrl(article) {
 
  if (article.img && (article.img.startsWith("http://") || article.img.startsWith("https://"))) {
    return article.img;
  }
  
 
 
  const baseUrlWithoutParams = BASE_URL.split('?')[0];
  const apiBaseUrl = baseUrlWithoutParams.replace('/db.json', '');

 
  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
   
    imgFileName = imgFileName.split("/").pop();
  }

  return `${apiBaseUrl}/${article.id}/${imgFileName}`;
}
