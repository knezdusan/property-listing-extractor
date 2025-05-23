import type { Metadata } from "next";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: "Airbnb Listing Extractor",
  description: "Use puppeteer to extract listing data from Airbnb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
