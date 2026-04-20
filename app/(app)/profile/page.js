"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Coach link state
  const [coachEmail, setCoachEmail] = useState("");
  const [linkedCoach, setLinkedCoach] = useState(null);
  const [linkMsg, setLinkMsg] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (prof) {
        setProfile(prof);
        setFullName(prof.full_name || "");
        setHeightCm(prof.height_cm || "");
      }

      if (prof?.role === "athlete") {
        // Load most recent weight log entry for display
        const { data: lastWeight } = await supabase
          .from("weight_logs")
          .select("weight_kg")
          .eq("athlete_id", user.id)
          .order("logged_at", { ascending: false })
          .limit(1)
          .single();
        if (lastWeight) setWeightKg(lastWeight.weight_kg);

        // Load linked coach
        const { data: link } = await supabase
          .from("coach_athlete_links")
          .select("coach_id, profiles!coach_athlete_links_coach_id_fkey(full_name)")
          .eq("athlete_id", user.id)
          .single();
        if (link) setLinkedCoach(link.profiles);
      }
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, height_cm: heightCm || null, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (!error && weightKg) {
      await supabase.from("weight_logs").insert({
        athlete_id: user.id,
        weight_kg: parseFloat(weightKg),
        logged_at: new Date().toISOString().split("T")[0],
      });
    }

    setSaving(false);
    setSaveMsg(error ? error.message : "Saved!");
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function handleLinkCoach(e) {
    e.preventDefault();
    setLinking(true);
    setLinkMsg("");
    const { data: { user } } = await supabase.auth.getUser();

    const { data: coachId, error: rpcErr } = await supabase.rpc("get_profile_id_by_email", {
      coach_email: coachEmail,
    });

    if (rpcErr || !coachId) {
      setLinkMsg("No coach found with that email.");
      setLinking(false);
      return;
    }

    const { error } = await supabase
      .from("coach_athlete_links")
      .insert({ athlete_id: user.id, coach_id: coachId });

    if (error) {
      setLinkMsg(error.code === "23505" ? "Already linked to this coach." : error.message);
    } else {
      // Refresh linked coach display
      const { data: link } = await supabase
        .from("coach_athlete_links")
        .select("coach_id, profiles!coach_athlete_links_coach_id_fkey(full_name)")
        .eq("athlete_id", user.id)
        .single();
      if (link) setLinkedCoach(link.profiles);
      setCoachEmail("");
      setLinkMsg("Coach linked successfully!");
    }
    setLinking(false);
    setTimeout(() => setLinkMsg(""), 4000);
  }

  async function handleUnlink() {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("coach_athlete_links").delete().eq("athlete_id", user.id);
    setLinkedCoach(null);
  }

  const isAthlete = profile?.role === "athlete";

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Profile</h1>

      <form onSubmit={handleSave} style={styles.card}>
        <h2 style={styles.sectionTitle}>Personal Info</h2>
        <div style={styles.field}>
          <label style={styles.label}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={styles.input}
            placeholder="Jane Smith"
          />
        </div>
        {isAthlete && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Height (cm)</label>
              <input
                type="number"
                min={50}
                max={280}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                style={styles.input}
                placeholder="170"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Current Weight (kg) — logs to weight history</label>
              <input
                type="number"
                min={20}
                max={500}
                step={0.1}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                style={styles.input}
                placeholder="70.0"
              />
            </div>
          </>
        )}
        {saveMsg && (
          <p style={{ ...styles.msg, color: saveMsg.includes("!") ? "#4ade80" : "#f87171" }}>
            {saveMsg}
          </p>
        )}
        <button type="submit" style={styles.btn} disabled={saving}>
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </form>

      {isAthlete && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>My Coach</h2>
          {linkedCoach ? (
            <div style={styles.coachRow}>
              <span style={styles.coachName}>{linkedCoach.full_name || "Coach"}</span>
              <button onClick={handleUnlink} style={styles.unlinkBtn}>Unlink</button>
            </div>
          ) : (
            <form onSubmit={handleLinkCoach} style={styles.linkForm}>
              <input
                type="email"
                required
                value={coachEmail}
                onChange={(e) => setCoachEmail(e.target.value)}
                style={styles.input}
                placeholder="coach@example.com"
              />
              {linkMsg && (
                <p style={{ ...styles.msg, color: linkMsg.includes("!") ? "#4ade80" : "#f87171" }}>
                  {linkMsg}
                </p>
              )}
              <button type="submit" style={styles.btn} disabled={linking}>
                {linking ? "Linking…" : "Link Coach by Email"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "40px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  heading: {
    fontSize: "1.75rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 14,
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  sectionTitle: {
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#666",
    margin: 0,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#555",
  },
  input: {
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: "11px 14px",
    color: "#fff",
    fontSize: "0.95rem",
    outline: "none",
  },
  btn: {
    padding: "14px",
    border: "none",
    borderRadius: 12,
    background: "#fff",
    color: "#000",
    fontSize: "0.9rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
  msg: {
    fontSize: "0.85rem",
    textAlign: "center",
  },
  linkForm: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  coachRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  coachName: {
    fontWeight: 600,
    flex: 1,
  },
  unlinkBtn: {
    background: "none",
    border: "1px solid #3a3a3a",
    borderRadius: 8,
    color: "#888",
    fontSize: "0.8rem",
    padding: "6px 12px",
    cursor: "pointer",
  },
};
