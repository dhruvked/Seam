import { NextResponse } from 'next/server'
import { getAllDoctors, createDoctor } from '@/lib/doctors-db'

// GET /api/doctors — List all doctors
export async function GET() {
  try {
    const doctors = await getAllDoctors()
    return NextResponse.json({ success: true, count: doctors.length, doctors })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch doctors' },
      { status: 500 }
    )
  }
}

// POST /api/doctors — Register a new doctor
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, specialty, regNumber, clinicName, clinicAddress, signatureDataUrl } = body

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Doctor name and email are required fields' },
        { status: 400 }
      )
    }

    const doctor = await createDoctor({
      name,
      email,
      phone: phone || '',
      specialty: specialty || 'General Physician',
      regNumber: regNumber || '',
      clinicName: clinicName || '',
      clinicAddress: clinicAddress || '',
      signatureDataUrl: signatureDataUrl || ''
    })

    return NextResponse.json({ success: true, message: 'Doctor registered successfully', doctor }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create doctor' },
      { status: 500 }
    )
  }
}
