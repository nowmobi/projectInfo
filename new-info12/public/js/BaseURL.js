export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=6637,6638,6640,2087,2090,2091,2087";



export async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: The server took too long to respond');
    }
    throw error;
  }
}

export async function getCategoryOrder() {
  try {
    const response = await fetchWithTimeout(Category_URL, {}, 10000);
    if (!response.ok) {
      throw new Error(`Failed to fetch category order: ${response.status}`);
    }
    const data = await response.json();

    
    if (Array.isArray(data) && data.length > 0 && data[0]) {
      if (data[0].info1 && Array.isArray(data[0].info1)) {
        return data[0].info1;
      }
      if (data[0].info2 && Array.isArray(data[0].info2)) {
        return data[0].info2;
      }
    }

    return DEFAULT_CATEGORY_ORDER;
  } catch (error) {
    return DEFAULT_CATEGORY_ORDER;
  }
}

export function getDataBaseUrl() {
  const url = Category_URL.split('?')[0];
  return url.replace('/finance_info/db.json', '');
}


export function getDetailApiUrl(id) {
  return `${getDataBaseUrl()}/${id}/finance_info/data.json`;
}

export function getImgUrl(article) {
  
  if (article.img) {
    const imgUrl = String(article.img).trim();
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      return imgUrl;
    }
  }
 
  const baseUrl = getDataBaseUrl();

  if (!article.img) {
    return `${baseUrl}/${article.id}/1.png`;
  }

  
  let imgFileName = String(article.img).trim();
  if (imgFileName.includes("/")) {
    imgFileName = imgFileName.split("/").pop();
  }

  return `${baseUrl}/${article.id}/${imgFileName}`;
}
