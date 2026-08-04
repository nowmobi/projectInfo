// Base URL for all API requests and images
export const BASE_URL = "https://api.oppressedness.com/api/compatible";

export const IMG_BASE_URL = BASE_URL;
export const Category_URL = `${BASE_URL}/finance_info/dynamic-db.json?num=40&thirdCategoryIds=2643,2645,2646,2649,2650,2651,2652&created_at=2026-8-4`;

export function getDataBaseUrl() {
  return BASE_URL;
}

export function getImgUrl(article) {
  return article.img || '';
}

export function getArticleDetailUrl(articleId) {
  return `${BASE_URL}/${articleId}/finance_info/dynamic-data.json`;
}
