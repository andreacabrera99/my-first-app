"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar({ role }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
    { href: "/weight", label: "Weight" },
    { href: "/exercise", label: "Exercise" },
    { href: "/meals", label: "Meals" },
    { href: "/goals", label: "Goals" },
    { href: "/timer", label: "Timer" },
    ...(role === "coach" ? [{ href: "/coach/athletes", label: "Athletes" }] : []),
  ];

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <span style={styles.logo}>FitTrack</span>
        <div style={styles.links}>
          {links.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                ...styles.link,
                ...(pathname === href || pathname.startsWith(href + "/")
                  ? styles.linkActive
                  : {}),
              }}
            >
              {label}
            </a>
          ))}
        </div>
        <button onClick={signOut} style={styles.signOut}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: "#111",
    borderBottom: "1px solid #222",
    height: 56,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 1100,
    margin: "0 auto",
    height: "100%",
    display: "flex",
    alignItems: "center",
    gap: 24,
    padding: "0 24px",
  },
  logo: {
    fontWeight: 800,
    fontSize: "1rem",
    letterSpacing: "-0.01em",
    color: "#4ade80",
    marginRight: 8,
    flexShrink: 0,
  },
  links: {
    display: "flex",
    gap: 4,
    flex: 1,
    overflowX: "auto",
  },
  link: {
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "#666",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "color 0.15s",
  },
  linkActive: {
    color: "#fff",
    background: "#1a1a1a",
  },
  signOut: {
    background: "none",
    border: "none",
    color: "#555",
    fontSize: "0.85rem",
    cursor: "pointer",
    flexShrink: 0,
  },
};
