import Link from 'next/link'

export default function Home() {
  return (
    <div className="landing-v2">
      {/* Navbar */}
      <nav className="v2-nav">
        <div className="v2-nav-container">
          <Link href="/" className="v2-logo">
            <div className="v2-logo-icon">S</div>
            <span className="v2-logo-text">Seam</span>
          </Link>
          <div className="v2-nav-center">
            <span className="v2-abdm-pill">
              <span className="v2-dot" /> ABDM V3 Certified
            </span>
          </div>
          <div className="v2-nav-right">
            <Link href="/doctor/login" className="v2-link-doctor">
              Doctor Portal →
            </Link>
            <Link href="/login" className="v2-btn-nav">
              Login with ABHA
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="v2-hero">
        <div className="v2-container">
          <div className="v2-hero-badge">
            Built for India&apos;s National Health Ecosystem
          </div>

          <h1 className="v2-hero-title">
            India&apos;s health records are trapped in paper folders.{' '}
            <span className="v2-text-gradient">Seam fixes that.</span>
          </h1>

          <p className="v2-hero-sub">
            Seam connects patients and doctors through a real-time digital consent loop.
            Access every consultation, prescription, and lab report across India in one tap.
          </p>

          <div className="v2-hero-ctas">
            <Link href="/login" className="v2-btn-primary">
              Login with ABHA
              <span className="v2-arrow">→</span>
            </Link>
            <Link href="/doctor/login" className="v2-btn-secondary">
              Open Doctor Portal
            </Link>
          </div>

          <div className="v2-hero-trust">
            <span>✓ 100% Free for Patients</span>
            <span>✓ No App Download Needed</span>
            <span>✓ ABDM & DPDP Act Compliant</span>
          </div>

          {/* Interactive Comparison Card (The Old Way vs. The Seam Way) */}
          <div className="v2-comparison-grid">
            {/* Old Way */}
            <div className="v2-card v2-card-old">
              <div className="v2-card-header">
                <span className="v2-badge-red">The Old Way</span>
                <h3>Paper Folders & Lost Files</h3>
              </div>
              <ul className="v2-list-old">
                <li>
                  <span className="v2-icon-fail">✕</span>
                  <div>
                    <strong>Lost Prescriptions & Lab Reports</strong>
                    <p>Physical papers get damaged or forgotten at home during emergencies.</p>
                  </div>
                </li>
                <li>
                  <span className="v2-icon-fail">✕</span>
                  <div>
                    <strong>Doctors Have Zero Medical Context</strong>
                    <p>Every new clinic visit starts from scratch with 20 minutes of repeat questions.</p>
                  </div>
                </li>
                <li>
                  <span className="v2-icon-fail">✕</span>
                  <div>
                    <strong>Unreadable Medical Jargon</strong>
                    <p>Dense doctor handwriting and lab values leave patients confused and anxious.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* The Seam Way */}
            <div className="v2-card v2-card-seam">
              <div className="v2-card-header">
                <span className="v2-badge-blue">The Seam Way</span>
                <h3>1-Tap Digital Consent Loop</h3>
              </div>
              <ul className="v2-list-seam">
                <li>
                  <span className="v2-icon-pass">✓</span>
                  <div>
                    <strong>Unified ABHA Health Locker</strong>
                    <p>All consultations, prescriptions, and diagnostics automatically organized in one mobile timeline.</p>
                  </div>
                </li>
                <li>
                  <span className="v2-icon-pass">✓</span>
                  <div>
                    <strong>1-Tap Real-Time Doctor Sharing</strong>
                    <p>Doctor requests access → You tap approve on your phone → Doctor sees your full history instantly.</p>
                  </div>
                </li>
                <li>
                  <span className="v2-icon-pass">✓</span>
                  <div>
                    <strong>AI Prescription Explainer</strong>
                    <p>Gemini AI translates complex prescriptions and blood tests into simple, plain English.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works (3-Step Loop) */}
      <section className="v2-steps-section">
        <div className="v2-container">
          <div className="v2-section-head">
            <span className="v2-section-tag">How Seam Works</span>
            <h2>Simple record sharing in 3 easy steps</h2>
            <p>Designed for absolute clarity and ease of use for every patient and doctor across India.</p>
          </div>

          <div className="v2-steps-grid">
            <div className="v2-step-card">
              <div className="v2-step-num">1</div>
              <h4>Doctor Requests Access</h4>
              <p>During your clinic visit, the doctor searches your 14-digit ABHA ID on the Seam Clinical Portal.</p>
            </div>

            <div className="v2-step-card v2-step-active">
              <div className="v2-step-num">2</div>
              <h4>You Approve on Phone</h4>
              <p>A consent request pops up on your phone. Tap <strong>Approve</strong> to securely share your records for this visit.</p>
            </div>

            <div className="v2-step-card">
              <div className="v2-step-num">3</div>
              <h4>Records Sync Instantly</h4>
              <p>Doctor reviews past history, writes a digital FHIR prescription, and it syncs straight back to your health locker.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="v2-features-section">
        <div className="v2-container">
          <div className="v2-section-head">
            <span className="v2-section-tag">Features</span>
            <h2>Everything you need for seamless digital care</h2>
          </div>

          <div className="v2-bento">
            <div className="v2-bento-card">
              <h3>Patient Health Locker</h3>
              <p>A single, mobile-first timeline for all your historical health data across hospitals and diagnostic labs.</p>
            </div>

            <div className="v2-bento-card">
              <h3>Doctor Clinical Portal</h3>
              <p>Lightweight web interface for clinicians to search patients by ABHA ID, review history, and issue digital prescriptions.</p>
            </div>

            <div className="v2-bento-card">
              <h3>Gemini AI Copilot</h3>
              <p>Translates complex lab values and prescription dosages into friendly, understandable explanations.</p>
            </div>

            <div className="v2-bento-card">
              <h3>Bank-Grade Encryption</h3>
              <p>RSA-2048 encryption protects Aadhaar details before leaving the server. Full compliance with ABDM and DPDP Act 2023.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="v2-stats-section">
        <div className="v2-container">
          <div className="v2-stats-grid">
            <div className="v2-stat-box">
              <span className="v2-stat-num">700M+</span>
              <span className="v2-stat-label">ABHA IDs in India</span>
            </div>
            <div className="v2-stat-box">
              <span className="v2-stat-num">300K+</span>
              <span className="v2-stat-label">Linked Healthcare Facilities</span>
            </div>
            <div className="v2-stat-box">
              <span className="v2-stat-num">10 Sec</span>
              <span className="v2-stat-label">Real-Time Consent Authorization</span>
            </div>
            <div className="v2-stat-box">
              <span className="v2-stat-num">100%</span>
              <span className="v2-stat-label">Patient Controlled Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Call to Action */}
      <section className="v2-cta-banner">
        <div className="v2-container">
          <h2>Ready to digitize your health records?</h2>
          <p>Join thousands of patients and doctors already using Seam across India.</p>
          <div className="v2-cta-buttons">
            <Link href="/login" className="v2-btn-primary v2-btn-lg">
              Sign In with ABHA →
            </Link>
            <a
              href="https://healthid.abdm.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="v2-btn-outline"
            >
              Don&apos;t have an ABHA? Create one free
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="v2-footer">
        <div className="v2-container">
          <div className="v2-footer-content">
            <div className="v2-footer-brand">
              <span className="v2-logo-text">Seam</span>
              <p>Seamless health record sharing for everyone.</p>
            </div>
            <div className="v2-footer-links">
              <Link href="/login">Patient Login</Link>
              <Link href="/doctor/login">Doctor Portal</Link>
              <a href="https://abdm.gov.in" target="_blank" rel="noopener noreferrer">ABDM Official Portal</a>
            </div>
          </div>
          <div className="v2-footer-bottom">
            <p>© {new Date().getFullYear()} Seam Care. Powered by Ayushman Bharat Digital Mission.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
