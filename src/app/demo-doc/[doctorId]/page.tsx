'use client'

import { useState, useEffect, useCallback, use } from 'react'
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
  SelectProps,
  Divider
} from '@mantine/core'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

interface MedicineRow {
  name: string
  dosage: string
  duration: string
}

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

export default function DynamicDoctorDemoPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params)
  const router = useRouter()

  // Doctors List & Selection
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null)
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  // Modals & UI State
  const [previewOpened, setPreviewOpened] = useState(false)

  // Patient & Clinical Form State (Empty initial state)
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientGender, setPatientGender] = useState('Male')

  const [diagnosis, setDiagnosis] = useState('')
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [advice, setAdvice] = useState('')
  const [followUp, setFollowUp] = useState('')

  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { name: '', dosage: '', duration: '' }
  ])

  // Toast & Saving state
  const [savingRx, setSavingRx] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Trigger floating toast notification
  const triggerNotification = (type: 'success' | 'error', message: string, durationMs = 3000) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, durationMs)
  }

  // Load draft from sessionStorage on page mount
  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem(`seam_rx_draft_${doctorId}`)
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft)
        if (parsed.patientName !== undefined) setPatientName(parsed.patientName)
        if (parsed.patientAge !== undefined) setPatientAge(parsed.patientAge)
        if (parsed.patientGender !== undefined) setPatientGender(parsed.patientGender)
        if (parsed.diagnosis !== undefined) setDiagnosis(parsed.diagnosis)
        if (parsed.selectedTests !== undefined && Array.isArray(parsed.selectedTests)) {
          setSelectedTests(parsed.selectedTests)
        } else if (parsed.tests) {
          setSelectedTests(parsed.tests.split(', ').filter(Boolean))
        }
        if (parsed.advice !== undefined) setAdvice(parsed.advice)
        if (parsed.followUp !== undefined) setFollowUp(parsed.followUp)
        if (parsed.medicines !== undefined && Array.isArray(parsed.medicines)) setMedicines(parsed.medicines)
      }
    } catch (err) {
      console.error('Failed to load session draft:', err)
    }
  }, [doctorId])

  // Auto-Save Draft to sessionStorage as the doctor types
  useEffect(() => {
    try {
      const draftPayload = {
        patientName,
        patientAge,
        patientGender,
        diagnosis,
        selectedTests,
        tests: selectedTests.join(', '),
        advice,
        followUp,
        medicines
      }
      sessionStorage.setItem(`seam_rx_draft_${doctorId}`, JSON.stringify(draftPayload))
    } catch (err) {
      console.error('Failed to update session draft:', err)
    }
  }, [doctorId, patientName, patientAge, patientGender, diagnosis, selectedTests, advice, followUp, medicines])

  // Fetch doctors list and set active doctor by URL parameter doctorId
  const fetchDoctors = useCallback(async () => {
    setLoadingDoctors(true)
    try {
      const res = await fetch('/api/doctors')
      const data = await res.json()
      if (data.success && data.doctors) {
        setDoctors(data.doctors)
        const found = data.doctors.find((d: Doctor) => d.id === doctorId)
        if (found) {
          setActiveDoctor(found)
        } else if (data.doctors.length > 0) {
          setActiveDoctor(data.doctors[0])
        }
      }
    } catch (err) {
      console.error('Failed to load doctors:', err)
    } finally {
      setLoadingDoctors(false)
    }
  }, [doctorId])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  // Delete doctor handler
  const handleDeleteDoctorById = async (id: string) => {
    const target = doctors.find(d => d.id === id)
    if (!target) return
    if (!window.confirm(`Are you sure you want to delete ${target.name}?`)) return

    try {
      const res = await fetch(`/api/doctors/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        const remaining = doctors.filter(d => d.id !== id)
        setDoctors(remaining)
        triggerNotification('success', `Doctor ${target.name} deleted.`)
        if (remaining.length > 0) {
          router.push(`/demo-doc/${remaining[0].id}`)
        } else {
          router.push('/admin')
        }
      } else {
        alert(data.error || 'Failed to delete doctor')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting doctor profile')
    }
  }

  // Medicine table handlers - 100% EMPTY new rows
  const addMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '' }])
  }

  const removeMedicineRow = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index))
  }

  const updateMedicineRow = (index: number, field: keyof MedicineRow, val: string) => {
    const updated = [...medicines]
    updated[index][field] = val
    setMedicines(updated)
  }

  // Clear Form & Erase Draft Memory
  const handleClearForm = () => {
    setPatientName('')
    setPatientAge('')
    setPatientGender('Male')
    setDiagnosis('')
    setSelectedTests([])
    setAdvice('')
    setFollowUp('')
    setMedicines([{ name: '', dosage: '', duration: '' }])
    try {
      sessionStorage.removeItem(`seam_rx_draft_${doctorId}`)
    } catch (e) {
      console.error(e)
    }
  }

  // Action: Open Preview Modal (Purely visual, ZERO database writes)
  const handleOpenPreview = () => {
    setPreviewOpened(true)
  }

  // Action: Save to Database ONLY on Print / Download PDF
  const handlePrint = async () => {
    if (activeDoctor) {
      try {
        setSavingRx(true)
        const res = await fetch('/api/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorId: activeDoctor.id,
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
          // Clear session draft upon successful print/save
          sessionStorage.removeItem(`seam_rx_draft_${doctorId}`)
        }
      } catch (err: unknown) {
        console.error('Failed to save prescription to DB on print:', err)
      } finally {
        setSavingRx(false)
      }
    }

    // Launch print dialog
    window.print()
  }

  // Format select data for Mantine Select
  const selectData = doctors.map(d => ({
    value: d.id,
    label: d.name
  }))

  // Custom Dropdown Option Renderer with Delete Cross Mark
  const renderSelectOption: SelectProps['renderOption'] = ({ option }) => (
    <Group justify="space-between" wrap="nowrap" style={{ width: '100%' }}>
      <Text size="sm" fw={500} style={{ color: '#0f172a' }}>{option.label}</Text>
      <ActionIcon
        size="xs"
        color="red"
        variant="subtle"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          handleDeleteDoctorById(option.value)
        }}
        title={`Delete ${option.label}`}
        style={{ opacity: 0.6 }}
      >
        x
      </ActionIcon>
    </Group>
  )

  return (
    <MantineProvider>
      <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a' }}>
        
        {/* Mantine Header */}
        <Paper
          shadow="xs"
          p="md"
          radius={0}
          withBorder
          className="hide-on-print"
          style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
        >
          <Container size="lg">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Badge color="blue" size="lg" radius="sm">Seam</Badge>
                <Title order={3} style={{ color: '#0f172a', fontWeight: 800 }}>Clinical Prescription Demo</Title>
              </Group>

              {/* Header Controls */}
              <Group gap="md">
                <Button component={Link} href={`/demo-doc/${doctorId}/history`} variant="outline" color="blue" size="sm">
                  View Past Prescriptions
                </Button>
              </Group>
            </Group>
          </Container>
        </Paper>

        {/* Main Content Workspace */}
        <Container size="lg" py="xl">
          
          {/* Timed Toast Banner Overlay */}
          {notification && (
            <Paper
              shadow="md"
              p="xs"
              px="md"
              radius="md"
              withBorder
              className="hide-on-print"
              style={{
                position: 'fixed',
                top: 24,
                right: 24,
                zIndex: 9999,
                background: '#ffffff',
                borderColor: notification.type === 'success' ? '#bbf7d0' : '#fecaca',
                borderLeft: `4px solid ${notification.type === 'success' ? '#16a34a' : '#dc2626'}`,
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
              }}
            >
              <Group justify="space-between" gap="md" wrap="nowrap">
                <Text size="sm" fw={600} style={{ color: notification.type === 'success' ? '#166534' : '#991b1b' }}>
                  {notification.message}
                </Text>
                <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setNotification(null)}>
                  x
                </ActionIcon>
              </Group>
            </Paper>
          )}

          {/* Active Doctor Banner */}
          {activeDoctor && (
            <Paper p="sm" px="md" radius="md" mb="md" withBorder style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <Group justify="space-between" align="center">
                <div>
                  <Group gap="xs">
                    <Text fw={700} style={{ color: '#0f172a' }}>{activeDoctor.name}</Text>
                    {activeDoctor.specialty && <Badge size="xs" color="blue" variant="light">{activeDoctor.specialty}</Badge>}
                  </Group>
                  <Text size="xs" c="dimmed">{activeDoctor.clinicName || 'Clinical Care'} - Reg No: {activeDoctor.regNumber || 'N/A'}</Text>
                </div>
                {activeDoctor.signatureDataUrl && (
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">Signature On File:</Text>
                    <img src={activeDoctor.signatureDataUrl} alt="Sig" style={{ height: 26, objectFit: 'contain' }} />
                  </Group>
                )}
              </Group>
            </Paper>
          )}

          {/* Form Card */}
          <Paper p="xl" radius="md" withBorder className="hide-on-print" style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
            
            <Group justify="space-between" mb="lg">
              <div>
                <Title order={2} style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Doctor Prescription Form</Title>
                <Text size="sm" style={{ color: '#64748b' }}>Enter clinical consultation details, then click Preview Prescription to review draft slip.</Text>
              </div>
            </Group>

            <Stack gap="lg">

              {/* Section 1: Patient Info */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9', background: '#ffffff' }}>
                <Title order={4} mb="sm" style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                  1. Patient Details
                </Title>
                <Grid>
                  <Grid.Col span={4}>
                    <TextInput
                      label="PATIENT NAME"
                      value={patientName}
                      onChange={e => setPatientName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput
                      label="AGE (YEARS)"
                      value={patientAge}
                      onChange={e => setPatientAge(e.target.value)}
                      placeholder="e.g. 35"
                      styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select
                      label="GENDER"
                      value={patientGender}
                      onChange={val => setPatientGender(val || 'Male')}
                      data={['Male', 'Female', 'Other']}
                      allowDeselect={false}
                      styles={{
                        input: { color: '#0f172a', backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: 600 },
                        label: { color: '#475569' },
                        option: { color: '#0f172a', fontWeight: 500 },
                        dropdown: { backgroundColor: '#ffffff' }
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Section 2: Clinical Findings & Diagnosis */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9', background: '#ffffff' }}>
                <Title order={4} mb="sm" style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                  2. Clinical Diagnosis & Complaints
                </Title>
                <Textarea
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="Describe patient symptoms and diagnosis..."
                  minRows={2}
                  styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' } }}
                />
              </Paper>

              {/* Section 3: Prescribed Medicines */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9', background: '#ffffff' }}>
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
                          <TextInput
                            value={m.name}
                            onChange={e => updateMedicineRow(idx, 'name', e.target.value)}
                            placeholder="e.g. Paracetamol 650mg"
                            styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' } }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            value={m.dosage}
                            onChange={e => updateMedicineRow(idx, 'dosage', e.target.value)}
                            placeholder="e.g. 1-0-1 after food"
                            styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' } }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            value={m.duration}
                            onChange={e => updateMedicineRow(idx, 'duration', e.target.value)}
                            placeholder="e.g. 5 days"
                            styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' } }}
                          />
                        </Table.Td>
                        <Table.Td>
                          {medicines.length > 1 && (
                            <Button size="xs" color="red" variant="subtle" onClick={() => removeMedicineRow(idx)}>
                              x
                            </Button>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>

              {/* Section 4: Prescribed Diagnostic Tests (Searchable MultiSelect Dropdown) */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9', background: '#ffffff' }}>
                <Title order={4} mb="sm" style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                  4. Prescribed Diagnostic Tests & Lab Investigations
                </Title>
                <MultiSelect
                  data={DIAGNOSTIC_TESTS_LIST}
                  value={selectedTests}
                  onChange={setSelectedTests}
                  placeholder="Search and select lab tests or imaging (e.g. CBC, HbA1c, Chest X-Ray)..."
                  searchable
                  clearable
                  nothingFoundMessage="No matching lab test found"
                  styles={{
                    input: { color: '#0f172a', backgroundColor: '#ffffff', borderColor: '#cbd5e1' },
                    dropdown: { backgroundColor: '#ffffff', borderColor: '#cbd5e1' },
                    option: { color: '#0f172a', fontWeight: 500 },
                    pill: { backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600, border: '1px solid #cbd5e1' }
                  }}
                />
              </Paper>

              {/* Section 5: Advice & Follow Up */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9', background: '#ffffff' }}>
                <Title order={4} mb="sm" style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                  5. Advice & Follow Up
                </Title>
                <Grid>
                  <Grid.Col span={8}>
                    <Textarea
                      label="ADVICE / INSTRUCTIONS"
                      value={advice}
                      onChange={e => setAdvice(e.target.value)}
                      placeholder="e.g. Rest, drink warm water, avoid cold food"
                      minRows={2}
                      styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput
                      label="FOLLOW UP"
                      value={followUp}
                      onChange={e => setFollowUp(e.target.value)}
                      placeholder="e.g. 5 days"
                      styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Form Action Buttons */}
              <Divider my="sm" />
              <Group justify="space-between">
                <Button variant="default" onClick={handleClearForm}>
                  Clear Form
                </Button>

                <Button
                  color="blue"
                  size="md"
                  onClick={handleOpenPreview}
                  disabled={!activeDoctor}
                >
                  Preview Prescription
                </Button>
              </Group>

            </Stack>
          </Paper>

          {/* Modal for Prescription Slip Preview */}
          <Modal
            opened={previewOpened}
            onClose={() => setPreviewOpened(false)}
            title={<Text fw={700} size="lg" style={{ color: '#0f172a' }}>Prescription Slip Preview</Text>}
            centered
            size="lg"
            styles={{ body: { color: '#0f172a', backgroundColor: '#ffffff' }, header: { backgroundColor: '#ffffff', color: '#0f172a' } }}
          >
            <Paper p="lg" radius="sm" withBorder style={{ borderColor: '#cbd5e1', background: '#ffffff', color: '#0f172a' }}>
              
              {/* Doctor Header */}
              <Group justify="space-between" align="flex-start" mb="md" style={{ borderBottom: '2px solid #0f172a', paddingBottom: 12 }}>
                <div>
                  <Text fw={800} size="lg" style={{ color: '#0f172a' }}>{activeDoctor?.name || 'Dr. Medical Practitioner'}</Text>
                  <Text size="xs" style={{ color: '#475569' }}>{activeDoctor?.specialty}</Text>
                  <Text size="xs" style={{ color: '#475569' }}>Reg No: {activeDoctor?.regNumber}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text fw={700} size="md" style={{ color: '#2563eb' }}>{activeDoctor?.clinicName || 'Clinical Care'}</Text>
                  <Text size="xs" style={{ color: '#475569' }}>Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </div>
              </Group>

              {/* Patient Bar */}
              <Paper p="xs" radius="xs" mb="md" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                <Group justify="space-between">
                  <Text size="sm" style={{ color: '#0f172a' }}><strong>Patient Name:</strong> {patientName || 'Unspecified Patient'}</Text>
                  <Text size="sm" style={{ color: '#0f172a' }}><strong>Age/Gender:</strong> {patientAge ? `${patientAge} Yrs` : 'N/A'} / {patientGender}</Text>
                </Group>
              </Paper>

              {/* Clinical Diagnosis */}
              {diagnosis && (
                <Stack gap={4} mb="md">
                  <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Diagnosis & Clinical Findings</Text>
                  <Text size="sm" style={{ color: '#0f172a' }}>{diagnosis}</Text>
                </Stack>
              )}

              {/* Prescribed Medications */}
              <Stack gap={4} mb="md">
                <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Prescribed Medications</Text>
                <Table withTableBorder withColumnBorders style={{ color: '#0f172a' }}>
                  <Table.Thead>
                    <Table.Tr style={{ background: '#f8fafc' }}>
                      <Table.Th style={{ fontSize: 12, color: '#0f172a' }}>#</Table.Th>
                      <Table.Th style={{ fontSize: 12, color: '#0f172a' }}>Medicine Name</Table.Th>
                      <Table.Th style={{ fontSize: 12, color: '#0f172a' }}>Dosage & Frequency</Table.Th>
                      <Table.Th style={{ fontSize: 12, color: '#0f172a' }}>Duration</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {medicines.map((m, i) => (
                      <Table.Tr key={i}>
                        <Table.Td style={{ fontSize: 12, color: '#0f172a' }}>{i + 1}</Table.Td>
                        <Table.Td style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{m.name || 'Unspecified Medicine'}</Table.Td>
                        <Table.Td style={{ fontSize: 12, color: '#0f172a' }}>{m.dosage || '-'}</Table.Td>
                        <Table.Td style={{ fontSize: 12, color: '#0f172a' }}>{m.duration || '-'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>

              {/* Prescribed Diagnostic Tests */}
              {selectedTests.length > 0 && (
                <Stack gap={4} mb="md">
                  <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Prescribed Diagnostic Tests & Investigations</Text>
                  <Group gap={6}>
                    {selectedTests.map((t, idx) => (
                      <Badge key={idx} variant="outline" color="gray" size="sm" radius="xs" style={{ color: '#0f172a', borderColor: '#cbd5e1' }}>
                        {t}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              )}

              {/* Advice */}
              {advice && (
                <Stack gap={4} mb="md">
                  <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Advice / Instructions</Text>
                  <Text size="sm" style={{ color: '#0f172a' }}>{advice}</Text>
                </Stack>
              )}

              {/* Follow Up */}
              {followUp && (
                <Stack gap={4} mb="md">
                  <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Follow Up</Text>
                  <Text size="sm" style={{ color: '#0f172a' }}>{followUp}</Text>
                </Stack>
              )}

              {/* Footer with Doctor Signature Rendering */}
              <Group justify="space-between" mt="xl" style={{ paddingTop: 20 }}>
                <Text size="xs" style={{ color: '#64748b' }}>Generated via Seam Clinical Platform</Text>
                <div style={{ textAlign: 'center', minWidth: 160 }}>
                  {activeDoctor?.signatureDataUrl ? (
                    <img
                      src={activeDoctor.signatureDataUrl}
                      alt="Doctor Signature"
                      style={{ height: 45, maxHeight: 50, objectFit: 'contain', marginBottom: 4, display: 'block', margin: '0 auto 4px auto' }}
                    />
                  ) : (
                    <div style={{ height: 35 }}></div>
                  )}
                  <div style={{ width: 150, borderTop: '1px solid #0f172a', margin: '0 auto 4px auto' }}></div>
                  <Text size="xs" style={{ color: '#64748b' }}>Doctor Signature / Stamp</Text>
                </div>
              </Group>

            </Paper>

            {/* Modal Actions */}
            <Group justify="space-between" mt="md">
              <Button variant="default" onClick={() => setPreviewOpened(false)}>
                Edit Prescription
              </Button>
              <Group>
                <Button
                  color="blue"
                  loading={savingRx}
                  onClick={handlePrint}
                >
                  Print / Download PDF
                </Button>
              </Group>
            </Group>
          </Modal>

        </Container>
      </div>
    </MantineProvider>
  )
}
