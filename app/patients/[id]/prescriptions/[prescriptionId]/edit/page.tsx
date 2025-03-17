import { PrescriptionForm } from "@/components/prescription-form"

export default function EditPrescriptionPage({
  params,
}: {
  params: { id: string; prescriptionId: string }
}) {
  return <PrescriptionForm patientId={params.id} prescriptionId={params.prescriptionId} />
}

