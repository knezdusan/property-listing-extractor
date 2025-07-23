import type { Metadata } from "next";
import "@/styles/sites/base.css";

export const metadata: Metadata = {
  title: "Site homepage",
  description: "Site homepage",
};

export default function SiteMainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="site-wrapper">{children}</div>;
}
