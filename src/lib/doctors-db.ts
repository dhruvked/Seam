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
    
    // Seed initial mock doctors if Neon DB is empty
    if (list.length === 0) {
      const seeded = await seedDefaultDoctors()
      return seeded
    }

    return list.map(formatDoctor)
  } catch (error) {
    console.error('Error fetching doctors from Neon DB:', error)
    return []
  }
}

async function seedDefaultDoctors(): Promise<Doctor[]> {
  const defaultList = [
    {
      id: 'doc_1',
      name: 'Dr. Priya Mehta',
      email: 'priya.mehta@apollo.com',
      phone: '+91 98201 12345',
      specialty: 'MBBS, MD (General Medicine)',
      regNumber: 'MCI-2018-84920',
      clinicName: 'Apollo Clinic, Andheri',
      clinicAddress: 'Plot 12, SV Road, Andheri West, Mumbai, Maharashtra 400058',
      signatureDataUrl: ''
    },
    {
      id: 'doc_2',
      name: 'Dr. Suresh Rao',
      email: 'suresh.rao@kokilaben.com',
      phone: '+91 98190 54321',
      specialty: 'MBBS, DM (Endocrinology)',
      regNumber: 'MCI-2015-67210',
      clinicName: 'Kokilaben Hospital OPD',
      clinicAddress: 'Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai 400053',
      signatureDataUrl: ''
    }
  ]

  try {
    await db.insert(doctors).values(defaultList)
    const fresh = await db.select().from(doctors)
    return fresh.map(formatDoctor)
  } catch (err) {
    console.error('Error seeding doctors:', err)
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
