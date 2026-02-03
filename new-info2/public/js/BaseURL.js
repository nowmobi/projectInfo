
export const BASE_URL = "https://news-api.szwyi.com/api/compatible";
export const ARTICLE_PATH = "finance_info";
export const Category_URL = `${BASE_URL}/${ARTICLE_PATH}/db.json?num=20&thirdCategoryIds=2248,2249,2251,2254,2255,2231,2230`;


export async function getCategoryOrder() {
  try {
    const response = await fetch(Category_URL);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    const data = await response.json();
    const categorySet = new Set();
    let articles = [];
    if (Array.isArray(data)) {
      articles = data;
    } else {
      articles = data.info1 || data.data || data.list || data.result || data.articles || [];
   
      if (!Array.isArray(articles)) articles = [];
    }

    articles.forEach(article => {
      const category = article.type || article.category || article.typeName || article.categoryName;
      if (category) categorySet.add(category);
    });
    
    return Array.from(categorySet);
  } catch {
    return [];
  }
}
