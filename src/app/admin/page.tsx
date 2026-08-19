'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MantineProvider,
  Container,
  Paper,
  Group,
  Title,
  Text,
  Button,
  Modal,
  TextInput,
  Textarea,
  Badge,
  Table,
  Stack,
  SegmentedControl,
  ActionIcon,
  Tooltip
} from '@mantine/core'
import Link from 'next/link'

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
  createdAt: string
}

export default function AdminPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpened, setModalOpened] = useState(false)
  const [creating, setCreating] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Delete confirmation modal states
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [doctorToDelete, setDoctorToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deletingDoctor, setDeletingDoctor] = useState(false)

  // New Doctor Form State
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: 'MBBS, MD (General Medicine)',
    regNumber: '',
    clinicName: '',
    clinicAddress: '',
    signatureDataUrl: ''
  })

  // Canvas Signature state
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw')
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Notification helper
  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  // Fetch doctors list
  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/doctors')
      const data = await res.json()
      if (data.success && data.doctors) {
        setDoctors(data.doctors)
      }
    } catch (err) {
      console.error(err)
      triggerNotification('error', 'Failed to load doctors list')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  // Signature Canvas Drawing Handlers
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

  // Create Doctor submit
  const handleCreateDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDoctor.name || !newDoctor.email) {
      alert('Name and Email are required.')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoctor)
      })
      const data = await res.json()
      if (data.success && data.doctor) {
        setDoctors(prev => [...prev, data.doctor])
        setModalOpened(false)
        setNewDoctor({
          name: '',
          email: '',
          phone: '',
          specialty: 'MBBS, MD (General Medicine)',
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
      setCreating(false)
    }
  }

  // Prompt delete doctor modal
  const promptDeleteDoctor = (id: string, name: string) => {
    setDoctorToDelete({ id, name })
    setDeleteModalOpened(true)
  }

  // Confirm delete doctor execution
  const confirmDeleteDoctor = async () => {
    if (!doctorToDelete) return
    setDeletingDoctor(true)

    try {
      const res = await fetch(`/api/doctors/${doctorToDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setDoctors(prev => prev.filter(d => d.id !== doctorToDelete.id))
        setDeleteModalOpened(false)
        triggerNotification('success', `Doctor ${doctorToDelete.name} deleted.`)
        setDoctorToDelete(null)
      } else {
        alert(data.error || 'Failed to delete doctor')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting doctor profile')
    } finally {
      setDeletingDoctor(false)
    }
  }

  // Copy prescription link
  const copyRxLink = (doctorId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${origin}/demo-doc/${doctorId}`
    navigator.clipboard.writeText(link)
    triggerNotification('success', 'Prescription link copied to clipboard!')
  }

  return (
    <MantineProvider>
      <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
        
        {/* Toast Notification */}
        {notification && (
          <Paper
            shadow="md"
            p="xs"
            px="md"
            radius="md"
            withBorder
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              background: '#ffffff',
              borderColor: notification.type === 'success' ? '#bbf7d0' : '#fecaca',
              borderLeft: `4px solid ${notification.type === 'success' ? '#16a34a' : '#dc2626'}`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
            }}
          >
            <Group justify="space-between" gap="md" wrap="nowrap">
              <Text size="sm" fw={600} style={{ color: notification.type === 'success' ? '#166534' : '#991b1b' }}>
                {notification.message}
              </Text>
              <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setNotification(null)}>x</ActionIcon>
            </Group>
          </Paper>
        )}

        {/* Top Navigation */}
        <Paper shadow="xs" p="md" radius={0} withBorder style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
          <Container size="lg">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Badge color="blue" size="lg" radius="sm">Seam</Badge>
                <Title order={3} style={{ color: '#0f172a', fontWeight: 800 }}>Admin & Doctor Directory</Title>
              </Group>
              <Group>
                {doctors.length > 0 && (
                  <Button component={Link} href={`/demo-doc/${doctors[0].id}`} variant="light" color="blue">
                    Launch Rx Demo
                  </Button>
                )}
                <Button color="blue" onClick={() => setModalOpened(true)}>
                  + Register New Doctor
                </Button>
              </Group>
            </Group>
          </Container>
        </Paper>

        {/* Main Body Workspace */}
        <Container size="lg" py="xl">
          <Paper p="xl" radius="md" withBorder style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
            
            <Group justify="space-between" mb="lg">
              <div>
                <Title order={2} style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Registered Doctors</Title>
                <Text size="sm" style={{ color: '#64748b' }}>
                  Manage doctor profiles, register new clinicians, and generate custom prescription links (/demo-doc/[doctorId]).
                </Text>
              </div>
              <Badge variant="outline" color="gray" size="lg">Total: {doctors.length} Doctors</Badge>
            </Group>

            {loading ? (
              <Text size="sm" c="dimmed" py="xl" style={{ textAlign: 'center' }}>Loading registered doctors from Neon DB...</Text>
            ) : doctors.length === 0 ? (
              <Paper p="xl" style={{ textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                <Text fw={600} mb="xs">No doctors registered yet.</Text>
                <Button color="blue" size="xs" onClick={() => setModalOpened(true)}>+ Register First Doctor</Button>
              </Paper>
            ) : (
              <Table highlightOnHover withTableBorder>
                <Table.Thead style={{ background: '#f8fafc' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: '#475569' }}>Doctor Name</Table.Th>
                    <Table.Th style={{ color: '#475569' }}>Specialty & Reg No</Table.Th>
                    <Table.Th style={{ color: '#475569' }}>Clinic Name</Table.Th>
                    <Table.Th style={{ color: '#475569' }}>Signature</Table.Th>
                    <Table.Th style={{ color: '#475569', textAlign: 'right' }}>Actions & Rx Link</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {doctors.map(d => (
                    <Table.Tr key={d.id}>
                      <Table.Td>
                        <Text fw={700} style={{ color: '#0f172a' }}>{d.name}</Text>
                        <Text size="xs" c="dimmed">{d.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{d.specialty || 'General Practitioner'}</Text>
                        <Text size="xs" c="dimmed">Reg: {d.regNumber || 'N/A'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{d.clinicName || 'Clinical Care'}</Text>
                      </Table.Td>
                      <Table.Td>
                        {d.signatureDataUrl ? (
                          <img src={d.signatureDataUrl} alt="Sig" style={{ height: 28, objectFit: 'contain' }} />
                        ) : (
                          <Text size="xs" c="dimmed">No sig</Text>
                        )}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group justify="flex-end" gap="xs">
                          <Tooltip label="Copy Direct Prescription Link">
                            <Button size="xs" variant="default" onClick={() => copyRxLink(d.id)}>
                              Copy Link
                            </Button>
                          </Tooltip>
                          <Button size="xs" variant="light" color="blue" component={Link} href={`/demo-doc/${d.id}`}>
                            Open Rx Form
                          </Button>
                          <ActionIcon size="sm" color="red" variant="subtle" onClick={() => promptDeleteDoctor(d.id, d.name)}>
                            x
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}

          </Paper>

          {/* Modal for Registering New Doctor */}
          <Modal
            opened={modalOpened}
            onClose={() => setModalOpened(false)}
            title={<Text fw={700} size="lg" style={{ color: '#0f172a' }}>Register New Doctor Profile</Text>}
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
                <Textarea
                  label="Clinic Address"
                  placeholder="e.g. SV Road, Andheri West, Mumbai"
                  value={newDoctor.clinicAddress}
                  onChange={e => setNewDoctor({ ...newDoctor, clinicAddress: e.target.value })}
                  minRows={2}
                  styles={{ input: { color: '#0f172a', backgroundColor: '#ffffff' }, label: { color: '#475569' } }}
                />

                {/* Signature Drawing / Upload Component */}
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
                        { label: 'Draw Signature', value: 'draw' },
                        { label: 'Upload Image', value: 'upload' }
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
                      <Text size="xs" color="teal" fw={600}>Signature Preview Attached</Text>
                      <img src={newDoctor.signatureDataUrl} alt="Signature Preview" style={{ height: 35, objectFit: 'contain', marginTop: 4 }} />
                    </Paper>
                  )}
                </Paper>

                <Group justify="flex-end" mt="md">
                  <Button variant="default" onClick={() => setModalOpened(false)}>Cancel</Button>
                  <Button type="submit" color="blue" loading={creating}>Save Doctor Profile</Button>
                </Group>
              </Stack>
            </form>
          </Modal>

          {/* Mantine Confirmation Modal for Doctor Deletion */}
          <Modal
            opened={deleteModalOpened}
            onClose={() => { setDeleteModalOpened(false); setDoctorToDelete(null); }}
            title={<Text fw={700} size="md" style={{ color: '#0f172a' }}>Delete Doctor Profile</Text>}
            centered
            size="sm"
            styles={{ body: { color: '#0f172a', backgroundColor: '#ffffff' }, header: { backgroundColor: '#ffffff', color: '#0f172a' } }}
          >
            <Stack gap="md">
              <Text size="sm" style={{ color: '#475569' }}>
                Are you sure you want to delete profile for <strong>{doctorToDelete?.name}</strong>? This action cannot be undone.
              </Text>
              <Group justify="flex-end" gap="xs">
                <Button variant="default" size="xs" onClick={() => { setDeleteModalOpened(false); setDoctorToDelete(null); }}>
                  Cancel
                </Button>
                <Button color="red" size="xs" loading={deletingDoctor} onClick={confirmDeleteDoctor}>
                  Delete Doctor
                </Button>
              </Group>
            </Stack>
          </Modal>

        </Container>
      </div>
    </MantineProvider>
  )
}
