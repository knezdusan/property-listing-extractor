import type { Metadata } from "next";
import "@/styles/global.css";
import "@/styles/reset.css";
import "@/styles/app/app.css";
import AppHeader from "@/components/app/AppHeader";
import AppModal from "@/components/app/AppModal";
import { AppContextProvider } from "@/components/contexts/AppContext";

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
