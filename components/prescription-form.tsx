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
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/date-picker"
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import type {
  Patient,
  Prescription,
  Medicine,
  Dosage,
  PanchkarmaProcess,
  PanchkarmaItem,
  ChiefComplaint,
} from "@/lib/types"
import { getPatientById, createPrescription, updatePrescription } from "@/lib/realtime-database-service"
import { generateAppointmentId } from "@/lib/print-utils"
import { toast } from "@/components/ui/use-toast"
import { PrescriptionPrint } from "@/components/prescription-print"

// Add these imports at the top
import { getAllMedicines } from "@/lib/realtime-database-service-medicines"
import { getAllDiagnoses } from "@/lib/realtime-database-service-diagnoses"
import { getAllChiefComplaints } from "@/lib/realtime-database-service-chief-complaints"
import { getAllPanchkarmaProcesses } from "@/lib/realtime-database-service-panchkarma"
import type { SavedMedicine, CommonDiagnosis, SavedPanchkarmaProcess } from "@/lib/types"

// Add a new import for the Command component
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface PrescriptionFormProps {
  patientId: string
  prescriptionId?: string
}

const medicineTypes = ["Tablet", "Capsule", "Syrup", "Oil", "Cream", "Powder", "Injection", "Drops", "Inhaler", "Patch"]

const timings = ["Morning", "Afternoon", "Evening", "Night"]

export function PrescriptionForm({ patientId, prescriptionId }: PrescriptionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [canPrint, setCanPrint] = useState(false)
  const [setPrescriptionId, setSetPrescriptionId] = useState<string | null>(null)

  // Add these state variables inside the PrescriptionForm component
  const [savedMedicines, setSavedMedicines] = useState<SavedMedicine[]>([])
  const [diagnoses, setDiagnoses] = useState<CommonDiagnosis[]>([])
  const [chiefComplaints, setChiefComplaints] = useState<ChiefComplaint[]>([])
  const [panchkarmaProcesses, setPanchkarmaProcesses] = useState<SavedPanchkarmaProcess[]>([])

  // Add state for selected chief complaints
  const [selectedChiefComplaints, setSelectedChiefComplaints] = useState<ChiefComplaint[]>([])
  
  // Add state for popover open/close
  const [chiefComplaintsOpen, setChiefComplaintsOpen] = useState(false)
  const [diagnosisOpen, setDiagnosisOpen] = useState(false)
  const [panchkarmaOpen, setPanchkarmaOpen] = useState(false)

  const [date, setDate] = useState<Date>(new Date())
  const [weight, setWeight] = useState("")
  const [bloodPressure, setBloodPressure] = useState("")
  const [afebrileTemperature, setAfebrileTemperature] = useState(false)
  const [temperature, setTemperature] = useState("")
  const [pulse, setPulse] = useState("")
  const [respRate, setRespRate] = useState("")
  const [spo2, setSpo2] = useState("")
  const [chiefComplaintsText, setChiefComplaintsText] = useState("")
  const [examNotes, setExamNotes] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      name: "",
      type: "Tablet",
      usage: "",
      dosage: [],
      duration: { days: 0, months: 0, years: 0 },
    },
  ])
  const [specialAdvice, setSpecialAdvice] = useState("")
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined)
  const [appointmentId, setAppointmentId] = useState<string>("")

  // Panchkarma state
  const [showPanchkarma, setShowPanchkarma] = useState(false)
  const [panchkarmaProcessesList, setPanchkarmaProcessesList] = useState<PanchkarmaProcess[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null)

  // Add a function to handle selecting a saved medicine
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
            usage: savedMedicine.defaultUsage || "",
            duration: savedMedicine.defaultDuration ? savedMedicine.defaultDuration : { days: 0, months: 0, years: 0 },
          }
        }
        return medicine
      }),
    )
  }

  // Updated function to handle selecting a diagnosis
  const handleSelectDiagnosis = (diagnosisId: string) => {
    const selectedDiagnosis = diagnoses?.find((d) => d.id === diagnosisId)
    if (!selectedDiagnosis) return

    setDiagnosis(selectedDiagnosis.diagnosisText)
    setSpecialAdvice(selectedDiagnosis.specialAdvice || "")
    setMedicines([
      ...(selectedDiagnosis.medicines || [
        {
          name: "",
          type: "Tablet",
          usage: "",
          dosage: [],
          duration: { days: 0, months: 0, years: 0 },
        },
      ]),
    ])
    setDiagnosisOpen(false)
  }

  // Updated function to handle selecting chief complaint (multiple selection)
  const handleSelectChiefComplaint = (complaintId: string) => {
    const selectedComplaint = chiefComplaints?.find((c) => c.id === complaintId)
    if (!selectedComplaint) return

    const isAlreadySelected = selectedChiefComplaints.some((c) => c.id === complaintId)
    
    if (isAlreadySelected) {
      // Remove if already selected
      const updatedComplaints = selectedChiefComplaints.filter((c) => c.id !== complaintId)
      setSelectedChiefComplaints(updatedComplaints)
      setChiefComplaintsText(updatedComplaints.map(c => c.complaint).join(', '))
    } else {
      // Add if not selected
      const updatedComplaints = [...selectedChiefComplaints, selectedComplaint]
      setSelectedChiefComplaints(updatedComplaints)
      setChiefComplaintsText(updatedComplaints.map(c => c.complaint).join(', '))
    }
  }

  // Function to remove a selected chief complaint
  const handleRemoveChiefComplaint = (complaintId: string) => {
    const updatedComplaints = selectedChiefComplaints.filter((c) => c.id !== complaintId)
    setSelectedChiefComplaints(updatedComplaints)
    setChiefComplaintsText(updatedComplaints.map(c => c.complaint).join(', '))
  }

  // Updated function to handle selecting Panchkarma process
  const handleSelectPanchkarmaProcess = (processId: string) => {
    const selectedProcess = panchkarmaProcesses?.find((p) => p.id === processId)
    if (!selectedProcess) return

    // Check if the process is already added
    const isAlreadyAdded = panchkarmaProcessesList.some((process) => process.name === selectedProcess.name)
    if (isAlreadyAdded) {
      toast({
        title: "Process Already Added",
        description: `${selectedProcess.name} is already in the list`,
        variant: "destructive",
      })
      setPanchkarmaOpen(false)
      return
    }

    const newProcess: PanchkarmaProcess = {
      name: selectedProcess.name,
      procedures: [...selectedProcess.procedures],
    }

    setPanchkarmaProcessesList([...panchkarmaProcessesList, newProcess])
    setPanchkarmaOpen(false)
  }

  // Add function to handle Panchkarma process changes
  const handlePanchkarmaProcessChange = (processIndex: number, field: keyof PanchkarmaProcess, value: any) => {
    setPanchkarmaProcessesList(
      panchkarmaProcessesList.map((process, i) => (i === processIndex ? { ...process, [field]: value } : process)),
    )
  }

  const handlePanchkarmaProcedureChange = (
    processIndex: number,
    procedureIndex: number,
    field: keyof PanchkarmaItem,
    value: string | number,
  ) => {
    setPanchkarmaProcessesList(
      panchkarmaProcessesList.map((process, i) => {
        if (i === processIndex) {
          return {
            ...process,
            procedures: process.procedures.map((procedure, j) =>
              j === procedureIndex ? { ...procedure, [field]: value } : procedure,
            ),
          }
        }
        return process
      }),
    )
  }

  const handleAddPanchkarmaProcedure = (processIndex: number) => {
    setPanchkarmaProcessesList(
      panchkarmaProcessesList.map((process, i) => {
        if (i === processIndex) {
          return {
            ...process,
            procedures: [...process.procedures, { procedureName: "", material: "", days: 0 }],
          }
        }
        return process
      }),
    )
  }

  const handleRemovePanchkarmaProcedure = (processIndex: number, procedureIndex: number) => {
    setPanchkarmaProcessesList(
      panchkarmaProcessesList.map((process, i) => {
        if (i === processIndex && process.procedures.length > 1) {
          return {
            ...process,
            procedures: process.procedures.filter((_, j) => j !== procedureIndex),
          }
        }
        return process
      }),
    )
  }

  const handleAddPanchkarmaProcess = () => {
    setPanchkarmaProcessesList([
      ...panchkarmaProcessesList,
      {
        name: "",
        procedures: [{ procedureName: "", material: "", days: 0 }],
      },
    ])
  }

  const handleRemovePanchkarmaProcess = (processIndex: number) => {
    setPanchkarmaProcessesList(panchkarmaProcessesList.filter((_, i) => i !== processIndex))
  }

  // Update the useEffect to fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch patient data
        const patientData = await getPatientById(patientId)
        if (!patientData) {
          toast({
            title: "Error",
            description: "Patient not found",
            variant: "destructive",
          })
          router.push("/patients")
          return
        }

        setPatient(patientData)

        // Fetch all data
        const [medicinesData, diagnosesData, complaintsData, panchkarmaData] = await Promise.all([
          getAllMedicines(),
          getAllDiagnoses(),
          getAllChiefComplaints(),
          getAllPanchkarmaProcesses(),
        ])

        setSavedMedicines(medicinesData)
        setDiagnoses(diagnosesData)
        setChiefComplaints(complaintsData)
        setPanchkarmaProcesses(panchkarmaData)

        // Pre-fill weight and blood pressure from patient data
        if (!prescriptionId) {
          setWeight(patientData.weight || "")
          setBloodPressure(patientData.bloodPressure || "")
          setAppointmentId(generateAppointmentId())
        }

        // If editing an existing prescription
        if (prescriptionId && patientData.prescriptions) {
          const prescription = patientData.prescriptions?.find((p) => p.id === prescriptionId)
          if (prescription) {
            setDate(new Date(prescription.date))
            setWeight(prescription.weight || "")
            setBloodPressure(prescription.bloodPressure || "")
            setAfebrileTemperature(prescription.afebrileTemperature || false)
            setTemperature(prescription.temperature || "")
            setPulse(prescription.pulse || "")
            setRespRate(prescription.respRate || "")
            setSpo2(prescription.spo2 || "")
            setChiefComplaintsText(prescription.chiefComplaints || "")
            setExamNotes(prescription.examNotes || "")
            setDiagnosis(prescription.diagnosis || "")
            setMedicines(prescription.medicines)
            setSpecialAdvice(prescription.specialAdvice || "")
            setFollowUpDate(prescription.followUpDate ? new Date(prescription.followUpDate) : undefined)
            setAppointmentId(prescription.appointmentId || generateAppointmentId())
            if (prescription.panchkarmaProcesses && prescription.panchkarmaProcesses.length > 0) {
              setPanchkarmaProcessesList(prescription.panchkarmaProcesses)
              setShowPanchkarma(true)
            }
            setCurrentPrescription(prescription)
            setCanPrint(true)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [patientId, prescriptionId, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!weight) {
      newErrors.weight = "Weight is required"
    }

    if (!chiefComplaintsText) {
      newErrors.chiefComplaints = "Chief complaints are required"
    }

    let hasMedicineErrors = false
    medicines.forEach((medicine, index) => {
      if (!medicine.name.trim()) {
        newErrors[`medicine-${index}-name`] = "Medicine name is required"
        hasMedicineErrors = true
      }

      if (medicine.dosage.length === 0) {
        newErrors[`medicine-${index}-dosage`] = "At least one dosage timing is required"
        hasMedicineErrors = true
      }

      const totalDuration = medicine.duration.days + medicine.duration.months + medicine.duration.years
      if (totalDuration === 0) {
        newErrors[`medicine-${index}-duration`] = "Duration is required"
        hasMedicineErrors = true
      }
    })

    if (hasMedicineErrors) {
      newErrors.medicines = "Please fix errors in medicines"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        type: "Tablet",
        usage: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !patient) {
      return
    }

    setIsSaving(true)

    try {
      const prescriptionData: Omit<Prescription, "id"> = {
        patientId,
        date: date.toISOString(),
        weight,
        bloodPressure,
        afebrileTemperature,
        temperature,
        pulse,
        respRate,
        spo2,
        chiefComplaints: chiefComplaintsText,
        examNotes,
        diagnosis,
        medicines,
        specialAdvice,
        followUpDate: followUpDate ? followUpDate.toISOString() : null,
        appointmentId,
        panchkarmaProcesses: panchkarmaProcessesList.length > 0 ? panchkarmaProcessesList : undefined,
      }

      if (prescriptionId) {
        // Update existing prescription
        await updatePrescription(prescriptionId, prescriptionData)
        toast({
          title: "Success",
          description: "Prescription updated successfully",
        })
        setCurrentPrescription({
          ...prescriptionData,
          id: prescriptionId,
        })
      } else {
        // Create new prescription
        const newPrescriptionId = await createPrescription(prescriptionData)
        toast({
          title: "Success",
          description: "Prescription created successfully",
        })
        setCurrentPrescription({
          ...prescriptionData,
          id: newPrescriptionId,
        })
        setSetPrescriptionId(newPrescriptionId)
      }

      setCanPrint(true)
    } catch (error) {
      console.error("Error saving prescription:", error)
      toast({
        title: "Error",
        description: prescriptionId ? "Failed to update prescription" : "Failed to create prescription",
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

  if (!patient) {
    return <div>Patient not found</div>
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <Card className="max-w-3xl mx-auto shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{prescriptionId ? "Edit Prescription" : "New Prescription"}</CardTitle>
              <CardDescription>
                {prescriptionId ? "Update prescription details" : `Creating prescription for ${patient.name}`}
              </CardDescription>
            </div>

            {canPrint && currentPrescription && (
              <PrescriptionPrint patient={patient} prescription={currentPrescription} />
            )}
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <DatePicker date={date} setDate={setDate} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointmentId">Appointment ID</Label>
                <Input
                  id="appointmentId"
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                  disabled
                />
              </div>
            </div>

            {/* Updated Chief Complaints Section with Multiple Selection */}
            <div className="space-y-2">
              <Label htmlFor="chiefComplaintsSelector">Search & Select Chief Complaints</Label>
              <Popover open={chiefComplaintsOpen} onOpenChange={setChiefComplaintsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between bg-transparent">
                    {selectedChiefComplaints.length > 0 
                      ? `${selectedChiefComplaints.length} complaint(s) selected` 
                      : "Search and select chief complaints..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search chief complaints..." />
                    <CommandList>
                      <CommandEmpty>No chief complaint found.</CommandEmpty>
                      <CommandGroup>
                        {chiefComplaints?.map((complaint) => (
                          <CommandItem
                            key={complaint.id}
                            value={complaint.name}
                            onSelect={() => handleSelectChiefComplaint(complaint.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedChiefComplaints.some(c => c.id === complaint.id) ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {complaint.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Display selected chief complaints as badges */}
              {selectedChiefComplaints.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedChiefComplaints.map((complaint) => (
                    <Badge key={complaint.id} variant="secondary" className="flex items-center gap-1">
                      {complaint.name}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveChiefComplaint(complaint.id)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chiefComplaints">
                Chief Complaints <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="chiefComplaints"
                placeholder="Patient's primary complaints"
                value={chiefComplaintsText}
                onChange={(e) => setChiefComplaintsText(e.target.value)}
                className={errors.chiefComplaints ? "border-destructive" : ""}
                rows={2}
              />
              {errors.chiefComplaints && <p className="text-sm text-destructive">{errors.chiefComplaints}</p>}
            </div>

            {/* Updated Diagnosis Section with Search */}
            <div className="space-y-2">
              <Label htmlFor="diagnosisSelector">Search & Select Diagnosis</Label>
              <Popover open={diagnosisOpen} onOpenChange={setDiagnosisOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between bg-transparent">
                    {diagnosis || "Search and select diagnosis..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search diagnosis..." />
                    <CommandList>
                      <CommandEmpty>No diagnosis found.</CommandEmpty>
                      <CommandGroup>
                        {diagnoses?.map((diagnosisItem) => (
                          <CommandItem
                            key={diagnosisItem.id}
                            value={diagnosisItem.diseaseName}
                            onSelect={() => handleSelectDiagnosis(diagnosisItem.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                diagnosis === diagnosisItem.diagnosisText ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {diagnosisItem.diseaseName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">
                  Weight (kg) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="weight"
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={errors.weight ? "border-destructive" : ""}
                />
                {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                <Input
                  id="bloodPressure"
                  placeholder="e.g., 120/80"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="afebrileTemperature">Afebrile Temp</Label>
                <Input
                  id="afebrileTemperature"
                  type="checkbox"
                  checked={afebrileTemperature}
                  style={{ height: "20px" }}
                  onChange={(e) => setAfebrileTemperature(e.target.checked)}
                />
              </div>
              {afebrileTemperature ? null : (
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°F)</Label>
                  <Input
                    id="temperature"
                    type="text"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="pulse">Pulse (bpm)</Label>
                <Input id="pulse" type="text" value={pulse} onChange={(e) => setPulse(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="respRate">Resp Rate (rpm)</Label>
                <Input id="respRate" type="text" value={respRate} onChange={(e) => setRespRate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spo2">SpO2 (%)</Label>
                <Input id="spo2" type="text" value={spo2} onChange={(e) => setSpo2(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="examNotes">Examination Notes</Label>
              <Textarea
                id="examNotes"
                placeholder="Physical examination findings"
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                placeholder="Patient's diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg">Medicines</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddMedicine}>
                  <Plus className="mr-2 h-4 w-4" /> Add Medicine
                </Button>
              </div>

              {errors.medicines && <p className="text-sm text-destructive">{errors.medicines}</p>}

              {medicines?.map((medicine, index) => (
                <Card key={index} className="border border-muted">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">Medicine {index + 1}</h3>
                      {medicines.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMedicine(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Add the saved medicine selector before the medicine name/type fields */}
                    <div className="space-y-2 mb-4">
                      <Label htmlFor={`medicine-${index}-saved`}>Search Medicine</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between bg-transparent">
                            {medicine.name || "Search for medicine..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search medicine..." />
                            <CommandList>
                              <CommandEmpty>No medicine found.</CommandEmpty>
                              <CommandGroup>
                                {savedMedicines?.map((savedMedicine) => (
                                  <CommandItem
                                    key={savedMedicine.id}
                                    value={savedMedicine.name}
                                    onSelect={() => {
                                      handleSelectSavedMedicine(index, savedMedicine.id)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        medicine.name === savedMedicine.name ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    {savedMedicine.name} ({savedMedicine.type})
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
                      <div className="space-y-2 col-span-5">
                        <Label htmlFor={`medicine-${index}-name`}>
                          Medicine Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`medicine-${index}-name`}
                          value={medicine.name}
                          onChange={(e) => handleMedicineChange(index, "name", e.target.value)}
                          className={errors[`medicine-${index}-name`] ? "border-destructive" : ""}
                        />
                        {errors[`medicine-${index}-name`] && (
                          <p className="text-sm text-destructive">{errors[`medicine-${index}-name`]}</p>
                        )}
                      </div>

                      <div className="space-y-2 col-span-2">
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
                      <div className="space-y-2 col-span-3">
                        <Label htmlFor={`medicine-${index}-usage`}>Usage </Label>
                        <Input
                          id={`medicine-${index}-usage`}
                          value={medicine.usage || ""}
                          onChange={(e) => handleMedicineChange(index, "usage", e.target.value)}
                          placeholder="Enter way to consume"
                          className={errors[`medicine-${index}-usage`] ? "border-destructive" : ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Dosage <span className="text-destructive">*</span>
                      </Label>
                      {errors[`medicine-${index}-dosage`] && (
                        <p className="text-sm text-destructive">{errors[`medicine-${index}-dosage`]}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {timings?.map((timing) => {
                          const isChecked = medicine?.dosage?.some((d) => d.time === timing)
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
                                        <SelectItem value="सुबह जल्दी">सुबह जल्दी</SelectItem>
                                        <SelectItem value="भोजन से पहले">भोजन से पहले</SelectItem>
                                        <SelectItem value="भोजन के बाद">भोजन के बाद</SelectItem>
                                        <SelectItem value="भोजन के साथ">भोजन के साथ</SelectItem>
                                        <SelectItem value="खाली पेट">खाली पेट</SelectItem>
                                        <SelectItem value="सोने से पहले">सोने से पहले</SelectItem>
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
                      <Label>
                        Duration <span className="text-destructive">*</span>
                      </Label>
                      {errors[`medicine-${index}-duration`] && (
                        <p className="text-sm text-destructive">{errors[`medicine-${index}-duration`]}</p>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`medicine-${index}-days`} className="text-sm">
                            Days
                          </Label>
                          <Input
                            id={`medicine-${index}-days`}
                            type="text"
                            pattern="[0-9]*|^$"
                            inputMode="numeric"
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
                            type="text"
                            pattern="[0-9]*|^$"
                            inputMode="numeric"
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
                            type="text"
                            pattern="[0-9]*|^$"
                            inputMode="numeric"
                            min="0"
                            value={medicine.duration.years}
                            onChange={(e) => handleDurationChange(index, "years", Number.parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Updated Panchkarma Processes Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPanchkarma(!showPanchkarma)}
                  className="flex items-center gap-2"
                >
                  {showPanchkarma ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Add Panchkarma Process
                </Button>
              </div>

              {showPanchkarma && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="panchkarmaSelector">Search & Select Panchkarma Process</Label>
                    <Popover open={panchkarmaOpen} onOpenChange={setPanchkarmaOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between bg-transparent">
                          Search and select Panchkarma process...
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search Panchkarma process..." />
                          <CommandList>
                            <CommandEmpty>No Panchkarma process found.</CommandEmpty>
                            <CommandGroup>
                              {panchkarmaProcesses?.map((process) => {
                                const isAlreadyAdded = panchkarmaProcessesList.some((addedProcess) => addedProcess.name === process.name)
                                return (
                                  <CommandItem
                                    key={process.id}
                                    value={process.name}
                                    onSelect={() => handleSelectPanchkarmaProcess(process.id)}
                                    disabled={isAlreadyAdded}
                                    className={isAlreadyAdded ? "opacity-50 cursor-not-allowed" : ""}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", isAlreadyAdded ? "opacity-100" : "opacity-0")} />
                                    {process.name} {isAlreadyAdded && "(Already Added)"}
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex justify-between items-center">
                    <Label className="text-lg">Panchkarma Processes</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddPanchkarmaProcess}>
                      <Plus className="mr-2 h-4 w-4" /> Add Process
                    </Button>
                  </div>

                  {panchkarmaProcessesList.map((process, processIndex) => (
                    <Card key={processIndex} className="border border-muted">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">Process {processIndex + 1}</h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePanchkarmaProcess(processIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`process-${processIndex}-name`}>Process Name</Label>
                          <Input
                            id={`process-${processIndex}-name`}
                            value={process.name}
                            onChange={(e) => handlePanchkarmaProcessChange(processIndex, "name", e.target.value)}
                            placeholder="Enter process name"
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-md">Procedures</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddPanchkarmaProcedure(processIndex)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add Procedure
                            </Button>
                          </div>

                          {process.procedures.map((procedure, procedureIndex) => (
                            <div key={procedureIndex} className="border rounded-md p-3 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Procedure {procedureIndex + 1}</span>
                                {process.procedures.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemovePanchkarmaProcedure(processIndex, procedureIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor={`procedure-${processIndex}-${procedureIndex}-name`}>
                                    Procedure Name
                                  </Label>
                                  <Input
                                    id={`procedure-${processIndex}-${procedureIndex}-name`}
                                    value={procedure.procedureName}
                                    onChange={(e) =>
                                      handlePanchkarmaProcedureChange(
                                        processIndex,
                                        procedureIndex,
                                        "procedureName",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter procedure name"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`procedure-${processIndex}-${procedureIndex}-material`}>
                                    Material
                                  </Label>
                                  <Input
                                    id={`procedure-${processIndex}-${procedureIndex}-material`}
                                    value={procedure.material}
                                    onChange={(e) =>
                                      handlePanchkarmaProcedureChange(
                                        processIndex,
                                        procedureIndex,
                                        "material",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter material"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`procedure-${processIndex}-${procedureIndex}-days`}>Days</Label>
                                  <Input
                                    id={`procedure-${processIndex}-${procedureIndex}-days`}
                                    type="number"
                                    min="1"
                                    value={procedure.days}
                                    onChange={(e) =>
                                      handlePanchkarmaProcedureChange(
                                        processIndex,
                                        procedureIndex,
                                        "days",
                                        Number.parseInt(e.target.value) || 0,
                                      )
                                    }
                                    placeholder="Enter days"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialAdvice">Special Advice</Label>
              <Textarea
                id="specialAdvice"
                value={specialAdvice}
                onChange={(e) => setSpecialAdvice(e.target.value)}
                placeholder="Special instructions, dietary advice, or restrictions"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followUpDate">Follow-up Date</Label>
              <DatePicker date={followUpDate} setDate={setFollowUpDate} label="Select follow-up date (optional)" />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/patients/${patientId}`)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {prescriptionId ? "Updating..." : "Saving..."}
                </>
              ) : prescriptionId ? (
                "Update Prescription"
              ) : (
                "Save Prescription"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}