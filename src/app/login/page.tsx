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
      title: 'ABHA Number',
      placeholder: '12-3456-7890-1234',
      demoValue: '12-3456-7890-1234',
      hint: 'Your official 14-digit ABDM Health ID number',
    },
    'abha-address': {
      title: 'ABHA Address',
      placeholder: 'rahulsharma@abdm',
      demoValue: 'rahulsharma@abdm',
      hint: 'Your personal health address ending with @abdm',
    },
    mobile: {
      title: 'Mobile Number',
      placeholder: '9876543210',
      demoValue: '9876543210',
      hint: '10-digit mobile number linked to your ABHA',
    },
  }

  const cfg = methodConfig[method]

  const handleFillDemo = () => {
    setValue(cfg.demoValue)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!value.trim()) {
      setError('Please enter your ' + cfg.title)
      return
    }

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
    await new Promise(r => setTimeout(r, 1000))

    sessionStorage.setItem('abha_login_method', method)
    sessionStorage.setItem('abha_login_value', value)

    setLoading(false)
    router.push('/otp')
  }

  return (
    <div className="split-login-page">
      <div className="split-container">
        
        {/* Left Form Section */}
        <div className="split-left">
          <div className="login-header">
            <Link href="/" className="v2-logo">
              <div className="v2-logo-icon">S</div>
              <span className="v2-logo-text">Seam</span>
            </Link>
            <span className="v2-abdm-pill">ABDM V3 Sandbox</span>
          </div>

          <div className="login-card-body">
            <h1>Sign in to your health locker</h1>
            <p className="login-sub">
              Verify your identity using your Ayushman Bharat Health Account (ABHA).
              An OTP will be sent to your registered mobile.
            </p>

            {/* Quick Demo Banner */}
            <div className="demo-credentials-banner">
              <div className="demo-banner-title">
                <span>Quick Demo Access</span>
              </div>
              <p>Click below to pre-fill test credentials instantly:</p>
              <button type="button" onClick={handleFillDemo} className="btn-demo-fill">
                Auto-Fill Demo {cfg.title} ({cfg.demoValue})
              </button>
            </div>

            {/* Method Tabs */}
            <div className="method-tabs">
              {(Object.entries(methodConfig) as [Method, typeof methodConfig[Method]][]).map(([key, conf]) => (
                <button
                  key={key}
                  type="button"
                  className={`tab-btn ${method === key ? 'active' : ''}`}
                  onClick={() => { setMethod(key); setValue(''); setError('') }}
                >
                  {conf.title}
                </button>
              ))}
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-field">
                <label>{cfg.title}</label>
                <div className="input-input-wrap">
                  <input
                    id="abha-input"
                    type={method === 'mobile' ? 'tel' : 'text'}
                    className="v2-input"
                    placeholder={cfg.placeholder}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <p className="field-hint">{cfg.hint}</p>
              </div>

              <button id="send-otp-btn" type="submit" className="v2-btn-primary full-width" disabled={loading}>
                {loading ? 'Sending OTP…' : 'Send OTP →'}
              </button>
            </form>

            <div className="login-footer-links">
              <p>
                Don&apos;t have an ABHA?{' '}
                <a href="https://healthid.abdm.gov.in/" target="_blank" rel="noopener noreferrer">
                  Create one free in 2 mins →
                </a>
              </p>
              <Link href="/doctor/login" className="link-doctor-alt">
                Are you a healthcare provider? Doctor Portal Login →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="split-right">
          <div className="right-content">
            <span className="right-badge">National Health Stack</span>
            <h2>Your health data, completely under your control</h2>
            <p>
              Seam operates under India&apos;s Ayushman Bharat Digital Mission (ABDM) guidelines.
              We never store unencrypted health data without explicit digital consent.
            </p>

            <div className="trust-feature-list">
              <div className="trust-item">
                <div>
                  <h4>Zero Password Risk</h4>
                  <p>Authenticated securely via Aadhaar & Mobile OTP directly through government gateways.</p>
                </div>
              </div>

              <div className="trust-item">
                <div>
                  <h4>1-Tap Instant Consent</h4>
                  <p>Approve doctor access requests in real-time from your phone. Revoke access anytime.</p>
                </div>
              </div>

              <div className="trust-item">
                <div>
                  <h4>DPDP Act 2023 Compliant</h4>
                  <p>Fully aligned with India&apos;s Digital Personal Data Protection standards and RSA-2048 encryption.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
