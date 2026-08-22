import { NextResponse } from 'next/server'
import { getSessionById, updateSessionStatus } from '@/lib/sessions-db'

// GET /api/sessions/[id] — Doctor polls for session status
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSessionById(id)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, session })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

// PATCH /api/sessions/[id] — Patient approves/denies, or doctor ends session
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await req.json()
    if (!['approved', 'denied', 'ended'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }
    const updated = await updateSessionStatus(id, status)
    return NextResponse.json({ success: true, session: updated })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update session' },
      { status: 500 }
    )
  }
}
