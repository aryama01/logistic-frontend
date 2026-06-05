import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../utils/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const makeNumberedIcon = (num, color) => L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50%;background:${color};color:${color === '#f59e0b' ? '#0d0f12' : 'white'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;border:2px solid rgba(255,255,255,0.3);box-shadow:0 2px 6px rgba(0,0,0,0.4);">${num}</div>`,
  iconSize: [26, 26], iconAnchor: [13, 13],
})

function FitBounds({ stops }) {
  const map = useMap()
  useEffect(() => {
    if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [stops, map])
  return null
}

const STATUS_LABELS = { planned: 'Planned', in_progress: 'In Progress', completed: 'Completed' }

export default function HistoryPage() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    api.getRoutes().then(r => { setRoutes(r); if (r.length > 0) setSelected(r[0]) }).finally(() => setLoading(false))
  }, [])

  const updateStatus = async (route, status) => {
    setUpdatingId(route.id)
    try {
      const updated = await api.updateRouteStatus(route.id, status)
      setRoutes(prev => prev.map(r => r.id === route.id ? { ...r, ...updated } : r))
      if (selected?.id === route.id) setSelected(prev => ({ ...prev, ...updated }))
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteRoute = async (id) => {
    if (!confirm('Delete this route?')) return
    await api.deleteRoute(id)
    setRoutes(prev => {
      const next = prev.filter(r => r.id !== id)
      setSelected(next.length > 0 ? next[0] : null)
      return next
    })
  }

  const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const fmtTime = d => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const filtered = filter === 'all' ? routes : routes.filter(r => r.status === filter)

  const routePositions = selected?.stops?.map(s => [s.lat, s.lng]) || []

  if (loading) return <div className="loading"><div className="spinner" />Loading history...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div className="page-title">Route History</div>
            <div className="page-subtitle">{routes.length} total routes across all time</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {['all','planned','in_progress','completed'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <div className="empty-title">No routes saved yet</div>
            <div className="empty-desc">Create and save routes from the Route Planner</div>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:20, alignItems:'start' }}>
          {/* Route list */}
          <div>
            {filtered.map(route => (
              <div key={route.id} className={`route-card ${selected?.id === route.id ? 'selected' : ''}`}
                onClick={() => setSelected(route)}>
                <div className="route-card-header">
                  <div style={{ flex:1 }}>
                    <div className="route-card-name">{route.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{fmtDate(route.created_at)}</div>
                  </div>
                  <span className={`badge badge-${route.status}`}>{STATUS_LABELS[route.status]}</span>
                </div>

                <div className="route-card-meta">
                  <span className="route-card-stat">📍 {route.stops?.length || 0} stops</span>
                  <span className="route-card-stat">📏 {route.total_distance_km} km</span>
                  {route.completed_at && <span className="route-card-stat">✅ {fmtDate(route.completed_at)}</span>}
                </div>

                {selected?.id === route.id && (
                  <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }} onClick={e => e.stopPropagation()}>
                    {route.status !== 'in_progress' && route.status !== 'completed' && (
                      <button className="btn btn-sm" style={{background:'var(--amber-dim)',color:'var(--amber)',border:'1px solid var(--amber-dim-2)'}}
                        onClick={() => updateStatus(route, 'in_progress')} disabled={updatingId === route.id}>
                        ▶ Start
                      </button>
                    )}
                    {route.status === 'in_progress' && (
                      <button className="btn btn-sm" style={{background:'var(--green-dim)',color:'var(--green)',border:'1px solid rgba(16,185,129,0.2)'}}
                        onClick={() => updateStatus(route, 'completed')} disabled={updatingId === route.id}>
                        ✓ Complete
                      </button>
                    )}
                    {route.status !== 'planned' && (
                      <button className="btn btn-sm btn-ghost"
                        onClick={() => updateStatus(route, 'planned')} disabled={updatingId === route.id}>
                        ↩ Reset
                      </button>
                    )}
                    <button className="btn btn-sm btn-danger" onClick={() => deleteRoute(route.id)}>
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div>
            {selected ? (
              <>
                <div className="card" style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', marginBottom:16 }}>
                    <div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:800, color:'var(--text)' }}>{selected.name}</div>
                      <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginTop:4 }}>
                        Created {fmtDate(selected.created_at)} at {fmtTime(selected.created_at)}
                        {selected.completed_at && ` · Completed ${fmtDate(selected.completed_at)}`}
                      </div>
                    </div>
                    <span className={`badge badge-${selected.status}`}>{STATUS_LABELS[selected.status]}</span>
                  </div>

                  <div style={{ display:'flex', gap:20, marginBottom:16 }}>
                    <div style={{ background:'var(--ink-2)', borderRadius:'var(--radius)', padding:'10px 16px', textAlign:'center' }}>
                      <div style={{ fontSize:'0.7rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Distance</div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:800, color:'var(--amber)' }}>{selected.total_distance_km} km</div>
                    </div>
                    <div style={{ background:'var(--ink-2)', borderRadius:'var(--radius)', padding:'10px 16px', textAlign:'center' }}>
                      <div style={{ fontSize:'0.7rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Stops</div>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:800, color:'var(--blue)' }}>{selected.stops?.length}</div>
                    </div>
                  </div>

                  <div className="card-title" style={{ marginBottom:8 }}>Stop Order</div>
                  <div className="stop-list">
                    {selected.stops?.map((stop, i) => (
                      <div key={stop.id} className="stop-item">
                        {i < selected.stops.length - 1 && <div className="stop-line" />}
                        <div className={`stop-dot ${stop.type}`}>{i + 1}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, color:'var(--text)', fontSize:'0.85rem' }}>{stop.name}</div>
                          <div style={{ fontSize:'0.75rem', color:'var(--muted)' }}>{stop.type} · {stop.address?.substring(0, 60)}{stop.address?.length > 60 ? '…' : ''}</div>
                        </div>
                        <span className={`badge badge-${stop.type}`}>{stop.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="map-wrap" style={{ height:380 }}>
                  <MapContainer center={[20, 78]} zoom={5} style={{ height:'100%', width:'100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© <a href="https://www.openstreetmap.org">OpenStreetMap</a>' />
                    {routePositions.length > 0 && <FitBounds stops={selected.stops} />}
                    <Polyline positions={routePositions} color="#f59e0b" weight={3} opacity={0.7} dashArray="8,4" />
                    {selected.stops?.map((stop, i) => (
                      <Marker key={stop.id} position={[stop.lat, stop.lng]}
                        icon={makeNumberedIcon(i + 1, stop.type === 'pickup' ? '#3b82f6' : '#f59e0b')}>
                        <Popup><strong>Stop {i+1}: {stop.name}</strong><br />{stop.type}<br />{stop.address}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">👈</div>
                  <div className="empty-title">Select a route</div>
                  <div className="empty-desc">Click a route to see details and map</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
