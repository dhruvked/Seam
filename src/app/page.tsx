import Link from 'next/link'

export default function Home() {
  return (
    <main className="landing">
      <div className="landing-bg" />
      <div className="grid-overlay" />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="logo-icon">⚕</div>
          <span>HealthOS</span>
        </div>
        <span className="nav-badge">ABDM Powered</span>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-tag fade-up">
            <span className="hero-tag-dot" />
            Built on Ayushman Bharat Digital Mission
          </div>

          <h1 className="fade-up-1">
            Your complete health<br />
            record, <span className="gradient-text">one login away</span>
          </h1>

          <p className="hero-sub fade-up-2">
            Access every consultation, prescription, and lab report from any
            hospital across India — securely linked to your ABHA ID.
          </p>

          <div className="hero-actions fade-up-3">
            <Link href="/login" className="btn-primary">
              <span>⚡</span>
              Login with ABHA
            </Link>
            <p className="hero-note">Free forever for patients · No credit card</p>
            <Link href="/doctor/login" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Are you a doctor? <span style={{ color: 'var(--teal)', fontWeight: 600 }}>Doctor Portal →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats-strip fade-up-4">
        <div className="stat-item">
          <div className="stat-value">560M+</div>
          <div className="stat-label">ABHA IDs created</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">300K+</div>
          <div className="stat-label">Linked facilities</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">7</div>
          <div className="stat-label">Record types supported</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">100%</div>
          <div className="stat-label">Consent-based access</div>
        </div>
      </div>
    </main>
  )
}
