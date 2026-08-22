'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MantineProvider,
  Container,
  Paper,
  Title,
  Text,
  Select,
  Button,
  Stack,
  Group
} from '@mantine/core'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Patient {
  id: string
  name: string
  phone?: string
  gender?: string
  age?: string
}

// Fallback demo patients if none exist in database yet
const DEFAULT_DEMO_PATIENTS: Patient[] = [
  { id: 'pat_demo_1', name: 'Rahul Sharma', phone: '+91 98200 12345', gender: 'Male', age: '35' },
  { id: 'pat_demo_2', name: 'Priya Patel', phone: '+91 98199 67890', gender: 'Female', age: '29' },
  { id: 'pat_demo_3', name: 'Amit Kumar', phone: '+91 98333 45678', gender: 'Male', age: '42' }
]

export default function DemoPatientSignInPage() {
  const router = useRouter()

  const [patients, setPatients] = useState<Patient[]>(DEFAULT_DEMO_PATIENTS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch registered patients from Neon DB
  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      if (data.success && data.patients && data.patients.length > 0) {
        setPatients(data.patients)
      } else {
        setPatients(DEFAULT_DEMO_PATIENTS)
      }
    } catch {
      setPatients(DEFAULT_DEMO_PATIENTS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // Format dropdown data
  const selectData = patients.map((p) => ({
    value: p.id,
    label: p.phone ? `${p.name} (${p.phone})` : p.name
  }))

  // Handle Sign In submission
  const handleSignIn = () => {
    if (!selectedId) return
    const selected = patients.find((p) => p.id === selectedId)
    if (!selected) return

    setSubmitting(true)
    sessionStorage.setItem('seam_patient_session', JSON.stringify(selected))

    setTimeout(() => {
      setSubmitting(false)
      router.push(`/demo-patient/dashboard?patientId=${selected.id}`)
    }, 300)
  }

  return (
    <MantineProvider>
      <div
        style={{
          minHeight: '100dvh',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}
      >
        {/* Native Mobile App Shell */}
        <Container
          size="xs"
          style={{
            width: '100%',
            maxWidth: 430,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100dvh'
          }}
        >
          <Paper
            p="xl"
            radius={0}
            style={{
              background: '#ffffff',
              minHeight: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '28px 24px 32px 24px',
              borderLeft: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0'
            }}
          >
            {/* Top Navigation & Title */}
            <div>
              <Group justify="space-between" align="center" mb="xl">
                <Button
                  component={Link}
                  href="/demo-patient"
                  variant="subtle"
                  color="gray"
                  size="xs"
                  styles={{ root: { padding: '4px 8px', color: '#475569', fontWeight: 600 } }}
                >
                  Back
                </Button>
                <Text size="xs" fw={700} style={{ color: '#2563eb', letterSpacing: 0.5 }}>
                  SEAM
                </Text>
              </Group>

              <Stack gap="xs" mb="xl">
                <Title order={2} style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>
                  Sign In
                </Title>
                <Text size="sm" style={{ color: '#64748b', lineHeight: 1.5 }}>
                  Select your patient profile to view your prescriptions and records.
                </Text>
              </Stack>

              {/* Selectable Dropdown Menu Only */}
              <Stack gap="md" mt="md">
                <Select
                  label="SELECT PATIENT"
                  placeholder={loading ? 'Loading profiles...' : 'Choose a person...'}
                  data={selectData}
                  value={selectedId}
                  onChange={setSelectedId}
                  allowDeselect={false}
                  styles={{
                    label: {
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#475569',
                      letterSpacing: 0.5,
                      marginBottom: 6
                    },
                    input: {
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      height: 50,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer'
                    },
                    dropdown: {
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1'
                    },
                    option: {
                      color: '#0f172a',
                      fontWeight: 500,
                      fontSize: 14,
                      padding: '12px 14px'
                    }
                  }}
                />

                {selectedId && (
                  <Paper p="sm" radius="md" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Text size="xs" c="dimmed">SELECTED PERSON</Text>
                    <Text fw={700} size="sm" style={{ color: '#0f172a', marginTop: 2 }}>
                      {patients.find((p) => p.id === selectedId)?.name}
                    </Text>
                    <Text size="xs" style={{ color: '#64748b', marginTop: 2 }}>
                      {patients.find((p) => p.id === selectedId)?.gender} • {patients.find((p) => p.id === selectedId)?.age} Yrs
                    </Text>
                  </Paper>
                )}
              </Stack>
            </div>

            {/* Bottom Action: Sign In Button */}
            <Stack gap="sm">
              <Button
                color="blue"
                size="lg"
                fullWidth
                radius="md"
                disabled={!selectedId}
                loading={submitting}
                onClick={handleSignIn}
                styles={{
                  root: {
                    height: 52,
                    fontWeight: 700,
                    fontSize: 16,
                    backgroundColor: '#2563eb'
                  }
                }}
              >
                Sign In
              </Button>
            </Stack>
          </Paper>
        </Container>
      </div>
    </MantineProvider>
  )
}
