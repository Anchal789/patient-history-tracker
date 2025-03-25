"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Patient } from "@/lib/types"
import { createPatient, getPatientById, updatePatient } from "@/lib/realtime-database-service"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface PatientFormProps {
  patientId?: string
}

export function PatientForm({ patientId }: PatientFormProps = {}) {
  console.log(patientId)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Omit<Patient, "id" | "prescriptions">>({
    name: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    bloodGroup: "",
    bloodPressure: "",
    address: "",
    pastIllnesses: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (patientId) {
      const fetchPatient = async () => {
        setIsLoading(true)
        try {
          const patient = await getPatientById(patientId)
          if (patient) {
            setFormData({
              name: patient.name,
              age: patient.age,
              gender: patient.gender || "",
              weight: patient.weight || "",
              height: patient.height || "",
              bloodGroup: patient.bloodGroup || "",
              bloodPressure: patient.bloodPressure || "",
              address: patient.address || "",
              pastIllnesses: patient.pastIllnesses || "",
            })
          }
        } catch (error) {
          console.error("Error fetching patient:", error)
          toast({
            title: "Error",
            description: "Failed to load patient data",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchPatient()
    }
  }, [patientId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.length > 60) {
      newErrors.name = "Name must be less than 60 characters"
    }

    if (!formData.age) {
      newErrors.age = "Age is required"
    }

    if (!formData.weight) {
      newErrors.weight = "Weight is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      if (patientId) {
        // Update existing patient
        await updatePatient(patientId, formData)
        toast({
          title: "Success",
          description: "Patient updated successfully",
        })
      } else {
        // Create new patient
        const newPatientId = await createPatient(formData)
        toast({
          title: "Success",
          description: "Patient added successfully",
        })
        router.push(`/patients/${newPatientId}`)
        return // Return early to avoid the router.push below
      }

      router.push(patientId ? `/patients/${patientId}` : "/patients")
    } catch (error) {
      console.error("Error saving patient:", error)
      toast({
        title: "Error",
        description: patientId ? "Failed to update patient" : "Failed to add patient",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <Card className="max-w-2xl mx-auto shadow-md">
        <CardHeader>
          <CardTitle>{patientId ? "Edit Patient" : "Add New Patient"}</CardTitle>
          <CardDescription>
            {patientId ? "Update patient information" : "Enter the patient's details to create a new record"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={60}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">
                  Age <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  className={errors.age ? "border-destructive" : ""}
                />
                {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">
                  Weight (kg) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleChange}
                  className={errors.weight ? "border-destructive" : ""}
                />
                {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input id="height" name="height" type="number" value={formData.height} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select value={formData.bloodGroup} onValueChange={(value) => handleSelectChange("bloodGroup", value)}>
                  <SelectTrigger id="bloodGroup">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                <Input
                  id="bloodPressure"
                  name="bloodPressure"
                  placeholder="e.g., 120/80"
                  value={formData.bloodPressure}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pastIllnesses">Past Illnesses / Operations</Label>
              <Textarea
                id="pastIllnesses"
                name="pastIllnesses"
                value={formData.pastIllnesses}
                onChange={handleChange}
                placeholder="Any previous medical conditions, surgeries, or significant health events"
                rows={3}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {patientId ? "Updating..." : "Adding..."}
                </>
              ) : patientId ? (
                "Update Patient"
              ) : (
                "Add Patient"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

