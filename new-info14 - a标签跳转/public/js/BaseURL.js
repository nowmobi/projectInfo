export const Category_URL = "https://api.roaddivider.cloud/api/compatible/finance_info/dynamic-db.json?num=40&thirdCategoryIds=6687,6688,6689,6691,6692,6693,6694&random=0&created_at=2026-8-12";
export const DETAIL_PATH = "finance_info";

export function getDataBaseUrl() {
  const url = new URL(Category_URL);
  return `${url.protocol}//${url.host}${url.pathname.split('/').slice(0, -2).join('/')}`;
}

export function getDetailUrl(articleId) {
  const baseUrl = getDataBaseUrl();
  return `${baseUrl}/${articleId}/${DETAIL_PATH}/dynamic-data.json`;
}

export function getImgUrl(article) {

  if (article.img) {
    return article.img;
  }

  const baseUrl = getDataBaseUrl();
  return `${baseUrl}/${article.id}/1.png`;
}
