export const BASE_URL =
  "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=80&thirdCategoryIds=2243,2249,2225,2246,6704,2245,2244";
export const IMG_BASE_URL =
  "https://news-api.szwyi.com";
export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=80&thirdCategoryIds=2243,2249,2225,2246,6704,2245,2244";
export const Detail_URL = "https://news-api.szwyi.com/api/compatible";
export const Detail_Article_Path = "/finance_info/data.json";

export async function getCategoryOrder(articles) {
  try {
    
    if (Array.isArray(articles) && articles.length > 0) {
      const categorySet = new Set();
      articles.forEach(article => {
        if (article && article.type) {
          categorySet.add(article.type);
        }
      });
      return Array.from(categorySet);
    }

    
    
    return [];
  } catch (error) {
    return [];
  }
}

export function getImgUrl(article) {
  
  if (article.img) {
    return article.img;
  }
  
  return `${IMG_BASE_URL}/finance_info_img/default.png`;
}
