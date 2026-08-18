
const baseConfig = {
  baseUrl: "https://api.gloomfang.com/api/compatible",
  categoryUrl: "https://api.gloomfang.com/api/compatible/finance_info/dynamic-db.json?num=40&thirdCategoryIds=2234,2235,2236,2237,2238,2239,2240&created_at=2026-8-18",
  dataUrl: "./dynamic-data.json"
};


export const remoteDataConfig = {
  baseConfig,
  
  buildArticleDetailUrl(articleId) {
    return `${baseConfig.baseUrl.replace(/\/$/, '')}/${articleId}/finance_info/dynamic-data.json`;
  },
  
  buildImageUrl(articleId, imgName) {
    if (!imgName) return '';
    if (imgName.startsWith('http://') || imgName.startsWith('https://')) {
      return imgName;
    }
    return '';
  }
};


export const BASE_URL = baseConfig.baseUrl;
export const DATA_URL = baseConfig.dataUrl;
export const Category_URL = baseConfig.categoryUrl;


