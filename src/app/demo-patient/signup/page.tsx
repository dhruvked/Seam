'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MantineProvider,
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Group,
  SimpleGrid
} from '@mantine/core'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TOTAL_STEPS = 5

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−']

const COMMON_ALLERGIES = [
  'Penicillin', 'Sulfa Drugs', 'Aspirin', 'Ibuprofen',
  'Paracetamol', 'Codeine', 'Latex', 'Pollen',
  'Dust Mites', 'Pet Dander', 'Peanuts', 'Shellfish',
  'Dairy', 'Eggs', 'Sesame', 'Soy'
]

interface FormData {
  name: string
  phone: string
  gender: string
  age: string
  bloodGroup: string
  allergies: string[]
}

export default function DemoPatientSignUpPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    gender: '',
    age: '',
    bloodGroup: '',
    allergies: []
  })

  // Auto-focus ref for text inputs
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [step])

  // Transition to next step with animation
  const goNext = () => {
    if (animating) return
    setDirection('forward')
    setAnimating(true)
    setTimeout(() => {
      setStep((s) => s + 1)
      setAnimating(false)
    }, 180)
  }

  const goBack = () => {
    if (animating || step === 1) return
    setDirection('back')
    setAnimating(true)
    setTimeout(() => {
      setStep((s) => s - 1)
      setAnimating(false)
    }, 180)
  }

  // Step validations
  const canContinue = () => {
    if (step === 1) return form.name.trim().length > 0
    if (step === 2) return form.phone.trim().length >= 8
    if (step === 3) return form.gender !== '' && form.age.trim().length > 0
    return true // Steps 4, 5 are optional (skippable)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canContinue()) {
      if (step < TOTAL_STEPS) goNext()
    }
  }

  // Toggle allergy chip
  const toggleAllergy = (allergy: string) => {
    setForm((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy]
    }))
  }

  // Final submission
  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          gender: form.gender || 'Other',
          age: form.age.trim(),
          bloodGroup: form.bloodGroup,
          allergies: form.allergies.join(', ')
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create account')

      sessionStorage.setItem('seam_patient_session', JSON.stringify(data.patient))
      router.push(`/demo-patient/dashboard?patientId=${data.patient.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  // Progress percentage
  const progress = (step / TOTAL_STEPS) * 100

  // Slide animation style
  const slideStyle: React.CSSProperties = {
    opacity: animating ? 0 : 1,
    transform: animating
      ? `translateX(${direction === 'forward' ? '24px' : '-24px'})`
      : 'translateX(0)',
    transition: 'opacity 0.18s ease, transform 0.18s ease'
  }

  return (
    <MantineProvider>
      {/* Global style override for body bg */}
      <style>{`html, body { background: #f8fafc; margin: 0; padding: 0; }`}</style>

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
            radius={0}
            style={{
              background: '#ffffff',
              minHeight: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '0 0 32px 0',
              borderLeft: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0'
            }}
          >
            {/* ── Top Bar: Back + Progress Bar ── */}
            <div>
              <div style={{ padding: '20px 24px 0 24px' }}>
                <Group justify="space-between" align="center" mb={16}>
                  {step > 1 ? (
                    <button
                      onClick={goBack}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 0',
                        color: '#475569',
                        fontWeight: 600,
                        fontSize: 14,
                        fontFamily: 'inherit'
                      }}
                    >
                      ← Back
                    </button>
                  ) : (
                    <Button
                      component={Link}
                      href="/demo-patient"
                      variant="subtle"
                      color="gray"
                      size="xs"
                      styles={{ root: { padding: '4px 0', color: '#475569', fontWeight: 600 } }}
                    >
                      ← Back
                    </Button>
                  )}
                  <Text size="xs" fw={700} style={{ color: '#94a3b8' }}>
                    {step} of {TOTAL_STEPS}
                  </Text>
                </Group>

                {/* Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: 3,
                    background: '#e2e8f0',
                    borderRadius: 99,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: '#2563eb',
                      borderRadius: 99,
                      transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </div>
              </div>

              {/* ── Step Content (animated) ── */}
              <div style={{ ...slideStyle, padding: '36px 24px 0 24px' }}>

                {/* STEP 1: Name */}
                {step === 1 && (
                  <Stack gap="xl">
                    <Stack gap={6}>
                      <Title order={2} style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        What's your name?
                      </Title>
                      <Text size="sm" style={{ color: '#64748b' }}>
                        This is how your records will be identified.
                      </Text>
                    </Stack>
                    <TextInput
                      ref={inputRef}
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      autoComplete="name"
                      size="lg"
                      styles={{
                        input: {
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#0f172a',
                          backgroundColor: '#f8fafc',
                          borderColor: '#cbd5e1',
                          height: 56,
                          borderRadius: 10
                        }
                      }}
                    />
                  </Stack>
                )}

                {/* STEP 2: Phone */}
                {step === 2 && (
                  <Stack gap="xl">
                    <Stack gap={6}>
                      <Title order={2} style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        Your mobile number?
                      </Title>
                      <Text size="sm" style={{ color: '#64748b' }}>
                        Used to link your prescriptions and health records.
                      </Text>
                    </Stack>
                    <TextInput
                      ref={inputRef}
                      placeholder="+91 98200 12345"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      size="lg"
                      styles={{
                        input: {
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#0f172a',
                          backgroundColor: '#f8fafc',
                          borderColor: '#cbd5e1',
                          height: 56,
                          borderRadius: 10
                        }
                      }}
                    />
                  </Stack>
                )}

                {/* STEP 3: Gender + Age */}
                {step === 3 && (
                  <Stack gap="xl">
                    <Stack gap={6}>
                      <Title order={2} style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        A little about you.
                      </Title>
                      <Text size="sm" style={{ color: '#64748b' }}>
                        Helps your doctor understand your medical profile.
                      </Text>
                    </Stack>

                    {/* Gender Tap Cards */}
                    <Stack gap="xs">
                      <Text size="xs" fw={700} style={{ color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Gender
                      </Text>
                      <SimpleGrid cols={3} spacing="xs">
                        {['Male', 'Female', 'Other'].map((g) => (
                          <button
                            key={g}
                            onClick={() => setForm((f) => ({ ...f, gender: g }))}
                            style={{
                              height: 52,
                              borderRadius: 10,
                              border: form.gender === g ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                              background: form.gender === g ? '#eff6ff' : '#f8fafc',
                              color: form.gender === g ? '#2563eb' : '#475569',
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {g}
                          </button>
                        ))}
                      </SimpleGrid>
                    </Stack>

                    {/* Age Input */}
                    <Stack gap="xs">
                      <Text size="xs" fw={700} style={{ color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Age (Years)
                      </Text>
                      <TextInput
                        placeholder="e.g. 28"
                        value={form.age}
                        onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        type="number"
                        inputMode="numeric"
                        size="lg"
                        styles={{
                          input: {
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#0f172a',
                            backgroundColor: '#f8fafc',
                            borderColor: '#cbd5e1',
                            height: 56,
                            borderRadius: 10
                          }
                        }}
                      />
                    </Stack>
                  </Stack>
                )}

                {/* STEP 4: Blood Group */}
                {step === 4 && (
                  <Stack gap="xl">
                    <Stack gap={6}>
                      <Title order={2} style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        Your blood group?
                      </Title>
                      <Text size="sm" style={{ color: '#64748b' }}>
                        Optional — helps in emergencies.
                      </Text>
                    </Stack>

                    <SimpleGrid cols={4} spacing="xs">
                      {BLOOD_GROUPS.map((bg) => (
                        <button
                          key={bg}
                          onClick={() => setForm((f) => ({
                            ...f,
                            bloodGroup: f.bloodGroup === bg ? '' : bg
                          }))}
                          style={{
                            height: 56,
                            borderRadius: 10,
                            border: form.bloodGroup === bg ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                            background: form.bloodGroup === bg ? '#eff6ff' : '#f8fafc',
                            color: form.bloodGroup === bg ? '#2563eb' : '#475569',
                            fontWeight: 800,
                            fontSize: 15,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {bg}
                        </button>
                      ))}
                    </SimpleGrid>

                    <button
                      onClick={() => setForm((f) => ({ ...f, bloodGroup: '' }))}
                      style={{
                        background: 'none',
                        border: '1.5px dashed #cbd5e1',
                        borderRadius: 10,
                        padding: '14px',
                        color: '#94a3b8',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        width: '100%'
                      }}
                    >
                      I don't know my blood group
                    </button>
                  </Stack>
                )}

                {/* STEP 5: Allergies */}
                {step === 5 && (
                  <Stack gap="xl">
                    <Stack gap={6}>
                      <Title order={2} style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        Any known allergies?
                      </Title>
                      <Text size="sm" style={{ color: '#64748b' }}>
                        Tap all that apply. This helps doctors avoid prescribing harmful medicines.
                      </Text>
                    </Stack>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {COMMON_ALLERGIES.map((allergy) => {
                        const selected = form.allergies.includes(allergy)
                        return (
                          <button
                            key={allergy}
                            onClick={() => toggleAllergy(allergy)}
                            style={{
                              padding: '10px 16px',
                              borderRadius: 99,
                              border: selected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                              background: selected ? '#eff6ff' : '#f8fafc',
                              color: selected ? '#2563eb' : '#475569',
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {allergy}
                          </button>
                        )
                      })}
                    </div>

                    {form.allergies.length > 0 && (
                      <Text size="xs" style={{ color: '#2563eb', fontWeight: 600 }}>
                        {form.allergies.length} selected
                      </Text>
                    )}
                  </Stack>
                )}
              </div>
            </div>

            {/* ── Bottom Action Button ── */}
            <div style={{ padding: '24px 24px 0 24px' }}>
              {error && (
                <Paper p="xs" px="sm" mb="sm" radius="md" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <Text size="xs" fw={600} style={{ color: '#dc2626' }}>{error}</Text>
                </Paper>
              )}

              {step < TOTAL_STEPS ? (
                <Stack gap="sm">
                  <Button
                    color="blue"
                    size="lg"
                    fullWidth
                    radius="md"
                    disabled={!canContinue()}
                    onClick={goNext}
                    styles={{
                      root: {
                        height: 52,
                        fontWeight: 700,
                        fontSize: 16,
                        backgroundColor: '#2563eb'
                      }
                    }}
                  >
                    Continue
                  </Button>

                  {/* Skip button for optional steps */}
                  {(step === 4 || step === 5) && (
                    <button
                      onClick={goNext}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        padding: '8px',
                        textAlign: 'center',
                        width: '100%'
                      }}
                    >
                      Skip for now
                    </button>
                  )}
                </Stack>
              ) : (
                /* Step 5 Final: "Create My Account" */
                <Stack gap="sm">
                  <Button
                    color="blue"
                    size="lg"
                    fullWidth
                    radius="md"
                    loading={submitting}
                    onClick={handleSubmit}
                    styles={{
                      root: {
                        height: 52,
                        fontWeight: 700,
                        fontSize: 16,
                        backgroundColor: '#2563eb'
                      }
                    }}
                  >
                    Create My Account
                  </Button>

                  <button
                    onClick={goNext}
                    disabled={submitting}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      padding: '8px',
                      textAlign: 'center',
                      width: '100%'
                    }}
                  >
                    Skip for now
                  </button>
                </Stack>
              )}
            </div>
          </Paper>
        </Container>
      </div>
    </MantineProvider>
  )
}
