import type { Metadata } from "next";
import { Inter, Montserrat, Playfair_Display } from "next/font/google";
import "@/styles/global.css";
import "@/styles/reset.css";
import "@/styles/app/app.css";
import AppHeader from "@/components/app/AppHeader";
import AppModal from "@/components/app/AppModal";
import { AppContextProvider } from "@/components/contexts/AppContext";

// Initialize fonts

// Configure variable fonts for base font, heading font, and accent font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-base", // CSS variable name
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-accent",
});

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
    <html lang="en" className={`${inter.variable} ${montserrat.variable} ${playfair.variable}`}>
      <body>
        <AppContextProvider>
          <div className="app-wrapper">
            <AppHeader />
            {children}
            <AppModal />
          </div>
        </AppContextProvider>
      </body>
    </html>
  );
}
