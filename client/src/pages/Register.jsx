import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ROLES = [
  { key: 'customer',    label: 'Customer',    emoji: '👤', desc: 'Order food from restaurants',      color: '#ff5252' },
  { key: 'restaurant',  label: 'Shopkeeper',  emoji: '🏪', desc: 'Manage your restaurant & orders', color: '#ff9800' },
  { key: 'delivery',    label: 'Driver',      emoji: '🛵', desc: 'View & deliver assigned orders',  color: '#4caf50' },
]

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const selectedRole = ROLES.find(r => r.key === form.role)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token, res.data.user)
      toast.success(`Account created! Welcome, ${res.data.user.name}! 🎉`)
      // Redirect based on role
      if (res.data.user.role === 'restaurant') navigate('/shopkeeper')
      else if (res.data.user.role === 'delivery') navigate('/driver')
      else navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed — is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card page-enter">
        <div className="auth-logo">
          <span className="auth-logo-icon">🍔</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join thousands of food lovers today</p>

        {/* Role Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {ROLES.map(role => (
            <button
              key={role.key}
              id={`register-role-${role.key}`}
              type="button"
              onClick={() => setForm({ ...form, role: role.key })}
              style={{
                padding: '12px 8px',
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${form.role === role.key ? role.color : 'var(--border)'}`,
                background: form.role === role.key ? `${role.color}15` : 'var(--bg-card2)',
                color: form.role === role.key ? role.color : 'var(--text-secondary)',
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
          background: `${selectedRole.color}10`, border: `1px solid ${selectedRole.color}30`,
          fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20
        }}>
          {selectedRole.emoji} <strong style={{ color: selectedRole.color }}>{selectedRole.label}:</strong> {selectedRole.desc}
        </div>

        <form className="auth-form" onSubmit={handleSubmit} id="register-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="register-name"
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              id="register-phone"
              type="tel"
              className="form-input"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{
              width: '100%', marginTop: '8px',
              background: `linear-gradient(135deg, ${selectedRole.color}, ${selectedRole.color}cc)`
            }}
            disabled={loading}
          >
            {loading ? '⏳ Creating account...' : `${selectedRole.emoji} Create Account as ${selectedRole.label}`}
          </button>
        </form>

        <div className="auth-switch" style={{ marginTop: '20px' }}>
          Already have an account?{' '}
          <span className="link" onClick={() => navigate('/login')}>Sign in</span>
        </div>
      </div>
    </div>
  )
}
