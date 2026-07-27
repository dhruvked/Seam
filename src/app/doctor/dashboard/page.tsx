'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import '../../doctor-portal.css'

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
  { label: 'Search Patient', icon: '🔍' },
  { label: 'Consent', icon: '🤝' },
  { label: 'Consultation', icon: '🩺' },
  { label: 'Submit', icon: '✅' },
]

// ─── Shared state helpers ────────────────────────────────────────
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
      icon: '🩺',
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
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, fontSize: 15, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🩺</div>
            <span>HealthOS</span>
          </div>
          <div className="hpr-badge" id="hpr-badge">
            <span>👨‍⚕️</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{hprId}</span>
          </div>
        </div>
        <div className="dash-header-right">
          <button className="btn-icon" id="doctor-notification-btn">🔔</button>
          <div className="avatar" id="doctor-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', flexShrink: 0 }}>{initials}</div>
        </div>
      </header>

      <div className="dash-body">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Doctor info card */}
          <div className="doctor-card">
            <div className="doctor-avatar">{initials}</div>
            <div className="doctor-name">{doctorName}</div>
            <div className="doctor-spec">MBBS, MD — Internal Medicine</div>
            <div className="doctor-meta-row">
              <div className="doctor-meta-item"><span>🏥</span> Apollo Clinic, Andheri</div>
              <div className="doctor-meta-item"><span>🪪</span> {hprId}</div>
              <div className="doctor-meta-item"><span>⭐</span> Reg. No: MCI-2019-88742</div>
            </div>
          </div>

          <div className="sidebar-section">Portal</div>
          {[
            { icon: '🩺', label: 'Active Consultation', id: 'consult' },
            { icon: '📋', label: 'Today\'s Patients', id: 'today', badge: '0' },
            { icon: '📜', label: 'History', id: 'history' },
          ].map(item => (
            <button key={item.id} id={`doc-nav-${item.id}`}
              className={`sidebar-item ${item.id === 'consult' ? 'active' : ''}`}
              style={{ border: 'none', background: 'none', width: '100%' }}>
              <span className="item-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge !== undefined && <span className="item-badge" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--blue)' }}>{item.badge}</span>}
            </button>
          ))}

          <div className="sidebar-section" style={{ marginTop: 12 }}>Account</div>
          <button id="doctor-logout-btn" className="sidebar-item"
            style={{ border: 'none', background: 'none', width: '100%', color: '#ef4444' }}
            onClick={() => { sessionStorage.clear(); router.push('/') }}>
            <span className="item-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Main */}
        <main className="dash-main">

          {/* Step indicator */}
          <div className="step-bar fade-up">
            {STEPS.map((s, i) => (
              <div key={i} className="step-item">
                <div className={`step-dot ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}>
                  {i < stepIndex ? '✓' : s.icon}
                </div>
                <span className={`step-label ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : ''}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`step-line ${i < stepIndex ? 'done' : ''}`} />
                )}
              </div>
            ))}
          </div>

          {/* ─── IDLE ─────────────────────────────────────────── */}
          {step === 'idle' && (
            <>
              <div className="search-area fade-up-1">
                <div className="search-title">Find a Patient</div>
                <p className="search-sub">Search by ABHA ID, ABHA address, or patient name</p>

                {searchError && (
                  <div className="form-error" style={{ maxWidth: 480, margin: '0 auto 16px', textAlign: 'left' }}>
                    <span>⚠</span> {searchError}
                  </div>
                )}

                <form onSubmit={handleSearch}>
                  <div className="search-row">
                    <div className="search-input-wrap">
                      <span className="search-icon">🔍</span>
                      <input
                        id="patient-search-input"
                        className="search-input"
                        placeholder="rahul.sharma@abdm or 12-3456-7890-1234"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <button id="search-btn" type="submit" className="btn-search">Search</button>
                    <button type="button" className="btn-scan" id="scan-qr-btn"
                      onClick={() => { setQuery('rahul.sharma@abdm'); setTimeout(() => document.getElementById('search-btn')?.click(), 100) }}>
                      <span>📷</span> Scan QR
                    </button>
                  </div>
                </form>

                <p className="search-hint">Try: rahul.sharma@abdm or just "rahul"</p>
              </div>

              <div className="idle-state fade-up-2">
                <div className="idle-icon">🩺</div>
                <div className="idle-title">No active consultation</div>
                <p className="idle-sub">Search for a patient above or scan their ABHA QR code to begin a consultation.</p>
              </div>
            </>
          )}

          {/* ─── SEARCHING ────────────────────────────────────── */}
          {step === 'searching' && (
            <div className="idle-state fade-up">
              <div className="idle-icon" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔍</div>
              <div className="idle-title" style={{ marginTop: 8 }}>Looking up patient…</div>
              <p className="idle-sub">Querying ABDM registry for ABHA ID</p>
            </div>
          )}

          {/* ─── FOUND ────────────────────────────────────────── */}
          {step === 'found' && (
            <>
              {searchError && (
                <div className="form-error fade-up" style={{ marginBottom: 16 }}>
                  <span>⚠</span> {searchError}
                </div>
              )}
              <div className="patient-found fade-up">
                <div className="patient-found-top">
                  <div className="patient-found-avatar">RS</div>
                  <div className="patient-found-info">
                    <div className="patient-found-name">Rahul Sharma</div>
                    <div className="patient-found-meta">
                      <span>🪪 12-3456-7890-1234</span>
                      <span>🩸 B+</span>
                      <span>⚥ Male, 38 yrs</span>
                      <span>📍 Mumbai, MH</span>
                    </div>
                  </div>
                </div>

                <div className="patient-found-tags">
                  <span className="tag tag-amber">⚠ Penicillin Allergy</span>
                  <span className="tag tag-teal">Diabetes — Managed</span>
                  <span className="tag tag-blue">Hypertension — Managed</span>
                  <span className="tag tag-purple">2 Active Medicines</span>
                </div>

                <div className="patient-found-actions">
                  <button id="request-consent-btn" className="btn-consent" onClick={handleRequestConsent}>
                    <span>🤝</span> Request Consent
                  </button>
                  <button className="btn-cancel-search" onClick={handleNewConsult} id="cancel-search-btn">
                    Clear
                  </button>
                </div>
              </div>

              <div className="idle-state">
                <div className="idle-icon">🔒</div>
                <div className="idle-title">Consent required to proceed</div>
                <p className="idle-sub">Click "Request Consent" above to send a consent notification to Rahul's phone. You can proceed only after they approve.</p>
              </div>
            </>
          )}

          {/* ─── CONSENT SENT ─────────────────────────────────── */}
          {step === 'consent_sent' && (
            <div className="consent-pending fade-up">
              <div className="consent-pulse">⏳</div>
              <div className="consent-pending-title">Waiting for Patient Approval</div>
              <p className="consent-pending-sub">
                A consent notification has been sent to <strong>Rahul Sharma's</strong> registered mobile number. Ask them to open their HealthOS app to approve.
              </p>

              <div className="consent-tip">
                <span>💡</span>
                Ask the patient to open <strong>healthrecord-ivory.vercel.app</strong> and tap Approve
              </div>

              <div className="consent-dots">
                <div className="consent-dot" />
                <div className="consent-dot" />
                <div className="consent-dot" />
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
                Polling for approval... (checks every 800ms)
              </p>
            </div>
          )}

          {/* ─── APPROVED — CONSULTATION FORM ─────────────────── */}
          {(step === 'approved' || step === 'submitting') && (
            <>
              {/* Approval banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 20 }} className="fade-up">
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>Consent Approved</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rahul Sharma granted access · Expires after this session</div>
                </div>
              </div>

              {/* Patient summary */}
              <div className="patient-found fade-up-1" style={{ marginBottom: 20 }}>
                <div className="patient-found-top" style={{ marginBottom: 12 }}>
                  <div className="patient-found-avatar">RS</div>
                  <div className="patient-found-info">
                    <div className="patient-found-name">Rahul Sharma</div>
                    <div className="patient-found-meta">
                      <span>🪪 12-3456-7890-1234</span>
                      <span>🩸 B+</span>
                      <span>⚥ Male, 38 yrs</span>
                    </div>
                  </div>
                </div>
                <div className="patient-found-tags">
                  <span className="tag tag-red">🚨 Penicillin — Severe Allergy</span>
                  <span className="tag tag-amber">Diabetes Type 2 since 2018</span>
                  <span className="tag tag-amber">Hypertension since 2020</span>
                  <span className="tag tag-blue">On Metformin + Telmisartan</span>
                </div>
              </div>

              {/* Consultation form */}
              <div className="consult-container fade-up-2">
                <div className="consult-header">
                  <div className="consult-header-icon">🩺</div>
                  <div>
                    <div className="consult-header-title">New Consultation</div>
                    <div className="consult-header-sub">{doctorName} · Apollo Clinic, Andheri · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>

                <div className="consult-body">
                  {/* Chief Complaint */}
                  <div>
                    <div className="consult-section-label">Chief Complaint *</div>
                    <textarea
                      id="chief-complaint"
                      className="consult-textarea"
                      style={{ minHeight: 70 }}
                      placeholder="e.g. Patient presents with 3-day history of fever and sore throat…"
                      value={chiefComplaint}
                      onChange={e => setChiefComplaint(e.target.value)}
                    />
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <div className="consult-section-label">Diagnosis * <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-muted)', fontSize: 11 }}>(include ICD-11 code if known)</span></div>
                    <input
                      id="diagnosis-input"
                      className="consult-input"
                      placeholder="e.g. Viral Upper Respiratory Tract Infection (ICD-11: CA08.0)"
                      value={diagnosis}
                      onChange={e => setDiagnosis(e.target.value)}
                    />
                  </div>

                  {/* Medicines */}
                  <div>
                    <div className="consult-section-label">Prescription</div>
                    <div className="medicine-rows">
                      {medicines.map((med, idx) => (
                        <div key={med.id} className="medicine-row">
                          <input
                            id={`med-drug-${idx}`}
                            list="drug-list"
                            placeholder="Drug name"
                            value={med.drug}
                            onChange={e => handleMedicineChange(med.id, 'drug', e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: 13, padding: '7px 10px', outline: 'none' }}
                          />
                          <datalist id="drug-list">
                            {MOCK_DRUGS.map(d => <option key={d} value={d} />)}
                          </datalist>
                          <select value={med.dose} onChange={e => handleMedicineChange(med.id, 'dose', e.target.value)}>
                            {['100mg','250mg','400mg','500mg','650mg','1g','5mg','10mg','20mg','40mg','80mg'].map(d => <option key={d}>{d}</option>)}
                          </select>
                          <select value={med.freq} onChange={e => handleMedicineChange(med.id, 'freq', e.target.value)}>
                            {['OD','BD','TDS','QID','SOS','At bedtime'].map(f => <option key={f}>{f}</option>)}
                          </select>
                          <select value={med.duration} onChange={e => handleMedicineChange(med.id, 'duration', e.target.value)}>
                            {['3 days','5 days','7 days','10 days','14 days','1 month','3 months','Ongoing'].map(d => <option key={d}>{d}</option>)}
                          </select>
                          <select value={med.instructions} onChange={e => handleMedicineChange(med.id, 'instructions', e.target.value)}>
                            {['After meals','Before meals','With meals','At bedtime','Empty stomach','With water'].map(i => <option key={i}>{i}</option>)}
                          </select>
                          <button type="button" className="btn-remove-med" onClick={() => handleRemoveMedicine(med.id)}>×</button>
                        </div>
                      ))}
                      <button type="button" className="btn-add-med" id="add-medicine-btn" onClick={handleAddMedicine}>
                        <span>+</span> Add Medicine
                      </button>
                    </div>
                  </div>

                  {/* Lab Tests */}
                  <div>
                    <div className="consult-section-label">Lab Orders <span style={{ textTransform: 'none', fontWeight: 400, fontSize: 11 }}>({labTests.length} selected)</span></div>
                    <div className="lab-grid">
                      {LAB_TESTS.map(test => (
                        <div key={test} id={`lab-${test.split(' ')[0]}`}
                          className={`lab-check ${labTests.includes(test) ? 'checked' : ''}`}
                          onClick={() => handleToggleLab(test)}>
                          <div className="lab-check-box">{labTests.includes(test) ? '✓' : ''}</div>
                          {test}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advice */}
                  <div>
                    <div className="consult-section-label">Advice & Instructions</div>
                    <textarea
                      id="advice-input"
                      className="consult-textarea"
                      placeholder="Rest, fluids, dietary advice, activity restrictions…"
                      value={advice}
                      onChange={e => setAdvice(e.target.value)}
                    />
                  </div>

                  {/* Follow-up */}
                  <div>
                    <div className="consult-section-label">Follow-up</div>
                    <div className="followup-row">
                      {FOLLOW_UPS.map(f => (
                        <div key={f} id={`followup-${f.replace(' ','-')}`}
                          className={`followup-opt ${followUp === f ? 'selected' : ''}`}
                          onClick={() => setFollowUp(f)}>
                          {followUp === f ? '✓ ' : ''}{f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="consult-footer">
                  <div className="consult-footer-note">
                    <span>🔒</span>
                    Record will be signed, saved, and queued for ABDM FHIR sync
                  </div>
                  <button
                    id="submit-consultation-btn"
                    className="btn-submit-consult"
                    onClick={handleSubmitConsult}
                    disabled={!chiefComplaint.trim() || !diagnosis.trim() || submitting}
                  >
                    {submitting
                      ? <><span className="spinner" style={{ borderTopColor: '#050d1a', borderColor: 'rgba(5,13,26,0.3)' }} /> Saving…</>
                      : <><span>✅</span> Submit Consultation</>
                    }
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ─── SUBMITTED ────────────────────────────────────── */}
          {step === 'submitted' && (
            <div className="success-card fade-up">
              <div className="success-icon">✅</div>
              <div className="success-title">Consultation Submitted</div>
              <p className="success-sub">
                The consultation has been saved and the record is now visible on Rahul Sharma&apos;s patient timeline. FHIR sync queued for ABDM.
              </p>
              <div className="success-record-id">Record ID: {recordId}</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
                <span className="tag tag-green">✓ Saved to DB</span>
                <span className="tag tag-blue">✓ Patient Notified</span>
                <span className="tag tag-amber">⏳ FHIR Sync Queued</span>
              </div>
              <div className="success-actions" style={{ marginTop: 28 }}>
                <button id="new-consultation-btn" className="btn-submit-consult" onClick={handleNewConsult}>
                  <span>🩺</span> New Consultation
                </button>
                <button className="btn-outline" style={{ width: 'auto', padding: '14px 24px', marginTop: 0 }}
                  onClick={() => { window.open('/', '_blank') }}>
                  View Patient App →
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
