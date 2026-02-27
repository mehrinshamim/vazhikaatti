import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import "./globals.css";

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  weight: ["100", "300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vazhikaatti 🌿",
  description:
    "Your safety guide",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${josefinSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
