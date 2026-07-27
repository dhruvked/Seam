import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { title, details, medicines, type } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 1200))

      let mockText = ''

      if (type === 'Prescription') {
        mockText = `### Your Medication Guide

This prescription addresses your current symptoms. Here is what each medicine does and how to take it correctly.

**Active Medications & Their Purpose**

* **Paracetamol / Acetaminophen:** Works on your central nervous system to reduce fever and relieve pain. Do not exceed 4 grams (4000mg) per day. Take with water, not on an empty stomach.
* **Cetirizine:** An antihistamine that blocks the chemical causing allergic reactions — reduces runny nose, sneezing, and throat irritation. Can cause mild drowsiness in some people; take in the evening if so.
* **Azithromycin:** An antibiotic that stops bacterial growth by interfering with their protein production. **Complete the full course even if you feel better early.** Stopping early can cause antibiotic resistance.

**Important Lifestyle Advice**

* Drink at least 2–3 litres of water daily during this course.
* Get adequate rest — sleep accelerates recovery from viral infections.
* Avoid alcohol entirely while on these medications.
* Return to your doctor immediately if you develop skin rash, difficulty breathing, or symptoms worsen after 3 days.`

      } else if (type === 'Lab Report') {
        mockText = `### Your Lab Report Explained

Here is a plain-language summary of your diagnostic results and what they mean for your health.

**Key Values & What They Mean**

* **WBC (White Blood Cells) — 11,200/uL:** Slightly above the normal range of 4,000–11,000. An elevated count means your immune system is actively fighting an infection or inflammation. This is consistent with your recent symptoms.
* **CRP (C-Reactive Protein) — 18 mg/L:** Elevated (normal is below 5 mg/L). CRP is produced by the liver when there is active inflammation in the body. Combined with the elevated WBC, this confirms a mild acute immune response — likely from your recent fever or viral illness.
* **HbA1c — 7.1%:** This measures your average blood sugar over the past 3 months. For a person managing Type 2 Diabetes, 7.1% is close to target (under 7.0% is ideal) and shows your diabetes is reasonably controlled. Small dietary improvements — reducing refined carbohydrates and sugar — could help push this below 7%.

**Next Steps**

* Share these results with your treating doctor at your next visit.
* Monitor your symptoms. If fever or body ache persists beyond 5 days, seek a follow-up.
* Continue your prescribed diabetes and blood pressure medications without interruption.`

      } else {
        mockText = `### Consultation Summary

Your recent visit covers: **${title}**

**What Your Doctor Found**

* ${details || 'Your doctor evaluated your current symptoms and conducted a clinical examination.'}
* The clinical assessment focuses on resolving your symptoms effectively and safely.
* If medications have been prescribed, taking them consistently and completing the full course is essential.

**Your Action Plan**

* Take all prescribed medications at the correct time and dose.
* Rest adequately and stay well hydrated.
* Seek immediate medical attention if you experience shortness of breath, persistent high fever (above 103F), severe chest pain, or any new allergic reaction.
* Attend your scheduled follow-up appointment even if you feel better.`
      }

      return NextResponse.json({ text: mockText, isSimulated: true })
    }

    // Real Gemini API call
    const prompt = `You are a compassionate, clear AI medical assistant for Seam, a Personal Health Record platform built on India's ABDM infrastructure.
Explain this health record in plain English for a patient who may not have medical training. Be warm, structured, and genuinely helpful.
For each test result, diagnosis, or medication: explain what it is, what it means for the patient, and what practical action they should take.
Include a brief, reassuring medical disclaimer at the end.
IMPORTANT: Do not give a final diagnosis or override the treating doctor's advice.
Format using Markdown: use ### for main heading, **bold** for key terms, and * for bullet points. No emojis.

Record details:
- Type: ${type}
- Title: ${title}
- Details / Clinical Notes: ${details}
- Prescribed Medicines: ${JSON.stringify(medicines || [])}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API error ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No explanation generated.'

    return NextResponse.json({ text: responseText, isSimulated: false })

  } catch (error: unknown) {
    console.error('AI Explanation Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during AI generation' },
      { status: 500 }
    )
  }
}
