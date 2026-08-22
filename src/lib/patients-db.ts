import { db } from '@/db'
import { patients, type PatientSelect } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export interface Patient {
  id: string
  name: string
  phone: string
  email: string
  gender: string
  age: string
  dob: string
  bloodGroup: string
  abhaNumber: string
  abhaAddress: string
  allergies: string
  emergencyContact: string
  createdAt: string
}

// Map Drizzle Patient row to frontend Patient interface
function formatPatient(p: PatientSelect): Patient {
  return {
    id: p.id,
    name: p.name,
    phone: p.phone || '',
    email: p.email || '',
    gender: p.gender || 'Male',
    age: p.age || '',
    dob: p.dob || '',
    bloodGroup: p.bloodGroup || '',
    abhaNumber: p.abhaNumber || '',
    abhaAddress: p.abhaAddress || '',
    allergies: p.allergies || '',
    emergencyContact: p.emergencyContact || '',
    createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString()
  }
}

export async function getAllPatients(): Promise<Patient[]> {
  try {
    const list = await db.select().from(patients).orderBy(desc(patients.createdAt))
    return list.map(formatPatient)
  } catch (error) {
    console.error('Error fetching patients from Neon DB:', error)
    return []
  }
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  try {
    const result = await db.select().from(patients).where(eq(patients.id, id))
    if (result.length === 0) return undefined
    return formatPatient(result[0])
  } catch (err) {
    console.error('Error in getPatientById:', err)
    return undefined
  }
}

export async function getPatientByPhone(phone: string): Promise<Patient | undefined> {
  try {
    const result = await db.select().from(patients).where(eq(patients.phone, phone))
    if (result.length === 0) return undefined
    return formatPatient(result[0])
  } catch (err) {
    console.error('Error in getPatientByPhone:', err)
    return undefined
  }
}

export async function createPatient(data: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
  const newId = `pat_${Date.now()}`
  const insertPayload = {
    id: newId,
    name: data.name,
    phone: data.phone || '',
    email: data.email || '',
    gender: data.gender || 'Male',
    age: data.age || '',
    dob: data.dob || '',
    bloodGroup: data.bloodGroup || '',
    abhaNumber: data.abhaNumber || '',
    abhaAddress: data.abhaAddress || '',
    allergies: data.allergies || '',
    emergencyContact: data.emergencyContact || ''
  }

  await db.insert(patients).values(insertPayload)
  const created = await getPatientById(newId)
  if (!created) {
    return { id: newId, ...data, createdAt: new Date().toISOString() }
  }
  return created
}

export async function updatePatient(id: string, updateData: Partial<Omit<Patient, 'id' | 'createdAt'>>): Promise<Patient | null> {
  await db.update(patients).set(updateData).where(eq(patients.id, id))
  const updated = await getPatientById(id)
  return updated || null
}

export async function deletePatient(id: string): Promise<boolean> {
  await db.delete(patients).where(eq(patients.id, id))
  return true
}
