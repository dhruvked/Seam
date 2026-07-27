'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OtpPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const [abhaValue, setAbhaValue] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const val = sessionStorage.getItem('abha_login_value') || '12-3456-7890-1234'
    setAbhaValue(val)
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const handleChange = (index: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[index] = val
    setOtp(next)
    setError('')
    if (val && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleFillDemoOtp = () => {
    setOtp(['1', '2', '3', '4', '5', '6'])
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    await new Promise(r => setTimeout(r, 1000))

    if (code === '000000') {
      setError('Incorrect OTP. Please try again.')
      setLoading(false)
      return
    }

    sessionStorage.setItem('auth_verified', 'true')
    sessionStorage.setItem('patient_name', 'Rahul Sharma')
    sessionStorage.setItem('patient_abha', abhaValue || '12-3456-7890-1234')

    router.push('/dashboard')
  }

  const handleResend = () => {
    setResendTimer(30)
    setOtp(['', '', '', '', '', ''])
    setError('')
    inputRefs.current[0]?.focus()
  }

  const maskedValue = abhaValue.length > 4
    ? abhaValue.slice(0, 2) + '•'.repeat(abhaValue.length - 4) + abhaValue.slice(-2)
    : abhaValue

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
            <h1>Verify your identity</h1>
            <p className="login-sub">
              We&apos;ve sent a 6-digit verification code to the mobile number registered with <strong>{maskedValue}</strong>.
            </p>

            {/* Quick Demo OTP Banner */}
            <div className="demo-credentials-banner">
              <div className="demo-banner-title">
                <span>Prototype Mode Credentials</span>
              </div>
              <p>Any 6-digit code is valid for demo testing:</p>
              <button type="button" onClick={handleFillDemoOtp} className="btn-demo-fill">
                Auto-Fill Demo OTP (123456)
              </button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="otp-inputs-row" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    ref={el => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="v2-otp-box"
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    autoComplete="off"
                  />
                ))}
              </div>

              <button
                id="verify-otp-btn"
                type="submit"
                className="v2-btn-primary full-width"
                disabled={loading || otp.join('').length < 6}
              >
                {loading ? 'Verifying OTP…' : 'Verify & Continue →'}
              </button>
            </form>

            <div className="otp-resend-wrap">
              {resendTimer > 0 ? (
                <span>Resend OTP in <strong style={{ color: '#2563eb' }}>{resendTimer}s</strong></span>
              ) : (
                <button type="button" onClick={handleResend} className="btn-resend">
                  Didn&apos;t receive it? Resend OTP
                </button>
              )}
            </div>

            <div className="login-footer-links">
              <button type="button" onClick={() => router.push('/login')} className="btn-back-link">
                ← Back to Login
              </button>
            </div>
          </div>
        </div>

        {/* Right Info Section */}
        <div className="split-right">
          <div className="right-content">
            <span className="right-badge">ABDM Gateway Integration</span>
            <h2>Instant authentication, zero passwords to remember</h2>
            <p>
              By verifying via government OTP, your health locker stays encrypted and protected against unauthorized logins.
            </p>

            <div className="trust-feature-list">
              <div className="trust-item">
                <div>
                  <h4>Demo Credentials Included</h4>
                  <p>In prototype mode, use any 6-digit code (e.g. 123456) or tap the auto-fill button to instantly access the health locker.</p>
                </div>
              </div>

              <div className="trust-item">
                <div>
                  <h4>Registered Mobile Security</h4>
                  <p>OTP is generated by the NHA/ABDM Gateway to match your official Aadhaar record.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
