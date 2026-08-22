import { NextResponse } from 'next/server'
import { getPrescriptionById, deletePrescription } from '@/lib/prescriptions-db'

// GET /api/prescriptions/[id] — Fetch a prescription record by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prescription = await getPrescriptionById(id)
    if (!prescription) {
      return NextResponse.json({ success: false, error: 'Prescription not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, prescription })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error fetching prescription' },
      { status: 500 }
    )
  }
}

// DELETE /api/prescriptions/[id] — Delete a prescription record by ID
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deletePrescription(id)
    return NextResponse.json({ success: true, message: 'Prescription record deleted successfully' })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error deleting prescription' },
      { status: 500 }
    )
  }
}
