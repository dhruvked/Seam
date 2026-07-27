'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ──────────────────────────────────────────────────────
type DoctorState = 'idle' | 'searching' | 'found' | 'consent_sent' | 'approved' | 'submitting' | 'submitted'

interface Medicine {
  id: number
  drug: string
  dose: string
  freq: string
  duration: string
  instructions: string
}

const MOCK_DRUGS = [
  'Paracetamol', 'Amoxicillin', 'Azithromycin', 'Metformin', 'Atorvastatin',
  'Omeprazole', 'Cetirizine', 'Ibuprofen', 'Amlodipine', 'Pantoprazole',
  'Doxycycline', 'Cefixime', 'Montelukast', 'Aspirin', 'Losartan',
]

const LAB_TESTS = [
  'CBC (Complete Blood Count)', 'Blood Sugar (Fasting)', 'HbA1c',
  'Lipid Profile', 'LFT (Liver Function)', 'KFT (Kidney Function)',
  'Thyroid Profile (TSH)', 'Urine Routine', 'Chest X-Ray', 'ECG',
  'CRP', 'Vitamin D', 'Vitamin B12', 'Iron Studies',
]

const FOLLOW_UPS = ['1 week', '2 weeks', '1 month', '3 months', 'As needed']

const STEPS = [
  { label: 'Search Patient', number: '1' },
  { label: 'Consent', number: '2' },
  { label: 'Consultation', number: '3' },
  { label: 'Submit', number: '4' },
]

const PATIENT_HISTORY = [
  {
    id: 1,
    type: 'Consultation',
    title: 'Viral Fever & Upper Respiratory Infection',
    doctor: 'Dr. Priya Mehta',
    facility: 'Apollo Clinic, Andheri',
    date: '28 Jun 2026',
    detail: 'Presented with 3-day fever (102°F), sore throat, and body ache. Likely viral etiology. Symptomatic management advised.',
    tags: ['ICD-11: J06.9', 'OP Visit', 'FHIR Synced'],
  },
  {
    id: 2,
    type: 'Prescription',
    title: 'Rx — Paracetamol, Cetirizine, Azithromycin',
    doctor: 'Dr. Priya Mehta',
    facility: 'Apollo Clinic, Andheri',
    date: '28 Jun 2026',
    detail: 'Paracetamol 650mg TDS x 5 days | Cetirizine 10mg OD x 5 days | Azithromycin 500mg OD x 3 days. Take after meals.',
    tags: ['3 medications', '5-day course'],
  },
  {
    id: 3,
    type: 'Lab Report',
    title: 'Complete Blood Count (CBC) + CRP',
    doctor: 'SRL Diagnostics',
    facility: 'SRL Lab, Malad West',
    date: '27 Jun 2026',
    detail: 'WBC: 11,200/uL (slightly elevated) | Hb: 13.8 g/dL (normal) | Platelets: 2.1L (normal) | CRP: 18 mg/L (mildly elevated).',
    tags: ['LOINC Coded', 'Mildly Abnormal', 'PDF Available'],
  },
  {
    id: 4,
    type: 'Consultation',
    title: 'Type 2 Diabetes — Quarterly Review',
    doctor: 'Dr. Suresh Rao',
    facility: 'Kokilaben Hospital OPD',
    date: '10 Apr 2026',
    detail: 'HbA1c: 7.1% (controlled). Weight stable at 74kg. No new complications. Continue current medication.',
    tags: ['ICD-11: 5A11', 'Chronic Ongoing', 'FHIR Synced'],
  },
  {
    id: 5,
    type: 'Prescription',
    title: 'Rx — Metformin 500mg, Telmisartan 40mg',
    doctor: 'Dr. Suresh Rao',
    facility: 'Kokilaben Hospital OPD',
    date: '10 Apr 2026',
    detail: 'Metformin 500mg BD after meals (long-term) | Telmisartan 40mg OD morning (long-term).',
    tags: ['2 medications', 'Long-term'],
  },
  {
    id: 6,
    type: 'Lab Report',
    title: 'HbA1c + Lipid Profile + KFT',
    doctor: 'Metropolis Healthcare',
    facility: 'Metropolis Lab, Bandra',
    date: '8 Apr 2026',
    detail: 'HbA1c: 7.1% | Total Cholesterol: 182 mg/dL | LDL: 108 mg/dL | HDL: 48 mg/dL | Creatinine: 0.9 mg/dL.',
    tags: ['LOINC Coded', 'All Normal'],
  },
  {
    id: 7,
    type: 'Imaging',
    title: 'Chest X-Ray (PA View)',
    doctor: 'Dr. Ananya Singh',
    facility: 'Nanavati Hospital Radiology',
    date: '2 Jan 2026',
    detail: 'No active consolidation or pleural effusion. Lung fields clear bilaterally. Heart size normal.',
    tags: ['Radiology', 'Normal', 'DICOM Stored'],
  },
]

const TYPE_BADGE_CLASSES: { [key: string]: string } = {
  'Consultation': 'dd-tag-teal',
  'Prescription': 'dd-tag-blue',
  'Lab Report': 'dd-tag-purple',
  'Imaging': 'dd-tag-amber',
}

const LS_KEY = 'healthos_state'

function getLS() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

function setLS(update: object) {
  const current = getLS()
  localStorage.setItem(LS_KEY, JSON.stringify({ ...current, ...update }))
}

// ─── Component ───────────────────────────────────────────────────
export default function DoctorDashboard() {
  const router = useRouter()
  const [doctorName, setDoctorName] = useState('Dr. Priya Mehta')
  const [hprId, setHprId] = useState('HPR-MAH-2019-12345')

  const [step, setStep] = useState<DoctorState>('idle')
  const [query, setQuery] = useState('')
  const [searchError, setSearchError] = useState('')

  // Tab & Carousel state in approved view
  const [approvedTab, setApprovedTab] = useState<'prescription' | 'history'>('prescription')
  const [currentSlide, setCurrentSlide] = useState(0)

  // Consultation form
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: 1, drug: '', dose: '500mg', freq: 'BD', duration: '5 days', instructions: 'After meals' },
  ])
  const [labTests, setLabTests] = useState<string[]>([])
  const [advice, setAdvice] = useState('')
  const [followUp, setFollowUp] = useState('1 week')
  const [submitting, setSubmitting] = useState(false)
  const [recordId, setRecordId] = useState('')

  // Poll for consent approval
  const pollConsent = useCallback(() => {
    const state = getLS()
    if (state.consent?.status === 'approved') {
      setStep('approved')
    } else if (state.consent?.status === 'declined') {
      setStep('found')
      setSearchError('Patient declined the consent request.')
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('doctor_auth')
      if (!auth) { router.push('/doctor/login'); return }
      const name = sessionStorage.getItem('doctor_name')
      const hpr = sessionStorage.getItem('doctor_hpr')
      if (name) setDoctorName(name)
      if (hpr) setHprId(hpr)

      // Clear any old consent state on load
      const ls = getLS()
      if (ls.consent) setLS({ consent: null })
    }
  }, [router])

  // Poll localStorage when waiting for consent
  useEffect(() => {
    if (step !== 'consent_sent') return
    const interval = setInterval(pollConsent, 800)
    return () => clearInterval(interval)
  }, [step, pollConsent])

  // ─── Handlers ─────────────────────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearchError('')
    if (!query.trim()) { setSearchError('Enter an ABHA ID or patient name'); return }
    setStep('searching')
    await new Promise(r => setTimeout(r, 1400))
    const q = query.toLowerCase().trim()
    if (q.includes('rahul') || q.includes('12-3456') || q.includes('rahul.sharma')) {
      setStep('found')
    } else {
      setStep('idle')
      setSearchError('No patient found for "' + query + '". Try: rahul.sharma@abdm')
    }
  }

  const handleRequestConsent = async () => {
    setLS({ consent: { status: 'pending', doctorName, facility: 'Apollo Clinic, Andheri', requestedAt: Date.now() } })
    setStep('consent_sent')
  }

  const handleMedicineChange = (id: number, field: keyof Medicine, value: string) => {
    setMedicines(ms => ms.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const handleAddMedicine = () => {
    const newId = Math.max(...medicines.map(m => m.id)) + 1
    setMedicines(ms => [...ms, { id: newId, drug: '', dose: '500mg', freq: 'OD', duration: '5 days', instructions: 'After meals' }])
  }

  const handleRemoveMedicine = (id: number) => {
    if (medicines.length === 1) return
    setMedicines(ms => ms.filter(m => m.id !== id))
  }

  const handleToggleLab = (test: string) => {
    setLabTests(ts => ts.includes(test) ? ts.filter(t => t !== test) : [...ts, test])
  }

  const handleSubmitConsult = async () => {
    if (!chiefComplaint.trim() || !diagnosis.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1800))

    const id = 'HOS-' + Date.now().toString().slice(-8)
    setRecordId(id)

    // Save to localStorage so patient dashboard can read it
    const record = {
      id,
      type: 'Consultation',
      typeClass: 'icon-teal',
      icon: '✓',
      title: diagnosis,
      doctor: doctorName,
      facility: 'Apollo Clinic, Andheri',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      detail: chiefComplaint,
      medicines: medicines.filter(m => m.drug),
      labTests,
      advice,
      followUp,
      tags: [
        { label: 'New Record', cls: 'tag-teal' },
        { label: 'HealthOS', cls: 'tag-blue' },
        { label: 'Pending FHIR Sync', cls: 'tag-amber' },
      ],
    }

    const ls = getLS()
    const existing = ls.consultations || []
    setLS({ consultations: [record, ...existing], consent: null })

    setSubmitting(false)
    setStep('submitted')
  }

  const handleNewConsult = () => {
    setStep('idle')
    setQuery('')
    setChiefComplaint('')
    setDiagnosis('')
    setMedicines([{ id: 1, drug: '', dose: '500mg', freq: 'BD', duration: '5 days', instructions: 'After meals' }])
    setLabTests([])
    setAdvice('')
    setFollowUp('1 week')
    setRecordId('')
    setSearchError('')
    setApprovedTab('prescription')
    setCurrentSlide(0)
    const ls = getLS()
    if (ls.consent) setLS({ consent: null })
  }

  // ─── Step index ───────────────────────────────────────────────
  const stepIndex = step === 'idle' || step === 'searching' || step === 'found' ? 0
    : step === 'consent_sent' ? 1
    : step === 'approved' || step === 'submitting' ? 2
    : 3

  const initials = doctorName.split(' ').filter(w => w[0]?.match(/[A-Z]/)).map(w => w[0]).join('').slice(0, 2) || 'DR'

  return (
    <div className="dd-dashboard">
      {/* Fullscreen Mobile Warning Takeover */}
      <div className="dd-mobile-warning">
        <div className="dd-mobile-warning-card">
          <div className="dd-mobile-warning-icon">S</div>
          <h2 className="dd-mobile-warning-title">Desktop Only Portal</h2>
          <p className="dd-mobile-warning-sub">
            The Seam Doctor Portal is designed for clinical desktop and tablet displays. Please open this link on a computer to manage consultations.
          </p>
          <a href="/" className="dd-mobile-warning-btn">Go to Seam Home</a>
        </div>
      </div>

      {/* Header */}
      <header className="dd-dash-header">
        <div className="dd-dash-header-left">
          <div className="dd-dash-logo">
            <span>Seam</span>
          </div>
          <div className="dd-hpr-badge" id="hpr-badge">
            <span className="dd-badge-pill">Clinical Portal</span>
          </div>
        </div>
        <div className="dd-dash-header-right">
          <button id="doctor-logout-btn" className="dd-btn-signout"
            onClick={() => { sessionStorage.clear(); router.push('/') }}>
            Sign Out
          </button>
        </div>
      </header>

      <div className="dd-dash-body">
        {/* Sidebar */}
        <aside className="dd-sidebar">
          {/* Doctor info card */}
          <div className="dd-doctor-card">
            <div className="dd-doctor-avatar">{initials}</div>
            <div className="dd-doctor-name">{doctorName}</div>
            <div className="dd-doctor-spec">MBBS, MD — Internal Medicine</div>
            <div className="dd-doctor-meta-row">
              <div className="dd-doctor-meta-item">Apollo Clinic, Andheri</div>
              <div className="dd-doctor-meta-item">{hprId}</div>
              <div className="dd-doctor-meta-item">Reg. No: MCI-2019-88742</div>
            </div>
          </div>

          <div className="dd-sidebar-section">Portal</div>
          {[
            { label: 'Active Consultation', id: 'consult' },
            { label: 'Today\'s Patients', id: 'today', badge: '0' },
            { label: 'History', id: 'history' },
          ].map(item => (
            <button key={item.id} id={`doc-nav-${item.id}`}
              className={`dd-sidebar-item ${item.id === 'consult' ? 'active' : ''}`}>
              <span>{item.label}</span>
              {item.badge !== undefined && <span className="dd-item-badge">{item.badge}</span>}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="dd-dash-main">

          {/* Step indicator */}
          <div className="dd-step-bar">
            {STEPS.map((s, i) => (
              <div key={i} className="dd-step-item">
                <div className={`dd-step-dot ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}>
                  {i < stepIndex ? '✓' : s.number}
                </div>
                <span className={`dd-step-label ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`dd-step-line ${i < stepIndex ? 'done' : ''}`} />
                )}
              </div>
            ))}
          </div>

          {/* ─── IDLE ─────────────────────────────────────────── */}
          {step === 'idle' && (
            <>
              <div className="dd-search-area">
                <div className="dd-search-title">Find a Patient</div>
                <p className="dd-search-sub">Search by ABHA ID, ABHA address, or patient name</p>

                {searchError && (
                  <div className="dd-form-error">
                    {searchError}
                  </div>
                )}

                <form onSubmit={handleSearch}>
                  <div className="dd-search-row">
                    <div className="dd-search-input-wrap">
                      <input
                        id="patient-search-input"
                        className="dd-search-input"
                        placeholder="rahul.sharma@abdm or 12-3456-7890-1234"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <button id="search-btn" type="submit" className="dd-btn-search">Search</button>
                    <button type="button" className="dd-btn-scan" id="scan-qr-btn"
                      onClick={() => { setQuery('rahul.sharma@abdm'); setTimeout(() => document.getElementById('search-btn')?.click(), 100) }}>
                      Scan QR
                    </button>
                  </div>
                </form>

                <p className="dd-search-hint">Try: rahul.sharma@abdm or just "rahul"</p>
              </div>

              <div className="dd-idle-state">
                <div className="dd-idle-title">No active consultation</div>
                <p className="dd-idle-sub">Search for a patient above or scan their ABHA QR code to begin a consultation.</p>
              </div>
            </>
          )}

          {/* ─── SEARCHING ────────────────────────────────────── */}
          {step === 'searching' && (
            <div className="dd-idle-state">
              <div className="dd-idle-title">Looking up patient...</div>
              <p className="dd-idle-sub">Querying ABDM registry for ABHA ID</p>
            </div>
          )}

          {/* ─── FOUND ────────────────────────────────────────── */}
          {step === 'found' && (
            <>
              {searchError && (
                <div className="dd-form-error" style={{ marginBottom: 16 }}>
                  {searchError}
                </div>
              )}
              <div className="dd-patient-found">
                <div className="dd-patient-found-top">
                  <div className="dd-patient-found-avatar">RS</div>
                  <div className="dd-patient-found-info">
                    <div className="dd-patient-found-name">Rahul Sharma</div>
                    <div className="dd-patient-found-meta">
                      <span>ID: 12-3456-7890-1234</span>
                      <span>Blood: B+</span>
                      <span>Male, 38 yrs</span>
                      <span>Mumbai, MH</span>
                    </div>
                  </div>
                </div>

                <div className="dd-patient-found-tags">
                  <span className="dd-tag dd-tag-red">Penicillin Allergy — Severe</span>
                  <span className="dd-tag dd-tag-teal">Diabetes — Managed</span>
                  <span className="dd-tag dd-tag-blue">Hypertension — Managed</span>
                  <span className="dd-tag dd-tag-purple">2 Active Medicines</span>
                </div>

                <div className="dd-patient-found-actions">
                  <button id="request-consent-btn" className="dd-btn-consent" onClick={handleRequestConsent}>
                    Request Consent
                  </button>
                  <button className="dd-btn-cancel-search" onClick={handleNewConsult} id="cancel-search-btn">
                    Clear
                  </button>
                </div>
              </div>

              <div className="dd-idle-state" style={{ marginTop: 24 }}>
                <div className="dd-idle-title">Consent required to proceed</div>
                <p className="dd-idle-sub">Click "Request Consent" above to send a consent notification to Rahul's phone. You can proceed only after they approve.</p>
              </div>
            </>
          )}

          {/* ─── CONSENT SENT ─────────────────────────────────── */}
          {step === 'consent_sent' && (
            <div className="dd-consent-pending">
              <div className="dd-consent-pending-title">Waiting for Patient Approval</div>
              <p className="dd-consent-pending-sub">
                A consent notification has been sent to <strong>Rahul Sharma's</strong> registered mobile number. Ask them to open their HealthOS app to approve.
              </p>

              <div className="dd-consent-tip">
                Ask the patient to open <strong>healthrecord-ivory.vercel.app</strong> and tap Approve
              </div>

              <div className="dd-consent-dots">
                <div className="dd-consent-dot" />
                <div className="dd-consent-dot" />
                <div className="dd-consent-dot" />
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
                Polling for approval... (checks every 800ms)
              </p>
            </div>
          )}

          {/* ─── APPROVED — WORKSPACE WITH OPTIONS (PRESCRIPTION & MEDICAL HISTORY CAROUSEL) ─── */}
          {(step === 'approved' || step === 'submitting') && (
            <>
              {/* Approval banner */}
              <div className="dd-approval-banner">
                <div>
                  <div className="dd-approval-banner-title">Consent Approved</div>
                  <div className="dd-approval-banner-sub">Rahul Sharma granted access · Expires after this session</div>
                </div>
              </div>

              {/* Patient summary */}
              <div className="dd-patient-found" style={{ marginBottom: 20 }}>
                <div className="dd-patient-found-top" style={{ marginBottom: 12 }}>
                  <div className="dd-patient-found-avatar">RS</div>
                  <div className="dd-patient-found-info">
                    <div className="dd-patient-found-name">Rahul Sharma</div>
                    <div className="dd-patient-found-meta">
                      <span>ID: 12-3456-7890-1234</span>
                      <span>Blood: B+</span>
                      <span>Male, 38 yrs</span>
                    </div>
                  </div>
                </div>
                <div className="dd-patient-found-tags">
                  <span className="dd-tag dd-tag-red">Penicillin Allergy — Severe</span>
                  <span className="dd-tag dd-tag-amber">Diabetes Type 2 since 2018</span>
                  <span className="dd-tag dd-tag-amber">Hypertension since 2020</span>
                  <span className="dd-tag dd-tag-blue">On Metformin + Telmisartan</span>
                </div>
              </div>

              {/* Main Box with Tabbed Options */}
              <div className="dd-workspace-box">
                {/* Tab Header Bar */}
                <div className="dd-tab-header">
                  <div className="dd-tab-buttons">
                    <button
                      className={`dd-tab-btn ${approvedTab === 'prescription' ? 'active' : ''}`}
                      onClick={() => setApprovedTab('prescription')}
                    >
                      Write Consultation & Prescription
                    </button>
                    <button
                      className={`dd-tab-btn ${approvedTab === 'history' ? 'active' : ''}`}
                      onClick={() => setApprovedTab('history')}
                    >
                      Patient Medical History ({PATIENT_HISTORY.length})
                    </button>
                  </div>
                </div>

                {/* Option 1: Prescription Form */}
                {approvedTab === 'prescription' && (
                  <div className="dd-consult-container" style={{ border: 'none', borderRadius: 0 }}>
                    <div className="dd-consult-header">
                      <div>
                        <div className="dd-consult-header-title">New Consultation & Prescription</div>
                        <div className="dd-consult-header-sub">{doctorName} · Apollo Clinic, Andheri · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                    </div>

                    <div className="dd-consult-body">
                      {/* Chief Complaint */}
                      <div>
                        <div className="dd-consult-section-label">Chief Complaint *</div>
                        <textarea
                          id="chief-complaint"
                          className="dd-consult-textarea"
                          placeholder="e.g. Patient presents with 3-day history of fever and sore throat..."
                          value={chiefComplaint}
                          onChange={e => setChiefComplaint(e.target.value)}
                        />
                      </div>

                      {/* Diagnosis */}
                      <div>
                        <div className="dd-consult-section-label">Diagnosis * <span className="dd-consult-section-label-sub">(include ICD-11 code if known)</span></div>
                        <input
                          id="diagnosis-input"
                          className="dd-consult-input"
                          placeholder="e.g. Viral Upper Respiratory Tract Infection (ICD-11: CA08.0)"
                          value={diagnosis}
                          onChange={e => setDiagnosis(e.target.value)}
                        />
                      </div>

                      {/* Medicines */}
                      <div>
                        <div className="dd-consult-section-label">Prescription</div>
                        <div className="dd-medicine-rows">
                          {medicines.map((med, idx) => (
                            <div key={med.id} className="dd-medicine-row">
                              <input
                                id={`med-drug-${idx}`}
                                list="drug-list"
                                placeholder="Drug name"
                                value={med.drug}
                                onChange={e => handleMedicineChange(med.id, 'drug', e.target.value)}
                                className="dd-consult-input dd-med-input"
                              />
                              <datalist id="drug-list">
                                {MOCK_DRUGS.map(d => <option key={d} value={d} />)}
                              </datalist>
                              <select className="dd-consult-select" value={med.dose} onChange={e => handleMedicineChange(med.id, 'dose', e.target.value)}>
                                {['100mg','250mg','400mg','500mg','650mg','1g','5mg','10mg','20mg','40mg','80mg'].map(d => <option key={d}>{d}</option>)}
                              </select>
                              <select className="dd-consult-select" value={med.freq} onChange={e => handleMedicineChange(med.id, 'freq', e.target.value)}>
                                {['OD','BD','TDS','QID','SOS','At bedtime'].map(f => <option key={f}>{f}</option>)}
                              </select>
                              <select className="dd-consult-select" value={med.duration} onChange={e => handleMedicineChange(med.id, 'duration', e.target.value)}>
                                {['3 days','5 days','7 days','10 days','14 days','1 month','3 months','Ongoing'].map(d => <option key={d}>{d}</option>)}
                              </select>
                              <select className="dd-consult-select" value={med.instructions} onChange={e => handleMedicineChange(med.id, 'instructions', e.target.value)}>
                                {['After meals','Before meals','With meals','At bedtime','Empty stomach','With water'].map(i => <option key={i}>{i}</option>)}
                              </select>
                              <button type="button" className="dd-btn-remove-med" onClick={() => handleRemoveMedicine(med.id)}>Remove</button>
                            </div>
                          ))}
                          <button type="button" className="dd-btn-add-med" id="add-medicine-btn" onClick={handleAddMedicine}>
                            Add Medicine
                          </button>
                        </div>
                      </div>

                      {/* Lab Tests */}
                      <div>
                        <div className="dd-consult-section-label">Lab Orders <span className="dd-consult-section-label-sub">({labTests.length} selected)</span></div>
                        <div className="dd-lab-grid">
                          {LAB_TESTS.map(test => (
                            <div key={test} id={`lab-${test.split(' ')[0]}`}
                              className={`dd-lab-check ${labTests.includes(test) ? 'checked' : ''}`}
                              onClick={() => handleToggleLab(test)}>
                              <div className="dd-lab-check-box">{labTests.includes(test) ? '✓' : ''}</div>
                              {test}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Advice */}
                      <div>
                        <div className="dd-consult-section-label">Advice & Instructions</div>
                        <textarea
                          id="advice-input"
                          className="dd-consult-textarea"
                          placeholder="Rest, fluids, dietary advice, activity restrictions..."
                          value={advice}
                          onChange={e => setAdvice(e.target.value)}
                        />
                      </div>

                      {/* Follow-up */}
                      <div>
                        <div className="dd-consult-section-label">Follow-up</div>
                        <div className="dd-followup-row">
                          {FOLLOW_UPS.map(f => (
                            <div key={f} id={`followup-${f.replace(' ','-')}`}
                              className={`dd-followup-opt ${followUp === f ? 'selected' : ''}`}
                              onClick={() => setFollowUp(f)}>
                              {followUp === f ? '✓ ' : ''}{f}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="dd-consult-footer">
                      <div className="dd-consult-footer-note">
                        Record will be signed, saved, and queued for ABDM FHIR sync
                      </div>
                      <button
                        id="submit-consultation-btn"
                        className="dd-btn-submit-consult"
                        onClick={handleSubmitConsult}
                        disabled={!chiefComplaint.trim() || !diagnosis.trim() || submitting}
                      >
                        {submitting ? 'Saving...' : 'Submit Consultation'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Option 2: Medical History Carousel */}
                {approvedTab === 'history' && (
                  <div className="dd-carousel-wrapper">
                    <div className="dd-carousel-header">
                      <div>
                        <h3 className="dd-carousel-title">Patient History Records</h3>
                        <p className="dd-carousel-sub">Shared via ABDM consent flow · Clean FHIR formatted records</p>
                      </div>
                      <div className="dd-carousel-controls">
                        <button
                          className="dd-carousel-arrow"
                          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                          disabled={currentSlide === 0}
                        >
                          Previous
                        </button>
                        <span className="dd-carousel-counter">{currentSlide + 1} of {PATIENT_HISTORY.length}</span>
                        <button
                          className="dd-carousel-arrow"
                          onClick={() => setCurrentSlide(prev => Math.min(PATIENT_HISTORY.length - 1, prev + 1))}
                          disabled={currentSlide === PATIENT_HISTORY.length - 1}
                        >
                          Next
                        </button>
                      </div>
                    </div>

                    {/* Carousel Active Card Display */}
                    <div className="dd-carousel-card">
                      <div className="dd-carousel-card-top">
                        <span className={`dd-tag ${TYPE_BADGE_CLASSES[PATIENT_HISTORY[currentSlide].type] || 'dd-tag-blue'}`}>
                          {PATIENT_HISTORY[currentSlide].type}
                        </span>
                        <span className="dd-carousel-card-date">{PATIENT_HISTORY[currentSlide].date}</span>
                      </div>
                      <h4 className="dd-carousel-card-title">{PATIENT_HISTORY[currentSlide].title}</h4>
                      <div className="dd-carousel-card-meta">
                        {PATIENT_HISTORY[currentSlide].doctor} &nbsp;·&nbsp; {PATIENT_HISTORY[currentSlide].facility}
                      </div>
                      <div className="dd-carousel-card-detail">
                        {PATIENT_HISTORY[currentSlide].detail}
                      </div>
                      <div className="dd-carousel-card-tags">
                        {PATIENT_HISTORY[currentSlide].tags.map((t, idx) => (
                          <span key={idx} className="dd-tag dd-tag-blue" style={{ background: '#ffffff' }}>{t}</span>
                        ))}
                      </div>
                    </div>

                    {/* Carousel Dots */}
                    <div className="dd-carousel-dots">
                      {PATIENT_HISTORY.map((_, idx) => (
                        <button
                          key={idx}
                          className={`dd-carousel-dot ${currentSlide === idx ? 'active' : ''}`}
                          onClick={() => setCurrentSlide(idx)}
                        />
                      ))}
                    </div>

                    {/* Quick Switch Action */}
                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                      <button
                        className="dd-btn-consent"
                        onClick={() => setApprovedTab('prescription')}
                      >
                        Return to Consultation & Prescription Form
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ─── SUBMITTED ────────────────────────────────────── */}
          {step === 'submitted' && (
            <div className="dd-success-card">
              <div className="dd-success-icon">✓</div>
              <div className="dd-success-title">Consultation Submitted</div>
              <p className="dd-success-sub">
                The consultation has been saved and the record is now visible on Rahul Sharma&apos;s patient timeline. FHIR sync queued for ABDM.
              </p>
              <div className="dd-success-record-id">Record ID: {recordId}</div>
              <div className="dd-success-tags">
                <span className="dd-tag dd-tag-green">✓ Saved to DB</span>
                <span className="dd-tag dd-tag-blue">✓ Patient Notified</span>
                <span className="dd-tag dd-tag-amber">Pending FHIR Sync</span>
              </div>
              <div className="dd-success-actions">
                <button id="new-consultation-btn" className="dd-btn-submit-consult" onClick={handleNewConsult}>
                  New Consultation
                </button>
                <button className="dd-btn-outline" onClick={() => { window.open('/', '_blank') }}>
                  View Patient App
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

