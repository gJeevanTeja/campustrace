export function adjustLocation(baseLat, baseLng, latOffset, lngOffset) {
  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset
  };
}

export const MRU_LOCATIONS = [
  // Academic
  {
    name: "Malla Reddy University",
    latitude: 17.5627311,
    longitude: 78.443911,
    description: "Main Campus",
    category: "Academic"
  },

  {
    name: "Mallareddy UNIVERSITY SOE-2",
    ...adjustLocation(17.56411, 78.44550, -0.0004, 0),
    description: "School of Engineering - Block 2",
    category: "Academic"
  },
  {
    name: "Mallareddy UNIVERSITY SOE-3",
    latitude: 17.56411,
    longitude: 78.44550,
    description: "School of Engineering - Block 3",
    category: "Academic"
  },

  // Facilities
  {
    name: "Malla Reddy University Cafeteria",
    latitude: 17.5633927,
    longitude: 78.444653,
    description: "Official Campus Cafeteria",
    category: "Facilities"
  },
  {
    name: "Malla Reddy University Bus Parking",
    latitude: 17.5626,
    longitude: 78.4463,
    description: "Main Parking Area",
    category: "Facilities"
  },
  {
    name: "Malla Reddy University Playground",
    latitude: 17.5626,
    longitude: 78.4451,
    description: "MRDU Cricket Ground",
    category: "Facilities"
  },

  // Residential
  {
    name: "Mallareddy Boys Hostel",
    ...adjustLocation(17.56411, 78.44550, 0.0004, 0),
    description: "University Boys Hostel",
    category: "Residential"
  },
  {
    name: "Mruh girls hostel",
    latitude: 17.5634881,
    longitude: 78.4441826,
    description: "University Girls Hostel",
    category: "Residential"
  },

  // Entry Points
  {
    name: "MRU Main Entrance",
    latitude: 17.5605,
    longitude: 78.4513,
    description: "Front Gate (Junction south of Canara Bank)",
    category: "Entry Points"
  },
  {
    name: "MRU Back Entrance",
    ...adjustLocation(17.5627311, 78.443911, 0.00055, -0.00025),
    description: "Malla Reddy University Back Entrance",
    category: "Entry Points"
  }
];

export const GROUPED_LOCATIONS = MRU_LOCATIONS.reduce((acc, loc) => {
  if (!acc[loc.category]) acc[loc.category] = [];
  acc[loc.category].push(loc);
  return acc;
}, {});
