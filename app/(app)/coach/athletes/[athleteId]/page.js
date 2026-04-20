import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AthleteDetailPage({ params }) {
  const { athleteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify coach role and that this athlete is actually linked to this coach
  const [{ data: coachProfile }, { data: link }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('coach_athlete_links')
      .select('athlete_id')
      .eq('coach_id', user.id)
      .eq('athlete_id', athleteId)
      .single(),
  ])

  if (coachProfile?.role !== 'coach' || !link) redirect('/dashboard')

  const [{ data: profile }, { data: weights }, { data: exercises }, { data: meals }] = await Promise.all([
    supabase.from('profiles').select('full_name, height_cm').eq('id', athleteId).single(),
    supabase.from('weight_logs').select('*').eq('athlete_id', athleteId).order('logged_at', { ascending: false }).limit(10),
    supabase.from('exercise_logs').select('*').eq('athlete_id', athleteId).order('logged_at', { ascending: false }).limit(10),
    supabase.from('meal_logs').select('*').eq('athlete_id', athleteId).order('logged_at', { ascending: false }).limit(15),
  ])

  const name = profile?.full_name || 'Athlete'

  return (
    <div style={styles.page}>
      <a href="/coach/athletes" style={styles.back}>← All Athletes</a>
      <h1 style={styles.heading}>{name}</h1>

      {/* Body Stats — US 20 */}
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Body Stats</h2>
        <div style={styles.statRow}>
          <Stat label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : '—'} />
          <Stat
            label="Latest Weight"
            value={weights?.[0] ? `${weights[0].weight_kg} kg` : '—'}
            sub={weights?.[0]?.logged_at}
          />
        </div>
        {weights && weights.length > 1 && (
          <div style={styles.subSection}>
            <div style={styles.subTitle}>Weight History</div>
            {weights.map((w) => (
              <div key={w.id} style={styles.logRow}>
                <span>{w.weight_kg} kg</span>
                <span style={styles.dim}>{w.logged_at}{w.notes ? ` · ${w.notes}` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Exercise Logs — US 21 */}
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Recent Exercise</h2>
        {(!exercises || exercises.length === 0) ? (
          <p style={styles.empty}>No exercises logged yet.</p>
        ) : exercises.map((ex) => (
          <div key={ex.id} style={styles.logRow}>
            <div style={styles.logLeft}>
              <span style={styles.logName}>{ex.activity_name}</span>
              <span style={styles.dim}>
                {[
                  ex.duration_min && `${ex.duration_min} min`,
                  ex.sets && ex.reps_per_set && `${ex.sets}×${ex.reps_per_set}`,
                  ex.notes,
                ].filter(Boolean).join(' · ')}
              </span>
            </div>
            <span style={styles.dim}>{ex.logged_at}</span>
          </div>
        ))}
      </section>

      {/* Meal Logs — US 22 */}
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Recent Meals</h2>
        {(!meals || meals.length === 0) ? (
          <p style={styles.empty}>No meals logged yet.</p>
        ) : meals.map((meal) => (
          <div key={meal.id} style={styles.logRow}>
            <div style={styles.logLeft}>
              <span style={styles.mealBadge}>{meal.meal_name}</span>
              <span style={styles.logName}>{meal.food_items}</span>
              {meal.calories && <span style={styles.dim}>{meal.calories} kcal</span>}
            </div>
            <span style={styles.dim}>{meal.logged_at}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
      {sub && <div style={styles.dim}>{sub}</div>}
    </div>
  )
}

const styles = {
  page: { maxWidth: 700, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 24 },
  back: { color: '#555', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: -8 },
  heading: { fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 },
  sectionTitle: { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', margin: 0 },
  statRow: { display: 'flex', gap: 32 },
  stat: { display: 'flex', flexDirection: 'column', gap: 2 },
  statValue: { fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' },
  statLabel: { fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' },
  subSection: { borderTop: '1px solid #2a2a2a', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 },
  subTitle: { fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' },
  logRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid #222' },
  logLeft: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  logName: { fontSize: '0.9rem', fontWeight: 500 },
  mealBadge: { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4ade80' },
  dim: { color: '#555', fontSize: '0.8rem' },
  empty: { color: '#666', fontSize: '0.85rem' },
}
