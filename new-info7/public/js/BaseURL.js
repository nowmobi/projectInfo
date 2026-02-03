export const Detail_BASE_URL = "https://news-api.szwyi.com/api/compatible";
export const Detail_API_PATH = "finance_info/data.json";


const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=6637,6638,6640,2087,2090,2091,2087";


let cachedData = null;
let dataFetchPromise = null;


export async function getArticlesData() {
  if (cachedData) {
    return cachedData;
  }

  if (dataFetchPromise) {
    return dataFetchPromise;
  }

  dataFetchPromise = (async () => {
    try {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.status}`);
      }
      const data = await response.json();
      cachedData = data;
      return data;
    } catch (error) {
      console.error("Error fetching articles:", error);
      dataFetchPromise = null;
      return null;
    }
  })();

  return dataFetchPromise;
}

export async function getCategoryOrder() {
  try {
    const data = await getArticlesData();
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    
    if (data[0] && data[0].info1) {
      return data[0].info1;
    }

    
    const articles = data.filter(item => item && item.id && item.title);
    const typeSet = new Set();
    articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });
    return Array.from(typeSet);
  } catch (error) {
    console.error("Error fetching category order:", error);
    return [];
  }
}
