const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

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

  return response.json();
}

export function fetchScheduleGroups() {
  return apiRequest("/users/schedule/groups");
}

export function fetchGroupSchedule(groupId) {
  return apiRequest(`/users/schedule/${encodeURIComponent(groupId)}`);
}

export function fetchScheduleEvent(eventId) {
  return apiRequest(`/users/schedule/events/${encodeURIComponent(eventId)}`);
}

export async function discoverAvailableScheduleGroupId() {
  const eventResponse = await fetchScheduleEvent("event-1");
  return eventResponse?.data?.groups?.[0]?.uuid ?? null;
}

export function importSchedule(payload) {
  return apiRequest("/schedule/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function syncScheduleReport() {
  return apiRequest("/admin/shedule/report");
}
