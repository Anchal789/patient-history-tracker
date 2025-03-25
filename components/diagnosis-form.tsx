"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { CommonDiagnosis, Medicine, Dosage, SavedMedicine } from "@/lib/types"
import { createDiagnosis, updateDiagnosis } from "@/lib/realtime-database-service-diagnoses"
import { getAllMedicines } from "@/lib/realtime-database-service-medicines"

const medicineTypes = ["Tablet", "Capsule", "Syrup", "Cream", "Powder", "Injection", "Drops", "Inhaler", "Patch"]
const timings = ["Morning", "Afternoon", "Evening", "Night"]

interface DiagnosisFormProps {
  diagnosis?: CommonDiagnosis
  onSuccess?: () => void
  onCancel?: () => void
}

export function DiagnosisForm({ diagnosis, onSuccess, onCancel }: DiagnosisFormProps) {
  const [diseaseName, setDiseaseName] = useState(diagnosis?.diseaseName || "")
  const [diagnosisText, setDiagnosisText] = useState(diagnosis?.diagnosisText || "")
  const [specialAdvice, setSpecialAdvice] = useState(diagnosis?.specialAdvice || "")
  const [medicines, setMedicines] = useState<Medicine[]>(diagnosis?.medicines || [])
  const [savedMedicines, setSavedMedicines] = useState<SavedMedicine[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const medicinesData = await getAllMedicines()
        setSavedMedicines(medicinesData)
      } catch (error) {
        console.error("Error fetching medicines:", error)
        toast({
          title: "Error",
          description: "Failed to load medicines",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedicines()
  }, [])

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        type: "Tablet",
        dosage: [],
        duration: { days: 0, months: 0, years: 0 },
      },
    ])
  }

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines?.filter((_, i) => i !== index))
  }

  const handleMedicineChange = (index: number, field: keyof Medicine, value: any) => {
    setMedicines(
      medicines?.map((medicine, i) => {
        if (i === index) {
          return { ...medicine, [field]: value }
        }
        return medicine
      }),
    )
  }

  const handleDurationChange = (index: number, field: keyof Medicine["duration"], value: number) => {
    setMedicines(
      medicines?.map((medicine, i) => {
        if (i === index) {
          return {
            ...medicine,
            duration: {
              ...medicine.duration,
              [field]: value,
            },
          }
        }
        return medicine
      }),
    )
  }

  const handleDosageChange = (medicineIndex: number, timing: string, checked: boolean) => {
    setMedicines(
      medicines?.map((medicine, i) => {
        if (i === medicineIndex) {
          let newDosage = [...medicine.dosage]

          if (checked) {
            // Add new dosage
            newDosage.push({
              time: timing,
              quantity: "1",
              instructions: "After food",
            })
          } else {
            // Remove dosage
            newDosage = newDosage?.filter((d) => d.time !== timing)
          }

          return { ...medicine, dosage: newDosage }
        }
        return medicine
      }),
    )
  }

  const handleDosageDetailChange = (medicineIndex: number, timing: string, field: keyof Dosage, value: string) => {
    setMedicines(
      medicines?.map((medicine, i) => {
        if (i === medicineIndex) {
          const newDosage = medicine.dosage?.map((d) => {
            if (d.time === timing) {
              return { ...d, [field]: value }
            }
            return d
          })

          return { ...medicine, dosage: newDosage }
        }
        return medicine
      }),
    )
  }

  const handleSelectSavedMedicine = (medicineIndex: number, savedMedicineId: string) => {
    const savedMedicine = savedMedicines?.find((m) => m.id === savedMedicineId)
    if (!savedMedicine) return

    setMedicines(
      medicines?.map((medicine, i) => {
        if (i === medicineIndex) {
          return {
            name: savedMedicine.name,
            type: savedMedicine.type,
            dosage: [...savedMedicine.defaultDosage],
            duration: { ...savedMedicine.defaultDuration },
          }
        }
        return medicine
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!diseaseName.trim()) {
      toast({
        title: "Error",
        description: "Disease name is required",
        variant: "destructive",
      })
      return
    }

    if (!diagnosisText.trim()) {
      toast({
        title: "Error",
        description: "Diagnosis text is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const diagnosisData = {
        diseaseName,
        diagnosisText,
        specialAdvice,
        medicines,
      }

      if (diagnosis) {
        // Update existing diagnosis
        await updateDiagnosis(diagnosis.id, diagnosisData)
        toast({
          title: "Success",
          description: "Diagnosis updated successfully",
        })
      } else {
        // Create new diagnosis
        await createDiagnosis(diagnosisData)
        toast({
          title: "Success",
          description: "Diagnosis added successfully",
        })
      }

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error saving diagnosis:", error)
      toast({
        title: "Error",
        description: diagnosis ? "Failed to update diagnosis" : "Failed to add diagnosis",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="diseaseName">Disease Name</Label>
            <Input id="diseaseName" value={diseaseName} onChange={(e) => setDiseaseName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosisText">Diagnosis</Label>
            <Textarea
              id="diagnosisText"
              value={diagnosisText}
              onChange={(e) => setDiagnosisText(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialAdvice">Special Advice</Label>
            <Textarea
              id="specialAdvice"
              value={specialAdvice}
              onChange={(e) => setSpecialAdvice(e.target.value)}
              rows={3}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Medicines</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddMedicine}>
              Add Medicine
            </Button>
          </div>

          {medicines.length === 0 ? (
            <div className="text-center py-8 border rounded-md bg-muted/20">
              <p className="text-muted-foreground">No medicines added</p>
              <Button type="button" variant="outline" className="mt-2" onClick={handleAddMedicine}>
                Add Medicine
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {medicines?.map((medicine, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Medicine {index + 1}</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMedicine(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Select Saved Medicine</Label>
                        <Select onValueChange={(value) => handleSelectSavedMedicine(index, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a medicine" />
                          </SelectTrigger>
                          <SelectContent>
                            {savedMedicines?.map((savedMedicine) => (
                              <SelectItem key={savedMedicine.id} value={savedMedicine.id}>
                                {savedMedicine.name} ({savedMedicine.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`medicine-${index}-name`}>Medicine Name</Label>
                        <Input
                          id={`medicine-${index}-name`}
                          value={medicine.name}
                          onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`medicine-${index}-type`}>Type</Label>
                        <Select
                          value={medicine.type}
                          onValueChange={(value) => handleMedicineChange(index, "type", value)}
                        >
                          <SelectTrigger id={`medicine-${index}-type`}>
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

                    <div className="space-y-2">
                      <Label>Dosage</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {timings?.map((timing) => {
                          const isChecked = medicine.dosage?.some((d) => d.time === timing)
                          const dosage = medicine.dosage?.find((d) => d.time === timing)

                          return (
                            <div key={timing} className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`medicine-${index}-${timing}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => handleDosageChange(index, timing, checked as boolean)}
                                />
                                <Label htmlFor={`medicine-${index}-${timing}`} className="text-sm font-normal">
                                  {timing}
                                </Label>
                              </div>

                              {isChecked && (
                                <div className="pl-6 space-y-2">
                                  <div className="space-y-1">
                                    <Label htmlFor={`medicine-${index}-${timing}-quantity`} className="text-xs">
                                      Quantity
                                    </Label>
                                    <Input
                                      id={`medicine-${index}-${timing}-quantity`}
                                      value={dosage?.quantity || ""}
                                      onChange={(e) =>
                                        handleDosageDetailChange(index, timing, "quantity", e.target.value)
                                      }
                                      className="h-8 text-sm"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <Label htmlFor={`medicine-${index}-${timing}-instructions`} className="text-xs">
                                      Instructions
                                    </Label>
                                    <Select
                                      value={dosage?.instructions || ""}
                                      onValueChange={(value) =>
                                        handleDosageDetailChange(index, timing, "instructions", value)
                                      }
                                    >
                                      <SelectTrigger
                                        id={`medicine-${index}-${timing}-instructions`}
                                        className="h-8 text-sm"
                                      >
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Before food">Before food</SelectItem>
                                        <SelectItem value="After food">After food</SelectItem>
                                        <SelectItem value="With food">With food</SelectItem>
                                        <SelectItem value="Empty stomach">Empty stomach</SelectItem>
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

                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`medicine-${index}-days`} className="text-sm">
                            Days
                          </Label>
                          <Input
                            id={`medicine-${index}-days`}
                            type="number"
                            min="0"
                            value={medicine.duration.days}
                            onChange={(e) => handleDurationChange(index, "days", Number.parseInt(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`medicine-${index}-months`} className="text-sm">
                            Months
                          </Label>
                          <Input
                            id={`medicine-${index}-months`}
                            type="number"
                            min="0"
                            value={medicine.duration.months}
                            onChange={(e) =>
                              handleDurationChange(index, "months", Number.parseInt(e.target.value) || 0)
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`medicine-${index}-years`} className="text-sm">
                            Years
                          </Label>
                          <Input
                            id={`medicine-${index}-years`}
                            type="number"
                            min="0"
                            value={medicine.duration.years}
                            onChange={(e) => handleDurationChange(index, "years", Number.parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {diagnosis ? "Updating..." : "Saving..."}
            </>
          ) : diagnosis ? (
            "Update Diagnosis"
          ) : (
            "Save Diagnosis"
          )}
        </Button>
      </div>
    </form>
  )
}

