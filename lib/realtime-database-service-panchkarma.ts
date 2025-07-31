import { ref, get, set, update, remove, push } from "firebase/database"
import { db } from "./firebase"
import type { SavedPanchkarmaProcess } from "./types"

// Panchkarma Processes Services
export const getAllPanchkarmaProcesses = async (): Promise<SavedPanchkarmaProcess[]> => {
  const processesRef = ref(db, "panchkarmaProcesses")
  const snapshot = await get(processesRef)

  if (!snapshot.exists()) {
    return []
  }

  const processesData = snapshot.val()
  const processes: SavedPanchkarmaProcess[] = []

  for (const id in processesData) {
    processes.push({
      id,
      ...processesData[id],
    })
  }

  // Sort by name
  processes.sort((a, b) => a.name.localeCompare(b.name))

  return processes
}

export const getPanchkarmaProcessById = async (id: string): Promise<SavedPanchkarmaProcess | null> => {
  const processRef = ref(db, `panchkarmaProcesses/${id}`)
  const snapshot = await get(processRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id,
    ...snapshot.val(),
  }
}

export const createPanchkarmaProcess = async (process: Omit<SavedPanchkarmaProcess, "id">): Promise<string> => {
  const processesRef = ref(db, "panchkarmaProcesses")
  const newProcessRef = push(processesRef)
  const processId = newProcessRef.key as string

  await set(newProcessRef, {
    ...process,
    createdAt: Date.now(),
  })

  return processId
}

export const updatePanchkarmaProcess = async (id: string, process: Partial<SavedPanchkarmaProcess>): Promise<void> => {
  const processRef = ref(db, `panchkarmaProcesses/${id}`)
  await update(processRef, {
    ...process,
    updatedAt: Date.now(),
  })
}

export const deletePanchkarmaProcess = async (id: string): Promise<void> => {
  const processRef = ref(db, `panchkarmaProcesses/${id}`)
  await remove(processRef)
}
