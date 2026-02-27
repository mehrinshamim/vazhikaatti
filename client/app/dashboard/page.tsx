"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Map to avoid SSR window issues with leaflet
const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-screen items-center justify-center bg-gray-900">
      <span className="text-xl font-semibold text-white/50">Loading Map...</span>
    </div>
  ),
});

export default function DashboardPage() {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation([position.coords.latitude, position.coords.longitude]);
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location: ", error);
        alert("Could not get your location. Please check browser permissions.");
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
      }
    );
  };

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* Map filling the entire screen */}
      <div className="absolute inset-0 z-0 bg-gray-900">
        <Map position={location} />
      </div>

      {/* Floating Button */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-[1000] flex flex-col items-center">
        <button
          onClick={handleEnableLocation}
          disabled={loadingLocation}
          className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-full shadow-2xl transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2 backdrop-blur-md"
        >
          {loadingLocation ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Locating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Enable My Location
            </>
          )}
        </button>
      </div>
    </main>
  );
}
