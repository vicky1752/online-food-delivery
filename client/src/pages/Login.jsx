import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ROLES = [
  { key: 'customer',    label: 'Customer',    emoji: '👤', desc: 'Order food from restaurants',       color: '#ff5252' },
  { key: 'restaurant',  label: 'Shopkeeper',  emoji: '🏪', desc: 'Manage your restaurant & orders',  color: '#ff9800' },
  { key: 'delivery',    label: 'Driver',       emoji: '🛵', desc: 'View & deliver assigned orders',   color: '#4caf50' },
]

const DEMO_CREDS = {
  customer:   [{ email: 'alice@foodie.com',       pw: 'password123', label: 'Alice (Customer)' },
               { email: 'bob@foodie.com',          pw: 'password123', label: 'Bob (Customer)' }],
  restaurant: [{ email: 'spicegarden@foodie.com', pw: 'password123', label: 'Spice Garden' },
               { email: 'pizzaplanet@foodie.com',  pw: 'password123', label: 'Pizza Planet' },
               { email: 'burgerbarn@foodie.com',   pw: 'password123', label: 'Burger Barn' }],
  delivery:   [{ email: 'rahul@foodie.com',        pw: 'password123', label: 'Rahul Sharma' },
               { email: 'amit@foodie.com',          pw: 'password123', label: 'Amit Kumar' },
               { email: 'priya@foodie.com',         pw: 'password123', label: 'Priya Singh' }],
}

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('customer')
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const fillDemo = (cred) => setForm({ email: cred.email, password: cred.pw })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      const { token, user } = res.data
      login(token, user)
      toast.success(`Welcome back, ${user.name}! 🎉`)
      // Route based on role
      if (user.role === 'restaurant') navigate('/shopkeeper')
      else if (user.role === 'delivery') navigate('/driver')
      else navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const roleObj = ROLES.find(r => r.key === selectedRole)

  return (
    <div className="auth-page">
      <div className="auth-card page-enter" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <span className="auth-logo-icon">🍔</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue</p>

        {/* Role Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 28 }}>
          {ROLES.map(role => (
            <button
              key={role.key}
              id={`role-tab-${role.key}`}
              onClick={() => { setSelectedRole(role.key); setForm({ email: '', password: '' }) }}
              style={{
                padding: '12px 8px',
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${selectedRole === role.key ? role.color : 'var(--border)'}`,
                background: selectedRole === role.key ? `${role.color}15` : 'var(--bg-card2)',
                color: selectedRole === role.key ? role.color : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{role.emoji}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{role.label}</div>
            </button>
          ))}
        </div>

        {/* Role description */}
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--radius-xs)',
          background: `${roleObj.color}10`, border: `1px solid ${roleObj.color}30`,
          fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20
        }}>
          {roleObj.emoji} <strong style={{ color: roleObj.color }}>{roleObj.label}:</strong> {roleObj.desc}
        </div>

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 4, background: `linear-gradient(135deg, ${roleObj.color}, ${roleObj.color}cc)` }}
            disabled={loading}
          >
            {loading ? '⏳ Signing in...' : `${roleObj.emoji} Sign in as ${roleObj.label}`}
          </button>
        </form>

        {/* Demo Credentials */}
        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚡ Demo Accounts — click to fill
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DEMO_CREDS[selectedRole].map((cred, i) => (
              <button
                key={i}
                id={`demo-cred-${i}`}
                onClick={() => fillDemo(cred)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                  background: `${roleObj.color}15`, border: `1px solid ${roleObj.color}30`,
                  color: roleObj.color, cursor: 'pointer', transition: 'var(--transition)'
                }}
              >
                {cred.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Password for all demo accounts: <strong>password123</strong>
          </div>
        </div>

        <div className="auth-switch" style={{ marginTop: 20 }}>
          Don't have an account?{' '}
          <span className="link" onClick={() => navigate('/register')}>Create one free</span>
        </div>
      </div>
    </div>
  )
}
