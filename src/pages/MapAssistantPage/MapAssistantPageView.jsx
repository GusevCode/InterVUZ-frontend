import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function MessageBubble({ message, onActionClick }) {
  const isAssistant = message.role === "assistant";
  const actions = Array.isArray(message.actions) ? message.actions : [];
  const hasActions = isAssistant && actions.length > 0;

  return (
    <Box
      sx={{
        alignSelf: isAssistant ? "flex-start" : "flex-end",
        width: "100%",
        maxWidth: { xs: "100%", sm: "85%" },
        borderRadius: "16px",
        border: "1px solid",
        borderColor: isAssistant ? "#355180" : "#2a6df0",
        bgcolor: isAssistant ? "#172842" : "#1f3a5f",
        color: "#e4edff",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 1.75, py: 1.4 }}>
        <Typography
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 14,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {message.content}
        </Typography>
      </Box>

      {hasActions ? (
        <Stack spacing={0}>
          {actions.map((action, index) => (
            <Box
              key={`${message.id}-action-${index}`}
              component="button"
              onClick={() => onActionClick(action)}
              sx={{
                width: "100%",
                minHeight: "48px",
                border: "none",
                borderTop: "1px solid rgba(95, 142, 229, 0.4)",
                borderBottom: "1px solid #5F8EE5",
                background: "#2A6DF0",
                color: "#F3F7FF",
                px: 1.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                fontSize: "14px",
                lineHeight: "18px",
              }}
            >
              <MapPinIcon />
              {action.label || "Посмотреть на карте"}
            </Box>
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}

function SendButton({ disabled, onClick, isSending }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        border: "1px solid #5F8EE5",
        borderRadius: "10px",
        background: disabled ? "rgba(42, 109, 240, 0.5)" : "#2A6DF0",
        color: "#F3F7FF",
        width: 42,
        minWidth: 42,
        minHeight: 40,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Arial', sans-serif",
        fontWeight: 700,
        fontSize: "18px",
        lineHeight: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="Отправить"
      title="Отправить"
    >
      {isSending ? "…" : ">"}
    </Box>
  );
}

function ClearButton({ onClick, disabled, dark }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        border: dark ? "1px solid #355180" : "1px solid #c8d3e4",
        borderRadius: "10px",
        background: dark ? "#101D31" : "#ffffff",
        color: dark ? "#CFE0FF" : "#3C5176",
        px: 1.25,
        py: 0.55,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Manrope', sans-serif",
        fontWeight: 700,
        fontSize: "12px",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {"Очистить чат"}
    </Box>
  );
}

function ChatInput({
  inputValue,
  setInputValue,
  onSend,
  isSending,
  isContextLoading,
  placeholder,
  dark,
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="stretch"
      sx={{
        mt: "auto",
        pt: 1.25,
        borderTop: dark ? "1px solid #253654" : "1px solid #d8e0ea",
      }}
    >
      <TextField
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder={placeholder}
        size="small"
        fullWidth
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        sx={dark ? {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#101D31",
            color: "#E4EDFF",
            "& fieldset": { borderColor: "#355180" },
          },
        } : undefined}
      />
      <SendButton
        disabled={isSending || isContextLoading}
        onClick={onSend}
        isSending={isSending}
      />
    </Stack>
  );
}

function MobileAssistantView({
  inputValue,
  setInputValue,
  messages,
  isSending,
  isContextLoading,
  contextError,
  onSend,
  onActionClick,
  onClearChat,
  canClearChat,
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 2, mt: 0.5 }}>
      <Box
        sx={{
          background: "linear-gradient(180deg, rgba(24, 40, 66, 0.58) 0%, rgba(18, 31, 53, 0.95) 100%), #121F35",
          borderRadius: 0,
          px: "20px",
          py: "18px",
          boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          mx: -2,
          width: "calc(100% + 32px)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography sx={{ color: "#ECF2FF", fontWeight: 800, fontSize: 15 }}>
            {"ИИ-чат карты"}
          </Typography>
          <ClearButton onClick={onClearChat} disabled={!canClearChat} dark />
        </Stack>

        {isContextLoading ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#AFBFDE", mb: 1.25 }}>
            <CircularProgress size={16} sx={{ color: "#AFBFDE" }} />
            <Typography sx={{ fontSize: 13 }}>{"Загрузка контекста карты..."}</Typography>
          </Stack>
        ) : null}

        {contextError ? <Alert severity="warning" sx={{ mb: 1.25 }}>{contextError}</Alert> : null}

        <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.5, mb: 1.75 }}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} onActionClick={onActionClick} />
          ))}
        </Stack>

        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSend={onSend}
          isSending={isSending}
          isContextLoading={isContextLoading}
          placeholder={"Введите свой вопрос"}
          dark
        />
      </Box>
    </Box>
  );
}

export default function MapAssistantPageView(props) {
  const isMobile = useMediaQuery("(max-width:600px)");

  if (isMobile) {
    return <MobileAssistantView {...props} />;
  }

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 }, minHeight: "78vh", display: "flex", flexDirection: "column" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {"ИИ-чат карты"}
          </Typography>
          <ClearButton onClick={props.onClearChat} disabled={!props.canClearChat} />
        </Stack>

        {props.isContextLoading ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary", mb: 1.5 }}>
            <CircularProgress size={16} />
            <Typography variant="body2">{"Загрузка контекста карты..."}</Typography>
          </Stack>
        ) : null}

        {props.contextError ? <Alert severity="warning" sx={{ mb: 1.5 }}>{props.contextError}</Alert> : null}

        <Box
          sx={{
            borderRadius: 2,
            p: 2,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            mb: 2,
            background: "#f8fbff",
          }}
        >
          {props.messages.map((message) => (
            <MessageBubble key={message.id} message={message} onActionClick={props.onActionClick} />
          ))}
        </Box>

        <ChatInput
          inputValue={props.inputValue}
          setInputValue={props.setInputValue}
          onSend={props.onSend}
          isSending={props.isSending}
          isContextLoading={props.isContextLoading}
          placeholder={"Введите свой вопрос"}
        />
      </CardContent>
    </Card>
  );
}
