import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth()
  const [routes, setRoutes] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getRoutes(), api.getLocations()])
      .then(([r, l]) => { setRoutes(r); setLocations(l) })
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: routes.length,
    planned: routes.filter(r => r.status === 'planned').length,
    active: routes.filter(r => r.status === 'in_progress').length,
    completed: routes.filter(r => r.status === 'completed').length,
    totalKm: routes.reduce((s, r) => s + (r.total_distance_km || 0), 0).toFixed(1),
  }

  const recentRoutes = routes.slice(0, 5)

  const statusColor = s => ({ planned: 'blue', in_progress: 'amber', completed: 'green' }[s] || 'muted')

  const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (loading) return <div className="loading"><div className="spinner" /> Loading dashboard...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]} 👋</div>
      </div>

      <div className="stats-row">
        <div className="stat-card amber">
          <div className="stat-label">Total Routes</div>
          <div className="stat-value amber">{stats.total}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Planned</div>
          <div className="stat-value blue">{stats.planned}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{color:'var(--red)'}}>{stats.active}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Completed</div>
          <div className="stat-value green">{stats.completed}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Total km Planned</div>
          <div className="stat-value amber">{stats.totalKm}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Locations Saved</div>
          <div className="stat-value blue">{locations.length}</div>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">📦 Recent Routes</div>
          {recentRoutes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗺️</div>
              <div className="empty-title">No routes yet</div>
              <div className="empty-desc">Create your first optimized route</div>
            </div>
          ) : (
            <div>
              {recentRoutes.map(r => (
                <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--text)' }}>{r.name}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>{fmtDate(r.created_at)} · {r.total_distance_km} km · {r.stops?.length || 0} stops</div>
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status.replace('_', ' ')}</span>
                </div>
              ))}
              {routes.length > 5 && (
                <button className="btn btn-ghost btn-sm" style={{marginTop:12}} onClick={() => onNavigate('history')}>
                  View all {routes.length} routes →
                </button>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">📍 Quick Actions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button className="btn btn-primary btn-full" onClick={() => onNavigate('locations')}>
              + Add Pickup / Delivery Location
            </button>
            <button className="btn btn-secondary btn-full" onClick={() => onNavigate('planner')}>
              🗺️ Open Route Planner
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => onNavigate('history')}>
              📋 View Route History
            </button>
          </div>

          <hr className="divider" />

          <div className="card-title" style={{marginBottom:12}}>📍 Saved Locations</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <div style={{ background:'var(--blue-dim)', borderRadius:20, padding:'3px 10px', fontSize:'0.78rem', color:'var(--blue)', fontWeight:600 }}>
              📦 {locations.filter(l => l.type === 'pickup').length} Pickups
            </div>
            <div style={{ background:'var(--amber-dim)', borderRadius:20, padding:'3px 10px', fontSize:'0.78rem', color:'var(--amber)', fontWeight:600 }}>
              🏠 {locations.filter(l => l.type === 'delivery').length} Deliveries
            </div>
          </div>
          {locations.slice(0, 3).map(l => (
            <div key={l.id} className="location-item">
              <div className={`location-icon ${l.type}`}>{l.type === 'pickup' ? '📦' : '🏠'}</div>
              <div>
                <div className="location-name">{l.name}</div>
                <div className="location-address">{l.address}</div>
              </div>
            </div>
          ))}
          {locations.length > 3 && (
            <button className="btn btn-ghost btn-sm" style={{marginTop:8}} onClick={() => onNavigate('locations')}>
              +{locations.length - 3} more locations
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
