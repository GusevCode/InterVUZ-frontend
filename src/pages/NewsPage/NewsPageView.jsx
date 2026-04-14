import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";

const M = {
  sectionBg: "linear-gradient(180deg, rgba(24, 40, 66, 0.58) 0%, rgba(18, 31, 53, 0.95) 100%), #121F35",
  sectionBorder: "#253654",
  articleBg: "#172842",
  articleBorder: "#355180",
  headingColor: "#ECF2FF",
  bodyColor: "#96A7C9",
  labelColor: "#AFBFDE",
};

function MobileNewsCard({ item }) {
  const { title, preview_text, published_at, imagePreview, tags } = item;
  const dateStr = published_at
    ? `${published_at.day} ${published_at.month} ${published_at.year}`
    : null;

  return (
    <Box
      sx={{
        background: M.articleBg,
        border: `1px solid ${M.articleBorder}`,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {imagePreview ? (
        <Box
          component="img"
          src={imagePreview}
          alt={title}
          sx={{
            display: "block",
            width: "100%",
            height: "160px",
            objectFit: "cover",
          }}
        />
      ) : null}
      <Box sx={{ p: "13px" }}>
        {dateStr ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 400,
              fontSize: "12px",
              lineHeight: "16px",
              color: M.labelColor,
              mb: "6px",
            }}
          >
            {dateStr}
          </Typography>
        ) : null}
        <Typography
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 700,
            fontSize: "14.4px",
            lineHeight: "20px",
            color: M.headingColor,
            mb: "6px",
          }}
        >
          {title}
        </Typography>
        {preview_text ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 400,
              fontSize: "13px",
              lineHeight: "18px",
              color: M.bodyColor,
              mb: tags && tags.length > 0 ? "10px" : 0,
            }}
          >
            {preview_text}
          </Typography>
        ) : null}
        {tags && tags.length > 0 ? (
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.title}
                size="small"
                sx={{
                  backgroundColor: tag.color,
                  color: "#fff",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                }}
              />
            ))}
          </Stack>
        ) : null}
      </Box>
    </Box>
  );
}

function MobileNewsView({ items, loading, error }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          background: M.sectionBg,
          border: `1px solid ${M.sectionBorder}`,
          borderRadius: "18px",
          p: "15px",
          boxShadow: "0px 10px 28px rgba(6, 10, 22, 0.33)",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: "16px",
            lineHeight: "22px",
            color: M.headingColor,
            mb: "15px",
          }}
        >
          Новости
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} sx={{ color: M.labelColor }} />
          </Box>
        ) : error ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "14px",
              color: "#ff6b6b",
              textAlign: "center",
              py: 2,
            }}
          >
            {error}
          </Typography>
        ) : items.length === 0 ? (
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "14px",
              color: M.bodyColor,
              textAlign: "center",
              py: 2,
            }}
          >
            Новостей пока нет
          </Typography>
        ) : (
          <Stack spacing="9px">
            {items.map((item) => (
              <MobileNewsCard key={item.slug} item={item} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

function NewsCard({ item }) {
  const { title, preview_text, published_at, imagePreview, tags } = item;

  const dateStr = published_at
    ? `${published_at.day} ${published_at.month} ${published_at.year}`
    : null;

  // TODO: когда будет страница новости — вернуть component="a" href={page_url} target="_blank" rel="noopener noreferrer"
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "default",
      }}
    >
      {imagePreview && (
        <CardMedia
          component="img"
          height="180"
          image={imagePreview}
          alt={title}
          sx={{ objectFit: "cover" }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        {dateStr && (
          <Typography variant="caption" color="text.secondary">
            {dateStr}
          </Typography>
        )}
        <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.35 }}>
          {title}
        </Typography>
        {preview_text && (
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {preview_text}
          </Typography>
        )}
        {tags && tags.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: "auto", pt: 1 }}>
            {tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.title}
                size="small"
                sx={{
                  backgroundColor: tag.color,
                  color: "#fff",
                  fontWeight: 500,
                  fontSize: "0.7rem",
                }}
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function NewsPageView({ items, loading, error }) {
  const isMobile = useMediaQuery("(max-width:600px)");

  if (isMobile) {
    return <MobileNewsView items={items} loading={loading} error={error} />;
  }

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Новости
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Typography variant="body1" color="error" sx={{ py: 4, textAlign: "center" }}>
            {error}
          </Typography>
        )}

        {!loading && !error && items.length === 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            Новостей пока нет
          </Typography>
        )}

        {!loading && !error && items.length > 0 && (
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid key={item.slug} size={{ xs: 12, sm: 6, md: 4 }}>
                <NewsCard item={item} />
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

export default NewsPageView;
