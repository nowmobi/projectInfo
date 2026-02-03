
export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=2227,2228,2229,2230,2231,2232,2233";
export const ARTICLE_PATH = "finance_info";


let cache = {
  categoryOrder: null,
  articles: null,
  promise: null
};


async function fetchData() {
  try {
    const res = await fetch(Category_URL);
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    
    const data = await res.json();
    
    
    if (Array.isArray(data) && data.length > 0) {
      if (data[0]?.info1) cache.categoryOrder = data[0].info1;
      const [, ...articles] = data;
      cache.articles = articles;
    }
    
    return data;
  } catch (err) {
    console.error('Data fetch error:', err);
    cache.promise = null; 
    throw err;
  }
}


export async function getCategoryOrder() {
  if (cache.categoryOrder) return cache.categoryOrder;
  
  
  if (cache.promise) await cache.promise;
  if (cache.categoryOrder) return cache.categoryOrder;
  
  
  cache.promise = fetchData();
  
  try {
    await cache.promise;
    if (cache.categoryOrder) return cache.categoryOrder;
  } catch (err) {
    console.error('Category order fetch error:', err);
  }
  
  
  return cache.categoryOrder = [];
}


export async function getArticles() {
  if (cache.articles) return cache.articles;
  
  
  if (cache.promise) await cache.promise;
  if (cache.articles) return cache.articles;
  
  
  cache.promise = fetchData();
  
  try {
    await cache.promise;
    if (cache.articles) return cache.articles;
  } catch (err) {
    console.error('Articles fetch error:', err);
  }
  
  
  return cache.articles = [];
}


export function getDataBaseUrl() {
  return "https://news-api.szwyi.com/api/compatible";
}


export function getImgUrl(article) {
  return article.img;
}
