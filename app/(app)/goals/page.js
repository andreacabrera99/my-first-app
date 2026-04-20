"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoalsPage() {
  const supabase = createClient();

  const [fitnessGoals, setFitnessGoals] = useState([]);
  const [dietaryGoals, setDietaryGoals] = useState([]);

  const [fitText, setFitText] = useState("");
  const [fitDate, setFitDate] = useState("");
  const [addingFit, setAddingFit] = useState(false);

  const [dietText, setDietText] = useState("");
  const [dietCalories, setDietCalories] = useState("");
  const [dietDate, setDietDate] = useState("");
  const [addingDiet, setAddingDiet] = useState(false);

  const [msg, setMsg] = useState("");

  useEffect(() => { loadGoals() }, []);

  async function loadGoals() {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: fit }, { data: diet }] = await Promise.all([
      supabase.from("fitness_goals").select("*").eq("athlete_id", user.id).order("created_at", { ascending: false }),
      supabase.from("dietary_goals").select("*").eq("athlete_id", user.id).order("created_at", { ascending: false }),
    ]);
    setFitnessGoals(fit || []);
    setDietaryGoals(diet || []);
  }

  async function addFitnessGoal(e) {
    e.preventDefault();
    setAddingFit(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("fitness_goals").insert({
      athlete_id: user.id,
      goal_text: fitText,
      target_date: fitDate || null,
    });
    setFitText(""); setFitDate("");
    loadGoals();
    setAddingFit(false);
  }

  async function addDietaryGoal(e) {
    e.preventDefault();
    setAddingDiet(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("dietary_goals").insert({
      athlete_id: user.id,
      goal_text: dietText,
      daily_calories_target: dietCalories ? parseInt(dietCalories) : null,
      target_date: dietDate || null,
    });
    setDietText(""); setDietCalories(""); setDietDate("");
    loadGoals();
    setAddingDiet(false);
  }

  async function toggleGoal(table, id, current) {
    await supabase.from(table).update({ is_completed: !current }).eq("id", id);
    loadGoals();
  }

  async function deleteGoal(table, id) {
    await supabase.from(table).delete().eq("id", id);
    loadGoals();
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Goals</h1>

      {/* Fitness Goals */}
      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>Fitness Goals</h2>
        <form onSubmit={addFitnessGoal} style={styles.addForm}>
          <input
            type="text"
            required
            value={fitText}
            onChange={(e) => setFitText(e.target.value)}
            style={{ ...styles.input, flex: 2 }}
            placeholder="Run a 5K, Do 10 pull-ups…"
          />
          <input
            type="date"
            value={fitDate}
            onChange={(e) => setFitDate(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
          />
          <button type="submit" style={styles.addBtn} disabled={addingFit}>
            {addingFit ? "…" : "Add"}
          </button>
        </form>
        <div style={styles.list}>
          {fitnessGoals.length === 0 ? (
            <p style={styles.empty}>No fitness goals yet.</p>
          ) : fitnessGoals.map((g) => (
            <GoalItem
              key={g.id}
              goal={g}
              onToggle={() => toggleGoal("fitness_goals", g.id, g.is_completed)}
              onDelete={() => deleteGoal("fitness_goals", g.id)}
            />
          ))}
        </div>
      </section>

      {/* Dietary Goals */}
      <section style={styles.section}>
        <h2 style={styles.sectionHeading}>Dietary Goals</h2>
        <form onSubmit={addDietaryGoal} style={{ ...styles.addForm, flexWrap: "wrap" }}>
          <input
            type="text"
            required
            value={dietText}
            onChange={(e) => setDietText(e.target.value)}
            style={{ ...styles.input, flex: "2 1 200px" }}
            placeholder="Eat more protein, cut sugar…"
          />
          <input
            type="number"
            min={0}
            value={dietCalories}
            onChange={(e) => setDietCalories(e.target.value)}
            style={{ ...styles.input, flex: "1 1 100px" }}
            placeholder="Calories/day"
          />
          <input
            type="date"
            value={dietDate}
            onChange={(e) => setDietDate(e.target.value)}
            style={{ ...styles.input, flex: "1 1 140px" }}
          />
          <button type="submit" style={styles.addBtn} disabled={addingDiet}>
            {addingDiet ? "…" : "Add"}
          </button>
        </form>
        <div style={styles.list}>
          {dietaryGoals.length === 0 ? (
            <p style={styles.empty}>No dietary goals yet.</p>
          ) : dietaryGoals.map((g) => (
            <GoalItem
              key={g.id}
              goal={g}
              extra={g.daily_calories_target && `${g.daily_calories_target} kcal/day`}
              onToggle={() => toggleGoal("dietary_goals", g.id, g.is_completed)}
              onDelete={() => deleteGoal("dietary_goals", g.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function GoalItem({ goal, extra, onToggle, onDelete }) {
  return (
    <div style={{ ...styles.goalItem, opacity: goal.is_completed ? 0.5 : 1 }}>
      <button onClick={onToggle} style={{ ...styles.check, ...(goal.is_completed ? styles.checkDone : {}) }}>
        {goal.is_completed ? "✓" : ""}
      </button>
      <div style={styles.goalLeft}>
        <span style={{ ...styles.goalText, textDecoration: goal.is_completed ? "line-through" : "none" }}>
          {goal.goal_text}
        </span>
        <span style={styles.goalMeta}>
          {[extra, goal.target_date && `by ${goal.target_date}`].filter(Boolean).join(" · ")}
        </span>
      </div>
      <button onClick={onDelete} style={styles.deleteBtn}>✕</button>
    </div>
  );
}

const styles = {
  page: { maxWidth: 680, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 40 },
  heading: { fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" },
  section: { display: "flex", flexDirection: "column", gap: 16 },
  sectionHeading: { fontSize: "1.1rem", fontWeight: 700, margin: 0 },
  addForm: { display: "flex", gap: 10, alignItems: "flex-end" },
  input: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" },
  addBtn: { padding: "11px 20px", border: "none", borderRadius: 10, background: "#fff", color: "#000", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  empty: { color: "#666", fontSize: "0.9rem" },
  goalItem: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, transition: "opacity 0.2s" },
  check: { width: 24, height: 24, borderRadius: "50%", border: "1px solid #333", background: "none", color: "#4ade80", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkDone: { background: "#4ade80", color: "#000", border: "1px solid #4ade80" },
  goalLeft: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  goalText: { fontSize: "0.95rem" },
  goalMeta: { color: "#555", fontSize: "0.8rem" },
  deleteBtn: { background: "none", border: "none", color: "#444", fontSize: "0.85rem", cursor: "pointer", padding: 4 },
};
