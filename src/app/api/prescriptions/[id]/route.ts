import { NextResponse } from 'next/server'
import { deletePrescription } from '@/lib/prescriptions-db'

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
