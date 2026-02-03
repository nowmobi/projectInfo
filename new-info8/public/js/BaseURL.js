
const DataConfig = {
  baseUrl: "https://news-api.szwyi.com/api/compatible",
  detailDataPath: "finance_info",
  dbUrl: "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=6700,6701,2225,6703,6704,6705,2226"
};


const apiCache = {
  dbData: null,
  dbDataPromise: null, 
  lastFetchTime: null
};


async function fetchDbData() {
  
  if (apiCache.dbData) {
    return apiCache.dbData;
  }
  
  
  if (apiCache.dbDataPromise) {
    return apiCache.dbDataPromise;
  }
  
  
  apiCache.dbDataPromise = (async () => {
    const response = await fetch(DataConfig.dbUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    const data = await response.json();
    
    
    apiCache.dbData = data;
    apiCache.lastFetchTime = Date.now();
    
    
    apiCache.dbDataPromise = null;
    
    return data;
  })();
  
  return apiCache.dbDataPromise;
}

async function getCategoryOrder() {
  const data = await fetchDbData();
  if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
    return data[0].info1;
  }
}

window.DataConfig = DataConfig;
window.getCategoryOrder = getCategoryOrder;
window.fetchDbData = fetchDbData;
