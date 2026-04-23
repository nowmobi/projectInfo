export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=2182,2183,2185,2187,2189,2190,2191&created_at=2026-3-25";

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
