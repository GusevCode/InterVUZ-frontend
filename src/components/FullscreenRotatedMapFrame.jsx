import Box from "@mui/material/Box";
import {
  FULLSCREEN_FRAME_ROTATION_DEG,
  FULLSCREEN_MAP_SCALE,
} from "../entities/map/mapLib";

export const FULLSCREEN_MAP_WIDTH = "100dvw";
export const FULLSCREEN_MAP_HEIGHT = "100dvh";
export { FULLSCREEN_MAP_SCALE };

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
          transform: `translate(-50%, -50%) rotate(${FULLSCREEN_FRAME_ROTATION_DEG}deg) scale(${FULLSCREEN_MAP_SCALE})`,
          transformOrigin: "center center",
          touchAction: "none",
          overscrollBehavior: "none",
        }}
      >
        <Box sx={{ position: "absolute", inset: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
