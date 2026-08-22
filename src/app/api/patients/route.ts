import { NextResponse } from 'next/server'
import { getAllPatients, createPatient } from '@/lib/patients-db'

// GET /api/patients — List all patients
export async function GET() {
  try {
    const list = await getAllPatients()
    return NextResponse.json({ success: true, count: list.length, patients: list })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

// POST /api/patients — Register a new patient
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, phone, email, gender, age, dob, bloodGroup, abhaNumber, abhaAddress, allergies, emergencyContact } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Patient name is required' }, { status: 400 })
    }

    const patient = await createPatient({
      name,
      phone: phone || '',
      email: email || '',
      gender: gender || 'Male',
      age: age || '',
      dob: dob || '',
      bloodGroup: bloodGroup || '',
      abhaNumber: abhaNumber || '',
      abhaAddress: abhaAddress || '',
      allergies: allergies || '',
      emergencyContact: emergencyContact || ''
    })

    return NextResponse.json({ success: true, message: 'Patient registered successfully', patient }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to register patient' },
      { status: 500 }
    )
  }
}
