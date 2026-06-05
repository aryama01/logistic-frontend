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
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:${color};color:${color === '#f59e0b' ? '#0d0f12' : 'white'};
    display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:11px;
    border:2px solid rgba(255,255,255,0.3);
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
  ">${num}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [positions, map])
  return null
}

export default function PlannerPage() {
  const [locations, setLocations] = useState([])
  const [selected, setSelected] = useState([])
  const [optimized, setOptimized] = useState(null)
  const [routeName, setRouteName] = useState('')
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getLocations().then(setLocations).finally(() => setLoading(false))
  }, [])

  const toggleLocation = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setOptimized(null)
    setSaved(false)
  }

  const optimize = async () => {
    if (selected.length < 2) return setError('Select at least 2 locations')
    setError('')
    setOptimizing(true)
    try {
      const result = await api.optimizeRoute(selected)
      setOptimized(result)
    } catch {
      setError('Optimization failed')
    } finally {
      setOptimizing(false)
    }
  }

  const saveRoute = async () => {
    if (!routeName.trim()) return setError('Enter a route name')
    if (!optimized) return
    setError('')
    setSaving(true)
    try {
      const orderedIds = optimized.optimized.map(l => l.id)
      await api.createRoute(routeName, orderedIds)
      setSaved(true)
      setSelected([])
      setOptimized(null)
      setRouteName('')
    } catch {
      setError('Failed to save route')
    } finally {
      setSaving(false)
    }
  }

  const routePositions = optimized
    ? optimized.optimized.map(l => [l.lat, l.lng])
    : locations.filter(l => selected.includes(l.id)).map(l => [l.lat, l.lng])

  if (loading) return <div className="loading"><div className="spinner" />Loading planner...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Route Planner</div>
        <div className="page-subtitle">Select locations and optimize delivery order</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20, alignItems:'start' }}>
        {/* Sidebar panel */}
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div className="card-title">📍 Select Locations</div>
            <p style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:12 }}>
              Choose 2+ locations to build a route
            </p>
            {locations.length === 0 ? (
              <div className="empty-state" style={{ padding:'20px 0' }}>
                <div className="empty-icon">📍</div>
                <div className="empty-title">No locations saved</div>
                <div className="empty-desc">Add locations first</div>
              </div>
            ) : (
              <div className="checkbox-list">
                {locations.map(loc => (
                  <label key={loc.id} className="checkbox-item">
                    <input type="checkbox" checked={selected.includes(loc.id)}
                      onChange={() => toggleLocation(loc.id)} />
                    <div className={`location-icon ${loc.type}`} style={{width:24,height:24,fontSize:'0.75rem',flexShrink:0,borderRadius:6}}>
                      {loc.type === 'pickup' ? '📦' : '🏠'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, color:'var(--text)' }}>{loc.name}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{loc.address}</div>
                    </div>
                    <span className={`badge badge-${loc.type}`} style={{ flexShrink:0 }}>{loc.type}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="btn btn-primary btn-full" onClick={optimize}
            disabled={selected.length < 2 || optimizing} style={{ marginBottom:12 }}>
            {optimizing ? <><span className="spinner" style={{width:14,height:14}} /> Optimizing...</> : `⚡ Optimize ${selected.length} Locations`}
          </button>

          {optimized && (
            <div className="opt-preview">
              <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text)', marginBottom:8 }}>
                ✅ Optimized Route
              </div>
              <div className="stop-list">
                {optimized.optimized.map((loc, i) => (
                  <div key={loc.id} className="stop-item">
                    {i < optimized.optimized.length - 1 && <div className="stop-line" />}
                    <div className={`stop-dot ${loc.type}`}>{i + 1}</div>
                    <div>
                      <div style={{ fontWeight:600, color:'var(--text)', fontSize:'0.825rem' }}>{loc.name}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{loc.type}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="opt-total">Total distance: <strong>{optimized.totalDistanceKm} km</strong></div>
            </div>
          )}

          {optimized && !saved && (
            <div style={{ marginTop:12 }}>
              <div className="form-group">
                <label className="form-label">Route name</label>
                <input className="form-input" placeholder="Morning Delivery Run" value={routeName}
                  onChange={e => setRouteName(e.target.value)} />
              </div>
              <button className="btn btn-secondary btn-full" onClick={saveRoute} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Route'}
              </button>
            </div>
          )}

          {saved && (
            <div style={{ background:'var(--green-dim)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'0.85rem', color:'var(--green)', marginTop:12 }}>
              ✅ Route saved successfully!
            </div>
          )}
        </div>

        {/* Map */}
        <div>
          <div className="map-wrap" style={{ height: 620 }}>
            <MapContainer center={[20, 78]} zoom={5} style={{ height:'100%', width:'100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
              />
              {routePositions.length > 0 && <FitBounds positions={routePositions} />}

              {optimized ? (
                <>
                  <Polyline positions={routePositions} color="#f59e0b" weight={3} opacity={0.8}
                    dashArray="8, 4" />
                  {optimized.optimized.map((loc, i) => (
                    <Marker key={loc.id} position={[loc.lat, loc.lng]}
                      icon={makeNumberedIcon(i + 1, loc.type === 'pickup' ? '#3b82f6' : '#f59e0b')}>
                      <Popup>
                        <strong>Stop {i + 1}: {loc.name}</strong><br />
                        <span style={{fontSize:'0.8em'}}>{loc.type} · {loc.address}</span>
                      </Popup>
                    </Marker>
                  ))}
                </>
              ) : (
                locations.filter(l => selected.includes(l.id)).map(loc => (
                  <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                    <Popup><strong>{loc.name}</strong><br />{loc.type}</Popup>
                  </Marker>
                ))
              )}

              {/* Unselected locations dimmed */}
              {locations.filter(l => !selected.includes(l.id)).map(loc => (
                <Marker key={`dim-${loc.id}`} position={[loc.lat, loc.lng]}
                  icon={L.divIcon({
                    className: '',
                    html: `<div style="width:10px;height:10px;border-radius:50%;background:rgba(107,114,128,0.5);border:1px solid rgba(255,255,255,0.2);"></div>`,
                    iconSize: [10, 10], iconAnchor: [5, 5],
                  })}>
                  <Popup>{loc.name} (not selected)</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          {selected.length > 0 && !optimized && (
            <p style={{ textAlign:'center', fontSize:'0.8rem', color:'var(--muted)', marginTop:10 }}>
              {selected.length} location{selected.length > 1 ? 's' : ''} selected — click Optimize to find the best route
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
