"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ExercisePage() {
  const supabase = createClient();
  const [entries, setEntries] = useState([]);
  const [activityName, setActivityName] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [sets, setSets] = useState("");
  const [repsPerSet, setRepsPerSet] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadEntries() }, []);

  async function loadEntries() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("exercise_logs")
      .select("*")
      .eq("athlete_id", user.id)
      .order("logged_at", { ascending: false });
    setEntries(data || []);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("exercise_logs").insert({
      athlete_id: user.id,
      activity_name: activityName,
      duration_min: durationMin ? parseInt(durationMin) : null,
      sets: sets ? parseInt(sets) : null,
      reps_per_set: repsPerSet ? parseInt(repsPerSet) : null,
      notes: notes || null,
      logged_at: date,
    });
    if (!error) {
      setActivityName(""); setDurationMin(""); setSets(""); setRepsPerSet(""); setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
      setMsg("Exercise logged!");
      setTimeout(() => setMsg(""), 3000);
      loadEntries();
    } else {
      setMsg(error.message);
    }
    setAdding(false);
  }

  async function handleDelete(id) {
    await supabase.from("exercise_logs").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Exercise Log</h1>

      <form onSubmit={handleAdd} style={styles.card}>
        <h2 style={styles.sectionTitle}>Log Exercise</h2>
        <div style={styles.field}>
          <label style={styles.label}>Activity</label>
          <input
            type="text"
            required
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            style={styles.input}
            placeholder="Running, Squats, Swimming…"
          />
        </div>
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Duration (min)</label>
            <input type="number" min={1} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} style={styles.input} placeholder="30" />
          </div>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Sets</label>
            <input type="number" min={1} value={sets} onChange={(e) => setSets(e.target.value)} style={styles.input} placeholder="3" />
          </div>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Reps/Set</label>
            <input type="number" min={1} value={repsPerSet} onChange={(e) => setRepsPerSet(e.target.value)} style={styles.input} placeholder="10" />
          </div>
        </div>
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 2 }}>
            <label style={styles.label}>Notes (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} style={styles.input} placeholder="Felt strong today" />
          </div>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
          </div>
        </div>
        {msg && <p style={styles.msg}>{msg}</p>}
        <button type="submit" style={styles.btn} disabled={adding}>
          {adding ? "Logging…" : "Log Exercise"}
        </button>
      </form>

      <div style={styles.list}>
        {entries.length === 0 ? (
          <p style={styles.empty}>No exercises logged yet.</p>
        ) : entries.map((entry) => (
          <div key={entry.id} style={styles.entry}>
            <div style={styles.entryLeft}>
              <span style={styles.entryName}>{entry.activity_name}</span>
              <span style={styles.entryMeta}>
                {[
                  entry.duration_min && `${entry.duration_min} min`,
                  entry.sets && entry.reps_per_set && `${entry.sets}×${entry.reps_per_set} reps`,
                  entry.notes,
                ].filter(Boolean).join(" · ")}
              </span>
            </div>
            <div style={styles.entryRight}>
              <span style={styles.entryDate}>{entry.logged_at}</span>
              <button onClick={() => handleDelete(entry.id)} style={styles.deleteBtn}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 640, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 24 },
  heading: { fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" },
  card: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 14 },
  sectionTitle: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666", margin: 0 },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#555" },
  input: { background: "#111", border: "1px solid #2a2a2a", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: "0.95rem", outline: "none", width: "100%", boxSizing: "border-box" },
  btn: { padding: 14, border: "none", borderRadius: 12, background: "#fff", color: "#000", fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer" },
  msg: { fontSize: "0.85rem", color: "#4ade80", textAlign: "center" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  empty: { color: "#666", fontSize: "0.9rem" },
  entry: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 },
  entryLeft: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
  entryName: { fontWeight: 600 },
  entryMeta: { color: "#666", fontSize: "0.85rem" },
  entryRight: { display: "flex", alignItems: "center", gap: 12 },
  entryDate: { color: "#555", fontSize: "0.85rem" },
  deleteBtn: { background: "none", border: "none", color: "#444", fontSize: "0.85rem", cursor: "pointer", padding: 4 },
};
