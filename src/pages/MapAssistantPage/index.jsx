import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { askMapAssistant } from "../../entities/assistant/assistantLib";
import { getMapGraphs, getMapVectors } from "../../entities/map/mapLib";
import MapAssistantPageView from "./MapAssistantPageView";

const CHAT_STORAGE_KEY = "intervuz.map.assistant.chat.v5";
const MAX_SAVED_MESSAGES = 80;

function createWelcomeMessage() {
  return {
    id: `assistant-welcome-${Date.now()}`,
    role: "assistant",
    content: "Спросите про аудитории, маршруты и проходы по корпусу.",
    actions: [],
  };
}

function toRequestMessages(items) {
  return items.map((item) => ({
    role: item.role,
    content: item.content,
  }));
}

function normalizeSavedMessages(rawValue) {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((item, index) => {
      const role = String(item?.role ?? "").trim();
      const content = String(item?.content ?? "").trim();

      if ((role !== "user" && role !== "assistant") || !content) {
        return null;
      }

      const normalizedActions = Array.isArray(item?.actions)
        ? item.actions
          .map((action) => ({
            type: String(action?.type ?? "").trim(),
            label: String(action?.label ?? "").trim(),
            mapId: action?.mapId ? String(action.mapId) : null,
            placeId: action?.placeId ? String(action.placeId) : null,
            elementId: action?.elementId ? String(action.elementId) : null,
          }))
          .filter((action) => action.type === "show_on_map")
        : [];

      return {
        id: String(item?.id ?? `${role}-${Date.now()}-${index}`),
        role,
        content,
        actions: normalizedActions,
      };
    })
    .filter(Boolean);
}

function getInitialMessages() {
  if (typeof window === "undefined") {
    return [createWelcomeMessage()];
  }

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) {
      return [createWelcomeMessage()];
    }

    const parsed = JSON.parse(raw);
    const savedMessages = normalizeSavedMessages(parsed);
    return savedMessages.length > 0 ? savedMessages : [createWelcomeMessage()];
  } catch {
    return [createWelcomeMessage()];
  }
}

function buildMapUrlFromAction(action) {
  const params = new URLSearchParams();

  if (action?.mapId) {
    params.set("assistantMapId", action.mapId);
  }
  if (action?.placeId) {
    params.set("assistantPlaceId", action.placeId);
  }
  if (action?.elementId) {
    params.set("assistantElementId", action.elementId);
  }

  const query = params.toString();
  return query ? `/map?${query}` : "/map";
}

function MapAssistantPage() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(() => getInitialMessages());
  const [isSending, setIsSending] = useState(false);
  const [isContextLoading, setIsContextLoading] = useState(true);
  const [contextError, setContextError] = useState("");
  const [mapVectors, setMapVectors] = useState([]);
  const [mapGraphs, setMapGraphs] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadContext() {
      setIsContextLoading(true);
      setContextError("");
      try {
        const [nextVectors, nextGraphs] = await Promise.all([
          getMapVectors(),
          getMapGraphs(),
        ]);

        if (!isMounted) {
          return;
        }

        setMapVectors(nextVectors ?? []);
        setMapGraphs(nextGraphs ?? []);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setContextError(error.message || "Не удалось загрузить контекст карты.");
      } finally {
        if (isMounted) {
          setIsContextLoading(false);
        }
      }
    }

    loadContext();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const messagesToStore = messages.slice(-MAX_SAVED_MESSAGES);
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToStore));
    } catch {
      // Ignore localStorage write errors.
    }
  }, [messages]);

  const ragContext = useMemo(
    () => ({
      maps: mapVectors,
      graphs: mapGraphs,
    }),
    [mapVectors, mapGraphs],
  );

  async function handleSendMessage() {
    const query = inputValue.trim();
    if (!query || isSending) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      actions: [],
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await askMapAssistant({
        query,
        messages: toRequestMessages(nextMessages),
        context: ragContext,
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.answer,
          actions: response.actions,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: error.message || "Не удалось получить ответ от ассистента.",
          actions: [],
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleClearChat() {
    setMessages([createWelcomeMessage()]);
    setInputValue("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }

  function handleMapAction(action) {
    navigate(buildMapUrlFromAction(action));
  }

  return (
    <MapAssistantPageView
      inputValue={inputValue}
      setInputValue={setInputValue}
      messages={messages}
      isSending={isSending}
      isContextLoading={isContextLoading}
      contextError={contextError}
      onSend={handleSendMessage}
      onClearChat={handleClearChat}
      canClearChat={messages.length > 1}
      onActionClick={handleMapAction}
    />
  );
}

export default MapAssistantPage;
