'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import {
  MantineProvider,
  Container,
  Paper,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Modal,
  Table,
  Divider
} from '@mantine/core'
import { useSearchParams, useRouter } from 'next/navigation'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface PatientSession {
  id?: string
  name: string
  phone?: string
  gender?: string
  age?: string
  bloodGroup?: string
  allergies?: string
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

interface Doctor {
  id: string
  name: string
  specialty: string
  clinicName: string
  clinicAddress: string
  regNumber: string
  signatureDataUrl?: string
}

interface PendingConsentSession {
  id: string
  doctorId: string
  patientId: string
  status: string
  createdAt: string
}

// ─── Inner Dashboard (reads search params) ────────────────────────────────────

function PatientDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlPatientId = searchParams.get('patientId')

  const [patient, setPatient] = useState<PatientSession | null>(null)
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'profile'>('prescriptions')

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loadingRx, setLoadingRx] = useState(true)
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null)
  const [slipOpen, setSlipOpen] = useState(false)

  // Doctors lookup
  const [doctorsMap, setDoctorsMap] = useState<Record<string, Doctor>>({})

  // Pending Consent Requests
  const [pendingConsent, setPendingConsent] = useState<PendingConsentSession | null>(null)
  const [respondingConsent, setRespondingConsent] = useState(false)

  const consentPollRef = useRef<NodeJS.Timeout | null>(null)

  // ── Load patient from session storage ──
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('seam_patient_session')
      if (stored) {
        setPatient(JSON.parse(stored))
      } else {
        // If not in session storage, but urlPatientId is present, we will stay
        if (!urlPatientId) {
          router.push('/demo-patient')
        }
      }
    } catch {
      if (!urlPatientId) router.push('/demo-patient')
    }
  }, [router, urlPatientId])

  // ── Fetch all doctors for name lookup ──
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('/api/doctors')
        const data = await res.json()
        if (data.success && data.doctors) {
          const map: Record<string, Doctor> = {}
          data.doctors.forEach((d: Doctor) => { map[d.id] = d })
          setDoctorsMap(map)
        }
      } catch (err) {
        console.error('Failed to fetch doctors:', err)
      }
    }
    fetchDoctors()
  }, [])

  // ── Fetch prescriptions ──
  const fetchPrescriptions = useCallback(async (pat: PatientSession) => {
    try {
      let rxList: Prescription[] = []

      // Try by patient_id first (properly linked prescriptions)
      const patientId = urlPatientId || pat.id
      if (patientId) {
        const res = await fetch(`/api/prescriptions?patientId=${patientId}`)
        const data = await res.json()
        if (data.success && data.prescriptions?.length > 0) {
          rxList = data.prescriptions
        }
      }

      // Fallback: search by name if nothing found by ID
      if (rxList.length === 0 && pat.name) {
        const res = await fetch(`/api/prescriptions?patientName=${encodeURIComponent(pat.name)}`)
        const data = await res.json()
        if (data.success && data.prescriptions?.length > 0) {
          rxList = data.prescriptions
        }
      }

      setPrescriptions(rxList)
    } catch (err) {
      console.error('Failed to fetch prescriptions:', err)
    } finally {
      setLoadingRx(false)
    }
  }, [urlPatientId])

  useEffect(() => {
    if (patient) {
      setLoadingRx(true)
      fetchPrescriptions(patient)
    }
  }, [patient, fetchPrescriptions])

  // ── Poll for Pending Consent Requests ──
  useEffect(() => {
    const patId = urlPatientId || patient?.id
    const patName = patient?.name
    const patPhone = patient?.phone

    if (!patId && !patName && !patPhone) return

    const pollConsent = async () => {
      try {
        const queryParams = new URLSearchParams()
        if (patId) queryParams.set('patientId', patId)
        if (patName) queryParams.set('patientName', patName)
        if (patPhone) queryParams.set('phone', patPhone)

        const res = await fetch(`/api/sessions?${queryParams.toString()}`)
        const data = await res.json()
        if (data.success && data.sessions && data.sessions.length > 0) {
          setPendingConsent(data.sessions[0])
        } else {
          setPendingConsent(null)
        }
      } catch (err) {
        console.error('Failed to check consent sessions:', err)
      }
    }

    pollConsent()
    consentPollRef.current = setInterval(pollConsent, 1500)

    return () => {
      if (consentPollRef.current) clearInterval(consentPollRef.current)
    }
  }, [urlPatientId, patient])

  // ── Handle Consent Decision (Approve / Deny) ──
  const handleConsentResponse = async (status: 'approved' | 'denied') => {
    if (!pendingConsent) return
    setRespondingConsent(true)
    try {
      await fetch(`/api/sessions/${pendingConsent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      setPendingConsent(null)
      if (patient) fetchPrescriptions(patient)
    } catch (err) {
      console.error('Failed to respond to consent:', err)
    } finally {
      setRespondingConsent(false)
    }
  }

  // ── Sign Out ──
  const handleSignOut = () => {
    sessionStorage.removeItem('seam_patient_session')
    router.push('/demo-patient')
  }

  // ── Open slip ──
  const openSlip = (rx: Prescription) => {
    setSelectedRx(rx)
    setSlipOpen(true)
  }

  if (!patient && !urlPatientId) return null

  const displayName = patient?.name || 'Patient'
  const firstName = displayName.split(' ')[0]
  const requestingDoctor = pendingConsent ? doctorsMap[pendingConsent.doctorId] : null

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#f8fafc',
        display: 'flex',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
    >
      <Container
        size="xs"
        style={{
          width: '100%',
          maxWidth: 430,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100dvh',
          position: 'relative'
        }}
      >
        <Paper
          radius={0}
          style={{
            background: '#ffffff',
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #e2e8f0',
            borderRight: '1px solid #e2e8f0'
          }}
        >
          {/* ── Top Header ── */}
          <div style={{ padding: '28px 20px 16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" style={{ color: '#94a3b8', fontWeight: 600 }}>SEAM</Text>
                <Text fw={800} size="xl" style={{ color: '#0f172a', lineHeight: 1.2 }}>
                  Hello, {firstName}
                </Text>
              </div>
              {/* Profile Initial Circle */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#eff6ff',
                  border: '2px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                  color: '#2563eb',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab('profile')}
              >
                {firstName[0]?.toUpperCase()}
              </div>
            </Group>
          </div>

          {/* ── Pending Consent Banner Alert (Always Visible at top of screen) ── */}
          {pendingConsent && (
            <Paper p="md" m="md" radius="md" style={{ background: '#eff6ff', border: '1.5px solid #3b82f6', boxShadow: '0 4px 12px rgba(37,99,235,0.12)' }}>
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Badge color="blue" size="sm" radius="sm">CONSULTATION REQUEST</Badge>
                  <Text size="xs" c="dimmed">Just now</Text>
                </Group>
                <div>
                  <Text fw={800} size="sm" style={{ color: '#1e3a8a' }}>
                    {requestingDoctor?.name || 'Doctor'}
                  </Text>
                  <Text size="xs" style={{ color: '#3b82f6' }}>
                    {requestingDoctor?.clinicName || 'Clinic Consultation'}
                  </Text>
                </div>
                <Text size="xs" style={{ color: '#1e40af', lineHeight: 1.4 }}>
                  Doctor is requesting permission to view your medical history and issue a prescription.
                </Text>
                <Group gap="xs" mt={4} grow>
                  <Button
                    size="sm"
                    color="blue"
                    loading={respondingConsent}
                    onClick={() => handleConsentResponse('approved')}
                    styles={{ root: { backgroundColor: '#2563eb', fontWeight: 700 } }}
                  >
                    Grant Access
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    color="red"
                    disabled={respondingConsent}
                    onClick={() => handleConsentResponse('denied')}
                    styles={{ root: { fontWeight: 600 } }}
                  >
                    Deny
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}

          {/* ── Scrollable Content Area ── */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

            {/* PRESCRIPTIONS TAB */}
            {activeTab === 'prescriptions' && (
              <div style={{ padding: '16px 20px' }}>
                <Text size="xs" fw={700} style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                  Your Prescriptions
                </Text>

                {loadingRx ? (
                  <Text size="sm" c="dimmed" style={{ padding: '32px 0', textAlign: 'center' }}>
                    Loading your records...
                  </Text>
                ) : prescriptions.length === 0 ? (
                  <Paper p="xl" radius="lg" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', textAlign: 'center', marginTop: 24 }}>
                    <Text fw={700} size="sm" mb={6} style={{ color: '#0f172a' }}>No prescriptions yet</Text>
                    <Text size="xs" style={{ color: '#94a3b8', lineHeight: 1.5 }}>
                      Prescriptions created by your doctor will appear here after your consultation.
                    </Text>
                  </Paper>
                ) : (
                  <Stack gap="xs">
                    {prescriptions.map((rx) => {
                      const doc = doctorsMap[rx.doctorId]
                      const tests = rx.tests
                        ? rx.tests.split(',').filter(t => t.trim()).length
                        : 0

                      return (
                        <Paper
                          key={rx.id}
                          p="md"
                          radius="lg"
                          withBorder
                          onClick={() => openSlip(rx)}
                          style={{
                            borderColor: '#e2e8f0',
                            background: '#ffffff',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s ease'
                          }}
                        >
                          <Group justify="space-between" align="flex-start" wrap="nowrap">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {/* Diagnosis */}
                              <Text fw={700} size="sm" style={{ color: '#0f172a' }} truncate>
                                {rx.diagnosis || 'General Consultation'}
                              </Text>

                              {/* Doctor & Clinic */}
                              <Text size="xs" style={{ color: '#64748b', marginTop: 2 }}>
                                {doc ? `${doc.name}` : 'Unknown Doctor'}
                                {doc?.clinicName ? ` · ${doc.clinicName}` : ''}
                              </Text>

                              {/* Medicines & Tests count */}
                              <Group gap="xs" mt={6}>
                                {rx.medicines.length > 0 && (
                                  <Badge size="xs" variant="light" color="blue" radius="sm">
                                    {rx.medicines.length} medicine{rx.medicines.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {tests > 0 && (
                                  <Badge size="xs" variant="light" color="teal" radius="sm">
                                    {tests} test{tests !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {rx.followUp && (
                                  <Badge size="xs" variant="light" color="gray" radius="sm">
                                    Follow-up: {rx.followUp}
                                  </Badge>
                                )}
                              </Group>
                            </div>

                            {/* Date + chevron */}
                            <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 12 }}>
                              <Text size="xs" style={{ color: '#94a3b8', fontWeight: 600 }}>
                                {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </Text>
                              <Text size="xs" style={{ color: '#cbd5e1', marginTop: 18 }}>›</Text>
                            </div>
                          </Group>
                        </Paper>
                      )
                    })}
                  </Stack>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div style={{ padding: '16px 20px' }}>
                <Text size="xs" fw={700} style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                  Your Profile
                </Text>

                <Stack gap="xs">
                  {/* Profile Card */}
                  <Paper p="md" radius="lg" withBorder style={{ borderColor: '#e2e8f0' }}>
                    <Stack gap={8}>
                      {[
                        { label: 'Full Name', value: displayName },
                        { label: 'Mobile Number', value: patient?.phone || '—' },
                        { label: 'Gender', value: patient?.gender || '—' },
                        { label: 'Age', value: patient?.age ? `${patient.age} years` : '—' },
                        { label: 'Blood Group', value: patient?.bloodGroup || '—' }
                      ].map(({ label, value }) => (
                        <Group key={label} justify="space-between" align="center">
                          <Text size="xs" style={{ color: '#94a3b8', fontWeight: 600 }}>{label}</Text>
                          <Text size="sm" fw={600} style={{ color: '#0f172a' }}>{value}</Text>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>

                  {/* Allergies */}
                  {patient?.allergies && (
                    <Paper p="md" radius="lg" withBorder style={{ borderColor: '#fecaca', background: '#fff5f5' }}>
                      <Text size="xs" fw={700} style={{ color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        Known Allergies
                      </Text>
                      <Text size="sm" style={{ color: '#0f172a' }}>{patient.allergies}</Text>
                    </Paper>
                  )}

                  {/* Sign Out */}
                  <Button
                    variant="default"
                    size="md"
                    fullWidth
                    radius="md"
                    onClick={handleSignOut}
                    style={{ marginTop: 8, borderColor: '#e2e8f0', fontWeight: 700 }}
                  >
                    Sign Out
                  </Button>
                </Stack>
              </div>
            )}
          </div>

          {/* ── Fixed Bottom Navigation ── */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 430,
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              zIndex: 100
            }}
          >
            {[
              { key: 'prescriptions', label: 'Prescriptions' },
              { key: 'profile', label: 'Profile' }
            ].map(({ key, label }) => {
              const isActive = activeTab === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'prescriptions' | 'profile')}
                  style={{
                    flex: 1,
                    padding: '14px 0',
                    background: 'none',
                    border: 'none',
                    borderTop: isActive ? '2px solid #2563eb' : '2px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#2563eb' : '#94a3b8',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Paper>
      </Container>

      {/* ── Prescription Slip Modal ── */}
      <Modal
        opened={slipOpen}
        onClose={() => setSlipOpen(false)}
        title={<Text fw={700} size="md" style={{ color: '#0f172a' }}>Prescription Slip</Text>}
        centered
        size="md"
        styles={{
          body: { backgroundColor: '#ffffff', color: '#0f172a' },
          header: { backgroundColor: '#ffffff' }
        }}
      >
        {selectedRx && (() => {
          const doc = doctorsMap[selectedRx.doctorId]
          const tests = selectedRx.tests?.split(',').map(t => t.trim()).filter(Boolean) || []

          return (
            <Paper p="md" radius="sm" withBorder style={{ borderColor: '#e2e8f0' }}>
              {/* Doctor header */}
              <Group justify="space-between" mb="sm" style={{ borderBottom: '2px solid #0f172a', paddingBottom: 10 }}>
                <div>
                  <Text fw={800} size="sm" style={{ color: '#0f172a' }}>{doc?.name || 'Doctor'}</Text>
                  <Text size="xs" c="dimmed">{doc?.specialty} · Reg: {doc?.regNumber}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text fw={700} size="xs" style={{ color: '#2563eb' }}>{doc?.clinicName || 'Clinic'}</Text>
                  <Text size="xs" c="dimmed">
                    {new Date(selectedRx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </div>
              </Group>

              {/* Patient bar */}
              <Paper p="xs" px="sm" mb="sm" radius="xs" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Group justify="space-between">
                  <Text size="xs"><strong>Patient:</strong> {selectedRx.patientName}</Text>
                  <Text size="xs"><strong>Age/Sex:</strong> {selectedRx.patientAge || '—'} / {selectedRx.patientGender}</Text>
                </Group>
              </Paper>

              {/* Diagnosis */}
              {selectedRx.diagnosis && (
                <Stack gap={2} mb="sm">
                  <Text size="xs" fw={700} style={{ color: '#475569', textTransform: 'uppercase' }}>Diagnosis</Text>
                  <Text size="sm" style={{ color: '#0f172a' }}>{selectedRx.diagnosis}</Text>
                </Stack>
              )}

              {/* Medicines */}
              <Stack gap={2} mb="sm">
                <Text size="xs" fw={700} style={{ color: '#475569', textTransform: 'uppercase' }}>Prescribed Medications</Text>
                <Table withTableBorder withColumnBorders style={{ fontSize: 11 }}>
                  <Table.Thead>
                    <Table.Tr style={{ background: '#f8fafc' }}>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Medicine</Table.Th>
                      <Table.Th>Dosage</Table.Th>
                      <Table.Th>Duration</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedRx.medicines.map((m, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>{i + 1}</Table.Td>
                        <Table.Td fw={600}>{m.name}</Table.Td>
                        <Table.Td>{m.dosage || '—'}</Table.Td>
                        <Table.Td>{m.duration || '—'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>

              {/* Tests */}
              {tests.length > 0 && (
                <Stack gap={2} mb="sm">
                  <Text size="xs" fw={700} style={{ color: '#475569', textTransform: 'uppercase' }}>Diagnostic Tests</Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {tests.map((t, i) => (
                      <Badge key={i} size="xs" variant="outline" color="gray" radius="xs">{t}</Badge>
                    ))}
                  </div>
                </Stack>
              )}

              {/* Advice */}
              {selectedRx.advice && (
                <Stack gap={2} mb="sm">
                  <Text size="xs" fw={700} style={{ color: '#475569', textTransform: 'uppercase' }}>Advice</Text>
                  <Text size="xs" style={{ color: '#0f172a' }}>{selectedRx.advice}</Text>
                </Stack>
              )}

              {/* Follow up */}
              {selectedRx.followUp && (
                <Stack gap={2} mb="sm">
                  <Text size="xs" fw={700} style={{ color: '#475569', textTransform: 'uppercase' }}>Follow Up</Text>
                  <Text size="xs" style={{ color: '#0f172a' }}>{selectedRx.followUp}</Text>
                </Stack>
              )}

              {/* Doctor signature */}
              <Group justify="flex-end" mt="md">
                <div style={{ textAlign: 'center' }}>
                  {doc?.signatureDataUrl && (
                    <img src={doc.signatureDataUrl} alt="Signature" style={{ height: 32, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />
                  )}
                  <div style={{ width: 120, borderTop: '1px solid #0f172a', margin: '0 auto 2px' }}></div>
                  <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>Doctor Signature</Text>
                </div>
              </Group>
            </Paper>
          )
        })()}

        <Button size="xs" color="blue" fullWidth mt="md" onClick={() => window.print()}>
          Download / Print PDF
        </Button>
      </Modal>
    </div>
  )
}

// ─── Page Wrapper with Suspense ───────────────────────────────────────────────

export default function DemoPatientDashboardPage() {
  return (
    <MantineProvider>
      <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#ffffff' }} />}>
        <PatientDashboardInner />
      </Suspense>
    </MantineProvider>
  )
}
