'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DoctorLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFillDemo = () => {
    setEmail('doctor@seam.care')
    setPassword('doctor123')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))

    if ((email === 'doctor@seam.care' || email === 'doctor@healthos.in') && password === 'doctor123') {
      sessionStorage.setItem('doctor_auth', 'true')
      sessionStorage.setItem('doctor_name', 'Dr. Priya Mehta')
      sessionStorage.setItem('doctor_hpr', 'HPR-MAH-2019-12345')
      router.push('/doctor/dashboard')
    } else {
      setError('Invalid credentials. Click "Auto-Fill Doctor Credentials" below.')
      setLoading(false)
    }
  }

  return (
    <div className="split-login-page">
      {/* Fullscreen Mobile Warning Takeover */}
      <div className="dd-mobile-warning">
        <div className="dd-mobile-warning-card">
          <div className="dd-mobile-warning-icon">S</div>
          <h2 className="dd-mobile-warning-title">Desktop Only Portal</h2>
          <p className="dd-mobile-warning-sub">
            The Seam Doctor Portal is designed for clinical desktop and tablet displays. Please open this link on a computer to sign in.
          </p>
          <a href="/" className="dd-mobile-warning-btn">Go to Seam Home</a>
        </div>
      </div>

      <div className="split-container">
        
        {/* Left Form Section */}
        <div className="split-left">
          <div className="login-header">
            <Link href="/" className="v2-logo">
              <div className="v2-logo-icon">S</div>
              <span className="v2-logo-text">Seam</span>
            </Link>
            <span className="v2-abdm-pill">Clinical Portal</span>
          </div>

          <div className="login-card-body">
            <h1>Doctor Portal Login</h1>
            <p className="login-sub">
              Sign in with your clinician credentials to search patients, request real-time consent, and issue FHIR prescriptions.
            </p>

            {/* Quick Demo Credentials Banner */}
            <div className="demo-credentials-banner">
              <div className="demo-banner-title">
                <span>Quick Demo Access</span>
              </div>
              <p>Click below to pre-fill test doctor credentials:</p>
              <button type="button" onClick={handleFillDemo} className="btn-demo-fill">
                Auto-Fill Doctor Credentials (doctor@seam.care / doctor123)
              </button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-field">
                <label>Doctor Email</label>
                <div className="input-input-wrap">
                  <input
                    id="doctor-email"
                    type="email"
                    className="v2-input"
                    placeholder="doctor@seam.care"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Password</label>
                <div className="input-input-wrap">
                  <input
                    id="doctor-password"
                    type="password"
                    className="v2-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button id="doctor-login-btn" type="submit" className="v2-btn-primary full-width" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In to Clinical Portal →'}
              </button>
            </form>

            <div className="login-footer-links">
              <p>
                Are you a patient?{' '}
                <Link href="/login">
                  Patient ABHA Login →
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="split-right">
          <div className="right-content">
            <span className="right-badge">Healthcare Professional Registry (HPR)</span>
            <h2>Zero friction clinical record access at the point of care</h2>
            <p>
              Seam bridges doctor portals and patient mobile lockers in real-time — eliminating paper intake forms and missing history.
            </p>

            <div className="trust-feature-list">
              <div className="trust-item">
                <div>
                  <h4>ABHA Patient Search</h4>
                  <p>Search any patient by 14-digit ABHA ID or QR scan to initiate record requests.</p>
                </div>
              </div>

              <div className="trust-item">
                <div>
                  <h4>10-Second Consent Authorization</h4>
                  <p>Send an instant push request to the patient&apos;s phone and view their full health timeline on approval.</p>
                </div>
              </div>

              <div className="trust-item">
                <div>
                  <h4>FHIR R4 Prescriptions</h4>
                  <p>Issue structured digital prescriptions that automatically sync to the patient&apos;s personal health locker.</p>
                </div>
              </div>
            </div>

            <div className="right-card-quote">
              <p>&ldquo;No clunky legacy EMRs. A fast, modern portal built for busy outpatient clinics.&rdquo;</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
