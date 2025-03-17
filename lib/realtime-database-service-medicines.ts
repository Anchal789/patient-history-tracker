import { ref, get, set, update, remove, push } from "firebase/database"
import { db } from "./firebase"
import type { SavedMedicine } from "./types"

// Medicines Services
export const getAllMedicines = async (): Promise<SavedMedicine[]> => {
  const medicinesRef = ref(db, "medicines")
  const snapshot = await get(medicinesRef)

  if (!snapshot.exists()) {
    return []
  }

  const medicinesData = snapshot.val()
  const medicines: SavedMedicine[] = []

  // Convert object to array with IDs
  for (const id in medicinesData) {
    medicines.push({
      id,
      ...medicinesData[id],
    })
  }

  // Sort by name
  medicines.sort((a, b) => a.name.localeCompare(b.name))

  return medicines
}

export const getMedicineById = async (id: string): Promise<SavedMedicine | null> => {
  const medicineRef = ref(db, `medicines/${id}`)
  const snapshot = await get(medicineRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id,
    ...snapshot.val(),
  }
}

export const createMedicine = async (medicine: Omit<SavedMedicine, "id">): Promise<string> => {
  const medicinesRef = ref(db, "medicines")
  const newMedicineRef = push(medicinesRef)
  const medicineId = newMedicineRef.key as string

  await set(newMedicineRef, {
    ...medicine,
    createdAt: Date.now(),
  })

  return medicineId
}

export const updateMedicine = async (id: string, medicine: Partial<SavedMedicine>): Promise<void> => {
  const medicineRef = ref(db, `medicines/${id}`)

  await update(medicineRef, {
    ...medicine,
    updatedAt: Date.now(),
  })
}

export const deleteMedicine = async (id: string): Promise<void> => {
  const medicineRef = ref(db, `medicines/${id}`)
  await remove(medicineRef)
}

