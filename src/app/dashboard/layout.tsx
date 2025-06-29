import { getAuth } from "@/utils/auth";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Check authentication status - don't wrap in try/catch to allow notFound to work
  const auth = await getAuth();

  // If not authenticated, trigger the 404 page
  if (!auth) {
    // This will show the not-found page
    notFound();
    // The function stops here when triggering notFound
  }

  // If we get here, the user is authenticated
  try {
    // Render the dashboard with any additional data fetching
    return <div className="dashboard">{children}</div>;
  } catch (error) {
    // This catch only handles errors in rendering, not auth errors
    console.error("Dashboard render error:", error);
    return (
      <div className="dashboard error">
        <h1>Dashboard Error</h1>
        <p>There was a problem loading your dashboard. Please try again later.</p>
        <Link href="/" className="btn btn-primary">
          Return to Home
        </Link>
      </div>
    );
  }
}
