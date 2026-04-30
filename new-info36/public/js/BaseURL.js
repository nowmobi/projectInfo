
const baseConfig = {
  baseUrl: "https://news-api.szwyi.com/api/compatible",
  categoryUrl: "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=7162,7163,3799,3800,3801,3805,3806&created_at=2026-4-30",
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


