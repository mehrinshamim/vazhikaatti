"use client";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bgimg.jpeg"
          alt="BariGardee background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Hero Content */}
      <div
        className="relative z-10 flex flex-col items-center justify-between text-center px-6 max-w-3xl mx-auto w-full"
        style={{ minHeight: "70vh", paddingTop: "15vh", paddingBottom: "10vh" }}
      >
        {/* Top block — brand name + heading + subheading grouped tightly */}
        <div className="flex flex-col items-center gap-5">
          {/* Brand Name */}
          <h1
            className="text-5xl sm:text-5xl font-bold tracking-wide text-white drop-shadow-lg"
            style={{ fontFamily: "var(--font-josefin-sans), 'Josefin Sans', sans-serif" }}
          >
            Vazhikaatti🌿
          </h1>

          {/* Main Heading */}
          <h2
            className="text-3xl sm:text-2xl font-bold text-emerald-400 leading-tight drop-shadow-md"
            style={{ fontFamily: "var(--font-josefin-sans), 'Josefin Sans', sans-serif" }}
          >
            Navigate Smarter. Stay Safer.
          </h2>

          {/* Subheading */}
          <p
            className="text-base sm:text-lg text-white/80 leading-relaxed max-w-xl"
            style={{ fontFamily: "var(--font-josefin-sans), 'Josefin Sans', sans-serif" }}
          >
            A community-driven safety map that helps you discover nearby hazards,
            report issues, and make informed travel decisions in real time.
          </p>
        </div>

        {/* CTA Button — sits near the bottom */}
        <div className="flex items-end">
          <a href="/auth" className="get-started-btn">
            Get Started
          </a>
        </div>
      </div>

      <style jsx>{`
        .get-started-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.875rem 2.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          font-family: var(--font-josefin-sans), "Josefin Sans", sans-serif;
          border-radius: 9999px;
          box-shadow: 0 6px 28px rgba(16, 185, 129, 0.45),
            0 2px 8px rgba(0, 0, 0, 0.25);
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease,
            background 0.18s ease;
        }
        .get-started-btn:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 10px 36px rgba(16, 185, 129, 0.55),
            0 3px 12px rgba(0, 0, 0, 0.3);
        }
        .get-started-btn:active {
          transform: translateY(0) scale(0.99);
        }
      `}</style>
    </main>
  );
}
