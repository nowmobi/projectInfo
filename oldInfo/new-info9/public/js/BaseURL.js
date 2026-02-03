// 基础URL配置
const REMOTE_DATA_BASE_URL = "https://info-6ke.pages.dev/healths";
const REMOTE_DB_URL = `${REMOTE_DATA_BASE_URL}/db.json`;
const IMG_BASE_URL = "https://info-6ke.pages.dev/healths";
// inpublic.js 使用的配置
const DATA_BASE_URL = "https://info-6ke.pages.dev/healths";
const DataConfig = {
  baseUrl: DATA_BASE_URL,
  dbUrl: `${DATA_BASE_URL}/db.json`,
};

async function getCategoryOrder() {
  const response = await fetch(DataConfig.dbUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch category order: ${response.status}`);
  }
  const data = await response.json();

  if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
    console.log("Fetched category order:", data[0].info1);
    return data[0].info1;
  }
}

// 导出到全局对象
window.DataConfig = DataConfig;
window.getCategoryOrder = getCategoryOrder;
window.IMG_BASE_URL = IMG_BASE_URL;
window.REMOTE_DATA_BASE_URL = REMOTE_DATA_BASE_URL;
