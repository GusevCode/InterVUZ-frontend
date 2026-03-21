import mockMapJpg from "../mock/mock_map.jpg";

export const mockMapImage = {
  building: "B1",
  floor: 2,
  width: 1280,
  height: 565,
  alt: "Campus map for building B1 floor 2",
  src: mockMapJpg,
};

export const mockPlaces = [
  {
    id: "place_101",
    name: "Room 214",
    type: "classroom",
    description: "Computer classroom with projector and 28 seats.",
    coordinates: {
      building: "B1",
      floor: 2,
      x: 300,
      y: 220,
    },
    tags: ["computer", "projector"],
    isAccessible: true,
  },
  {
    id: "place_103",
    name: "Printer Zone",
    type: "printer",
    description: "Self-service printing point near the dean office.",
    coordinates: {
      building: "B1",
      floor: 2,
      x: 760,
      y: 220,
    },
    tags: ["print", "documents"],
    isAccessible: true,
  },
  {
    id: "place_105",
    name: "Study Lounge",
    type: "library",
    description: "Open co-working space with sockets and silent desks.",
    coordinates: {
      building: "B1",
      floor: 2,
      x: 300,
      y: 460,
    },
    tags: ["wifi", "quiet"],
    isAccessible: true,
  },
  {
    id: "place_106",
    name: "Dean Office",
    type: "dean_office",
    description: "Administration office for student requests.",
    coordinates: {
      building: "B1",
      floor: 2,
      x: 760,
      y: 460,
    },
    tags: ["office"],
    isAccessible: false,
  },
];
