'use client'

import { useState, useEffect, useCallback, use, useRef } from 'react'
import {
  MantineProvider,
  Container,
  Paper,
  Group,
  Title,
  Text,
  Select,
  MultiSelect,
  Button,
  Modal,
  TextInput,
  Textarea,
  Grid,
  Badge,
  Table,
  Stack,
  ActionIcon,
  Divider,
  Tabs,
  Loader
} from '@mantine/core'
import Link from 'next/link'

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  specialty: string
  regNumber: string
  clinicName: string
  clinicAddress: string
  signatureDataUrl?: string
}

interface Patient {
  id: string
  name: string
  phone: string
  gender: string
  age: string
  bloodGroup: string
  allergies: string
}

interface PatientSession {
  id: string | null
  name: string
  phone: string
  gender: string
  age: string
  bloodGroup: string
  allergies: string
  isWalkIn: boolean
}

interface MedicineRow {
  name: string
  dosage: string
  duration: string
}

interface Prescription {
  id: string
  doctorId: string
  patientId?: string
  patientName: string
  patientAge: string
  patientGender: string
  diagnosis: string
  medicines: MedicineRow[]
  tests?: string
  advice: string
  followUp: string
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAGNOSTIC_TESTS_LIST = [
  'CBC (Complete Blood Count)',
  'HbA1c (Glycated Hemoglobin)',
  'Fasting Blood Sugar (FBS)',
  'Postprandial Blood Sugar (PPBS)',
  'Lipid Profile (Cholesterol, Triglycerides)',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT / RFT)',
  'Thyroid Profile (T3, T4, TSH)',
  'Urine Routine & Microscopy',
  'Chest X-Ray PA View',
  'ECG (12-Lead)',
  'USG Abdomen & Pelvis',
  'Vitamin D3 (25-OH)',
  'Vitamin B12 Level',
  'Serum Electrolytes (Na, K, Cl)',
  'ESR (Erythrocyte Sedimentation Rate)',
  'CRP (C-Reactive Protein)',
  'D-Dimer',
  'Serum Creatinine & Blood Urea',
  'Serum Uric Acid',
  'Dengue NS1 Antigen & IgM/IgG',
  'Typhoid Widal Test',
  'Malaria Smear & Antigen',
  'CT Scan Chest (HRCT)',
  'MRI Brain',
  '2D Echocardiogram (Echo)',
  'Treadmill Test (TMT / Stress Test)',
  'Hb (Hemoglobin Level)',
  'Stool Routine Test'
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DoctorSessionPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params)

  // ── Doctor ──
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null)

  // ── Phase: 'select' | 'waiting' | 'session' | 'denied' ──
  const [phase, setPhase] = useState<'select' | 'waiting' | 'session' | 'denied'>('select')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  // ── Patient Selection ──
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedPatient, setHighlightedPatient] = useState<Patient | null>(null)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [requestingConsent, setRequestingConsent] = useState(false)

  // ── Active Session ──
  const [session, setSession] = useState<PatientSession | null>(null)

  // ── Session Tab ──
  const [activeTab, setActiveTab] = useState<string | null>('records')

  // ── Previous Records ──
  const [records, setRecords] = useState<Prescription[]>([])
  const [allDoctors, setAllDoctors] = useState<Record<string, Doctor>>({})
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Prescription | null>(null)
  const [recordModalOpen, setRecordModalOpen] = useState(false)

  // ── New Prescription Form ──
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientGender, setPatientGender] = useState('Male')
  const [diagnosis, setDiagnosis] = useState('')
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [advice, setAdvice] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [medicines, setMedicines] = useState<MedicineRow[]>([{ name: '', dosage: '', duration: '' }])
  const [savingRx, setSavingRx] = useState(false)
  const [previewOpened, setPreviewOpened] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // ─── Fetch Doctor ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(`/api/doctors/${doctorId}`)
        const data = await res.json()
        if (data.success && data.doctor) setActiveDoctor(data.doctor)
      } catch (err) {
        console.error('Failed to fetch doctor:', err)
      }
    }
    fetchDoctor()
  }, [doctorId])

  // ─── Fetch All Doctors (for records view) ─────────────────────────────────

  useEffect(() => {
    const fetchAllDoctors = async () => {
      try {
        const res = await fetch('/api/doctors')
        const data = await res.json()
        if (data.success && data.doctors) {
          const map: Record<string, Doctor> = {}
          data.doctors.forEach((d: Doctor) => { map[d.id] = d })
          setAllDoctors(map)
        }
      } catch (err) {
        console.error('Failed to fetch all doctors:', err)
      }
    }
    fetchAllDoctors()
  }, [])

  // ─── Fetch Patients ───────────────────────────────────────────────────────

  const fetchPatients = useCallback(async () => {
    setLoadingPatients(true)
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      if (data.success && data.patients) setPatients(data.patients)
    } catch (err) {
      console.error('Failed to fetch patients:', err)
    } finally {
      setLoadingPatients(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // ─── Filtered Patient List ────────────────────────────────────────────────

  const filteredPatients = patients.filter(p =>
    searchQuery === '' ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone && p.phone.includes(searchQuery))
  )

  // ─── Start Consultation (Request Consent or Walk-In) ──────────────────────

  const handleStartConsultation = async (pat: PatientSession) => {
    setSession(pat)
    setPatientName(pat.name)
    setPatientAge(pat.age || '')
    setPatientGender(pat.gender || 'Male')
    setDiagnosis('')
    setSelectedTests([])
    setAdvice('')
    setFollowUp('')
    setMedicines([{ name: '', dosage: '', duration: '' }])

    // If walk-in (no registered ID), proceed directly to session
    if (pat.isWalkIn || !pat.id) {
      setPhase('session')
      setActiveTab('prescription')
      return
    }

    // Registered patient: create consent request session and wait
    setRequestingConsent(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, patientId: pat.id })
      })
      const data = await res.json()
      if (data.success && data.session) {
        setActiveSessionId(data.session.id)
        setPhase('waiting')
      } else {
        triggerNotification('error', data.error || 'Failed to request consent')
      }
    } catch (err) {
      console.error('Failed to initiate session:', err)
      triggerNotification('error', 'Network error requesting consent')
    } finally {
      setRequestingConsent(false)
    }
  }

  // ─── Poll for Session Approval ───────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'waiting' || !activeSessionId) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }

    const checkSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${activeSessionId}`)
        const data = await res.json()
        if (data.success && data.session) {
          if (data.session.status === 'approved') {
            if (pollingRef.current) clearInterval(pollingRef.current)
            triggerNotification('success', 'Patient granted access!')
            beginSessionUnlocked(session!)
          } else if (data.session.status === 'denied') {
            if (pollingRef.current) clearInterval(pollingRef.current)
            setPhase('denied')
          }
        }
      } catch (err) {
        console.error('Error polling session:', err)
      }
    }

    // Poll every 1.5 seconds
    pollingRef.current = setInterval(checkSession, 1500)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [phase, activeSessionId, session])

  // ─── Begin Session Unlocked (Load Records) ───────────────────────────────

  const beginSessionUnlocked = async (patient: PatientSession) => {
    setLoadingRecords(true)
    setActiveTab('records')
    setPhase('session')

    // Fetch previous records
    try {
      let url = '/api/prescriptions'
      if (patient.id) {
        url = `/api/prescriptions?patientId=${patient.id}`
      } else {
        url = `/api/prescriptions?patientName=${encodeURIComponent(patient.name)}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setRecords(data.prescriptions || [])
    } catch (err) {
      console.error('Failed to fetch patient records:', err)
      setRecords([])
    } finally {
      setLoadingRecords(false)
    }
  }

  // ─── End Session ──────────────────────────────────────────────────────────

  const endSession = async () => {
    if (activeSessionId) {
      try {
        await fetch(`/api/sessions/${activeSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ended' })
        })
      } catch (err) {
        console.error('Failed to end session:', err)
      }
    }

    setPhase('select')
    setActiveSessionId(null)
    setSession(null)
    setHighlightedPatient(null)
    setSearchQuery('')
    setRecords([])
    setPatientName('')
    setPatientAge('')
    setPatientGender('Male')
    setDiagnosis('')
    setSelectedTests([])
    setAdvice('')
    setFollowUp('')
    setMedicines([{ name: '', dosage: '', duration: '' }])
    try { sessionStorage.removeItem(`seam_rx_draft_${doctorId}`) } catch (_) {}
  }

  // ─── Auto-Save Draft ──────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'session') return
    try {
      sessionStorage.setItem(`seam_rx_draft_${doctorId}`, JSON.stringify({
        patientName, patientAge, patientGender, diagnosis,
        selectedTests, tests: selectedTests.join(', '),
        advice, followUp, medicines
      }))
    } catch (_) {}
  }, [doctorId, phase, patientName, patientAge, patientGender, diagnosis, selectedTests, advice, followUp, medicines])

  // ─── Medicine Row Handlers ────────────────────────────────────────────────

  const addMedicineRow = () => setMedicines([...medicines, { name: '', dosage: '', duration: '' }])
  const removeMedicineRow = (i: number) => setMedicines(medicines.filter((_, idx) => idx !== i))
  const updateMedicineRow = (i: number, field: keyof MedicineRow, val: string) => {
    const updated = [...medicines]
    updated[i][field] = val
    setMedicines(updated)
  }

  // ─── Notification ─────────────────────────────────────────────────────────

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3500)
  }

  // ─── Print / Save ─────────────────────────────────────────────────────────

  const handlePrint = async () => {
    if (!activeDoctor) return
    setSavingRx(true)
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: activeDoctor.id,
          patientId: session?.id || undefined,
          patientName: patientName.trim() || 'Unspecified Patient',
          patientAge: patientAge.trim(),
          patientGender,
          diagnosis: diagnosis.trim(),
          medicines: medicines.filter(m => m.name.trim() !== ''),
          tests: selectedTests.join(', '),
          advice: advice.trim(),
          followUp: followUp.trim()
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        try { sessionStorage.removeItem(`seam_rx_draft_${doctorId}`) } catch (_) {}
        triggerNotification('success', 'Prescription saved to patient records')
      }
    } catch (err) {
      console.error('Failed to save on print:', err)
    } finally {
      setSavingRx(false)
    }
    window.print()
  }

  // ─── Render: Select Phase ─────────────────────────────────────────────────

  const renderSelectPhase = () => (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Header */}
      <Paper shadow="xs" p="md" radius={0} withBorder className="hide-on-print"
        style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Badge color="blue" size="lg" radius="sm">Seam</Badge>
              <Title order={3} style={{ color: '#0f172a', fontWeight: 800 }}>Doctor Portal</Title>
            </Group>
            <Group gap="md">
              {activeDoctor && (
                <Text size="sm" fw={600} style={{ color: '#475569' }}>
                  {activeDoctor.name} — {activeDoctor.clinicName || 'Clinic'}
                </Text>
              )}
              <Button component={Link} href={`/demo-doc/${doctorId}/history`} variant="outline" color="blue" size="sm">
                My Prescription History
              </Button>
            </Group>
          </Group>
        </Container>
      </Paper>

      <Container size="sm" py="xl">
        <Stack gap="xl">
          {/* Page Title */}
          <Stack gap={4}>
            <Title order={2} style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
              Select Patient
            </Title>
            <Text size="sm" style={{ color: '#64748b' }}>
              Search for a registered patient, or start a walk-in consultation.
            </Text>
          </Stack>

          {/* Search Input */}
          <TextInput
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setHighlightedPatient(null)
            }}
            size="md"
            styles={{
              input: { color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#cbd5e1', height: 48 }
            }}
          />

          {/* Patient List */}
          {loadingPatients ? (
            <Text size="sm" c="dimmed">Loading patients...</Text>
          ) : filteredPatients.length === 0 && searchQuery !== '' ? (
            <Paper p="md" radius="md" withBorder style={{ borderColor: '#e2e8f0', textAlign: 'center' }}>
              <Text size="sm" c="dimmed">No registered patients match "{searchQuery}"</Text>
            </Paper>
          ) : (
            <Stack gap="xs">
              {filteredPatients.map((p) => {
                const isHighlighted = highlightedPatient?.id === p.id
                return (
                  <Paper
                    key={p.id}
                    p="md"
                    radius="md"
                    withBorder
                    onClick={() => setHighlightedPatient(isHighlighted ? null : p)}
                    style={{
                      borderColor: isHighlighted ? '#2563eb' : '#e2e8f0',
                      background: isHighlighted ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <div>
                        <Text fw={700} size="sm" style={{ color: '#0f172a' }}>{p.name}</Text>
                        <Text size="xs" style={{ color: '#64748b' }}>
                          {[p.gender, p.age ? `${p.age} yrs` : null, p.phone].filter(Boolean).join(' · ')}
                        </Text>
                        {p.allergies && (
                          <Text size="xs" style={{ color: '#dc2626', marginTop: 2 }}>
                            Allergies: {p.allergies}
                          </Text>
                        )}
                      </div>
                      {isHighlighted && (
                        <Badge color="blue" size="sm">Selected</Badge>
                      )}
                    </Group>
                  </Paper>
                )
              })}
            </Stack>
          )}

          <Divider label="OR" labelPosition="center" />

          {/* Walk-in Option */}
          <Paper p="md" radius="md" withBorder style={{ borderColor: '#e2e8f0' }}>
            <Stack gap="xs">
              <Text size="sm" fw={700} style={{ color: '#0f172a' }}>Walk-in / New Patient</Text>
              <Text size="xs" c="dimmed">Patient not registered in the system. Prescriptions are written without linking to a patient profile.</Text>
              <Button
                variant="default"
                size="sm"
                style={{ marginTop: 4 }}
                onClick={() => handleStartConsultation({
                  id: null,
                  name: searchQuery.trim() || '',
                  phone: '',
                  gender: 'Male',
                  age: '',
                  bloodGroup: '',
                  allergies: '',
                  isWalkIn: true
                })}
              >
                Start Walk-in Consultation
              </Button>
            </Stack>
          </Paper>

          {/* Begin Consultation CTA */}
          {highlightedPatient && (
            <Button
              color="blue"
              size="md"
              fullWidth
              loading={requestingConsent}
              onClick={() => handleStartConsultation({
                id: highlightedPatient.id,
                name: highlightedPatient.name,
                phone: highlightedPatient.phone || '',
                gender: highlightedPatient.gender || 'Male',
                age: highlightedPatient.age || '',
                bloodGroup: highlightedPatient.bloodGroup || '',
                allergies: highlightedPatient.allergies || '',
                isWalkIn: false
              })}
              styles={{ root: { height: 48, fontWeight: 700, backgroundColor: '#2563eb' } }}
            >
              Request Access & Begin with {highlightedPatient.name}
            </Button>
          )}
        </Stack>
      </Container>
    </div>
  )

  // ─── Render: Waiting for Consent Phase ─────────────────────────────────────

  const renderWaitingPhase = () => (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container size="xs">
        <Paper p="xl" radius="lg" withBorder shadow="sm" style={{ textAlign: 'center', background: '#ffffff', borderColor: '#cbd5e1' }}>
          <Stack align="center" gap="md">
            <Loader color="blue" size="lg" type="dots" />
            <Title order={3} style={{ color: '#0f172a', fontWeight: 800 }}>
              Waiting for Patient Permission
            </Title>
            <Text size="sm" style={{ color: '#475569', maxWidth: 360, lineHeight: 1.5 }}>
              A consent request has been sent to <strong>{session?.name}</strong>'s mobile device. Records will unlock once approved.
            </Text>
            <Paper p="xs" px="md" radius="sm" style={{ background: '#f1f5f9', width: '100%' }}>
              <Text size="xs" c="dimmed">
                Tell {session?.name} to tap "Grant Access" on their Seam mobile app.
              </Text>
            </Paper>
            <Button variant="subtle" color="gray" size="xs" onClick={endSession} mt="sm">
              Cancel Request
            </Button>
          </Stack>
        </Paper>
      </Container>
    </div>
  )

  // ─── Render: Consent Denied Phase ──────────────────────────────────────────

  const renderDeniedPhase = () => (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container size="xs">
        <Paper p="xl" radius="lg" withBorder shadow="sm" style={{ textAlign: 'center', background: '#ffffff', borderColor: '#fecaca' }}>
          <Stack align="center" gap="md">
            <Badge color="red" size="lg" radius="sm">Access Denied</Badge>
            <Title order={3} style={{ color: '#0f172a', fontWeight: 800 }}>
              Permission Was Not Granted
            </Title>
            <Text size="sm" style={{ color: '#475569', maxWidth: 360 }}>
              {session?.name} chose not to share their medical records for this consultation.
            </Text>
            <Group gap="sm" mt="sm">
              <Button variant="default" size="sm" onClick={endSession}>
                Back to Patient Selection
              </Button>
              <Button color="blue" size="sm" onClick={() => handleStartConsultation(session!)}>
                Retry Request
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </div>
  )

  // ─── Render: Session Phase ────────────────────────────────────────────────

  const renderSessionPhase = () => (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Notification Toast */}
      {notification && (
        <Paper shadow="md" p="xs" px="md" radius="md" withBorder className="hide-on-print"
          style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999, background: '#ffffff',
            borderColor: notification.type === 'success' ? '#bbf7d0' : '#fecaca',
            borderLeft: `4px solid ${notification.type === 'success' ? '#16a34a' : '#dc2626'}`
          }}>
          <Text size="sm" fw={600} style={{ color: notification.type === 'success' ? '#166534' : '#991b1b' }}>
            {notification.message}
          </Text>
        </Paper>
      )}

      {/* Header */}
      <Paper shadow="xs" p="md" radius={0} withBorder className="hide-on-print"
        style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Badge color="blue" size="lg" radius="sm">Seam</Badge>
              <Divider orientation="vertical" />
              <div>
                <Group gap="xs">
                  <Text fw={800} size="sm" style={{ color: '#0f172a' }}>
                    {session?.name}
                  </Text>
                  {session?.isWalkIn ? (
                    <Badge size="xs" color="gray" variant="light">Walk-in</Badge>
                  ) : (
                    <Badge size="xs" color="teal" variant="light">Consent Active</Badge>
                  )}
                </Group>
                <Text size="xs" c="dimmed">
                  {[session?.gender, session?.age ? `${session.age} yrs` : null, session?.bloodGroup].filter(Boolean).join(' · ')}
                  {session?.allergies ? ` · Allergies: ${session.allergies}` : ''}
                </Text>
              </div>
            </Group>
            <Group gap="md">
              <Text size="xs" fw={600} style={{ color: '#475569' }}>
                {activeDoctor?.name}
              </Text>
              <Button variant="subtle" color="red" size="xs" onClick={endSession}>
                End Consultation
              </Button>
            </Group>
          </Group>
        </Container>
      </Paper>

      <Container size="lg" py="lg">
        {/* If Walk-in: Only show New Prescription Form (no previous records tab) */}
        {session?.isWalkIn ? (
          <Paper p="sm" px="md" radius="md" mb="lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} className="hide-on-print">
            <Group justify="space-between" align="center">
              <div>
                <Text fw={800} size="sm" style={{ color: '#0f172a' }}>New Prescription</Text>
                <Text size="xs" c="dimmed">Walk-in consultation · Prescriptions are created directly without linking to previous records.</Text>
              </div>
              <Badge color="gray" variant="light">Walk-in</Badge>
            </Group>
          </Paper>
        ) : (
          /* Registered Patient: Two-Tab Navigation with black/blue text */
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            className="hide-on-print"
            mb="lg"
            styles={{
              tab: {
                fontWeight: 700,
                fontSize: 14,
                padding: '10px 18px',
                color: '#0f172a'
              },
              tabLabel: {
                color: 'inherit'
              }
            }}
          >
            <Tabs.List>
              <Tabs.Tab
                value="records"
                style={{
                  color: activeTab === 'records' ? '#2563eb' : '#0f172a'
                }}
              >
                Previous Records {records.length > 0 ? `(${records.length})` : ''}
              </Tabs.Tab>
              <Tabs.Tab
                value="prescription"
                style={{
                  color: activeTab === 'prescription' ? '#2563eb' : '#0f172a'
                }}
              >
                New Prescription
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        )}

        {/* ── TAB: Previous Records (only for registered patients) ── */}
        {!session?.isWalkIn && activeTab === 'records' && (
          <Stack gap="md" className="hide-on-print">
            {loadingRecords ? (
              <Text size="sm" c="dimmed">Loading records...</Text>
            ) : records.length === 0 ? (
              <Paper p="xl" radius="md" withBorder style={{ borderColor: '#e2e8f0', textAlign: 'center' }}>
                <Text fw={600} size="sm" mb={4} style={{ color: '#0f172a' }}>No previous records found</Text>
                <Text size="xs" c="dimmed">
                  This patient has no past prescriptions yet.
                </Text>
                <Button size="xs" color="blue" variant="light" mt="sm"
                  onClick={() => setActiveTab('prescription')}>
                  Create First Prescription
                </Button>
              </Paper>
            ) : (
              records.map((rx) => {
                const doc = allDoctors[rx.doctorId]
                return (
                  <Paper key={rx.id} p="md" radius="md" withBorder
                    style={{ borderColor: '#e2e8f0', cursor: 'pointer' }}
                    onClick={() => { setSelectedRecord(rx); setRecordModalOpen(true) }}>
                    <Group justify="space-between" align="flex-start">
                      <div>
                        <Text fw={700} size="sm" style={{ color: '#0f172a' }}>
                          {rx.diagnosis || 'General Consultation'}
                        </Text>
                        <Text size="xs" style={{ color: '#64748b', marginTop: 2 }}>
                          {doc ? `${doc.name} · ${doc.clinicName || 'Clinic'}` : 'Unknown Doctor'}
                        </Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          {rx.medicines.length} medicine{rx.medicines.length !== 1 ? 's' : ''}
                          {rx.tests ? ` · ${rx.tests.split(',').length} test${rx.tests.split(',').length !== 1 ? 's' : ''}` : ''}
                        </Text>
                      </div>
                      <Stack gap={4} align="flex-end">
                        <Badge size="xs" variant="outline" color="gray">
                          {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Badge>
                        <Text size="xs" style={{ color: '#2563eb' }}>Tap to view</Text>
                      </Stack>
                    </Group>
                  </Paper>
                )
              })
            )}
          </Stack>
        )}

        {/* ── TAB: New Prescription Form (always shown for walk-ins, or when activeTab === 'prescription') ── */}
        {(session?.isWalkIn || activeTab === 'prescription') && (
          <Paper p="xl" radius="md" withBorder style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
            <Stack gap="lg">

              {/* Section 1: Patient Details */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9' }}>
                <Title order={4} mb="sm" style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                  1. Patient Details
                </Title>
                <Grid>
                  <Grid.Col span={4}>
                    <TextInput label="PATIENT NAME" value={patientName}
                      onChange={e => setPatientName(e.target.value)}
                      styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }} />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput label="AGE (YEARS)" value={patientAge}
                      onChange={e => setPatientAge(e.target.value)} placeholder="e.g. 35"
                      styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }} />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select label="GENDER" value={patientGender}
                      onChange={val => setPatientGender(val || 'Male')}
                      data={['Male', 'Female', 'Other']} allowDeselect={false}
                      styles={{
                        input: { color: '#0f172a', backgroundColor: '#ffffff', fontWeight: 600 },
                        label: { color: '#475569' },
                        option: { color: '#0f172a' }, dropdown: { backgroundColor: '#ffffff' }
                      }} />
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Section 2: Diagnosis */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9' }}>
                <Title order={4} mb="sm" style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                  2. Clinical Diagnosis & Complaints
                </Title>
                <Textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                  placeholder="Describe patient symptoms and diagnosis..." minRows={2}
                  styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' } }} />
              </Paper>

              {/* Section 3: Medicines */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9' }}>
                <Group justify="space-between" mb="sm">
                  <Title order={4} style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                    3. Prescribed Medications
                  </Title>
                  <Button size="xs" variant="outline" color="teal" onClick={addMedicineRow}>
                    + Add Medicine
                  </Button>
                </Group>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: '45%', color: '#475569' }}>Medicine Name & Strength</Table.Th>
                      <Table.Th style={{ width: '35%', color: '#475569' }}>Dosage & Frequency</Table.Th>
                      <Table.Th style={{ width: '15%', color: '#475569' }}>Duration</Table.Th>
                      <Table.Th style={{ width: '5%' }}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {medicines.map((m, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td>
                          <TextInput value={m.name} onChange={e => updateMedicineRow(idx, 'name', e.target.value)}
                            placeholder="e.g. Paracetamol 650mg"
                            styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' } }} />
                        </Table.Td>
                        <Table.Td>
                          <TextInput value={m.dosage} onChange={e => updateMedicineRow(idx, 'dosage', e.target.value)}
                            placeholder="e.g. 1-0-1 after food"
                            styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' } }} />
                        </Table.Td>
                        <Table.Td>
                          <TextInput value={m.duration} onChange={e => updateMedicineRow(idx, 'duration', e.target.value)}
                            placeholder="e.g. 5 days"
                            styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' } }} />
                        </Table.Td>
                        <Table.Td>
                          {medicines.length > 1 && (
                            <Button size="xs" color="red" variant="subtle" onClick={() => removeMedicineRow(idx)}>x</Button>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>

              {/* Section 4: Diagnostic Tests */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9' }}>
                <Title order={4} mb="sm" style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                  4. Prescribed Diagnostic Tests & Lab Investigations
                </Title>
                <MultiSelect
                  data={DIAGNOSTIC_TESTS_LIST} value={selectedTests} onChange={setSelectedTests}
                  placeholder="Search and select lab tests..." searchable clearable
                  nothingFoundMessage="No matching lab test found"
                  styles={{
                    input: { color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#cbd5e1' },
                    dropdown: { backgroundColor: '#ffffff', borderColor: '#cbd5e1' },
                    option: { color: '#0f172a', fontWeight: 500 },
                    pill: { backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600, border: '1px solid #cbd5e1' }
                  }} />
              </Paper>

              {/* Section 5: Advice & Follow Up */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9' }}>
                <Title order={4} mb="sm" style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                  5. Advice & Follow Up
                </Title>
                <Grid>
                  <Grid.Col span={8}>
                    <Textarea label="ADVICE / INSTRUCTIONS" value={advice}
                      onChange={e => setAdvice(e.target.value)}
                      placeholder="e.g. Rest, drink warm water, avoid cold food" minRows={2}
                      styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }} />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput label="FOLLOW UP" value={followUp}
                      onChange={e => setFollowUp(e.target.value)} placeholder="e.g. 5 days"
                      styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }} />
                  </Grid.Col>
                </Grid>
              </Paper>

              <Divider my="sm" />
              <Group justify="flex-end">
                <Button color="blue" size="md" onClick={() => setPreviewOpened(true)} disabled={!activeDoctor}>
                  Preview Prescription
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}
      </Container>

      {/* ── Previous Record Detail Modal ── */}
      <Modal opened={recordModalOpen} onClose={() => setRecordModalOpen(false)}
        title={<Text fw={700} size="lg">Prescription Slip</Text>}
        centered size="lg"
        styles={{ body: { color: '#0f172a', backgroundColor: '#ffffff' }, header: { backgroundColor: '#ffffff' } }}>
        {selectedRecord && (() => {
          const doc = allDoctors[selectedRecord.doctorId]
          const tests = selectedRecord.tests?.split(',').map(t => t.trim()).filter(Boolean) || []
          return (
            <Paper p="lg" radius="sm" withBorder style={{ borderColor: '#cbd5e1' }}>
              <Group justify="space-between" mb="md" style={{ borderBottom: '2px solid #0f172a', paddingBottom: 12 }}>
                <div>
                  <Text fw={800} size="lg">{doc?.name || 'Dr. Medical Practitioner'}</Text>
                  <Text size="xs" c="dimmed">{doc?.specialty} · Reg: {doc?.regNumber}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text fw={700} size="sm" style={{ color: '#2563eb' }}>{doc?.clinicName || 'Clinic'}</Text>
                  <Text size="xs" c="dimmed">{new Date(selectedRecord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </div>
              </Group>
              <Paper p="xs" px="sm" mb="sm" radius="xs" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Group justify="space-between">
                  <Text size="sm"><strong>Patient:</strong> {selectedRecord.patientName}</Text>
                  <Text size="sm"><strong>Age/Gender:</strong> {selectedRecord.patientAge} Yrs / {selectedRecord.patientGender}</Text>
                </Group>
              </Paper>
              {selectedRecord.diagnosis && (
                <Stack gap={2} mb="sm">
                  <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Diagnosis</Text>
                  <Text size="sm">{selectedRecord.diagnosis}</Text>
                </Stack>
              )}
              <Stack gap={2} mb="sm">
                <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Prescribed Medications</Text>
                <Table withTableBorder withColumnBorders style={{ fontSize: 12 }}>
                  <Table.Thead>
                    <Table.Tr style={{ background: '#f8fafc' }}>
                      <Table.Th>#</Table.Th><Table.Th>Medicine</Table.Th><Table.Th>Dosage</Table.Th><Table.Th>Duration</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedRecord.medicines.map((m, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>{i + 1}</Table.Td>
                        <Table.Td fw={600}>{m.name}</Table.Td>
                        <Table.Td>{m.dosage || '-'}</Table.Td>
                        <Table.Td>{m.duration || '-'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
              {tests.length > 0 && (
                <Stack gap={2} mb="sm">
                  <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Diagnostic Tests</Text>
                  <Group gap={6}>
                    {tests.map((t, i) => (
                      <Badge key={i} variant="outline" color="gray" size="sm" radius="xs">{t}</Badge>
                    ))}
                  </Group>
                </Stack>
              )}
              {selectedRecord.advice && (
                <Stack gap={2} mb="sm">
                  <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Advice</Text>
                  <Text size="sm">{selectedRecord.advice}</Text>
                </Stack>
              )}
              {selectedRecord.followUp && (
                <Stack gap={2}>
                  <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Follow Up</Text>
                  <Text size="sm">{selectedRecord.followUp}</Text>
                </Stack>
              )}
            </Paper>
          )
        })()}
      </Modal>

      {/* ── Preview & Print Modal ── */}
      <Modal opened={previewOpened} onClose={() => setPreviewOpened(false)}
        title={<Text fw={700} size="lg">Prescription Preview</Text>}
        centered size="lg"
        styles={{ body: { color: '#0f172a', backgroundColor: '#ffffff' }, header: { backgroundColor: '#ffffff' } }}>
        <Paper p="lg" radius="sm" withBorder style={{ borderColor: '#cbd5e1' }}>
          <Group justify="space-between" mb="md" style={{ borderBottom: '2px solid #0f172a', paddingBottom: 12 }}>
            <div>
              <Text fw={800} size="lg">{activeDoctor?.name || 'Dr. Medical Practitioner'}</Text>
              <Text size="xs" c="dimmed">{activeDoctor?.specialty} · Reg: {activeDoctor?.regNumber}</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text fw={700} size="sm" style={{ color: '#2563eb' }}>{activeDoctor?.clinicName || 'Clinic'}</Text>
              <Text size="xs" c="dimmed">Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </div>
          </Group>
          <Paper p="xs" px="sm" mb="sm" radius="xs" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Group justify="space-between">
              <Text size="sm"><strong>Patient:</strong> {patientName || 'Unspecified'}</Text>
              <Text size="sm"><strong>Age/Gender:</strong> {patientAge ? `${patientAge} Yrs` : 'N/A'} / {patientGender}</Text>
            </Group>
          </Paper>
          {diagnosis && <Stack gap={2} mb="sm"><Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Diagnosis</Text><Text size="sm">{diagnosis}</Text></Stack>}
          <Stack gap={2} mb="sm">
            <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Prescribed Medications</Text>
            <Table withTableBorder withColumnBorders style={{ fontSize: 12 }}>
              <Table.Thead>
                <Table.Tr style={{ background: '#f8fafc' }}>
                  <Table.Th>#</Table.Th><Table.Th>Medicine</Table.Th><Table.Th>Dosage</Table.Th><Table.Th>Duration</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {medicines.map((m, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{i + 1}</Table.Td>
                    <Table.Td fw={600}>{m.name || 'Unspecified Medicine'}</Table.Td>
                    <Table.Td>{m.dosage || '-'}</Table.Td>
                    <Table.Td>{m.duration || '-'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
          {selectedTests.length > 0 && (
            <Stack gap={2} mb="sm">
              <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Diagnostic Tests</Text>
              <Group gap={6}>
                {selectedTests.map((t, i) => (
                  <Badge key={i} variant="outline" color="gray" size="sm" radius="xs">{t}</Badge>
                ))}
              </Group>
            </Stack>
          )}
          {advice && <Stack gap={2} mb="sm"><Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Advice</Text><Text size="sm">{advice}</Text></Stack>}
          {followUp && <Stack gap={2} mb="sm"><Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Follow Up</Text><Text size="sm">{followUp}</Text></Stack>}
          <Group justify="flex-end" mt="lg">
            {activeDoctor?.signatureDataUrl ? (
              <div style={{ textAlign: 'center' }}>
                <img src={activeDoctor.signatureDataUrl} alt="Sig" style={{ height: 40, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />
                <div style={{ width: 140, borderTop: '1px solid #0f172a', margin: '0 auto 4px' }}></div>
                <Text size="xs" c="dimmed">Doctor Signature / Stamp</Text>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: 32 }}></div>
                <div style={{ width: 140, borderTop: '1px solid #0f172a', margin: '0 auto 4px' }}></div>
                <Text size="xs" c="dimmed">Doctor Signature / Stamp</Text>
              </div>
            )}
          </Group>
        </Paper>
        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={() => setPreviewOpened(false)}>Edit</Button>
          <Button color="blue" loading={savingRx} onClick={handlePrint}>Print / Download PDF</Button>
        </Group>
      </Modal>
    </div>
  )

  // ─── Root Render ──────────────────────────────────────────────────────────

  return (
    <MantineProvider>
      {phase === 'select' && renderSelectPhase()}
      {phase === 'waiting' && renderWaitingPhase()}
      {phase === 'denied' && renderDeniedPhase()}
      {phase === 'session' && renderSessionPhase()}
    </MantineProvider>
  )
}
