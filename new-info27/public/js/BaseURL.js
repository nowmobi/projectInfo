export const IMG_BASE_URL =
  "https://news-api.szwyi.com";
export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=2225,2226,2227,2228,2229,2230,2231&created_at=2026-3-25";



let cachedData = null;
let dataFetchPromise = null;


export async function fetchData() {
  
  if (cachedData) {
    return cachedData;
  }
  
  
  if (dataFetchPromise) {
    return dataFetchPromise;
  }
  
  
  dataFetchPromise = fetch(Category_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      
      cachedData = data;
      return data;
    })
    .catch(error => {
      
      throw error;
    })
    .finally(() => {
      
      dataFetchPromise = null;
    });
  
  return dataFetchPromise;
}

export async function getCategoryOrder() {
  try {
    const data = await fetchData();

    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].classification_group) {
      return data[0].classification_group.map(item => item.classification);
    }

    return [];
  } catch (error) {
    return [];
  }
}

const API_BASE_URL = "https://news-api.szwyi.com/api/compatible";

export function getDetailApiUrl(articleId) {
  
  return `${API_BASE_URL}/${articleId}/finance_info/data.json`;
}

export function getImgUrl(article) {
  
  if (article.img) {
    return article.img;
  }
  
  return "";
}
