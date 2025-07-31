export interface Patient {
  id: string
  name: string
  age: string
  gender?: string
  weight?: string
  height?: string
  bloodGroup?: string
  bloodPressure?: string
  address?: string
  pastIllnesses?: string
  prescriptions?: Prescription[]
}

export interface Prescription {
  id: string
  patientId: string
  date: string
  weight?: string
  bloodPressure?: string
  temperature?: string
  afebrileTemperature?: boolean
  pulse?: string
  respRate?: string
  spo2?: string
  chiefComplaints?: string
  examNotes?: string
  diagnosis?: string
  medicines: Medicine[]
  specialAdvice?: string
  followUpDate: string | null
  appointmentId?: string
  panchkarmaProcesses?: PanchkarmaProcess[]
}

export interface Dosage {
  time: string
  quantity: string
  instructions: string
}

export interface Duration {
  days: number
  months: number
  years: number
}

export interface Medicine {
  name: string
  type: string
  usage?: string
  dosage: Dosage[]
  duration: Duration
}

export interface SavedMedicine {
  id: string
  name: string
  type: string
  defaultUsage?: string
  defaultDosage: Dosage[]
  defaultDuration: Duration
}

export interface DiagnosisMedicine {
  id?: string
  name: string
  type: string
  usage?: string
  dosage: Dosage[]
  duration: Duration
}

export interface Diagnosis {
  diseaseName: string
  diagnosisText: string
  specialAdvice: string
  medicines: DiagnosisMedicine[]
}

export interface SavedDiagnosis extends Diagnosis {
  id: string
}

export interface ChiefComplaint {
  id: string
  name: string
  complaint: string
}

export interface PanchkarmaItem {
  procedureName: string
  material: string
  days: number
}

export interface PanchkarmaProcess {
  id?: string
  name: string
  procedures: PanchkarmaItem[]
}

export interface SavedPanchkarmaProcess extends PanchkarmaProcess {
  id: string
}

export interface PrintConfig {
  hospitalName: string
  hospitalAddress: string
  hospitalContact: string
  doctorName: string
  doctorQualification: string
  doctorRegistration: string
  printLogo?: boolean
}

export interface CommonDiagnosis {
  id: string
  diseaseName: string
  diagnosisText: string
  specialAdvice?: string
  medicines: Medicine[]
}
