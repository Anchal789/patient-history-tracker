import { PatientForm } from "@/components/patient-form"

export default function EditPatientPage({ params }: { params: { id: string } }) {
  return <PatientForm patientId={params.id} />
}

