"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack", "Other"];

export default function MealsPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState([]);
  const [mealName, setMealName] = useState("Breakfast");
  const [foodItems, setFoodItems] = useState("");
  const [calories, setCalories] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadEntries() }, []);

  async function loadEntries() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("athlete_id", user.id)
      .order("logged_at", { ascending: false });
    setEntries(data || []);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("meal_logs").insert({
      athlete_id: user.id,
      meal_name: mealName,
      food_items: foodItems,
      calories: calories ? parseInt(calories) : null,
      logged_at: date,
    });
    if (!error) {
      setFoodItems(""); setCalories("");
      setDate(new Date().toISOString().split("T")[0]);
      setMsg("Meal logged!");
      setTimeout(() => setMsg(""), 3000);
      loadEntries();
    } else {
      setMsg(error.message);
    }
    setAdding(false);
  }

  async function handleDelete(id) {
    await supabase.from("meal_logs").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    if (!acc[entry.logged_at]) acc[entry.logged_at] = [];
    acc[entry.logged_at].push(entry);
    return acc;
  }, {});

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Meal Log</h1>

      <form onSubmit={handleAdd} style={styles.card}>
        <h2 style={styles.sectionTitle}>Log a Meal</h2>
        <div style={styles.field}>
          <label style={styles.label}>Meal</label>
          <div style={styles.slotRow}>
            {MEAL_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setMealName(slot)}
                style={{ ...styles.slotBtn, ...(mealName === slot ? styles.slotBtnActive : {}) }}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Food Items</label>
          <textarea
            required
            value={foodItems}
            onChange={(e) => setFoodItems(e.target.value)}
            style={{ ...styles.input, resize: "vertical", minHeight: 72 }}
            placeholder="Oatmeal with banana, black coffee…"
          />
        </div>
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Calories (optional)</label>
            <input type="number" min={0} value={calories} onChange={(e) => setCalories(e.target.value)} style={styles.input} placeholder="450" />
          </div>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
          </div>
        </div>
        {msg && <p style={styles.msg}>{msg}</p>}
        <button type="submit" style={styles.btn} disabled={adding}>
          {adding ? "Logging…" : "Log Meal"}
        </button>
      </form>

      <div style={styles.history}>
        {Object.keys(grouped).length === 0 ? (
          <p style={styles.empty}>No meals logged yet.</p>
        ) : Object.entries(grouped).map(([date, dayEntries]) => (
          <div key={date}>
            <div style={styles.dateHeader}>{date}</div>
            <div style={styles.list}>
              {dayEntries.map((entry) => (
                <div key={entry.id} style={styles.entry}>
                  <div style={styles.entryLeft}>
                    <span style={styles.mealBadge}>{entry.meal_name}</span>
                    <span style={styles.foodItems}>{entry.food_items}</span>
                    {entry.calories && <span style={styles.entryMeta}>{entry.calories} kcal</span>}
                  </div>
                  <button onClick={() => handleDelete(entry.id)} style={styles.deleteBtn}>✕</button>
                </div>
              ))}
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
  slotRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  slotBtn: { padding: "8px 14px", border: "1px solid #2a2a2a", borderRadius: 20, background: "#111", color: "#666", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer" },
  slotBtnActive: { background: "#4ade80", color: "#000", border: "1px solid #4ade80" },
  btn: { padding: 14, border: "none", borderRadius: 12, background: "#fff", color: "#000", fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer" },
  msg: { fontSize: "0.85rem", color: "#4ade80", textAlign: "center" },
  history: { display: "flex", flexDirection: "column", gap: 20 },
  dateHeader: { fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: 8 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  empty: { color: "#666", fontSize: "0.9rem" },
  entry: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 },
  entryLeft: { flex: 1, display: "flex", flexDirection: "column", gap: 4 },
  mealBadge: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#4ade80" },
  foodItems: { fontSize: "0.9rem", color: "#ccc" },
  entryMeta: { color: "#555", fontSize: "0.8rem" },
  deleteBtn: { background: "none", border: "none", color: "#444", fontSize: "0.85rem", cursor: "pointer", padding: 4, flexShrink: 0 },
};
