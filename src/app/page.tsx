import Link from 'next/link'

export default function Home() {
  return (
    <div className="layout-root">
      
      {/* Navbar */}
      <header className="wireframe-header">
        <div className="header-brand">
          <span className="brand-logo">🩺</span>
          <div>
            <h1 className="brand-name">Seam</h1>
            <p className="brand-sub">ABDM Health Locker & Clinical Portal</p>
          </div>
        </div>

        <div className="header-actions">
          <Link href="/login" className="btn-primary">
            Patient Login →
          </Link>
          <Link href="/doctor/login" className="btn-secondary">
            Doctor Portal →
          </Link>
        </div>
      </header>

      {/* Main Landing */}
      <main className="simple-landing">
        <div className="simple-hero-card">
          <h1>Seamless Health Record Sharing</h1>
          <p>
            Connect your Ayushman Bharat Health Account (ABHA). Access all your medical records, grant digital consent to doctors, and translate prescriptions with AI.
          </p>

          <div className="simple-actions">
            <Link href="/login" className="btn-primary">
              🔑 Login with ABHA (Patient App)
            </Link>
            <Link href="/doctor/login" className="btn-secondary">
              👨‍⚕️ Doctor Clinical Portal
            </Link>
          </div>
        </div>

        <div className="stats-row" style={{ width: '100%' }}>
          <div className="stat-pill">
            <span className="stat-num">ABDM</span>
            <span className="stat-lbl">Sandbox Compliant</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">FHIR R4</span>
            <span className="stat-lbl">Record Standards</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">Gemini AI</span>
            <span className="stat-lbl">Prescription Explainer</span>
          </div>
        </div>
      </main>

    </div>
  )
}