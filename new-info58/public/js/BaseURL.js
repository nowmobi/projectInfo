export const Category_URL = "https://api.meetmetaleden.com/api/compatible/finance_info/dynamic-db.json?num=40&thirdCategoryIds=7162,7163,3799,3800,3801,3805,3806,3807&created_at=";

export const Detail_URL_TEMPLATE = "https://api.meetmetaleden.com/api/compatible/{id}/finance_info/dynamic-data.json";

export const IMG_BASE_URL = "https://api.meetmetaleden.com/api/compatible/finance_info_img";


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
  return "https://api.meetmetaleden.com/api/compatible";
}

export function getImgUrl(article) {
 
 
  if (!article.img) {
    return `${IMG_BASE_URL}/${article.id}.png`;
  }

 
  if (article.img.startsWith('http://') || article.img.startsWith('https://')) {
    return article.img;
  }

 
  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
   
    imgFileName = imgFileName.split("/").pop();
  }

  return `${IMG_BASE_URL}/${imgFileName}`;
}
