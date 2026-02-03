export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=6637,6638,6640,2087,2090,2091,2088";

// Remote data configuration
export const REMOTE_DATA_CONFIG = {
  baseUrl: "https://news-api.szwyi.com/api/compatible",
  financePath: "finance_info",
  buildArticlesUrl: function(id) {
    return `${this.baseUrl}/${id}/${this.financePath}/data.json`;
  }
};

export const remoteDataConfig = REMOTE_DATA_CONFIG;

export async function getCategoryOrder(data) {
  try {
    if (!data) {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch category order: ${response.status}`);
      }
      data = await response.json();
    }

    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
      return [...new Set(data[0].info1)];
    }

    return [];
  } catch (error) {
    return [];
  }
}


export function getDataBaseUrl() {
  // Remove query parameters and file name to get base URL
  const url = new URL(Category_URL);
  return url.origin + url.pathname.replace('/finance_info/db.json', '');
}

export function getImgUrl(article) {
 
  // If article has a full img URL (starts with http), use it directly
  if (article.img && article.img.startsWith('http')) {
    return article.img;
  }

  // Fallback to the original logic for cases where img might be a relative path or missing
  const baseUrl = getDataBaseUrl();
  if (!article.img) {
    return `${baseUrl}/${article.id}/1.png`;
  }

  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
    imgFileName = imgFileName.split("/").pop();
  }

  return `${baseUrl}/${article.id}/${imgFileName}`;
}

export const IMG_BASE_URL = getDataBaseUrl();
