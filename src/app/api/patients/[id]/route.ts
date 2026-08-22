import { NextResponse } from 'next/server'
import { getPatientById, updatePatient, deletePatient } from '@/lib/patients-db'

// GET /api/patients/[id] — Fetch a patient by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, patient })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error fetching patient' },
      { status: 500 }
    )
  }
}

// PATCH /api/patients/[id] — Update a patient record
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updated = await updatePatient(id, body)
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Patient not found or update failed' }, { status: 404 })
    }
    return NextResponse.json({ success: true, message: 'Patient updated successfully', patient: updated })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error updating patient' },
      { status: 500 }
    )
  }
}

// DELETE /api/patients/[id] — Delete a patient record
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deletePatient(id)
    return NextResponse.json({ success: true, message: 'Patient deleted successfully' })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error deleting patient' },
      { status: 500 }
    )
  }
}
