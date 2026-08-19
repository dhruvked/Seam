import { Doctor } from './doctors-db'

export interface PrescriptionData {
  id: string
  doctorId: string
  patientName: string
  patientAge?: string
  patientGender?: string
  diagnosis?: string
  medicines?: Array<{ name: string; dosage: string; duration: string }>
  advice?: string
  followUp?: string
  createdAt?: string
}

export function generateFhirR4Bundle(doctor?: Doctor | null, rx?: PrescriptionData | null): object {
  const timestamp = rx?.createdAt || new Date().toISOString()
  const bundleId = `fhir-bundle-${rx?.id || Date.now()}`
  const patientId = `patient-${Date.now()}`
  const doctorId = doctor?.id || `practitioner-${Date.now()}`
  const conditionId = `condition-${Date.now()}`

  // FHIR R4 Patient Resource
  const patientResource = {
    resourceType: 'Patient',
    id: patientId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient']
    },
    name: [{ text: rx?.patientName || 'Anonymous Patient' }],
    gender: (rx?.patientGender || 'unknown').toLowerCase(),
    extension: rx?.patientAge
      ? [
          {
            url: 'https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient-Age',
            valueString: `${rx.patientAge} Years`
          }
        ]
      : []
  }

  // FHIR R4 Practitioner Resource (Doctor)
  const practitionerResource = {
    resourceType: 'Practitioner',
    id: doctorId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner']
    },
    name: [{ text: doctor?.name || 'Dr. Medical Practitioner' }],
    qualification: doctor?.specialty ? [{ code: { text: doctor.specialty } }] : [],
    identifier: doctor?.regNumber
      ? [
          {
            type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MD' }] },
            system: 'https://doctor.ndhm.gov.in',
            value: doctor.regNumber
          }
        ]
      : []
  }

  // FHIR R4 Condition Resource (Diagnosis)
  const conditionResource = {
    resourceType: 'Condition',
    id: conditionId,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition']
    },
    clinicalStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
    },
    subject: { reference: `Patient/${patientId}` },
    code: { text: rx?.diagnosis || 'General OPD Consultation' }
  }

  // FHIR R4 MedicationRequest Resources
  const medicationRequests = (rx?.medicines || []).map((m, idx) => ({
    resourceType: 'MedicationRequest',
    id: `medrx-${rx?.id || Date.now()}-${idx + 1}`,
    meta: {
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest']
    },
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: { text: m.name || 'Unspecified Medicine' },
    subject: { reference: `Patient/${patientId}` },
    requester: { reference: `Practitioner/${doctorId}` },
    dosageInstruction: [
      {
        text: `${m.dosage} for ${m.duration}`
      }
    ]
  }))

  // Assemble Complete FHIR R4 Bundle
  const entries = [
    { resource: patientResource },
    { resource: practitionerResource },
    { resource: conditionResource },
    ...medicationRequests.map(med => ({ resource: med }))
  ]

  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      versionId: '1',
      lastUpdated: timestamp,
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle']
    },
    identifier: {
      system: 'https://seam.health/fhir/bundle',
      value: bundleId
    },
    type: 'document',
    timestamp: timestamp,
    entry: entries
  }
}
