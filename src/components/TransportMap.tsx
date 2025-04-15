"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useTheme } from 'next-themes';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, ExternalLink, Map } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the structure for a transport offer
interface TransportOffer {
  id: string;
  origin: string;
  originCoords: string;
  destination: string;
  destinationCoords: string;
  distance: string;
  price: string;
  platform: string;
  // Include other properties as needed
}

// Define marker structure
interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  icon: string;
  offer: TransportOffer;
}

// Define route structure
interface MapRoute {
  id: string;
  positions: [number, number][];
  color: string;
  offer: TransportOffer;
  isProcessing: boolean;
}

// Helper to extract coordinates from string format
const extractCoordinates = (coordString: string): [number, number] | null => {
  const match = coordString.match(/(\d+\.\d+)°\s*([NS]),\s*(\d+\.\d+)°\s*([EW])/);
  if (!match) return null;

  let lat = parseFloat(match[1]);
  if (match[2] === "S") lat = -lat;
  
  let lng = parseFloat(match[3]);
  if (match[4] === "W") lng = -lng;
  
  return [lat, lng];
};

// Enhanced color generator for routes with more vibrant colors
const getRouteColor = (index: number): string => {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f97316", // orange
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#eab308", // yellow
    "#ef4444", // red
  ];
  return colors[index % colors.length];
};

// Function to create arrow markers for routes
const createArrowMarker = (position: [number, number], angle: number, color: string): L.Marker => {
  const arrowIcon = L.divIcon({
    className: "route-arrow-icon",
    html: `<div style="transform: rotate(${angle}deg); color: ${color};">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  
  return L.marker(position, { icon: arrowIcon, interactive: false });
};

// Simple cache for routes to avoid redundant API calls
const routeCache: Record<string, [number, number][]> = {};

// Function to fetch road routes from OSRM with caching
const fetchRoute = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
  // Generate a cache key based on coordinates
  const cacheKey = `${start[0]},${start[1]}_${end[0]},${end[1]}`;
  
  // Check if route is already in cache
  if (routeCache[cacheKey]) {
    return routeCache[cacheKey];
  }
  
  // Format coordinates for OSRM: longitude,latitude
  const startFormatted = `${start[1]},${start[0]}`;
  const endFormatted = `${end[1]},${end[0]}`;

  try {
    // Call OSRM routing service
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startFormatted};${endFormatted}?overview=full&geometries=geojson`
    );
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('Failed to get route:', data);
      // Fallback to straight line if route can't be calculated
      return [start, end];
    }

    // Extract the coordinates from the response
    const coordinates = data.routes[0].geometry.coordinates;
    
    // OSRM returns coordinates as [longitude, latitude], but Leaflet expects [latitude, longitude]
    const routeCoords = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
    
    // Cache the route
    routeCache[cacheKey] = routeCoords;
    
    return routeCoords;
    
  } catch (error) {
    console.error('Error fetching route:', error);
    // Fallback to straight line if request fails
    return [start, end];
  }
};

// Map bounds adjuster
function MapBoundsAdjuster({ markers }: { markers: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, markers]);
  
  return null;
}

// Route decorators (arrows)
function RouteDecorators({ routes }: { routes: MapRoute[] }) {
  const map = useMap();
  
  useEffect(() => {
    // Clear existing arrows
    map.eachLayer((layer) => {
      if ((layer as any)._isRouteArrow) {
        map.removeLayer(layer);
      }
    });
    
    // Add new arrows
    const arrows: L.Marker[] = [];
    
    routes.forEach(route => {
      if (route.positions.length < 2) return;
      
      // Add arrows at regular intervals along the route
      const positions = route.positions;
      
      // Only add a few arrows (start, middle, near end)
      const arrowPositions = [
        Math.floor(positions.length * 0.25),
        Math.floor(positions.length * 0.5),
        Math.floor(positions.length * 0.75)
      ];
      
      arrowPositions.forEach(posIndex => {
        if (posIndex > 0 && posIndex < positions.length) {
          const p1 = positions[posIndex - 1];
          const p2 = positions[posIndex];
          
          // Calculate angle
          const angleRad = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
          const angleDeg = (angleRad * 180) / Math.PI;
          
          // Create arrow marker
          const arrow = createArrowMarker(positions[posIndex], angleDeg + 90, route.color);
          (arrow as any)._isRouteArrow = true;
          arrows.push(arrow);
          arrow.addTo(map);
        }
      });
    });
    
    return () => {
      // Clean up on unmount
      arrows.forEach(arrow => {
        map.removeLayer(arrow);
      });
    };
  }, [map, routes]);
  
  return null;
}


// Full screen button component
function FullscreenButton() {
  const map = useMap();
  
  const toggleFullscreen = () => {
    const container = map.getContainer();
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  return (
    <div 
      onClick={toggleFullscreen}
      className="leaflet-control cursor-pointer shadow-md rounded-md overflow-hidden"
      style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000 }}
    >
      <button 
        className="flex items-center justify-center h-9 w-9 bg-card hover:bg-muted transition-colors"
        title="Toggle fullscreen map view"
        onClick={(e) => e.preventDefault()}
      >
        <Map className="h-5 w-5 text-foreground" />
      </button>
    </div>
  );
}

interface TransportMapProps {
  offers: TransportOffer[];
  selectedOfferId: string | null;
  onRouteSelect?: (offerId: string) => void;
  onOpenDetails?: (offerId: string) => void;
  interactionEnabled?: boolean; // Default to true
}

// Main component
const TransportMap = ({ 
  offers, 
  selectedOfferId, 
  onRouteSelect,
  onOpenDetails,
  interactionEnabled = true // Use the new prop
}: TransportMapProps) => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [routes, setRoutes] = useState<MapRoute[]>([]);
  const [processedRoutes, setProcessedRoutes] = useState<MapRoute[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRoutes, setProcessingRoutes] = useState<string[]>([]);
  const { resolvedTheme } = useTheme();
  // Remove manual map ref and initialization state
  // const mapRef = useRef<L.Map | null>(null);
  // const [mapInitialized, setMapInitialized] = useState(false);

  // Remove manual map initialization useEffect
  /*
  useEffect(() => {
    if (mapRef.current === null && typeof window !== 'undefined') {
      const map = L.map('map', {
        center: [51.1657, 10.4515], // Center of Germany
        zoom: 6,
        scrollWheelZoom: interactionEnabled, // Use prop
        dragging: interactionEnabled, // Use prop
        zoomControl: interactionEnabled, // Use prop
        doubleClickZoom: interactionEnabled, // Use prop
        touchZoom: interactionEnabled, // Use prop
        boxZoom: interactionEnabled, // Use prop
        keyboard: interactionEnabled, // Use prop
      });
      mapRef.current = map;
      setMapInitialized(true);
    }
  }, [interactionEnabled]);
  */

  // Remove the useEffect that tried to toggle interactions on the manual ref
  /*
  useEffect(() => {
    if (mapRef.current) {
      // ... logic to enable/disable based on interactionEnabled ...
    }
  }, [interactionEnabled]);
  */

  useEffect(() => {
    // Process the offers to extract coordinates for markers and routes
    const newMarkers: MapMarker[] = [];
    const initialRoutes: MapRoute[] = [];
    
    offers.forEach((offer, index) => {
      const originCoords = extractCoordinates(offer.originCoords);
      const destCoords = extractCoordinates(offer.destinationCoords);
      
      if (originCoords && destCoords) {
        // Add origin marker
        newMarkers.push({
          id: `${offer.id}-origin`,
          position: originCoords,
          title: offer.origin,
          icon: "origin",
          offer
        });
        
        // Add destination marker
        newMarkers.push({
          id: `${offer.id}-dest`,
          position: destCoords,
          title: offer.destination,
          icon: "destination",
          offer
        });
        
        // Add initial route (will be replaced with real road route)
        initialRoutes.push({
          id: offer.id,
          positions: [originCoords, destCoords],
          color: getRouteColor(index),
          offer,
          isProcessing: true
        });
      }
    });
    
    setMarkers(newMarkers);
    setRoutes(initialRoutes);
    setProcessedRoutes([]);
    setShowRoutes(false);
    setIsLoaded(true);

    // Calculate actual road routes if we have routes to calculate
    if (initialRoutes.length > 0) {
      calculateRoadRoutes(initialRoutes);
    }
  }, [offers]);

  // Function to calculate actual road routes (optimized with batch processing)
  const calculateRoadRoutes = async (initialRoutes: MapRoute[]) => {
    setIsCalculatingRoutes(true);
    
    const updatedRoutes: MapRoute[] = [...initialRoutes];
    const batchSize = 3; // Number of simultaneous requests
    
    try {
      // Process routes in batches to optimize loading time while preventing rate limiting
      for (let i = 0; i < initialRoutes.length; i += batchSize) {
        const batch = initialRoutes.slice(i, i + batchSize);
        
        // Process each batch in parallel
        await Promise.all(
          batch.map(async (route, batchIndex) => {
            const index = i + batchIndex;
            if (index >= initialRoutes.length) return;
            
            // Get start and end points
            const start = route.positions[0];
            const end = route.positions[route.positions.length - 1];
            
            try {
              // Get road route
              const roadRoute = await fetchRoute(start, end);
              
              // Update route with road coordinates
              updatedRoutes[index] = {
                ...route,
                positions: roadRoute,
                isProcessing: false
              };
            } catch (error) {
              console.error(`Error calculating route for ${route.id}:`, error);
              updatedRoutes[index].isProcessing = false;
            }
          })
        );
        
        // Small delay between batches to avoid overwhelming the service
        if (i + batchSize < initialRoutes.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Set processed routes and display them
      setProcessedRoutes(updatedRoutes);
      setShowRoutes(true);
    } catch (error) {
      console.error("Error processing routes:", error);
    } finally {
      setIsCalculatingRoutes(false);
    }
  };
  
  // Create custom icons with enhanced styling
  const originIcon = L.divIcon({
    className: "custom-div-icon origin-icon",
    html: `
      <div class="marker-pin" style="
        background-color: #3b82f6;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 6px;
          height: 6px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
  
  const destinationIcon = L.divIcon({
    className: "custom-div-icon destination-icon",
    html: `
      <div class="marker-pin" style="
        background-color: #10b981;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 6px;
          height: 6px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  // Get all bounds for initial view
  const allPositions = markers.map(marker => marker.position);
  
  // Add function to handle route clicks
  const handleRouteClick = (offerId: string) => {
    if (onRouteSelect) {
      onRouteSelect(offerId);
    }
  };

  // Render map only after mount (client-side)
  if (!isLoaded) {
    return <div className="h-[60vh] flex items-center justify-center bg-muted">Loading map...</div>;
  }

  // Determine map theme based on the *resolved* theme
  const mapTheme = resolvedTheme === 'dark' ? 'dark' : 'light'; 
  
  // Define Tile Layer URLs (using the correct light_all)
  const tileLayers = {
    light: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", 
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  };

  const currentTileLayer = tileLayers[mapTheme];

  return (
    <>
      
      {isLoaded && (
        <div className={cn(
             "relative w-full h-full min-h-[500px] rounded-lg overflow-hidden shadow-md border", 
             mapTheme === 'dark' ? 'dark-map' : 'light-map'
           )}>
          {isCalculatingRoutes && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm py-2 px-4 rounded-full shadow-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">Calculating routes ({processedRoutes.filter(r => !r.isProcessing).length}/{routes.length})</span>
              </div>
            </div>
          )}
          <MapContainer 
            style={{ height: "100%", width: "100%" }}
            center={[51.505, -0.09]} // Initial center, will be adjusted by MapBoundsAdjuster
            zoom={5} // Initial zoom
            // Pass interaction props directly to MapContainer
            scrollWheelZoom={interactionEnabled}
            dragging={interactionEnabled}
            zoomControl={false} // Explicitly disable zoom controls
            doubleClickZoom={interactionEnabled}
            touchZoom={interactionEnabled}
            boxZoom={interactionEnabled}
            keyboard={interactionEnabled}
            className="z-0"
          >
            {/* Conditionally render TileLayer based on theme */}
            <TileLayer 
              key={mapTheme}
              attribution={currentTileLayer.attribution}
              url={currentTileLayer.url} 
            />
            
            {/* Routes - only show when all are processed */}
            {showRoutes && processedRoutes.map((route) => {
              const isSelected = selectedOfferId === route.id;
              const isOtherSelected = selectedOfferId !== null && selectedOfferId !== route.id;
              
              return (
                <Polyline
                  key={route.id}
                  positions={route.positions}
                  pathOptions={{ 
                    color: route.color, 
                    weight: isSelected ? 6 : 5, 
                    opacity: isSelected ? 1 : isOtherSelected ? 0.3 : 0.8,
                    lineCap: 'round',
                    lineJoin: 'round',
                    className: isSelected ? 'route-line route-line-selected' : 'route-line'
                  }}
                  eventHandlers={{
                    click: () => handleRouteClick(route.id)
                  }}
                >
                  <Popup className="route-popup">
                    <div className="p-2 space-y-3">
                      <div className="font-medium text-base border-b pb-1 flex items-center justify-between">
                        <span>{route.offer.id}</span>
                        <Badge variant="outline" className="text-xs">{route.offer.platform}</Badge>
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm">{route.offer.origin}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <span className="text-sm">{route.offer.destination}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">Distance:</span>
                          <div>{route.offer.distance}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Price:</span>
                          <div className="font-semibold">{route.offer.price}</div>
                        </div>
                      </div>
                      <div className="pt-1 flex justify-end">
                        <Button 
                          size="sm" 
                          className="gap-1"
                          onClick={() => onOpenDetails && onOpenDetails(route.offer.id)}
                        >
                          View Details
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Polyline>
              );
            })}
            
            {/* Add route decorators */}
            {showRoutes && <RouteDecorators routes={processedRoutes} />}
            
            {/* Markers */}
            {markers.map((marker) => {
              const isSelected = selectedOfferId === marker.offer.id;
              const isOtherSelected = selectedOfferId !== null && selectedOfferId !== marker.offer.id;
              
              return (
                <Marker
                  key={marker.id}
                  position={marker.position}
                  icon={marker.icon === "origin" ? originIcon : destinationIcon}
                  opacity={isSelected ? 1 : isOtherSelected ? 0.4 : 1}
                  eventHandlers={{
                    click: () => handleRouteClick(marker.offer.id)
                  }}
                >
                  <Popup>
                    <div className="font-medium">{marker.title}</div>
                    <div className="text-sm text-muted-foreground">{marker.icon === "origin" ? "Origin" : "Destination"}</div>
                  </Popup>
                </Marker>
              );
            })}
            
            {/* Only show fullscreen button */}
            {interactionEnabled && <FullscreenButton />} {/* Only show if interactions are enabled */}
            
            {/* Adjust bounds to fit all markers */}
            {allPositions.length > 0 && <MapBoundsAdjuster markers={allPositions} />}
          </MapContainer>
          
          {/* Add custom CSS for route animations and highlighting */}
          <style jsx global>{`
            /* Basic dark mode adjustments for map controls/popups if needed */
            .dark-map .leaflet-control-attribution {
              background: rgba(0, 0, 0, 0.7) !important;
              color: #ccc !important;
            }
            .dark-map .leaflet-popup-content-wrapper, 
            .dark-map .leaflet-popup-tip {
              background: #333 !important; /* Example dark background */
              color: #eee !important; /* Example dark text color */
              box-shadow: 0 3px 14px rgba(0,0,0,0.4);
            }
            .dark-map .leaflet-popup-close-button {
              color: #ccc !important;
            }
             /* Style marker pins for dark mode */
            .dark-map .marker-pin {
               border-color: #444; /* Darker border */ 
            }
            .dark-map .marker-pin > div {
               background-color: #bbb; /* Adjust inner dot */ 
            }
            
            .route-line {
              transition: all 0.3s ease;
              stroke-dasharray: none;
            }
            
            .route-line:hover {
              stroke-width: 6px !important;
              opacity: 1 !important;
            }
            
            .route-line-selected {
              stroke-width: 6px !important;
              opacity: 1 !important;
              filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.5));
            }
            
            .marker-pin {
              transition: transform 0.2s ease;
            }
            
            .leaflet-marker-icon:hover .marker-pin {
              transform: scale(1.2);
            }
          `}</style>
        </div>
      )}
    </>
  );
}

export default TransportMap; 