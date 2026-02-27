"use client";

import { useState } from "react";
import Image from "next/image";

interface SidebarProps {
  onLiveLocationClick: () => void;
  userProfile?: {
    full_name: string;
    email: string;
    phone_number?: string;
    about_me?: string;
  } | null;
  currentLocation?: [number, number] | null;
}

export default function Sidebar({ onLiveLocationClick, userProfile, currentLocation }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Share location modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShareLocationClick = () => {
    if (!currentLocation) {
      // Auto-enable live tracking
      onLiveLocationClick();
    }
    // We open the modal right away. It will show the loader/waiting state until location arrives
    setShowShareModal(true);
    setShareUrl(currentLocation ? `https://www.google.com/maps?q=${currentLocation[0]},${currentLocation[1]}` : null);
    setCopied(false);
  };

  const handleConfirmShare = () => {
    if (currentLocation) {
      const url = `https://www.google.com/maps?q=${currentLocation[0]},${currentLocation[1]}`;
      setShareUrl(url);
      setCopied(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      {/* Hamburger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-4 left-4 z-[2000] p-3 bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl shadow-lg border border-emerald-100 transition-all active:scale-95"
          aria-label="Open Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[1999] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`absolute top-0 left-0 h-full w-80 bg-[#fbf9fa] shadow-2xl z-[2000] transition-transform duration-300 ease-in-out flex flex-col pt-6 px-4 border-r border-emerald-100 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        style={{ fontFamily: "var(--font-josefin-sans), 'Josefin Sans', sans-serif" }}
      >
        {/* Header with mascot */}
        <div className="flex justify-between items-center mb-6 px-2">
          <div className="flex items-center gap-2.5">
      
            <h2 className="text-xl font-bold text-gray-800 tracking-wide">Vazhikaatti</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-6 no-scrollbar">
          {/* Section 1: User */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-2 mb-3">User</h3>

            <div className="flex flex-col gap-1.5">
              {/* Profile Accordion */}
              <div className="flex flex-col rounded-xl overflow-hidden bg-emerald-50/50">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-emerald-100/80 text-emerald-900 transition-all font-semibold"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center text-xl">👤</div>
                    <span>Profile</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-emerald-600 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${isProfileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-4 bg-white/50 border-t border-emerald-50 text-sm">
                    {userProfile ? (
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Name</p>
                          <p className="text-gray-800 font-medium">{userProfile.full_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Email</p>
                          <p className="text-gray-800 font-medium break-all">{userProfile.email || "N/A"}</p>
                        </div>
                        {userProfile.phone_number && (
                          <div>
                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Phone</p>
                            <p className="text-gray-800 font-medium">{userProfile.phone_number}</p>
                          </div>
                        )}
                        {userProfile.about_me && (
                          <div>
                            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">About</p>
                            <p className="text-gray-600 italic">&quot;{userProfile.about_me}&quot;</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-center py-2">Profile details not found.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="h-px bg-gray-200 w-full my-4 mx-2"></div>

          {/* Section 2: Safety */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-2 mb-3">Safety</h3>

            <div className="flex flex-col gap-1.5 mb-2">
              <button
                onClick={handleShareLocationClick}
                className="flex items-center gap-4 w-full px-4 py-3.5 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 rounded-xl transition-all font-semibold group relative"
              >
                <div className="w-8 flex justify-center text-xl">🔗</div>
                <span>Share Live Location</span>
              </button>
            </div>

            {/* Helpline Numbers Accordion */}
            <div className="mb-2">
              <button
                onClick={() => setIsHelplineOpen(!isHelplineOpen)}
                className="flex justify-between items-center w-full px-2 py-2 hover:bg-gray-50 rounded-lg group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center text-xl">☎️</div>
                  <h3 className="text-[15px] font-semibold text-gray-700 group-hover:text-red-600 transition-colors">Helpline Numbers</h3>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isHelplineOpen ? 'rotate-180 text-red-500' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isHelplineOpen ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
              >
                <div className="flex flex-col gap-1 pl-12 pr-2">
                  <a href="tel:100" className="flex justify-between items-center py-2.5 px-3 hover:bg-red-50 rounded-lg group cursor-pointer border border-transparent hover:border-red-100 transition-all">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 group-hover:text-red-700">
                      <span>🚓</span> Police
                    </span>
                    <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded">100</span>
                  </a>

                  <a href="tel:101" className="flex justify-between items-center py-2.5 px-3 hover:bg-orange-50 rounded-lg group cursor-pointer border border-transparent hover:border-orange-100 transition-all">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 group-hover:text-orange-700">
                      <span>🚒</span> Fire
                    </span>
                    <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded">101</span>
                  </a>

                  <a href="tel:108" className="flex justify-between items-center py-2.5 px-3 hover:bg-blue-50 rounded-lg group cursor-pointer border border-transparent hover:border-blue-100 transition-all">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 group-hover:text-blue-700">
                      <span>🚑</span> Medical
                    </span>
                    <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded">108</span>
                  </a>

                  <a href="tel:1091" className="flex justify-between items-center py-2.5 px-3 hover:bg-pink-50 rounded-lg group cursor-pointer border border-transparent hover:border-pink-100 transition-all">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 group-hover:text-pink-700">
                      <span>👩</span> Women Helpline
                    </span>
                    <span className="text-xs font-bold bg-pink-100 text-pink-600 px-2 py-1 rounded">1091</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 pb-2 border-t border-gray-200">
          <button
            onClick={async () => {
              const { supabase } = await import("../utils/supabase");
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all font-bold group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* ─── Share Live Location Modal ──────────────────────────────────────── */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center p-4"
          style={{ fontFamily: "var(--font-josefin-sans), 'Josefin Sans', sans-serif" }}
        >
          {/* Backdrop */}
          

          {/* Modal Card */}
          <div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl text-center"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(16,185,129,0.06) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderBottom: "2px solid rgba(16,185,129,0.3)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 0 20px rgba(16,185,129,0.08) inset",
            }}
          >
         

            

            <div className="relative z-10 flex flex-col items-center px-6 pt-8 pb-7 gap-5">
              {/* Mascot */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-emerald-100 shadow-xl bg-white">
                  <Image
                    src="/mascot.png"
                    alt="Vazhikaatti Owl"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
                {/* Pulse ring when getting location */}
                {!currentLocation && <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/30" />}
              </div>

              {/* Headline */}
              <div className="text-center flex flex-col items-center gap-1">
                <h2 className="text-2xl font-bold text-gray-500 tracking-wide">
                  Share Your Whereabouts
                </h2>
                <p className="text-emerald-600 font-semibold text-sm">Via Vazhikaatti </p>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed max-w-[260px]">
                  {currentLocation
                    ? "Let your loved ones know exactly where you are. One tap — they've got you."
                    : "Fetching your live coordinates so loved ones can pinpoint your exact location..."}
                </p>
              </div>

              {/* If no location yet — loader */}
              {!currentLocation && (
                <div className="w-full flex justify-center py-2">
                  <div className="flex gap-2 items-center text-emerald-600 text-sm font-bold">
                    <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Locating you...
                  </div>
                </div>
              )}

              {/* Generate link button — shown when location available and link not yet generated */}
              {currentLocation && !shareUrl && (
                <button
                  onClick={handleConfirmShare}
                  className="w-full py-3.5 rounded-full font-bold text-white text-sm tracking-wide transition-all active:scale-95 hover:brightness-105 shadow-lg"
                  style={{ background: "#10b981", boxShadow: "0 4px 14px rgba(16,185,129,0.4)" }}
                >
                  Generate My Location Link
                </button>
              )}

              {/* Link box — shown after confirming */}
              {shareUrl && (
                <div className="w-full flex flex-col gap-3">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest text-center">Your live location link</p>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-white border border-gray-200 shadow-inner">
                    <p className="flex-1 text-xs text-gray-700 truncate font-mono leading-relaxed">{shareUrl}</p>
                    <button
                      onClick={handleCopy}
                      title="Copy link"
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all active:scale-90"
                      style={{
                        background: copied ? "#10b981" : "#f3f4f6",
                        color: copied ? "#fff" : "#4b5563",
                        border: copied ? "1px solid #10b981" : "1px solid #e5e7eb"
                      }}
                    >
                      {copied ? (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-red-500 text-center font-medium">
                    Anyone with this link can see your spot on Google Maps.
                  </p>
                </div>
              )}

              {/* Dismiss */}
              <button
                onClick={() => { setShowShareModal(false); setShareUrl(null); setCopied(false); }}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors mt-2"
              >
                No thanks, maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
