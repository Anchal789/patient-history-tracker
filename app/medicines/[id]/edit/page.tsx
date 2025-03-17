import { MedicineForm } from "@/components/medicine-form"

export default function EditMedicinePage({ params }: { params: { id: string } }) {
  return <MedicineForm medicineId={params.id} />
}

