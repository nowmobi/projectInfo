export const Category_URL = "https://api.flavescent.site/api/compatible/finance_info/dynamic-db.json?num=40&thirdCategoryIds=2243,2249,2225,2246,6704,2245,2244&created_at=2026-06-28";

export async function getCategoryOrder(data) {
  try {
    if (!data) {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch category order: ${response.status}`);
      }
      data = await response.json();
    }

    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
      return [...new Set(data[0].info1)];
    }

    return [];
  } catch (error) {
    return [];
  }
}


export function getDataBaseUrl() {
 
  const url = new URL(Category_URL);
  const pathParts = url.pathname.split('/');
 
  const categoryPart = pathParts[pathParts.length - 2];
 
  return url.origin + url.pathname.replace(`/${categoryPart}/dynamic-db.json`, '');
}

export function getImgUrl(article) {
 
 
  if (article.img && article.img.startsWith('http')) {
    return article.img;
  }

 
  const baseUrl = getDataBaseUrl();
  if (!article.img) {
    return `${baseUrl}/${article.id}/1.png`;
  }

  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
    imgFileName = imgFileName.split("/").pop();
  }

  return `${baseUrl}/${article.id}/${imgFileName}`;
}
