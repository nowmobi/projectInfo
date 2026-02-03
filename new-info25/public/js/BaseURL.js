export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=2248,2249,2251,2254,2255,2231,2230";


let categoryOrderCache = null;
let categoryOrderPromise = null;
let categoryDataCache = null;
let categoryDataPromise = null;


export async function fetchCategoryData() {
  
  if (categoryDataCache) {
    return categoryDataCache;
  }
  
  
  if (categoryDataPromise) {
    return categoryDataPromise;
  }
  
  
  categoryDataPromise = (async () => {
    try {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch category data: ${response.status}`);
      }
      const data = await response.json();
      categoryDataCache = data;
      return data;
    } catch (error) {
      console.error('Error fetching category data:', error);
      return [];
    } finally {
      
      categoryDataPromise = null;
    }
  })();
  
  return categoryDataPromise;
}

export async function getCategoryOrder() {
  
  if (categoryOrderCache) {
    return categoryOrderCache;
  }
  
  
  if (categoryOrderPromise) {
    return categoryOrderPromise;
  }
  
  
  categoryOrderPromise = (async () => {
    try {
      const data = await fetchCategoryData();

      if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
        categoryOrderCache = data[0].info1;
        return categoryOrderCache;
      }

      categoryOrderCache = [];
      return [];
    } catch (error) {
      categoryOrderCache = [];
      return [];
    } finally {
      
      categoryOrderPromise = null;
    }
  })();
  
  return categoryOrderPromise;
}


export function getDataBaseUrl() {

  return Category_URL.split('/finance_info/db.json')[0];
}

export function getArticleDetailUrl(articleId) {
  return `${getDataBaseUrl()}/${articleId}/finance_info/data.json`;
}

export function getFinanceInfoImgUrl(fileName) {
  return `https://news-api.szwyi.com/finance_info_img/${fileName}`;
}

export function getRemoteDbUrl() {
  return Category_URL;
}

export function getImgUrl(article) {
 
  if (!article) {
    return '';
  }

 
  if (!article.img) {
    return '';
  }

 
  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
   
    imgFileName = imgFileName.split("/").pop();
  }

  return getFinanceInfoImgUrl(imgFileName);
}
