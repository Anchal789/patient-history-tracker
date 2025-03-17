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
  afebrileTemperature?:boolean 
  temperature?: string
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
}

export interface Medicine {
  name: string
  type: string
  dosage: Dosage[]
  duration: {
    days: number
    months: number
    years: number
  }
}

export interface Dosage {
  time: string
  quantity: string
  instructions: string
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

export interface SavedMedicine {
  id: string
  name: string
  type: string
  defaultDosage: Dosage[]
  defaultDuration: {
    days: number
    months: number
    years: number
  }
}

export interface CommonDiagnosis {
  id: string
  diseaseName: string
  diagnosisText: string
  specialAdvice?: string
  medicines: Medicine[]
}

