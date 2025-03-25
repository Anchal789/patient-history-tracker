import { ref, get, set, update, remove, push, onValue, off, orderByChild, equalTo, query } from "firebase/database"
import { db } from "./firebase"
import type { Patient, Prescription } from "./types"

// Data structure helpers
const createPatientData = (
  patient: Omit<Patient, "id" | "prescriptions">,
): Omit<Patient, "id" | "prescriptions"> & { createdAt: number; updatedAt: number } => {
  return {
    ...patient,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

const createPrescriptionData = (
  prescription: Omit<Prescription, "id">,
): Omit<Prescription, "id"> & { createdAt: number } => {
  return {
    ...prescription,
    createdAt: Date.now(),
  }
}

// Patient Services
export const getAllPatients = async (): Promise<Patient[]> => {
  const patientsRef = ref(db, "patients")
  const snapshot = await get(patientsRef)

  if (!snapshot.exists()) {
    return []
  }

  const patientsData = snapshot.val()
  const patients: Patient[] = []

  // Convert object to array with IDs
  for (const id in patientsData) {
    const patient = patientsData[id]

    patients.push({
      id,
      ...patient,
      prescriptions: [], // Initialize empty prescriptions array
    })
  }

  // Get all prescriptions in a single request
  const prescriptionsRef = ref(db, "prescriptions")
  const prescriptionsSnapshot = await get(prescriptionsRef)

  if (prescriptionsSnapshot.exists()) {
    const prescriptionsData = prescriptionsSnapshot.val()

    // Process all prescriptions and assign them to the correct patient
    for (const prescId in prescriptionsData) {
      const prescription = prescriptionsData[prescId]
      const patientId = prescription.patientId

      // Find the patient this prescription belongs to
      const patientIndex = patients.findIndex((p) => p.id === patientId)
      if (patientIndex !== -1) {
        // Add the prescription to the patient's prescriptions array
        if (!patients[patientIndex].prescriptions) {
          patients[patientIndex].prescriptions = []
        }

        patients[patientIndex].prescriptions.push({
          id: prescId,
          ...prescription,
        })
      }
    }

    // Sort prescriptions for each patient by date (newest first)
    patients.forEach((patient) => {
      if (patient.prescriptions && patient.prescriptions.length > 0) {
        patient.prescriptions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }
    })
  }

  return patients
}

export const getPatientById = async (id: string): Promise<Patient | null> => {
  const patientRef = ref(db, `patients/${id}`)
  const snapshot = await get(patientRef)

  if (!snapshot.exists()) {
    return null
  }

  const patientData = snapshot.val()

  // Get all prescriptions
  const prescriptionsRef = ref(db, "prescriptions")
  const prescriptionsSnapshot = await get(prescriptionsRef)

  const prescriptions: Prescription[] = []
  if (prescriptionsSnapshot.exists()) {
    const prescriptionsData = prescriptionsSnapshot.val()

    // Filter prescriptions for this patient
    for (const prescId in prescriptionsData) {
      const prescription = prescriptionsData[prescId]
      if (prescription.patientId === id) {
        prescriptions.push({
          id: prescId,
          ...prescription,
        })
      }
    }

    // Sort prescriptions by date (newest first)
    prescriptions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  return {
    id,
    ...patientData,
    prescriptions,
  }
}

export const createPatient = async (patient: Omit<Patient, "id" | "prescriptions">): Promise<string> => {
  const today = new Date();
  const yy = today.getFullYear().toString().slice(-2);
  const mm = (today.getMonth() + 1).toString().padStart(2, "0");
  const dd = today.getDate().toString().padStart(2, "0");
  const datePrefix = `${yy}${mm}${dd}`; // e.g., "250316"

  // Step 1: Get ALL patients for the day
  const patientsRef = ref(db, "patients");
  const snapshot = await get(patientsRef);

  // Track existing patient IDs for the day
  const existingPatientIds = new Set<string>();

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const patientId = childSnapshot.key;
      if (patientId?.startsWith(datePrefix)) {
        existingPatientIds.add(patientId);
      }
    });
  }

  // Step 2: Find the next available patient number
  let nextPatientNumber = 1;
  while (existingPatientIds.has(`${datePrefix}${nextPatientNumber.toString().padStart(3, "0")}`)) {
    nextPatientNumber++;
  }

  // Step 3: Create your custom patient ID
  const paddedPatientNumber = nextPatientNumber.toString().padStart(3, "0");
  const patientId = `${datePrefix}${paddedPatientNumber}`; // e.g., "250316001"

  // Step 4: Save the new patient with this custom ID
  const newPatientRef = ref(db, `patients/${patientId}`);

  // Attach `createdAt` field to patient data
  const patientDataWithTimestamp = {
    ...patient,
    createdAt: Date.now() // store timestamp for future lookups
  };

  // Step 5: Save patient
  await set(newPatientRef, patientDataWithTimestamp);

  return patientId;
}

export const updatePatient = async (id: string, patient: Partial<Patient>): Promise<void> => {
  const patientRef = ref(db, `patients/${id}`)

  // Remove prescriptions from update data if present
  const { prescriptions, ...updateData } = patient

  await update(patientRef, {
    ...updateData,
    updatedAt: Date.now(),
  })
}

export const deletePatient = async (id: string): Promise<void> => {
  const patientRef = ref(db, `patients/${id}`)
  await remove(patientRef)

  // Get all prescriptions
  const prescriptionsRef = ref(db, "prescriptions")
  const prescriptionsSnapshot = await get(prescriptionsRef)

  if (prescriptionsSnapshot.exists()) {
    const prescriptionsData = prescriptionsSnapshot.val()

    // Find and delete prescriptions for this patient
    const deletePromises = Object.entries(prescriptionsData)
      ?.filter(([_, prescription]) => (prescription as any).patientId === id)
      ?.map(([prescId, _]) => {
        const prescRef = ref(db, `prescriptions/${prescId}`)
        return remove(prescRef)
      })

    await Promise.all(deletePromises)
  }
}

// Prescription Services
export const createPrescription = async (prescription: Omit<Prescription, "id">): Promise<string> => {
  const prescriptionsRef = ref(db, "prescriptions")
  const newPrescRef = push(prescriptionsRef)
  const prescriptionId = newPrescRef.key as string

  await set(newPrescRef, createPrescriptionData(prescription))

  // Update patient with latest vitals
  if (prescription.weight || prescription.bloodPressure) {
    const patientRef = ref(db, `patients/${prescription.patientId}`)
    const updateData: Record<string, any> = { updatedAt: Date.now() }

    if (prescription.weight) updateData.weight = prescription.weight
    if (prescription.bloodPressure) updateData.bloodPressure = prescription.bloodPressure

    await update(patientRef, updateData)
  }

  return prescriptionId
}

export const updatePrescription = async (id: string, prescription: Partial<Prescription>): Promise<void> => {
  const prescriptionRef = ref(db, `prescriptions/${id}`)
  await update(prescriptionRef, prescription)

  // Update patient with latest vitals if provided
  if ((prescription.weight || prescription.bloodPressure) && prescription.patientId) {
    const patientRef = ref(db, `patients/${prescription.patientId}`)
    const patientUpdateData: Record<string, any> = { updatedAt: Date.now() }

    if (prescription.weight) patientUpdateData.weight = prescription.weight
    if (prescription.bloodPressure) patientUpdateData.bloodPressure = prescription.bloodPressure

    await update(patientRef, patientUpdateData)
  }
}

export const deletePrescription = async (id: string): Promise<void> => {
  const prescriptionRef = ref(db, `prescriptions/${id}`)
  await remove(prescriptionRef)
}

// Special Queries
export const getUpcomingFollowUps = async (
  daysAhead = 4,
): Promise<{ patient: Patient; prescription: Prescription }[]> => {
  // Get all prescriptions
  const prescriptionsRef = ref(db, "prescriptions")
  const snapshot = await get(prescriptionsRef)

  if (!snapshot.exists()) {
    return []
  }

  const prescriptionsData = snapshot.val()
  const today = new Date()
  const endDate = new Date()
  endDate.setDate(today.getDate() + daysAhead)

  const results: { patient: Patient; prescription: Prescription }[] = []
  const patientCache: Record<string, Patient> = {} // Cache to avoid duplicate patient fetches

  for (const id in prescriptionsData) {
    const prescriptionData = prescriptionsData[id]

    // Skip if no follow-up date or if follow-up date is outside our range
    if (!prescriptionData.followUpDate) continue

    const followUpDate = new Date(prescriptionData.followUpDate)
    if (followUpDate < today || followUpDate > endDate) continue

    const patientId = prescriptionData.patientId

    // Get patient data (from cache if available)
    let patient: Patient | null
    if (patientCache[patientId]) {
      patient = patientCache[patientId]
    } else {
      patient = await getPatientById(patientId)
      if (patient) {
        patientCache[patientId] = patient
      }
    }

    if (patient) {
      results.push({
        patient,
        prescription: {
          id,
          ...prescriptionData,
        },
      })
    }
  }

  // Sort by follow-up date
  results.sort(
    (a, b) => new Date(a.prescription.followUpDate!).getTime() - new Date(b.prescription.followUpDate!).getTime(),
  )

  return results
}

export const getRecentVisits = async (daysBack = 7): Promise<{ patient: Patient; prescription: Prescription }[]> => {
  // Get all prescriptions
  const prescriptionsRef = ref(db, "prescriptions")
  const snapshot = await get(prescriptionsRef)

  if (!snapshot.exists()) {
    return []
  }

  const prescriptionsData = snapshot.val()
  const today = new Date()
  const startDate = new Date()
  startDate.setDate(today.getDate() - daysBack)

  const results: { patient: Patient; prescription: Prescription }[] = []
  const processedPatientIds = new Set<string>()
  const patientCache: Record<string, Patient> = {} // Cache to avoid duplicate patient fetches

  for (const id in prescriptionsData) {
    const prescriptionData = prescriptionsData[id]
    const visitDate = new Date(prescriptionData.date)

    // Skip if visit date is outside our range
    if (visitDate < startDate || visitDate > today) continue

    // Skip if we already have this patient (to avoid duplicates)
    const patientId = prescriptionData.patientId
    if (processedPatientIds.has(patientId)) continue

    // Get patient data (from cache if available)
    let patient: Patient | null
    if (patientCache[patientId]) {
      patient = patientCache[patientId]
    } else {
      patient = await getPatientById(patientId)
      if (patient) {
        patientCache[patientId] = patient
      }
    }

    if (patient) {
      results.push({
        patient,
        prescription: {
          id,
          ...prescriptionData,
        },
      })

      processedPatientIds.add(patientId)
    }
  }

  // Sort by date (newest first)
  results.sort((a, b) => new Date(b.prescription.date).getTime() - new Date(a.prescription.date).getTime())

  return results
}

// Real-time subscription helpers
export const subscribeToPatient = (patientId: string, callback: (patient: Patient | null) => void): (() => void) => {
  const patientRef = ref(db, `patients/${patientId}`)

  const handlePatientChange = async (snapshot: any) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }

    const patientData = snapshot.val()

    // Get all prescriptions
    const prescriptionsRef = ref(db, "prescriptions")
    const prescriptionsSnapshot = await get(prescriptionsRef)

    const prescriptions: Prescription[] = []
    if (prescriptionsSnapshot.exists()) {
      const prescriptionsData = prescriptionsSnapshot.val()

      // Filter prescriptions for this patient
      for (const prescId in prescriptionsData) {
        const prescription = prescriptionsData[prescId]
        if (prescription.patientId === patientId) {
          prescriptions.push({
            id: prescId,
            ...prescription,
          })
        }
      }

      // Sort prescriptions by date (newest first)
      prescriptions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    callback({
      id: patientId,
      ...patientData,
      prescriptions,
    })
  }

  onValue(patientRef, handlePatientChange)

  // Return unsubscribe function
  return () => off(patientRef, "value", handlePatientChange)
}

// Function to seed initial data
export const seedInitialData = async () => {
  // Check if data already exists
  const patientsRef = ref(db, "patients")
  const patientsSnapshot = await get(patientsRef)

  if (patientsSnapshot.exists()) {
    return
  }

  // Sample patients
  const patients = [
    {
      name: "Smt Tilkan",
      age: "45",
      gender: "Female",
      weight: "68",
      height: "162",
      bloodGroup: "B+",
      bloodPressure: "120/80",
      address: "64/2 Shivaji Nagar, Delhi",
      pastIllnesses: "Hypertension, Seasonal allergies",
    },
    {
      name: "Rahul Sharma",
      age: "32",
      gender: "Male",
      weight: "75",
      height: "175",
      bloodGroup: "O+",
      bloodPressure: "118/76",
      address: "22 Park Avenue, Mumbai",
      pastIllnesses: "None",
    },
    {
      name: "Priya Patel",
      age: "28",
      gender: "Female",
      weight: "56",
      height: "160",
      bloodGroup: "A+",
      bloodPressure: "110/70",
      address: "45 Gandhi Road, Ahmedabad",
      pastIllnesses: "Asthma",
    },
  ]

  // Sample medicines
  const medicines = [
    {
      name: "महासुदर्शन काढ़ा",
      type: "Syrup",
      defaultDosage: [
        {
          time: "Morning",
          quantity: "4 चम्मच",
          instructions: "Before Meal",
        },
        {
          time: "Evening",
          quantity: "4 चम्मच",
          instructions: "Before Meal",
        },
      ],
      defaultDuration: {
        days: 5,
        months: 0,
        years: 0,
      },
    },
    {
      name: "पंचतिक्त घृत गुग्गुलु",
      type: "Tablet",
      defaultDosage: [
        {
          time: "Morning",
          quantity: "2 टेबलेट",
          instructions: "After Meal",
        },
        {
          time: "Evening",
          quantity: "2 टेबलेट",
          instructions: "After Meal",
        },
      ],
      defaultDuration: {
        days: 7,
        months: 0,
        years: 0,
      },
    },
    {
      name: "Paracetamol",
      type: "Tablet",
      defaultDosage: [
        {
          time: "Morning",
          quantity: "1",
          instructions: "After Meal",
        },
        {
          time: "Evening",
          quantity: "1",
          instructions: "After Meal",
        },
      ],
      defaultDuration: {
        days: 3,
        months: 0,
        years: 0,
      },
    },
  ]

  // Sample diagnoses
  const diagnoses = [
    {
      diseaseName: "अर्थिक्ष्णता गत वात",
      diagnosisText: "अर्थिक्ष्णता गत वात with वातरक्ता",
      specialAdvice: "Avoid cold foods, Rest and limit physical activity for 1 week",
      medicines: [
        {
          name: "महासुदर्शन काढ़ा",
          type: "Syrup",
          dosage: [
            {
              time: "Morning",
              quantity: "4 चम्मच",
              instructions: "Before Meal",
            },
            {
              time: "Evening",
              quantity: "4 चम्मच",
              instructions: "Before Meal",
            },
          ],
          duration: {
            days: 5,
            months: 0,
            years: 0,
          },
        },
        {
          name: "पंचतिक्त घृत गुग्गुलु",
          type: "Tablet",
          dosage: [
            {
              time: "Morning",
              quantity: "2 टेबलेट",
              instructions: "After Meal",
            },
            {
              time: "Evening",
              quantity: "2 टेबलेट",
              instructions: "After Meal",
            },
          ],
          duration: {
            days: 7,
            months: 0,
            years: 0,
          },
        },
      ],
    },
    {
      diseaseName: "Common Cold",
      diagnosisText: "Viral upper respiratory tract infection",
      specialAdvice: "Drink plenty of water and rest well",
      medicines: [
        {
          name: "Paracetamol",
          type: "Tablet",
          dosage: [
            {
              time: "Morning",
              quantity: "1",
              instructions: "After Meal",
            },
            {
              time: "Evening",
              quantity: "1",
              instructions: "After Meal",
            },
          ],
          duration: {
            days: 3,
            months: 0,
            years: 0,
          },
        },
        {
          name: "Cetirizine",
          type: "Tablet",
          dosage: [
            {
              time: "Night",
              quantity: "1",
              instructions: "After Meal",
            },
          ],
          duration: {
            days: 5,
            months: 0,
            years: 0,
          },
        },
      ],
    },
  ]

  // Create patients and their prescriptions
  const patientIds = []
  for (const patientData of patients) {
    const patientId = await createPatient(patientData)
    patientIds.push(patientId)
  }

  // Create medicines
  const medicinesRef = ref(db, "medicines")
  for (const medicine of medicines) {
    const newMedicineRef = push(medicinesRef)
    await set(newMedicineRef, {
      ...medicine,
      createdAt: Date.now(),
    })
  }

  // Create diagnoses
  const diagnosesRef = ref(db, "diagnoses")
  for (const diagnosis of diagnoses) {
    const newDiagnosisRef = push(diagnosesRef)
    await set(newDiagnosisRef, {
      ...diagnosis,
      createdAt: Date.now(),
    })
  }

  // Create sample prescriptions for each patient
  // First patient (Smt Tilkan)
  if (patientIds[0]) {
    const prescription = {
      patientId: patientIds[0],
      date: new Date("2024-02-18T14:42:00").toISOString(),
      weight: "68",
      bloodPressure: "120/80",
      temperature: "97",
      specialAdvice: "Avoid cold foods, Rest and limit physical activity for 1 week",
      followUpDate: new Date("2024-02-23T15:03:00").toISOString(),
      chiefComplaints: "pain and swelling at knee joint (left), Difficulty walking, Anorexia, hyperacidity, Vomiting",
      pulse: "74",
      respRate: "15",
      spo2: "98",
      examNotes: "Swelling ++ (left knee joint)",
      diagnosis: "अर्थिक्ष्णता गत वात with वातरक्ता",
      appointmentId: "4f5eb525-79f4-45f0-971b-57155d519db1",
      medicines: [
        {
          name: "महासुदर्शन काढ़ा",
          type: "Syrup",
          dosage: [
            {
              time: "Morning",
              quantity: "4 चम्मच",
              instructions: "Before Meal",
            },
            {
              time: "Evening",
              quantity: "4 चम्मच",
              instructions: "Before Meal",
            },
          ],
          duration: {
            days: 5,
            months: 0,
            years: 0,
          },
        },
        {
          name: "पंचतिक्त घृत गुग्गुलु",
          type: "Tablet",
          dosage: [
            {
              time: "Morning",
              quantity: "2 टेबलेट",
              instructions: "After Meal",
            },
            {
              time: "Evening",
              quantity: "2 टेबलेट",
              instructions: "After Meal",
            },
          ],
          duration: {
            days: 7,
            months: 0,
            years: 0,
          },
        },
        {
          name: "लीलावताडि चूर्ण",
          type: "Powder",
          dosage: [
            {
              time: "Evening",
              quantity: "1",
              instructions: "After Meal",
            },
          ],
          duration: {
            days: 7,
            months: 0,
            years: 0,
          },
        },
        {
          name: "सिंहनाद गुग्गुलु",
          type: "Tablet",
          dosage: [
            {
              time: "Evening",
              quantity: "1",
              instructions: "Before Meal",
            },
          ],
          duration: {
            days: 5,
            months: 0,
            years: 0,
          },
        },
      ],
    }

    await createPrescription(prescription)
  }

  // Add a generic prescription for other patients
  for (let i = 1; i < patientIds.length; i++) {
    const patientId = patientIds[i]
    if (patientId) {
      const patient = patients[i]
      const prescription = {
        patientId,
        date: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
        weight: patient.weight,
        bloodPressure: patient.bloodPressure,
        temperature: "98.6",
        specialAdvice: "Drink plenty of water and rest well",
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        chiefComplaints: "Fever, Cold, Cough",
        pulse: "78",
        respRate: "16",
        spo2: "98",
        examNotes: "Mild congestion",
        diagnosis: "Common cold",
        appointmentId: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        medicines: [
          {
            name: "Paracetamol",
            type: "Tablet",
            dosage: [
              {
                time: "Morning",
                quantity: "1",
                instructions: "After Meal",
              },
              {
                time: "Evening",
                quantity: "1",
                instructions: "After Meal",
              },
            ],
            duration: {
              days: 3,
              months: 0,
              years: 0,
            },
          },
          {
            name: "Cetirizine",
            type: "Tablet",
            dosage: [
              {
                time: "Night",
                quantity: "1",
                instructions: "After Meal",
              },
            ],
            duration: {
              days: 5,
              months: 0,
              years: 0,
            },
          },
        ],
      }

      await createPrescription(prescription)
    }
  }

}

