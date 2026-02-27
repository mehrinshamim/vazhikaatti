"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

function FlyToLocation({ position }: { position: L.LatLngExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { animate: true, duration: 2 });
    }
  }, [position, map]);
  return null;
}

export default function Map({ position }: { position: [number, number] | null }) {
  // Default center roughly around India
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={position || defaultCenter}
        zoom={position ? 16 : 5}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && (
          <Marker position={position}>
            <Popup>You are here!</Popup>
          </Marker>
        )}
        <FlyToLocation position={position} />
      </MapContainer>
    </div>
  );
}
