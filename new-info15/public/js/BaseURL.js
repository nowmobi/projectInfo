export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=6637,6638,6640,2087,2090,2091,2088";

export async function getCategoryOrder() {
  try {
    const data = await (await fetch(Category_URL)).json();
    return data?.[0]?.info1 || [];
  } catch {
    return [];
  }
}

export function getDataBaseUrl() {
  const url = new URL(Category_URL);
  let pathname = url.pathname.replace('/db.json', '');
  const parts = pathname.split('/');
  if (parts[parts.length - 1] === getResourcePath()) {
    parts.pop();
  }
  return `${url.origin}${parts.join('/')}`;
}

export function getResourcePath() {
  const url = new URL(Category_URL);
  const pathname = url.pathname.replace('/db.json', '');
  const parts = pathname.split('/');
  return parts[parts.length - 1];
}

export function getImgUrl(article) {
  if (article.img?.startsWith('http')) return article.img;
  const baseUrl = getDataBaseUrl();
  const imgFileName = article.img?.split('/').pop() || '1.png';
  return `${baseUrl}/${article.id}/${imgFileName}`;
}
