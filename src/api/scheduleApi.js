const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://api.intervuz.local/v1";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

const mockGroupCatalogResponse = {
  data: {
    abbr: "BMSTU",
    name: "BMSTU",
    nodeType: "department",
    children: [
      {
        abbr: "IU1",
        name: "IU1",
        nodeType: "course",
        children: [
          {
            abbr: "IU1-21B",
            name: "IU1-21B",
            uuid: "group-iu1-21b",
            nodeType: "group",
            children: [],
          },
          {
            abbr: "IU1-22B",
            name: "IU1-22B",
            uuid: "group-iu1-22b",
            nodeType: "group",
            children: [],
          },
        ],
      },
      {
        abbr: "IU7",
        name: "IU7",
        nodeType: "course",
        children: [
          {
            abbr: "IU7-31B",
            name: "IU7-31B",
            uuid: "group-iu7-31b",
            nodeType: "group",
            children: [],
          },
        ],
      },
    ],
  },
};

const mockSchedulesByGroupId = {
  "group-iu1-21b": {
    data: {
      link: "https://example.local/schedule/group-iu1-21b",
      type: "schedule.group",
      uuid: "group-iu1-21b",
      title: "IU1-21B",
      schedule: [
        {
          eventId: "event-1",
          day: 1,
          time: 1,
          week: "all",
          groups: [{ name: "IU1-21B", uuid: "group-iu1-21b" }],
          stream: { name: "IU1 stream", groups: [{ sub1: 0, sub2: 0, groupUuid: "group-iu1-21b" }] },
          endTime: "10:00",
          teachers: [{ uuid: "t-1", lastName: "Ivanov", firstName: "Ivan" }],
          audiences: [
            {
              name: "B-214",
              uuid: "aud-214",
              building: "B1",
              root_uuid: "root-1",
              building_id_block: 1,
              building_id_building: 1,
            },
          ],
          startTime: "08:30",
          discipline: {
            abbr: "Math",
            actType: "seminar",
            fullName: "Higher Mathematics",
            shortName: "Math",
          },
          permission: "timetable.edit-all",
          endTimeMinNum: 0,
          endTimeHourNum: 10,
          startTimeMinNum: 30,
          startTimeHourNum: 8,
        },
        {
          eventId: "event-2",
          day: 1,
          time: 2,
          week: "all",
          groups: [{ name: "IU1-21B", uuid: "group-iu1-21b" }],
          stream: { name: "IU1 stream", groups: [{ sub1: 0, sub2: 0, groupUuid: "group-iu1-21b" }] },
          endTime: "12:15",
          teachers: [{ uuid: "t-2", lastName: "Petrov", firstName: "Petr" }],
          audiences: [
            {
              name: "A-312",
              uuid: "aud-312",
              building: "A1",
              root_uuid: "root-1",
              building_id_block: 1,
              building_id_building: 2,
            },
          ],
          startTime: "10:45",
          discipline: {
            abbr: "Prog",
            actType: "lecture",
            fullName: "Programming",
            shortName: "Prog",
          },
          permission: "timetable.edit-all",
          endTimeMinNum: 15,
          endTimeHourNum: 12,
          startTimeMinNum: 45,
          startTimeHourNum: 10,
        },
      ],
    },
  },
  "group-iu1-22b": {
    data: {
      link: "https://example.local/schedule/group-iu1-22b",
      type: "schedule.group",
      uuid: "group-iu1-22b",
      title: "IU1-22B",
      schedule: [],
    },
  },
  "group-iu7-31b": {
    data: {
      link: "https://example.local/schedule/group-iu7-31b",
      type: "schedule.group",
      uuid: "group-iu7-31b",
      title: "IU7-31B",
      schedule: [
        {
          eventId: "event-3",
          day: 3,
          time: 3,
          week: "all",
          groups: [{ name: "IU7-31B", uuid: "group-iu7-31b" }],
          stream: { name: "IU7 stream", groups: [{ sub1: 0, sub2: 0, groupUuid: "group-iu7-31b" }] },
          endTime: "14:30",
          teachers: [{ uuid: "t-3", lastName: "Sidorov", firstName: "Sergey" }],
          audiences: [
            {
              name: "L-107",
              uuid: "aud-107",
              building: "L1",
              root_uuid: "root-1",
              building_id_block: 3,
              building_id_building: 7,
            },
          ],
          startTime: "13:00",
          discipline: {
            abbr: "Phys",
            actType: "lab",
            fullName: "Physics",
            shortName: "Phys",
          },
          permission: "timetable.edit-all",
          endTimeMinNum: 30,
          endTimeHourNum: 14,
          startTimeMinNum: 0,
          startTimeHourNum: 13,
        },
      ],
    },
  },
};

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function mockRequest(handler) {
  await delay(250);
  return handler();
}

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
  if (USE_MOCK_API) {
    return mockRequest(() => mockGroupCatalogResponse);
  }

  return apiRequest("/users/schedule/groups");
}

export function fetchGroupSchedule(groupId) {
  if (USE_MOCK_API) {
    return mockRequest(() => {
      return (
        mockSchedulesByGroupId[groupId] ?? {
          data: {
            link: "https://example.local/schedule/unknown-group",
            type: "schedule.group",
            uuid: groupId,
            title: groupId,
            schedule: [],
          },
        }
      );
    });
  }

  return apiRequest(`/users/schedule/${encodeURIComponent(groupId)}`);
}

export function fetchScheduleEvent(eventId) {
  if (USE_MOCK_API) {
    return mockRequest(() => {
      const event =
        Object.values(mockSchedulesByGroupId)
          .flatMap((item) => item.data.schedule)
          .find((item) => item.eventId === eventId) ?? null;

      if (!event) {
        throw new Error("Schedule event not found");
      }

      return { data: event };
    });
  }

  return apiRequest(`/users/schedule/events/${encodeURIComponent(eventId)}`);
}

export function importSchedule(payload) {
  if (USE_MOCK_API) {
    return mockRequest(() => ({
      importId: `mock-import-${Date.now()}`,
      status: "completed",
      importedEvents: Array.isArray(payload?.events) ? payload.events.length : 0,
    }));
  }

  return apiRequest("/schedule/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
