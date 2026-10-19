
const baseConfig = {
  baseUrl: "https://api.amortization.site/api/compatible",
  categoryUrl: "https://api.amortization.site/api/compatible/finance_info/dynamic-db.json?num=40&thirdCategoryIds=2234,2235,2236,2237&created_at=2026-9-21",
  dataUrl: "./dynamic-data.json"
};


export const remoteDataConfig = {
  baseConfig,
  
  buildArticleDetailUrl(articleId) {
    return `${baseConfig.baseUrl.replace(/\/$/, '')}/${articleId}/finance_info/dynamic-data.json`;
  },
  
  buildImageUrl(articleId, imgName) {
    return !articleId || !imgName ? '' : 
           imgName.startsWith('http://') || imgName.startsWith('https://') ? imgName : '';
  }
};


export const BASE_URL = baseConfig.baseUrl;
export const DATA_URL = baseConfig.dataUrl;
export const Category_URL = baseConfig.categoryUrl;


