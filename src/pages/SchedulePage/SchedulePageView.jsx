import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import SectionCard from "../../shared/ui/SectionCard";

const M = {
  sectionSimpleBg: "#121F35",
  sectionBorder: "#253654",
  articleBg: "#172842",
  articleBorder: "#355180",
  labelColor: "#AFBFDE",
  headingColor: "#ECF2FF",
  bodyColor: "#96A7C9",
};

function CalendarOffIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect
        x="8"
        y="10"
        width="32"
        height="30"
        rx="4"
        stroke="#5F8EE5"
        strokeWidth="2"
        fill="rgba(42, 109, 240, 0.12)"
      />
      <path d="M8 18h32" stroke="#5F8EE5" strokeWidth="2" />
      <path d="M16 6v8M32 6v8" stroke="#5F8EE5" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 28l16 16M32 28L16 44"
        stroke="#AFBFDE"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarOffIconLight() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect
        x="8"
        y="10"
        width="32"
        height="30"
        rx="4"
        stroke="#2A6DF0"
        strokeWidth="2"
        fill="rgba(42, 109, 240, 0.08)"
      />
      <path d="M8 18h32" stroke="#2A6DF0" strokeWidth="2" />
      <path d="M16 6v8M32 6v8" stroke="#2A6DF0" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 28l16 16M32 28L16 44"
        stroke="#64748B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MobileSemesterEndedStub() {
  return (
    <Box
      sx={{
        background: M.sectionSimpleBg,
        border: `1px solid ${M.sectionBorder}`,
        borderRadius: "18px",
        p: "24px 15px",
        boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          background: M.articleBg,
          border: `1px solid ${M.articleBorder}`,
          borderRadius: "16px",
          p: "18px",
          mb: "18px",
        }}
      >
        <CalendarOffIcon />
      </Box>

      <Typography
        component="h1"
        sx={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 800,
          fontSize: "20px",
          lineHeight: "26px",
          color: M.headingColor,
          mb: "10px",
        }}
      >
        Семестр завершён
      </Typography>

      <Typography
        sx={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 400,
          fontSize: "14px",
          lineHeight: "21px",
          color: M.bodyColor,
          maxWidth: "280px",
        }}
      >
        Расписание занятий сейчас недоступно. Оно появится с началом нового учебного семестра.
      </Typography>

      <Typography
        sx={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 700,
          fontSize: "12px",
          lineHeight: "16px",
          letterSpacing: "0.48px",
          textTransform: "uppercase",
          color: M.labelColor,
          mt: "18px",
        }}
      >
        Хороших каникул!
      </Typography>
    </Box>
  );
}

function DesktopSemesterEndedStub() {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Расписание
        </Typography>

        <SectionCard
          title="Семестр завершён"
          description="Расписание занятий сейчас недоступно. Оно появится с началом нового учебного семестра."
          contentSx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            py: 4,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <CalendarOffIconLight />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Хороших каникул!
          </Typography>
        </SectionCard>
      </CardContent>
    </Card>
  );
}

function SchedulePageView() {
  const isMobile = useMediaQuery("(max-width:600px)");

  if (isMobile) {
    return <MobileSemesterEndedStub />;
  }

  return <DesktopSemesterEndedStub />;
}

export default SchedulePageView;
