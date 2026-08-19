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

// Prescriptions Table
export const prescriptions = pgTable('prescriptions', {
  id: text('id').primaryKey(),
  doctorId: text('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  patientName: text('patient_name').notNull(),
  patientAge: text('patient_age').default(''),
  patientGender: text('patient_gender').default(''),
  diagnosis: text('diagnosis').default(''),
  medicines: text('medicines').default('[]'),
  tests: text('tests').default(''),
  advice: text('advice').default(''),
  followUp: text('follow_up').default(''),
  fhirBundle: text('fhir_bundle').default(''),
  createdAt: timestamp('created_at').defaultNow()
})

export type DoctorSelect = typeof doctors.$inferSelect
export type DoctorInsert = typeof doctors.$inferInsert

export type PrescriptionSelect = typeof prescriptions.$inferSelect
export type PrescriptionInsert = typeof prescriptions.$inferInsert
