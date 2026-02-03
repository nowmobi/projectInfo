export const IMG_BASE_URL =
  "https://info-6ke.pages.dev/puzzle/number/number.png";
export const Category_URL = "https://info-6ke.pages.dev/puzzle/db.json";

export async function getCategoryOrder() {
  try {
    const response = await fetch(Category_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch category order: ${response.status}`);
    }
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].info2) {
      return data[0].info2;
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


export function getDataBaseUrl() {
 
  return Category_URL.replace('/db.json', '');
}

export function getImgUrl(article) {
 
  const baseUrl = getDataBaseUrl();

 
  if (!article.img) {
    return `${baseUrl}/${article.id}/1.png`;
  }

 
  let imgFileName = article.img;
  if (imgFileName.includes("/")) {
   
    imgFileName = imgFileName.split("/").pop();
  }

  return `${baseUrl}/${article.id}/${imgFileName}`;
}
