export const BASE_URL =
  "https://info-6ke.pages.dev/healths/number/data.json";
export const IMG_BASE_URL =
  "https://info-6ke.pages.dev/healths/number/number.png";
export const Category_URL = "https://info-6ke.pages.dev/healths/db.json";

export async function getCategoryOrder() {
  try {
    const response = await fetch(Category_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch category order: ${response.status}`);
    }
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info1) {
      return data[0].info1;
    }

    return [
      "Mental Health",
      "Medical Care",
      "Lifestyle",
      "Emergency & Safety",
      "Beauty & Wellness",
      "Health Management",
    ];
  } catch (error) {
    console.error("Error fetching category order:", error);
    return [
      "Mental Health",
      "Medical Care",
      "Lifestyle",
      "Emergency & Safety",
      "Beauty & Wellness",
      "Health Management",
    ];
  }
}
