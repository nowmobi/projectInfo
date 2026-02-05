export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=6637,6638,6640,2087,2090,2091,2087";


let apiDataCache = null;
let apiDataPromise = null;


export async function fetchApiData() {
  
  if (apiDataCache) {
    return apiDataCache;
  }

  
  if (apiDataPromise) {
    return apiDataPromise;
  }

  
  apiDataPromise = (async () => {
    try {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      const data = await response.json();
      apiDataCache = data;
      return data;
    } catch (error) {
      apiDataPromise = null; 
      throw error;
    }
  })();

  return apiDataPromise;
}

export async function getCategoryOrder() {
  try {
    const data = await fetchApiData();

    
    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
      return data[0].info1;
    }

    
    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info2) {
      return data[0].info2;
    }

    return [];
  } catch (error) {
    return [];
  }
}



export const API_PATH_PART = "finance_info";

export function getDataBaseUrl() {
  
  
  
  const baseUrl = Category_URL.split('/finance_info/')[0];
  return baseUrl;
}


