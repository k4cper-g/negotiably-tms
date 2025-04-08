export interface TransportOffer {
  id: string;
  origin: string;
  originCoords: string;
  destination: string;
  destinationCoords: string;
  distance: string;
  price: string;
  pricePerKm: string;
  carrier: string;
  loadType: string;
  vehicle: string;
  weight: string;
  dimensions: string;
  loadingDate: string;
  deliveryDate: string;
  status: string;
  platform: string;
  lastUpdated: string;
  dateCreated: string;
  description: string;
  contact: string;
  offerContactEmail?: string;
  rating: number;
} 