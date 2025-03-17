import { FollowUpList } from "@/components/follow-up-list"

export default function AppointmentsPage() {
  return (
    <div className="container mx-auto py-6 space-y-4">
      <h1 className="text-3xl font-bold">Upcoming Appointments</h1>
      <p className="text-muted-foreground">Manage your patient follow-ups and appointments</p>

      <div className="max-w-2xl">
        <FollowUpList />
      </div>
    </div>
  )
}

