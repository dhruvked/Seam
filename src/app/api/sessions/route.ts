import { NextResponse } from 'next/server'
import { createSession, getPendingSessionsForPatient } from '@/lib/sessions-db'

// POST /api/sessions — Doctor creates a consent request
export async function POST(req: Request) {
  try {
    const { doctorId, patientId } = await req.json()
    if (!doctorId || !patientId) {
      return NextResponse.json({ success: false, error: 'doctorId and patientId are required' }, { status: 400 })
    }
    const session = await createSession(doctorId, patientId)
    return NextResponse.json({ success: true, session }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    )
  }
}

// GET /api/sessions?patientId=xxx&patientName=xxx&phone=xxx — Patient polls for pending consent requests
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId') || undefined
    const patientName = searchParams.get('patientName') || undefined
    const phone = searchParams.get('phone') || undefined

    if (!patientId && !patientName && !phone) {
      return NextResponse.json({ success: false, error: 'patientId, patientName or phone is required' }, { status: 400 })
    }
    const sessions = await getPendingSessionsForPatient(patientId, patientName, phone)
    return NextResponse.json({ success: true, sessions })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
