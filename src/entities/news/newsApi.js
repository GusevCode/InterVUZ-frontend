import { apiRequest } from "../../shared/baseApi";

export async function fetchNews() {
  const response = await apiRequest("/news");
  return {
    items: (response?.items ?? []).map(normalizeNewsItem),
  };
}

function normalizeNewsItem(item) {
  return {
    ...item,
    imagePreview: item.imagePreview ?? item.image_preview ?? "",
  };
}
