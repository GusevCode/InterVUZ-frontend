import { postJson } from "../../shared/baseApi";

const DEFAULT_ASSISTANT_PROMPT = [
  "You are an indoor navigation assistant for a university map.",
  "Answer briefly and clearly in Russian.",
  "Use only data from provided context.",
  "If user asks for location or route, include actionable map target when possible.",
  "Return plain text answer and optional actions array.",
  "Action format: {\"type\":\"show_on_map\",\"label\":\"Посмотреть на карте\",\"mapId\":\"...\",\"placeId\":\"...\",\"elementId\":\"...\"}",
].join(" ");

function normalizeActions(rawActions) {
  if (!Array.isArray(rawActions)) {
    return [];
  }

  const normalized = rawActions
    .map((action) => ({
      type: String(action?.type ?? "").trim(),
      label: String(action?.label ?? "Посмотреть на карте").trim(),
      mapId: action?.mapId ? String(action.mapId) : null,
      placeId: action?.placeId ? String(action.placeId) : null,
      elementId: action?.elementId ? String(action.elementId) : null,
    }))
    .filter((action) => action.type === "show_on_map");

  if (normalized.length === 0) {
    return [];
  }

  // Keep one actionable button in UI.
  return [normalized[0]];
}

function normalizeAssistantResponse(response) {
  const answer = String(
    response?.answer
      ?? response?.message
      ?? response?.content
      ?? "",
  ).trim();

  const actions = normalizeActions(
    response?.actions
      ?? response?.mapActions
      ?? response?.tools
      ?? [],
  );

  return {
    answer: answer || "Не удалось получить ответ ассистента.",
    actions,
  };
}

export async function askMapAssistant({
  query,
  messages,
  context,
  systemPrompt = DEFAULT_ASSISTANT_PROMPT,
}) {
  const response = await postJson("/assistant/chat", {
    query,
    messages,
    context,
    systemPrompt,
  });

  return normalizeAssistantResponse(response);
}
