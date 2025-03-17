import { DiagnosisForm } from "@/components/diagnosis-form"

export default function EditDiagnosisPage({ params }: { params: { id: string } }) {
  return <DiagnosisForm diagnosisId={params.id} />
}

