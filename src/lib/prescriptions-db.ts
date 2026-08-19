import { db } from '@/db'
import { prescriptions, type PrescriptionSelect } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { generateFhirR4Bundle } from './fhir-converter'
import { getDoctorById } from './doctors-db'

export interface Prescription {
  id: string
  doctorId: string
  patientName: string
  patientAge: string
  patientGender: string
  diagnosis: string
  medicines: Array<{ name: string; dosage: string; duration: string }>
  tests?: string
  advice: string
  followUp: string
  fhirBundle?: string
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
    tests: p.tests || '',
    advice: p.advice || '',
    followUp: p.followUp || '',
    fhirBundle: p.fhirBundle || '',
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

export async function createPrescription(data: Omit<Prescription, 'id' | 'createdAt' | 'fhirBundle'>): Promise<Prescription> {
  const newId = `rx_${Date.now()}`
  
  // Fetch doctor profile to generate accurate FHIR R4 Bundle
  const doctor = await getDoctorById(data.doctorId)
  
  const fhirBundleObj = generateFhirR4Bundle(doctor, { id: newId, ...data })
  const fhirBundleString = JSON.stringify(fhirBundleObj, null, 2)

  const insertPayload = {
    id: newId,
    doctorId: data.doctorId,
    patientName: data.patientName,
    patientAge: data.patientAge || '',
    patientGender: data.patientGender || '',
    diagnosis: data.diagnosis || '',
    medicines: JSON.stringify(data.medicines || []),
    tests: data.tests || '',
    advice: data.advice || '',
    followUp: data.followUp || '',
    fhirBundle: fhirBundleString
  }

  await db.insert(prescriptions).values(insertPayload)
  const list = await db.select().from(prescriptions).where(eq(prescriptions.id, newId))
  if (list.length > 0) return formatPrescription(list[0])
  return { id: newId, ...data, fhirBundle: fhirBundleString, createdAt: new Date().toISOString() }
}

export async function deletePrescription(id: string): Promise<boolean> {
  await db.delete(prescriptions).where(eq(prescriptions.id, id))
  return true
}
