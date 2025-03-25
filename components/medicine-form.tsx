"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { Medicine, Dosage } from "@/lib/types"
import { getMedicineById, createMedicine, updateMedicine } from "@/lib/realtime-database-service-medicines"

const medicineTypes = ["Tablet", "Capsule", "Syrup", "Cream", "Powder", "Injection", "Drops", "Inhaler", "Patch"]
const timings = ["Morning", "Afternoon", "Evening", "Night"]
const instructions = ["Before food", "After food", "With food", "Empty stomach"]

interface MedicineFormProps {
  medicineId?: string
}

export function MedicineForm({ medicineId }: MedicineFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [medicineName, setMedicineName] = useState("")
  const [medicineType, setMedicineType] = useState("Tablet")
  const [dosages, setDosages] = useState<Dosage[]>([])
  const [durationDays, setDurationDays] = useState(0)
  const [durationMonths, setDurationMonths] = useState(0)
  const [durationYears, setDurationYears] = useState(0)

  useEffect(() => {
    if (medicineId) {
      fetchMedicine(medicineId)
    }
  }, [medicineId])

  const fetchMedicine = async (id: string) => {
    setIsLoading(true)
    try {
      const medicine = await getMedicineById(id)
      if (medicine) {
        setMedicineName(medicine.name)
        setMedicineType(medicine.type)
        setDosages(medicine.defaultDosage || [])
        setDurationDays(medicine.defaultDuration?.days || 0)
        setDurationMonths(medicine.defaultDuration?.months || 0)
        setDurationYears(medicine.defaultDuration?.years || 0)
      } else {
        toast({
          title: "Error",
          description: "Medicine not found",
          variant: "destructive",
        })
        router.push("/medicines")
      }
    } catch (error) {
      console.error("Error fetching medicine:", error)
      toast({
        title: "Error",
        description: "Failed to load medicine details",
        variant: "destructive",
      })
      router.push("/medicines")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDosageChange = (timing: string, checked: boolean) => {
    if (checked) {
      // Add new dosage
      setDosages([
        ...dosages,
        {
          time: timing,
          quantity: "1",
          instructions: "After food",
        },
      ])
    } else {
      // Remove dosage
      setDosages(dosages?.filter((d) => d.time !== timing))
    }
  }

  const handleDosageDetailChange = (timing: string, field: keyof Dosage, value: string) => {
    setDosages(
      dosages?.map((d) => {
        if (d.time === timing) {
          return { ...d, [field]: value }
        }
        return d
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!medicineName.trim()) {
      toast({
        title: "Error",
        description: "Medicine name is required",
        variant: "destructive",
      })
      return
    }

    if (dosages.length === 0) {
      toast({
        title: "Error",
        description: "At least one dosage timing is required",
        variant: "destructive",
      })
      return
    }

    const totalDuration = durationDays + durationMonths + durationYears
    if (totalDuration === 0) {
      toast({
        title: "Error",
        description: "Duration is required",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const medicineData: Medicine = {
        name: medicineName,
        type: medicineType,
        defaultDosage: dosages,
        defaultDuration: {
          days: durationDays,
          months: durationMonths,
          years: durationYears,
        },
      }

      if (medicineId) {
        // Update existing medicine
        await updateMedicine(medicineId, medicineData)
        toast({
          title: "Success",
          description: "Medicine updated successfully",
        })
      } else {
        // Create new medicine
        await createMedicine(medicineData)
        toast({
          title: "Success",
          description: "Medicine added successfully",
        })
      }

      // Redirect back to medicines list
      router.push("/medicines")
    } catch (error) {
      console.error("Error saving medicine:", error)
      toast({
        title: "Error",
        description: medicineId ? "Failed to update medicine" : "Failed to add medicine",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading medicine details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/medicines")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Medicines
        </Button>
        <h1 className="text-3xl font-bold">{medicineId ? "Edit Medicine" : "Add New Medicine"}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{medicineId ? "Edit Medicine" : "Add New Medicine"}</CardTitle>
            <CardDescription>
              {medicineId ? "Update the details of this medicine" : "Enter the details of the new medicine"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name</Label>
                <Input
                  id="name"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="Enter medicine name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Medicine Type</Label>
                <Select value={medicineType} onValueChange={setMedicineType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicineTypes?.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Dosage Schedule</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {timings?.map((timing) => {
                  const isChecked = dosages?.some((d) => d.time === timing)
                  const dosage = dosages?.find((d) => d.time === timing)

                  return (
                    <div key={timing} className="space-y-4 border rounded-md p-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`timing-${timing}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleDosageChange(timing, checked as boolean)}
                        />
                        <Label htmlFor={`timing-${timing}`} className="font-medium">
                          {timing}
                        </Label>
                      </div>

                      {isChecked && (
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor={`quantity-${timing}`} className="text-sm">
                              Quantity
                            </Label>
                            <Input
                              id={`quantity-${timing}`}
                              value={dosage?.quantity || ""}
                              onChange={(e) => handleDosageDetailChange(timing, "quantity", e.target.value)}
                              placeholder="e.g., 1, 1/2, 2"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`instructions-${timing}`} className="text-sm">
                              Instructions
                            </Label>
                            <Select
                              value={dosage?.instructions || ""}
                              onValueChange={(value) => handleDosageDetailChange(timing, "instructions", value)}
                            >
                              <SelectTrigger id={`instructions-${timing}`}>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {instructions?.map((instruction) => (
                                  <SelectItem key={instruction} value={instruction}>
                                    {instruction}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Duration</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="days" className="text-sm">
                    Days
                  </Label>
                  <Input
                    id="days"
                    type="number"
                    min="0"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number.parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="months" className="text-sm">
                    Months
                  </Label>
                  <Input
                    id="months"
                    type="number"
                    min="0"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number.parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years" className="text-sm">
                    Years
                  </Label>
                  <Input
                    id="years"
                    type="number"
                    min="0"
                    value={durationYears}
                    onChange={(e) => setDurationYears(Number.parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/medicines")} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {medicineId ? "Updating..." : "Saving..."}
                </>
              ) : medicineId ? (
                "Update Medicine"
              ) : (
                "Save Medicine"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

