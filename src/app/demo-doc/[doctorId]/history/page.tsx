'use client'

import { useState, useEffect, useCallback, use } from 'react'
import {
  MantineProvider,
  Container,
  Paper,
  Group,
  Title,
  Text,
  Button,
  Modal,
  Badge,
  Table,
  Stack,
  ActionIcon
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
}

interface MedicineRow {
  name: string
  dosage: string
  duration: string
}

interface Prescription {
  id: string
  doctorId: string
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

export default function DoctorPrescriptionHistoryPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params)

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal states
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null)
  const [previewOpened, setPreviewOpened] = useState(false)

  // Delete Modal states
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [rxToDelete, setRxToDelete] = useState<Prescription | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Trigger floating toast notification
  const triggerNotification = (type: 'success' | 'error', message: string, durationMs = 3000) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, durationMs)
  }

  // Fetch doctor and prescriptions
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch Doctor
      const docRes = await fetch(`/api/doctors/${doctorId}`)
      const docData = await docRes.json()
      if (docData.success && docData.doctor) {
        setDoctor(docData.doctor)
      }

      // 2. Fetch Doctor's Prescriptions
      const rxRes = await fetch(`/api/prescriptions?doctorId=${doctorId}`)
      const rxData = await rxRes.json()
      if (rxData.success && rxData.prescriptions) {
        setPrescriptions(rxData.prescriptions)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Open Delete Confirmation Modal
  const promptDeletePrescription = (rx: Prescription) => {
    setRxToDelete(rx)
    setDeleteModalOpened(true)
  }

  // Execute Delete Prescription
  const confirmDeletePrescription = async () => {
    if (!rxToDelete) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/prescriptions/${rxToDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setPrescriptions(prev => prev.filter(p => p.id !== rxToDelete.id))
        setDeleteModalOpened(false)
        setRxToDelete(null)
        triggerNotification('success', 'Prescription record deleted.')
      } else {
        alert(data.error || 'Failed to delete prescription')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting prescription record')
    } finally {
      setDeleting(false)
    }
  }

  const handlePrint = () => {
    window.print()
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

        {/* Header */}
        <Paper shadow="xs" p="md" radius={0} withBorder className="hide-on-print" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
          <Container size="lg">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Badge color="blue" size="lg" radius="sm">Seam</Badge>
                <Title order={3} style={{ color: '#0f172a', fontWeight: 800 }}>Prescription History</Title>
              </Group>
              <Button component={Link} href={`/demo-doc/${doctorId}`} variant="outline" color="blue" size="xs">
                Back to Prescriber
              </Button>
            </Group>
          </Container>
        </Paper>

        {/* Workspace */}
        <Container size="lg" py="xl">
          
          {/* Doctor Banner */}
          {doctor && (
            <Paper p="md" radius="md" mb="lg" withBorder style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
              <Group justify="space-between" align="center">
                <div>
                  <Group gap="xs">
                    <Text fw={700} size="lg" style={{ color: '#0f172a' }}>{doctor.name}</Text>
                    {doctor.specialty && <Badge size="sm" color="blue" variant="light">{doctor.specialty}</Badge>}
                  </Group>
                  <Text size="xs" c="dimmed">{doctor.clinicName || 'Clinical Care'} - Reg No: {doctor.regNumber || 'N/A'}</Text>
                </div>
                <Badge variant="outline" color="gray">Total Saved Prescriptions: {prescriptions.length}</Badge>
              </Group>
            </Paper>
          )}

          {/* Prescriptions Table */}
          <Paper p="xl" radius="md" withBorder style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
            <Title order={4} mb="md" style={{ color: '#0f172a', fontWeight: 800 }}>Past Patient Prescriptions</Title>

            {loading ? (
              <Text size="sm" c="dimmed" py="xl" style={{ textAlign: 'center' }}>Loading saved prescriptions from Neon DB...</Text>
            ) : prescriptions.length === 0 ? (
              <Paper p="xl" style={{ textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                <Text fw={600} mb="xs">No past prescriptions found for this doctor.</Text>
                <Button component={Link} href={`/demo-doc/${doctorId}`} color="blue" size="xs">
                  Create First Prescription
                </Button>
              </Paper>
            ) : (
              <Table highlightOnHover withTableBorder>
                <Table.Thead style={{ background: '#f8fafc' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: '#475569' }}>Date & Time</Table.Th>
                    <Table.Th style={{ color: '#475569' }}>Patient Details</Table.Th>
                    <Table.Th style={{ color: '#475569' }}>Diagnosis</Table.Th>
                    <Table.Th style={{ color: '#475569' }}>Prescribed Medicines</Table.Th>
                    <Table.Th style={{ color: '#475569', textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {prescriptions.map(rx => (
                    <Table.Tr key={rx.id}>
                      <Table.Td style={{ whiteSpace: 'nowrap' }}>
                        <Text size="sm" fw={600}>{new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                        <Text size="xs" c="dimmed">{new Date(rx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={700} style={{ color: '#0f172a' }}>{rx.patientName}</Text>
                        <Text size="xs" c="dimmed">{rx.patientAge ? `${rx.patientAge} Yrs` : ''} {rx.patientGender}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{rx.diagnosis || 'General OPD'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {rx.medicines.map((m, idx) => (
                            <Badge key={idx} size="xs" variant="gray" radius="xs">
                              {m.name}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group justify="flex-end" gap="xs">
                          <Button size="xs" variant="default" onClick={() => { setSelectedRx(rx); setPreviewOpened(true); }}>
                            View Slip
                          </Button>
                          <ActionIcon size="sm" color="red" variant="subtle" onClick={() => promptDeletePrescription(rx)} title="Delete Prescription">
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

          {/* Modal for Past Prescription Slip Preview */}
          <Modal
            opened={previewOpened}
            onClose={() => setPreviewOpened(false)}
            title={<Text fw={700} size="lg" style={{ color: '#0f172a' }}>Prescription Slip</Text>}
            centered
            size="lg"
            styles={{ body: { color: '#0f172a', backgroundColor: '#ffffff' }, header: { backgroundColor: '#ffffff', color: '#0f172a' } }}
          >
            {selectedRx && (
              <Paper p="lg" radius="sm" withBorder style={{ borderColor: '#cbd5e1', background: '#ffffff', color: '#0f172a' }}>
                <Group justify="space-between" align="flex-start" mb="md" style={{ borderBottom: '2px solid #0f172a', paddingBottom: 12 }}>
                  <div>
                    <Text fw={800} size="lg" style={{ color: '#0f172a' }}>{doctor?.name || 'Dr. Medical Practitioner'}</Text>
                    <Text size="xs" style={{ color: '#475569' }}>{doctor?.specialty}</Text>
                    <Text size="xs" style={{ color: '#475569' }}>Reg No: {doctor?.regNumber}</Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text fw={700} size="md" style={{ color: '#2563eb' }}>{doctor?.clinicName || 'Clinical Care'}</Text>
                    <Text size="xs" style={{ color: '#475569' }}>Date: {new Date(selectedRx.createdAt).toLocaleDateString('en-IN')}</Text>
                  </div>
                </Group>

                <Paper p="xs" radius="xs" mb="md" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                  <Group justify="space-between">
                    <Text size="sm" style={{ color: '#0f172a' }}><strong>Patient Name:</strong> {selectedRx.patientName}</Text>
                    <Text size="sm" style={{ color: '#0f172a' }}><strong>Age/Gender:</strong> {selectedRx.patientAge} Yrs / {selectedRx.patientGender}</Text>
                  </Group>
                </Paper>

                {selectedRx.diagnosis && (
                  <Stack gap={4} mb="md">
                    <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Diagnosis</Text>
                    <Text size="sm" style={{ color: '#0f172a' }}>{selectedRx.diagnosis}</Text>
                  </Stack>
                )}

                <Stack gap={4} mb="md">
                  <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Prescribed Medications</Text>
                  <Table withTableBorder withColumnBorders style={{ color: '#0f172a' }}>
                    <Table.Thead>
                      <Table.Tr style={{ background: '#f8fafc' }}>
                        <Table.Th style={{ fontSize: 12, color: '#0f172a' }}>#</Table.Th>
                        <Table.Th style={{ fontSize: 12, color: '#0f172a' }}>Medicine Name</Table.Th>
                        <Table.Th style={{ fontSize: 12, color: '#0f172a' }}>Dosage</Table.Th>
                        <Table.Th style={{ fontSize: 12, color: '#0f172a' }}>Duration</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedRx.medicines.map((m, i) => (
                        <Table.Tr key={i}>
                          <Table.Td style={{ fontSize: 12, color: '#0f172a' }}>{i + 1}</Table.Td>
                          <Table.Td style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{m.name}</Table.Td>
                          <Table.Td style={{ fontSize: 12, color: '#0f172a' }}>{m.dosage || '-'}</Table.Td>
                          <Table.Td style={{ fontSize: 12, color: '#0f172a' }}>{m.duration || '-'}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Stack>

                {selectedRx.tests && (
                  <Stack gap={4} mb="md">
                    <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Prescribed Diagnostic Tests & Investigations</Text>
                    <Text size="sm" style={{ color: '#0f172a' }}>{selectedRx.tests}</Text>
                  </Stack>
                )}

                {selectedRx.advice && (
                  <Stack gap={4} mb="md">
                    <Text fw={700} size="xs" style={{ textTransform: 'uppercase', color: '#475569' }}>Advice</Text>
                    <Text size="sm" style={{ color: '#0f172a' }}>{selectedRx.advice}</Text>
                  </Stack>
                )}

                <Group justify="space-between" mt="xl" style={{ paddingTop: 20 }}>
                  <Text size="xs" style={{ color: '#64748b' }}>Generated via Seam Clinical Platform</Text>
                  <div style={{ textAlign: 'center', minWidth: 160 }}>
                    {doctor?.signatureDataUrl ? (
                      <img src={doctor.signatureDataUrl} alt="Sig" style={{ height: 40, objectFit: 'contain', marginBottom: 4, margin: '0 auto' }} />
                    ) : (
                      <div style={{ height: 35 }}></div>
                    )}
                    <div style={{ width: 150, borderTop: '1px solid #0f172a', margin: '0 auto 4px auto' }}></div>
                    <Text size="xs" style={{ color: '#64748b' }}>Doctor Signature / Stamp</Text>
                  </div>
                </Group>
              </Paper>
            )}

            <Group justify="flex-end" mt="md">
              <Button color="blue" onClick={handlePrint}>Print / Download PDF</Button>
            </Group>
          </Modal>

          {/* Mantine Confirmation Modal for Prescription Deletion */}
          <Modal
            opened={deleteModalOpened}
            onClose={() => { setDeleteModalOpened(false); setRxToDelete(null); }}
            title={<Text fw={700} size="md" style={{ color: '#0f172a' }}>Delete Prescription Record</Text>}
            centered
            size="sm"
            styles={{ body: { color: '#0f172a', backgroundColor: '#ffffff' }, header: { backgroundColor: '#ffffff', color: '#0f172a' } }}
          >
            <Stack gap="md">
              <Text size="sm" style={{ color: '#475569' }}>
                Are you sure you want to delete the prescription for <strong>{rxToDelete?.patientName || 'this patient'}</strong>? This action cannot be undone.
              </Text>
              <Group justify="flex-end" gap="xs">
                <Button variant="default" size="xs" onClick={() => { setDeleteModalOpened(false); setRxToDelete(null); }}>
                  Cancel
                </Button>
                <Button color="red" size="xs" loading={deleting} onClick={confirmDeletePrescription}>
                  Delete Record
                </Button>
              </Group>
            </Stack>
          </Modal>

        </Container>
      </div>
    </MantineProvider>
  )
}
