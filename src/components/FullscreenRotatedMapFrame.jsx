import Box from "@mui/material/Box";
import {
  FULLSCREEN_FRAME_ROTATION_DEG,
} from "../entities/map/mapLib";

export const FULLSCREEN_MAP_WIDTH = "100dvw";
export const FULLSCREEN_MAP_HEIGHT = "100dvh";

const usesSwappedDimensions = Math.abs(FULLSCREEN_FRAME_ROTATION_DEG % 180) === 90;

export default function FullscreenRotatedMapFrame({ children, sx = {} }) {
  const frameWidth = usesSwappedDimensions ? FULLSCREEN_MAP_HEIGHT : FULLSCREEN_MAP_WIDTH;
  const frameHeight = usesSwappedDimensions ? FULLSCREEN_MAP_WIDTH : FULLSCREEN_MAP_HEIGHT;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        touchAction: "none",
        overscrollBehavior: "none",
        pointerEvents: "none",
        userSelect: "none",
        ...sx,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: frameWidth,
          height: frameHeight,
          maxWidth: frameWidth,
          maxHeight: frameHeight,
          transform: `translate(-50%, -50%) rotate(${FULLSCREEN_FRAME_ROTATION_DEG}deg)`,
          transformOrigin: "center center",
          touchAction: "none",
          overscrollBehavior: "none",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", userSelect: "none" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
