
const BASE_URL = "https://news-api.szwyi.com/api/compatible";
const CONTENT_PATH = "finance_info";
const DB_URL = `${BASE_URL}/${CONTENT_PATH}/db.json?num=20&thirdCategoryIds=6700,6701,2225,6703,6704,6705,2226`;


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
