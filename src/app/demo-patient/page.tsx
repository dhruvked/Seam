'use client'

import {
  MantineProvider,
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack
} from '@mantine/core'
import Link from 'next/link'

export default function DemoPatientWelcomePage() {
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
        {/* Native Mobile App Shell (Edge-to-edge on phones, centered on desktop) */}
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
              padding: '40px 24px 36px 24px',
              borderLeft: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0'
            }}
          >
            {/* Top Brand Header & Hero */}
            <div>
              {/* Brand Name */}
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: '#2563eb',
                  letterSpacing: -0.5
                }}
              >
                Seam
              </Text>

              {/* Heading & Description */}
              <Stack gap="xs" mt={48}>
                <Title
                  order={1}
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: '#0f172a',
                    lineHeight: 1.2,
                    letterSpacing: -0.5
                  }}
                >
                  Your Health Records, Simplified.
                </Title>

                <Text
                  size="sm"
                  style={{
                    color: '#64748b',
                    lineHeight: 1.6,
                    marginTop: 6
                  }}
                >
                  Access your digital prescriptions, track prescribed medications, and view diagnostic lab investigations in one place.
                </Text>
              </Stack>
            </div>

            {/* Bottom Actions: Sign In & Sign Up */}
            <Stack gap="sm">
              <Button
                component={Link}
                href="/demo-patient/signin"
                color="blue"
                size="lg"
                fullWidth
                radius="md"
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

              <Button
                component={Link}
                href="/demo-patient/signup"
                variant="default"
                size="lg"
                fullWidth
                radius="md"
                styles={{
                  root: {
                    height: 52,
                    fontWeight: 700,
                    fontSize: 16,
                    borderColor: '#cbd5e1',
                    color: '#0f172a',
                    backgroundColor: '#ffffff'
                  }
                }}
              >
                Sign Up
              </Button>
            </Stack>
          </Paper>
        </Container>
      </div>
    </MantineProvider>
  )
}
