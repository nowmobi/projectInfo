export const BASE_URL =
  "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=2248,2249,2251,2254,2255,2231,2230";
export const IMG_BASE_URL =
  "https://info-6ke.pages.dev/finace/number/number.png";
export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=2248,2249,2251,2254,2255,2231,2230";

export function getCategoryOrder(data) {
  try {
    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
      return data[0].info1;
    }

    return [
      "Mental Health",
      "Medical Care",
      "Lifestyle",
      "Emergency & Safety",
      "Beauty & Wellness",
      "Health Management",
    ];
  } catch (error) {
    return [
      "Mental Health",
      "Medical Care",
      "Lifestyle",
      "Emergency & Safety",
      "Beauty & Wellness",
      "Health Management",
    ];
  }
}


export function getDataBaseUrl() {
  return "https://news-api.szwyi.com/api/compatible";
}

export function getDetailBaseUrl() {
  return "https://news-api.szwyi.com/api/compatible";
}

export function getDetailApiPath() {
  return "finance_info";
}

export function getImgUrl(article) {
 
  if (!article.img) {
    return "https://news-api.szwyi.com/finance_info_img/default.png";
  }

 
  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
   
    imgFileName = imgFileName.split("/").pop();
  }

  return `https://news-api.szwyi.com/finance_info_img/${imgFileName}`;
}
