
const BASE_URL = "https://news-api.szwyi.com/api/compatible";
const CONTENT_PATH = "finance_info";
const DB_URL = `${BASE_URL}/${CONTENT_PATH}/db.json?num=40&thirdCategoryIds=6866,6867,2639,2640,2089,2641,2642&created_at=2026-3-25`;


const DataConfig = {
  baseUrl: BASE_URL,
  dbUrl: DB_URL,
  contentPath: CONTENT_PATH,
};

const REMOTE_DATA_BASE_URL = BASE_URL;
const IMG_BASE_URL = BASE_URL;

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


window.DataConfig = DataConfig;
window.getCategoryOrder = getCategoryOrder;
window.IMG_BASE_URL = IMG_BASE_URL;
window.REMOTE_DATA_BASE_URL = REMOTE_DATA_BASE_URL;
