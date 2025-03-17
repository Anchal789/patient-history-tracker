import { PatientDetails } from "@/components/patient-details"

export default function PatientDetailsPage({ params }: { params: { id: string } }) {
  return <PatientDetails patientId={params.id} />
}

