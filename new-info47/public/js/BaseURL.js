
const baseConfig = {
  baseUrl: "https://news-api.szwyi.com/api/compatible",
  imageBaseUrl: "https://news-api.szwyi.com/api/compatible",
  categoryUrl: "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=3765,2138,3806,3761,3765,2138,3235&created_at=2026-5-21",
  dataUrl: "./dynamic-data.json"
};


export const remoteDataConfig = {
  baseConfig,
  
  buildArticleDetailUrl(articleId) {
    return `${baseConfig.baseUrl.replace(/\/$/, '')}/${articleId}/finance_info/dynamic-data.json`;
  },
  
  buildImageUrl(articleId, imgName) {
    if (!articleId || !imgName) return '';
    if (imgName.startsWith('http://') || imgName.startsWith('https://')) return imgName;
    const imageBase = baseConfig.imageBaseUrl || baseConfig.baseUrl;
    return `${imageBase.replace(/\/$/, '')}/${articleId}/finance_info/${imgName.replace(/^\//, '')}`;
  }
};


export const BASE_URL = baseConfig.baseUrl;
export const DATA_URL = baseConfig.dataUrl;
export const Category_URL = baseConfig.categoryUrl;


