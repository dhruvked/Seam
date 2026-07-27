'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Shared State Helpers ────────────────────────────────────────
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
  'Doxycycline', 'Cefixime', 'Montelukast', 'Aspirin', 'Losartan'
]

const LAB_TESTS = [
  'CBC (Complete Blood Count)', 'Blood Sugar (Fasting)', 'HbA1c',
  'Lipid Profile', 'LFT (Liver Function)', 'KFT (Kidney Function)',
  'Thyroid Profile (TSH)', 'Urine Routine', 'Chest X-Ray', 'ECG',
  'CRP', 'Vitamin D', 'Vitamin B12'
]

const FOLLOW_UPS = ['1 week', '2 weeks', '1 month', '3 months', 'As needed']

// ─── Component ───────────────────────────────────────────────────
export default function DoctorDashboard() {
  const router = useRouter()

  // Doctor Info State
  const [doctorName, setDoctorName] = useState('Dr. Priya Mehta')
  const [hprId, setHprId] = useState('HPR-MAH-2019-12345')

  // Patient Search & Consent State
  const [step, setStep] = useState<DoctorState>('idle')
  const [query, setQuery] = useState('')
  const [searchError, setSearchError] = useState('')

  // Consultation Form State
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: 1, drug: '', dose: '500mg', freq: 'BD', duration: '5 days', instructions: 'After meals' }
  ])
  const [labTests, setLabTests] = useState<string[]>([])
  const [advice, setAdvice] = useState('')
  const [followUp, setFollowUp] = useState('1 week')
  const [submitting, setSubmitting] = useState(false)
  const [recordId, setRecordId] = useState('')

  // 1. Auth Guard Check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('doctor_auth')
      if (!auth) {
        router.push('/doctor/login')
        return
      }
      const name = sessionStorage.getItem('doctor_name')
      const hpr = sessionStorage.getItem('doctor_hpr')
      if (name) setDoctorName(name)
      if (hpr) setHprId(hpr)

      // Clear any old consent state on load
      const ls = getLS()
      if (ls.consent) setLS({ consent: null })
    }
  }, [router])

  // 2. Poll for Patient Consent Approval
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
    let timer: any
    if (step === 'consent_sent') {
      timer = setInterval(pollConsent, 1200)
    }
    return () => clearInterval(timer)
  }, [step, pollConsent])

  // 3. Handlers
  const handleSearchPatient = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchError('')
    if (!query.trim()) {
      setSearchError('Please enter an ABHA ID or Mobile Number')
      return
    }

    setStep('searching')
    setTimeout(() => {
      setStep('found')
    }, 600)
  }

  const handleSendConsent = () => {
    setStep('consent_sent')
    setLS({
      consent: {
        id: 'CONSENT-' + Date.now(),
        patientAbha: query || '12-3456-7890-1234',
        patientName: 'Rahul Sharma',
        doctorName,
        hprId,
        facility: 'Apollo Clinic, Andheri',
        status: 'pending',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    })
  }

  const handleAddMedicine = () => {
    setMedicines(prev => [
      ...prev,
      { id: Date.now(), drug: '', dose: '500mg', freq: 'BD', duration: '5 days', instructions: 'After meals' }
    ])
  }

  const handleRemoveMedicine = (id: number) => {
    setMedicines(prev => prev.filter(m => m.id !== id))
  }

  const handleUpdateMedicine = (id: number, field: keyof Medicine, val: string) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m))
  }

  const handleToggleLab = (test: string) => {
    setLabTests(prev => prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test])
  }

  const handleSubmitConsultation = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const newRecordId = 'REC-' + Math.floor(1000 + Math.random() * 9000)
    const validMeds = medicines.filter(m => m.drug.trim() !== '')

    const newRecord = {
      id: newRecordId,
      type: 'Consultation',
      icon: '🩺',
      title: diagnosis || 'Clinical Consultation',
      doctor: doctorName,
      facility: 'Apollo Clinic, Andheri',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      detail: chiefComplaint || 'Routine clinical visit and patient evaluation.',
      medicines: validMeds,
      labTests,
      advice,
      followUp,
      badge: 'Just Added • Doctor Portal',
      tags: [
        { label: 'OP Visit', cls: 'tag-blue' },
        { label: 'Pending FHIR Sync', cls: 'tag-amber' }
      ]
    }

    setTimeout(() => {
      const ls = getLS()
      const existingRecords = ls.records || []
      setLS({
        records: [newRecord, ...existingRecords],
        consent: null
      })

      setRecordId(newRecordId)
      setSubmitting(false)
      setStep('submitted')
    }, 1000)
  }

  const handleResetFlow = () => {
    setStep('idle')
    setQuery('')
    setChiefComplaint('')
    setDiagnosis('')
    setMedicines([{ id: 1, drug: '', dose: '500mg', freq: 'BD', duration: '5 days', instructions: 'After meals' }])
    setLabTests([])
    setAdvice('')
    setFollowUp('1 week')
    setLS({ consent: null })
  }

  const handleSignOut = () => {
    sessionStorage.clear()
    router.push('/doctor/login')
  }

  return (
    <div className="layout-root doctor-theme">
      
      {/* ── SECTION 1: DOCTOR HEADER ── */}
      <header className="wireframe-header">
        <div className="header-brand">
          <span className="brand-logo">🏥</span>
          <div>
            <h1 className="brand-name">Seam <span className="brand-badge doctor-badge">Doctor Portal</span></h1>
            <p className="brand-sub">HPR Verified Clinical Interface</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="doctor-chip">
            <span className="user-icon">👨‍⚕️</span>
            <div>
              <strong className="user-name">{doctorName}</strong>
              <div className="user-id">HPR: {hprId}</div>
            </div>
          </div>
          <Link href="/dashboard" className="btn-secondary">
            Patient App →
          </Link>
          <button className="btn-ghost" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── SECTION 2: MAIN CONTAINER ── */}
      <main className="wireframe-main">

        {/* Step Progression Bar */}
        <div className="step-bar">
          <div className={`step-item ${['idle', 'searching', 'found'].includes(step) ? 'active' : step !== 'idle' ? 'done' : ''}`}>
            1. Search Patient
          </div>
          <div className={`step-item ${['consent_sent', 'approved'].includes(step) ? 'active' : ['submitting', 'submitted'].includes(step) ? 'done' : ''}`}>
            2. Digital Consent
          </div>
          <div className={`step-item ${['approved', 'submitting'].includes(step) ? 'active' : step === 'submitted' ? 'done' : ''}`}>
            3. Write Consultation
          </div>
          <div className={`step-item ${step === 'submitted' ? 'active done' : ''}`}>
            4. ABDM Record Created
          </div>
        </div>

        {/* ── STEP 1: PATIENT SEARCH FORM ── */}
        {(step === 'idle' || step === 'searching' || step === 'found') && (
          <section className="form-wireframe-card">
            <h3>Find Patient via ABHA ID</h3>
            <p className="form-sub">Enter the patient's 14-digit ABHA ID or registered mobile number to request record access.</p>

            <form onSubmit={handleSearchPatient} className="search-row">
              <input
                type="text"
                className="wireframe-input"
                placeholder="e.g. 12-3456-7890-1234 or 9876543210"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={step === 'searching'}>
                {step === 'searching' ? 'Searching ABDM...' : '🔍 Search Patient'}
              </button>
            </form>

            {searchError && <p className="error-msg">⚠️ {searchError}</p>}

            {/* Patient Search Results Match */}
            {step === 'found' && (
              <div className="patient-found-box">
                <div className="patient-found-info">
                  <div className="found-avatar">RS</div>
                  <div>
                    <h4>Rahul Sharma</h4>
                    <p>ABHA: 12-3456-7890-1234 • Male, 36 yrs • Blood: B+</p>
                  </div>
                </div>

                <div className="consent-action-box">
                  <p>Request 1-hour read access to view medical history and attach fresh consultation records.</p>
                  <button className="btn-primary" onClick={handleSendConsent}>
                    🤝 Send Consent Request to Patient's Phone
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── STEP 2: WAITING FOR CONSENT ── */}
        {step === 'consent_sent' && (
          <section className="consent-waiting-card">
            <div className="pulse-indicator">🔔</div>
            <h3>Consent Request Sent to Patient</h3>
            <p>
              Sent to <strong>Rahul Sharma</strong> (ABHA: {query || '12-3456-7890-1234'}).<br />
              Please ask the patient to tap <strong>"Approve"</strong> on their Seam Patient App to unlock their file.
            </p>

            <div className="waiting-status">
              <span className="spinner">⏳</span> Polling ABDM Gateway for patient approval...
            </div>
          </section>
        )}

        {/* ── STEP 3: CONSULTATION FORM ── */}
        {(step === 'approved' || step === 'submitting') && (
          <section className="consult-form-card">
            <div className="unlocked-header">
              <span className="unlocked-badge">✓ Digital Consent Approved</span>
              <h3>New Consultation Record</h3>
              <p>Patient: <strong>Rahul Sharma</strong> (ABHA: 12-3456-7890-1234)</p>
            </div>

            <form onSubmit={handleSubmitConsultation} className="clinical-form">
              {/* Complaints */}
              <div className="form-group">
                <label>Chief Complaints & Presenting Symptoms *</label>
                <textarea
                  className="wireframe-textarea"
                  rows={2}
                  placeholder="e.g. Fever for 3 days, sore throat, severe fatigue..."
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  required
                />
              </div>

              {/* Diagnosis */}
              <div className="form-group">
                <label>Clinical Diagnosis *</label>
                <input
                  type="text"
                  className="wireframe-input"
                  placeholder="e.g. Acute Upper Respiratory Infection (ICD-11: J06.9)"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  required
                />
              </div>

              {/* Prescriptions */}
              <div className="form-group">
                <div className="label-row">
                  <label>Prescribed Medications (Rx)</label>
                  <button type="button" className="btn-small" onClick={handleAddMedicine}>
                    + Add Medication
                  </button>
                </div>

                <div className="meds-table">
                  {medicines.map((m, idx) => (
                    <div key={m.id} className="med-row">
                      <input
                        type="text"
                        className="wireframe-input"
                        placeholder="Drug Name (e.g. Paracetamol)"
                        list="drug-suggestions"
                        value={m.drug}
                        onChange={e => handleUpdateMedicine(m.id, 'drug', e.target.value)}
                      />
                      <input
                        type="text"
                        className="wireframe-input"
                        placeholder="Dosage (500mg)"
                        value={m.dose}
                        onChange={e => handleUpdateMedicine(m.id, 'dose', e.target.value)}
                      />
                      <select
                        className="wireframe-select"
                        value={m.freq}
                        onChange={e => handleUpdateMedicine(m.id, 'freq', e.target.value)}
                      >
                        <option value="OD">OD (Once daily)</option>
                        <option value="BD">BD (Twice daily)</option>
                        <option value="TDS">TDS (Thrice daily)</option>
                        <option value="QID">QID (4 times daily)</option>
                        <option value="SOS">SOS (As needed)</option>
                      </select>
                      <input
                        type="text"
                        className="wireframe-input"
                        placeholder="Duration (5 days)"
                        value={m.duration}
                        onChange={e => handleUpdateMedicine(m.id, 'duration', e.target.value)}
                      />
                      <input
                        type="text"
                        className="wireframe-input"
                        placeholder="Instructions (After meals)"
                        value={m.instructions}
                        onChange={e => handleUpdateMedicine(m.id, 'instructions', e.target.value)}
                      />
                      {medicines.length > 1 && (
                        <button type="button" className="btn-remove" onClick={() => handleRemoveMedicine(m.id)}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <datalist id="drug-suggestions">
                  {MOCK_DRUGS.map((d, i) => <option key={i} value={d} />)}
                </datalist>
              </div>

              {/* Lab Orders */}
              <div className="form-group">
                <label>Ordered Investigations / Lab Tests</label>
                <div className="lab-selector">
                  {LAB_TESTS.map((test, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`lab-toggle ${labTests.includes(test) ? 'selected' : ''}`}
                      onClick={() => handleToggleLab(test)}
                    >
                      {labTests.includes(test) ? '✓ ' : '+ '} {test}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advice & Followup */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Lifestyle Advice & Dietary Precautions</label>
                  <input
                    type="text"
                    className="wireframe-input"
                    placeholder="e.g. Drink warm fluids, avoid cold food..."
                    value={advice}
                    onChange={e => setAdvice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Follow-up Visit Schedule</label>
                  <select
                    className="wireframe-select"
                    value={followUp}
                    onChange={e => setFollowUp(e.target.value)}
                  >
                    {FOLLOW_UPS.map((f, i) => <option key={i} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary lg" disabled={submitting}>
                  {submitting ? 'Creating ABDM FHIR Bundle...' : '✅ Save & Publish Consultation Record'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── STEP 4: SUCCESS CONFIRMATION ── */}
        {step === 'submitted' && (
          <section className="success-wireframe-card">
            <div className="success-icon">🎉</div>
            <h3>Consultation Record Created Successfully!</h3>
            <p>
              Record ID: <strong>{recordId}</strong><br />
              The consultation has been formatted as an HL7 FHIR R4 Bundle and synced to <strong>Rahul Sharma's</strong> ABHA profile.
            </p>

            <div className="success-actions">
              <button className="btn-primary" onClick={handleResetFlow}>
                + Consult Another Patient
              </button>
              <Link href="/dashboard" className="btn-secondary">
                View in Patient Timeline →
              </Link>
            </div>
          </section>
        )}

      </main>

    </div>
  )
}
