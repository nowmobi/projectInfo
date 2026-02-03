export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=6637,6638,6640,2087,2090,2091,2087";

export const Detail_API_Base = "https://news-api.szwyi.com/api/compatible";
export const Detail_API_Path = "/finance_info/data.json";

export function getDetailUrl(articleId) {
  return `${Detail_API_Base}/${articleId}${Detail_API_Path}`;
}

let categoryOrderCache = null;
let articlesCache = null;
let fetchingPromise = null;

export async function fetchCategoryData() {
  if (articlesCache !== null) {
    return articlesCache;
  }

  if (fetchingPromise) {
    return fetchingPromise;
  }

  fetchingPromise = (async () => {
    try {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch category data: ${response.status}`);
      }
      const data = await response.json();
      articlesCache = data;
      
      if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
        categoryOrderCache = data[0].info1;
      }
      
      return data;
    } catch (error) {
      return [];
    } finally {
      fetchingPromise = null;
    }
  })();

  return fetchingPromise;
}

export async function getCategoryOrder() {
  if (categoryOrderCache !== null) {
    return categoryOrderCache;
  }

  await fetchCategoryData();
  return categoryOrderCache || [];
}

export function getImgUrl(article) {
  if (!article.img) {
    return "";
  }

  const imgUrl = article.img;

  if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
    return imgUrl;
  }

  return imgUrl;
}
