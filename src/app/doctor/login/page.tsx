'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import '../../doctor-portal.css'

export default function DoctorLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))

    // Mock credentials
    if (email === 'doctor@healthos.in' && password === 'doctor123') {
      sessionStorage.setItem('doctor_auth', 'true')
      sessionStorage.setItem('doctor_name', 'Dr. Priya Mehta')
      sessionStorage.setItem('doctor_hpr', 'HPR-MAH-2019-12345')
      router.push('/doctor/dashboard')
    } else {
      setError('Invalid credentials. Try doctor@healthos.in / doctor123')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="auth-card fade-up">
        <div className="auth-card-glow" style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }} />

        <div className="auth-logo">
          <div style={{ width: 32, height: 32, fontSize: 16, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🩺</div>
          <span style={{ fontSize: 17, fontWeight: 700 }}>HealthOS</span>
          <span style={{ fontSize: 12, color: 'var(--blue)', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '3px 10px', borderRadius: 99, marginLeft: 4, fontWeight: 600 }}>Doctor Portal</span>
        </div>

        <h1 className="auth-title">Welcome, Doctor</h1>
        <p className="auth-subtitle">
          Sign in with your HealthOS credentials to access the clinical portal.
        </p>

        {error && (
          <div className="form-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrap">
              <span className="input-icon">📧</span>
              <input
                id="doctor-email"
                type="email"
                className="form-input"
                placeholder="doctor@healthos.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="doctor-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button id="doctor-login-btn" type="submit" className="btn-submit" disabled={loading}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 6px 20px rgba(59,130,246,0.3)' }}>
            {loading ? <><span className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Signing in…</> : 'Sign In →'}
          </button>
        </form>

        <div className="divider">demo credentials</div>

        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '14px 16px', fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Email</span>
            <code style={{ color: 'var(--blue)' }}>doctor@healthos.in</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Password</span>
            <code style={{ color: 'var(--blue)' }}>doctor123</code>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          🔒 HPR-verified credentials required for production access
        </p>
      </div>
    </div>
  )
}
