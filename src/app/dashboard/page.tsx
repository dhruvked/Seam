'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── LocalStorage Shared State Keys ─────────────────────────────
const LS_KEY = 'healthos_state'

function getLS() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

function setLS(update: object) {
  const current = getLS()
  localStorage.setItem(LS_KEY, JSON.stringify({ ...current, ...update }))
}

// ─── Types ──────────────────────────────────────────────────────
export interface Medicine {
  drug: string
  dose: string
  freq: string
  duration: string
  instructions: string
}

export interface MedicalRecord {
  id: number | string
  type: 'Consultation' | 'Prescription' | 'Lab Report' | 'Imaging'
  typeClass?: string
  icon: string
  title: string
  doctor: string
  facility: string
  date: string
  detail: string
  medicines?: Medicine[]
  labTests?: string[]
  advice?: string
  followUp?: string
  tags?: { label: string; cls: string }[]
  badge?: string
}

// ─── Initial Mock Records ───────────────────────────────────────
const INITIAL_RECORDS: MedicalRecord[] = [
  {
    id: 1,
    type: 'Consultation',
    icon: '🩺',
    title: 'Viral Fever & Upper Respiratory Infection',
    doctor: 'Dr. Priya Mehta',
    facility: 'Apollo Clinic, Andheri',
    date: '28 Jun 2026',
    detail: 'Presented with 3-day fever (102°F), sore throat, and body ache. Likely viral etiology. Symptomatic management advised.',
    medicines: [
      { drug: 'Paracetamol', dose: '650mg', freq: 'TDS', duration: '5 days', instructions: 'After meals' },
      { drug: 'Cetirizine', dose: '10mg', freq: 'OD', duration: '5 days', instructions: 'At night' },
      { drug: 'Azithromycin', dose: '500mg', freq: 'OD', duration: '3 days', instructions: 'After lunch' }
    ],
    labTests: ['Complete Blood Count (CBC)', 'CRP (C-Reactive Protein)'],
    advice: 'Drink plenty of fluids. Rest for 3 days. Return if fever persists beyond 5 days.',
    followUp: '5 days',
    tags: [
      { label: 'ICD-11: J06.9', cls: 'tag-teal' },
      { label: 'OP Visit', cls: 'tag-blue' },
      { label: 'Verified ABDM', cls: 'tag-green' }
    ]
  },
  {
    id: 2,
    type: 'Prescription',
    icon: '💊',
    title: 'Rx — Paracetamol, Cetirizine, Azithromycin',
    doctor: 'Dr. Priya Mehta',
    facility: 'Apollo Clinic, Andheri',
    date: '28 Jun 2026',
    detail: 'Paracetamol 650mg TDS × 5 days | Cetirizine 10mg OD × 5 days | Azithromycin 500mg OD × 3 days. Take after meals.',
    tags: [
      { label: '3 medications', cls: 'tag-blue' },
      { label: '5-day course', cls: 'tag-teal' }
    ]
  },
  {
    id: 3,
    type: 'Lab Report',
    icon: '🧪',
    title: 'Complete Blood Count (CBC) + CRP',
    doctor: 'SRL Diagnostics',
    facility: 'SRL Lab, Malad West',
    date: '27 Jun 2026',
    detail: 'WBC: 11,200/µL (slightly elevated) | Hb: 13.8 g/dL (normal) | Platelets: 2.1L (normal) | CRP: 18 mg/L (mildly elevated).',
    tags: [
      { label: 'LOINC Coded', cls: 'tag-purple' },
      { label: 'Mildly Abnormal', cls: 'tag-amber' }
    ]
  },
  {
    id: 4,
    type: 'Consultation',
    icon: '🩺',
    title: 'Type 2 Diabetes — Quarterly Review',
    doctor: 'Dr. Suresh Rao',
    facility: 'Kokilaben Hospital OPD',
    date: '10 Apr 2026',
    detail: 'HbA1c: 7.1% (controlled). Weight stable at 74kg. No new complications. Continue current medication.',
    tags: [
      { label: 'ICD-11: 5A11', cls: 'tag-teal' },
      { label: 'Chronic — Ongoing', cls: 'tag-amber' }
    ]
  }
]

// ─── Component ───────────────────────────────────────────────────
export default function PatientDashboard() {
  const router = useRouter()

  // State: Patient Info
  const [patientName, setPatientName] = useState('Rahul Sharma')
  const [abhaId, setAbhaId] = useState('12-3456-7890-1234')

  // State: Records & Filtering
  const [records, setRecords] = useState<MedicalRecord[]>(INITIAL_RECORDS)
  const [filterType, setFilterType] = useState<string>('all')

  // State: Consent Request Alert
  const [consentRequest, setConsentRequest] = useState<any>(null)

  // State: Selected Record Modal & AI Explainer
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [aiExplanation, setAiExplanation] = useState<string>('')
  const [aiLoading, setAiLoading] = useState<boolean>(false)
  const [aiError, setAiError] = useState<string>('')
  const [isSimulated, setIsSimulated] = useState<boolean>(false)

  // 1. Initial Load & Auth Check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('patient_auth')
      if (!auth) {
        router.push('/login')
        return
      }
      const name = sessionStorage.getItem('patient_name')
      const abha = sessionStorage.getItem('patient_abha')
      if (name) setPatientName(name)
      if (abha) setAbhaId(abha)
    }
  }, [router])

  // 2. Poll LocalStorage for Consent Requests & Doctor Consultations
  const pollState = useCallback(() => {
    const ls = getLS()
    if (ls.consent && ls.consent.status === 'pending') {
      setConsentRequest(ls.consent)
    } else {
      setConsentRequest(null)
    }

    if (ls.records && Array.isArray(ls.records)) {
      setRecords(prev => {
        const existingIds = new Set(prev.map(r => String(r.id)))
        const fresh = ls.records.filter((r: any) => !existingIds.has(String(r.id)))
        if (fresh.length > 0) return [...fresh, ...prev]
        return prev
      })
    }
  }, [])

  useEffect(() => {
    pollState()
    const interval = setInterval(pollState, 1500)
    return () => clearInterval(interval)
  }, [pollState])

  // 3. Consent Actions
  const handleApproveConsent = () => {
    if (!consentRequest) return
    setLS({ consent: { ...consentRequest, status: 'approved' } })
    setConsentRequest(null)
  }

  const handleDeclineConsent = () => {
    if (!consentRequest) return
    setLS({ consent: { ...consentRequest, status: 'declined' } })
    setConsentRequest(null)
  }

  // 4. AI Prescription Explainer Request
  const explainWithAI = async (record: MedicalRecord) => {
    setAiLoading(true)
    setAiError('')
    setAiExplanation('')

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate explanation')
      setAiExplanation(data.explanation)
      setIsSimulated(data.isSimulated || false)
    } catch (err: any) {
      setAiError(err.message || 'Something went wrong')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSignOut = () => {
    sessionStorage.clear()
    router.push('/')
  }

  // Filtered records
  const filteredRecords = filterType === 'all'
    ? records
    : records.filter(r => r.type.toLowerCase().includes(filterType.toLowerCase()))

  return (
    <div className="layout-root">
      
      {/* ── SECTION 1: HEADER / NAVBAR ── */}
      <header className="wireframe-header">
        <div className="header-brand">
          <span className="brand-logo">🩺</span>
          <div>
            <h1 className="brand-name">Seam <span className="brand-badge">PHR</span></h1>
            <p className="brand-sub">ABDM Health Locker</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="patient-chip">
            <span className="user-icon">👤</span>
            <div>
              <strong className="user-name">{patientName}</strong>
              <div className="user-id">ABHA: {abhaId}</div>
            </div>
          </div>
          <Link href="/doctor/dashboard" className="btn-secondary">
            Doctor Portal →
          </Link>
          <button className="btn-ghost" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── SECTION 2: MAIN CONTAINER ── */}
      <main className="wireframe-main">

        {/* Consent Banner Alert */}
        {consentRequest && (
          <div className="consent-alert-box" id="consent-request-banner">
            <div className="alert-content">
              <span className="alert-icon">🔔</span>
              <div>
                <h4 className="alert-title">Digital Consent Request</h4>
                <p className="alert-desc">
                  <strong>{consentRequest.doctorName || 'Dr. Priya Mehta'}</strong> ({consentRequest.facility || 'Apollo Clinic'}) requests access to your health records for this consultation.
                </p>
              </div>
            </div>
            <div className="alert-actions">
              <button className="btn-approve" onClick={handleApproveConsent}>
                ✓ Approve
              </button>
              <button className="btn-decline" onClick={handleDeclineConsent}>
                ✕ Decline
              </button>
            </div>
          </div>
        )}

        {/* Patient Profile Card */}
        <section className="profile-wireframe-card">
          <div className="profile-row">
            <div className="profile-avatar">
              {patientName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="profile-details">
              <h2>{patientName}</h2>
              <p className="profile-meta">
                <span>DOB: 14 Mar 1988</span> &nbsp;•&nbsp;
                <span>Blood: B+</span> &nbsp;•&nbsp;
                <span>Gender: Male</span> &nbsp;•&nbsp;
                <span>ABHA ID: {abhaId}</span>
              </p>
            </div>
            <div className="qr-badge-box">
              <span className="qr-icon">📱</span>
              <span>ABHA QR Linked</span>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-pill">
              <span className="stat-num">{records.length}</span>
              <span className="stat-lbl">Records</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">3</span>
              <span className="stat-lbl">Facilities</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">2</span>
              <span className="stat-lbl">Active Rx</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">✓</span>
              <span className="stat-lbl">ABDM Verified</span>
            </div>
          </div>
        </section>

        {/* Filter Navigation */}
        <div className="filter-tabs">
          {['all', 'consultation', 'prescription', 'lab'].map((t) => (
            <button
              key={t}
              className={`filter-btn ${filterType === t ? 'active' : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Records Feed */}
        <section className="records-feed">
          <h3 className="section-heading">Health Records Feed ({filteredRecords.length})</h3>

          <div className="records-grid">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="record-card"
                onClick={() => { setSelectedRecord(rec); setAiExplanation(''); setAiError(''); }}
              >
                <div className="record-card-header">
                  <span className="rec-icon">{rec.icon}</span>
                  <div>
                    <span className="rec-type">{rec.type}</span>
                    <h4 className="rec-title">{rec.title}</h4>
                  </div>
                  {rec.badge && <span className="rec-badge">{rec.badge}</span>}
                </div>

                <p className="rec-meta">
                  {rec.doctor} &nbsp;•&nbsp; {rec.facility} &nbsp;•&nbsp; 📅 {rec.date}
                </p>

                <p className="rec-detail-preview">
                  {rec.detail}
                </p>

                {rec.tags && rec.tags.length > 0 && (
                  <div className="rec-tags-row">
                    {rec.tags.map((tg, i) => (
                      <span key={i} className={`tag-chip ${tg.cls}`}>{tg.label}</span>
                    ))}
                  </div>
                )}
                
                <button className="btn-view-details">
                  View Full Details & AI Summary →
                </button>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── SECTION 3: RECORD DETAIL & AI EXPLAINER MODAL ── */}
      {selectedRecord && (
        <div className="modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div className="modal-head">
              <div>
                <span className="modal-tag">{selectedRecord.type}</span>
                <h2>{selectedRecord.title}</h2>
                <p>{selectedRecord.doctor} — {selectedRecord.facility}</p>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>

            <div className="modal-body-content">
              {/* Notes */}
              <div className="modal-block">
                <h4>Clinical Notes</h4>
                <p className="clinical-text">{selectedRecord.detail}</p>
              </div>

              {/* Medicines */}
              {selectedRecord.medicines && selectedRecord.medicines.length > 0 && (
                <div className="modal-block">
                  <h4>Prescribed Medications</h4>
                  <div className="med-list">
                    {selectedRecord.medicines.map((m, i) => (
                      <div key={i} className="med-item">
                        <strong>💊 {m.drug} {m.dose}</strong>
                        <span>{m.freq} • {m.duration} • {m.instructions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Orders */}
              {selectedRecord.labTests && selectedRecord.labTests.length > 0 && (
                <div className="modal-block">
                  <h4>Ordered Investigations / Labs</h4>
                  <div className="lab-chips">
                    {selectedRecord.labTests.map((t, i) => (
                      <span key={i} className="lab-chip">🧪 {t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Advice */}
              {selectedRecord.advice && (
                <div className="modal-block">
                  <h4>Advice & Instructions</h4>
                  <p>{selectedRecord.advice}</p>
                </div>
              )}

              {/* AI Copilot Panel */}
              {(aiLoading || aiExplanation || aiError) && (
                <div className="ai-explainer-card">
                  <div className="ai-head">
                    <span>✨ HealthOS AI Copilot</span>
                    {isSimulated && <span className="sim-badge">Demo Mode</span>}
                  </div>

                  {aiLoading && <div className="ai-loading">Translating clinical notes into plain English...</div>}
                  {aiError && <div className="ai-err">⚠️ {aiError}</div>}
                  {aiExplanation && (
                    <div className="ai-text">
                      {aiExplanation.split('\n').map((l, i) => (
                        <p key={i}>{l}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-foot">
              <button className="btn-secondary" onClick={() => window.print()}>
                🖨 Print Record
              </button>
              <button
                className="btn-primary"
                onClick={() => explainWithAI(selectedRecord)}
                disabled={aiLoading}
              >
                ✨ {aiLoading ? 'Explaining...' : 'Explain with AI'}
              </button>
              <button className="btn-ghost" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}