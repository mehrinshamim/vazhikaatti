"use client";

import { useState } from "react";
import { supabase } from "../utils/supabase";

interface PfpCreatProps {
  userId: string;
  initialName: string;
  initialEmail: string;
  onComplete: () => void;
}

export default function PfpCreat({ userId, initialName, initialEmail, onComplete }: PfpCreatProps) {
  const [profileForm, setProfileForm] = useState({
    full_name: initialName || "",
    email: initialEmail || "",
    phone_number: "",
    about_me: "",
  });
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProfile(true);
    setProfileError(null);

    const { error } = await supabase.from("profiles").insert([
      {
        user_id: userId,
        full_name: profileForm.full_name,
        email: profileForm.email,
        phone_number: profileForm.phone_number,
        about_me: profileForm.about_me,
      },
    ]);

    if (error) {
      setProfileError(error.message);
      setSubmittingProfile(false);
    } else {
      onComplete();
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-gray-900 overflow-y-auto py-10">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="/bgimg.jpeg" alt="Background" className="w-full h-full object-cover object-center fixed" />
        <div className="absolute inset-0 bg-black/75 fixed" />
      </div>

      <div
        className="relative z-10 flex flex-col items-center gap-6 px-6 sm:px-10 py-10 rounded-3xl"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(16,185,129,0.06) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderBottom: "1px solid rgba(16,185,129,0.2)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(16,185,129,0.08) inset",
          minWidth: "320px",
          maxWidth: "600px",
          width: "90vw",
          fontFamily: "var(--font-josefin-sans), 'Josefin Sans', sans-serif",
        }}
      >
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center justify-center gap-1 sm:gap-2 w-full">
            {/* Mascot */}
            <div className="relative w-40 h-40 sm:w-50 sm:h-50 transform hover:scale-105 transition-transform duration-300 flex-shrink-0 animate-bounce-slow">
              <img
                src="/mascot.png"
                alt="Vazhikaatti Mascot"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>

            {/* Dialog Bubble */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl py-2.5 px-3 sm:py-3 sm:px-4 relative shadow-lg flex-1 text-left">
              {/* Pointer Triangle */}
              <div
                className="absolute top-1/2 -left-2.5 transform -translate-y-1/2 w-5 h-5 rounded-sm border-l border-b border-emerald-500/20 rotate-45"
                style={{ background: "rgba(16, 185, 129, 0.1)" }}
              ></div>
              <p className="text-emerald-300 font-medium text-[13px] sm:text-sm leading-tight sm:leading-snug tracking-wide relative z-10">
                "Hi! I'm Vazhikaatti, your personal safety guide. Are you feeling unsafe? I'm here to help you navigate smarter. Let's set up your profile first!"
              </p>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide mt-2">Complete Profile</h1>
        </div>

        <form onSubmit={handleProfileSubmit} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 focus-within:text-emerald-400 text-white/90 transition-colors">
            <label className="text-[13px] font-semibold tracking-wider uppercase ml-1">Full Name</label>
            <input
              type="text"
              required
              value={profileForm.full_name}
              onChange={(e) => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all font-light shadow-inner"
              placeholder="John Doe"
            />
          </div>

          <div className="flex flex-col gap-1.5 focus-within:text-emerald-400 text-white/90 transition-colors">
            <label className="text-[13px] font-semibold tracking-wider uppercase ml-1">Email</label>
            <input
              type="email"
              required
              value={profileForm.email}
              onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white/70 placeholder-white/30 focus:outline-none transition-all font-light opacity-80 cursor-not-allowed shadow-inner"
              placeholder="name@example.com"
              readOnly
            />
          </div>

          <div className="flex flex-col gap-1.5 focus-within:text-emerald-400 text-white/90 transition-colors">
            <label className="text-[13px] font-semibold tracking-wider uppercase ml-1">Phone Number</label>
            <input
              type="tel"
              value={profileForm.phone_number}
              onChange={(e) => setProfileForm(p => ({ ...p, phone_number: e.target.value }))}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all font-light shadow-inner"
              placeholder="+1 234 567 890"
            />
          </div>

          <div className="flex flex-col gap-1.5 focus-within:text-emerald-400 text-white/90 transition-colors">
            <label className="text-[13px] font-semibold tracking-wider uppercase ml-1">About Me</label>
            <textarea
              value={profileForm.about_me}
              onChange={(e) => setProfileForm(p => ({ ...p, about_me: e.target.value }))}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all font-light min-h-[120px] resize-y shadow-inner"
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          {profileError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">{profileError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submittingProfile}
            className="mt-3 w-full bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-gray-900 font-bold text-[15px] uppercase tracking-wider rounded-xl py-4 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 flex justify-center items-center gap-2"
          >
            {submittingProfile ? (
              <span className="loader-btn" />
            ) : (
              "Complete Profile"
            )}
          </button>
        </form>
      </div>
      <style>{`
        .loader-btn {
          width: 20px;
          height: 20px;
          border: 2px solid #1f2937;
          border-top-color: transparent;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-3%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
      `}</style>
    </main>
  );
}
