export const fallbackParks = [
  {
    id: 5,
    name: "WONDERLA",
    location: "Chennai, Tamil Nadu",
    rating: 4.9,
    price: "1500",
    adultPrice: 1500,
    kidsPrice: 1100,
    image: "/wonderla_final.jpg",
    desc: "The most popular theme park in India featuring world-class high-thrill rides and huge water parks.",
    about: "Founded in 2000, Wonderla spans 82 acres and is India's most visited theme park chain with 43+ rides, world-class safety standards, and over 2 million annual visitors.",
    features: ["Rewind Ride", "Equinox", "Maverick", "Flash Tower", "Rain Disco", "Wave Pool", "Turbo Tunnel", "Lazy River", "4D Theatre", "Go-Karting", "Water Pendulum"]
  },
  {
    id: 1,
    name: "VGP UNIVERSAL KINGDOM",
    location: "Chennai, Tamil Nadu",
    rating: 4.8,
    price: "1200",
    adultPrice: 1200,
    kidsPrice: 900,
    image: "/vgp-image.jpg",
    desc: "India's first and largest amusement park with over 45 thrilling rides and a private beach.",
    about: "India's oldest amusement park since 1975, VGP spans 45+ acres offering 45 rides, a private beach, snow park, live cultural shows and a haunted house.",
    features: ["Giant Wheel", "Roller Coaster", "Pirate Ship", "Break Dance", "Bumper Cars", "Snow Park", "Private Beach", "Wave Pool", "Haunted House", "Live Shows", "Splash Zone"]
  },
  {
    id: 2,
    name: "MGM DIZZEE WORLD",
    location: "Chennai, Tamil Nadu",
    rating: 4.6,
    price: "1000",
    adultPrice: 1000,
    kidsPrice: 750,
    image: "/mgm-image.jpg",
    desc: "The Pioneer of entertainment, offering world-class rides and a unique forest-themed water park.",
    about: "Launched in 1991 on Chennai's ECR coastline, MGM Dizzee World offers a forest-themed water park, ocean views, roller coasters and a dedicated kids adventure zone.",
    features: ["Roller Coaster", "Dizzee Castle", "Drop Zone", "Tagada", "Merry Go Round", "Forest Water Park", "Wave Pool", "Speed Slides", "Kiddies Pool", "Kids Zone", "Food Village"]
  },
  {
    id: 3,
    name: "QUEENS LAND",
    location: "Poonamallee, Chennai",
    rating: 4.5,
    price: "850",
    adultPrice: 850,
    kidsPrice: 600,
    image: "/queensland_final.png",
    desc: "An expansive theme park featuring 51 diverse rides suitable for all age groups.",
    about: "One of Tamil Nadu's largest parks with 51 rides for all ages, Queens Land features TN's largest cable car, a giant wave pool, and a dedicated toddler zone.",
    features: ["Cable Car", "Giant Wheel", "Columbus", "Roller Coaster", "Bumper Cars", "Wave Pool", "Rain Dance", "Splash Pad", "51 Rides", "Toddler Zone", "Panoramic Views"]
  },
  {
    id: 4,
    name: "BLACK THUNDER",
    location: "Mettupalayam, Coimbatore",
    rating: 4.7,
    price: "950",
    adultPrice: 950,
    kidsPrice: 700,
    image: "/black_thunder_final.jpg",
    desc: "Asia's No.1 water theme park with the majestic Nilgiris as a backdrop and extreme water slides.",
    about: "Asia's No.1 rated water theme park since 1991, Black Thunder sits at the Nilgiri foothills with 50+ attractions, extreme slides and a stunning mountain backdrop.",
    features: ["Black Hole Slide", "Kamikaze", "Tornado", "Wave Pool", "Lazy River", "Body Slides", "Go-Karts", "Zip Line", "Rock Climbing", "50+ Attractions"]
  }
];

export const getSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};
