import { apiRequest } from "../../shared/baseApi";

export function fetchScheduleGroups() {
  return apiRequest("/users/schedule/groups");
}

export function fetchGroupSchedule(groupId) {
  return apiRequest(`/users/schedule/${encodeURIComponent(groupId)}`);
}
  