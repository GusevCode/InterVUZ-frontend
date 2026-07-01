const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

function buildUrl(path, query = {}) {
  
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const rawUrl = `${API_BASE_URL}${normalizedPath}`;
  const url = rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
    ? new URL(rawUrl)
    : new URL(rawUrl, window.location.origin);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.href  
}

export async function apiRequest(path, options = {}) {

  const {
    headers,
    query,
    body,
    ...restOptions
  } = options;

  let response;

  try {
    response = await fetch(buildUrl(path, query), {
      ...restOptions,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(headers ?? {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    const message = error?.message || "";
    if (message === "Failed to fetch" || error instanceof TypeError) {
      throw new Error("Сервер недоступен. Убедитесь, что бэкенд запущен на порту 8000.");
    }
    throw error;
  }

  if (!response.ok) {
    let errorMessage = `Запрос ${path} упал с кодом ${response.status}`;

    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // Response is not JSON, keep default message.
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

export async function fetchJson(path, query) {
    return apiRequest(path, {query});
}

export async function postJson(path, body) {

  return apiRequest(path, {
    method: "POST", 
    body,
  })
}
