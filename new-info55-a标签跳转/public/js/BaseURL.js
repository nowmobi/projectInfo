export const Category_URL = "https://api.cabledfluting.com/api/compatible/finance_info/dynamic-db.json?num=40&thirdCategoryIds=2234,2235,2236,2237,2238,2239,2240&created_at=2026-8-13";
export const Detail_BASE_URL = "https://api.cabledfluting.com/api/compatible";
export const DETAIL_PATH = "finance_info";


const cache = { dbData: null, categoryOrder: null }, promises = {};


export async function getDbData(large = false) {
  if (cache.dbData) return cache.dbData;
  if (promises.dbData) return promises.dbData;
  
  promises.dbData = (async () => {
    try {
      const url = large ? Category_URL.replace(/num=\d+/, 'num=1000') : Category_URL;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Failed: ${res.status}`);
      }
      
      const data = await res.json();
      cache.dbData = data;
      delete promises.dbData;
      return data;
    } catch (e) {
      delete promises.dbData;
      return Promise.reject(e);
    }
  })();
  
  return promises.dbData;
}


export async function getCategoryOrder() {
  if (cache.categoryOrder) return cache.categoryOrder;
  
  
  const process = (cats) => cache.categoryOrder = typeof cats[0] === "object" && cats[0].name 
    ? cats : cats.map((n, i) => ({ name: n, layout: i % 2 ? "grid" : "list" }));
  
  
  if (window.healthNewsApp?.articles?.length && window.healthNewsApp.articles[0]?.info1) {
    return process(window.healthNewsApp.articles[0].info1);
  }
  
  try {
    const data = await getDbData();
    if (Array.isArray(data) && data.length && data[0]?.info1) {
      return process(data[0].info1);
    }
  } catch (e) {
    console.error("Error fetching category order:", e);
  }
  
  
  return cache.categoryOrder = [];
}
