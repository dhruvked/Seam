'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OtpPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const [abhaValue, setAbhaValue] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const val = sessionStorage.getItem('abha_login_value') || '98XXXXXXXX'
    setAbhaValue(val)
    inputRefs.current[0]?.focus()
  }, [])

  // Countdown timer
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    // Simulate ABDM OTP verification (POST /v3/profile/login/verify)
    await new Promise(r => setTimeout(r, 1600))

    // Mock: any OTP works in prototype (real: must match ABDM response)
    if (code === '000000') {
      setError('Incorrect OTP. Please try again.')
      setLoading(false)
      return
    }

    // Store auth state
    sessionStorage.setItem('auth_verified', 'true')
    sessionStorage.setItem('patient_name', 'Rahul Sharma')
    sessionStorage.setItem('patient_abha', '12-3456-7890-1234')

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
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="auth-card fade-up">
        <div className="auth-card-glow" />

        <div className="auth-logo">
          <div className="logo-icon" style={{ width: 32, height: 32, fontSize: 16, background: 'linear-gradient(135deg,#00d4aa,#3b82f6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚕</div>
          <span style={{ fontSize: 17, fontWeight: 700 }}>HealthOS</span>
        </div>

        <h1 className="auth-title">Verify your identity</h1>
        <p className="auth-subtitle">
          We&apos;ve sent a 6-digit OTP to the mobile number linked to your ABHA.
        </p>

        <div className="abha-pill">
          <span>🪪</span>
          <span>{maskedValue}</span>
        </div>

        {error && (
          <div className="form-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="otp-grid" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-input"
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoComplete="off"
              />
            ))}
          </div>

          <p className="otp-hint">
            Enter any 6 digits to continue (prototype mode)
          </p>

          <button
            id="verify-otp-btn"
            type="submit"
            className="btn-submit"
            disabled={loading || otp.join('').length < 6}
          >
            {loading ? <><span className="spinner" /> Verifying…</> : 'Verify & Continue →'}
          </button>
        </form>

        <div className="otp-resend">
          {resendTimer > 0
            ? <>Resend OTP in <strong style={{ color: 'var(--teal)' }}>{resendTimer}s</strong></>
            : <>Didn&apos;t receive it?
                <button onClick={handleResend} id="resend-btn">Resend OTP</button>
              </>
          }
        </div>

        <button
          className="btn-outline"
          onClick={() => router.push('/login')}
          id="back-to-login"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  )
}
