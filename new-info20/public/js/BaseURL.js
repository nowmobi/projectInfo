const DataConfig = {
  baseUrl: "https://news-api.szwyi.com/api/compatible/{id}/finance_info",
  removePath: "/{id}/finance_info",
  dbUrl:
    "https://news-api.szwyi.com/api/compatible/finance_info/db.json?num=40&thirdCategoryIds=6763,6764,6765,6766,5242,2412,2188&created_at=2026-3-25",
};

async function getCategoryOrder() {
  const response = await fetch(DataConfig.dbUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch category order: ${response.status}`);
  }
  const data = await response.json();

  if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
    
    return data[0].info1;
  }
}

window.DataConfig = DataConfig;
window.getCategoryOrder = getCategoryOrder;
