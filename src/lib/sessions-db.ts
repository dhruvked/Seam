import { db } from '@/db'
import { consultationSessions, patients, type ConsultationSessionSelect } from '@/db/schema'
import { eq, and, or, inArray } from 'drizzle-orm'

export interface ConsultationSession {
  id: string
  doctorId: string
  patientId: string
  status: 'pending' | 'approved' | 'denied' | 'ended'
  createdAt: string
  approvedAt?: string
}

function formatSession(s: ConsultationSessionSelect): ConsultationSession {
  return {
    id: s.id,
    doctorId: s.doctorId,
    patientId: s.patientId,
    status: (s.status || 'pending') as ConsultationSession['status'],
    createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
    approvedAt: s.approvedAt ? s.approvedAt.toISOString() : undefined
  }
}

export async function createSession(doctorId: string, patientId: string): Promise<ConsultationSession> {
  const newId = `cs_${Date.now()}`
  await db.insert(consultationSessions).values({ id: newId, doctorId, patientId, status: 'pending' })
  const rows = await db.select().from(consultationSessions).where(eq(consultationSessions.id, newId))
  return formatSession(rows[0])
}

export async function getSessionById(id: string): Promise<ConsultationSession | undefined> {
  const rows = await db.select().from(consultationSessions).where(eq(consultationSessions.id, id))
  if (rows.length === 0) return undefined
  return formatSession(rows[0])
}

export async function getPendingSessionsForPatient(
  patientId?: string,
  patientName?: string,
  phone?: string
): Promise<ConsultationSession[]> {
  const targetIds = new Set<string>()
  if (patientId) targetIds.add(patientId)

  // Also lookup any patient IDs matching name or phone if provided
  if (patientName || phone) {
    const matchingPatients = await db
      .select()
      .from(patients)
      .where(
        or(
          patientName ? eq(patients.name, patientName) : undefined,
          phone ? eq(patients.phone, phone) : undefined
        )
      )
    matchingPatients.forEach((p) => targetIds.add(p.id))
  }

  const idsArray = Array.from(targetIds).filter(Boolean)
  if (idsArray.length === 0) return []

  const rows = await db
    .select()
    .from(consultationSessions)
    .where(
      and(
        inArray(consultationSessions.patientId, idsArray),
        eq(consultationSessions.status, 'pending')
      )
    )
  return rows.map(formatSession)
}

export async function updateSessionStatus(
  id: string,
  status: 'approved' | 'denied' | 'ended'
): Promise<ConsultationSession | undefined> {
  const updateData: Record<string, unknown> = { status }
  if (status === 'approved') updateData.approvedAt = new Date()
  await db.update(consultationSessions).set(updateData).where(eq(consultationSessions.id, id))
  return getSessionById(id)
}
