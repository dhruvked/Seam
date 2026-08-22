import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// Doctors Table
export const doctors = pgTable('doctors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default(''),
  specialty: text('specialty').default(''),
  regNumber: text('reg_number').default(''),
  clinicName: text('clinic_name').default(''),
  clinicAddress: text('clinic_address').default(''),
  signatureDataUrl: text('signature_data_url').default(''),
  createdAt: timestamp('created_at').defaultNow()
})

// Patients Table
export const patients = pgTable('patients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').default(''),
  email: text('email').default(''),
  gender: text('gender').default('Male'),
  age: text('age').default(''),
  dob: text('dob').default(''),
  bloodGroup: text('blood_group').default(''),
  abhaNumber: text('abha_number').default(''),
  abhaAddress: text('abha_address').default(''),
  allergies: text('allergies').default(''),
  emergencyContact: text('emergency_contact').default(''),
  createdAt: timestamp('created_at').defaultNow()
})

// Prescriptions Table
export const prescriptions = pgTable('prescriptions', {
  id: text('id').primaryKey(),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').references(() => patients.id, { onDelete: 'set null' }),
  patientName: text('patient_name').notNull(),
  patientAge: text('patient_age').default(''),
  patientGender: text('patient_gender').default(''),
  patientPhone: text('patient_phone').default(''),
  patientAbha: text('patient_abha').default(''),
  diagnosis: text('diagnosis').default(''),
  medicines: text('medicines').default('[]'),
  tests: text('tests').default(''),
  advice: text('advice').default(''),
  followUp: text('follow_up').default(''),
  fhirBundle: text('fhir_bundle').default(''),
  createdAt: timestamp('created_at').defaultNow()
})

// Consultation Sessions Table (Doctor-Patient Consent)
export const consultationSessions = pgTable('consultation_sessions', {
  id: text('id').primaryKey(),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  status: text('status').default('pending'), // 'pending' | 'approved' | 'denied' | 'ended'
  createdAt: timestamp('created_at').defaultNow(),
  approvedAt: timestamp('approved_at')
})

export type DoctorSelect = typeof doctors.$inferSelect
export type DoctorInsert = typeof doctors.$inferInsert

export type PatientSelect = typeof patients.$inferSelect
export type PatientInsert = typeof patients.$inferInsert

export type PrescriptionSelect = typeof prescriptions.$inferSelect
export type PrescriptionInsert = typeof prescriptions.$inferInsert

export type ConsultationSessionSelect = typeof consultationSessions.$inferSelect
export type ConsultationSessionInsert = typeof consultationSessions.$inferInsert
