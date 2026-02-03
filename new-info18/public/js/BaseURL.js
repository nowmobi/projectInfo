// Base URL for all API requests and images
export const BASE_URL = "https://news-api.szwyi.com/api/compatible";

export const IMG_BASE_URL = BASE_URL;
export const Category_URL = `${BASE_URL}/finance_info/db.json?num=2&thirdCategoryIds=6700,6701,2225,6703,6704,6705,2226`;

export function getDataBaseUrl() {
  return BASE_URL;
}

export function getImgUrl(article) {
  return article.img || '';
}

export function getArticleDetailUrl(articleId) {
  return `${BASE_URL}/${articleId}/finance_info/data.json`;
}
