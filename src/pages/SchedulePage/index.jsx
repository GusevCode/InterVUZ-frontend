import { useEffect, useMemo, useState } from "react";
import {
  fetchGroupSchedule,
  fetchScheduleGroups,
} from "../../entities/shedule/scheduleApi";
import SchedulePageView from "./SchedulePageView";

const dayNames = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
  7: "Вс",
};

function getTodayScheduleDay() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function SchedulePage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [events, setEvents] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(getTodayScheduleDay());

  const todayScheduleDay = getTodayScheduleDay();
  const selectedDayName = dayNames[selectedDay] ?? "Выбранный день";

  const rows = useMemo(() => {
    return [...events]
      .filter((event) => event.day === selectedDay)
      .sort((a, b) => {
        if (a.startTimeHourNum !== b.startTimeHourNum) {
          return a.startTimeHourNum - b.startTimeHourNum;
        }
        return a.startTimeMinNum - b.startTimeMinNum;
      })
      .map((event, index) => ({
        id: `${event.day}-${event.time}-${event.discipline?.abbr ?? index}-${index}`,
        time: `${event.startTime} - ${event.endTime}`,
        title:
          event.discipline?.fullName ??
          event.discipline?.abbr ??
          "Без названия дисциплины",
        room: event.audiences?.[0]?.name ?? "Не указаны",
      }));
  }, [events, selectedDay]);

  const loadGroups = async () => {
    setLoadingGroups(true);
    setError("");
    setScheduleLoaded(false);
    setEvents([]);

    try {
      const response = await fetchScheduleGroups();
      const root = response?.data;
      const collected = [];

      const walk = (node) => {
        if (!node) {
          return;
        }

        if (node.nodeType === "group" && node.uuid) {
          collected.push({
            id: node.uuid,
            name: node.name || node.abbr || node.uuid,
          });
        }

        if (Array.isArray(node.children)) {
          node.children.forEach(walk);
        }
      };

      walk(root);
      setGroups(collected);
      return collected;
    } catch (err) {
      setError(err.message || "Не удалось загрузить список групп");
      return [];
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleShowSchedule = async () => {
    if (!selectedGroupId) {
      const loadedGroups = await loadGroups();
      if (loadedGroups.length > 0) {
        setError("Выберите группу и повторите попытку.");
      } else {
        setError("Список групп недоступен. Повторите попытку позже.");
      }
      return;
    }

    setLoadingSchedule(true);
    setError("");

    try {
      const response = await fetchGroupSchedule(selectedGroupId);
      setEvents(response?.data?.schedule ?? []);
      setScheduleLoaded(true);
    } catch (err) {
      setError(err?.message || "Не удалось загрузить расписание");
      setEvents([]);
      setScheduleLoaded(false);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    void loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SchedulePageView
      selectedGroupId={selectedGroupId}
      setSelectedGroupId={setSelectedGroupId}
      groups={groups}
      handleShowSchedule={handleShowSchedule}
      loadingSchedule={loadingSchedule}
      loadingGroups={loadingGroups}
      error={error}
      selectedDay={selectedDay}
      setSelectedDay={setSelectedDay}
      dayNames={dayNames}
      todayScheduleDay={todayScheduleDay}
      rows={rows}
      scheduleLoaded={scheduleLoaded}
      selectedDayName={selectedDayName}
    />
  );
}

export default SchedulePage;
