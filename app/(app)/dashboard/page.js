import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, height_cm')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'coach') return <CoachDashboard supabase={supabase} userId={user.id} profile={profile} />
  return <AthleteDashboard supabase={supabase} userId={user.id} profile={profile} />
}

async function AthleteDashboard({ supabase, userId, profile }) {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const [{ data: weights }, { data: exercises }, { data: meals }, { data: goals }] = await Promise.all([
    supabase.from('weight_logs').select('id').eq('athlete_id', userId).gte('logged_at', weekAgo),
    supabase.from('exercise_logs').select('id').eq('athlete_id', userId).gte('logged_at', weekAgo),
    supabase.from('meal_logs').select('id').eq('athlete_id', userId).eq('logged_at', today),
    supabase.from('fitness_goals').select('id').eq('athlete_id', userId).eq('is_completed', false),
  ])

  const name = profile?.full_name?.split(' ')[0] || 'Athlete'

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Welcome back, {name}</h1>
      <div style={styles.grid}>
        <StatCard
          label="Weight entries this week"
          value={weights?.length ?? 0}
          href="/weight"
          cta="Log weight"
        />
        <StatCard
          label="Workouts this week"
          value={exercises?.length ?? 0}
          href="/exercise"
          cta="Log exercise"
        />
        <StatCard
          label="Meals logged today"
          value={meals?.length ?? 0}
          href="/meals"
          cta="Log meal"
        />
        <StatCard
          label="Active fitness goals"
          value={goals?.length ?? 0}
          href="/goals"
          cta="View goals"
        />
      </div>
    </div>
  )
}

async function CoachDashboard({ supabase, userId }) {
  const { data: links } = await supabase
    .from('coach_athlete_links')
    .select('athlete_id, profiles!coach_athlete_links_athlete_id_fkey(full_name, height_cm)')
    .eq('coach_id', userId)

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Your Athletes</h1>
      {(!links || links.length === 0) ? (
        <p style={styles.empty}>No athletes linked yet. Athletes can link you from their Profile page.</p>
      ) : (
        <div style={styles.list}>
          {links.map((link) => (
            <Link key={link.athlete_id} href={`/coach/athletes/${link.athlete_id}`} style={styles.athleteCard}>
              <span style={styles.athleteName}>{link.profiles?.full_name || 'Unnamed'}</span>
              <span style={styles.athleteMeta}>
                {link.profiles?.height_cm ? `${link.profiles.height_cm} cm` : 'No height set'}
              </span>
              <span style={styles.chevron}>→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, href, cta }) {
  return (
    <a href={href} style={styles.card}>
      <div style={styles.cardValue}>{value}</div>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardCta}>{cta} →</div>
    </a>
  )
}

const styles = {
  page: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '40px 24px',
  },
  heading: {
    fontSize: '1.75rem',
    fontWeight: 800,
    marginBottom: 32,
    letterSpacing: '-0.02em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 14,
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    textDecoration: 'none',
    color: 'inherit',
    transition: 'border-color 0.15s',
  },
  cardValue: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#4ade80',
    lineHeight: 1,
  },
  cardLabel: {
    fontSize: '0.85rem',
    color: '#666',
    lineHeight: 1.3,
  },
  cardCta: {
    fontSize: '0.8rem',
    color: '#444',
    marginTop: 8,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  athleteCard: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 14,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    textDecoration: 'none',
    color: 'inherit',
  },
  athleteName: {
    fontWeight: 600,
    flex: 1,
  },
  athleteMeta: {
    color: '#666',
    fontSize: '0.85rem',
  },
  chevron: {
    color: '#444',
  },
  empty: {
    color: '#666',
    fontSize: '0.95rem',
  },
}
