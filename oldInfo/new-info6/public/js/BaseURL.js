export const BASE_URL =
  "https://info-6ke.pages.dev/technology/number/data.json";
export const IMG_BASE_URL =
  "https://info-6ke.pages.dev/technology/number/number.png";
export const Category_URL = "https://info-6ke.pages.dev/technology/db.json";

export async function getCategoryOrder() {
  try {
    const response = await fetch(Category_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch category order: ${response.status}`);
    }
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
      // 如果返回的是对象数组（包含name和layout信息）
      if (typeof data[0].info1[0] === "object" && data[0].info1[0].name) {
        return data[0].info1;
      }
      // 如果返回的是字符串数组，转换为默认格式并交替分配布局
      const categories = data[0].info1;

      // 交替分配布局：list, grid, list, grid, list, grid...
      return categories.map((name, index) => ({
        name: name,
        layout: index % 2 === 0 ? "list" : "grid",
      }));
    }

    // 默认配置
    return [
      { name: "Mental Health", layout: "list" },
      { name: "Medical Care", layout: "grid" },
      { name: "Lifestyle", layout: "list" },
      { name: "Emergency & Safety", layout: "grid" },
      { name: "Beauty & Wellness", layout: "grid" },
      { name: "Health Management", layout: "list" },
    ];
  } catch (error) {
    console.error("Error fetching category order:", error);
    return [
      { name: "Mental Health", layout: "list" },
      { name: "Medical Care", layout: "grid" },
      { name: "Lifestyle", layout: "list" },
      { name: "Emergency & Safety", layout: "grid" },
      { name: "Beauty & Wellness", layout: "grid" },
      { name: "Health Management", layout: "list" },
    ];
  }
}
