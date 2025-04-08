"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import type { SavedMedicine, Dosage } from "@/lib/types";
import {
  getAllMedicines,
  deleteMedicine,
} from "@/lib/realtime-database-service-medicines";
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

export function MedicinesList() {
  const [medicines, setMedicines] = useState<SavedMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] =
    useState<SavedMedicine | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [medicineName, setMedicineName] = useState("");
  const [medicineType, setMedicineType] = useState("Tablet");
  const [dosages, setDosages] = useState<Dosage[]>([]);
  const [usage, setUsage] = useState("");
  const [durationDays, setDurationDays] = useState(0);
  const [durationMonths, setDurationMonths] = useState(0);
  const [durationYears, setDurationYears] = useState(0);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const data = await getAllMedicines();
      setMedicines(data);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      toast({
        title: "Error",
        description: "Failed to load medicines",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMedicines = medicines?.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (medicine?: SavedMedicine) => {
    if (medicine) {
      setSelectedMedicine(medicine);
      setMedicineName(medicine.name);
      setMedicineType(medicine.type);
      setDosages(medicine.defaultDosage);
      setUsage(medicine.defaultUsage || "");
      setDurationDays(medicine.defaultDuration.days);
      setDurationMonths(medicine.defaultDuration.months);
      setDurationYears(medicine.defaultDuration.years);
    } else {
      setSelectedMedicine(null);
      setMedicineName("");
      setUsage("");
      setMedicineType("Tablet");
      setDosages([]);
      setDurationDays(0);
      setDurationMonths(0);
      setDurationYears(0);
    }
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (medicine: SavedMedicine) => {
    setSelectedMedicine(medicine);
    setIsDeleteDialogOpen(true);
  };

  const handleDosageChange = (timing: string, checked: boolean) => {
    if (checked) {
      // Add new dosage
      setDosages([
        ...dosages,
        {
          time: timing,
          quantity: "1",
          instructions: "After Meal",
        },
      ]);
    } else {
      // Remove dosage
      setDosages(dosages?.filter((d) => d.time !== timing));
    }
  };

  const handleDosageDetailChange = (
    timing: string,
    field: keyof Dosage,
    value: string
  ) => {
    setDosages(
      dosages?.map((d) => {
        if (d.time === timing) {
          return { ...d, [field]: value };
        }
        return d;
      })
    );
  };

  const handleSubmit = async () => {
    // Validate form
    if (!medicineName.trim()) {
      toast({
        title: "Error",
        description: "Medicine name is required",
        variant: "destructive",
      });
      return;
    }

    if (dosages.length === 0) {
      toast({
        title: "Error",
        description: "At least one dosage timing is required",
        variant: "destructive",
      });
      return;
    }

    const totalDuration = durationDays + durationMonths + durationYears;
    if (totalDuration === 0) {
      toast({
        title: "Error",
        description: "Duration is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const medicineData = {
        name: medicineName,
        type: medicineType,
        defaultDosage: dosages,
        defaultUsage: usage,
        defaultDuration: {
          days: durationDays,
          months: durationMonths,
          years: durationYears,
        },
      };

      if (selectedMedicine) {
        // Update existing medicine
        await import("@/lib/realtime-database-service-medicines").then(
          (module) => {
            return module.updateMedicine(selectedMedicine.id, medicineData);
          }
        );
        toast({
          title: "Success",
          description: "Medicine updated successfully",
        });
      } else {
        // Create new medicine
        await import("@/lib/realtime-database-service-medicines").then(
          (module) => {
            return module.createMedicine(medicineData);
          }
        );
        toast({
          title: "Success",
          description: "Medicine added successfully",
        });
      }

      // Refresh medicines list
      fetchMedicines();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving medicine:", error);
      toast({
        title: "Error",
        description: selectedMedicine
          ? "Failed to update medicine"
          : "Failed to add medicine",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMedicine) return;

    try {
      await deleteMedicine(selectedMedicine.id);
      toast({
        title: "Success",
        description: "Medicine deleted successfully",
      });
      fetchMedicines();
    } catch (error) {
      console.error("Error deleting medicine:", error);
      toast({
        title: "Error",
        description: "Failed to delete medicine",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Medicines</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add New Medicine
        </Button>
      </div>

      <div className="flex items-center space-x-2 max-w-sm">
        <Input
          placeholder="Search medicines..."
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
      ) : filteredMedicines.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Dosage</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Duration
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Usage
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines?.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell className="font-medium">
                      {medicine.name}
                    </TableCell>
                    <TableCell>{medicine.type}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {medicine.defaultDosage
                        ?.map((d) => `${d.time}: ${d.quantity}`)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {medicine.defaultDuration.days > 0 &&
                        `${medicine.defaultDuration.days} days `}
                      {medicine.defaultDuration.months > 0 &&
                        `${medicine.defaultDuration.months} months `}
                      {medicine.defaultDuration.years > 0 &&
                        `${medicine.defaultDuration.years} years`}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {medicine.defaultUsage ? medicine.defaultUsage : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(medicine)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(medicine)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-10 border rounded-md bg-card">
          <p className="text-muted-foreground">No medicines found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => handleOpenDialog()}
          >
            Add your first medicine
          </Button>
        </div>
      )}

      {/* Add/Edit Medicine Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMedicine ? "Edit Medicine" : "Add New Medicine"}
            </DialogTitle>
            <DialogDescription>
              {selectedMedicine
                ? "Update the details of this medicine"
                : "Enter the details of the new medicine"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={medicineType} onValueChange={setMedicineType}>
                <SelectTrigger id="type" className="col-span-3">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usage" className="text-right">Usage</Label>
              <Input
                id="usage"
                value={usage}
                onChange={(e) => setUsage(e.target.value)}
                placeholder="Enter way to consume"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Dosage</Label>
              <div className="col-span-3 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {timings?.map((timing) => {
                    const isChecked = dosages?.some((d) => d.time === timing);
                    const dosage = dosages?.find((d) => d.time === timing);

                    return (
                      <div key={timing} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`timing-${timing}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleDosageChange(timing, checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`timing-${timing}`}
                            className="text-sm font-normal"
                          >
                            {timing}
                          </Label>
                        </div>

                        {isChecked && (
                          <div className="pl-6 space-y-2">
                            <div className="space-y-1">
                              <Label
                                htmlFor={`quantity-${timing}`}
                                className="text-xs"
                              >
                                Quantity
                              </Label>
                              <Input
                                id={`quantity-${timing}`}
                                value={dosage?.quantity || ""}
                                onChange={(e) =>
                                  handleDosageDetailChange(
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
                                htmlFor={`instructions-${timing}`}
                                className="text-xs"
                              >
                                Instructions
                              </Label>
                              <Select
                                value={dosage?.instructions || ""}
                                onValueChange={(value) =>
                                  handleDosageDetailChange(
                                    timing,
                                    "instructions",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger
                                  id={`instructions-${timing}`}
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
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Duration</Label>
              <div className="col-span-3 grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="days" className="text-sm">
                    Days
                  </Label>
                  <Input
                    id="days"
                    type="number"
                    min="0"
                    value={durationDays}
                    onChange={(e) =>
                      setDurationDays(Number.parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="months" className="text-sm">
                    Months
                  </Label>
                  <Input
                    id="months"
                    type="number"
                    min="0"
                    value={durationMonths}
                    onChange={(e) =>
                      setDurationMonths(Number.parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="years" className="text-sm">
                    Years
                  </Label>
                  <Input
                    id="years"
                    type="number"
                    min="0"
                    value={durationYears}
                    onChange={(e) =>
                      setDurationYears(Number.parseInt(e.target.value) || 0)
                    }
                  />
                </div>
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
                  {selectedMedicine ? "Updating..." : "Saving..."}
                </>
              ) : selectedMedicine ? (
                "Update Medicine"
              ) : (
                "Save Medicine"
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
              This will permanently delete the medicine "
              {selectedMedicine?.name}". This action cannot be undone.
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
