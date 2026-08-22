import { NextResponse } from 'next/server'
import {
  getAllPrescriptions,
  getPrescriptionsByDoctorId,
  getPrescriptionsByPatientId,
  createPrescription
} from '@/lib/prescriptions-db'

// GET /api/prescriptions — List prescriptions filtered by ?doctorId=, ?patientId=, or ?patientName=
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const doctorId = searchParams.get('doctorId')
    const patientId = searchParams.get('patientId')
    const patientName = searchParams.get('patientName')

    let list
    if (doctorId) {
      list = await getPrescriptionsByDoctorId(doctorId)
    } else if (patientId) {
      list = await getPrescriptionsByPatientId(patientId)
    } else {
      list = await getAllPrescriptions()
    }

    // Client-side filter by patient name if provided
    if (patientName && patientName.trim()) {
      const lower = patientName.trim().toLowerCase()
      list = list.filter(p => p.patientName.toLowerCase().includes(lower))
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
    const {
      doctorId,
      patientId,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      patientAbha,
      diagnosis,
      medicines,
      tests,
      advice,
      followUp
    } = body

    if (!doctorId || !patientName) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID and Patient Name are required' },
        { status: 400 }
      )
    }

    const prescription = await createPrescription({
      doctorId,
      patientId: patientId || undefined,
      patientName,
      patientAge: patientAge || '',
      patientGender: patientGender || '',
      patientPhone: patientPhone || '',
      patientAbha: patientAbha || '',
      diagnosis: diagnosis || '',
      medicines: medicines || [],
      tests: tests || '',
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
