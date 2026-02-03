export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=2227,2228,2229,2230,2231,2232,2233";


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
  return url.origin + url.pathname.replace('/db.json', '');
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
  const baseUrlWithoutFinanceInfo = baseUrl.replace('/finance_info', '');
  return `${baseUrlWithoutFinanceInfo}/${articleId}/finance_info/data.json`;
}
