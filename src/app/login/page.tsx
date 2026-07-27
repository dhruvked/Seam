'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Method = 'abha-number' | 'abha-address' | 'mobile'

export default function LoginPage() {
  const router = useRouter()
  const [method, setMethod] = useState<Method>('abha-number')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const methodConfig = {
    'abha-number': {
      icon: '🪪',
      title: '14-digit ABHA Number',
      desc: 'e.g. 12-3456-7890-1234',
      placeholder: 'Enter your 14-digit ABHA number',
      hint: 'Found on your ABHA card or the ABHA app',
    },
    'abha-address': {
      icon: '📧',
      title: 'ABHA Address',
      desc: 'e.g. yourname@abdm',
      placeholder: 'yourname@abdm',
      hint: 'Your ABHA address ends with @abdm',
    },
    mobile: {
      icon: '📱',
      title: 'Mobile Number',
      desc: 'Linked to your ABHA',
      placeholder: 'Enter 10-digit mobile number',
      hint: 'Must be the mobile number registered with your ABHA',
    },
  }

  const cfg = methodConfig[method]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!value.trim()) {
      setError('Please enter your ' + cfg.title)
      return
    }

    // Validate format
    if (method === 'abha-number') {
      const cleaned = value.replace(/-/g, '')
      if (!/^\d{14}$/.test(cleaned)) {
        setError('Please enter a valid 14-digit ABHA number')
        return
      }
    }

    if (method === 'mobile' && !/^\d{10}$/.test(value.replace(/\s/g, ''))) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setLoading(true)

    // Simulate ABDM API call (POST /v3/enrollment/request/otp)
    await new Promise(r => setTimeout(r, 1400))

    // Store in sessionStorage for OTP page
    sessionStorage.setItem('abha_login_method', method)
    sessionStorage.setItem('abha_login_value', value)

    setLoading(false)
    router.push('/otp')
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="auth-card fade-up">
        <div className="auth-card-glow" />

        <div className="auth-logo">
          <div className="logo-icon" style={{ width: 32, height: 32, fontSize: 16, background: 'linear-gradient(135deg,#00d4aa,#3b82f6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚕</div>
          <span style={{ fontSize: 17, fontWeight: 700 }}>HealthOS</span>
        </div>

        <h1 className="auth-title">Sign in to your<br />health record</h1>
        <p className="auth-subtitle">
          Choose how you want to verify your ABHA identity.
          An OTP will be sent to your registered mobile.
        </p>

        {/* Method selector */}
        <div className="abha-methods">
          {(Object.entries(methodConfig) as [Method, typeof methodConfig[Method]][]).map(([key, conf]) => (
            <button
              key={key}
              className={`method-btn ${method === key ? 'selected' : ''}`}
              onClick={() => { setMethod(key); setValue(''); setError('') }}
              type="button"
            >
              <span className="method-icon">{conf.icon}</span>
              <span className="method-info">
                <span className="method-title">{conf.title}</span>
                <span className="method-desc">{conf.desc}</span>
              </span>
              <span className="method-check">✓</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="form-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Your {cfg.title}</label>
            <div className="input-wrap">
              <span className="input-icon">{cfg.icon}</span>
              <input
                id="abha-input"
                type={method === 'mobile' ? 'tel' : 'text'}
                className="form-input"
                placeholder={cfg.placeholder}
                value={value}
                onChange={e => setValue(e.target.value)}
                autoFocus
                autoComplete="off"
              />
            </div>
            <p className="input-hint">{cfg.hint}</p>
          </div>

          <button
            id="send-otp-btn"
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Sending OTP…</> : 'Send OTP →'}
          </button>
        </form>

        <div className="divider">or</div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Don&apos;t have an ABHA?{' '}
          <a
            href="https://healthid.abdm.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--teal)', fontWeight: 600 }}
          >
            Create one free →
          </a>
        </p>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20, lineHeight: 1.6 }}>
          🔒 Your data is secured under the ABDM framework
          and the Digital Personal Data Protection Act, 2023.
        </p>
      </div>
    </div>
  )
}
