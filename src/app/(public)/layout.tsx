import "@/styles/app/app.css";
import AppHeader from "@/components/app/AppHeader";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-wrapper">
      <AppHeader />
      {children}
    </div>
  );
}
