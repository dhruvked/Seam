import { db } from '@/db'
import { prescriptions, type PrescriptionSelect } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export interface Prescription {
  id: string
  doctorId: string
  patientName: string
  patientAge: string
  patientGender: string
  diagnosis: string
  medicines: Array<{ name: string; dosage: string; duration: string }>
  advice: string
  followUp: string
  createdAt: string
}

function formatPrescription(p: PrescriptionSelect): Prescription {
  let parsedMeds = []
  try {
    parsedMeds = JSON.parse(p.medicines || '[]')
  } catch {
    parsedMeds = []
  }

  return {
    id: p.id,
    doctorId: p.doctorId,
    patientName: p.patientName,
    patientAge: p.patientAge || '',
    patientGender: p.patientGender || '',
    diagnosis: p.diagnosis || '',
    medicines: parsedMeds,
    advice: p.advice || '',
    followUp: p.followUp || '',
    createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString()
  }
}

export async function getAllPrescriptions(): Promise<Prescription[]> {
  try {
    const list = await db.select().from(prescriptions).orderBy(desc(prescriptions.createdAt))
    return list.map(formatPrescription)
  } catch (err) {
    console.error('Error fetching prescriptions:', err)
    return []
  }
}

export async function getPrescriptionsByDoctorId(doctorId: string): Promise<Prescription[]> {
  try {
    const list = await db.select().from(prescriptions).where(eq(prescriptions.doctorId, doctorId)).orderBy(desc(prescriptions.createdAt))
    return list.map(formatPrescription)
  } catch (err) {
    console.error('Error fetching doctor prescriptions:', err)
    return []
  }
}

export async function createPrescription(data: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription> {
  const newId = `rx_${Date.now()}`
  const insertPayload = {
    id: newId,
    doctorId: data.doctorId,
    patientName: data.patientName,
    patientAge: data.patientAge || '',
    patientGender: data.patientGender || '',
    diagnosis: data.diagnosis || '',
    medicines: JSON.stringify(data.medicines || []),
    advice: data.advice || '',
    followUp: data.followUp || ''
  }

  await db.insert(prescriptions).values(insertPayload)
  const list = await db.select().from(prescriptions).where(eq(prescriptions.id, newId))
  if (list.length > 0) return formatPrescription(list[0])
  return { id: newId, ...data, createdAt: new Date().toISOString() }
}
