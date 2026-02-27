import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../utils/supabase";




interface ReportIssueModalProps {
  isOpen: boolean;
  isHidden?: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
  onStartPicker?: () => void;
  pickedLocation?: { lat: number; lng: number } | null;
}

const CATEGORIES = [
  'Harassment',
  'Stray Dogs',
  'Potholes',
  'Construction',
  'Poor Lighting',
  'Flooding',
  'Accident'
];

export default function ReportIssueModal({ isOpen, isHidden, onClose, userId, onSuccess, onStartPicker, pickedLocation }: ReportIssueModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [rating, setRating] = useState(3);
  const [locationName, setLocationName] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const locationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const locationAbortRef = useRef<AbortController | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pickedLocation) {
      setCoordinates(pickedLocation);
      // reverse geocode the picked location
      const reverseGeocode = async () => {
        try {
          const res = await fetch(`/api/reverse-geocode?lat=${pickedLocation.lat}&lon=${pickedLocation.lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            setLocationName(data.display_name);
          } else {
            setLocationName(`${pickedLocation.lat.toFixed(4)}, ${pickedLocation.lng.toFixed(4)}`);
          }
        } catch (e) {
          console.error("Reverse geocode failed", e);
          setLocationName(`${pickedLocation.lat.toFixed(4)}, ${pickedLocation.lng.toFixed(4)}`);
        }
      };
      reverseGeocode();
    }
  }, [pickedLocation]);

  if (!isOpen) return null;

  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    setIsFetchingSuggestions(true);
    if (locationAbortRef.current) locationAbortRef.current.abort();
    locationAbortRef.current = new AbortController();
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
        signal: locationAbortRef.current.signal,
      });
      const data = await res.json();
      setLocationSuggestions(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setLocationSuggestions([]);
      }
    }
    setIsFetchingSuggestions(false);
  };

  const handleLocationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationName(val);
    setCoordinates(null);
    setShowSuggestions(true);
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    locationDebounceRef.current = setTimeout(() => fetchLocationSuggestions(val), 300);
  };

  const handleSuggestionSelect = (place: { display_name: string; lat: string; lon: string }) => {
    setLocationName(place.display_name);
    setCoordinates({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }
    setErrorMsg("");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });

        // Reverse geocode
        try {
          const res = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            setLocationName(data.display_name);
          } else {
            setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch (e) {
          console.error("Reverse geocode failed", e);
          setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setErrorMsg("Failed to get current location");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !locationName) {
      setErrorMsg("Please fill in all required fields (Title, Description, Location).");
      return;
    }
    if (!userId) {
      setErrorMsg("You must be logged in to report an issue.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("vazhikaatti-review-images")
          .upload(fileName, imageFile);

        if (uploadError) {
          throw new Error("Image upload failed: " + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("vazhikaatti-review-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      // -----------------------------
      // RESOLVE COORDINATES
      // -----------------------------
      let finalCoordsStr = coordinates
        ? `${coordinates.lat},${coordinates.lng}`
        : null;

      // If user manually typed location but we don't have coordinates,
      // try to forward geocode it
      if (!coordinates && locationName) {
        try {
          const res = await fetch(
            `/api/geocode?q=${encodeURIComponent(locationName)}`
          );
          const data = await res.json();

          if (Array.isArray(data) && data.length > 0) {
            finalCoordsStr = `${data[0].lat},${data[0].lon}`;
          }
        } catch (e) {
          console.error("Forward geocode failed during submission", e);
          // Proceed without coordinates if it fails
        }
      }

      // -----------------------------
      // VALIDATION STEP
      // -----------------------------
      const validationPayload = {
        user_id: userId,
        location: locationName,
        coordinates: finalCoordsStr,
        category,
        title,
        description,
        rating,
        image_url: imageUrl,
      };

      const validationResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validationPayload),
        }
      );

      if (!validationResponse.ok) {
        throw new Error(
          `Validation API returned status ${validationResponse.status}`
        );
      }

      const validationData = await validationResponse.json();

      // If validation fails → STOP
      if (!validationData.valid) {
        setErrorMsg(
          `Validation Error: ${validationData.reason ||
          "Validation failed. Please check your input."
          }`
        );
        setIsSubmitting(false);
        return;
      }

      // -----------------------------
      // INSERT INTO SUPABASE
      // -----------------------------

      // Insert record
      const locationStr = locationName;
      const coordsStr = coordinates ? `${coordinates.lat},${coordinates.lng}` : null;

      const { error: insertError } = await supabase.from("review").insert([
        {
          user_id: userId,
          title,
          description,
          category,
          rating,
          location: locationName,
          coordinates: finalCoordsStr,
          image_url: imageUrl,
        }
      ]);

      if (insertError) {
        throw new Error("Failed to submit review: " + insertError.message);
      }

      // Show success message
      setSuccessMsg("✅ Report submitted successfully! Thank you for keeping our roads safe.");

      // Reset form after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);

      if (err.message && err.message.includes("Row-Level Security") || err.message.includes("row-level security")) {
        setErrorMsg("Storage Error: Please enable public INSERT access on the 'vazhikaatti-review-images' bucket in Supabase (Storage -> Policies -> New Policy -> Allow Insert).");
      } else if (err.message && err.message.includes("Validation API")) {
        setErrorMsg("Failed to connect to validation service. Please try again.");
      } else if (err instanceof TypeError) {
        setErrorMsg("Network error: Unable to reach the validation service.");
      } else {
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" style={{ display: isHidden ? "none" : "flex" }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto font-sans flex flex-col border border-gray-100">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-emerald-500">✍️</span> Report Issue
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium border border-emerald-100">
              {successMsg}
            </div>
          )}

          {/* Title row */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Large pothole on main street"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 text-gray-800"
            />
          </div>

          {/* Category row */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Category <span className="text-red-500">*</span></label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all bg-white text-gray-800 cursor-pointer appearance-none"
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%236B7280"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Location row */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Location <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={locationName}
                  onChange={handleLocationInput}
                  onFocus={() => { if (locationName.length >= 3) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Search location in Kochi..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 text-gray-800"
                />
                {isFetchingSuggestions && (
                  <div className="absolute right-3 top-3">
                    <svg className="animate-spin h-4 w-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <ul className="absolute z-[3000] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {locationSuggestions.map((place, idx) => (
                      <li
                        key={idx}
                        onMouseDown={() => handleSuggestionSelect(place)}
                        className="px-3 py-2.5 hover:bg-emerald-50 cursor-pointer border-b last:border-0 text-xs text-gray-700"
                      >
                        {place.display_name}
                      </li>
                    ))}
                  </ul>
                )}
                {coordinates && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Location pinned</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="px-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 transition-colors flex items-center justify-center disabled:opacity-50"
                title="Use Current Location"
              >
                {isLocating ? (
                  <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Pin on Map button */}
          <button
            type="button"
            onClick={() => onStartPicker && onStartPicker()}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-emerald-50 border-2 border-dashed border-gray-200 hover:border-emerald-300 rounded-xl transition-all group"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 group-hover:border-emerald-200 group-hover:bg-emerald-50 shadow-sm shrink-0 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors">Pin on Map</p>
              <p className="text-xs text-gray-400">Tap a spot on the map to pin the exact location</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 group-hover:text-emerald-400 ml-auto shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Description row */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Description <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about the issue..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 text-gray-800 resize-y"
            />
          </div>

          {/* Rating row */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 flex justify-between">
              <span>Severity Rating</span>
              <span className="text-xs text-gray-500 font-normal">1 (Low) - 5 (Critical)</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-8 w-8 ${star <= rating ? (rating <= 2 ? 'text-red-400' : rating === 3 ? 'text-yellow-400' : 'text-emerald-400') : 'text-gray-200'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload row */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Photo Evidence (Optional)</label>
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-[0.5] py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
              {imagePreview && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[15px] uppercase tracking-wider rounded-xl py-3.5 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
