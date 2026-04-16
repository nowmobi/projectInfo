export const BASE_URL =
  "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=2232,2233,2234,2235,2236,2237,2238&created_at=2026-3-25";
export const IMG_BASE_URL =
  "https://info-6ke.pages.dev/finace/number/number.png";
export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=2232,2233,2234,2235,2236,2237,2238&created_at=2026-3-25";

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


  if (article.img.startsWith('http://') || article.img.startsWith('https://')) {
    return article.img;
  }

  
  return `https://news-api.szwyi.com/finance_info_img/${article.img}`;
}

