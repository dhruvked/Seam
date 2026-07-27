'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const LS_KEY = 'healthos_state'

// Lightweight markdown renderer — handles ###, **bold**, * bullets
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let bulletBuffer: string[] = []

  const flushBullets = (key: string) => {
    if (bulletBuffer.length > 0) {
      nodes.push(
        <ul key={key} className="pd-ai-list">
          {bulletBuffer.map((b, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
          ))}
        </ul>
      )
      bulletBuffer = []
    }
  }

  const inlineFormat = (s: string) =>
    s
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushBullets(`flush-${i}`)
      return
    }
    // Heading ###
    if (trimmed.startsWith('###')) {
      flushBullets(`flush-h-${i}`)
      const txt = inlineFormat(trimmed.replace(/^###\s*/, ''))
      nodes.push(<div key={i} className="pd-ai-heading" dangerouslySetInnerHTML={{ __html: txt }} />)
      return
    }
    // Heading ##
    if (trimmed.startsWith('##')) {
      flushBullets(`flush-h2-${i}`)
      const txt = inlineFormat(trimmed.replace(/^##\s*/, ''))
      nodes.push(<div key={i} className="pd-ai-heading" dangerouslySetInnerHTML={{ __html: txt }} />)
      return
    }
    // Bullet * or -
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('    * ') || trimmed.startsWith('    - ')) {
      bulletBuffer.push(inlineFormat(trimmed.replace(/^[-*]\s*/, '').replace(/^\s+[-*]\s*/, '')))
      return
    }
    // Normal paragraph
    flushBullets(`flush-p-${i}`)
    nodes.push(<p key={i} className="pd-ai-para" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }} />)
  })
  flushBullets('flush-end')
  return nodes
}


function getLS() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

function setLS(update: object) {
  const current = getLS()
  localStorage.setItem(LS_KEY, JSON.stringify({ ...current, ...update }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HealthRecord = any

const MOCK_RECORDS: HealthRecord[] = [
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
    title: 'Type 2 Diabetes Quarterly Review',
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
    title: 'HbA1c + Lipid Profile + Kidney Function Test',
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

const ALLERGIES = [
  { name: 'Penicillin', type: 'Drug', severity: 'Severe', since: '2019' },
  { name: 'Pollen', type: 'Environmental', severity: 'Mild', since: '2015' },
  { name: 'Sulfonamides', type: 'Drug', severity: 'Moderate', since: '2021' },
]

const MEDICATIONS = [
  { name: 'Metformin 500mg', freq: 'Twice daily after meals', condition: 'Type 2 Diabetes' },
  { name: 'Telmisartan 40mg', freq: 'Once daily, morning', condition: 'Hypertension' },
]

const TYPE_COLORS: { [key: string]: string } = {
  'Consultation': 'type-badge-teal',
  'Prescription': 'type-badge-blue',
  'Lab Report': 'type-badge-purple',
  'Imaging': 'type-badge-amber',
}

const SEVERITY_COLORS: { [key: string]: string } = {
  'Severe': 'severity-severe',
  'Moderate': 'severity-moderate',
  'Mild': 'severity-mild',
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'records', label: 'All Records' },
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'labs', label: 'Lab Reports' },
  { id: 'imaging', label: 'Imaging' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'qr', label: 'ABHA QR' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [active, setActive] = useState('overview')
  const [patientName, setPatientName] = useState('Rahul Sharma')
  const [abhaId, setAbhaId] = useState('12-3456-7890-1234')
  const [consent, setConsent] = useState<{ status: string; doctorName: string; facility: string } | null>(null)
  const [liveRecords, setLiveRecords] = useState<HealthRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null)
  const [aiExplanation, setAiExplanation] = useState<string>('')
  const [aiLoading, setAiLoading] = useState<boolean>(false)
  const [aiError, setAiError] = useState<string>('')
  const [isSimulated, setIsSimulated] = useState<boolean>(false)

  const explainWithAI = async (record: HealthRecord) => {
    if (!record) return
    setAiLoading(true)
    setAiExplanation('')
    setAiError('')
    setIsSimulated(false)
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: record.title,
          details: record.detail + (record.advice ? ` | Advice: ${record.advice}` : ''),
          medicines: record.medicines || [],
          type: record.type
        })
      })
      if (!response.ok) throw new Error('Failed to fetch explanation from the server')
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setAiExplanation(data.text)
      setIsSimulated(!!data.isSimulated)
    } catch (err: unknown) {
      console.error(err)
      setAiError(err instanceof Error ? err.message : 'Failed to connect to the AI model.')
    } finally {
      setAiLoading(false)
    }
  }

  const refreshState = useCallback(() => {
    const ls = getLS()
    if (ls.consent?.status === 'pending') {
      setConsent(ls.consent)
    } else {
      setConsent(null)
    }
    if (ls.consultations?.length) {
      setLiveRecords(ls.consultations)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const verified = sessionStorage.getItem('auth_verified')
      if (!verified) { router.push('/login'); return }
      const name = sessionStorage.getItem('patient_name')
      const abha = sessionStorage.getItem('patient_abha')
      if (name) setPatientName(name)
      if (abha) setAbhaId(abha)
      refreshState()
      const interval = setInterval(refreshState, 900)
      const onStorage = () => refreshState()
      window.addEventListener('storage', onStorage)
      return () => { clearInterval(interval); window.removeEventListener('storage', onStorage) }
    }
  }, [router, refreshState])

  const handleApproveConsent = () => {
    setLS({ consent: { ...consent, status: 'approved' } })
    setConsent(null)
  }

  const handleDeclineConsent = () => {
    setLS({ consent: { ...consent, status: 'declined' } })
    setConsent(null)
  }

  const handleSignOut = () => {
    sessionStorage.clear()
    router.push('/login')
  }

  const initials = patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
  const allRecords: HealthRecord[] = [...MOCK_RECORDS, ...liveRecords]
  const totalRecords = allRecords.length

  const visibleRecords: HealthRecord[] = allRecords.filter((r: HealthRecord) => {
    if (active === 'overview' || active === 'records') return true
    if (active === 'prescriptions') return r.type === 'Prescription'
    if (active === 'labs') return r.type === 'Lab Report'
    if (active === 'imaging') return r.type === 'Imaging'
    return false
  })

  const recentRecords = visibleRecords.slice(0, active === 'overview' ? 4 : visibleRecords.length)

  return (
    <div className="pd-root">

      {/* Top Navbar */}
      <nav className="pd-topnav">
        <div className="pd-topnav-inner">
          <div className="pd-topnav-logo">
            <div className="v2-logo-icon" style={{ width: 30, height: 30, fontSize: 14 }}>S</div>
            <span className="v2-logo-text" style={{ fontSize: 18 }}>Seam</span>
          </div>
          <button className="pd-signout-btn" onClick={handleSignOut}>Sign Out</button>
        </div>
      </nav>


      <div className="pd-layout">

        {/* Left Sidebar */}
        <aside className="pd-sidebar">
          {/* Patient Identity Card */}
          <div className="pd-identity-card">
            <div className="pd-avatar">{initials}</div>
            <div className="pd-identity-info">
              <div className="pd-patient-name">{patientName}</div>
              <div className="pd-patient-meta">DOB: 14 Mar 1988</div>
              <div className="pd-patient-meta">Blood: B+ &nbsp;·&nbsp; Male</div>
              <div className="pd-patient-meta">Mumbai, Maharashtra</div>
            </div>
          </div>

          {/* Stats */}
          <div className="pd-stats-row">
            <div className="pd-stat">
              <span className="pd-stat-num">{totalRecords}</span>
              <span className="pd-stat-label">Records</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-num">3</span>
              <span className="pd-stat-label">Facilities</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-num">2</span>
              <span className="pd-stat-label">Active Rx</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="pd-sidenav">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`pd-sidenav-item ${active === item.id ? 'active' : ''}`}
                onClick={() => setActive(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="pd-main">

          {/* Consent Banner */}
          {consent && consent.status === 'pending' && (
            <div className="pd-consent-banner">
              <div className="pd-consent-left">
                <div className="pd-consent-dot" />
                <div>
                  <div className="pd-consent-title">Doctor Access Request</div>
                  <div className="pd-consent-sub">
                    <strong>{consent.doctorName}</strong> from {consent.facility} is requesting access to your health records for this consultation.
                  </div>
                </div>
              </div>
              <div className="pd-consent-actions">
                <button id="approve-consent-btn" className="pd-btn-approve" onClick={handleApproveConsent}>
                  Approve Access
                </button>
                <button id="decline-consent-btn" className="pd-btn-decline" onClick={handleDeclineConsent}>
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* New Record Alert */}
          {liveRecords.length > 0 && (
            <div className="pd-new-record-alert" onClick={() => setActive('records')}>
              <div className="pd-new-record-dot" />
              <span>{liveRecords.length} new record{liveRecords.length > 1 ? 's' : ''} added by your doctor — click to view</span>
            </div>
          )}

          {/* Overview Summary Cards */}
          {active === 'overview' && (
            <div className="pd-summary-grid">
              <div className="pd-sum-card" onClick={() => setActive('records')}>
                <div className="pd-sum-num">{totalRecords}</div>
                <div className="pd-sum-label">Health Records</div>
                <div className="pd-sum-bar" style={{ background: '#2563eb' }} />
              </div>
              <div className="pd-sum-card" onClick={() => setActive('prescriptions')}>
                <div className="pd-sum-num">2</div>
                <div className="pd-sum-label">Active Medicines</div>
                <div className="pd-sum-bar" style={{ background: '#0d9488' }} />
              </div>
              <div className="pd-sum-card" onClick={() => setActive('allergies')}>
                <div className="pd-sum-num">3</div>
                <div className="pd-sum-label">Known Allergies</div>
                <div className="pd-sum-bar" style={{ background: '#dc2626' }} />
              </div>
              <div className="pd-sum-card" onClick={() => setActive('labs')}>
                <div className="pd-sum-num">2</div>
                <div className="pd-sum-label">Lab Reports</div>
                <div className="pd-sum-bar" style={{ background: '#7c3aed' }} />
              </div>
            </div>
          )}

          {/* QR Code View */}
          {active === 'qr' && (
            <div className="pd-section">
              <div className="pd-section-header">
                <h2 className="pd-section-title">Your ABHA QR Code</h2>
              </div>
              <div className="pd-qr-card">
                <div className="pd-qr-placeholder">
                  <div className="pd-qr-grid" />
                  <span>QR Code</span>
                </div>
                <div className="pd-qr-info">
                  <h3>Share your ABHA QR at any clinic</h3>
                  <p>Show this QR code at any ABDM-registered healthcare facility. The doctor scans it to send a consent request directly to your phone.</p>
                  <div className="pd-abha-id-box">{abhaId}</div>
                  <p className="pd-qr-note">ABDM-linked · Consent-gated · Revocable anytime</p>
                </div>
              </div>
            </div>
          )}

          {/* Allergies View */}
          {active === 'allergies' && (
            <div className="pd-section">
              <div className="pd-section-header">
                <h2 className="pd-section-title">Allergies & Conditions</h2>
                <span className="pd-count-badge">{ALLERGIES.length} entries</span>
              </div>
              <div className="pd-allergy-list">
                {ALLERGIES.map((a, i) => (
                  <div key={i} className="pd-allergy-card">
                    <div className="pd-allergy-left">
                      <div className="pd-allergy-name">{a.name}</div>
                      <div className="pd-allergy-type">{a.type} Allergen · Since {a.since}</div>
                    </div>
                    <span className={`pd-severity-badge ${SEVERITY_COLORS[a.severity] || ''}`}>
                      {a.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptions / Medications View */}
          {active === 'prescriptions' && (
            <div className="pd-section">
              <div className="pd-section-header">
                <h2 className="pd-section-title">Active Medications</h2>
                <span className="pd-count-badge">{MEDICATIONS.length} active</span>
              </div>
              <div className="pd-med-list">
                {MEDICATIONS.map((m, i) => (
                  <div key={i} className="pd-med-card">
                    <div className="pd-med-name">{m.name}</div>
                    <div className="pd-med-freq">{m.freq}</div>
                    <div className="pd-med-condition">For: {m.condition}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health Records Feed */}
          {(active === 'overview' || active === 'records' || active === 'labs' || active === 'imaging') && (
            <div className="pd-section">
              <div className="pd-section-header">
                <h2 className="pd-section-title">
                  {active === 'overview' ? 'Recent Health Records' : 'All Records'}
                </h2>
                <span className="pd-count-badge">{recentRecords.length} records</span>
              </div>

              <div className="pd-records-list">
                {recentRecords.map((r: HealthRecord) => (
                  <div
                    key={r.id}
                    className="pd-record-card"
                    onClick={() => { setSelectedRecord(r); setAiExplanation(''); setAiError('') }}
                  >
                    <div className="pd-record-top">
                      <span className={`pd-type-badge ${TYPE_COLORS[r.type] || ''}`}>{r.type}</span>
                      <span className="pd-record-date">{r.date}</span>
                    </div>
                    <div className="pd-record-title">{r.title}</div>
                    <div className="pd-record-meta">{r.doctor} &nbsp;·&nbsp; {r.facility}</div>
                    <div className="pd-record-detail">{r.detail}</div>
                    <div className="pd-record-tags">
                      {r.tags?.map((t: string, i: number) => (
                        <span key={i} className="pd-tag">{t}</span>
                      ))}
                    </div>
                    <button
                      className="pd-ai-btn"
                      onClick={e => { e.stopPropagation(); setSelectedRecord(r); setAiExplanation(''); setAiError(''); setTimeout(() => explainWithAI(r), 100) }}
                    >
                      Explain with AI
                    </button>
                  </div>
                ))}
              </div>

              {active === 'overview' && allRecords.length > 4 && (
                <button className="pd-view-all-btn" onClick={() => setActive('records')}>
                  View All {totalRecords} Records
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="pd-modal-overlay" onClick={() => { setSelectedRecord(null); setAiExplanation(''); setAiError('') }}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-modal-header">
              <div>
                <span className={`pd-type-badge ${TYPE_COLORS[selectedRecord.type] || ''}`}>{selectedRecord.type}</span>
                <h2 className="pd-modal-title">{selectedRecord.title}</h2>
                <div className="pd-modal-meta">{selectedRecord.doctor} &nbsp;·&nbsp; {selectedRecord.facility} &nbsp;·&nbsp; {selectedRecord.date}</div>
              </div>
              <button
                className="pd-modal-close"
                onClick={() => { setSelectedRecord(null); setAiExplanation(''); setAiError('') }}
              >
                Close
              </button>
            </div>

            <div className="pd-modal-body">
              <p className="pd-modal-detail">{selectedRecord.detail}</p>

              <div className="pd-record-tags" style={{ marginBottom: 24 }}>
                {selectedRecord.tags?.map((t: string, i: number) => (
                  <span key={i} className="pd-tag">{t}</span>
                ))}
              </div>

              {/* AI Explain Section */}
              <div className="pd-ai-section">
                <div className="pd-ai-section-header">
                  <div>
                    <div className="pd-ai-section-title">AI Plain Language Explanation</div>
                    <div className="pd-ai-section-sub">Gemini translates this medical record into simple, clear language for you.</div>
                  </div>
                  <button
                    className="pd-ai-trigger-btn"
                    onClick={() => explainWithAI(selectedRecord)}
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Generating...' : aiExplanation ? 'Regenerate' : 'Explain with AI'}
                  </button>
                </div>

                {aiLoading && (
                  <div className="pd-ai-loading">
                    <div className="pd-ai-spinner" />
                    <span>Gemini is analysing your record...</span>
                  </div>
                )}

                {aiError && (
                  <div className="pd-ai-error">{aiError}</div>
                )}

                {aiExplanation && !aiLoading && (
                  <div className="pd-ai-result">
                    {isSimulated && <div className="pd-ai-simulated-note">Simulated response — configure GEMINI_API_KEY for live explanations</div>}
                    <div className="pd-ai-body">{renderMarkdown(aiExplanation)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
