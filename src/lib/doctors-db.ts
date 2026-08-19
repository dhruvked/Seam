import { db } from '@/db'
import { doctors, type DoctorSelect } from '@/db/schema'
import { eq } from 'drizzle-orm'

export interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  specialty: string
  regNumber: string
  clinicName: string
  clinicAddress: string
  signatureDataUrl?: string
  createdAt: string
}

// Map Drizzle Doctor row to frontend Doctor interface
function formatDoctor(d: DoctorSelect): Doctor {
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone || '',
    specialty: d.specialty || '',
    regNumber: d.regNumber || '',
    clinicName: d.clinicName || '',
    clinicAddress: d.clinicAddress || '',
    signatureDataUrl: d.signatureDataUrl || '',
    createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString()
  }
}

export async function getAllDoctors(): Promise<Doctor[]> {
  try {
    const list = await db.select().from(doctors)
    return list.map(formatDoctor)
  } catch (error) {
    console.error('Error fetching doctors from Neon DB:', error)
    return []
  }
}

export async function getDoctorById(id: string): Promise<Doctor | undefined> {
  try {
    const result = await db.select().from(doctors).where(eq(doctors.id, id))
    if (result.length === 0) return undefined
    return formatDoctor(result[0])
  } catch (err) {
    console.error('Error in getDoctorById:', err)
    return undefined
  }
}

export async function createDoctor(data: Omit<Doctor, 'id' | 'createdAt'>): Promise<Doctor> {
  const newId = `doc_${Date.now()}`
  const insertPayload = {
    id: newId,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    specialty: data.specialty || '',
    regNumber: data.regNumber || '',
    clinicName: data.clinicName || '',
    clinicAddress: data.clinicAddress || '',
    signatureDataUrl: data.signatureDataUrl || ''
  }

  await db.insert(doctors).values(insertPayload)
  const created = await getDoctorById(newId)
  if (!created) {
    return { id: newId, ...data, createdAt: new Date().toISOString() }
  }
  return created
}

export async function updateDoctor(id: string, updateData: Partial<Omit<Doctor, 'id' | 'createdAt'>>): Promise<Doctor | null> {
  await db.update(doctors).set(updateData).where(eq(doctors.id, id))
  const updated = await getDoctorById(id)
  return updated || null
}

export async function deleteDoctor(id: string): Promise<boolean> {
  await db.delete(doctors).where(eq(doctors.id, id))
  return true
}
