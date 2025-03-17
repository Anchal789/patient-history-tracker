import { ref, get, set, update, remove, push } from "firebase/database"
import { db } from "./firebase"
import type { CommonDiagnosis } from "./types"

// Diagnoses Services
export const getAllDiagnoses = async (): Promise<CommonDiagnosis[]> => {
  const diagnosesRef = ref(db, "diagnoses")
  const snapshot = await get(diagnosesRef)

  if (!snapshot.exists()) {
    return []
  }

  const diagnosesData = snapshot.val()
  const diagnoses: CommonDiagnosis[] = []

  // Convert object to array with IDs
  for (const id in diagnosesData) {
    diagnoses.push({
      id,
      ...diagnosesData[id],
    })
  }

  // Sort by disease name
  diagnoses.sort((a, b) => a.diseaseName.localeCompare(b.diseaseName))

  return diagnoses
}

export const getDiagnosisById = async (id: string): Promise<CommonDiagnosis | null> => {
  const diagnosisRef = ref(db, `diagnoses/${id}`)
  const snapshot = await get(diagnosisRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id,
    ...snapshot.val(),
  }
}

export const createDiagnosis = async (diagnosis: Omit<CommonDiagnosis, "id">): Promise<string> => {
  const diagnosesRef = ref(db, "diagnoses")
  const newDiagnosisRef = push(diagnosesRef)
  const diagnosisId = newDiagnosisRef.key as string

  await set(newDiagnosisRef, {
    ...diagnosis,
    createdAt: Date.now(),
  })

  return diagnosisId
}

export const updateDiagnosis = async (id: string, diagnosis: Partial<CommonDiagnosis>): Promise<void> => {
  const diagnosisRef = ref(db, `diagnoses/${id}`)

  await update(diagnosisRef, {
    ...diagnosis,
    updatedAt: Date.now(),
  })
}

export const deleteDiagnosis = async (id: string): Promise<void> => {
  const diagnosisRef = ref(db, `diagnoses/${id}`)
  await remove(diagnosisRef)
}

