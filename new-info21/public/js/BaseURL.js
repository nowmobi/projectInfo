export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=2248,2249,2251,2254,2255,2231,2230";
export const IMG_BASE_URL = "https://info-6ke.pages.dev/finace/number/number.png";


let cachedApiResponse = null;
let cachedApiResponsePromise = null;


export async function fetchAndCacheApiData() {
  if (cachedApiResponse !== null) {
    return cachedApiResponse;
  }

  if (cachedApiResponsePromise) {
    return cachedApiResponsePromise;
  }

  cachedApiResponsePromise = fetch(Category_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      cachedApiResponse = data;
      return data;
    })
    .catch(error => {
      cachedApiResponsePromise = null;
      throw error;
    });

  return cachedApiResponsePromise;
}

export async function getCategoryOrder() {
  try {
    const data = await fetchAndCacheApiData();

    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
      return data[0].info1;
    }

    return [];
  } catch (error) {
    return [];
  }
}


export function getDataBaseUrl() {
 
  const url = new URL(Category_URL);
  return url.origin + url.pathname.replace('/finance_info/db.json', '');
}

export function getImgUrl(article) {
 
  const baseUrl = getDataBaseUrl();

 
  if (!article.img) {
    return `${baseUrl}/${article.id}/1.png`;
  }

 
  if (article.img.startsWith('http://') || article.img.startsWith('https://')) {
    return article.img;
  }

 
  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
   
    imgFileName = imgFileName.split("/").pop();
  }

  return `${baseUrl}/${article.id}/${imgFileName}`;
}

export function getArticleDetailUrl(articleId) {
  const baseUrl = getDataBaseUrl();
  return `${baseUrl}/${articleId}/finance_info/data.json`;
}
