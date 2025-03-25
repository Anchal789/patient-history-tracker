"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import type { CommonDiagnosis, Medicine, Dosage } from "@/lib/types";
import {
  getAllDiagnoses,
  deleteDiagnosis,
} from "@/lib/realtime-database-service-diagnoses";
import { getAllMedicines } from "@/lib/realtime-database-service-medicines";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { SavedMedicine } from "@/lib/types";

const medicineTypes = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Oil",
  "Cream",
  "Powder",
  "Injection",
  "Drops",
  "Inhaler",
  "Patch",
];
const timings = ["Morning", "Afternoon", "Evening", "Night"];

export function DiagnosesList() {
  const [diagnoses, setDiagnoses] = useState<CommonDiagnosis[]>([]);
  const [savedMedicines, setSavedMedicines] = useState<SavedMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState<CommonDiagnosis | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [diseaseName, setDiseaseName] = useState("");
  const [diagnosisText, setDiagnosisText] = useState("");
  const [specialAdvice, setSpecialAdvice] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [diagnosesData, medicinesData] = await Promise.all([
        getAllDiagnoses(),
        getAllMedicines(),
      ]);
      setDiagnoses(diagnosesData);
      setSavedMedicines(medicinesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDiagnoses = diagnoses?.filter((diagnosis) =>
    diagnosis.diseaseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (diagnosis?: CommonDiagnosis) => {
    if (diagnosis) {
      setSelectedDiagnosis(diagnosis);
      setDiseaseName(diagnosis.diseaseName);
      setDiagnosisText(diagnosis.diagnosisText);
      setSpecialAdvice(diagnosis.specialAdvice || "");
      setMedicines(
        Array.isArray(diagnosis.medicines)
          ? [...diagnosis.medicines]
          : [
              {
                name: "",
                type: "Tablet",
                dosage: [],
                duration: { days: 0, months: 0, years: 0 },
              },
            ]
      );
    } else {
      setSelectedDiagnosis(null);
      setDiseaseName("");
      setDiagnosisText("");
      setSpecialAdvice("");
      setMedicines([]);
    }
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (diagnosis: CommonDiagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setIsDeleteDialogOpen(true);
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        type: "Tablet",
        dosage: [],
        duration: { days: 0, months: 0, years: 0 },
      },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines?.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (
    index: number,
    field: keyof Medicine,
    value: any
  ) => {
    setMedicines(
      medicines?.map((medicine, i) => {
        if (i === index) {
          return { ...medicine, [field]: value };
        }
        return medicine;
      })
    );
  };

  const handleDurationChange = (
    index: number,
    field: keyof Medicine["duration"],
    value: number
  ) => {
    setMedicines(
      medicines?.map((medicine, i) => {
        if (i === index) {
          return {
            ...medicine,
            duration: {
              ...medicine.duration,
              [field]: value,
            },
          };
        }
        return medicine;
      })
    );
  };

  const handleDosageChange = (
    medicineIndex: number,
    timing: string,
    checked: boolean
  ) => {
    setMedicines(
      medicines?.map((medicine, i) => {
        if (i === medicineIndex) {
          let newDosage = [...medicine.dosage];

          if (checked) {
            // Add new dosage
            newDosage.push({
              time: timing,
              quantity: "1",
              instructions: "After Meal",
            });
          } else {
            // Remove dosage
            newDosage = newDosage?.filter((d) => d.time !== timing);
          }

          return { ...medicine, dosage: newDosage };
        }
        return medicine;
      })
    );
  };

  const handleDosageDetailChange = (
    medicineIndex: number,
    timing: string,
    field: keyof Dosage,
    value: string
  ) => {
    setMedicines(
      medicines?.map((medicine, i) => {
        if (i === medicineIndex) {
          const newDosage = medicine.dosage?.map((d) => {
            if (d.time === timing) {
              return { ...d, [field]: value };
            }
            return d;
          });

          return { ...medicine, dosage: newDosage };
        }
        return medicine;
      })
    );
  };

  const handleSelectSavedMedicine = (
    medicineIndex: number,
    savedMedicineId: string
  ) => {
    const savedMedicine = savedMedicines?.find((m) => m.id === savedMedicineId);
    if (!savedMedicine) return;

    setMedicines(
      medicines?.map((medicine, i) => {
        if (i === medicineIndex) {
          return {
            name: savedMedicine.name,
            type: savedMedicine.type,
            dosage: [...savedMedicine.defaultDosage],
            duration: { ...savedMedicine.defaultDuration },
          };
        }
        return medicine;
      })
    );
  };

  const handleSubmit = async () => {
    // Validate form
    if (!diseaseName.trim()) {
      toast({
        title: "Error",
        description: "Disease name is required",
        variant: "destructive",
      });
      return;
    }

    if (!diagnosisText.trim()) {
      toast({
        title: "Error",
        description: "Diagnosis text is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const diagnosisData = {
        diseaseName,
        diagnosisText,
        specialAdvice,
        medicines,
      };

      if (selectedDiagnosis) {
        // Update existing diagnosis
        await import("@/lib/realtime-database-service-diagnoses").then(
          (module) => {
            return module.updateDiagnosis(selectedDiagnosis.id, diagnosisData);
          }
        );
        toast({
          title: "Success",
          description: "Diagnosis updated successfully",
        });
      } else {
        // Create new diagnosis
        await import("@/lib/realtime-database-service-diagnoses").then(
          (module) => {
            return module.createDiagnosis(diagnosisData);
          }
        );
        toast({
          title: "Success",
          description: "Diagnosis added successfully",
        });
      }

      // Refresh diagnoses list
      fetchData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving diagnosis:", error);
      toast({
        title: "Error",
        description: selectedDiagnosis
          ? "Failed to update diagnosis"
          : "Failed to add diagnosis",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDiagnosis) return;

    try {
      await deleteDiagnosis(selectedDiagnosis.id);
      toast({
        title: "Success",
        description: "Diagnosis deleted successfully",
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting diagnosis:", error);
      toast({
        title: "Error",
        description: "Failed to delete diagnosis",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Common Diagnoses</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add New Diagnosis
        </Button>
      </div>

      <div className="flex items-center space-x-2 max-w-sm">
        <Input
          placeholder="Search diagnoses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button size="icon" variant="ghost">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {Array(5)
            .fill(0)
            ?.map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
      ) : filteredDiagnoses.length > 0 ? (
        <div className="space-y-4">
          {filteredDiagnoses?.map((diagnosis) => (
            <Card key={diagnosis.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{diagnosis.diseaseName}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(diagnosis)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDeleteDialog(diagnosis)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                <CardDescription>{diagnosis.diagnosisText}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details">
                    <AccordionTrigger>View Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {diagnosis.specialAdvice && (
                          <div>
                            <h4 className="font-medium text-sm">
                              Special Advice:
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {diagnosis.specialAdvice}
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium text-sm mb-2">
                            Medicines:
                          </h4>
                          <div className="space-y-2">
                            {(diagnosis.medicines || [])?.map((medicine, index) => (
                              <div
                                key={index}
                                className="border rounded-md p-2"
                              >
                                <div className="flex justify-between">
                                  <h5 className="font-medium text-sm">
                                    {medicine.name} ({medicine.type})
                                  </h5>
                                </div>
                                <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Dosage:
                                    </span>
                                    <ul className="list-disc pl-5 mt-1">
                                      {medicine.dosage?.map((dose, idx) => (
                                        <li key={idx}>
                                          {dose.time}: {dose.quantity}{" "}
                                          {dose.instructions
                                            ? `(${dose.instructions})`
                                            : ""}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Duration:
                                    </span>
                                    <p className="mt-1">
                                      {medicine.duration.days > 0 &&
                                        `${medicine.duration.days} days`}
                                      {medicine.duration.months > 0 &&
                                        ` ${medicine.duration.months} months`}
                                      {medicine.duration.years > 0 &&
                                        ` ${medicine.duration.years} years`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-card">
          <p className="text-muted-foreground">No diagnoses found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => handleOpenDialog()}
          >
            Add your first diagnosis
          </Button>
        </div>
      )}

      {/* Add/Edit Diagnosis Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDiagnosis ? "Edit Diagnosis" : "Add New Diagnosis"}
            </DialogTitle>
            <DialogDescription>
              {selectedDiagnosis
                ? "Update the details of this diagnosis"
                : "Enter the details of the new diagnosis"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="diseaseName" className="text-right">
                Disease Name
              </Label>
              <Input
                id="diseaseName"
                value={diseaseName}
                onChange={(e) => setDiseaseName(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="diagnosisText" className="text-right">
                Diagnosis
              </Label>
              <Textarea
                id="diagnosisText"
                value={diagnosisText}
                onChange={(e) => setDiagnosisText(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialAdvice" className="text-right">
                Special Advice
              </Label>
              <Textarea
                id="specialAdvice"
                value={specialAdvice}
                onChange={(e) => setSpecialAdvice(e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder="Optional"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <div className="text-right pt-2">
                <Label>Medicines</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 h-auto"
                  onClick={handleAddMedicine}
                >
                  + Add Medicine
                </Button>
              </div>

              <div className="col-span-3 space-y-4">
                {medicines?.map((medicine, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Medicine {index + 1}</h4>
                      {medicines.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedicine(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Select Saved Medicine</Label>
                          <Select
                            onValueChange={(value) =>
                              handleSelectSavedMedicine(index, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a medicine" />
                            </SelectTrigger>
                            <SelectContent>
                              {savedMedicines?.map((savedMedicine) => (
                                <SelectItem
                                  key={savedMedicine.id}
                                  value={savedMedicine.id}
                                >
                                  {savedMedicine.name} ({savedMedicine.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`medicine-${index}-name`}>
                            Medicine Name
                          </Label>
                          <Input
                            id={`medicine-${index}-name`}
                            value={medicine.name}
                            onChange={(e) =>
                              handleMedicineChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`medicine-${index}-type`}>Type</Label>
                          <Select
                            value={medicine.type}
                            onValueChange={(value) =>
                              handleMedicineChange(index, "type", value)
                            }
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
                            const isChecked = medicine.dosage?.some(
                              (d) => d.time === timing
                            );
                            const dosage = medicine.dosage?.find(
                              (d) => d.time === timing
                            );

                            return (
                              <div key={timing} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`medicine-${index}-${timing}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                      handleDosageChange(
                                        index,
                                        timing,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`medicine-${index}-${timing}`}
                                    className="text-sm font-normal"
                                  >
                                    {timing}
                                  </Label>
                                </div>

                                {isChecked && (
                                  <div className="pl-6 space-y-2">
                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`medicine-${index}-${timing}-quantity`}
                                        className="text-xs"
                                      >
                                        Quantity
                                      </Label>
                                      <Input
                                        id={`medicine-${index}-${timing}-quantity`}
                                        value={dosage?.quantity || ""}
                                        onChange={(e) =>
                                          handleDosageDetailChange(
                                            index,
                                            timing,
                                            "quantity",
                                            e.target.value
                                          )
                                        }
                                        className="h-8 text-sm"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`medicine-${index}-${timing}-instructions`}
                                        className="text-xs"
                                      >
                                        Instructions
                                      </Label>
                                      <Select
                                        value={dosage?.instructions || ""}
                                        onValueChange={(value) =>
                                          handleDosageDetailChange(
                                            index,
                                            timing,
                                            "instructions",
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger
                                          id={`medicine-${index}-${timing}-instructions`}
                                          className="h-8 text-sm"
                                        >
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="सुबह जल्दी">
                                            सुबह जल्दी
                                          </SelectItem>
                                          <SelectItem value="भोजन से पहले">
                                            भोजन से पहले
                                          </SelectItem>
                                          <SelectItem value="भोजन के बाद">
                                            भोजन के बाद
                                          </SelectItem>
                                          <SelectItem value="भोजन के साथ">
                                            भोजन के साथ
                                          </SelectItem>
                                          <SelectItem value="खाली पेट">
                                            खाली पेट
                                          </SelectItem>
                                          <SelectItem value="सोने से पहले">
                                            सोने से पहले
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label
                              htmlFor={`medicine-${index}-days`}
                              className="text-sm"
                            >
                              Days
                            </Label>
                            <Input
                              id={`medicine-${index}-days`}
                              type="number"
                              min="0"
                              value={medicine.duration.days}
                              onChange={(e) =>
                                handleDurationChange(
                                  index,
                                  "days",
                                  Number.parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor={`medicine-${index}-months`}
                              className="text-sm"
                            >
                              Months
                            </Label>
                            <Input
                              id={`medicine-${index}-months`}
                              type="number"
                              min="0"
                              value={medicine.duration.months}
                              onChange={(e) =>
                                handleDurationChange(
                                  index,
                                  "months",
                                  Number.parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor={`medicine-${index}-years`}
                              className="text-sm"
                            >
                              Years
                            </Label>
                            <Input
                              id={`medicine-${index}-years`}
                              type="number"
                              min="0"
                              value={medicine.duration.years}
                              onChange={(e) =>
                                handleDurationChange(
                                  index,
                                  "years",
                                  Number.parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedDiagnosis ? "Updating..." : "Saving..."}
                </>
              ) : selectedDiagnosis ? (
                "Update Diagnosis"
              ) : (
                "Save Diagnosis"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the diagnosis "
              {selectedDiagnosis?.diseaseName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
