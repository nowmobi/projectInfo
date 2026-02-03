
const baseConfig = {
  baseUrl: "https://news-api.szwyi.com/api/compatible",
  categoryUrl: "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=2234,2235,2236,2237,2238,2239,2240",
  dataUrl: "./data.json"
};


export const remoteDataConfig = {
  baseConfig,
  
  buildArticleDetailUrl(articleId) {
    return `${baseConfig.baseUrl.replace(/\/$/, '')}/${articleId}/finance_info/data.json`;
  },
  
  buildImageUrl(articleId, imgName) {
    return !articleId || !imgName ? '' : 
           imgName.startsWith('http://') || imgName.startsWith('https://') ? imgName : '';
  }
};


export const BASE_URL = baseConfig.baseUrl;
export const DATA_URL = baseConfig.dataUrl;
export const Category_URL = baseConfig.categoryUrl;


