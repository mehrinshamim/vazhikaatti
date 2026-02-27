"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { RouteOption } from "./Map";
import { supabase } from "../utils/supabase";
import ReportIssueModal from "./ReportIssueModal";
import PfpCreat from "./pfpcreate";
import Sidebar from "./Sidebar";

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

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-screen items-center justify-center bg-gray-900">
      <span className="text-xl font-semibold text-white/50">Loading Map...</span>
    </div>
  ),
});

// Helper component for Location Autocomplete
interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

function LocationAutocomplete({
  placeholder,
  resetKey,
  onSelect
}: {
  placeholder: string;
  resetKey: number;
  onSelect: (location: { name: string; lat: number; lon: number } | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLocations = async (search: string) => {
    if (search.length < 3) {
      setResults([]);
      return;
    }
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(search)}`,
        { signal: abortControllerRef.current.signal }
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        console.error("Autocomplete failed", e);
      }
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);
    onSelect(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLocations(val);
    }, 300);
  };

  const handleSelect = (place: NominatimPlace) => {
    setQuery(place.display_name);
    onSelect({
      name: place.display_name,
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon)
    });
    setShowDropdown(false);
    setResults([]);
  };

  return (
    <div key={resetKey} className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (query.length >= 3) setShowDropdown(true); }}
        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400 text-gray-800 text-sm"
      />
      {isLoading && (
        <div className="absolute right-3 top-2.5">
          <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      {showDropdown && results.length > 0 && (
        <ul className="absolute z-[2000] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((place, idx) => (
            <li
              key={idx}
              onMouseDown={() => handleSelect(place)}
              className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b last:border-0 text-xs text-gray-700"
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [profileLoading, setProfileLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    about_me: "",
  });

  const [location, setLocation] = useState<[number, number] | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Journey States
  const [showJourneyPanel, setShowJourneyPanel] = useState(false);
  const [startPlace, setStartPlace] = useState<{ name: string, lat: number, lon: number } | null>(null);
  const [destPlace, setDestPlace] = useState<{ name: string, lat: number, lon: number } | null>(null);
  const [isFetchingRoutes, setIsFetchingRoutes] = useState(false);
  const [inputResetKey, setInputResetKey] = useState(0);

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [mapBounds, setMapBounds] = useState<[number, number][] | null>(null);

  // Issues / Reviews State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("review")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data);
    } else {
      console.error("Failed to fetch reviews", error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setProfileLoading(false);
        return;
      }

      setUserId(session.user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error || !profile) {
        setNeedsProfile(true);
        setProfileForm((prev) => ({
          ...prev,
          full_name: session.user.user_metadata?.full_name || "",
          email: session.user.email || "",
        }));
      } else {
        setProfileForm(profile);
      }
      setProfileLoading(false);
    };
    checkProfile();
  }, []);


  // Clean up the geolocation watch
  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  const findRoutes = async () => {
    if (!startPlace || !destPlace) {
      alert("Please select both start and destination locations from the dropdowns.");
      return;
    }

    setIsFetchingRoutes(true);
    // Reset previous selection and tracking if active
    if (isTracking && watchId !== null) stopTracking();
    setRoutes([]);
    setSelectedRouteIndex(null);
    setMapBounds(null);

    // Call OpenRouteService (GeoJSON format)
    const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
    if (!apiKey) {
      alert("OpenRouteService API Key is missing.");
      setIsFetchingRoutes(false);
      return;
    }

    try {
      // ORS API expects Longitude, Latitude arrays
      const body = {
        coordinates: [[startPlace.lon, startPlace.lat], [destPlace.lon, destPlace.lat]],
        alternative_routes: { target_count: 3 }
      };

      const res = await fetch("https://api.openrouteservice.org/v2/directions/foot-hiking/geojson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
          "Authorization": apiKey
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.error) {
        alert("Routing Error: " + data.error.message);
        setIsFetchingRoutes(false);
        return;
      }

      if (data.features && data.features.length > 0) {
        const fetchedRoutes: RouteOption[] = data.features.map(
          (feature: { geometry: { coordinates: [number, number][] }, properties: { summary: { distance: number, duration: number } } }) => ({
            geometry: feature.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]), // GeoJSON is [lon,lat], Leaflet needs [lat,lon]
            distance: feature.properties.summary.distance,
            duration: feature.properties.summary.duration,
          }));

        setRoutes(fetchedRoutes);

        // Accumulate all bounds to fit map
        const allBounds: [number, number][] = [];
        fetchedRoutes.forEach(r => allBounds.push(...r.geometry));
        setMapBounds(allBounds);
      } else {
        alert("No routes found between these locations.");
      }

    } catch (e) {
      console.error("Routing error", e);
      alert("An error occurred fetching the routes.");
    }

    setIsFetchingRoutes(false);
    setShowJourneyPanel(false); // Close panel gently so they can look at map
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    setIsTracking(false);
    setWatchId(null);
    setLoadingLocation(false);
  };

  const handleRouteSelect = (index: number) => {
    setSelectedRouteIndex(index);
    setMapBounds(routes[index].geometry); // Zoom into the selected route

    // Automatically start live tracking
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    if (isTracking && watchId !== null) stopTracking();

    setLoadingLocation(true);
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation([position.coords.latitude, position.coords.longitude]);
        setLoadingLocation(false);
        setIsTracking(true);
      },
      (error) => {
        console.error("Error getting location: ", error);
        alert("Could not get your location. Please check browser permissions.");
        setLoadingLocation(false);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setWatchId(id);
  };

  const handleFreeTrackingToggle = () => {
    if (isTracking && watchId !== null) {
      stopTracking();
      // If we stop tracking, also wipe journey states if one is active
      setSelectedRouteIndex(null);
      setRoutes([]);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation([position.coords.latitude, position.coords.longitude]);
        setLoadingLocation(false);
        setIsTracking(true);
      },
      (error) => {
        console.error("Error getting location: ", error);
        alert("Could not get your location. Please check browser permissions.");
        setLoadingLocation(false);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setWatchId(id);
  };

  const clearJourney = () => {
    stopTracking();
    setRoutes([]);
    setSelectedRouteIndex(null);
    setStartPlace(null);
    setDestPlace(null);
    setMapBounds(null);
    setInputResetKey(k => k + 1); // Remount inputs to reset typed text
  };

  if (profileLoading) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-gray-900" style={{ fontFamily: "var(--font-josefin-sans), 'Josefin Sans', sans-serif" }}>
        <div className="flex flex-col items-center gap-4">
          <span className="loader" />
          <p className="text-white/80 animate-pulse font-medium tracking-wide">
            Loading dashboard...
          </p>
        </div>
        <style>{`
          .loader {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #10b981;
            border-radius: 50%;
            display: inline-block;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (needsProfile) {
    return (
      <PfpCreat
        userId={userId!}
        initialName={profileForm.full_name}
        initialEmail={profileForm.email}
        onComplete={() => {
          setNeedsProfile(false);
          setProfileLoading(false);
        }}
      />
    );
  }

  return (
    <main className="relative w-full h-screen overflow-hidden font-sans">
      {/* Map filling the entire screen */}
      <div className="absolute inset-0 z-0 bg-gray-900">
        <Map
          position={location}
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
          onRouteSelect={handleRouteSelect}
          bounds={mapBounds}
          startPoint={startPlace ? [startPlace.lat, startPlace.lon] : null}
          endPoint={destPlace ? [destPlace.lat, destPlace.lon] : null}
          reviews={reviews}
        />
      </div>

      {/* Sidebar Overlay */}
      <Sidebar
        userProfile={profileForm}
        currentLocation={location}
        onLiveLocationClick={handleFreeTrackingToggle}
      />

      {/* Floating UI Container */}
      <div className="absolute top-4 right-10 z-[1000] flex flex-col items-end gap-4">
        {/* Start Journey Trigger */}
        {!showJourneyPanel && (
          <button
            onClick={() => setShowJourneyPanel(true)}
            className="px-5 py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 border border-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Plan Journey
          </button>
        )}

        {/* Journey Control Panel */}
        {showJourneyPanel && (
          <div className="w-80 p-5 bg-white/95 backdrop-blur-md border border-gray-200 rounded-3xl shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Plan Route</h2>
              <button onClick={() => setShowJourneyPanel(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <LocationAutocomplete
                placeholder="Start Location"
                resetKey={inputResetKey}
                onSelect={(loc) => setStartPlace(loc)}
              />
              <LocationAutocomplete
                placeholder="Destination"
                resetKey={inputResetKey}
                onSelect={(loc) => setDestPlace(loc)}
              />

              <button
                onClick={findRoutes}
                disabled={isFetchingRoutes || !startPlace || !destPlace}
                className="w-full mt-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:active:scale-100 disabled:hover:bg-emerald-600"
              >
                {isFetchingRoutes ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Finding Routes...
                  </>
                ) : "Find Routes"}
              </button>

              {routes.length > 0 && (
                <button
                  onClick={clearJourney}
                  className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-all border border-red-100 mt-1"
                >
                  Clear Journey
                </button>
              )}
            </div>
          </div>
        )}

        {routes.length > 0 && !showJourneyPanel && (
          <div className="p-4 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl flex flex-col gap-3 w-80 max-h-[70vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 border-b pb-2 flex justify-between items-center sticky top-0 bg-white/95 z-10">
              <span>{routes.length} Route{routes.length > 1 ? 's' : ''} Found</span>
              <button onClick={() => setShowJourneyPanel(true)} className="text-xs text-emerald-600 font-semibold hover:underline">Edit</button>
            </h3>
            {selectedRouteIndex === null ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-600 font-medium">Select a route to begin navigation:</p>
                {routes.map((route, i) => {
                  const colors = ["border-indigo-500 bg-indigo-50", "border-teal-500 bg-teal-50", "border-rose-500 bg-rose-50"];
                  const textColors = ["text-indigo-700", "text-teal-700", "text-rose-700"];
                  const colorClass = colors[i % colors.length];
                  const textColorClass = textColors[i % textColors.length];

                  return (
                    <button
                      key={i}
                      onClick={() => handleRouteSelect(i)}
                      className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-left cursor-pointer ${colorClass}`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`font-bold ${textColorClass}`}>Route {i + 1}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded bg-white/60 ${textColorClass} flex items-center gap-1`}>
                          {/* Walking person SVG */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-1.45 1.72L9 10.5H6.5a1 1 0 0 0 0 2H9.5l1-2.5L9 13v5a1 1 0 0 0 2 0v-4l2-2v6a1 1 0 0 0 2 0v-7l1.5 2h2a1 1 0 0 0 0-2H17l-2-3.5a2 2 0 0 0-2.95-.28z" />
                          </svg>
                          {Math.round(route.duration / 60)} mins
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        {(route.distance / 1000).toFixed(1)} km walking
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-green-600 flex items-center gap-1.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Walking Route Active
                </p>
                <div className="flex gap-2 text-xs font-medium text-gray-700">
                  <span className="bg-gray-100 px-2 py-1.5 rounded-md border border-gray-200 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-indigo-500">
                      <path d="M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-1.45 1.72L9 10.5H6.5a1 1 0 0 0 0 2H9.5l1-2.5L9 13v5a1 1 0 0 0 2 0v-4l2-2v6a1 1 0 0 0 2 0v-7l1.5 2h2a1 1 0 0 0 0-2H17l-2-3.5a2 2 0 0 0-2.95-.28z" />
                    </svg>
                    {Math.round(routes[selectedRouteIndex].duration / 60)} mins
                  </span>
                  <span className="bg-gray-100 px-2 py-1.5 rounded-md border border-gray-200">
                    {(routes[selectedRouteIndex].distance / 1000).toFixed(1)} km
                  </span>
                </div>
                <button onClick={clearJourney} className="mt-2 text-xs font-bold text-red-500 hover:text-red-700 text-left w-fit transition-colors">Cancel Journey</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating UI Container for Report Issue */}
      <div className="absolute top-20 right-10 z-[1000] flex flex-col items-end gap-4 mt-2">
        <button
          onClick={() => setShowReportModal(true)}
          className="px-5 py-3 bg-emerald-400 hover:bg-emerald-500 text-gray-900 font-bold rounded-2xl shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-2 border border-emerald-300"
        >
          <span className="text-xl">✍️</span>
          Report Issue
        </button>
      </div>

      {/* Free Tracking Toggle (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000]">
        <button
          onClick={handleFreeTrackingToggle}
          disabled={loadingLocation}
          className={`px-8 py-4 rounded-3xl font-bold font-sans tracking-wide shadow-xl flex items-center gap-3 transition-all ${loadingLocation
              ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
              : isTracking
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95 shadow-red-500/20"
                : "bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700 active:scale-95 shadow-emerald-600/30"
            }`}
        >
          {loadingLocation ? (
            <>
              <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Locating...
            </>
          ) : isTracking ? (
            <>
              <span className="text-xl">🛑</span>
              Stop Tracking
            </>
          ) : (
            <>
              <span className="text-xl drop-shadow-md">📍</span>
              Start Live Tracking
            </>
          )}
        </button>
      </div>

      <ReportIssueModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        userId={userId || ""}
        onSuccess={fetchReviews}
      />


    </main>
  );
}
