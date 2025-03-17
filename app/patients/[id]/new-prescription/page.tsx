import { PrescriptionForm } from "@/components/prescription-form"

export default function NewPrescriptionPage({ params }: { params: { id: string } }) {
  return <PrescriptionForm patientId={params.id} />
}

