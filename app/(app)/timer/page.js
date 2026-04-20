"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CIRCUMFERENCE = 2 * Math.PI * 126;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}`;
}

function beep(freq) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

function TimeInput({ label, minutes, seconds, onMinutes, onSeconds }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ width: "100%" }}>
      <label style={styles.fieldLabel}>{label}</label>
      <div
        style={{ ...styles.timeInput, boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.3)" : "none" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <input
          type="number"
          min={0}
          max={59}
          value={minutes}
          onChange={(e) => onMinutes(Math.max(0, Math.min(59, +e.target.value || 0)))}
          style={styles.timeDigit}
        />
        <span style={styles.timeSep}>:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={seconds}
          onChange={(e) => onSeconds(Math.max(0, Math.min(59, +e.target.value || 0)))}
          style={styles.timeDigit}
        />
      </div>
      <div style={styles.timeLabels}>
        <span style={styles.timeUnit}>min</span>
        <span style={styles.timeLabelSep} />
        <span style={styles.timeUnit}>sec</span>
      </div>
    </div>
  );
}

function RepsInput({ value, onChange }) {
  const [hovered, setHovered] = useState(false);
  return (
    <input
      type="number"
      min={1}
      max={99}
      value={value}
      onChange={(e) => onChange(Math.max(1, +e.target.value || 1))}
      style={{
        ...styles.repsInput,
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
}

function SetupScreen({ onStart }) {
  const [workMin, setWorkMin] = useState(0);
  const [workSec, setWorkSec] = useState(30);
  const [restMin, setRestMin] = useState(0);
  const [restSec, setRestSec] = useState(10);
  const [reps, setReps] = useState(8);

  function handleStart() {
    const workSecs = workMin * 60 + workSec;
    const restSecs = restMin * 60 + restSec;
    if (workSecs === 0) return alert("Work time must be greater than 0.");
    onStart({ workSecs, restSecs, totalReps: Math.max(1, reps) });
  }

  return (
    <div style={styles.setup}>
      <TimeInput
        label="Work"
        minutes={workMin}
        seconds={workSec}
        onMinutes={setWorkMin}
        onSeconds={setWorkSec}
      />
      <TimeInput
        label="Rest"
        minutes={restMin}
        seconds={restSec}
        onMinutes={setRestMin}
        onSeconds={setRestSec}
      />
      <div style={{ width: "100%" }}>
        <label style={styles.fieldLabel}>Reps</label>
        <RepsInput value={reps} onChange={setReps} />
      </div>
      <button style={styles.startBtn} onClick={handleStart}>
        Start
      </button>
    </div>
  );
}

function TimerScreen({ config, onReset }) {
  const { workSecs, restSecs, totalReps } = config;

  const [rep, setRep] = useState(1);
  const [phase, setPhase] = useState("work");
  const [remaining, setRemaining] = useState(workSecs);
  const [phaseDuration, setPhaseDuration] = useState(workSecs);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);

  const stateRef = useRef({ rep: 1, phase: "work", remaining: workSecs, phaseDuration: workSecs });

  useEffect(() => {
    stateRef.current = { rep, phase, remaining, phaseDuration };
  }, [rep, phase, remaining, phaseDuration]);

  const advance = useCallback(() => {
    const s = stateRef.current;

    if (s.phase === "work") {
      if (restSecs > 0) {
        beep(880);
        setPhase("rest");
        setRemaining(restSecs);
        setPhaseDuration(restSecs);
      } else {
        beep(880);
        if (s.rep >= totalReps) {
          setDone(true);
        } else {
          setRep((r) => r + 1);
          setRemaining(workSecs);
          setPhaseDuration(workSecs);
        }
      }
    } else {
      beep(440);
      if (s.rep >= totalReps) {
        setDone(true);
      } else {
        setRep((r) => r + 1);
        setPhase("work");
        setRemaining(workSecs);
        setPhaseDuration(workSecs);
      }
    }
  }, [workSecs, restSecs, totalReps]);

  useEffect(() => {
    if (paused || done) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          advance();
          return r;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused, done, advance]);

  const isWork = phase === "work";
  const ringColor = isWork ? "#4ade80" : "#60a5fa";
  const progress = remaining / phaseDuration;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  if (done) {
    return (
      <div style={styles.done}>
        <div style={{ fontSize: "5rem", lineHeight: 1 }}>✓</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800 }}>Done!</h2>
        <p style={{ color: "#666", fontSize: "0.95rem" }}>
          {totalReps} rep{totalReps > 1 ? "s" : ""} · {formatTime(workSecs)} work · {formatTime(restSecs)} rest
        </p>
        <button style={styles.startBtn} onClick={onReset}>
          Go Again
        </button>
      </div>
    );
  }

  return (
    <div style={styles.timer}>
      <div style={{ ...styles.phaseLabel, color: ringColor }}>
        {isWork ? "Work" : "Rest"}
      </div>

      <div style={styles.ringWrap}>
        <svg width={280} height={280} viewBox="0 0 280 280" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={140} cy={140} r={126}
            fill="none" stroke="#1e1e1e" strokeWidth={14} />
          <circle cx={140} cy={140} r={126}
            fill="none"
            stroke={ringColor}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.4s" }}
          />
        </svg>
        <div style={styles.timeDisplay}>
          <div style={styles.digits}>{formatTime(remaining)}</div>
          <div style={styles.repCount}>Rep {rep} of {totalReps}</div>
        </div>
      </div>

      <div style={styles.controls}>
        <button style={styles.resetBtn} onClick={onReset} title="Reset">↺</button>
        <button style={styles.pauseBtn} onClick={() => setPaused((p) => !p)}>
          {paused ? "▶" : "⏸"}
        </button>
      </div>
    </div>
  );
}

export default function TimerPage() {
  const [config, setConfig] = useState(null);

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Workout Timer</h1>
      {config ? (
        <TimerScreen config={config} onReset={() => setConfig(null)} />
      ) : (
        <SetupScreen onStart={setConfig} />
      )}
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "calc(100vh - 56px)",
    padding: 24,
  },
  heading: {
    fontSize: "1.25rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 40,
    textAlign: "center",
  },
  setup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    width: "100%",
    maxWidth: 360,
  },
  fieldLabel: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  timeInput: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: "14px 16px",
    transition: "box-shadow 0.2s",
    cursor: "pointer",
  },
  timeDigit: {
    width: 56,
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "2rem",
    fontWeight: 700,
    textAlign: "center",
    outline: "none",
    MozAppearance: "textfield",
  },
  timeSep: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#444",
  },
  timeLabels: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  timeUnit: {
    width: 56,
    textAlign: "center",
    fontSize: "0.65rem",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  timeLabelSep: {
    width: 24,
    flexShrink: 0,
  },
  repsInput: {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: "14px 16px",
    color: "#fff",
    transition: "box-shadow 0.2s",
    cursor: "pointer",
    fontSize: "2rem",
    fontWeight: 700,
    textAlign: "center",
    outline: "none",
  },
  startBtn: {
    marginTop: 12,
    width: "100%",
    padding: 18,
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
  timer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  phaseLabel: {
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginBottom: 16,
    transition: "color 0.3s",
  },
  ringWrap: {
    position: "relative",
    width: 280,
    height: 280,
    marginBottom: 32,
  },
  timeDisplay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  },
  digits: {
    fontSize: "4.5rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    lineHeight: 1,
  },
  repCount: {
    fontSize: "0.85rem",
    color: "#555",
    marginTop: 6,
    fontWeight: 500,
  },
  controls: {
    display: "flex",
    gap: 16,
    alignItems: "center",
  },
  pauseBtn: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "none",
    background: "#fff",
    color: "#000",
    fontSize: "1.4rem",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  resetBtn: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "none",
    background: "#1e1e1e",
    color: "#aaa",
    fontSize: "1.1rem",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  done: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    textAlign: "center",
    maxWidth: 360,
    width: "100%",
  },
};
