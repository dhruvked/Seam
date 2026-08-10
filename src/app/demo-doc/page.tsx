'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MantineProvider,
  Container,
  Paper,
  Group,
  Title,
  Text,
  Select,
  Button,
  Modal,
  TextInput,
  Textarea,
  Grid,
  Badge,
  Table,
  Stack,
  Notification,
  Divider,
  SegmentedControl,
  ActionIcon,
  SelectProps
} from '@mantine/core'

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

export default function DemoDocPage() {
  // Doctors List & Selection
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  // Modals & UI State
  const [modalOpened, setModalOpened] = useState(false)
  const [previewOpened, setPreviewOpened] = useState(false)
  const [creatingDoctor, setCreatingDoctor] = useState(false)
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: 'MBBS, MD',
    regNumber: '',
    clinicName: '',
    clinicAddress: '',
    signatureDataUrl: ''
  })

  // Canvas Drawing & Upload State for Signature
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw')
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Active Selected Doctor Profile
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null)

  // Patient & Clinical Form State
  const [patientName, setPatientName] = useState('Rahul Sharma')
  const [patientAge, setPatientAge] = useState('35')
  const [patientGender, setPatientGender] = useState('Male')

  const [diagnosis, setDiagnosis] = useState('Acute Viral Upper Respiratory Infection')
  const [advice, setAdvice] = useState('Drink warm fluids, rest for 3 days, gargle with warm saline.')
  const [followUp, setFollowUp] = useState('5 days')

  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { name: 'Paracetamol 650mg', dosage: '1-0-1 after food', duration: '5 days' },
    { name: 'Cetirizine 10mg', dosage: '0-0-1 after food', duration: '5 days' }
  ])

  // Email state
  const [emailSending, setEmailSending] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch doctors list from API
  const fetchDoctors = useCallback(async () => {
    setLoadingDoctors(true)
    try {
      const res = await fetch('/api/doctors')
      const data = await res.json()
      if (data.success && data.doctors) {
        setDoctors(data.doctors)
        if (data.doctors.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(data.doctors[0].id)
          setActiveDoctor(data.doctors[0])
        }
      }
    } catch (err) {
      console.error('Failed to load doctors:', err)
    } finally {
      setLoadingDoctors(false)
    }
  }, [selectedDoctorId])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  // Handle doctor dropdown select
  const handleSelectDoctor = (id: string | null) => {
    setSelectedDoctorId(id)
    const found = doctors.find(d => d.id === id) || null
    setActiveDoctor(found)
  }

  // Handle Canvas Signature Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false)
      const dataUrl = canvasRef.current.toDataURL('image/png')
      setNewDoctor(prev => ({ ...prev, signatureDataUrl: dataUrl }))
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setNewDoctor(prev => ({ ...prev, signatureDataUrl: '' }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setNewDoctor(prev => ({ ...prev, signatureDataUrl: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Timed Notification Overlay Helper (auto-dismisses after 3 seconds)
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const triggerNotification = (type: 'success' | 'error', message: string, durationMs = 3000) => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current)
    setNotification({ type, message })
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null)
    }, durationMs)
  }

  // Handle create new doctor submit
  const handleCreateDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDoctor.name || !newDoctor.email) {
      alert('Name and Email are required.')
      return
    }

    setCreatingDoctor(true)
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoctor)
      })
      const data = await res.json()
      if (data.success && data.doctor) {
        setDoctors(prev => [...prev, data.doctor])
        setSelectedDoctorId(data.doctor.id)
        setActiveDoctor(data.doctor)
        setModalOpened(false)
        setNewDoctor({
          name: '',
          email: '',
          phone: '',
          specialty: 'MBBS, MD',
          regNumber: '',
          clinicName: '',
          clinicAddress: '',
          signatureDataUrl: ''
        })
        triggerNotification('success', `Doctor ${data.doctor.name} registered successfully!`)
      } else {
        alert(data.error || 'Failed to create doctor')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating doctor record')
    } finally {
      setCreatingDoctor(false)
    }
  }

  // Medicine table handlers
  const addMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '1-0-1 after food', duration: '5 days' }])
  }

  const removeMedicineRow = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index))
  }

  const updateMedicineRow = (index: number, field: keyof MedicineRow, val: string) => {
    const updated = [...medicines]
    updated[index][field] = val
    setMedicines(updated)
  }

  // Action: Print PDF
  const handlePrint = () => {
    window.print()
  }

  // Action: Send Email
  const handleSendEmail = async () => {
    if (!activeDoctor?.email) {
      alert('Please select or enter a doctor email address.')
      return
    }

    setEmailSending(true)
    setNotification(null)

    try {
      const res = await fetch('/api/send-rx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: activeDoctor.name,
          doctorEmail: activeDoctor.email,
          patientName,
          patientAge,
          patientGender,
          diagnosis,
          medicines,
          advice,
          followUp
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send email')

      triggerNotification('success', `Prescription sent to ${activeDoctor.email}`)
      setPreviewOpened(false)
    } catch (err: unknown) {
      triggerNotification('error', err instanceof Error ? err.message : 'Error sending email')
    } finally {
      setEmailSending(false)
    }
  }

  // Subtle Delete Doctor by ID Handler
  const handleDeleteDoctorById = async (id: string) => {
    const target = doctors.find(d => d.id === id)
    if (!target) return
    const confirmDelete = window.confirm(`Are you sure you want to delete ${target.name}?`)
    if (!confirmDelete) return

    try {
      const res = await fetch(`/api/doctors/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        const remaining = doctors.filter(d => d.id !== id)
        setDoctors(remaining)
        if (selectedDoctorId === id) {
          if (remaining.length > 0) {
            setSelectedDoctorId(remaining[0].id)
            setActiveDoctor(remaining[0])
          } else {
            setSelectedDoctorId(null)
            setActiveDoctor(null)
          }
        }
        triggerNotification('success', `Doctor ${target.name} deleted.`)
      } else {
        alert(data.error || 'Failed to delete doctor')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting doctor profile')
    }
  }

  // Format select data for Mantine Select (ONLY Doctor Name, no clinic name)
  const selectData = doctors.map(d => ({
    value: d.id,
    label: d.name
  }))

  // Custom Dropdown Option Renderer with Subtle Delete Cross Mark
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
        ✕
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

              {/* Header Action Controls */}
              <Group gap="md">
                <Select
                  placeholder={loadingDoctors ? 'Loading Doctors...' : 'Select Doctor'}
                  data={selectData}
                  value={selectedDoctorId}
                  onChange={handleSelectDoctor}
                  allowDeselect={false}
                  renderOption={renderSelectOption}
                  style={{ width: 240 }}
                  styles={{
                    input: {
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      fontWeight: 600,
                      cursor: 'pointer'
                    },
                    option: {
                      color: '#0f172a',
                      fontWeight: 500
                    },
                    dropdown: {
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1'
                    }
                  }}
                />
                
                <Button color="blue" variant="light" onClick={() => setModalOpened(true)}>
                  + Create New Doctor
                </Button>
              </Group>
            </Group>
          </Container>
        </Paper>

        {/* Main Content Workspace */}
        <Container size="lg" py="xl">
          
          {/* Timed Floating Toast Banner Overlay */}
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
                  {notification.type === 'success' ? '✓' : '⚠️'} {notification.message}
                </Text>
                <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setNotification(null)}>
                  ✕
                </ActionIcon>
              </Group>
            </Paper>
          )}

          {/* Form Card */}
          <Paper p="xl" radius="md" withBorder className="hide-on-print" style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
            
            <Group justify="space-between" mb="lg">
              <div>
                <Title order={2} style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Doctor Prescription Form</Title>
                <Text size="sm" style={{ color: '#64748b' }}>Select a doctor from the header or create a new doctor profile, then click Preview Prescription.</Text>
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
                    3. Prescribed Medications (Rx)
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
                              ✕
                            </Button>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>

              {/* Section 4: Advice & Follow Up */}
              <Paper p="md" radius="sm" withBorder style={{ borderColor: '#f1f5f9', background: '#ffffff' }}>
                <Title order={4} mb="sm" style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
                  4. Advice & Follow Up
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

              {/* Form Action Buttons (ONLY Clear Form and Preview Prescription) */}
              <Divider my="sm" />
              <Group justify="space-between">
                <Button variant="default" onClick={() => {
                  setDiagnosis('')
                  setAdvice('')
                  setFollowUp('')
                  setMedicines([{ name: '', dosage: '1-0-1 after food', duration: '5 days' }])
                }}>
                  Clear Form
                </Button>

                <Button
                  color="blue"
                  size="md"
                  onClick={() => setPreviewOpened(true)}
                  disabled={!activeDoctor}
                >
                  🔍 Preview Prescription
                </Button>
              </Group>

            </Stack>
          </Paper>

          {/* Modal for Prescription Slip Preview (With Doctor Signature Rendering) */}
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
                  <Text size="sm" style={{ color: '#0f172a' }}><strong>Patient Name:</strong> {patientName}</Text>
                  <Text size="sm" style={{ color: '#0f172a' }}><strong>Age/Gender:</strong> {patientAge} Yrs / {patientGender}</Text>
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
                <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Prescribed Medications (Rx)</Text>
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
                        <Table.Td style={{ fontSize: 12, color: '#0f172a' }}>{m.dosage}</Table.Td>
                        <Table.Td style={{ fontSize: 12, color: '#0f172a' }}>{m.duration}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>

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
                ✏ Edit Prescription
              </Button>
              <Group>
                <Button
                  color="green"
                  loading={emailSending}
                  onClick={handleSendEmail}
                >
                  ✉ Email Prescription
                </Button>
                <Button
                  color="blue"
                  onClick={handlePrint}
                >
                  🖨 Print / Download PDF
                </Button>
              </Group>
            </Group>
          </Modal>

          {/* Modal for Creating New Doctor (With Signature Canvas & Upload) */}
          <Modal
            opened={modalOpened}
            onClose={() => setModalOpened(false)}
            title={<Text fw={700} size="lg" style={{ color: '#0f172a' }}>Create New Doctor Profile</Text>}
            centered
            size="md"
            styles={{ body: { color: '#0f172a', backgroundColor: '#ffffff' }, header: { backgroundColor: '#ffffff', color: '#0f172a' } }}
          >
            <form onSubmit={handleCreateDoctorSubmit}>
              <Stack gap="sm">
                <TextInput
                  label="Doctor Full Name *"
                  placeholder="e.g. Dr. Ananya Singh"
                  required
                  value={newDoctor.name}
                  onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                />
                <TextInput
                  label="Email Address *"
                  type="email"
                  placeholder="e.g. doctor@clinic.com"
                  required
                  value={newDoctor.email}
                  onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })}
                  styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                />
                <TextInput
                  label="Phone Number"
                  placeholder="e.g. +91 98200 12345"
                  value={newDoctor.phone}
                  onChange={e => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                  styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                />
                <TextInput
                  label="Specialty & Qualifications"
                  placeholder="e.g. MBBS, MD (Internal Medicine)"
                  value={newDoctor.specialty}
                  onChange={e => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                  styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                />
                <TextInput
                  label="Medical Council Registration No."
                  placeholder="e.g. MCI-2020-99881"
                  value={newDoctor.regNumber}
                  onChange={e => setNewDoctor({ ...newDoctor, regNumber: e.target.value })}
                  styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                />
                <TextInput
                  label="Clinic / Hospital Name"
                  placeholder="e.g. Apollo Health Clinic"
                  value={newDoctor.clinicName}
                  onChange={e => setNewDoctor({ ...newDoctor, clinicName: e.target.value })}
                  styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                />

                {/* Doctor Signature Component (Draw or Upload) */}
                <Paper p="sm" radius="xs" withBorder style={{ borderColor: '#cbd5e1', background: '#f8fafc' }}>
                  <Group justify="space-between" mb="xs">
                    <Text fw={700} size="xs" style={{ color: '#475569', textTransform: 'uppercase' }}>
                      Doctor Digital Signature / Stamp
                    </Text>
                    <SegmentedControl
                      size="xs"
                      value={signatureMode}
                      onChange={val => setSignatureMode(val as 'draw' | 'upload')}
                      data={[
                        { label: '🖋 Draw Signature', value: 'draw' },
                        { label: '📁 Upload Image', value: 'upload' }
                      ]}
                    />
                  </Group>

                  {signatureMode === 'draw' ? (
                    <div>
                      <div style={{ background: '#ffffff', border: '1px dashed #94a3b8', borderRadius: 6, position: 'relative' }}>
                        <canvas
                          ref={canvasRef}
                          width={380}
                          height={100}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          style={{ width: '100%', height: 100, cursor: 'crosshair', display: 'block' }}
                        />
                      </div>
                      <Group justify="space-between" mt="xs">
                        <Text size="xs" c="dimmed">Draw signature inside the box using mouse or touch.</Text>
                        <Button size="xs" variant="subtle" color="red" onClick={clearCanvas}>Clear Signature</Button>
                      </Group>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ fontSize: 13, display: 'block', margin: '8px 0' }}
                      />
                      <Text size="xs" c="dimmed">Upload a transparent PNG or scanned signature image.</Text>
                    </div>
                  )}

                  {newDoctor.signatureDataUrl && (
                    <Paper p="xs" mt="xs" style={{ background: '#ffffff', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                      <Text size="xs" color="teal" fw={600}>✓ Signature Preview Attached</Text>
                      <img src={newDoctor.signatureDataUrl} alt="Signature Preview" style={{ height: 35, objectFit: 'contain', marginTop: 4 }} />
                    </Paper>
                  )}
                </Paper>

                <Group justify="flex-end" mt="md">
                  <Button variant="default" onClick={() => setModalOpened(false)}>Cancel</Button>
                  <Button type="submit" color="blue" loading={creatingDoctor}>Save Doctor</Button>
                </Group>
              </Stack>
            </form>
          </Modal>

        </Container>
      </div>
    </MantineProvider>
  )
}
