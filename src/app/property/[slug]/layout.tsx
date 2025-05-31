import type { Metadata } from "next";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: "Site homepage",
  description: "Site homepage",
};

export default function Layout({
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
