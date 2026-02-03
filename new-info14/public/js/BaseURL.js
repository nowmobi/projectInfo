export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=6637,6638,6640,2087,2090,2091,2087";
export const DETAIL_PATH = "finance_info";

export function getDataBaseUrl() {
  const url = new URL(Category_URL);
  return `${url.protocol}//${url.host}${url.pathname.split('/').slice(0, -2).join('/')}`;
}

export function getDetailUrl(articleId) {
  const baseUrl = getDataBaseUrl();
  return `${baseUrl}/${articleId}/${DETAIL_PATH}/data.json`;
}

export function getImgUrl(article) {

  if (article.img) {
    return article.img;
  }

  const baseUrl = getDataBaseUrl();
  return `${baseUrl}/${article.id}/1.png`;
}
