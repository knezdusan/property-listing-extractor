import Link from "next/link";
import NavAuth from "@/components/auth/NavAuth";

export default function AppNavigation() {
  return (
    <nav className="main-nav">
      <ul className="nav-app">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/">About</Link>
        </li>
      </ul>
      <NavAuth className="nav-auth" />
    </nav>
  );
}
