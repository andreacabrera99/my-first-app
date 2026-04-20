"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>FitTrack</h1>
        <p style={styles.subtitle}>Sign in to your account</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p style={styles.footer}>
          Don&apos;t have an account?{" "}
          <a href="/signup" style={styles.link}>Sign up</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
  },
  title: {
    fontSize: "2rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    color: "#666",
    fontSize: "0.9rem",
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#666",
  },
  input: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: "12px 14px",
    color: "#fff",
    fontSize: "1rem",
    outline: "none",
  },
  error: {
    color: "#f87171",
    fontSize: "0.85rem",
    textAlign: "center",
  },
  btn: {
    marginTop: 8,
    padding: 16,
    border: "none",
    borderRadius: 14,
    background: "#fff",
    color: "#000",
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
  footer: {
    marginTop: 24,
    textAlign: "center",
    color: "#666",
    fontSize: "0.9rem",
  },
  link: {
    color: "#4ade80",
    textDecoration: "none",
    fontWeight: 600,
  },
};
