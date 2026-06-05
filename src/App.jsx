import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import LocationsPage from './pages/LocationsPage'
import PlannerPage from './pages/PlannerPage'
import HistoryPage from './pages/HistoryPage'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
  { id: 'planner', label: 'Route Planner', icon: '🗺️' },
  { id: 'locations', label: 'Locations', icon: '📍' },
  { id: 'history', label: 'Route History', icon: '📋' },
]

function AppShell() {
  const { user, logout, loading } = useAuth()
  const [page, setPage] = useState('dashboard')

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--ink)' }}>
      <div className="loading"><div className="spinner" /><span style={{fontFamily:'var(--font-display)', fontWeight:700}}>RouteFlow loading...</span></div>
    </div>
  )

  if (!user) return <AuthPage />

  const pages = {
    dashboard: <Dashboard onNavigate={setPage} />,
    planner: <PlannerPage />,
    locations: <LocationsPage />,
    history: <HistoryPage />,
  }

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-logo">🚚 Route<span>Flow</span></div>
        <div className="topbar-spacer" />
        {/* Mobile nav */}
        <div style={{ display:'none' }} className="mobile-nav">
          {NAV.map(n => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)} style={{ padding:'6px 10px' }}>
              {n.icon}
            </button>
          ))}
        </div>
        <div className="topbar-user">
          <div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
          <span style={{ maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      </header>

      {/* Sidebar */}
      <nav className="sidebar">
        <div className="nav-section-label">Navigation</div>
        {NAV.map(n => (
          <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => setPage(n.id)}>
            <span style={{ fontSize:'1rem' }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
        <div style={{ flex:1 }} />
        <hr className="divider" style={{ margin:'8px 0' }} />
        <button className="nav-item" onClick={logout} style={{ color:'var(--red)' }}>
          <span>🚪</span> Sign out
        </button>
      </nav>

      {/* Main */}
      <main className="main-content">
        {pages[page] || pages.dashboard}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
