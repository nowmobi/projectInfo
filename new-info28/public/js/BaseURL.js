export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=2248,2249,2251,2254,2255,2231,2230";
export const DETAIL_PATH = "finance_info";

let categoryOrderCache = null;
let categoryOrderPromise = null;
let dbDataCache = null;
let dbDataPromise = null;

export async function getCategoryOrder() {
  if (categoryOrderCache !== null) {
    return categoryOrderCache;
  }

  if (categoryOrderPromise !== null) {
    return categoryOrderPromise;
  }

  categoryOrderPromise = (async () => {
    try {
      const data = await fetchDbData();

      let result;
      if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
        result = data[0].info1;
      } else {
        result = [
          "Freelancer-Contractor_Services",
          "Field_Service_Companies",
          "Investment_Services",
          "Commercial_Lending",
          "Computer_Financing",
          "Venture_Capital",
          "Holding_Companies",
        ];
      }

      categoryOrderCache = result;
      return result;
    } catch (error) {
      const result = [
        "Freelancer-Contractor_Services",
        "Field_Service_Companies",
        "Investment_Services",
        "Commercial_Lending",
        "Computer_Financing",
        "Venture_Capital",
        "Holding_Companies",
      ];
      categoryOrderCache = result;
      return result;
    }
  })();

  return categoryOrderPromise;
}

export async function fetchDbData() {
  if (dbDataCache !== null) {
    return dbDataCache;
  }

  if (dbDataPromise !== null) {
    return dbDataPromise;
  }

  dbDataPromise = (async () => {
    try {
      const response = await fetch(Category_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch db data: ${response.status}`);
      }
      const data = await response.json();
      dbDataCache = data;
      return data;
    } catch (error) {
      console.error('Error fetching db data:', error);
      throw error;
    }
  })();

  return dbDataPromise;
}


export function getDataBaseUrl() {
  return "https://news-api.szwyi.com/api/compatible/";
}

export function getImgUrl(article) {
 
  if (article.img) {
    return article.img;
  }

  return "";
}
