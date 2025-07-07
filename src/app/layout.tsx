import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@/styles/global.css";
import "@/styles/app/app.css";
import AppHeader from "@/components/app/AppHeader";
import AppModal from "@/components/app/AppModal";
import { AppContextProvider } from "@/contexts/AppContext";
import { getAuth } from "@/utils/auth";

// Initialize fonts

// Configure variable fonts for base font, heading font, and accent font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-base", // CSS variable name
});

const interHeading = Inter({
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get user auth data {id, email}
  const auth = await getAuth();

  return (
    <html lang="en" className={`${inter.variable} ${interHeading.variable} ${playfair.variable}`}>
      <body>
        <AppContextProvider auth={auth}>
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
