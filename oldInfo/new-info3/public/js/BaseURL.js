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

export function getImgUrl(article) {
  // 返回完整的图片 URL
  const baseUrl = IMG_BASE_URL.replace("/number/number.png", "");

  // 如果 article.img 包含路径，提取文件名
  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
    // 提取最后一个斜杠后的文件名
    imgFileName = imgFileName.split("/").pop();
  }

  return `${baseUrl}/${article.id}/${imgFileName}`;
}
