import { NextResponse } from 'next/server'
import { getDoctorById, updateDoctor, deleteDoctor } from '@/lib/doctors-db'

// GET /api/doctors/[id] — Fetch single doctor by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const doctor = await getDoctorById(id)
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, doctor })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error fetching doctor' },
      { status: 500 }
    )
  }
}

// PUT /api/doctors/[id] — Update doctor details
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const updated = await updateDoctor(id, body)
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Doctor details updated', doctor: updated })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error updating doctor' },
      { status: 500 }
    )
  }
}

// DELETE /api/doctors/[id] — Delete doctor record
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const deleted = await deleteDoctor(id)
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Doctor removed successfully' })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error deleting doctor' },
      { status: 500 }
    )
  }
}
