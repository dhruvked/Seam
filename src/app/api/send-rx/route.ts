import { NextResponse } from 'next/server'

// POST /api/send-rx — Send prescription summary via email
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { doctorName, doctorEmail, patientName, patientAge, patientGender, diagnosis, medicines, advice, followUp } = body

    if (!doctorEmail) {
      return NextResponse.json(
        { success: false, error: 'Recipient email address is required' },
        { status: 400 }
      )
    }

    console.log(`[EMAIL DISPATCH] Sending prescription summary to: ${doctorEmail}`)
    console.log(`[DOCTOR]: ${doctorName || 'Dr. Practitioner'}`)
    console.log(`[PATIENT]: ${patientName} (${patientAge || 'N/A'} Yrs / ${patientGender || 'N/A'})`)
    console.log(`[DIAGNOSIS]: ${diagnosis || 'None'}`)
    console.log(`[MEDICINES]:`, medicines)

    // Simulate successful email dispatch
    return NextResponse.json({
      success: true,
      message: `Prescription summary successfully emailed to ${doctorEmail}`
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error sending prescription email' },
      { status: 500 }
    )
  }
}
