export const Category_URL = "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=20&thirdCategoryIds=6637,6638,6640,2087,2090,2091,2087";


const cache = {
  category: null,
  categoryPromise: null,
  articles: new Map(),
  articlePromises: new Map()
};


export function getDataBaseUrl() {
  try {
    const url = new URL(Category_URL);
    url.pathname = url.pathname.substring(0, url.pathname.lastIndexOf('/'));
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return Category_URL.replace('/db.json', '').split('?')[0];
  }
}


export function getArticleDetailUrl(articleId) {
  if (!articleId) return '';
  try {
    const url = new URL(Category_URL);
    const basePath = url.pathname.split('/').slice(0, 3).join('/');
    url.pathname = `${basePath}/${articleId}/finance_info/data.json`;
    url.search = '';
    return url.toString();
  } catch {
    const baseUrl = Category_URL.split('/finance_info/')[0];
    return `${baseUrl}/${articleId}/finance_info/data.json`;
  }
}


export function getImgUrl(article) {
  if (!article?.id) return '';
  if (article.img?.startsWith('http://') || article.img?.startsWith('https://')) {
    return article.img;
  }
  const baseUrl = getDataBaseUrl();
  const imgFileName = article.img?.includes('/') 
    ? article.img.split('/').pop() 
    : (article.img || '1.png');
  return `${baseUrl}/${article.id}/${imgFileName}`;
}


export async function fetchCategoryData() {
  if (cache.categoryPromise) return cache.categoryPromise;
  if (cache.category) return cache.category;

  cache.categoryPromise = (async () => {
    try {
      const response = await fetch(Category_URL);
      if (!response.ok) throw new Error(`Failed to fetch category data: ${response.status}`);
      const data = await response.json();
      cache.category = data;
      cache.categoryPromise = null;
      return data;
    } catch (error) {
      cache.categoryPromise = null;
      throw error;
    }
  })();

  return cache.categoryPromise;
}


export async function getCategoryOrder() {
  try {
    const data = await fetchCategoryData();
    if (Array.isArray(data) && data.length > 0 && data[0]?.info1) {
      return data[0].info1;
    }
  } catch {}
  return [];
}


export async function fetchArticleDetail(articleId) {
  if (!articleId) throw new Error('Article ID is required');
  if (cache.articlePromises.has(articleId)) return cache.articlePromises.get(articleId);
  if (cache.articles.has(articleId)) return cache.articles.get(articleId);

  const promise = (async () => {
    try {
      const response = await fetch(getArticleDetailUrl(articleId));
      if (!response.ok) throw new Error(`Failed to fetch article detail: ${response.status}`);
      const data = await response.json();
      cache.articles.set(articleId, data);
      cache.articlePromises.delete(articleId);
      return data;
    } catch (error) {
      cache.articlePromises.delete(articleId);
      throw error;
    }
  })();

  cache.articlePromises.set(articleId, promise);
  return promise;
}
