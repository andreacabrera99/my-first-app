import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CoachAthletesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coach') redirect('/dashboard')

  const { data: links } = await supabase
    .from('coach_athlete_links')
    .select(`
      athlete_id,
      profiles!coach_athlete_links_athlete_id_fkey(full_name, height_cm)
    `)
    .eq('coach_id', user.id)

  // Get most recent weight for each athlete
  const athleteIds = (links || []).map((l) => l.athlete_id)
  const weightMap = {}
  if (athleteIds.length > 0) {
    const { data: weights } = await supabase
      .from('weight_logs')
      .select('athlete_id, weight_kg, logged_at')
      .in('athlete_id', athleteIds)
      .order('logged_at', { ascending: false })

    // Keep only the most recent per athlete
    weights?.forEach((w) => {
      if (!weightMap[w.athlete_id]) weightMap[w.athlete_id] = w
    })
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Your Athletes</h1>
      {(!links || links.length === 0) ? (
        <p style={styles.empty}>No athletes linked yet. Athletes link to you from their Profile page using your email address.</p>
      ) : (
        <div style={styles.list}>
          {links.map((link) => {
            const prof = link.profiles
            const weight = weightMap[link.athlete_id]
            return (
              <Link key={link.athlete_id} href={`/coach/athletes/${link.athlete_id}`} style={styles.card}>
                <div style={styles.cardLeft}>
                  <span style={styles.name}>{prof?.full_name || 'Unnamed athlete'}</span>
                  <span style={styles.meta}>
                    {[
                      prof?.height_cm && `${prof.height_cm} cm`,
                      weight && `${weight.weight_kg} kg (${weight.logged_at})`,
                    ].filter(Boolean).join(' · ') || 'No measurements yet'}
                  </span>
                </div>
                <span style={styles.chevron}>View →</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: 700, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 24 },
  heading: { fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'inherit' },
  cardLeft: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  name: { fontWeight: 600, fontSize: '1rem' },
  meta: { color: '#666', fontSize: '0.85rem' },
  chevron: { color: '#4ade80', fontSize: '0.85rem', fontWeight: 600 },
  empty: { color: '#666', fontSize: '0.95rem', lineHeight: 1.6 },
}
