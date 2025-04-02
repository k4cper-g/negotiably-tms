'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import styles from './RoutePlanner.module.css';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMap, useMapEvents } from 'react-leaflet/hooks';
import debounce from 'lodash.debounce';

// Shadcn/ui component imports (adjust path if needed)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose, // Use DialogClose for cancel button
} from "@/components/ui/dialog";

// Simple Spinner Component
const Spinner = () => (
    <svg className={styles.spinner} viewBox="0 0 50 50">
        <circle className={styles.path} cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
    </svg>
);

// --- Leaflet Icon Fix ---
type IconDefault = L.Icon.Default & { _getIconUrl?: string };
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Dynamic imports
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer),{ ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer),{ ssr: false });
// Import Marker and Popup explicitly now
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

// Define custom purple icon using L.divIcon
const purpleIcon = L.divIcon({
    className: styles.purpleMarkerIcon, // Use a CSS module class
    html: `<div class="${styles.purpleMarkerPin}"></div>`, // Inner styled div
    iconSize: [16, 16], // Adjust size as needed
    iconAnchor: [8, 8], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -8] // Point from which the popup should open relative to the iconAnchor
});

// Interfaces
interface AddressSuggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}
interface Stop { id: string; name: string; address: string; lat: number; lng: number; }

// --- RouteLayer Component (Update Line Color) ---
interface RouteLayerProps { stops: Stop[]; }
const RouteLayer: React.FC<RouteLayerProps> = ({ stops }) => {
    const map = useMap();
    useEffect(() => {
        // Only draw route if 2+ stops exist
        if (!map || stops.length < 2) return;

        let routingControl: L.Routing.Control | null = null;
        try {
            const waypoints = stops.map(stop => L.latLng(stop.lat, stop.lng));
            if (!L.Routing) { return; }
            routingControl = L.Routing.control(({
                waypoints: waypoints,
                routeWhileDragging: true,
                show: false,
                addWaypoints: false,
                fitSelectedRoutes: true,
                lineOptions: { styles: [{ color: '#8b5cf6', opacity: 0.7, weight: 5 }], extendToWaypoints: false, missingRouteTolerance: 5 },
                createMarker: function() { return null; } 
            } as any)).addTo(map);
        } catch (error) { console.error("Error creating routing control:", error); }
        // Cleanup
        return () => { if (map && routingControl) { try { map.removeControl(routingControl); } catch (error) { console.error("Error removing routing control:", error); } } };
    }, [map, stops]); // Re-run when stops change
    return null; // Component doesn't render anything itself
};

// --- StaticStopItem Component (for Drag Overlay) ---
// Renders the visual representation without dnd hooks
interface StaticStopItemProps { stop: Stop; index?: number; }
function StaticStopItem({ stop, index }: StaticStopItemProps) {
    // Find the original index if not provided (might be needed if index changes during drag)
    const displayIndex = index !== undefined ? index + 1 : '?';
    return (
        <li className={`${styles.stopListItem} ${styles.dragOverlayItem}`}> {/* Add specific class for overlay styling */} 
            {/* No drag handle needed in overlay */}
            <span className={styles.dragHandlePlaceholder}></span> {/* Placeholder for layout consistency */}
            <div className={styles.stopInfo}><strong>{displayIndex}. {stop.name}</strong><span className={styles.stopAddress}>{stop.address}</span></div>
            {/* No delete button needed in overlay */}
            <span className={styles.deleteButtonPlaceholder}></span> {/* Placeholder for layout consistency */} 
        </li>
    );
}

// --- SortableStopItem Component ---
interface SortableStopItemProps { stop: Stop; index: number; onDelete: (id: string) => void; }
function SortableStopItem({ stop, index, onDelete }: SortableStopItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
    
    // Revert visibility change, use opacity for visual cue
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1, // Reduce opacity of original item when dragging
        // visibility: isDragging ? 'hidden' : 'visible',
    };

    return (
        <li ref={setNodeRef} style={style} className={styles.stopListItem} {...attributes}>
            <button {...listeners} className={styles.dragHandle} title="Drag to reorder">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
            <div className={styles.stopInfo}><strong>{index + 1}. {stop.name}</strong><span className={styles.stopAddress}>{stop.address}</span></div>
            <button onClick={() => onDelete(stop.id)} className={`${styles.button} ${styles.buttonDanger}`} title="Delete Stop">&times;</button>
        </li>
    );
}

// --- MapEventHandler Component (Handles Double Click) ---
interface MapEventHandlerProps {
    onMapDblClick: (latlng: LatLng) => void;
}
function MapEventHandler({ onMapDblClick }: MapEventHandlerProps) {
    useMapEvents({
        dblclick(e) { // Changed from click to dblclick
            // Call our handler first
            onMapDblClick(e.latlng);
            // Then stop the event from propagating further (prevents default highlight)
            L.DomEvent.stopPropagation(e);
        },
    });
    return null;
}

// --- Main Page Component ---
const RoutePlanningPage = () => {
  const defaultPosition: [number, number] = [51.505, -0.09];
  const [stops, setStops] = useState<Stop[]>([
    { id: '1', name: 'Warehouse A', address: '123 Industrial Way', lat: 51.51, lng: -0.1 },
    { id: '2', name: 'Customer B', address: '456 Commercial Rd', lat: 51.505, lng: -0.08 },
    { id: '3', name: 'Depot C', address: '789 Logistics Ave', lat: 51.495, lng: -0.12 },
  ]);
  const [newStopForm, setNewStopForm] = useState({ name: '', address: '' });
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingMapClick, setIsLoadingMapClick] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // State for the name input dialog
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [dialogStopName, setDialogStopName] = useState("");
  const [pendingStopDetails, setPendingStopDetails] = useState<{ latlng: LatLng; address: string } | null>(null);

  // State for drag overlay
  const [activeDragItem, setActiveDragItem] = useState<Stop | null>(null);

  // --- API Functions (fetchAddressSuggestions, geocodeAddress, reverseGeocodeCoords) ---
  const fetchAddressSuggestions = async (query: string) => {
    if (!query || query.length < 3) { setAddressSuggestions([]); setShowSuggestions(false); setIsLoadingSuggestions(false); return; }
    setIsLoadingSuggestions(true); setShowSuggestions(true);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'YourTMSApp/1.0 (your-contact@example.com)' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: AddressSuggestion[] = await response.json();
        setAddressSuggestions(data);
    } catch (error) { console.error("Address suggestion fetch error:", error); setAddressSuggestions([]); }
    finally { setIsLoadingSuggestions(false); }
  };
  const debouncedFetchSuggestions = useCallback(debounce(fetchAddressSuggestions, 300), []);
  async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | { error: string }> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    try { const response = await fetch(url, { headers: { 'User-Agent': 'YourTMSApp/1.0 (your-contact@example.com)' } }); if (!response.ok) { if (response.status === 429) return { error: "Too many requests. Please wait and try again." }; return { error: `Geocoding failed (HTTP ${response.status})` }; } const data = await response.json(); if (data && data.length > 0) { const { lat, lon } = data[0]; const parsedLat = parseFloat(lat); const parsedLng = parseFloat(lon); if (!isNaN(parsedLat) && !isNaN(parsedLng)) { return { lat: parsedLat, lng: parsedLng }; } } return { error: `Address not found: ${address}` }; } catch (error) { console.error("Geocoding fetch error:", error); return { error: "Geocoding request failed. Check connection." }; }
  }
  async function reverseGeocodeCoords(latlng: LatLng): Promise<{ address: string } | { error: string }> {
    const { lat, lng } = latlng; const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    try { const response = await fetch(url, { headers: { 'User-Agent': 'YourTMSApp/1.0 (your-contact@example.com)' } }); if (!response.ok) { if (response.status === 429) return { error: "Too many requests. Please wait and try again." }; return { error: `Reverse geocoding failed (HTTP ${response.status})` }; } const data = await response.json(); if (data && data.display_name) { return { address: data.display_name }; } else { return { error: `Could not find address for ${lat.toFixed(4)}, ${lng.toFixed(4)}` }; } } catch (error) { console.error("Reverse geocoding fetch error:", error); return { error: "Reverse geocoding request failed. Check connection." }; }
  }

  // --- Event Handlers ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target; setNewStopForm(prev => ({ ...prev, [name]: value })); setFormError(null);
    if (name === 'address') {
        if (value.trim().length > 0) { debouncedFetchSuggestions(value); }
        else { debouncedFetchSuggestions.cancel(); setAddressSuggestions([]); setShowSuggestions(false); setIsLoadingSuggestions(false); }
    }
  };
  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setNewStopForm(prev => ({ ...prev, address: suggestion.display_name }));
    setAddressSuggestions([]); setShowSuggestions(false); addressInputRef.current?.focus();
  };
  const handleAddressBlur = () => { setTimeout(() => { setShowSuggestions(false); }, 150); };

  // Add Stop Handlers
  const addStopFromForm = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null); setShowSuggestions(false); setAddressSuggestions([]);
    if (!newStopForm.name || !newStopForm.address) { setFormError("Please fill in both name and address."); return; }
    setIsLoadingAddress(true); const result = await geocodeAddress(newStopForm.address); setIsLoadingAddress(false);
    if ('error' in result) { setFormError(result.error); }
    else { const newStopData: Stop = { id: Date.now().toString(), name: newStopForm.name, address: newStopForm.address, lat: result.lat, lng: result.lng };
           setStops(prevStops => [...prevStops, newStopData]); setNewStopForm({ name: '', address: '' }); }
  };
  // Map double-click handler: Opens the dialog
  const handleMapDblClick = async (latlng: LatLng) => {
    if (isLoadingAddress || isLoadingMapClick) return; setMapError(null); setIsLoadingMapClick(true);
    document.getElementById('map-container')?.classList.add(styles.mapLoading);
    const result = await reverseGeocodeCoords(latlng);
    setIsLoadingMapClick(false); document.getElementById('map-container')?.classList.remove(styles.mapLoading);

    if ('error' in result) {
        setMapError(result.error);
        alert(result.error); // Keep temporary alert for geocoding errors
    } else {
        console.log("[handleMapDblClick] Reverse geocoding success. Setting pending details and opening dialog.");
        // Store details and open dialog
        setPendingStopDetails({ latlng, address: result.address });
        setDialogStopName(""); // Clear previous name input
        setIsNameDialogOpen(true);
        // Don't call prompt anymore
    }
  };
  const deleteStop = (stopId: string) => { setStops(prevStops => prevStops.filter(stop => stop.id !== stopId)); };

  // Dialog submission handler: Creates the stop
  const handleNameDialogSubmit = () => {
      if (!pendingStopDetails || !dialogStopName.trim()) {
          // Basic validation - could add visual feedback in dialog later
          console.error("Cannot add stop without details or name.");
          return;
      }

      const newStopData: Stop = {
          id: Date.now().toString(),
          name: dialogStopName.trim(), // Use name from dialog state
          address: pendingStopDetails.address,
          lat: pendingStopDetails.latlng.lat,
          lng: pendingStopDetails.latlng.lng
      };
      setStops(prevStops => [...prevStops, newStopData]);

      // Close dialog and clear state
      setIsNameDialogOpen(false);
      setPendingStopDetails(null);
      setDialogStopName("");
  };

  // Handle closing the dialog (e.g., clicking outside or Cancel)
   const handleDialogClose = () => {
        setIsNameDialogOpen(false);
        setPendingStopDetails(null);
        setDialogStopName("");
    };

  // Drag and Drop Handler
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  
  function handleDragStart(event: DragStartEvent) {
      const { active } = event;
      const draggedItem = stops.find(stop => stop.id === active.id);
      if (draggedItem) {
          setActiveDragItem(draggedItem);
      }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setStops((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveDragItem(null); // Clear active item
  }

  function handleDragCancel() {
      setActiveDragItem(null); // Clear active item on cancel
  }

  // Export to Google Maps Handler
  const handleExportToGoogleMaps = () => {
    if (stops.length < 2) {
      alert("Please add at least two stops to generate a route.");
      return;
    }

    // Format stops as lat,lng joined by /
    const waypointsString = stops
      .map(stop => `${stop.lat},${stop.lng}`)
      .join('/');

    const googleMapsUrl = `https://www.google.com/maps/dir/${waypointsString}`;

    // Open in new tab
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  // --- Render ---
  console.log("[RoutePlanningPage Render] isNameDialogOpen:", isNameDialogOpen);
  return (
    <div className={styles.pageContainer}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToVerticalAxis]}
      >
        <div className={styles.leftPanel}>
          {/* Controls Section */} 
          <div className={styles.controlsSection}>
              <h2>Route Controls</h2>
              <form onSubmit={addStopFromForm} className={styles.addStopForm}>
                <input type="text" name="name" placeholder="Stop Name" value={newStopForm.name} onChange={handleFormChange}
                       required className={styles.inputField} disabled={isLoadingAddress || isLoadingMapClick}
                       aria-invalid={!!formError} aria-describedby="form-error-message" />
                <div className={styles.addressInputContainer}>
                  <input ref={addressInputRef} type="text" name="address" placeholder="Address" value={newStopForm.address}
                         onChange={handleFormChange} onBlur={handleAddressBlur} required className={styles.inputField}
                         disabled={isLoadingAddress || isLoadingMapClick} aria-invalid={!!formError}
                         aria-describedby="form-error-message" autoComplete="off" />
                  {showSuggestions && (
                      <ul className={styles.suggestionsList}>
                          {isLoadingSuggestions && <li className={styles.suggestionItemLoading}>Loading...</li>}
                          {!isLoadingSuggestions && addressSuggestions.length === 0 && newStopForm.address.length >= 3 && (
                              <li className={styles.suggestionItem}>No suggestions found</li> )}
                          {!isLoadingSuggestions && addressSuggestions.map((suggestion) => (
                              <li key={suggestion.place_id} className={styles.suggestionItem} onMouseDown={() => handleSuggestionClick(suggestion)}>
                                  {suggestion.display_name}
                              </li> ))}
                      </ul> )}
                </div>
                {formError && <p id="form-error-message" className={styles.errorMessage}>{formError}</p>}
                <button type="submit" className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonWithSpinner}`}
                        disabled={isLoadingAddress || isLoadingMapClick || !newStopForm.address || !newStopForm.name}>
                  {isLoadingAddress ? <Spinner /> : 'Add Stop'}
                </button>
              </form>
              
              {/* Add Export Button Here */} 
              <Button 
                variant="secondary" 
                onClick={handleExportToGoogleMaps} 
                disabled={stops.length < 2} 
                className="mt-4" // Add some margin top
                title={stops.length < 2 ? "Add at least two stops to export" : "Open route in Google Maps"}
              >
                Export to Google Maps
              </Button>

          </div>
          {/* Stop List Section */}
          <SortableContext items={stops} strategy={verticalListSortingStrategy}>
            <div className={styles.stopListSection}>
                <h3>Stops ({stops.length})</h3>
                {stops.length === 0 ? <p className={styles.emptyListText}>No stops added yet.</p> : (
                    <ul className={styles.stopList}>
                        {stops.map((stop, index) => (
                            <SortableStopItem key={stop.id} stop={stop} index={index} onDelete={deleteStop} /> ))}
                    </ul> )}
            </div>
          </SortableContext>
        </div>

        {/* Drag Overlay - Rendered outside the normal flow */} 
        <DragOverlay>
            {activeDragItem ? (
                 <StaticStopItem stop={activeDragItem} />
             ) : null}
        </DragOverlay>
      </DndContext>

      {/* Map Section */}
      <div id="map-container" className={styles.mapPanel}>
        <MapContainer 
          center={defaultPosition} 
          zoom={13} 
          doubleClickZoom={false}
          className={styles.mapContainer}
        >
          <TileLayer 
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          />
          {/* Render explicit markers with custom purple icon */}
          {stops.map(stop => (
              <Marker 
                key={`marker-${stop.id}`} 
                position={[stop.lat, stop.lng]} 
                draggable={false}
                icon={purpleIcon} // Apply the custom icon
              >
                  <Popup>
                      <b>{stop.name}</b><br />{stop.address}
                  </Popup>
              </Marker>
          ))}
          {/* Render route line only if there are enough stops */}
          {stops.length >= 2 && <RouteLayer stops={stops} />}
          {/* Attach map event handler */} 
          <MapEventHandler onMapDblClick={handleMapDblClick} />
        </MapContainer>
      </div>

      {/* Name Input Dialog */} 
      <Dialog open={isNameDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className={`sm:max-w-[425px] ${styles.dialogContent} ${styles.dialogOverlay}`}>
              <DialogHeader>
                  <DialogTitle>Name New Stop</DialogTitle>
                  <DialogDescription>
                      Enter a name for the stop located at: <br />
                      <span className={styles.dialogAddress}>{pendingStopDetails?.address ?? 'Loading address...'}</span>
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="stop-name" className="text-right">
                          Name
                      </Label>
                      <Input
                          id="stop-name"
                          value={dialogStopName}
                          onChange={(e) => setDialogStopName(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g., Customer Site X"
                      />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleNameDialogSubmit} disabled={!dialogStopName.trim()}>
                      Add Stop
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutePlanningPage;