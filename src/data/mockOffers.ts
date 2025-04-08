import { TransportOffer } from "@/types/offers";

// Helper function to generate random dates within a range
const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// Helper function to generate random price
const generatePrice = (basePrice: number, variance: number) => {
  const randomFactor = 1 + (Math.random() * variance * 2 - variance);
  return Math.round(basePrice * randomFactor);
};

// Define common data arrays for random selection
const cities = [
  { name: "Warsaw", country: "PL", coords: "52.2297° N, 21.0122° E" },
  { name: "Berlin", country: "DE", coords: "52.5200° N, 13.4050° E" },
  { name: "Munich", country: "DE", coords: "48.1351° N, 11.5820° E" },
  { name: "Amsterdam", country: "NL", coords: "52.3676° N, 4.9041° E" },
  { name: "Prague", country: "CZ", coords: "50.0755° N, 14.4378° E" },
  { name: "Lyon", country: "FR", coords: "45.7640° N, 4.8357° E" },
  { name: "Barcelona", country: "ES", coords: "41.3874° N, 2.1686° E" },
  { name: "Paris", country: "FR", coords: "48.8566° N, 2.3522° E" },
  { name: "Vienna", country: "AT", coords: "48.2082° N, 16.3738° E" },
  { name: "Milan", country: "IT", coords: "45.4642° N, 9.1900° E" },
  { name: "Madrid", country: "ES", coords: "40.4168° N, 3.7038° W" },
  { name: "Hamburg", country: "DE", coords: "53.5511° N, 9.9937° E" },
  { name: "Rotterdam", country: "NL", coords: "51.9244° N, 4.4777° E" },
  { name: "Antwerp", country: "BE", coords: "51.2194° N, 4.4025° E" },
  { name: "Marseille", country: "FR", coords: "43.2965° N, 5.3698° E" },
  { name: "Frankfurt", country: "DE", coords: "50.1109° N, 8.6821° E" },
  { name: "Gdansk", country: "PL", coords: "54.3520° N, 18.6466° E" },
  { name: "Valencia", country: "ES", coords: "39.4699° N, 0.3763° W" },
  { name: "Bratislava", country: "SK", coords: "48.1486° N, 17.1077° E" },
  { name: "Copenhagen", country: "DK", coords: "55.6761° N, 12.5683° E" }
];

const carriers = [
  "SpeedFreight Ltd.",
  "ExpressLogistics GmbH",
  "AlpineTransport",
  "EuroMovers B.V.",
  "SpeedCargo",
  "FreightMasters France",
  "Nordic Transport AS",
  "MediterraneanFreight",
  "CentralEuro Logistics",
  "AtlanticCargo Ltd.",
  "EastWest Transport",
  "RapidFreight Solutions",
  "TransEuropa Express",
  "CargoMasters Int.",
  "FastLane Logistics"
];

const loadTypes = [
  "General Cargo",
  "Palletized",
  "Temperature Controlled",
  "Fragile Goods",
  "Heavy Machinery",
  "Automotive Parts",
  "Construction Materials",
  "Chemical Products",
  "Food Products",
  "Retail Goods"
];

const vehicles = [
  "Standard Truck",
  "Mega Trailer",
  "Box Truck",
  "Refrigerated Truck",
  "Curtainsider",
  "Double Deck Trailer",
  "Flatbed Truck",
  "Container Truck",
  "Jumbo Truck",
  "Low Loader"
];

const platforms = [
  "TimoCom",
  "Trans.eu",
  "Freightos",
  "LoadFox",
  "Wtransnet"
];

const dimensions = [
  "13.6 x 2.45 x 2.7m",
  "13.6 x 2.45 x 3.0m",
  "7.2 x 2.45 x 2.7m",
  "13.6 x 2.45 x 2.5m",
  "7.2 x 2.45 x 3.0m"
];

// Generate 200 mock offers
export const mockOffers: TransportOffer[] = Array.from({ length: 200 }, (_, index) => {
  // Generate random origin and destination (ensure they're different)
  let originCity, destinationCity;
  do {
    originCity = cities[Math.floor(Math.random() * cities.length)];
    destinationCity = cities[Math.floor(Math.random() * cities.length)];
  } while (originCity === destinationCity);

  // Calculate a semi-realistic distance (using a simplified formula)
  const distance = Math.round(Math.random() * 2000 + 300); // Between 300 and 2300 km

  // Generate price based on distance (€0.8 - €1.4 per km)
  const pricePerKm = 0.8 + Math.random() * 0.6;
  const basePrice = Math.round(distance * pricePerKm);
  const price = generatePrice(basePrice, 0.2); // 20% variance

  // Generate dates (within next 14 days)
  const today = new Date();
  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(today.getDate() + 14);
  
  const loadingDate = getRandomDate(today, twoWeeksLater);
  const deliveryDate = new Date(loadingDate);
  deliveryDate.setDate(loadingDate.getDate() + Math.floor(Math.random() * 3) + 1); // 1-3 days after loading

  // Generate weight (8-26 tons)
  const weight = Math.floor(Math.random() * 18 + 8);

  // Generate rating (4.0-5.0)
  const rating = (4 + Math.random()).toFixed(1);

  return {
    id: `TR-${(2600 - index).toString().padStart(4, '0')}`, // Descending order from TR-2600
    origin: `${originCity.name}, ${originCity.country}`,
    originCoords: originCity.coords,
    destination: `${destinationCity.name}, ${destinationCity.country}`,
    destinationCoords: destinationCity.coords,
    distance: `${distance} km`,
    price: `€${price}`,
    pricePerKm: `€${(price / distance).toFixed(2)}/km`,
    carrier: carriers[Math.floor(Math.random() * carriers.length)],
    loadType: loadTypes[Math.floor(Math.random() * loadTypes.length)],
    vehicle: vehicles[Math.floor(Math.random() * vehicles.length)],
    weight: `${weight} tons`,
    dimensions: dimensions[Math.floor(Math.random() * dimensions.length)],
    loadingDate: formatDate(loadingDate),
    deliveryDate: formatDate(deliveryDate),
    status: "Available",
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    lastUpdated: "Today, " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    dateCreated: "Today, " + new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    description: [
      loadTypes[Math.floor(Math.random() * loadTypes.length)],
      Math.random() > 0.5 ? "ADR not required." : "ADR required.",
      Math.random() > 0.5 ? "Tail lift needed." : "Standard loading/unloading.",
      Math.random() > 0.5 ? "Express delivery." : "Regular delivery.",
      Math.random() > 0.5 ? "High-value goods." : "Standard insurance.",
    ].join(" "),
    contact: `+${Math.floor(Math.random() * 50) + 30} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 9000000) + 1000000}`,
    offerContactEmail: "alteriontech@gmail.com",
    rating: parseFloat(rating),
  };
});

// Export a single offer for testing
export const sampleOffer = mockOffers[0]; 