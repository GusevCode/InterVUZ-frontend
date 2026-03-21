import floor1Image from "../mock/floor_1.png";
import floor10Image from "../mock/floor_10.png";
import floor11Image from "../mock/floor_11.png";
import floor1aImage from "../mock/floor_1a.png";
import floor2Image from "../mock/floor_2.png";
import floor3Image from "../mock/floor_3.png";
import floor4Image from "../mock/floor_4.png";
import floor5Image from "../mock/floor_5.png";
import floor6Image from "../mock/floor_6.png";
import floor7Image from "../mock/floor_7.png";
import floor8Image from "../mock/floor_8.png";
import floor9Image from "../mock/floor_9.png";

import floor1Data from "../mock/floor_1.json";
import floor10Data from "../mock/floor_10.json";
import floor11Data from "../mock/floor_11.json";
import floor1aData from "../mock/floor_1a.json";
import floor2Data from "../mock/floor_2.json";
import floor3Data from "../mock/floor_3.json";
import floor4Data from "../mock/floor_4.json";
import floor5Data from "../mock/floor_5.json";
import floor6Data from "../mock/floor_6.json";
import floor7Data from "../mock/floor_7.json";
import floor8Data from "../mock/floor_8.json";
import floor9Data from "../mock/floor_9.json";

const floorImages = {
  "floor_1.png": floor1Image,
  "floor_1a.png": floor1aImage,
  "floor_2.png": floor2Image,
  "floor_3.png": floor3Image,
  "floor_4.png": floor4Image,
  "floor_5.png": floor5Image,
  "floor_6.png": floor6Image,
  "floor_7.png": floor7Image,
  "floor_8.png": floor8Image,
  "floor_9.png": floor9Image,
  "floor_10.png": floor10Image,
  "floor_11.png": floor11Image,
};

const rawFloors = [
  floor1Data,
  floor1aData,
  floor2Data,
  floor3Data,
  floor4Data,
  floor5Data,
  floor6Data,
  floor7Data,
  floor8Data,
  floor9Data,
  floor10Data,
  floor11Data,
];

export const mockFloorMaps = rawFloors.map((floor) => ({
  ...floor,
  src: floorImages[floor.image],
  configFile: floor.image.replace(".png", ".json"),
}));

export const defaultFloorId = mockFloorMaps[0]?.id ?? "1";

export function getMockFloorMap(floorId) {
  return mockFloorMaps.find((floor) => floor.id === floorId) ?? mockFloorMaps[0] ?? null;
}
