"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      // The Supabase client automatically parses the `#access_token=...` from the URL,
      // establishes the session, and stores it in localStorage.
      // We just need to check if we have a session.
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth error:", error.message);
        setError("Authentication failed. Please try again.");
        setTimeout(() => router.push("/auth"), 3000);
        return;
      }

      if (session) {
        // Successfully authenticated!
        router.push("/dashboard");
      } else {
        // Wait a tiny bit just in case the client is still parsing the URL hash
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            router.push("/dashboard");
          } else {
            setError("No session found. Please try logging in again.");
            setTimeout(() => router.push("/auth"), 3000);
          }
        }, 500);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4 text-center" style={{ fontFamily: "var(--font-josefin-sans), 'Josefin Sans', sans-serif" }}>
      {error ? (
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">⚠️</span>
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-white/50 text-sm">Redirecting back to login...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <span className="loader" />
          <p className="text-white/80 animate-pulse font-medium tracking-wide">
            Finalizing authentication...
          </p>
        </div>
      )}

      <style jsx>{`
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
