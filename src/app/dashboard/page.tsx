'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import '../doctor-portal.css'

const LS_KEY = 'healthos_state'

function getLS() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

function setLS(update: object) {
  const current = getLS()
  localStorage.setItem(LS_KEY, JSON.stringify({ ...current, ...update }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Record = any

const MOCK_RECORDS: Record[] = [
  {
    id: 1,
    type: 'Consultation',
    typeClass: 'icon-teal',
    icon: 'ðŸ©º',
    title: 'Viral Fever & Upper Respiratory Infection',
    doctor: 'Dr. Priya Mehta',
    facility: 'Apollo Clinic, Andheri',
    date: '28 Jun 2026',
    detail: 'Presented with 3-day fever (102Â°F), sore throat, and body ache. Likely viral etiology. Symptomatic management advised.',
    tags: [
      { label: 'ICD-11: J06.9', cls: 'tag-teal' },
      { label: 'OP Visit', cls: 'tag-blue' },
      { label: 'FHIR Synced', cls: 'tag-green' },
    ],
  },
  {
    id: 2,
    type: 'Prescription',
    typeClass: 'icon-blue',
    icon: 'ðŸ’Š',
    title: 'Rx â€” Paracetamol, Cetirizine, Azithromycin',
    doctor: 'Dr. Priya Mehta',
    facility: 'Apollo Clinic, Andheri',
    date: '28 Jun 2026',
    detail: 'Paracetamol 650mg TDS Ã— 5 days | Cetirizine 10mg OD Ã— 5 days | Azithromycin 500mg OD Ã— 3 days. Take after meals.',
    tags: [
      { label: '3 medications', cls: 'tag-blue' },
      { label: '5-day course', cls: 'tag-teal' },
    ],
  },
  {
    id: 3,
    type: 'Lab Report',
    typeClass: 'icon-purple',
    icon: 'ðŸ§ª',
    title: 'Complete Blood Count (CBC) + CRP',
    doctor: 'SRL Diagnostics',
    facility: 'SRL Lab, Malad West',
    date: '27 Jun 2026',
    detail: 'WBC: 11,200/ÂµL (slightly elevated) | Hb: 13.8 g/dL (normal) | Platelets: 2.1L (normal) | CRP: 18 mg/L (mildly elevated).',
    tags: [
      { label: 'LOINC Coded', cls: 'tag-purple' },
      { label: 'Mildly Abnormal', cls: 'tag-amber' },
      { label: 'PDF Available', cls: 'tag-blue' },
    ],
  },
  {
    id: 4,
    type: 'Consultation',
    typeClass: 'icon-teal',
    icon: 'ðŸ©º',
    title: 'Type 2 Diabetes â€” Quarterly Review',
    doctor: 'Dr. Suresh Rao',
    facility: 'Kokilaben Hospital OPD',
    date: '10 Apr 2026',
    detail: 'HbA1c: 7.1% (controlled). Weight stable at 74kg. No new complications. Continue current medication. Lifestyle advice given.',
    tags: [
      { label: 'ICD-11: 5A11', cls: 'tag-teal' },
      { label: 'Chronic â€” Ongoing', cls: 'tag-amber' },
      { label: 'FHIR Synced', cls: 'tag-green' },
    ],
  },
  {
    id: 5,
    type: 'Prescription',
    typeClass: 'icon-blue',
    icon: 'ðŸ’Š',
    title: 'Rx â€” Metformin 500mg, Telmisartan 40mg',
    doctor: 'Dr. Suresh Rao',
    facility: 'Kokilaben Hospital OPD',
    date: '10 Apr 2026',
    detail: 'Metformin 500mg BD after meals (long-term) | Telmisartan 40mg OD morning (long-term). Monthly blood glucose monitoring.',
    tags: [
      { label: '2 medications', cls: 'tag-blue' },
      { label: 'Long-term', cls: 'tag-purple' },
    ],
  },
  {
    id: 6,
    type: 'Lab Report',
    typeClass: 'icon-purple',
    icon: 'ðŸ§ª',
    title: 'HbA1c + Lipid Profile + Kidney Function Test',
    doctor: 'Metropolis Healthcare',
    facility: 'Metropolis Lab, Bandra',
    date: '8 Apr 2026',
    detail: 'HbA1c: 7.1% | Total Cholesterol: 182 mg/dL | LDL: 108 mg/dL | HDL: 48 mg/dL | Creatinine: 0.9 mg/dL (all within targets).',
    tags: [
      { label: 'LOINC Coded', cls: 'tag-purple' },
      { label: 'All Normal', cls: 'tag-green' },
    ],
  },
  {
    id: 7,
    type: 'Imaging',
    typeClass: 'icon-amber',
    icon: 'ðŸ©»',
    title: 'Chest X-Ray (PA View)',
    doctor: 'Dr. Ananya Singh',
    facility: 'Nanavati Hospital Radiology',
    date: '2 Jan 2026',
    detail: 'No active consolidation or pleural effusion. Lung fields clear bilaterally. Heart size normal. No significant abnormality detected.',
    tags: [
      { label: 'Radiology', cls: 'tag-amber' },
      { label: 'Normal', cls: 'tag-green' },
      { label: 'DICOM Stored', cls: 'tag-blue' },
    ],
  },
]

const ALLERGIES = [
  { name: 'Penicillin', type: 'Drug', severity: 'ðŸ”´ Severe', since: '2019' },
  { name: 'Pollen', type: 'Environmental', severity: 'ðŸŸ¡ Mild', since: '2015' },
  { name: 'Sulfonamides', type: 'Drug', severity: 'ðŸŸ  Moderate', since: '2021' },
]

const MEDICATIONS = [
  { name: 'Metformin 500mg', freq: 'BD after meals', for: 'Type 2 Diabetes' },
  { name: 'Telmisartan 40mg', freq: 'OD morning', for: 'Hypertension' },
]

const NAV_ITEMS = [
  { icon: 'ðŸ ', label: 'Home',    id: 'overview',      badge: null },
  { icon: 'ðŸ“‹', label: 'Records', id: 'records',       badge: '7' },
  { icon: 'ðŸ’Š', label: 'Rx',      id: 'prescriptions', badge: null },
  { icon: 'ðŸ§ª', label: 'Labs',    id: 'labs',          badge: null },
  { icon: 'ðŸ©»', label: 'Imaging', id: 'imaging',       badge: null },
  { icon: 'âš ï¸', label: 'Allergy', id: 'allergies',     badge: '3' },
  { icon: 'ðŸ’‰', label: 'Vaccines',id: 'vaccines',      badge: null },
  { icon: 'ðŸ“²', label: 'QR',      id: 'qr',            badge: null },
]

const MOBILE_NAV = [
  { icon: 'ðŸ ', label: 'Home',    id: 'overview' },
  { icon: 'ðŸ“‹', label: 'Records', id: 'records',  badge: '7' },
  { icon: 'ðŸ’Š', label: 'Rx',      id: 'prescriptions' },
  { icon: 'âš ï¸', label: 'Allergy', id: 'allergies', badge: '3' },
  { icon: 'ðŸ“²', label: 'QR',      id: 'qr' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [active, setActive] = useState('overview')
  const [patientName, setPatientName] = useState('Rahul Sharma')
  const [abhaId, setAbhaId] = useState('12-3456-7890-1234')

  // Consent state
  const [consent, setConsent] = useState<{ status: string; doctorName: string; facility: string } | null>(null)

  // Live records from doctor portal
  const [liveRecords, setLiveRecords] = useState<Record[]>([])

  // Modal and AI Explainer state
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null)
  const [aiExplanation, setAiExplanation] = useState<string>('')
  const [aiLoading, setAiLoading] = useState<boolean>(false)
  const [aiError, setAiError] = useState<string>('')
  const [isSimulated, setIsSimulated] = useState<boolean>(false)

  const explainWithAI = async (record: Record) => {
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

      if (!response.ok) {
        throw new Error('Failed to fetch explanation from the server')
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

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

      // Poll for consent requests every second
      const interval = setInterval(refreshState, 900)
      // Also listen for storage events from other tabs
      const onStorage = () => refreshState()
      window.addEventListener('storage', onStorage)
      return () => { clearInterval(interval); window.removeEventListener('storage', onStorage) }
    }
  }, [router, refreshState])

  const handleApproveConsent = () => {
    setLS({ consent: { ...getLS().consent, status: 'approved' } })
    setConsent(null)
  }

  const handleDeclineConsent = () => {
    setLS({ consent: { ...getLS().consent, status: 'declined' } })
    setConsent(null)
  }

  // Merge live records at the top
  const allRecords: Record[] = [...liveRecords, ...MOCK_RECORDS]
  const totalRecords = allRecords.length

  const initials = patientName.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-left">
          <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:17 }}>
            <div className="logo-icon" style={{ width:30, height:30, fontSize:15, background:'linear-gradient(135deg,#00d4aa,#3b82f6)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>âš•</div>
            <span>HealthOS</span>
          </div>
          <div className="dash-abha-badge">
            <span>ðŸªª</span>
            <span>{abhaId}</span>
          </div>
        </div>
        <div className="dash-header-right">
          <button className="btn-icon" id="notification-btn" title="Notifications" style={{ position: 'relative' }}>
            ðŸ””
            {consent && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: 'var(--amber)', borderRadius: '50%' }} />}
          </button>
          <div className="avatar" id="user-avatar">{initials}</div>
        </div>
      </header>

      <div className="dash-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">Navigation</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`sidebar-item ${active === item.id ? 'active' : ''}`}
              onClick={() => setActive(item.id)}
              style={{ border: 'none', background: 'none', width: '100%' }}
            >
              <span className="item-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="item-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="sidebar-section" style={{ marginTop: 16 }}>Account</div>
          <button
            id="logout-btn"
            className="sidebar-item"
            style={{ border: 'none', background: 'none', width: '100%', color: '#ef4444' }}
            onClick={() => { sessionStorage.clear(); router.push('/') }}
          >
            <span className="item-icon">ðŸšª</span>
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Main */}
        <main className="dash-main">

          {/* â”€â”€â”€ Consent Request Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {consent && consent.status === 'pending' && (
            <div className="consent-banner fade-up">
              <div className="consent-banner-icon">ðŸ””</div>
              <div className="consent-banner-info">
                <div className="consent-banner-title">Consent Request from {consent.doctorName}</div>
                <div className="consent-banner-sub">{consent.facility} is requesting access to your health records for this consultation.</div>
              </div>
              <div className="consent-banner-actions">
                <button id="approve-consent-btn" className="btn-approve" onClick={handleApproveConsent}>
                  âœ“ Approve
                </button>
                <button id="decline-consent-btn" className="btn-decline" onClick={handleDeclineConsent}>
                  âœ— Decline
                </button>
              </div>
            </div>
          )}

          {/* â”€â”€â”€ New Record Alert â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {liveRecords.length > 0 && (
            <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, cursor: 'pointer' }}
              className="fade-up"
              onClick={() => setActive('records')}>
              <span style={{ fontSize: 20 }}>âœ¨</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>
                  {liveRecords.length} new record{liveRecords.length > 1 ? 's' : ''} added by doctor
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tap to view â†’ {liveRecords[0]?.title}</div>
              </div>
            </div>
          )}

          {/* Patient Banner */}
          <div className="patient-banner fade-up">
            <div className="patient-avatar">{initials}</div>
            <div className="patient-info">
              <div className="patient-name">{patientName}</div>
              <div className="patient-meta">
                <span className="meta-item"><span className="meta-icon">ðŸ“…</span> DOB: 14 Mar 1988</span>
                <span className="meta-item"><span className="meta-icon">ðŸ©¸</span> Blood: B+</span>
                <span className="meta-item"><span className="meta-icon">âš¥</span> Male</span>
                <span className="meta-item"><span className="meta-icon">ðŸ“</span> Mumbai, MH</span>
              </div>
            </div>
            <div className="patient-stats">
              <div className="pstat">
                <div className="pstat-value">{totalRecords}</div>
                <div className="pstat-label">Records</div>
              </div>
              <div className="pstat">
                <div className="pstat-value">3</div>
                <div className="pstat-label">Facilities</div>
              </div>
              <div className="pstat">
                <div className="pstat-value">2</div>
                <div className="pstat-label">Active Rx</div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-grid fade-up-1">
            <div className="sum-card" onClick={() => setActive('records')}>
              <span className="sum-card-icon">ðŸ“‹</span>
              <div className="sum-card-value">{totalRecords}</div>
              <div className="sum-card-label">Health Records</div>
              <div className="sum-card-accent accent-teal" />
            </div>
            <div className="sum-card" onClick={() => setActive('prescriptions')}>
              <span className="sum-card-icon">ðŸ’Š</span>
              <div className="sum-card-value">2</div>
              <div className="sum-card-label">Active Medicines</div>
              <div className="sum-card-accent accent-blue" />
            </div>
            <div className="sum-card" onClick={() => setActive('allergies')}>
              <span className="sum-card-icon">âš ï¸</span>
              <div className="sum-card-value">3</div>
              <div className="sum-card-label">Known Allergies</div>
              <div className="sum-card-accent accent-amber" />
            </div>
            <div className="sum-card" onClick={() => setActive('labs')}>
              <span className="sum-card-icon">ðŸ§ª</span>
              <div className="sum-card-value">2</div>
              <div className="sum-card-label">Lab Reports</div>
              <div className="sum-card-accent accent-purple" />
            </div>
          </div>

          {/* ABHA QR */}
          {(active === 'overview' || active === 'qr') && (
            <div className="qr-section fade-up-2">
              <div className="qr-box">â¬›</div>
              <div className="qr-info">
                <div className="qr-title">Your ABHA QR Code</div>
                <p className="qr-desc">
                  Show this QR at any ABDM-registered facility. The doctor scans it
                  to instantly access your records â€” with your consent.
                </p>
                <div className="qr-id">{abhaId}</div>
              </div>
            </div>
          )}

          {/* Health Timeline */}
          <div className="section-head fade-up-2">
            <h2 className="section-title">
              {active === 'overview' ? 'ðŸ“‹ Recent Health Records' :
               active === 'records' ? 'ðŸ“‹ All Health Records' :
               active === 'prescriptions' ? 'ðŸ’Š Prescriptions' :
               active === 'labs' ? 'ðŸ§ª Lab Reports' :
               active === 'imaging' ? 'ðŸ©» Imaging' :
               active === 'allergies' ? 'âš ï¸ Allergies & Conditions' :
               active === 'vaccines' ? 'ðŸ’‰ Vaccinations' :
               active === 'qr' ? 'ðŸ“² ABHA QR' : 'ðŸ“‹ Records'}
            </h2>
            <span className="section-tag">
              {allRecords.filter(r =>
                active === 'overview' ? true :
                active === 'records' ? true :
                active === 'prescriptions' ? r.type === 'Prescription' :
                active === 'labs' ? r.type === 'Lab Report' :
                active === 'imaging' ? r.type === 'Imaging' : false
              ).length} records
            </span>
          </div>

          {/* Allergies view */}
          {active === 'allergies' && (
            <div className="two-col fade-up-3">
              <div className="info-card">
                <div className="info-card-title"><span>âš ï¸</span> Known Allergies</div>
                <div className="info-list">
                  {ALLERGIES.map((a, i) => (
                    <div key={i} className="info-list-item">
                      <div>
                        <div className="info-list-left">{a.name}</div>
                        <div className="info-list-right">{a.type} Â· Since {a.since}</div>
                      </div>
                      <span>{a.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="info-card">
                <div className="info-card-title"><span>ðŸ’Š</span> Current Medications</div>
                <div className="info-list">
                  {MEDICATIONS.map((m, i) => (
                    <div key={i} className="info-list-item">
                      <div>
                        <div className="info-list-left">{m.name}</div>
                        <div className="info-list-right">{m.freq}</div>
                      </div>
                      <span className="tag tag-teal">{m.for}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Vaccines view */}
          {active === 'vaccines' && (
            <div className="info-card fade-up-3" style={{ marginBottom: 32 }}>
              <div className="info-card-title"><span>ðŸ’‰</span> Vaccination Record</div>
              <div className="info-list">
                {[
                  { name: 'COVID-19 (Covaxin)', date: 'Mar 2021 + Jul 2021', dose: '2 doses', status: 'âœ… Complete' },
                  { name: 'Influenza', date: 'Oct 2025', dose: 'Annual', status: 'âœ… Current' },
                  { name: 'Hepatitis B', date: 'Jan 2010', dose: '3 doses', status: 'âœ… Complete' },
                  { name: 'Typhoid', date: 'Feb 2024', dose: '1 dose', status: 'â³ Due 2027' },
                ].map((v, i) => (
                  <div key={i} className="info-list-item">
                    <div>
                      <div className="info-list-left">{v.name}</div>
                      <div className="info-list-right">{v.date} Â· {v.dose}</div>
                    </div>
                    <span>{v.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline records */}
          {active !== 'allergies' && active !== 'vaccines' && active !== 'qr' && (
            <div className="timeline fade-up-3">
              {allRecords
                .filter(r =>
                  active === 'overview' ? (allRecords.indexOf(r) < 3) :
                  active === 'records' ? true :
                  active === 'prescriptions' ? r.type === 'Prescription' :
                  active === 'labs' ? r.type === 'Lab Report' :
                  active === 'imaging' ? r.type === 'Imaging' : true
                )
                .map((record, idx) => (
                  <div key={record.id || idx} className="timeline-item" id={`record-${record.id || idx}`}
                    onClick={() => { setSelectedRecord(record); setAiExplanation(''); setAiError(''); }}
                    style={{
                      cursor: 'pointer',
                      ...(liveRecords.includes(record) ? { border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.04)' } : {})
                    }}>
                    {liveRecords.includes(record) && (
                      <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700, color: 'var(--green)', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '2px 8px', borderRadius: 99 }}>NEW</div>
                    )}
                    <div className={`timeline-icon ${record.typeClass || 'icon-teal'}`}>
                      {record.icon}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-top">
                        <span className="timeline-type">{record.type}</span>
                        <span className="timeline-date">
                          <span>ðŸ“…</span> {record.date}
                        </span>
                      </div>
                      <div className="timeline-title">{record.title}</div>
                      <div className="timeline-detail">
                        <strong>{record.doctor}</strong> Â· {record.facility}
                      </div>
                      <div className="timeline-detail" style={{ marginTop: 6 }}>
                        {record.detail}
                      </div>
                      {/* Live record extras */}
                      {record.medicines?.filter((m: { drug: string }) => m.drug).length > 0 && (
                        <div className="timeline-detail" style={{ marginTop: 6, color: 'var(--text-muted)' }}>
                          ðŸ’Š {record.medicines.filter((m: { drug: string }) => m.drug).map((m: { drug: string; dose: string; freq: string }) => `${m.drug} ${m.dose} ${m.freq}`).join(' | ')}
                        </div>
                      )}
                      {record.labTests?.length > 0 && (
                        <div className="timeline-detail" style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                          ðŸ§ª Labs ordered: {record.labTests.join(', ')}
                        </div>
                      )}
                      {record.advice && (
                        <div className="timeline-detail" style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                          ðŸ“‹ {record.advice}
                        </div>
                      )}
                      <div className="timeline-tags">
                        {record.tags?.map((tag: { label: string; cls: string }, i: number) => (
                          <span key={i} className={`tag ${tag.cls}`}>{tag.label}</span>
                        ))}
                      </div>
                      <div className="timeline-status">
                        <div className="status-dot" />
                        {liveRecords.includes(record) ? 'Just Added Â· HealthOS Doctor Portal' : 'Verified Â· ABDM Linked'}
                      </div>
                    </div>
                  </div>
                ))
              }

              {/* Show more hint for overview */}
              {active === 'overview' && (
                <button
                  className="btn-outline"
                  onClick={() => setActive('records')}
                  id="view-all-records-btn"
                  style={{ marginTop: 4 }}
                >
                  View all {totalRecords} records â†’
                </button>
              )}
            </div>
          )}

          {/* Chronic conditions */}
          {active === 'overview' && (
            <div className="two-col fade-up-4">
              <div className="info-card">
                <div className="info-card-title"><span>ðŸ©º</span> Chronic Conditions</div>
                <div className="info-list">
                  <div className="info-list-item">
                    <div>
                      <div className="info-list-left">Type 2 Diabetes Mellitus</div>
                      <div className="info-list-right">ICD-11: 5A11 Â· Since 2018</div>
                    </div>
                    <span className="tag tag-amber">Managed</span>
                  </div>
                  <div className="info-list-item">
                    <div>
                      <div className="info-list-left">Essential Hypertension</div>
                      <div className="info-list-right">ICD-11: BA00 Â· Since 2020</div>
                    </div>
                    <span className="tag tag-amber">Managed</span>
                  </div>
                </div>
              </div>
              <div className="info-card">
                <div className="info-card-title"><span>ðŸ’Š</span> Current Medications</div>
                <div className="info-list">
                  {MEDICATIONS.map((m, i) => (
                    <div key={i} className="info-list-item">
                      <div>
                        <div className="info-list-left">{m.name}</div>
                        <div className="info-list-right">{m.freq}</div>
                      </div>
                      <span className="tag tag-green">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {MOBILE_NAV.map(item => (
            <button
              key={item.id}
              id={`mnav-${item.id}`}
              className={`mobile-nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => setActive(item.id)}
            >
              {item.badge && <span className="mobile-nav-badge">{item.badge}</span>}
              <span className="mnav-icon">{item.icon}</span>
              <span className="mnav-label">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="modal-backdrop" id="record-modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>

            {/* â”€â”€ Hero strip â”€â”€ */}
            <div className="modal-hero">
              <div className="modal-hero-icon-wrap">
                <span className="modal-hero-icon">{selectedRecord.icon}</span>
              </div>
              <div className="modal-hero-text">
                <p className="modal-record-type">{selectedRecord.type}</p>
                <h2 className="modal-title">{selectedRecord.title}</h2>
                <p className="modal-meta">{selectedRecord.doctor} &nbsp;Â·&nbsp; {selectedRecord.facility}</p>
              </div>
              <button className="modal-close" id="modal-close-btn" aria-label="Close" onClick={() => setSelectedRecord(null)}>Ã—</button>
            </div>

            {/* â”€â”€ Meta chips â”€â”€ */}
            <div className="modal-chips">
              <span className="modal-chip"><span>ðŸ“…</span>{selectedRecord.date}</span>
              <span className="modal-chip"><span>ðŸ†”</span>Rec #{String(selectedRecord.id).padStart(4,'0')}</span>
              <span className="modal-chip chip-green"><span>âœ“</span>ABDM Verified</span>
              {selectedRecord.followUp && <span className="modal-chip chip-teal"><span>ðŸ—“</span>F/U: {selectedRecord.followUp}</span>}
            </div>

            {/* â”€â”€ Scrollable body â”€â”€ */}
            <div className="modal-body">

              {/* Clinical notes */}
              <div className="modal-section">
                <h4 className="modal-section-label">Clinical Notes</h4>
                <p className="modal-notes">{selectedRecord.detail}</p>
              </div>

              {/* Medicines */}
              {selectedRecord.medicines?.filter((m: {drug:string}) => m.drug).length > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-label">Prescribed Medications</h4>
                  <div className="modal-med-list">
                    {selectedRecord.medicines.filter((m: {drug:string}) => m.drug).map((med: {drug:string;dose:string;freq:string;duration:string;instructions:string}, i: number) => (
                      <div key={i} className="modal-med-row">
                        <div className="modal-med-name">
                          <span className="modal-med-icon">ðŸ’Š</span>
                          <span className="modal-med-drug">{med.drug}</span>
                          <span className="modal-med-dose">{med.dose}</span>
                        </div>
                        <div className="modal-med-meta">
                          <span>{med.freq}</span>
                          <span>{med.duration}</span>
                          <span>{med.instructions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Orders */}
              {selectedRecord.labTests?.length > 0 && (
                <div className="modal-section">
                  <h4 className="modal-section-label">Investigations Ordered</h4>
                  <div className="modal-lab-grid">
                    {selectedRecord.labTests.map((test: string, i: number) => (
                      <div key={i} className="modal-lab-chip">ðŸ§ª {test}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advice */}
              {selectedRecord.advice && (
                <div className="modal-section">
                  <h4 className="modal-section-label">Advice & Instructions</h4>
                  <p className="modal-advice">{selectedRecord.advice}</p>
                </div>
              )}

              {/* Tags */}
              {selectedRecord.tags?.length > 0 && (
                <div className="modal-tags-row">
                  {selectedRecord.tags.map((tag: {label:string;cls:string}, i: number) => (
                    <span key={i} className={`tag ${tag.cls}`}>{tag.label}</span>
                  ))}
                </div>
              )}

              {/* â”€â”€ AI Explainer panel â”€â”€ */}
              {(aiLoading || aiExplanation || aiError) && (
                <div className="ai-explainer-panel">
                  <div className="ai-header-row">
                    <span>âœ¨</span>
                    <span>HealthOS AI Copilot</span>
                    {isSimulated && <span className="ai-demo-badge">Demo</span>}
                  </div>

                  {aiLoading && (
                    <div className="ai-loading-state">
                      <div className="ai-loading-glow" />
                      <span>Gemini is reading this record in plain Englishâ€¦</span>
                    </div>
                  )}

                  {aiError && (
                    <p className="ai-error">âš  {aiError}</p>
                  )}

                  {aiExplanation && (
                    <div className="ai-content">
                      {aiExplanation.split('\n').map((line, i) => {
                        if (line.startsWith('### ')) return <h3 key={i} className="ai-h3">{line.slice(4)}</h3>
                        if (/^[*-] \*\*/.test(line)) {
                          const parts = line.replace(/^[*-] /, '').split('**')
                          return <p key={i} className="ai-bullet">â€¢ <strong>{parts[1]}</strong>{parts.slice(2).join('')}</p>
                        }
                        if (/^[*-] /.test(line)) return <p key={i} className="ai-bullet">â€¢ {line.slice(2)}</p>
                        if (line.trim() === '') return <div key={i} className="ai-spacer" />
                        if (line.includes('**')) {
                          const parts = line.split('**')
                          return <p key={i} className="ai-para">{parts.map((p,idx) => idx % 2 === 1 ? <strong key={idx}>{p}</strong> : p)}</p>
                        }
                        return <p key={i} className="ai-para">{line}</p>
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* â”€â”€ Footer â”€â”€ */}
            <div className="modal-footer">
              <button className="modal-btn-ghost" id="modal-print-btn" onClick={() => window.print()}>
                ðŸ–¨&nbsp; Print
              </button>
              <div style={{ flex: 1 }} />
              <button
                className="btn-ai-explain"
                id="modal-ai-btn"
                onClick={() => explainWithAI(selectedRecord)}
                disabled={aiLoading}
              >
                âœ¨ {aiLoading ? 'Explainingâ€¦' : 'Explain with AI'}
              </button>
              <button className="modal-btn-ghost" id="modal-dismiss-btn" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

