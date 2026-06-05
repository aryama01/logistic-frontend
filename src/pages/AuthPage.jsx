import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.name, form.email, form.password)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Route<span>Flow</span></div>
        <div className="auth-tagline">Smart logistics, optimized routes, delivered faster.</div>

        <div className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
        <div className="auth-subtitle">
          {mode === 'login' ? 'Sign in to your dashboard' : 'Start planning optimized routes'}
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" placeholder="Jane Smith" value={form.name}
                onChange={e => update('name', e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="you@company.com" value={form.email}
              onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password}
              onChange={e => update('password', e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><span className="spinner" style={{width:14,height:14}} /> Processing...</> : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' ? (
            <>Don't have an account? <a onClick={() => setMode('register')}>Sign up</a></>
          ) : (
            <>Already have an account? <a onClick={() => setMode('login')}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  )
}
