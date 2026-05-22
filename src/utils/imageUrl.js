const API_URL = "http://localhost:3000";

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (String(imagePath).startsWith("http")) {
    return imagePath;
  }

  return `${API_URL}${imagePath}`;
};