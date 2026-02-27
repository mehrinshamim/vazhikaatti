"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Next.js
// @ts-expect-error - _getIconUrl is an internal property not typed in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface RouteOption {
  geometry: [number, number][]; // Array of [lat, lng]
  distance: number;
  duration: number;
}

export type Review = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  rating: number;
  location: string;
  coordinates: string | null;
  image_url: string | null;
  created_at: string;
};

function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const isFirstFly = useRef(true);

  useEffect(() => {
    if (position) {
      if (isFirstFly.current) {
        map.flyTo(position, 16, { animate: true, duration: 1.5 });
        isFirstFly.current = false;
      } else {
        map.panTo(position, { animate: true });
      }
    } else {
      isFirstFly.current = true;
    }
  }, [position, map]);
  return null;
}

function FitBounds({ bounds }: { bounds: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [bounds, map]);
  return null;
}

// Custom teardrop pin icon using inline HTML
function createPinIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">
        <div style="
          background:${color};
          color:white;
          font-size:10px;
          font-weight:700;
          font-family:sans-serif;
          padding:3px 8px;
          border-radius:20px;
          white-space:nowrap;
          margin-bottom:3px;
          line-height:1.4;
          box-shadow:0 1px 4px rgba(0,0,0,0.3)
        ">${label}</div>
        <div style="
          width:16px;
          height:16px;
          background:${color};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 1px 4px rgba(0,0,0,0.3)
        "></div>
      </div>
    `,
    iconSize: [60, 48],
    iconAnchor: [30, 48],
    popupAnchor: [0, -48],
  });
}

interface MapProps {
  position: [number, number] | null;
  routes?: RouteOption[];
  selectedRouteIndex?: number | null;
  onRouteSelect?: (index: number) => void;
  bounds?: [number, number][] | null;
  startPoint?: [number, number] | null;
  endPoint?: [number, number] | null;
  reviews?: Review[];
}

export default function Map({
  position,
  routes = [],
  selectedRouteIndex = null,
  onRouteSelect,
  bounds = null,
  startPoint = null,
  endPoint = null,
  reviews = [],
}: MapProps) {
  const defaultCenter: [number, number] = [10.0159, 76.3419]; // Kochi, Kerala
  const routeColors = ["#4F46E5", "#0D9488", "#E11D48"]; // Indigo, Teal, Rose

  const startIcon = createPinIcon("#16a34a", "Start");
  const endIcon = createPinIcon("#dc2626", "End");

  const getReviewIcon = (rating: number) => {
    if (rating <= 2) return createPinIcon("#ef4444", "!"); // Red
    if (rating === 3) return createPinIcon("#eab308", "!"); // Yellow
    return createPinIcon("#10b981", "!"); // Emerald
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={position || defaultCenter}
        zoom={position ? 16 : 13}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Live location marker */}
        {position && (
          <Marker position={position}>
            <Popup>You are here!</Popup>
          </Marker>
        )}

        {/* Start pin */}
        {startPoint && (
          <Marker position={startPoint} icon={startIcon}>
            <Popup>Start</Popup>
          </Marker>
        )}

        {/* End pin */}
        {endPoint && (
          <Marker position={endPoint} icon={endIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {/* Route polylines */}
        {routes.map((route, index) => {
          const isSelected = selectedRouteIndex === index;
          const isDimmed = selectedRouteIndex !== null && selectedRouteIndex !== index;
          if (isDimmed) return null;

          const color = isSelected ? "#4F46E5" : routeColors[index % routeColors.length];

          return (
            <Polyline
              key={index}
              positions={route.geometry}
              pathOptions={{
                color,
                weight: isSelected ? 6 : 5,
                opacity: isSelected ? 0.9 : 0.7,
                dashArray: isSelected ? undefined : "10, 10",
              }}
              eventHandlers={{
                click: () => onRouteSelect && onRouteSelect(index),
              }}
            />
          );
        })}

        {/* Review markers */}
        {reviews.map((review) => {
          if (!review.coordinates) return null;
          const [lat, lng] = review.coordinates.split(',').map(Number);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={review.id} position={[lat, lng]} icon={getReviewIcon(review.rating)}>
              <Popup>
                <div className="flex flex-col gap-2 min-w-[200px] font-sans">
                  {review.image_url && (
                    <img src={review.image_url} alt="Review" className="w-full h-32 object-cover rounded-lg" />
                  )}
                  <h3 className="font-bold text-gray-900 text-lg">{review.title}</h3>
                  <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{review.category}</span>
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      {review.rating}/5 <span className="text-yellow-500 text-sm">★</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 my-1">{review.description}</p>
                  <p className="text-xs text-gray-500 font-medium">📍 {review.location}</p>
                  <p className="text-[10px] text-gray-400 text-right mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <FlyToLocation position={position} />
        <FitBounds bounds={bounds} />
      </MapContainer>
    </div>
  );
}
