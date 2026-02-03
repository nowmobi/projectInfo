
export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=2248,2249,2251,2254,2255,2231,2230";
export const ARTICLE_DETAIL_PATH = "finance_info/data.json";


let categoryOrderCache = null;
let articlesCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; 
let fetchPromise = null; 

export async function getCategoryOrder() {
  
  if (categoryOrderCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return categoryOrderCache;
  }

  
  if (fetchPromise) {
    
    await fetchPromise;
    if (categoryOrderCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      return categoryOrderCache;
    }
  }

  try {
    
    fetchPromise = (async () => {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch category order: ${response.status}`);
      }
      const data = await response.json();

      if (data && data.value && Array.isArray(data.value) && data.value.length > 0 && data.value[0] && data.value[0].info1) {
        categoryOrderCache = data.value[0].info1;
        articlesCache = data.value;
        cacheTimestamp = Date.now();
      } else if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
        categoryOrderCache = data[0].info1;
        articlesCache = data;
        cacheTimestamp = Date.now();
      }

      return data;
    })();

    
    await fetchPromise;

    
    return categoryOrderCache || [];
  } catch (error) {
    return [];
  } finally {
    
    fetchPromise = null;
  }
}

export async function getArticlesData() {
  if (articlesCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return articlesCache;
  }

  try {
    
    await getCategoryOrder();
    
    
    if (articlesCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      return articlesCache;
    }

    
    if (!fetchPromise) {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch articles data: ${response.status}`);
      }
      const data = await response.json();

      let articlesData = data;
      if (data && data.value && Array.isArray(data.value)) {
        articlesData = data.value;
      }

      articlesCache = articlesData;
      cacheTimestamp = Date.now();
      return articlesData;
    } else {
      
      await fetchPromise;
      if (articlesCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
        return articlesCache;
      }
      return [];
    }
  } catch (error) {
    return [];
  }
}


export function getDataBaseUrl() {
 
  const baseUrl = Category_URL.split('?')[0].replace('/db.json', '');
  return baseUrl.replace('/finance_info', '');
}

export function getImgUrl(article) {
  
  if (!article || !article.img) {
    return '';
  }

 
  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
   
    imgFileName = imgFileName.split("/").pop();
  }

  return `https://news-api.szwyi.com/finance_info_img/${imgFileName}`;
}
