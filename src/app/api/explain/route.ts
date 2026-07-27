import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { title, details, medicines, type } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY

    // If API key is not present, generate a highly realistic mock explanation for the demo
    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 1500)) // simulated lag

      let mockText = ''

      if (type === 'Prescription') {
        mockText = `### 💊 **Your Medication Guide** (Simulated AI)

This prescription is targeted at addressing a symptomatic acute infection (e.g., fever/respiratory issues) or chronic maintenance depending on your active ingredients.

*   **Active Ingredients & Intent:**
    *   **Paracetamol / Acetaminophen:** Acts on the central nervous system to relieve pain and reduce fever. Essential to monitor dosage to not exceed 4g daily to avoid liver toxicity.
    *   **Cetirizine:** An H1-receptor antagonist. Blocks histamine to reduce allergic reactions, runny nose, and sneezing. It is non-sedating for most, but best taken in the evening if drowsiness occurs.
    *   **Azithromycin:** A macrolide antibiotic. Stops bacterial growth by interfering with their protein synthesis. **Must complete the entire course** even if you feel better to prevent antibiotic resistance.
*   **Lifestyle Advisory:** Keep well hydrated. Rest is critical for recovery. Avoid alcohol while taking these medications.
`
      } else if (type === 'Lab Report') {
        mockText = `### 🧪 **Your Lab Report Explained** (Simulated AI)

Here is a plain-language summary of your diagnostic results:

*   **WBC (White Blood Cells) - 11,200/µL:** This is slightly above the typical reference range (4,000 - 11,000). Elevate counts usually suggest that your immune system is actively fighting off an infection or inflammation.
*   **CRP (C-Reactive Protein) - 18 mg/L:** Elevated (normal is < 5). CRP is a marker produced by the liver in response to active inflammation. Combined with the WBC, it confirms a mild acute immune/inflammatory response (likely related to your recent fever/viral symptoms).
*   **HbA1c - 7.1%:** This reflects your average blood glucose over the past 3 months. For an individual managing Type 2 Diabetes, this is generally close to target, showing stable glycemic control, though slight dietary adjustments could help optimize it.
*   **Actionable Next Steps:** Share these values with your primary doctor. Monitor if symptoms persist beyond 5 days.
`
      } else {
        mockText = `### 🩺 **Clinical Consultation Summary** (Simulated AI)

Your recent consultation covers: **${title}**

*   **Core Diagnosis:** ${details || 'Acute respiratory/viral management.'}
*   **Key Focus:** The clinician focuses on symptom resolution and targeted therapy. If antibiotics or chronic medicines were prescribed, adherence is critical.
*   **Action Plan:** Ensure you rest, take prescribed medications on schedule, and seek immediate follow-up if you experience shortness of breath, high persistent fever, or allergic rashes.
`
      }

      return NextResponse.json({
        text: mockText,
        isSimulated: true
      })
    }

    // Call the real Gemini API
    const prompt = `You are a compassionate, clear AI medical assistant for HealthOS, a Personal Health Record portal. 
Explain this health record in plain English for a patient. Be warm, structured, and easy to understand.
Explain what each test, diagnosis, or medicine means, what to look out for, and basic lifestyle/advisory advice.
CRITICAL: Do not give a final diagnosis or override a doctor's advice. Include a brief medical disclaimer at the bottom.
Format the output nicely using Markdown with bullet points.

Here is the record info:
- Type: ${type}
- Title: ${title}
- Details/Notes: ${details}
- Prescribed Medicines: ${JSON.stringify(medicines || [])}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API responded with status ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No explanation generated.'

    return NextResponse.json({
      text: responseText,
      isSimulated: false
    })
  } catch (error: unknown) {
    console.error('AI Explanation Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during AI generation' },
      { status: 500 }
    )
  }
}
