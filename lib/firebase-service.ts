import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Patient, Prescription } from "./types"

// Collections
const PATIENTS_COLLECTION = "patients"
const PRESCRIPTIONS_COLLECTION = "prescriptions"

// Patient Services
export const getAllPatients = async (): Promise<Patient[]> => {
  const patientsCollection = collection(db, PATIENTS_COLLECTION)
  const snapshot = await getDocs(patientsCollection)

  const patients: Patient[] = []
  for (const doc of snapshot.docs) {
    const patientData = doc.data()

    // Get prescriptions for this patient
    const prescriptionsQuery = query(
      collection(db, PRESCRIPTIONS_COLLECTION),
      where("patientId", "==", doc.id),
      orderBy("date", "desc"),
    )

    const prescriptionsSnapshot = await getDocs(prescriptionsQuery)
    const prescriptions = prescriptionsSnapshot.docs?.map((prescDoc) => ({
      id: prescDoc.id,
      ...prescDoc.data(),
      date: prescDoc.data().date.toDate().toISOString(),
      followUpDate: prescDoc.data().followUpDate ? prescDoc.data().followUpDate.toDate().toISOString() : null,
    })) as Prescription[]

    patients.push({
      id: doc.id,
      ...patientData,
      prescriptions,
    } as Patient)
  }

  return patients
}

export const getPatientById = async (id: string): Promise<Patient | null> => {
  const patientDoc = doc(db, PATIENTS_COLLECTION, id)
  const patientSnapshot = await getDoc(patientDoc)

  if (!patientSnapshot.exists()) {
    return null
  }

  const patientData = patientSnapshot.data()

  // Get prescriptions for this patient
  const prescriptionsQuery = query(
    collection(db, PRESCRIPTIONS_COLLECTION),
    where("patientId", "==", id),
    orderBy("date", "desc"),
  )

  const prescriptionsSnapshot = await getDocs(prescriptionsQuery)
  const prescriptions = prescriptionsSnapshot.docs?.map((prescDoc) => ({
    id: prescDoc.id,
    ...prescDoc.data(),
    date: prescDoc.data().date.toDate().toISOString(),
    followUpDate: prescDoc.data().followUpDate ? prescDoc.data().followUpDate.toDate().toISOString() : null,
  })) as Prescription[]

  return {
    id,
    ...patientData,
    prescriptions,
  } as Patient
}

export const createPatient = async (patient: Omit<Patient, "id" | "prescriptions">): Promise<string> => {
  const patientData = {
    ...patient,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), patientData)
  return docRef.id
}

export const updatePatient = async (id: string, patient: Partial<Patient>): Promise<void> => {
  const patientDoc = doc(db, PATIENTS_COLLECTION, id)

  // Remove prescriptions from update data if present
  const { prescriptions, ...updateData } = patient

  await updateDoc(patientDoc, {
    ...updateData,
    updatedAt: serverTimestamp(),
  })
}

export const deletePatient = async (id: string): Promise<void> => {
  const patientDoc = doc(db, PATIENTS_COLLECTION, id)
  await deleteDoc(patientDoc)

  // Delete associated prescriptions
  const prescriptionsQuery = query(collection(db, PRESCRIPTIONS_COLLECTION), where("patientId", "==", id))

  const prescriptionsSnapshot = await getDocs(prescriptionsQuery)
  const deletePromises = prescriptionsSnapshot.docs?.map((prescDoc) =>
    deleteDoc(doc(db, PRESCRIPTIONS_COLLECTION, prescDoc.id)),
  )

  await Promise.all(deletePromises)
}

// Prescription Services
export const createPrescription = async (prescription: Omit<Prescription, "id">): Promise<string> => {
  const prescriptionData = {
    ...prescription,
    date: Timestamp.fromDate(new Date(prescription.date)),
    followUpDate: prescription.followUpDate ? Timestamp.fromDate(new Date(prescription.followUpDate)) : null,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, PRESCRIPTIONS_COLLECTION), prescriptionData)

  // Update patient with latest vitals
  if (prescription.weight || prescription.bloodPressure) {
    const patientDoc = doc(db, PATIENTS_COLLECTION, prescription.patientId)
    const updateData: Record<string, any> = { updatedAt: serverTimestamp() }

    if (prescription.weight) updateData.weight = prescription.weight
    if (prescription.bloodPressure) updateData.bloodPressure = prescription.bloodPressure

    await updateDoc(patientDoc, updateData)
  }

  return docRef.id
}

export const updatePrescription = async (id: string, prescription: Partial<Prescription>): Promise<void> => {
  const prescriptionDoc = doc(db, PRESCRIPTIONS_COLLECTION, id)

  const updateData: Record<string, any> = { ...prescription }

  // Convert date fields to Firestore Timestamps
  if (prescription.date) {
    updateData.date = Timestamp.fromDate(new Date(prescription.date))
  }

  if (prescription.followUpDate) {
    updateData.followUpDate = Timestamp.fromDate(new Date(prescription.followUpDate))
  } else if (prescription.followUpDate === null) {
    updateData.followUpDate = null
  }

  await updateDoc(prescriptionDoc, updateData)

  // Update patient with latest vitals if provided
  if ((prescription.weight || prescription.bloodPressure) && prescription.patientId) {
    const patientDoc = doc(db, PATIENTS_COLLECTION, prescription.patientId)
    const patientUpdateData: Record<string, any> = { updatedAt: serverTimestamp() }

    if (prescription.weight) patientUpdateData.weight = prescription.weight
    if (prescription.bloodPressure) patientUpdateData.bloodPressure = prescription.bloodPressure

    await updateDoc(patientDoc, patientUpdateData)
  }
}

export const deletePrescription = async (id: string): Promise<void> => {
  const prescriptionDoc = doc(db, PRESCRIPTIONS_COLLECTION, id)
  await deleteDoc(prescriptionDoc)
}

// Special Queries
export const getUpcomingFollowUps = async (
  daysAhead = 4,
): Promise<{ patient: Patient; prescription: Prescription }[]> => {
  const today = new Date()
  const endDate = new Date()
  endDate.setDate(today.getDate() + daysAhead)

  const prescriptionsQuery = query(
    collection(db, PRESCRIPTIONS_COLLECTION),
    where("followUpDate", ">=", Timestamp.fromDate(today)),
    where("followUpDate", "<=", Timestamp.fromDate(endDate)),
  )

  const prescriptionsSnapshot = await getDocs(prescriptionsQuery)

  const results: { patient: Patient; prescription: Prescription }[] = []

  for (const prescDoc of prescriptionsSnapshot.docs) {
    const prescriptionData = prescDoc.data()
    const patientId = prescriptionData.patientId

    const patient = await getPatientById(patientId)
    if (patient) {
      const prescription = {
        id: prescDoc.id,
        ...prescriptionData,
        date: prescriptionData.date.toDate().toISOString(),
        followUpDate: prescriptionData.followUpDate ? prescriptionData.followUpDate.toDate().toISOString() : null,
      } as Prescription

      results.push({ patient, prescription })
    }
  }

  return results
}

export const getRecentVisits = async (daysBack = 7): Promise<{ patient: Patient; prescription: Prescription }[]> => {
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(today.getDate() - daysBack)

  const prescriptionsQuery = query(
    collection(db, PRESCRIPTIONS_COLLECTION),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(today)),
    orderBy("date", "desc"),
  )

  const prescriptionsSnapshot = await getDocs(prescriptionsQuery)

  const results: { patient: Patient; prescription: Prescription }[] = []
  const processedPatientIds = new Set<string>()

  for (const prescDoc of prescriptionsSnapshot.docs) {
    const prescriptionData = prescDoc.data()
    const patientId = prescriptionData.patientId

    // Skip if we already have this patient (to avoid duplicates)
    if (processedPatientIds.has(patientId)) continue

    const patient = await getPatientById(patientId)
    if (patient) {
      const prescription = {
        id: prescDoc.id,
        ...prescriptionData,
        date: prescriptionData.date.toDate().toISOString(),
        followUpDate: prescriptionData.followUpDate ? prescriptionData.followUpDate.toDate().toISOString() : null,
      } as Prescription

      results.push({ patient, prescription })
      processedPatientIds.add(patientId)
    }
  }

  return results
}

