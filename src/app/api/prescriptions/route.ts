import { NextResponse } from 'next/server'
import { getAllPrescriptions, getPrescriptionsByDoctorId, createPrescription } from '@/lib/prescriptions-db'

// GET /api/prescriptions — List all prescriptions or filter by ?doctorId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const doctorId = searchParams.get('doctorId')

    let list
    if (doctorId) {
      list = await getPrescriptionsByDoctorId(doctorId)
    } else {
      list = await getAllPrescriptions()
    }

    return NextResponse.json({ success: true, count: list.length, prescriptions: list })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch prescriptions' },
      { status: 500 }
    )
  }
}

// POST /api/prescriptions — Save a new prescription record to Neon DB
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { doctorId, patientName, patientAge, patientGender, diagnosis, medicines, advice, followUp } = body

    if (!doctorId || !patientName) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID and Patient Name are required' },
        { status: 400 }
      )
    }

    const prescription = await createPrescription({
      doctorId,
      patientName,
      patientAge: patientAge || '',
      patientGender: patientGender || '',
      diagnosis: diagnosis || '',
      medicines: medicines || [],
      advice: advice || '',
      followUp: followUp || ''
    })

    return NextResponse.json({ success: true, message: 'Prescription saved to database', prescription }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save prescription' },
      { status: 500 }
    )
  }
}
