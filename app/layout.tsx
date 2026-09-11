import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport = {
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "AR Restaurant Menu — View Our Dishes in 3D",
  description:
    "Experience our dishes in Augmented Reality. Scan, view, and explore menu items in 3D right on your dining table.",
  keywords: [
    "AR menu",
    "augmented reality restaurant",
    "3D food",
    "restaurant menu",
    "view in AR",
  ],
  authors: [{ name: "AR Restaurant" }],
  openGraph: {
    title: "AR Restaurant Menu — View Our Dishes in 3D",
    description:
      "Experience our dishes in Augmented Reality. See it on your table before you order.",
    type: "website",
  },
  icons: {
    icon: "/images/logo.png",
    shortcut: "/favicon.ico",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "AR Restaurant",
    servesCuisine: "International",
    description: "Experience our dishes in Augmented Reality.",
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        />
      </head>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
