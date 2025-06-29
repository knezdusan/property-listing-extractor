import Link from "next/link";
import { MdErrorOutline, MdHome } from "react-icons/md";
import "@/styles/app/not-found.css";

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <MdErrorOutline size={64} className="not-found-icon" />
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for doesn&apos;t exist or you don&apos;t have permission to access it.</p>
        <Link href="/" className="btn btn-primary">
          <MdHome className="btn-icon" />
          Return to Home
        </Link>
      </div>
    </div>
  );
}
