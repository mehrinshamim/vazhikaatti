"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { RouteOption, RouteStep } from "./Map";
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ─── Direction Icon ──────────────────────────────────────────────────────────
// ORS type: 0=left, 1=right, 2=sharp-left, 3=sharp-right, 4=slight-left,
//           5=slight-right, 6=straight, 7=roundabout, 8=exit-roundabout,
//           9=u-turn, 10=destination, 11=depart, 12=keep-left, 13=keep-right

function DirectionIcon({ type }: { type: number }) {
  const cls = "w-9 h-9 text-white";
  const sw = { strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (type === 1 || type === 3 || type === 5 || type === 13) {
    // Right variants
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...sw}>
        <path d="M5 19V8a3 3 0 013-3h8M13 3l3 2-3 2" />
      </svg>
    );
  }
  if (type === 0 || type === 2 || type === 4 || type === 12) {
    // Left variants
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...sw}>
        <path d="M19 19V8a3 3 0 00-3-3H8M11 3L8 5l3 2" />
      </svg>
    );
  }
  if (type === 9) {
    // U-turn
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...sw}>
        <path d="M9 3l-3 3 3 3M6 6a6 6 0 016 6v6" />
      </svg>
    );
  }
  if (type === 7 || type === 8) {
    // Roundabout
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...sw}>
        <circle cx="12" cy="12" r="5" />
        <path d="M17 12a5 5 0 00-5-5V4M15 4l2 3-3 1" />
      </svg>
    );
  }
  if (type === 10) {
    // Destination
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...sw}>
        <path d="M12 21C12 21 5 13.5 5 8.5a7 7 0 1114 0C19 13.5 12 21 12 21z" />
        <circle cx="12" cy="8.5" r="2.5" fill="white" stroke="none" />
      </svg>
    );
  }
  // Straight / depart / default (6, 11, etc.)
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...sw}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

// ─── Navigation Panel ────────────────────────────────────────────────────────

interface NavPanelProps {
  step: RouteStep;
  stepIndex: number;
  totalSteps: number;
  distToTurn: number | null;
  remainingDistance: number;
  remainingDuration: number;
  voiceMuted: boolean;
  onToggleMute: () => void;
  arrived: boolean;
}

function NavigationPanel({
  step,
  stepIndex,
  totalSteps,
  distToTurn,
  remainingDistance,
  remainingDuration,
  voiceMuted,
  onToggleMute,
  arrived,
}: NavPanelProps) {
  return (
    <div className="w-full bg-[#1e1b4b] rounded-2xl shadow-2xl overflow-hidden border border-indigo-900/60">
      {/* Main instruction row */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="shrink-0 w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
          <DirectionIcon type={arrived ? 10 : step.type} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base leading-snug truncate">
            {arrived ? "You have arrived!" : step.instruction}
          </p>
          {!arrived && distToTurn !== null && (
            <p className="text-indigo-300 text-sm font-semibold mt-0.5">
              In {formatDistance(distToTurn)}
            </p>
          )}
        </div>

        {/* Mute toggle */}
        <button
          onClick={onToggleMute}
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ background: voiceMuted ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.5)" }}
          title={voiceMuted ? "Unmute voice" : "Mute voice"}
        >
          {voiceMuted ? (
            <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-indigo-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
            </svg>
          )}
        </button>
      </div>

      {/* Footer: remaining info + step progress */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-indigo-950/60 border-t border-indigo-800/40">
        <div className="flex items-center gap-3 text-xs font-semibold text-indigo-300">
          <span>{formatDistance(remainingDistance)} remaining</span>
          <span className="text-indigo-700">•</span>
          <span>{formatDuration(remainingDuration)}</span>
        </div>
        <span className="text-xs text-indigo-500 font-medium">
          Step {stepIndex + 1} / {totalSteps}
        </span>
      </div>
    </div>
  );
}

// ─── Location Autocomplete ───────────────────────────────────────────────────

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

// ─── Dashboard Page ──────────────────────────────────────────────────────────

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

  // Navigation States
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [distToNextTurn, setDistToNextTurn] = useState<number | null>(null);
  const [arrived, setArrived] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);

  // Refs to avoid stale closures in navigation logic
  const voiceMutedRef = useRef(false);
  const currentStepRef = useRef(0);
  const preAnnouncedRef = useRef(false);
  const arrivedRef = useRef(false);

  // Issues / Reviews State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number, lng: number } | null>(null);

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
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [watchId]);

  // ─── Voice Synthesis ───────────────────────────────────────────────────────
  const speak = (text: string) => {
    if (voiceMutedRef.current) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    // Prefer a natural-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("google")) ||
      voices.find((v) => v.lang.startsWith("en") && !v.localService) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null;
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  };

  // ─── Navigation: step advancement on location change ──────────────────────
  useEffect(() => {
    if (!location || selectedRouteIndex === null) return;
    const route = routes[selectedRouteIndex];
    if (!route || !route.steps || route.steps.length === 0) return;
    if (arrivedRef.current) return;

    const steps = route.steps;
    const stepIdx = currentStepRef.current;
    const step = steps[stepIdx];
    if (!step) return;

    const endIdx = step.way_points[1];
    const endPoint = route.geometry[endIdx];
    if (!endPoint) return;

    const dist = haversineDistance(location[0], location[1], endPoint[0], endPoint[1]);
    setDistToNextTurn(Math.round(dist));

    // Pre-announce at 80m before the next turn
    if (dist < 80 && dist > 25 && !preAnnouncedRef.current) {
      if (stepIdx < steps.length - 1) {
        const nextStep = steps[stepIdx + 1];
        speak(`In ${Math.round(dist)} meters, ${nextStep.instruction}`);
        preAnnouncedRef.current = true;
      }
    }

    // Advance step when within 25m of the turn point
    if (dist < 25) {
      if (stepIdx >= steps.length - 1) {
        // Arrived at destination
        arrivedRef.current = true;
        setArrived(true);
        speak("You have arrived at your destination.");
      } else {
        const nextIdx = stepIdx + 1;
        currentStepRef.current = nextIdx;
        setCurrentStepIndex(nextIdx);
        speak(steps[nextIdx].instruction);
        preAnnouncedRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // ─── Route Data Helpers ────────────────────────────────────────────────────
  const getActiveRoute = () =>
    selectedRouteIndex !== null ? routes[selectedRouteIndex] : null;

  const getRemainingDistance = () => {
    const route = getActiveRoute();
    if (!route?.steps) return route?.distance ?? 0;
    let remaining = 0;
    for (let i = currentStepIndex; i < route.steps.length; i++) {
      remaining += route.steps[i].distance;
    }
    return remaining;
  };

  const getRemainingDuration = () => {
    const route = getActiveRoute();
    if (!route?.steps) return route?.duration ?? 0;
    let remaining = 0;
    for (let i = currentStepIndex; i < route.steps.length; i++) {
      remaining += route.steps[i].duration;
    }
    return remaining;
  };

  const getNextTurnPoint = (): [number, number] | null => {
    const route = getActiveRoute();
    if (!route?.steps || arrived) return null;
    const step = route.steps[currentStepIndex];
    if (!step) return null;
    return route.geometry[step.way_points[1]] ?? null;
  };

  // ─── Route Fetching ────────────────────────────────────────────────────────
  const findRoutes = async () => {
    if (!startPlace || !destPlace) {
      alert("Please select both start and destination locations from the dropdowns.");
      return;
    }

    setIsFetchingRoutes(true);
    if (isTracking && watchId !== null) stopTracking();
    setRoutes([]);
    setSelectedRouteIndex(null);
    setMapBounds(null);
    setCurrentStepIndex(0);
    currentStepRef.current = 0;
    setArrived(false);
    arrivedRef.current = false;

    const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
    if (!apiKey) {
      alert("OpenRouteService API Key is missing.");
      setIsFetchingRoutes(false);
      return;
    }

    try {
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
          (feature: {
            geometry: { coordinates: [number, number][] };
            properties: {
              summary: { distance: number; duration: number };
              segments: { steps: { instruction: string; distance: number; duration: number; type: number; way_points: number[] }[] }[];
            };
          }) => {
            // Convert geometry from [lon,lat] to [lat,lon]
            const geometry: [number, number][] = feature.geometry.coordinates.map(
              (coord: [number, number]) => [coord[1], coord[0]]
            );

            // Flatten all segment steps
            const steps: RouteStep[] = [];
            if (feature.properties.segments) {
              for (const segment of feature.properties.segments) {
                if (segment.steps) {
                  for (const s of segment.steps) {
                    steps.push({
                      instruction: s.instruction,
                      distance: s.distance,
                      duration: s.duration,
                      type: s.type,
                      way_points: [s.way_points[0], s.way_points[1]],
                    });
                  }
                }
              }
            }

            return {
              geometry,
              distance: feature.properties.summary.distance,
              duration: feature.properties.summary.duration,
              steps,
            };
          }
        );

        setRoutes(fetchedRoutes);
        const allBounds: [number, number][] = [];
        fetchedRoutes.forEach((r) => allBounds.push(...r.geometry));
        setMapBounds(allBounds);
      } else {
        alert("No routes found between these locations.");
      }
    } catch (e) {
      console.error("Routing error", e);
      alert("An error occurred fetching the routes.");
    }

    setIsFetchingRoutes(false);
    setShowJourneyPanel(false);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsTracking(false);
    setWatchId(null);
    setLoadingLocation(false);
  };

  const handleRouteSelect = (index: number) => {
    setSelectedRouteIndex(index);
    setMapBounds(routes[index].geometry);
    setCurrentStepIndex(0);
    currentStepRef.current = 0;
    preAnnouncedRef.current = false;
    setArrived(false);
    arrivedRef.current = false;
    setDistToNextTurn(null);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    if (isTracking && watchId !== null) stopTracking();

    setLoadingLocation(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude]);
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

    // Announce navigation start after a short delay (let voices load)
    setTimeout(() => {
      const steps = routes[index]?.steps;
      if (steps && steps.length > 0) {
        speak(`Navigation started. ${steps[0].instruction}`);
      }
    }, 600);
  };

  const handleFreeTrackingToggle = () => {
    if (isTracking && watchId !== null) {
      stopTracking();
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
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude]);
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
    setCurrentStepIndex(0);
    currentStepRef.current = 0;
    setArrived(false);
    arrivedRef.current = false;
    setDistToNextTurn(null);
    setInputResetKey((k) => k + 1);
  };

  const toggleMute = () => {
    const newMuted = !voiceMuted;
    setVoiceMuted(newMuted);
    voiceMutedRef.current = newMuted;
    if (!newMuted) {
      // Unmuting: repeat current instruction
      const route = getActiveRoute();
      if (route?.steps?.[currentStepIndex]) {
        speak(route.steps[currentStepIndex].instruction);
      }
    } else {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  // ─── Derived navigation values ─────────────────────────────────────────────
  const activeRoute = getActiveRoute();
  const isNavigating = selectedRouteIndex !== null && isTracking && activeRoute?.steps && activeRoute.steps.length > 0;
  const currentStep = activeRoute?.steps?.[currentStepIndex] ?? null;
  const nextTurnPoint = getNextTurnPoint();

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
          nextTurnPoint={nextTurnPoint}
          recenterKey={recenterKey}
          onMapClick={(lat, lng) => {
            if (isPickingLocation) {
              setPickedLocation({ lat, lng });
              // We don't auto-close the picker mode here in case they want to adjust it,
              // or they can just click "Done" in the banner. Let's just auto-return to modal:
              setIsPickingLocation(false);
              setShowReportModal(true);
            }
          }}
          pickedPoint={pickedLocation ? [pickedLocation.lat, pickedLocation.lng] : null}
        />
      </div>

      {/* Sidebar Overlay */}
      <Sidebar
        userProfile={profileForm}
        currentLocation={location}
        onLiveLocationClick={handleFreeTrackingToggle}
      />

      {/* Picking Location Banner */}
      {isPickingLocation && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000] flex flex-col items-center gap-3 animate-bounce">
          <div className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-emerald-200 flex items-center gap-3">
            <span className="text-xl">📍</span>
            <span className="text-emerald-800 font-bold tracking-wide">Tap anywhere on the map</span>
          </div>
          <button
            onClick={() => {
              setIsPickingLocation(false);
              setShowReportModal(true);
            }}
            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-full shadow-lg hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating Mascot — bottom left, above sidebar button */}
      <div className="absolute bottom-24 left-4 z-[1000] flex flex-col items-start gap-1 pointer-events-none">
        {/* Speech bubble */}
        <div
          className="px-3 py-1.5 rounded-2xl rounded-bl-none text-sm font-semibold text-indigo-900 shadow-lg"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(99,102,241,0.18)",
            boxShadow: "0 4px 16px rgba(99,102,241,0.18)",
            maxWidth: "140px",
            lineHeight: "1.4",
          }}
        >
          Stay safe out there! 🦉
        </div>
        {/* Mascot */}
        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-xl ml-1">
          <Image
            src="/mascot.png"
            alt="Vazhikaatti Owl Mascot"
            width={48}
            height={48}
            className="object-cover w-full h-full"
          />
        </div>
      </div>

      {/* Floating UI Container */}
      <div className="absolute top-4 right-10 z-[1000] flex flex-col items-end gap-3">
        {/* Top controls row: re-center trigger + journey trigger */}
        <div className="flex items-center gap-2">
          {/* Re-center Map Button */}
          <button
            onClick={() => {
              if (location) {
                setRecenterKey(k => k + 1);
              } else {
                handleFreeTrackingToggle();
              }
            }}
            title="Re-center map"
            className="flex items-center justify-center w-12 h-12 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl shadow-xl transition-all active:scale-95 border border-gray-200"
          >
            <Image src="/recentre.png" alt="Recenter Map" width={24} height={24} className="opacity-80 object-contain" />
          </button>

        </div>

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
                      {route.steps.length > 0 && (
                        <p className="text-xs text-gray-500">{route.steps.length} steps</p>
                      )}
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
                  {arrived ? "Arrived!" : "Navigating..."}
                </p>
                <div className="flex gap-2 text-xs font-medium text-gray-700">
                  <span className="bg-gray-100 px-2 py-1.5 rounded-md border border-gray-200 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-indigo-500">
                      <path d="M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-1.45 1.72L9 10.5H6.5a1 1 0 0 0 0 2H9.5l1-2.5L9 13v5a1 1 0 0 0 2 0v-4l2-2v6a1 1 0 0 0 2 0v-7l1.5 2h2a1 1 0 0 0 0-2H17l-2-3.5a2 2 0 0 0-2.95-.28z" />
                    </svg>
                    {formatDuration(getRemainingDuration())}
                  </span>
                  <span className="bg-gray-100 px-2 py-1.5 rounded-md border border-gray-200">
                    {formatDistance(getRemainingDistance())}
                  </span>
                </div>
                <button onClick={clearJourney} className="mt-2 text-xs font-bold text-red-500 hover:text-red-700 text-left w-fit transition-colors">Cancel Journey</button>
              </div>
            )}
          </div>
        )}
      </div>



      {/* ─── Navigation Panel (Google Maps style) ─────────────────────────── */}
      {isNavigating && currentStep && (
        <div className="absolute bottom-24 left-4 right-4 z-[1000] flex justify-center pointer-events-none">
          <div className="w-full max-w-lg pointer-events-auto">
            <NavigationPanel
              step={currentStep}
              stepIndex={currentStepIndex}
              totalSteps={activeRoute!.steps.length}
              distToTurn={distToNextTurn}
              remainingDistance={getRemainingDistance()}
              remainingDuration={getRemainingDuration()}
              voiceMuted={voiceMuted}
              onToggleMute={toggleMute}
              arrived={arrived}
            />
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-[400px] flex justify-center gap-2.5">
        {/* Flag a Hazard button */}
        <button
          onClick={() => {
            setPickedLocation(null);
            setShowReportModal(true);
          }}
          className="flex-1 text-emerald-700 font-bold bg-white border border-emerald-200 shadow-xl rounded-full py-3.5 hover:bg-emerald-50 active:scale-95 transition-all text-sm tracking-wide"
        >
          Report an Issue
        </button>

        {/* Chart My Path button */}
        <button
          onClick={() => setShowJourneyPanel(true)}
          className="flex-1 text-emerald-700 font-bold bg-white border border-emerald-200 shadow-xl rounded-full py-3.5 hover:bg-emerald-50 active:scale-95 transition-all text-sm tracking-wide"
        >
          Where are you going?
        </button>
      </div>

      <ReportIssueModal
        isOpen={showReportModal || isPickingLocation}
        isHidden={isPickingLocation}
        onClose={() => setShowReportModal(false)}
        userId={userId || ""}
        onSuccess={fetchReviews}
        onStartPicker={() => {
          setShowReportModal(false);
          setIsPickingLocation(true);
        }}
        pickedLocation={pickedLocation}
      />
    </main>
  );
}
