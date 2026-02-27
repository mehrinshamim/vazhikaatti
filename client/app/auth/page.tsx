"use client";

import { useState } from "react";
import Image from "next/image";
import { supabaseBrowser } from "../utils/supabase-browser";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success Supabase redirects automatically — no need to do anything
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bgimg.jpeg"
          alt="Vazhikaatti background"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Card */}
      <div
        className="relative z-10 flex flex-col items-center gap-8 px-8 py-10 rounded-3xl text-center"
        style={{
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          minWidth: "300px",
          maxWidth: "380px",
          width: "90vw",
          fontFamily: "var(--font-josefin-sans), 'Josefin Sans', sans-serif",
        }}
      >
        {/* Logo / App name */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">🌿</span>
          <h1
            className="text-3xl font-bold text-white tracking-wide"
            style={{ fontFamily: "inherit" }}
          >
            Vazhikaatti
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Your community safety companion
          </p>
        </div>

        <div className="w-full h-px bg-white/10" />

        {/* Sign-in section */}
        <div className="flex flex-col items-center gap-3 w-full">
          <p
            className="text-white/80 text-sm font-medium tracking-wide"
            style={{ fontFamily: "inherit" }}
          >
            Sign in to get started
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="google-btn"
            style={{ fontFamily: "inherit" }}
          >
            {loading ? (
              <span className="loader" />
            ) : (
              <>
                {/* Google "G" icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.2-.1-2.3-.4-3.5z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6l-1 .1C8.1 39.7 15.5 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.2 5.2C37 38.2 44 33 44 24c0-1.2-.1-2.3-.4-3.5z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {error && (
            <p className="text-red-400 text-xs mt-1">{error}</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 0.8rem 1.5rem;
          background: rgba(255, 255, 255, 0.92);
          color: #1f2937;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          border: none;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          transition: background 0.18s ease, transform 0.15s ease,
            box-shadow 0.15s ease;
        }
        .google-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 6px 28px rgba(0, 0, 0, 0.32);
        }
        .google-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .google-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .loader {
          width: 18px;
          height: 18px;
          border: 2px solid #1f2937;
          border-top-color: transparent;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
