"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LocationPickerMapProps {
  onConfirm: (result: { lat: number; lng: number; locationName: string }) => void;
  onCancel: () => void;
}

export default function LocationPickerMap({ onConfirm, onCancel }: LocationPickerMapProps) {
  const [pinPosition, setPinPosition] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState("");
  const [isReversing, setIsReversing] = useState(false);

  const handleMapClick = async (lat: number, lng: number) => {
    setPinPosition([lat, lng]);
    setIsReversing(true);
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setLocationName(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setLocationName(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
    setIsReversing(false);
  };

  const handleConfirm = () => {
    if (!pinPosition) return;
    onConfirm({ lat: pinPosition[0], lng: pinPosition[1], locationName });
  };

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm bg-white">
        <div>
          <h3 className="font-bold text-gray-800 text-base">Pin Location on Map</h3>
          <p className="text-xs text-gray-500 mt-0.5">Tap anywhere on the map to place a pin</p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden" style={{ cursor: "crosshair" }}>
        <MapContainer
          center={[10.0159, 76.3419]}
          zoom={14}
          className="w-full h-full"
          style={{ height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {pinPosition && <Marker position={pinPosition} />}
        </MapContainer>
      </div>

      {/* Bottom bar */}
      <div className="bg-white border-t border-gray-200 shadow-lg px-4 py-4">
        {pinPosition ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              <span className="text-emerald-500 text-base mt-0.5 shrink-0">📍</span>
              {isReversing ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="animate-spin h-4 w-4 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting location name...
                </div>
              ) : (
                <span className="text-sm text-gray-700 font-medium leading-snug">{locationName}</span>
              )}
            </div>
            <button
              onClick={handleConfirm}
              disabled={isReversing}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
            >
              Confirm Location
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 py-2 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
            Tap the map to place a pin
          </p>
        )}
      </div>
    </div>
  );
}
