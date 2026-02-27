"use client";

import Image from "next/image";

export default function DashboardPage() {
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

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center gap-4 px-10 py-12 rounded-3xl text-center"
        style={{
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          fontFamily: "var(--font-josefin-sans), 'Josefin Sans', sans-serif",
        }}
      >
        <span className="text-5xl">🌿</span>
        <h1 className="text-4xl font-bold text-white tracking-wide">
          Hi, Dashboard!
        </h1>
        <p className="text-white/60 text-base">
          Welcome to Vazhikaatti. More features coming soon.
        </p>
      </div>
    </main>
  );
}
