import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../utils/api'

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) })
  return null
}

const EMPTY_FORM = { name: '', address: '', lat: '', lng: '', type: 'delivery' }

export default function LocationsPage() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [mapCenter, setMapCenter] = useState([20, 0])
  const mapRef = useRef(null)

  useEffect(() => {
    api.getLocations().then(setLocations).finally(() => setLoading(false))
    // Try to get user location
    navigator.geolocation?.getCurrentPosition(
      pos => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    )
  }, [])

  const handleMapClick = ({ lat, lng }) => {
    setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
    // Reverse geocode using Nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(r => r.json())
      .then(d => { if (d.display_name) setForm(f => ({ ...f, address: d.display_name })) })
      .catch(() => {})
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.lat || !form.lng) return setError('Click on the map or enter coordinates')
    setSubmitting(true)
    try {
      const loc = await api.addLocation({ ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng) })
      setLocations(prev => [loc, ...prev])
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add location')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this location?')) return
    await api.deleteLocation(id)
    setLocations(prev => prev.filter(l => l.id !== id))
  }

  const filtered = filter === 'all' ? locations : locations.filter(l => l.type === filter)

  const focusLocation = (loc) => {
    mapRef.current?.flyTo([loc.lat, loc.lng], 14)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div className="page-title">Locations</div>
            <div className="page-subtitle">Manage your pickup and delivery points</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {['all','pickup','delivery'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'pickup' ? '📦 Pickups' : '🏠 Deliveries'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* Form */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">➕ Add Location</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Location name</label>
                <input className="form-input" placeholder="Warehouse A / Customer Name" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="pickup">📦 Pickup</option>
                  <option value="delivery">🏠 Delivery</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Address (auto-filled on map click)</label>
                <input className="form-input" placeholder="Street address" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-input" placeholder="28.6139" value={form.lat}
                    onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-input" placeholder="77.2090" value={form.lng}
                    onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} required />
                </div>
              </div>
              <p style={{ fontSize:'0.78rem', color:'var(--muted)', marginBottom:12 }}>
                💡 Click on the map to auto-fill coordinates & address
              </p>
              <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : '+ Add Location'}
              </button>
            </form>
          </div>

          {/* Location list */}
          <div className="card">
            <div className="card-title">📍 Saved Locations ({filtered.length})</div>
            {loading ? (
              <div className="loading"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📍</div>
                <div className="empty-title">No locations yet</div>
                <div className="empty-desc">Add locations using the form or click on the map</div>
              </div>
            ) : (
              filtered.map(loc => (
                <div key={loc.id} className="location-item">
                  <div className={`location-icon ${loc.type}`}>{loc.type === 'pickup' ? '📦' : '🏠'}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="location-name">{loc.name}</div>
                    <div className="location-address" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{loc.address}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:2 }}>{loc.lat}, {loc.lng}</div>
                  </div>
                  <div className="location-meta">
                    <span className={`badge badge-${loc.type}`}>{loc.type}</span>
                    <button className="btn-icon" onClick={() => focusLocation(loc)} title="Show on map">🗺️</button>
                    <button className="btn-icon" onClick={() => remove(loc.id)} title="Delete" style={{color:'var(--red)'}}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div>
          <div className="card-title" style={{marginBottom:8}}>🗺️ Click map to pin location</div>
          <div className="map-wrap" style={{ height: 580 }}>
            <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }}
              ref={mapRef}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
              />
              <ClickHandler onMapClick={handleMapClick} />
              {locations.map(loc => (
                <Marker key={loc.id} position={[loc.lat, loc.lng]}
                  icon={loc.type === 'pickup' ? pickupIcon : deliveryIcon}>
                  <Popup>
                    <strong>{loc.name}</strong><br />
                    <span style={{fontSize:'0.8em', color:'#666'}}>{loc.type}</span><br />
                    {loc.address}
                  </Popup>
                </Marker>
              ))}
              {form.lat && form.lng && (
                <Marker position={[parseFloat(form.lat), parseFloat(form.lng)]}>
                  <Popup>📍 New location (unsaved)</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
