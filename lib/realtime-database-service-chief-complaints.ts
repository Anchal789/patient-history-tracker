import { ref, get, set, update, remove, push } from "firebase/database"
import { db } from "./firebase"
import type { ChiefComplaint } from "./types"

// Chief Complaints Services
export const getAllChiefComplaints = async (): Promise<ChiefComplaint[]> => {
  const complaintsRef = ref(db, "chiefComplaints")
  const snapshot = await get(complaintsRef)

  if (!snapshot.exists()) {
    return []
  }

  const complaintsData = snapshot.val()
  const complaints: ChiefComplaint[] = []

  for (const id in complaintsData) {
    complaints.push({
      id,
      ...complaintsData[id],
    })
  }

  // Sort by name
  complaints.sort((a, b) => a.name.localeCompare(b.name))

  return complaints
}

export const getChiefComplaintById = async (id: string): Promise<ChiefComplaint | null> => {
  const complaintRef = ref(db, `chiefComplaints/${id}`)
  const snapshot = await get(complaintRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id,
    ...snapshot.val(),
  }
}

export const createChiefComplaint = async (complaint: Omit<ChiefComplaint, "id">): Promise<string> => {
  const complaintsRef = ref(db, "chiefComplaints")
  const newComplaintRef = push(complaintsRef)
  const complaintId = newComplaintRef.key as string

  await set(newComplaintRef, {
    ...complaint,
    createdAt: Date.now(),
  })

  return complaintId
}

export const updateChiefComplaint = async (id: string, complaint: Partial<ChiefComplaint>): Promise<void> => {
  const complaintRef = ref(db, `chiefComplaints/${id}`)
  await update(complaintRef, {
    ...complaint,
    updatedAt: Date.now(),
  })
}

export const deleteChiefComplaint = async (id: string): Promise<void> => {
  const complaintRef = ref(db, `chiefComplaints/${id}`)
  await remove(complaintRef)
}
