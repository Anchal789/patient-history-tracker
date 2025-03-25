"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import type { Patient, Prescription } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DatePicker } from "@/components/date-picker"
import { getUpcomingFollowUps, updatePrescription } from "@/lib/realtime-database-service"
import { Skeleton } from "@/components/ui/skeleton"

export function FollowUpList() {
  const router = useRouter()
  const [followUps, setFollowUps] = useState<{ patient: Patient; prescription: Prescription }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<{ patientId: string; prescriptionId: string } | null>(null)
  const [newFollowUpDate, setNewFollowUpDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    const loadFollowUps = async () => {
      setIsLoading(true)
      try {
        const followUpsData = await getUpcomingFollowUps(4)
        setFollowUps(followUpsData)
      } catch (error) {
        console.error("Error loading follow-ups:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFollowUps()
  }, [])

  const handleComplete = (patientId: string) => {
    router.push(`/patients/${patientId}/new-prescription`)
  }

  const openReschedule = (patientId: string, prescriptionId: string) => {
    setSelectedFollowUp({ patientId, prescriptionId })
    setIsRescheduleOpen(true)
  }

  const handleReschedule = async () => {
    if (!selectedFollowUp || !newFollowUpDate) return

    try {
      await updatePrescription(selectedFollowUp.prescriptionId, {
        followUpDate: newFollowUpDate.toISOString(),
      })

      // Update local state
      setFollowUps((prevFollowUps) =>
        prevFollowUps?.map((item) => {
          if (item.prescription.id === selectedFollowUp.prescriptionId) {
            return {
              ...item,
              prescription: {
                ...item.prescription,
                followUpDate: newFollowUpDate.toISOString(),
              },
            }
          }
          return item
        }),
      )

      setIsRescheduleOpen(false)
      setSelectedFollowUp(null)
      setNewFollowUpDate(undefined)
    } catch (error) {
      console.error("Error rescheduling follow-up:", error)
    }
  }

  const handleCancel = async () => {
    if (!selectedFollowUp) return

    try {
      await updatePrescription(selectedFollowUp.prescriptionId, {
        followUpDate: null,
      })

      // Update local state
      setFollowUps((prevFollowUps) =>
        prevFollowUps?.filter((item) => item.prescription.id !== selectedFollowUp.prescriptionId),
      )

      setIsRescheduleOpen(false)
      setSelectedFollowUp(null)
    } catch (error) {
      console.error("Error canceling follow-up:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(3)
          .fill(0)
          ?.map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
      </div>
    )
  }

  if (followUps.length === 0) {
    return <div className="text-center text-muted-foreground py-4">No upcoming follow-ups</div>
  }

  return (
    <div className="space-y-3">
      {followUps?.map(({ patient, prescription }) => (
        <Card key={`${patient.id}-${prescription.id}`}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">{patient.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Follow-up: {format(new Date(prescription.followUpDate!), "PPP")}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleComplete(patient.id)}>
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Complete</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => openReschedule(patient.id, prescription.id)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Reschedule</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Follow-up</DialogTitle>
            <DialogDescription>Choose a new date or permanently cancel this follow-up.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <DatePicker date={newFollowUpDate} setDate={setNewFollowUpDate} label="New Follow-up Date" />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Follow-up
            </Button>
            <Button onClick={handleReschedule} disabled={!newFollowUpDate}>
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

